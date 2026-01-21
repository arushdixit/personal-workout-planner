import { db, Routine } from './db';
import {
    fetchRoutines as fetchRoutinesRemote,
    createRoutine as createRoutineRemote,
    updateRoutine as updateRoutineRemote,
    deleteRoutine as deleteRoutineRemote,
    duplicateRoutine as duplicateRoutineRemote
} from './supabaseClient';
import { addToSyncQueue, getPendingCount } from './syncQueue';
import { processSyncQueue } from './syncManager';

const CACHE_TTL_MS = 5 * 60 * 1000;
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

function isDataFresh(syncedAt?: string): boolean {
    if (!syncedAt) return false;
    const now = Date.now();
    const synced = new Date(syncedAt).getTime();
    return (now - synced) < CACHE_TTL_MS;
}

function isDataStale(syncedAt?: string): boolean {
    if (!syncedAt) return false;
    const now = Date.now();
    const synced = new Date(syncedAt).getTime();
    return (now - synced) > STALE_AFTER_MS;
}

export async function fetchRoutines(userId: string, immediate = false): Promise<Routine[]> {
    try {
        const localRoutines = await db.routines
            .where('userId')
            .equals(userId)
            .toArray();

        const hasFreshData = localRoutines.length > 0 && 
                           localRoutines.some(r => isDataFresh(r.syncedAt));

        const hasRecentData = localRoutines.length > 0 && 
                            !localRoutines.some(r => isDataStale(r.syncedAt));

        if (hasFreshData && !immediate) {
            console.log('[Cache] Using fresh local routines');
            return localRoutines;
        }

        if (hasRecentData && !immediate) {
            console.log('[Cache] Using local routines (may be slightly stale)');
            fetchAndSyncRoutines(userId);
            return localRoutines;
        }

        if (immediate || localRoutines.length === 0) {
            console.log('[Cache] Fetching from remote immediately');
            return await fetchAndSyncRoutines(userId);
        }

        console.log('[Cache] No fresh local data, fetching from remote');
        fetchAndSyncRoutines(userId);
    } catch (localError) {
        console.warn('[Cache] Failed to read local DB:', localError);
    }

    try {
        return await fetchAndSyncRoutines(userId);
    } catch (remoteError) {
        console.error('[Cache] Failed to fetch from remote:', remoteError);

        try {
            const fallbackRoutines = await db.routines
                .where('userId')
                .equals(userId)
                .toArray();
            if (fallbackRoutines.length > 0) {
                console.warn('[Cache] Using stale local data as fallback');
                return fallbackRoutines;
            }
        } catch (fallbackError) {
            console.error('[Cache] Fallback also failed:', fallbackError);
        }

        return [];
    }
}

async function fetchAndSyncRoutines(userId: string): Promise<Routine[]> {
    const remoteRoutines = await fetchRoutinesRemote(userId);
    console.log(`[Cache] Fetched ${remoteRoutines.length} routines from remote`);

    for (const routine of remoteRoutines) {
        await db.routines.put({
            id: routine.id,
            userId: routine.user_id,
            localUserId: routine.local_user_id,
            name: routine.name,
            description: routine.description,
            exercises: routine.exercises,
            createdAt: routine.created_at || new Date().toISOString(),
            updatedAt: routine.updated_at || new Date().toISOString(),
            syncedAt: new Date().toISOString(),
        });
    }

    return remoteRoutines;
}

export async function createRoutineOptimistic(
    routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string,
    localUserId: number
): Promise<{ localId: string; routine: Routine }> {
    const now = new Date().toISOString();
    const tempId = `temp-${Date.now()}`;
    const newRoutine: Routine = {
        ...routine,
        id: tempId,
        userId,
        localUserId,
        createdAt: now,
        updatedAt: now,
        syncedAt: undefined,
    };

    await db.routines.add(newRoutine);

    try {
        const remoteRoutine = await createRoutineRemote({
            user_id: userId,
            local_user_id: localUserId,
            name: routine.name,
            description: routine.description,
            exercises: routine.exercises,
        });

        await db.routines.delete(tempId);
        await db.routines.add({
            ...remoteRoutine,
            userId: remoteRoutine.user_id,
            localUserId: remoteRoutine.local_user_id,
            createdAt: remoteRoutine.created_at || now,
            updatedAt: remoteRoutine.updated_at || now,
            syncedAt: new Date().toISOString(),
        });

        return { localId: remoteRoutine.id, routine: { ...remoteRoutine, userId: remoteRoutine.user_id, localUserId: remoteRoutine.local_user_id, createdAt: remoteRoutine.created_at || now, updatedAt: remoteRoutine.updated_at || now } as Routine };
    } catch (error) {
        console.error('[Cache] Failed to create routine remotely, queuing for sync:', error);
        await addToSyncQueue('create', 'routine', tempId, { ...newRoutine, userId, localUserId });
        return { localId: tempId, routine: newRoutine };
    }
}

export async function createRoutine(routine: Omit<Routine, 'id' | 'created_at' | 'updated_at'>): Promise<Routine> {
    const remoteRoutine = await createRoutineRemote(routine);
    console.log('[Cache] Created routine on remote:', remoteRoutine.id);

    await db.routines.put({
        id: remoteRoutine.id,
        userId: remoteRoutine.user_id,
        localUserId: remoteRoutine.local_user_id,
        name: remoteRoutine.name,
        description: remoteRoutine.description,
        exercises: remoteRoutine.exercises,
        createdAt: remoteRoutine.created_at || new Date().toISOString(),
        updatedAt: remoteRoutine.updated_at || new Date().toISOString(),
        syncedAt: new Date().toISOString(),
    });

    processSyncQueue();

    return { ...remoteRoutine, userId: remoteRoutine.user_id, localUserId: remoteRoutine.local_user_id, createdAt: remoteRoutine.created_at || new Date().toISOString(), updatedAt: remoteRoutine.updated_at || new Date().toISOString() } as Routine;
}

