import {
    fetchRoutines as fetchRoutinesRemote,
    createRoutine as createRoutineRemote,
    updateRoutine as updateRoutineRemote,
    deleteRoutine as deleteRoutineRemote,
    upsertUserExercise as upsertExerciseRemote,
} from './supabaseClient';
import { db, Routine } from './db';
import {
    getPendingOperations,
    updateOperationStatus,
    removeOperation,
    canRetryImmediately,
    QueuedOperation,
} from './syncQueue';
import { processWorkoutSyncQueue } from './workoutSyncManager';
import { toast } from 'sonner';

let isProcessing = false;

export async function processSyncQueue(): Promise<void> {
    if (isProcessing) {
        console.log('[SyncManager] Already processing, skipping');
        return;
    }

    isProcessing = true;
    console.log('[SyncManager] Processing sync queue...');

    try {
        const operations = await getPendingOperations();
        const syncOps = operations.filter(op => op.entityType === 'routine' || op.entityType === 'exercise');

        if (syncOps.length === 0) {
            console.log('[SyncManager] No routine or exercise operations to process');
            return;
        }

        console.log(`[SyncManager] Processing ${syncOps.length} operations`);

        for (const operation of syncOps) {
            if (!canRetryImmediately(operation)) {
                continue;
            }

            try {
                console.log(`[SyncManager] Processing ${operation.entityType} ${operation.type}:${operation.entityId}`);

                if (operation.entityType === 'routine') {
                    await processRoutineOperation(operation);
                } else if (operation.entityType === 'exercise') {
                    await processExerciseOperation(operation);
                }
            } catch (error) {
                console.error(`[SyncManager] Failed to process operation ${operation.id}:`, error);

                const newAttempts = operation.attempts + 1;
                const newStatus = newAttempts >= 5 ? 'failed' : 'retrying';

                await updateOperationStatus(operation.id, newStatus, newAttempts);

                if (newStatus === 'failed') {
                    toast.error(`Failed to sync routine: ${operation.data.name || operation.entityId}`);
                }
            }
        }
    } finally {
        isProcessing = false;
    }
}

async function processRoutineOperation(operation: QueuedOperation): Promise<void> {
    switch (operation.type) {
        case 'create':
            await processCreateRoutine(operation);
            break;
        case 'update':
            await processUpdateRoutine(operation);
            break;
        case 'delete':
            await processDeleteRoutine(operation);
            break;
    }
}

async function processExerciseOperation(operation: QueuedOperation): Promise<void> {
    if (operation.entityType !== 'exercise') return;

    // Use name as the primary key for user_exercises sync to handle library cross-device
    const exerciseData = operation.data as any;

    try {
        await upsertExerciseRemote({
            user_id: exerciseData.userId,
            exercise_id_local: Number(operation.entityId),
            name: exerciseData.name,
            personal_notes: exerciseData.personalNotes,
            equipment: exerciseData.equipment,
            primary_muscles: exerciseData.primaryMuscles,
            secondary_muscles: exerciseData.secondaryMuscles,
            source: exerciseData.source,
        });

        await removeOperation(operation.id);
        console.log('[SyncManager] Successfully synced exercise data:', exerciseData.name);
    } catch (error) {
        console.error('[SyncManager] Failed to sync exercise:', error);
        throw error;
    }
}

async function processCreateRoutine(operation: QueuedOperation): Promise<void> {
    if (!operation.id) return;

    const routineData = operation.data as Omit<Routine, 'id'>;

    try {
        const remoteRoutine = await createRoutineRemote({
            user_id: routineData.userId,
            local_user_id: routineData.localUserId,
            name: routineData.name,
            description: routineData.description,
            exercises: routineData.exercises,
        });

        await db.routines.update(operation.entityId, {
            id: remoteRoutine.id,
            syncedAt: new Date().toISOString(),
        });

        await removeOperation(operation.id);
        console.log('[SyncManager] Successfully synced created routine:', remoteRoutine.id);
    } catch (error) {
        console.error('[SyncManager] Failed to create routine remotely:', error);
        throw error;
    }
}

async function processUpdateRoutine(operation: QueuedOperation): Promise<void> {
    if (!operation.id) return;

    const localRoutine = await db.routines.get(operation.entityId);
    if (!localRoutine) {
        console.warn('[SyncManager] Local routine not found, removing from queue:', operation.entityId);
        await removeOperation(operation.id);
        return;
    }

    try {
        await updateRoutineRemote({
            user_id: localRoutine.userId,
            local_user_id: localRoutine.localUserId,
            name: localRoutine.name,
            description: localRoutine.description,
            exercises: localRoutine.exercises,
            id: localRoutine.id,
            created_at: localRoutine.createdAt,
            updated_at: localRoutine.updatedAt,
        });

        await db.routines.update(operation.entityId, {
            syncedAt: new Date().toISOString(),
        });

        await removeOperation(operation.id);
        console.log('[SyncManager] Successfully synced updated routine:', operation.entityId);
    } catch (error) {
        console.error('[SyncManager] Failed to update routine remotely:', error);
        throw error;
    }
}

async function processDeleteRoutine(operation: QueuedOperation): Promise<void> {
    if (!operation.id) return;

    try {
        await deleteRoutineRemote(operation.entityId);
        await removeOperation(operation.id);
        console.log('[SyncManager] Successfully synced deleted routine:', operation.entityId);
    } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
            console.log('[SyncManager] Routine already deleted on remote, removing from queue:', operation.entityId);
            await removeOperation(operation.id);
            return;
        }
        console.error('[SyncManager] Failed to delete routine remotely:', error);
        throw error;
    }
}

export async function triggerImmediateSync(): Promise<void> {
    await Promise.all([
        processSyncQueue(),
        processWorkoutSyncQueue(),
    ]);
}
