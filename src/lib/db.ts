import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';

if (typeof PouchDB.plugin === 'function') {
    PouchDB.plugin(PouchDBFind);
}

// Initialize databases
export const usersDb = new PouchDB('users');
export const exercisesDb = new PouchDB('exercises');
export const workoutsDb = new PouchDB('workouts');
export const settingsDb = new PouchDB('settings');

// Optional: Enable remote sync if CouchDB URL is provided
export const syncWithRemote = (dbName: string, remoteUrl: string) => {
    const localDb = new PouchDB(dbName);
    const remoteDb = new PouchDB(`${remoteUrl}/${dbName}`);

    return localDb.sync(remoteDb, {
        live: true,
        retry: true,
    });
};

export interface UserProfile {
    _id: string; // 'user_1' or 'user_2'
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
    _id: string;
    name: string;
    primaryMuscles: string[];
    secondaryMuscles: string[];
    equipment: string;
    notes?: string;
    tutorialUrl?: string;
    isStarter?: boolean;
    mastered?: boolean;
}

export interface WorkoutSet {
    reps: number;
    weight: number;
    unit: 'kg' | 'lbs' | 'custom';
    completed: boolean;
}

export interface WorkoutExercise {
    exerciseId: string;
    name: string;
    sets: WorkoutSet[];
    feedback?: string;
}

export interface Workout {
    _id: string;
    userId: string;
    date: string;
    splitType: string;
    exercises: WorkoutExercise[];
    completed: boolean;
    duration?: number;
}
