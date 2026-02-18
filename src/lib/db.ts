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
    supabaseUserId?: string;
    unitPreference?: 'kg' | 'lbs';
    lastCompletedRoutineId?: string;
    lastWorkoutDate?: string;
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
    id: number | string;
    setNumber: number;
    reps: number;
    weight: number;
    unit: 'kg' | 'lbs';
    completed: boolean;
    completedAt?: string;
    rpe?: number;
    feedback?: string;
}

export interface WorkoutSessionExercise {
    exerciseId: number;
    exerciseName: string;
    order: number;
    sets: WorkoutSet[];
    restSeconds: number;
    personalNote?: string;
}

export interface WorkoutSession {
    id?: number;
    uuid?: string;
    remoteId?: number; // Supabase session ID (different from local Dexie ID)
    userId: number;
    supabaseUserId: string;
    routineId: string;
    routineName: string;
    date: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    exercises: WorkoutSessionExercise[];
    status: 'in_progress' | 'completed' | 'abandoned';
    syncedAt?: string;
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

export interface LocalRoutine {
    id?: string; // Supabase UUID
    userId: string; // Supabase user ID
    localUserId: number; // Local Dexie user ID
    name: string;
    description?: string;
    exercises: RoutineExercise[];
    createdAt: string;
    updatedAt: string;
    syncedAt?: string; // Last successful sync timestamp
}


export interface SyncOperation {
    id?: number;
    type: 'create' | 'update' | 'delete';
    entityType: 'routine' | 'workout' | 'exercise' | 'workout_session' | 'workout_set';
    entityId: string;
    data: any;
    attempts: number;
    lastAttempt?: string;
    status: 'pending' | 'retrying' | 'failed';
    createdAt: string;
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
    routines: EntityTable<LocalRoutine, 'id'>;
    workout_sessions: EntityTable<WorkoutSession, 'id'>;
    syncQueue: EntityTable<SyncOperation, 'id'>;
};

db.version(10).stores({
    users: '++id, name, supabaseUserId, lastCompletedRoutineId, lastWorkoutDate',
    exercises: '++id, name, *primaryMuscles, equipment, inLibrary, source, category, *aliases',
    workouts: '++id, userId, date, splitType',
    routines: 'id, userId, localUserId, name',
    workout_sessions: '++id, uuid, remoteId, userId, supabaseUserId, routineId, date, status',
    syncQueue: '++id, type, entityType, entityId, status, createdAt',
});

export { db };
