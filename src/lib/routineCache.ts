import { db, Routine } from './db';
import {
    fetchRoutines as fetchRoutinesRemote,
    createRoutine as createRoutineRemote,
    updateRoutine as updateRoutineRemote,
    deleteRoutine as deleteRoutineRemote,
    duplicateRoutine as duplicateRoutineRemote
} from './supabaseClient';

// Cache configuration
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 mins - data is considered fresh
const STALE_AFTER_MS = 24 * 60 * 60 * 1000; // 24 hours - must refetch even if cached

/**
 * Check if cached data is still fresh
 */
function isDataFresh(syncedAt?: string): boolean {
    if (!syncedAt) return false;
    const now = Date.now();
    const synced = new Date(syncedAt).getTime();
    return (now - synced) < CACHE_TTL_MS;
}

/**
 * Check if cached data is not stale
 */
function isDataStale(syncedAt?: string): boolean {
    if (!syncedAt) return false;
    const now = Date.now();
    const synced = new Date(syncedAt).getTime();
    return (now - synced) > STALE_AFTER_MS;
}

/**
 * Fetch routines - local first, then remote if needed
 */
export async function fetchRoutines(userId: string): Promise<Routine[]> {
    // 1. Try local DB first
    try {
        const localRoutines = await db.routines
            .where('userId')
            .equals(userId)
            .toArray();

        // 2. Check if we have fresh local data
        const hasFreshData = localRoutines.length > 0 && 
                           localRoutines.some(r => isDataFresh(r.syncedAt));

        const hasRecentData = localRoutines.length > 0 && 
                            !localRoutines.some(r => isDataStale(r.syncedAt));

        if (hasFreshData) {
            console.log('[Cache] Using fresh local routines');
            return localRoutines;
        }

        if (hasRecentData) {
            console.log('[Cache] Using local routines (may be slightly stale)');
            return localRoutines;
        }

        console.log('[Cache] No fresh local data, fetching from remote');
    } catch (localError) {
        console.warn('[Cache] Failed to read local DB:', localError);
    }

    // 3. Fetch from remote
    try {
        const remoteRoutines = await fetchRoutinesRemote(userId);
        console.log(`[Cache] Fetched ${remoteRoutines.length} routines from remote`);

        // 4. Sync to local DB
        for (const routine of remoteRoutines) {
            await db.routines.put({
                ...routine,
                syncedAt: new Date().toISOString()
            });
        }

        return remoteRoutines;
    } catch (remoteError) {
        console.error('[Cache] Failed to fetch from remote:', remoteError);

        // 5. Fallback to local data if remote fails
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

        // 6. Return empty if both failed
        return [];
    }
}

/**
 * Create routine - remote first, then local
 */
export async function createRoutine(routine: Omit<Routine, 'id' | 'created_at' | 'updated_at'>): Promise<Routine> {
    // 1. Create on remote
    const remoteRoutine = await createRoutineRemote(routine);
    console.log('[Cache] Created routine on remote:', remoteRoutine.id);

    // 2. Sync to local DB
    await db.routines.put({
        ...remoteRoutine,
        syncedAt: new Date().toISOString()
    });

    return remoteRoutine;
}

/**
 * Update routine - remote first, then local
 */
export async function updateRoutine(routine: Routine): Promise<Routine> {
    if (!routine.id) throw new Error('Routine ID is required for update');

    // 1. Update on remote
    const remoteRoutine = await updateRoutineRemote(routine);
    console.log('[Cache] Updated routine on remote:', routine.id);

    // 2. Sync to local DB
    await db.routines.put({
        ...remoteRoutine,
        syncedAt: new Date().toISOString()
    });

    return remoteRoutine;
}

/**
 * Delete routine - remote first, then local
 */
export async function deleteRoutine(routineId: string): Promise<void> {
    // 1. Delete from remote
    await deleteRoutineRemote(routineId);
    console.log('[Cache] Deleted routine from remote:', routineId);

    // 2. Delete from local DB
    await db.routines.delete(routineId);
}

/**
 * Duplicate routine - uses createRoutine which handles sync
 */
export async function duplicateRoutine(routineId: string, userId: string, localUserId: number): Promise<Routine> {
    // Note: This fetches from cache first which improves speed
    const routines = await fetchRoutines(userId);
    const original = routines.find(r => r.id === routineId);

    if (!original) {
        throw new Error('Routine not found');
    }

    const copy: Omit<Routine, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        local_user_id: localUserId,
        name: `${original.name} (Copy)`,
        description: original.description,
        exercises: original.exercises.map(ex => ({ ...ex })),
    };

    return await createRoutine(copy);
}

/**
 * Force refresh all routines from remote
 */
export async function refreshRoutines(userId: string): Promise<Routine[]> {
    console.log('[Cache] Force refresh from remote');
    
    try {
        const remoteRoutines = await fetchRoutinesRemote(userId);
        
        // Update local DB
        for (const routine of remoteRoutines) {
            await db.routines.put({
                ...routine,
                syncedAt: new Date().toISOString()
            });
        }
        
        return remoteRoutines;
    } catch (error) {
        console.error('[Cache] Force refresh failed:', error);
        throw error;
    }
}