/**
 * Debugging utilities for ProLifts sync system
 * 
 * Usage: Open browser console and run these commands
 */

import { db } from './db';
import { getPendingOperations, getPendingCount } from './syncQueue';
import { processWorkoutSyncQueue } from './workoutSyncManager';
import { findDuplicateExercises, removeDuplicateExercises } from './checkDuplicates';

// Make utilities available globally for debugging
declare global {
    interface Window {
        debugSync: {
            checkQueue: () => Promise<void>;
            checkSessions: () => Promise<void>;
            forceSyncNow: () => Promise<void>;
            clearFailedOps: () => Promise<void>;
            showLastSession: () => Promise<void>;
            findDuplicates: () => Promise<any>;
            removeDuplicates: () => Promise<any>;
        };
    }
}

async function checkQueue() {
    console.group('📋 Sync Queue Status');

    const pending = await getPendingCount();
    console.log(`Total pending operations: ${pending}`);

    const operations = await getPendingOperations();
    console.table(operations.map(op => ({
        id: op.id,
        type: op.type,
        entity: op.entityType,
        status: op.status,
        attempts: op.attempts,
        created: new Date(op.createdAt).toLocaleTimeString(),
    })));

    console.groupEnd();
}

async function checkSessions() {
    console.group('💪 Workout Sessions');

    const sessions = await db.workout_sessions.toArray();
    console.log(`Total sessions: ${sessions.length}`);

    sessions.forEach(session => {
        console.group(`Session ${session.id} - ${session.routineName}`);
        console.log('Local ID:', session.id);
        console.log('Remote ID:', session.remoteId || '❌ Not synced');
        console.log('UUID:', session.uuid);
        console.log('Status:', session.status);
        console.log('Synced At:', session.syncedAt || '❌ Never');
        console.log('Exercises:', session.exercises.length);

        session.exercises.forEach((ex, idx) => {
            console.log(`  ${idx + 1}. ${ex.exerciseName}`);
            console.log(`     Note: ${ex.personalNote || '(none)'}`);
            console.log(`     Sets: ${ex.sets.length}`);
        });

        console.groupEnd();
    });

    console.groupEnd();
}

async function forceSyncNow() {
    console.log('🔄 Forcing sync now...');
    try {
        await processWorkoutSyncQueue();
        console.log('✅ Sync completed');
        await checkQueue();
    } catch (error) {
        console.error('❌ Sync failed:', error);
    }
}

async function clearFailedOps() {
    console.log('🗑️ Clearing failed operations...');
    const deleted = await db.syncQueue
        .where('status')
        .equals('failed')
        .delete();
    console.log(`✅ Deleted ${deleted} failed operations`);
    await checkQueue();
}

async function showLastSession() {
    console.group('🔍 Last Workout Session Details');

    const sessions = await db.workout_sessions
        .orderBy('id')
        .reverse()
        .limit(1)
        .toArray();

    if (sessions.length === 0) {
        console.log('No sessions found');
        console.groupEnd();
        return;
    }

    const session = sessions[0];
    console.log('Full session object:', session);

    console.groupEnd();
}

// Initialize debug utilities
if (typeof window !== 'undefined') {
    window.debugSync = {
        checkQueue,
        checkSessions,
        forceSyncNow,
        clearFailedOps,
        showLastSession,
        findDuplicates: async () => await findDuplicateExercises(),
        removeDuplicates: async () => await removeDuplicateExercises(),
    };

    console.log('🔧 ProLifts Debug Utilities Loaded');
    console.log('Available commands:');
    console.log('  debugSync.checkQueue()        - Show sync queue status');
    console.log('  debugSync.checkSessions()     - Show all workout sessions');
    console.log('  debugSync.forceSyncNow()      - Force sync immediately');
    console.log('  debugSync.clearFailedOps()    - Clear failed sync operations');
    console.log('  debugSync.showLastSession()   - Show details of last session');
    console.log('  debugSync.findDuplicates()    - Find duplicate exercises');
    console.log('  debugSync.removeDuplicates()  - Remove duplicate exercises (keeps best)');
}

export { };
