import { db, WorkoutSession } from './db';
import {
    createWorkoutSession as createRemoteSession,
    completeWorkout as completeRemoteWorkout,
    abandonWorkout as abandonRemoteWorkout,
    updateSessionSet as updateRemoteSet,
    addSessionSet as addRemoteSet,
    updateSessionExercise as updateRemoteExerciseNote,
    fetchAllWorkoutSessionsWithDetails,
} from './supabaseWorkoutClient';
import { addToSyncQueue, updateOperationStatus, removeOperation, getPendingOperations, type QueuedOperation, type SyncType, type EntityType } from './syncQueue';

let isProcessing = false;

export async function pullWorkoutSessions(supabaseUserId: string, localUserId: number): Promise<void> {
    try {
        console.log(`[WorkoutSync] Pulling sessions for user ${supabaseUserId} (Local: ${localUserId})...`);
        const remoteSessions = await fetchAllWorkoutSessionsWithDetails(supabaseUserId);

        // Load all existing local sessions for this user to map remoteId -> localId
        const localSessions = await db.workout_sessions
            .where('supabaseUserId')
            .equals(supabaseUserId)
            .toArray();

        // Create lookup maps for robust matching
        const remoteToLocalIdMap = new Map<number, number>();
        const compositeToLocalIdMap = new Map<string, number>();

        localSessions.forEach(s => {
            if (s.id === undefined) return;

            // Map by remoteId if available (using != null to catch both null and undefined)
            if (s.remoteId != null) {
                remoteToLocalIdMap.set(s.remoteId, s.id);
            }

            // Also map by a unique composite key (date + startTime + routineId)
            // this helps match sessions that were just created locally and don't have a remoteId yet
            const key = `${s.date}_${s.startTime}_${s.routineId}`;
            compositeToLocalIdMap.set(key, s.id);
        });

        // Load pending sync operations to avoid overwriting items with unsynced local changes
        const pendingOps = await getPendingOperations();
        const pendingLocalIds = new Set(
            pendingOps
                .filter(op => op.entityType === 'workout_session' || op.entityType === 'workout_set')
                .map(op => Number(op.entityId))
        );

        const sessionsToUpsert: any[] = [];
        let skippedCount = 0;
        let updateCount = 0;
        let createCount = 0;

        for (const remoteSession of remoteSessions) {
            // Priority matching: 1. Remote ID, 2. Composite key
            const compositeKey = `${remoteSession.date}_${remoteSession.start_time}_${remoteSession.routine_id}`;
            const localId = remoteToLocalIdMap.get(remoteSession.id) || compositeToLocalIdMap.get(compositeKey);

            // If we have a local record and it has pending changes, skip updating it from remote
            if (localId && pendingLocalIds.has(localId)) {
                console.log(`[WorkoutSync] Skipping update for session ${remoteSession.id} (local ID ${localId} has pending changes)`);
                skippedCount++;
                continue;
            }

            if (localId) updateCount++; else createCount++;

            const sessionExercises = remoteSession.session_exercises || [];
            let totalSetsInSession = 0;
            let completedSetsInSession = 0;

            const mappedExercises = sessionExercises.map((ex: any) => {
                const sets = ex.session_sets || [];
                const mappedSets = sets.map((s: any) => {
                    const isCompleted = !!s.completed;
                    if (isCompleted) completedSetsInSession++;
                    totalSetsInSession++;
                    return {
                        id: s.id,
                        setNumber: s.set_number,
                        reps: Number(s.reps) || 0,
                        weight: Number(s.weight) || 0,
                        unit: s.unit || 'kg',
                        completed: isCompleted,
                        completedAt: s.completed_at || undefined,
                    };
                });

                return {
                    exerciseId: ex.exercise_id,
                    exerciseName: ex.exercise_name,
                    order: ex.exercise_order,
                    personalNote: ex.personal_note || undefined,
                    restSeconds: ex.rest_seconds || 90,
                    sets: mappedSets,
                };
            });

            if (mappedExercises.length > 0) {
                console.log(`[WorkoutSync] Session ${remoteSession.id}: ${mappedExercises.length} exercises, ${totalSetsInSession} sets (${completedSetsInSession} completed)`);
            }

            sessionsToUpsert.push({
                ...(localId ? { id: localId } : {}),
                remoteId: remoteSession.id,
                userId: localUserId,
                supabaseUserId: supabaseUserId,
                routineId: remoteSession.routine_id,
                routineName: remoteSession.routine_name,
                date: remoteSession.date,
                startTime: remoteSession.start_time,
                endTime: remoteSession.end_time || undefined,
                duration: remoteSession.duration_seconds || undefined,
                status: (remoteSession.status as any) || 'completed',
                syncedAt: new Date().toISOString(),
                exercises: mappedExercises,
            });
        }

        if (sessionsToUpsert.length > 0) {
            await db.workout_sessions.bulkPut(sessionsToUpsert);
        }

        // Clean up: Delete local sessions that have a remoteId but are no longer on remote
        // (unless they have pending changes)
        const remoteIdsOnServer = new Set(remoteSessions.map(s => s.id));
        const sessionsToDelete = localSessions.filter(s =>
            s.remoteId != null &&
            !remoteIdsOnServer.has(s.remoteId) &&
            !pendingLocalIds.has(s.id!)
        );

        if (sessionsToDelete.length > 0) {
            console.log(`[WorkoutSync] Deleting ${sessionsToDelete.length} stale sessions removed from remote`);
            await db.workout_sessions.bulkDelete(sessionsToDelete.map(s => s.id!));
        }

        console.log(`[WorkoutSync] Sync summary: ${createCount} new, ${updateCount} updated, ${sessionsToDelete.length} deleted, ${skippedCount} skipped`);
    } catch (error) {
        console.error('[WorkoutSync] Failed to pull workout sessions:', error);
    }
}

