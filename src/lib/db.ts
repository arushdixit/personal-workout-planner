import Dexie, { type EntityTable } from 'dexie';

// --- Type Definitions ---

export interface UserProfile {
    id?: number;
    name: string;
    gender: 'male' | 'female';
    age: number;
    height: number;
    weight: number;
    bodyFat?: number;
    onboarded: boolean;
    activeSplit?: 'PPL' | 'UpperLower' | 'FullBody';
    createdAt: string;
}

export type EquipmentType = 'Barbell' | 'Dumbbell' | 'Cable' | 'Machine' | 'Bodyweight' | 'EZ Bar' | 'Kettlebell' | 'Other';

export interface Exercise {
    id?: number;
    name: string;
    primaryMuscles: string[];
    secondaryMuscles: string[];
    equipment: EquipmentType;
    repRange?: string; // e.g., "8-12"
    formCues?: string; // e.g., "Elbows at 45°, chest up"
    tutorialUrl?: string;
    mastered?: boolean;
    isStarter?: boolean;
    source?: 'exercemus' | 'local';
    category?: string;
    description?: string;
    instructions?: string[];
    tips?: string[];
    aliases?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface WorkoutSet {
    reps: number;
    weight: number;
    unit: 'kg' | 'lbs';
    completed: boolean;
}

export interface WorkoutExercise {
    exerciseId: number;
    name: string;
    sets: WorkoutSet[];
    feedback?: string;
}

export interface Workout {
    id?: number;
    userId: number;
    date: string;
    splitType: string;
    exercises: WorkoutExercise[];
    completed: boolean;
    duration?: number;
}

// --- Muscle Groups (matching body highlighter slugs) ---
export const MUSCLE_GROUPS = [
    'abs',
    'adductors',
    'biceps',
    'calves',
    'chest',
    'deltoids',
    'forearm',
    'gluteal',
    'hamstring',
    'lower-back',
    'neck',
    'obliques',
    'quadriceps',
    'trapezius',
    'triceps',
    'upper-back',
    'tibialis',
] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];

export const EQUIPMENT_TYPES: EquipmentType[] = [
    'Barbell',
    'Dumbbell',
    'Cable',
    'Machine',
    'Bodyweight',
    'EZ Bar',
    'Kettlebell',
    'Other',
];

// --- Database Definition ---

const db = new Dexie('ProLiftsDB') as Dexie & {
    users: EntityTable<UserProfile, 'id'>;
    exercises: EntityTable<Exercise, 'id'>;
    workouts: EntityTable<Workout, 'id'>;
};

db.version(3).stores({
    users: '++id, name',
    exercises: '++id, name, *primaryMuscles, equipment, mastered, source, category',
    workouts: '++id, userId, date, splitType',
});

export { db };
