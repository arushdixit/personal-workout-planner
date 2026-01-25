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

export async function importExercemusData() {
    console.log('Checking for Exercemus data...');

    // Version of the enriched data - increment this when JSON is updated
    const DATA_VERSION = 3; // Incremented to restore difficulty levels (Beginner/Intermediate/Advanced)

    const existingCount = await db.exercises.where('source').equals('exercemus').count();

    // Check if we need to refresh data by comparing version numbers
    const sample = await db.exercises.where('source').equals('exercemus').first();
    const currentVersion = sample?.dataVersion || 0;
    const needsRefresh = sample && currentVersion < DATA_VERSION;

    if (existingCount > 0 && !needsRefresh) {
        console.log('Exercemus data already imported and up to date.');
        return;
    }

    if (needsRefresh) {
        console.log(`Exercemus data is outdated (v${currentVersion} < v${DATA_VERSION}), clearing for refresh...`);
        await db.exercises.where('source').equals('exercemus').delete();
    }

    try {
        console.log('Loading enriched-exercemus-data.json...');
        // Dynamic import to keep main bundle small
        const module = await import('./enriched-exercemus-data.json');
        const data = module.default || module;

        console.log(`JSON loaded successfully, keys: ${Object.keys(data).join(', ')}`);
        if (data.exercises) {
            console.log(`Found ${data.exercises.length} exercises in JSON`);
        } else {
            console.error('No exercises key found in loaded data');
        }

        if (!data || !data.exercises) {
            console.error('Invalid Exercemus data format:', data);
            return;
        }

        const exercisesToInsert: Exercise[] = data.exercises.map((ex: any) => ({
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }));

        // Filter out exercises with no name or no primary muscles
        const validExercises = exercisesToInsert.filter(ex => ex.name && ex.primaryMuscles.length > 0);

        console.log(`Importing ${validExercises.length} enriched exercises from Exercemus...`);

        // Insert in chunks to avoid blocking or memory issues
        const chunkSize = 100;
        for (let i = 0; i < validExercises.length; i += chunkSize) {
            const chunk = validExercises.slice(i, i + chunkSize);
            await db.exercises.bulkAdd(chunk);
        }

        console.log('Exercemus enrichment import complete.');
    } catch (err) {
        console.error('Failed to import Exercemus data:', err);
    }
}
