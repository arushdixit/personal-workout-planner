import { Workout, WorkoutExercise, Exercise } from './db';

export const splits: Record<string, string[]> = {
    PPL: ['Push', 'Pull', 'Legs'],
    UpperLower: ['Upper', 'Lower'],
    FullBody: ['Full Body'],
};

export const getNextWorkoutType = (lastWorkoutType: string | undefined, split: string): string => {
    const workoutTypes = splits[split] || splits['PPL'];
    if (!lastWorkoutType) return workoutTypes[0];

    const currentIndex = workoutTypes.indexOf(lastWorkoutType);
    const nextIndex = (currentIndex + 1) % workoutTypes.length;
    return workoutTypes[nextIndex];
};

export const getExercisesForType = (allExercises: Exercise[], workoutType: string): Exercise[] => {
    const mapping: Record<string, string[]> = {
        Push: ['chest_left', 'chest_right', 'shoulder_front_left', 'shoulder_front_right', 'tricep_left', 'tricep_right'],
        Pull: ['lats', 'rhomboids', 'bicep_left', 'bicep_right', 'shoulder_rear_left', 'shoulder_rear_right', 'traps'],
        Legs: ['quads_left', 'quads_right', 'hamstrings_left', 'hamstrings_right', 'glutes', 'calves_left', 'calves_right'],
        Upper: ['chest_left', 'chest_right', 'lats', 'shoulders', 'arms'],
        Lower: ['legs', 'quads', 'hamstrings', 'glutes', 'calves'],
        'Full Body': ['chest', 'back', 'legs', 'shoulders'],
    };

    const targetMuscles = mapping[workoutType] || [];

    // Filter exercises that have at least one primary muscle in the target list
    return allExercises.filter(ex =>
        ex.primaryMuscles.some(m => targetMuscles.some(tm => m.includes(tm)))
    );
};
