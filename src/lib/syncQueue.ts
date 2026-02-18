import { db, SyncOperation } from './db';

export type SyncType = 'create' | 'update' | 'delete';
export type EntityType = 'routine' | 'workout' | 'exercise' | 'workout_session' | 'workout_set';

export interface QueuedOperation extends SyncOperation {
    id: number;
}

const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 5000; // 5 seconds between retries

export async function addToSyncQueue(
    type: SyncType,
    entityType: EntityType,
    entityId: string,
    data: Record<string, unknown>
): Promise<number> {
    const id = await db.syncQueue.add({
        type,
        entityType,
        entityId,
        data,
        attempts: 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
    });

    console.log('[SyncQueue] Added operation:', { id, type, entityType, entityId });
    return id;
}

export async function getPendingOperations(): Promise<QueuedOperation[]> {
    const operations = await db.syncQueue
        .where('status')
        .anyOf(['pending', 'retrying'])
        .sortBy('createdAt');
    return operations.filter((op): op is QueuedOperation => op.id !== undefined);
}

export async function getPendingCount(): Promise<number> {
    const pending = await db.syncQueue
        .where('status')
        .anyOf(['pending', 'retrying'])
        .count();
    return pending;
}

export async function getFailedOperations(): Promise<QueuedOperation[]> {
    const operations = await db.syncQueue
        .where('status')
        .equals('failed')
        .sortBy('createdAt');
    return operations.filter((op): op is QueuedOperation => op.id !== undefined);
}

export async function updateOperationStatus(
    operationId: number,
    status: 'pending' | 'retrying' | 'failed',
    attempts?: number
): Promise<void> {
    const update: Partial<SyncOperation> = { status };
    if (attempts !== undefined) {
        update.attempts = attempts;
        update.lastAttempt = new Date().toISOString();
    }
    await db.syncQueue.update(operationId, update);
}

export async function removeOperation(operationId: number): Promise<void> {
    await db.syncQueue.delete(operationId);
}

export function shouldRetry(operation: QueuedOperation): boolean {
    if (operation.status === 'failed') {
        return false;
    }
    if (operation.attempts >= MAX_RETRY_ATTEMPTS) {
        return false;
    }
    if (operation.lastAttempt) {
        const timeSinceLastAttempt = Date.now() - new Date(operation.lastAttempt).getTime();
        return timeSinceLastAttempt > RETRY_DELAY_MS;
    }
    return true;
}

export function canRetryImmediately(operation: QueuedOperation): boolean {
    if (operation.status === 'failed' || operation.attempts >= MAX_RETRY_ATTEMPTS) {
        return false;
    }
    // First attempt — always eligible
    if (!operation.lastAttempt) {
        return true;
    }
    // Subsequent attempts — check if enough time has passed
    const timeSinceLastAttempt = Date.now() - new Date(operation.lastAttempt).getTime();
    return timeSinceLastAttempt >= RETRY_DELAY_MS;
}

export async function clearFailedOperations(): Promise<number> {
    return await db.syncQueue
        .where('status')
        .equals('failed')
        .delete();
}