export async function updateRoutineOptimistic(routine: Routine): Promise<Routine> {
    const updatedRoutine: Routine = {
        ...routine,
        updatedAt: new Date().toISOString(),
    };

    await db.routines.put(updatedRoutine);

    try {
        await updateRoutineRemote({
            user_id: routine.userId,
            local_user_id: routine.localUserId,
            name: routine.name,
            description: routine.description,
            exercises: routine.exercises,
            id: routine.id,
            created_at: routine.createdAt,
            updated_at: updatedRoutine.updatedAt,
        });

        await db.routines.update(routine.id!, { syncedAt: new Date().toISOString() });
        return updatedRoutine;
    } catch (error) {
        console.error('[Cache] Failed to update routine remotely, queuing for sync:', error);
        await addToSyncQueue('update', 'routine', routine.id!, updatedRoutine);
        return updatedRoutine;
    }
}

export async function updateRoutine(routine: Routine): Promise<Routine> {
    if (!routine.id) throw new Error('Routine ID is required for update');

    const remoteRoutine = await updateRoutineRemote(routine);
    console.log('[Cache] Updated routine on remote:', routine.id);

    await db.routines.put({
        id: remoteRoutine.id,
        userId: remoteRoutine.user_id,
        localUserId: remoteRoutine.local_user_id,
        name: remoteRoutine.name,
        description: remoteRoutine.description,
        exercises: remoteRoutine.exercises,
        createdAt: remoteRoutine.created_at || routine.createdAt,
        updatedAt: remoteRoutine.updated_at || routine.updatedAt,
        syncedAt: new Date().toISOString(),
    });

    processSyncQueue();

    return { ...remoteRoutine, userId: remoteRoutine.user_id, localUserId: remoteRoutine.local_user_id, createdAt: remoteRoutine.created_at || routine.createdAt, updatedAt: remoteRoutine.updated_at || routine.updatedAt } as Routine;
}

export async function deleteRoutineOptimistic(routineId: string): Promise<void> {
    const routine = await db.routines.get(routineId);
    if (!routine) {
        await deleteRoutine(routineId);
        return;
    }

    await db.routines.delete(routineId);

    try {
        await deleteRoutineRemote(routineId);
        console.log('[Cache] Deleted routine from remote:', routineId);
    } catch (error) {
        console.error('[Cache] Failed to delete routine remotely, queuing for sync:', error);
        await addToSyncQueue('delete', 'routine', routineId, { ...routine });
    }
}

export async function deleteRoutine(routineId: string): Promise<void> {
    await deleteRoutineRemote(routineId);
    console.log('[Cache] Deleted routine from remote:', routineId);
    await db.routines.delete(routineId);
}

export async function duplicateRoutine(routineId: string, userId: string, localUserId: number): Promise<Routine> {
    const routines = await fetchRoutines(userId);
    const original = routines.find(r => r.id === routineId);

    if (!original) {
        throw new Error('Routine not found');
    }

    const copy: Omit<Routine, 'id' | 'created_at' | 'updated_at'> = {
        userId,
        localUserId,
        name: `${original.name} (Copy)`,
        description: original.description,
        exercises: original.exercises.map(ex => ({ ...ex })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    return await createRoutineOptimistic(copy, userId, localUserId).then(result => result.routine);
}

export async function refreshRoutines(userId: string): Promise<Routine[]> {
    console.log('[Cache] Force refresh from remote');
    
    try {
        const remoteRoutines = await fetchRoutinesRemote(userId);
        
        for (const routine of remoteRoutines) {
            await db.routines.put({
                id: routine.id,
                userId: routine.user_id,
                localUserId: routine.local_user_id,
                name: routine.name,
                description: routine.description,
                exercises: routine.exercises,
                createdAt: routine.created_at || new Date().toISOString(),
                updatedAt: routine.updated_at || new Date().toISOString(),
                syncedAt: new Date().toISOString(),
            });
        }
        
        return remoteRoutines;
    } catch (error) {
        console.error('[Cache] Force refresh failed:', error);
        throw error;
    }
}

export async function getCacheStatus(userId: string): Promise<{
    isFresh: boolean;
    isStale: boolean;
    pendingSync: number;
    lastSynced?: string;
}> {
    const localRoutines = await db.routines
        .where('userId')
        .equals(userId)
        .toArray();

    const latestSynced = localRoutines.length > 0
        ? localRoutines.reduce((latest, r) => {
            const syncedAt = r.syncedAt ? new Date(r.syncedAt).getTime() : 0;
            return syncedAt > latest ? syncedAt : latest;
        }, 0)
        : 0;

    const isFresh = latestSynced > 0 && (Date.now() - latestSynced) < CACHE_TTL_MS;
    const isStale = latestSynced > 0 && (Date.now() - latestSynced) > STALE_AFTER_MS;
    const pendingSync = await getPendingCount();

    return {
        isFresh,
        isStale,
        pendingSync,
        lastSynced: latestSynced > 0 ? new Date(latestSynced).toISOString() : undefined,
    };
}
