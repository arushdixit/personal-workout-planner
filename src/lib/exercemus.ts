import { db, Exercise, EquipmentType, MuscleGroup } from './db';

const EXERCEMUS_MUSCLE_MAP: Record<string, MuscleGroup> = {
    'abs': 'abs',
    'hamstrings': 'hamstring',
    'calves': 'calves',
    'adductors': 'adductors',
    'biceps': 'biceps',
    'brachialis': 'biceps',
    'quads': 'quadriceps',
    'shoulders': 'deltoids',
    'chest': 'chest',
    'middle back': 'upper-back',
    'lats': 'upper-back',
    'triceps': 'triceps',
    'lower back': 'lower-back',
    'traps': 'trapezius',
    'abductors': 'gluteal',
    'glutes': 'gluteal',
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
    const existingCount = await db.exercises.where('source').equals('exercemus').count();
    if (existingCount > 0) {
        console.log('Exercemus data already imported.');
        return;
    }

    try {
        // Dynamic import to keep main bundle small
        const data = await import('./exercemus-data.json');

        const exercisesToInsert: Exercise[] = data.exercises.map((ex: any) => ({
            name: ex.name,
            primaryMuscles: mapMuscles(ex.primary_muscles),
            secondaryMuscles: mapMuscles(ex.secondary_muscles || []),
            equipment: mapEquipment(ex.equipment || []),
            source: 'exercemus',
            category: ex.category || 'strength',
            description: ex.description || '',
            instructions: ex.instructions || [],
            tips: ex.tips || [],
            aliases: ex.aliases || [],
            tutorialUrl: ex.video || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }));

        // Filter out exercises with no name or no primary muscles
        const validExercises = exercisesToInsert.filter(ex => ex.name && ex.primaryMuscles.length > 0);

        console.log(`Importing ${validExercises.length} exercises from Exercemus...`);

        // Insert in chunks to avoid blocking or memory issues
        const chunkSize = 100;
        for (let i = 0; i < validExercises.length; i += chunkSize) {
            const chunk = validExercises.slice(i, i + chunkSize);
            await db.exercises.bulkAdd(chunk);
        }

        console.log('Exercemus import complete.');
    } catch (err) {
        console.error('Failed to import Exercemus data:', err);
    }
}
