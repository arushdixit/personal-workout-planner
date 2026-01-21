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
    formCuesArray?: string[];
    beginnerFriendlyInstructions?: string[];
    commonMistakes?: string[];
    injuryPreventionTips?: string[];
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
    tutorialUrl?: string;
    personalNotes?: string; // User's custom notes for this exercise
    inLibrary?: boolean;
    isStarter?: boolean;
    source?: 'exercemus' | 'local';
    category?: string;
    description?: string;
    instructions?: string[];
    tips?: string[];
    aliases?: string[];
    tempo?: string;
    variationOf?: string[];
    createdAt?: string;
    updatedAt?: string;
    dataVersion?: number; // Track version of enriched data
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

export interface RoutineExercise {
    exerciseId: number;
    exerciseName: string;
    sets: number;
    reps: string; // e.g., "8-12" or "10"
    restSeconds: number;
    order: number;
    notes?: string;
}

export interface Routine {
    id?: string; // Supabase UUID
    userId: string; // Supabase user ID
    localUserId: number; // Local Dexie user ID
    name: string;
    description?: string;
    exercises: RoutineExercise[];
    createdAt: string;
    updatedAt: string;
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
    'glutes',
    'hamstrings',
    'lats',
    'lower-back',
    'neck',
    'obliques',
    'quadriceps',
    'traps',
    'triceps',
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
    routines: EntityTable<Routine, 'id'>;
};

db.version(6).stores({
    users: '++id, name',
    exercises: '++id, name, *primaryMuscles, equipment, inLibrary, source, category, *aliases',
    workouts: '++id, userId, date, splitType',
    routines: 'id, userId, localUserId, name',
});

export { db };