export type WorkoutSyncType = 'create' | 'complete' | 'abandon' | 'set_complete' | 'set_update' | 'add_set' | 'exercise_note';

export async function processWorkoutSyncQueue(): Promise<void> {
    if (isProcessing) {
        console.log('[WorkoutSync] Already processing, skipping');
        return;
    }

    isProcessing = true;
    console.log('[WorkoutSync] Processing workout sync queue...');

    try {
        const operations = await getPendingOperations();

        const workoutOps = operations.filter(
            op => op.entityType === 'workout_session' || op.entityType === 'workout_set'
        );

        if (workoutOps.length === 0) {
            console.log('[WorkoutSync] No pending workout operations');
            return;
        }

        console.log(`[WorkoutSync] Processing ${workoutOps.length} workout operations`);

        for (const operation of workoutOps) {
            try {
                await processWorkoutOperation(operation);
            } catch (error) {
                console.error(`[WorkoutSync] Failed operation ${operation.id}:`, error);

                const newAttempts = operation.attempts + 1;
                const newStatus = newAttempts >= 5 ? 'failed' : 'retrying';

                await updateOperationStatus(operation.id, newStatus, newAttempts);
            }
        }
    } finally {
        isProcessing = false;
    }
}

async function processWorkoutOperation(operation: QueuedOperation): Promise<void> {
    const sessionData = operation.data as { session?: WorkoutSession; workoutOpType?: WorkoutSyncType;[key: string]: unknown };
    const workoutOpType = sessionData.workoutOpType;

    if (!workoutOpType) {
        console.warn('[WorkoutSync] No workout operation type in operation data');
        await removeOperation(operation.id!);
        return;
    }

    // Fetch the latest session data from the database to get updated remoteId
    // CRITICAL: operation.entityId is stored as a string in syncQueue, must convert to Number for IndexedDB
    const sessionId = Number(operation.entityId);
    const session = await db.workout_sessions.get(sessionId);

    if (!session) {
        // This is expected if the session was deleted locally (e.g., user abandoned and deleted)
        // We just clean up the orphaned sync operation
        console.log(`[WorkoutSync] Session ${sessionId} no longer exists, cleaning up ${workoutOpType} operation`);
        await removeOperation(operation.id!);
        return;
    }

    switch (workoutOpType) {
        case 'create':
            await processCreateSession(operation, session);
            break;
        case 'complete':
            await processCompleteSession(operation, session);
            break;
        case 'abandon':
            await processAbandonSession(operation, session);
            break;
        case 'set_complete':
            await processSetComplete(operation, session);
            break;
        case 'set_update':
            await processSetUpdate(operation, session);
            break;
        case 'add_set':
            await processAddSet(operation, session);
            break;
        case 'exercise_note':
            await processExerciseNote(operation, session);
            break;
        default:
            console.warn(`[WorkoutSync] Unknown workout operation type: ${workoutOpType}`);
    }
}

