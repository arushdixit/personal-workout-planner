import { db, Exercise, EquipmentType, MuscleGroup } from './db';

const EXERCEMUS_MUSCLE_MAP: Record<string, MuscleGroup> = {
    'abs': 'abs',
    'hamstrings': 'hamstrings',
    'calves': 'calves',
    'adductors': 'adductors',
    'biceps': 'biceps',
    'brachialis': 'biceps',
    'quads': 'quadriceps',
    'shoulders': 'deltoids',
    'chest': 'chest',
    'middle back': 'lats',
    'lats': 'lats',
    'triceps': 'triceps',
    'lower back': 'lower-back',
    'traps': 'traps',
    'abductors': 'glutes',
    'glutes': 'glutes',
    'neck': 'neck',
    'obliques': 'obliques',
    'forearms': 'forearm',
    'tibialis': 'tibialis',
};

const EXERCEMUS_EQUIPMENT_MAP: Record<string, EquipmentType> = {
    'none': 'Bodyweight',
    'ez curl bar': 'EZ Bar',
    'barbell': 'Barbell',
    'dumbbell': 'Dumbbell',
    'machine': 'Machine',
    'cable': 'Cable',
    'kettlebell': 'Kettlebell',
    'bodyweight': 'Bodyweight',
    'pull-up bar': 'Other',
};

function mapMuscles(muscles: string[]): MuscleGroup[] {
    const mapped = muscles
        .map(m => EXERCEMUS_MUSCLE_MAP[m.toLowerCase()] || 'Other')
        .filter(m => m !== 'Other') as MuscleGroup[];
    return Array.from(new Set(mapped));
}

function mapEquipment(exercemusEquip: string[]): EquipmentType {
    for (const eq of exercemusEquip) {
        const mapped = EXERCEMUS_EQUIPMENT_MAP[eq.toLowerCase()];
        if (mapped) return mapped;
    }
    return 'Other';
}

// Lock to prevent concurrent imports
let importInProgress: Promise<void> | null = null;

export async function importExercemusData() {
    // Only run in browser environment
    if (typeof window === 'undefined') {
        console.log('Skipping Exercemus import in non-browser environment');
        return;
    }

    // Check if IndexedDB is available
    if (!window.indexedDB) {
        console.error('IndexedDB is not available in this browser');
        return;
    }

    // If an import is already in progress, wait for it to complete
    if (importInProgress) {
        console.log('Import already in progress, waiting...');
        await importInProgress;
        return;
    }

    // Set the lock IMMEDIATELY before any async operations
    importInProgress = (async () => {
        try {
            console.log('Checking for Exercemus data...');

            // Version of the enriched data - increment this when JSON is updated
            const DATA_VERSION = 4; // Incremented to fix ID stability and preserve metadata

            const existingCount = await db.exercises.where('source').equals('exercemus').count();

            // Check if we need to refresh data by comparing version numbers
            const sample = await db.exercises.where('source').equals('exercemus').first();
            const currentVersion = sample?.dataVersion || 0;
            const needsRefresh = sample && currentVersion < DATA_VERSION;

            if (existingCount > 0 && !needsRefresh) {
                console.log('Exercemus data already imported and up to date.');
                return;
            }

            // Capture existing metadata AND IDs to stabilize references
            const existingMapping = new Map<string, { id: number; inLibrary?: boolean; personalNotes?: string }>();
            if (existingCount > 0) {
                console.log('Capturing existing exercise mapping to preserve IDs and metadata...');
                const existingExercemus = await db.exercises.where('source').equals('exercemus').toArray();
                existingExercemus.forEach(ex => {
                    if (ex.id !== undefined) {
                        existingMapping.set(ex.name.toLowerCase(), {
                            id: ex.id,
                            inLibrary: ex.inLibrary,
                            personalNotes: ex.personalNotes
                        });
                    }
                });
            }

            // We no longer delete all exercises if we're doing a refresh
            // Instead we use bulkPut with existing IDs to update them in place
            /* 
            if (needsRefresh) {
                console.log(`Exercemus data is outdated (v${currentVersion} < v${DATA_VERSION}), clearing for refresh...`);
                await db.exercises.where('source').equals('exercemus').delete();
            }
            */

            console.log('Fetching /data/enriched-exercises.json...');
            const response = await fetch('/data/enriched-exercises.json');
            if (!response.ok) {
                throw new Error(`Failed to fetch exercises: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();

            if (!data || !data.exercises) {
                console.error('Invalid Exercemus data format:', data);
                return;
            }

            const exercisesToInsert: Exercise[] = data.exercises.map((ex: any) => {
                const nameLower = (ex.name || '').toLowerCase();
                const existing = existingMapping.get(nameLower);

                return {
                    ...(existing ? { id: existing.id } : {}), // Preserve the ID if it already exists!
                    name: ex.name,
                    primaryMuscles: mapMuscles(ex.primary_muscles || []),
                    secondaryMuscles: mapMuscles(ex.secondary_muscles || []),
                    equipment: mapEquipment(ex.equipment || []),
                    source: 'exercemus',
                    category: ex.category || 'strength',
                    description: ex.description || '',
                    instructions: ex.instructions || [],
                    tips: ex.tips || [],
                    aliases: ex.aliases || [],
                    tempo: ex.tempo_recommendation || ex.tempo || '',
                    difficulty: ex.difficulty || 'Intermediate',
                    beginnerFriendlyInstructions: ex.beginner_friendly_instructions || [],
                    formCuesArray: ex.form_cues || [],
                    formCues: (ex.form_cues || []).join(', '),
                    commonMistakes: ex.common_mistakes || [],
                    injuryPreventionTips: ex.injury_prevention_tips || [],
                    variationOf: ex.variation_on || ex.variations_on || [],
                    tutorialUrl: ex.video || '',
                    dataVersion: DATA_VERSION, // Track which version of data this is
                    inLibrary: existing?.inLibrary || false,
                    personalNotes: existing?.personalNotes || '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
            });

            // Filter out exercises with no name or no primary muscles
            const validExercises = exercisesToInsert.filter(ex => ex.name && ex.primaryMuscles.length > 0);

            console.log(`Syncing ${validExercises.length} enriched exercises from Exercemus (preserving IDs)...`);

            // Insert/Update in chunks
            const chunkSize = 100;
            let insertedCount = 0;
            for (let i = 0; i < validExercises.length; i += chunkSize) {
                const chunk = validExercises.slice(i, i + chunkSize);
                await db.exercises.bulkPut(chunk); // bulkPut handles both add and update
                insertedCount += chunk.length;
                console.log(`Progress: ${insertedCount}/${validExercises.length} exercises synced`);
            }

            console.log('Exercemus enrichment import complete.');
        } catch (error) {
            console.error('CRITICAL: Failed to import Exercemus data:', error);
        } finally {
            // Clear the lock when done
            importInProgress = null;
        }
    })();

    // Wait for the import to complete
    await importInProgress;
}
