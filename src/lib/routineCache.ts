import { db, LocalRoutine } from './db';
import {
    fetchRoutines as fetchRoutinesRemote,
    createRoutine as createRoutineRemote,
    updateRoutine as updateRoutineRemote,
    deleteRoutine as deleteRoutineRemote,
    RemoteRoutine,
} from './supabaseClient';
import { addToSyncQueue, getPendingCount, getPendingDeleteIds } from './syncQueue';

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

export async function fetchRoutines(userId: string, immediate = false): Promise<LocalRoutine[]> {
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
        return fetchAndSyncRoutines(userId);
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

async function fetchAndSyncRoutines(userId: string): Promise<LocalRoutine[]> {
    const remoteRoutines = await fetchRoutinesRemote(userId);
    console.log(`[Cache] Fetched ${remoteRoutines.length} routines from remote`);

    return await reconcileLocalRoutines(remoteRoutines);
}

/**
 * Reconciles local routines with remote data.
 * - Deletes local routines that are missing from remote (and not pending sync).
 * - Updates/Adds remote routines while respecting local pending deletions.
 */
async function reconcileLocalRoutines(remoteRoutines: RemoteRoutine[]): Promise<LocalRoutine[]> {
    const syncedAt = new Date().toISOString();
    const pendingDeletes = await getPendingDeleteIds('routine');
    const remoteIds = new Set(remoteRoutines.map(r => r.id));

    // 1. Map remote routines to local format, excluding those pending deletion locally
    const mappedRoutines: LocalRoutine[] = remoteRoutines
        .filter(r => !pendingDeletes.has(r.id!))
        .map(routine => ({
            id: routine.id,
            userId: routine.user_id,
            localUserId: routine.local_user_id,
            name: routine.name,
            description: routine.description,
            exercises: routine.exercises,
            createdAt: routine.created_at || syncedAt,
            updatedAt: routine.updated_at || syncedAt,
            syncedAt,
        }));

    // 2. Identify local routines that were deleted on remote
    // These are local routines that have been synced before, are NOT in the remote list,
    // and are NOT currently pending a local deletion
    const localRoutines = await db.routines.toArray();
    const idsToRemove = localRoutines
        .filter(r =>
            r.syncedAt &&
            !remoteIds.has(r.id!) &&
            !pendingDeletes.has(r.id!)
        )
        .map(r => r.id!);

    await db.transaction('rw', db.routines, async () => {
        if (idsToRemove.length > 0) {
            console.log(`[Cache] Found ${idsToRemove.length} routines missing from remote, removing locally`);
            await db.routines.bulkDelete(idsToRemove);
        }
        if (mappedRoutines.length > 0) {
            await db.routines.bulkPut(mappedRoutines);
        }
    });

    // Return the combined view: mapped remote ones + local-only ones that haven't synced yet
    const localOnly = localRoutines.filter(r => !r.syncedAt && !pendingDeletes.has(r.id!));
    return [...mappedRoutines, ...localOnly];
}

export async function createRoutineOptimistic(
    routine: Omit<LocalRoutine, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string,
    localUserId: number
): Promise<{ localId: string; routine: LocalRoutine }> {
    const now = new Date().toISOString();
    const tempId = `temp-${Date.now()}`;
    const newRoutine: LocalRoutine = {
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

        const finalRoutine: LocalRoutine = {
            id: remoteRoutine.id,
            userId: remoteRoutine.user_id,
            localUserId: remoteRoutine.local_user_id,
            name: remoteRoutine.name,
            description: remoteRoutine.description,
            exercises: remoteRoutine.exercises,
            createdAt: remoteRoutine.created_at || now,
            updatedAt: remoteRoutine.updated_at || now,
            syncedAt: new Date().toISOString(),
        };

        // Atomic swap: delete temp record and insert real one in a single transaction
        // This avoids the window where the routine temporarily doesn't exist
        await db.transaction('rw', db.routines, async () => {
            await db.routines.delete(tempId);
            await db.routines.add(finalRoutine);
        });

        return { localId: remoteRoutine.id, routine: finalRoutine };
    } catch (error) {
        console.error('[Cache] Failed to create routine remotely, queuing for sync:', error);
        await addToSyncQueue('create', 'routine', tempId, { ...newRoutine, userId, localUserId });
        return { localId: tempId, routine: newRoutine };
    }
}

export async function createRoutine(routine: Omit<LocalRoutine, 'id' | 'createdAt' | 'updatedAt'>): Promise<LocalRoutine> {
    const remoteRoutine = await createRoutineRemote({
        user_id: routine.userId,
        local_user_id: routine.localUserId,
        name: routine.name,
        description: routine.description,
        exercises: routine.exercises,
    });
    const now = new Date().toISOString();
    const saved: LocalRoutine = {
        id: remoteRoutine.id,
        userId: remoteRoutine.user_id,
        localUserId: remoteRoutine.local_user_id,
        name: remoteRoutine.name,
        description: remoteRoutine.description,
        exercises: remoteRoutine.exercises,
        createdAt: remoteRoutine.created_at || now,
        updatedAt: remoteRoutine.updated_at || now,
        syncedAt: now,
    };

    await db.routines.put(saved);
    return saved;
}

export async function updateRoutineOptimistic(routine: LocalRoutine): Promise<LocalRoutine> {
    const updatedRoutine: LocalRoutine = {
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
        const { syncedAt: _discard, ...routineForSync } = updatedRoutine;
        await addToSyncQueue('update', 'routine', routine.id!, routineForSync);
        return updatedRoutine;
    }
}

export async function updateRoutine(routine: LocalRoutine): Promise<LocalRoutine> {
    if (!routine.id) throw new Error('Routine ID is required for update');

    const remoteRoutine = await updateRoutineRemote({
        id: routine.id,
        user_id: routine.userId,
        local_user_id: routine.localUserId,
        name: routine.name,
        description: routine.description,
        exercises: routine.exercises,
        created_at: routine.createdAt,
        updated_at: routine.updatedAt,
    });

    const saved: LocalRoutine = {
        id: remoteRoutine.id,
        userId: remoteRoutine.user_id,
        localUserId: remoteRoutine.local_user_id,
        name: remoteRoutine.name,
        description: remoteRoutine.description,
        exercises: remoteRoutine.exercises,
        createdAt: remoteRoutine.created_at || routine.createdAt,
        updatedAt: remoteRoutine.updated_at || routine.updatedAt,
        syncedAt: new Date().toISOString(),
    };

    await db.routines.put(saved);
    return saved;
}

export async function deleteRoutineOptimistic(routineId: string): Promise<void> {
    const routine = await db.routines.get(routineId);
    if (!routine) {
        // Not in local DB — just delete remotely if possible
        await deleteRoutineRemote(routineId).catch(err =>
            console.warn('[Cache] Could not delete non-local routine remotely:', err)
        );
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


export async function duplicateRoutine(routineId: string, userId: string, localUserId: number): Promise<LocalRoutine> {
    // Direct DB lookup instead of fetching all routines
    const original = await db.routines.get(routineId);

    if (!original) {
        throw new Error('Routine not found');
    }

    const copy: Omit<LocalRoutine, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        localUserId,
        name: `${original.name} (Copy)`,
        description: original.description,
        exercises: original.exercises.map(ex => ({ ...ex })),
    };

    return await createRoutineOptimistic(copy, userId, localUserId).then(result => result.routine);
}

export async function refreshRoutines(userId: string): Promise<LocalRoutine[]> {
    console.log('[Cache] Force refresh from remote');

    try {
        const remoteRoutines = await fetchRoutinesRemote(userId);
        return await reconcileLocalRoutines(remoteRoutines);
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