async function processCreateSession(operation: QueuedOperation, session: WorkoutSession): Promise<void> {
    try {
        const remoteSession = await createRemoteSession({
            user_id: session.supabaseUserId,
            routine_id: session.routineId,
            routine_name: session.routineName,
            date: session.date,
            start_time: session.startTime,
            exercises: session.exercises.map(ex => ({
                exercise_id: ex.exerciseId,
                exercise_name: ex.exerciseName,
                order: ex.order,
                sets: ex.sets.map(set => ({
                    set_number: set.setNumber,
                    reps: set.reps,
                    weight: set.weight,
                    unit: set.unit,
                })),
            })),
        });

        // Store the remote ID separately from the local ID
        await db.workout_sessions.update(Number(operation.entityId), {
            remoteId: remoteSession.id,
            syncedAt: new Date().toISOString(),
        });

        await removeOperation(operation.id!);
        console.log('[WorkoutSync] Successfully synced created session. Local ID:', operation.entityId, 'Remote ID:', remoteSession.id);
    } catch (error) {
        console.error('[WorkoutSync] Failed to create session remotely:', error);
        throw error;
    }
}

async function processCompleteSession(operation: QueuedOperation, session: WorkoutSession): Promise<void> {
    if (!session.remoteId) {
        console.warn('[WorkoutSync] Session has no remote ID yet, will retry after create completes');
        // Don't remove the operation - let it retry after the create operation completes
        throw new Error('Session not yet synced to server');
    }

    try {
        await completeRemoteWorkout(session.remoteId, new Date().toISOString());

        await db.workout_sessions.update(Number(operation.entityId), {
            syncedAt: new Date().toISOString(),
        });

        console.log('[WorkoutSync] Successfully synced completed session. Local ID:', operation.entityId, 'Remote ID:', session.remoteId);
    } catch (error) {
        console.error('[WorkoutSync] Failed to complete session remotely:', error);
        throw error;
    } finally {
        // Always remove the operation, even if session wasn't found remotely
        await removeOperation(operation.id!);
    }
}

async function processAbandonSession(operation: QueuedOperation, session: WorkoutSession): Promise<void> {
    if (!session.remoteId) {
        console.warn('[WorkoutSync] Session has no remote ID yet, will retry after create completes');
        // Don't remove the operation - let it retry after the create operation completes
        throw new Error('Session not yet synced to server');
    }

    try {
        await abandonRemoteWorkout(session.remoteId, new Date().toISOString());

        await db.workout_sessions.update(Number(operation.entityId), {
            syncedAt: new Date().toISOString(),
        });

        console.log('[WorkoutSync] Successfully synced abandoned session. Local ID:', operation.entityId, 'Remote ID:', session.remoteId);
    } catch (error) {
        console.error('[WorkoutSync] Failed to abandon session remotely:', error);
        throw error;
    } finally {
        // Always remove the operation, even if session wasn't found remotely
        await removeOperation(operation.id!);
    }
}

async function processSetComplete(operation: QueuedOperation, session: WorkoutSession): Promise<void> {
    if (!session.remoteId) {
        console.warn('[WorkoutSync] Session not yet synced to remote, will retry');
        throw new Error('Session not yet synced to server');
    }

    const setData = operation.data as { setId?: number; reps?: number; weight?: number };
    if (!setData.setId) {
        console.warn('[WorkoutSync] No set ID in operation');
        await removeOperation(operation.id!);
        return;
    }

    try {
        await updateRemoteSet(setData.setId, {
            reps: setData.reps || 0,
            weight: setData.weight || 0,
            completed: true,
            completed_at: new Date().toISOString(),
        });

        await removeOperation(operation.id!);
        console.log('[WorkoutSync] Successfully synced set complete');
    } catch (error) {
        console.error('[WorkoutSync] Failed to complete set remotely:', error);
        throw error;
    }
}

