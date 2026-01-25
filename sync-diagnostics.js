/**
 * Sync Diagnostics - Paste this into browser console to debug sync issues
 * 
 * This will show you:
 * - All workout sessions in the database
 * - All pending sync operations
 * - Any mismatches between sessions and operations
 */

(async function runSyncDiagnostics() {
    const { db } = await import('/src/lib/db.ts');

    console.log('\n=== SYNC DIAGNOSTICS ===\n');

    // Get all workout sessions
    const sessions = await db.workout_sessions.toArray();
    console.log(`📊 Total workout sessions: ${sessions.length}`);

    if (sessions.length > 0) {
        console.log('\n--- Workout Sessions ---');
        console.table(sessions.map(s => ({
            localId: s.id,
            remoteId: s.remoteId || 'NOT SYNCED',
            status: s.status,
            routine: s.routineName,
            date: s.date,
            hasSyncedAt: s.syncedAt ? 'YES' : 'NO'
        })));
    }

    // Get all sync operations
    const allOps = await db.syncQueue.toArray();
    const workoutOps = allOps.filter(op =>
        op.entityType === 'workout_session' || op.entityType === 'workout_set'
    );

    console.log(`\n📋 Total sync operations: ${allOps.length}`);
    console.log(`💪 Workout-related operations: ${workoutOps.length}`);

    if (workoutOps.length > 0) {
        console.log('\n--- Workout Sync Operations ---');
        console.table(workoutOps.map(op => ({
            opId: op.id,
            type: op.data?.workoutOpType || op.type,
            sessionId: op.entityId,
            status: op.status,
            attempts: op.attempts,
            created: new Date(op.createdAt).toLocaleString()
        })));
    }

    // Check for orphaned operations (operations for sessions that don't exist)
    const orphanedOps = workoutOps.filter(op => {
        const sessionId = parseInt(op.entityId);
        return !sessions.some(s => s.id === sessionId);
    });

    if (orphanedOps.length > 0) {
        console.log(`\n⚠️  Found ${orphanedOps.length} orphaned operations (sessions don't exist):`);
        console.table(orphanedOps.map(op => ({
            opId: op.id,
            type: op.data?.workoutOpType || op.type,
            sessionId: op.entityId,
            status: op.status
        })));
        console.log('These will be cleaned up automatically on next sync.');
    }

    // Check for sessions without remoteId
    const unsyncedSessions = sessions.filter(s => !s.remoteId && s.status !== 'in_progress');
    if (unsyncedSessions.length > 0) {
        console.log(`\n⚠️  Found ${unsyncedSessions.length} completed/abandoned sessions without remoteId:`);
        console.table(unsyncedSessions.map(s => ({
            localId: s.id,
            status: s.status,
            routine: s.routineName,
            date: s.date
        })));
    }

    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`✅ Sessions with remoteId: ${sessions.filter(s => s.remoteId).length}`);
    console.log(`⏳ Sessions without remoteId: ${sessions.filter(s => !s.remoteId).length}`);
    console.log(`📤 Pending operations: ${workoutOps.filter(op => op.status === 'pending').length}`);
    console.log(`🔄 Retrying operations: ${workoutOps.filter(op => op.status === 'retrying').length}`);
    console.log(`❌ Failed operations: ${workoutOps.filter(op => op.status === 'failed').length}`);
    console.log(`🗑️  Orphaned operations: ${orphanedOps.length}`);

    console.log('\n=== END DIAGNOSTICS ===\n');

    return {
        sessions,
        operations: workoutOps,
        orphaned: orphanedOps,
        unsynced: unsyncedSessions
    };
})();
