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

export interface Exercise {
    id?: number;
    name: string;
    primaryMuscles: string[];
    secondaryMuscles: string[];
    equipment: string;
    notes?: string;
    tutorialUrl?: string;
    isStarter?: boolean;
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
    oderId: number;
    date: string;
    splitType: string;
    exercises: WorkoutExercise[];
    completed: boolean;
    duration?: number;
}

// --- Database Definition ---

const db = new Dexie('ProLiftsDB') as Dexie & {
    users: EntityTable<UserProfile, 'id'>;
    exercises: EntityTable<Exercise, 'id'>;
    workouts: EntityTable<Workout, 'id'>;
};

db.version(1).stores({
    users: '++id, name',
    exercises: '++id, name, isStarter',
    workouts: '++id, oderId, date, splitType',
});

export { db };
