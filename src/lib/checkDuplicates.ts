import { db } from './db';

export async function findDuplicateExercises() {
    const allExercises = await db.exercises.toArray();

    // Group by name
    const grouped = allExercises.reduce((acc, ex) => {
        if (!acc[ex.name]) {
            acc[ex.name] = [];
        }
        acc[ex.name].push(ex);
        return acc;
    }, {} as Record<string, typeof allExercises>);

    // Find duplicates
    const duplicates = Object.entries(grouped)
        .filter(([_, exercises]) => exercises.length > 1)
        .map(([name, exercises]) => ({
            name,
            count: exercises.length,
            exercises: exercises.map(ex => ({
                id: ex.id,
                source: ex.source,
                createdAt: ex.createdAt,
                personalNotes: ex.personalNotes,
                dataVersion: ex.dataVersion
            }))
        }));

    console.log('=== DUPLICATE EXERCISES ===');
    console.log(`Found ${duplicates.length} exercises with duplicates:`);
    duplicates.forEach(dup => {
        console.log(`\n${dup.name} (${dup.count} entries):`);
        dup.exercises.forEach(ex => {
            console.log(`  - ID: ${ex.id}, Source: ${ex.source}, Created: ${ex.createdAt}, Notes: ${ex.personalNotes ? 'YES' : 'NO'}, Version: ${ex.dataVersion}`);
        });
    });

    return duplicates;
}

export async function removeDuplicateExercises() {
    const allExercises = await db.exercises.toArray();

    // Group by name
    const grouped = allExercises.reduce((acc, ex) => {
        if (!acc[ex.name]) {
            acc[ex.name] = [];
        }
        acc[ex.name].push(ex);
        return acc;
    }, {} as Record<string, typeof allExercises>);

    let removedCount = 0;

    for (const [name, exercises] of Object.entries(grouped)) {
        if (exercises.length > 1) {
            // Sort by: 1) has personal notes, 2) most recent updatedAt, 3) highest ID
            exercises.sort((a, b) => {
                // Prioritize exercises with personal notes
                if (a.personalNotes && !b.personalNotes) return -1;
                if (!a.personalNotes && b.personalNotes) return 1;

                // Then by most recent update
                const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
                const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
                if (aTime !== bTime) return bTime - aTime;

                // Finally by ID (keep higher ID)
                return (b.id || 0) - (a.id || 0);
            });

            // Keep the first one (best), remove the rest
            const toKeep = exercises[0];
            const toRemove = exercises.slice(1);

            console.log(`Keeping ${name} (ID: ${toKeep.id}), removing ${toRemove.length} duplicates`);

            for (const ex of toRemove) {
                if (ex.id) {
                    await db.exercises.delete(ex.id);
                    removedCount++;
                }
            }
        }
    }

    console.log(`Removed ${removedCount} duplicate exercises`);
    return removedCount;
}