async function processSetUpdate(operation: QueuedOperation, session: WorkoutSession): Promise<void> {
    if (!session.remoteId) {
        console.warn('[WorkoutSync] Session not yet synced to remote, will retry');
        throw new Error('Session not yet synced to server');
    }

    const setData = operation.data as { setId?: number; updates?: Record<string, unknown> };
    if (!setData.setId || !setData.updates) {
        console.warn('[WorkoutSync] Missing set data in operation');
        await removeOperation(operation.id!);
        return;
    }

    try {
        await updateRemoteSet(setData.setId, setData.updates);

        await removeOperation(operation.id!);
        console.log('[WorkoutSync] Successfully synced set update');
    } catch (error) {
        console.error('[WorkoutSync] Failed to update set remotely:', error);
        throw error;
    }
}

async function processAddSet(operation: QueuedOperation, session: WorkoutSession): Promise<void> {
    if (!session.remoteId) {
        console.warn('[WorkoutSync] Session not yet synced to server — deferring add set');
        throw new Error('Session not yet synced to server');
    }

    const setData = operation.data as { sessionExerciseId?: number; setNumber?: number; unit?: 'kg' | 'lbs' };
    if (!setData.sessionExerciseId || !setData.setNumber) {
        console.warn('[WorkoutSync] Missing add set data');
        return;
    }

    try {
        await addRemoteSet(setData.sessionExerciseId, setData.setNumber, setData.unit || 'kg');

        await removeOperation(operation.id!);
        console.log('[WorkoutSync] Successfully synced add set');
    } catch (error) {
        console.error('[WorkoutSync] Failed to add set remotely:', error);
        throw error;
    }
}

async function processExerciseNote(operation: QueuedOperation, session: WorkoutSession): Promise<void> {
    if (!session.remoteId) {
        console.warn('[WorkoutSync] Session has no remote ID yet');
        throw new Error('Session not yet synced to server');
    }

    const noteData = operation.data as { exerciseOrder?: number; note?: string };
    if (noteData.exerciseOrder === undefined) {
        console.warn('[WorkoutSync] Missing exercise order for note update');
        await removeOperation(operation.id!);
        return;
    }

    try {
        await updateRemoteExerciseNote(session.remoteId, noteData.exerciseOrder, noteData.note);
        await removeOperation(operation.id!);
        console.log('[WorkoutSync] Successfully synced exercise note');
    } catch (error) {
        console.error('[WorkoutSync] Failed to sync exercise note:', error);
        throw error;
    }
}

export async function queueWorkoutOperation(
    type: WorkoutSyncType,
    sessionId: number,
    data?: Record<string, unknown>
): Promise<void> {
    const session = await db.workout_sessions.get(sessionId);
    if (!session) return;

    const syncType: SyncType = type === 'create' ? 'create' : 'update';
    const entityType: EntityType = (type === 'set_complete' || type === 'set_update' || type === 'add_set')
        ? 'workout_set'
        : 'workout_session';

    // IMPORTANT: Do NOT store the full session object in the queue — it causes massive IndexedDB bloat
    // (one full copy of all exercises+sets per set completion). The session is always re-fetched
    // from the DB at processing time via processWorkoutOperation.
    await addToSyncQueue(
        syncType,
        entityType,
        String(sessionId),
        { workoutOpType: type, ...data }
    );

    // Trigger sync in background immediately
    setTimeout(() => {
        processWorkoutSyncQueue().catch(err => console.error('[WorkoutSync] Background sync failed:', err));
    }, 0);
}

export async function syncWorkoutImmediately(sessionId: number): Promise<void> {
    await processWorkoutSyncQueue();
}
