import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { db, WorkoutSession, WorkoutSessionExercise, WorkoutSet, Routine } from '@/lib/db';
import { createWorkoutSession, completeWorkout as completeRemoteWorkout } from '@/lib/supabaseWorkoutClient';
import { updateLastCompletedRoutine } from '@/lib/routineCycling';
import { queueWorkoutOperation } from '@/lib/workoutSyncManager';
import { v4 as uuidv4 } from 'uuid';

interface WorkoutContextType {
    // State
    activeSession: WorkoutSession | null;
    currentExerciseIndex: number;
    exerciseUnitOverrides: Record<number, 'kg' | 'lbs'>;
    
    // Computed
    currentExercise: WorkoutSessionExercise | null;
    progress: { completed: number; total: number };
    isWorkoutComplete: boolean;
    isRestTimerActive: boolean;
    
    // Actions
    startWorkout: (routine: Routine, userId: number, supabaseUserId: string) => Promise<WorkoutSession>;
    completeSet: (exerciseIndex: number, setId: number, weight: number, reps: number, unit: 'kg' | 'lbs') => Promise<void>;
    addExtraSet: (exerciseIndex: number) => void;
    removeExtraSet: (exerciseIndex: number) => void;
    updatePersonalNote: (exerciseIndex: number, note: string) => void;
    nextExercise: () => void;
    previousExercise: () => void;
    skipRest: () => void;
    endWorkout: () => Promise<void>;
    abandonWorkout: () => Promise<void>;
    clearActiveSession: () => Promise<void>;
    
    // Unit Override
    setExerciseUnit: (exerciseId: number, unit: 'kg' | 'lbs') => void;
    getExerciseUnit: (exerciseId: number) => 'kg' | 'lbs';
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [exerciseUnitOverrides, setExerciseUnitOverrides] = useState<Record<number, 'kg' | 'lbs'>>({});
    const [isRestTimerActive, setIsRestTimerActive] = useState(false);

    // Load any active session on mount
    useEffect(() => {
        const loadActiveSession = async () => {
            const currentUser = await db.users.toArray().then(users => users[0]);
            if (currentUser?.id) {
                const session = await db.workout_sessions
                    .where('userId')
                    .equals(currentUser.id)
                    .and(s => s.status === 'in_progress')
                    .first();
                
                if (session) {
                    setActiveSession(session);
                    // Find current exercise index based on first incomplete
                    const incompleteIndex = session.exercises.findIndex(
                        ex => ex.sets.some(set => !set.completed)
                    );
                    setCurrentExerciseIndex(incompleteIndex >= 0 ? incompleteIndex : 0);
                }
            }
        };
        loadActiveSession();
    }, []);

    // Computed values
    const currentExercise = activeSession?.exercises[currentExerciseIndex] || null;

    const progress = React.useMemo(() => {
        if (!activeSession) return { completed: 0, total: 0 };
        
        let totalSets = 0;
        let completedSets = 0;
        
        for (const exercise of activeSession.exercises) {
            totalSets += exercise.sets.length;
            completedSets += exercise.sets.filter(s => s.completed).length;
        }
        
        return { completed: completedSets, total: totalSets };
    }, [activeSession]);

    const isWorkoutComplete = React.useMemo(() => {
        if (!activeSession) return false;
        return activeSession.exercises.every(ex => 
            ex.sets.every(set => set.completed)
        );
    }, [activeSession]);

    // Actions
    const startWorkout = useCallback(async (
        routine: Routine,
        userId: number,
        supabaseUserId: string
    ): Promise<WorkoutSession> => {
        const now = new Date().toISOString();
        const today = now.split('T')[0];
        const uuid = uuidv4();

        const session: Omit<WorkoutSession, 'id'> = {
            uuid,
            userId,
            supabaseUserId,
            routineId: routine.id!,
            routineName: routine.name,
            date: today,
            startTime: now,
            exercises: routine.exercises.map((ex, index) => ({
                exerciseId: ex.exerciseId,
                exerciseName: ex.exerciseName,
                order: ex.order,
                sets: Array.from({ length: ex.sets }, (_, setIndex) => ({
                    id: Date.now() + setIndex + (index * 100),
                    setNumber: setIndex + 1,
                    reps: parseReps(ex.reps),
                    weight: 0,
                    unit: 'kg',
                    completed: false,
                })),
            })),
            status: 'in_progress',
        };

        const sessionId = await createWorkoutSession({
            user_id: supabaseUserId,
            routine_id: routine.id!,
            routine_name: routine.name,
            date: today,
            start_time: now,
            exercises: routine.exercises.map((ex, index) => ({
                exercise_id: ex.exerciseId,
                exercise_name: ex.exerciseName,
                order: ex.order,
                sets: Array.from({ length: ex.sets }, (_, setIndex) => ({
                    set_number: setIndex + 1,
                    reps: parseReps(ex.reps),
                    weight: 0,
                    unit: 'kg' as const,
                })),
            })),
        });
        
        // Create session object for Dexie (without uuid to avoid key path issues)
        const sessionForDexie: Omit<WorkoutSession, 'id'> & { id?: number } = {
            userId,
            supabaseUserId,
            routineId: routine.id!,
            routineName: routine.name,
            date: today,
            startTime: now,
            exercises: routine.exercises.map((ex, index) => ({
                exerciseId: ex.exerciseId,
                exerciseName: ex.exerciseName,
                order: ex.order,
                sets: Array.from({ length: ex.sets }, (_, setIndex) => ({
                    id: Date.now() + setIndex + (index * 100),
                    setNumber: setIndex + 1,
                    reps: parseReps(ex.reps),
                    weight: 0,
                    unit: 'kg',
                    completed: false,
                })),
            })),
            status: 'in_progress',
        };
        
        const localId = await db.workout_sessions.add(sessionForDexie);
        const createdSession: WorkoutSession = { 
            ...sessionForDexie, 
            id: localId as number,
            uuid: uuidv4(),
        };
        
        // Update with the uuid for sync
        await db.workout_sessions.update(localId as number, { uuid: createdSession.uuid });
        
        setActiveSession(createdSession);
        setCurrentExerciseIndex(0);
        setExerciseUnitOverrides({});
        setIsRestTimerActive(false);

        // Queue for sync
        await queueWorkoutOperation('create', localId as number);

        return createdSession;
    }, []);

    const completeSet = useCallback(async (
        exerciseIndex: number,
        setId: number,
        weight: number,
        reps: number,
        unit: 'kg' | 'lbs'
    ) => {
        if (!activeSession) return;

        const session = await db.workout_sessions.get(activeSession.id!);
        if (!session) return;

        const exercise = session.exercises[exerciseIndex];
        const setIndex = exercise?.sets.findIndex(s => s.id === setId);

        if (setIndex !== undefined && setIndex !== -1 && exercise) {
            exercise.sets[setIndex] = {
                ...exercise.sets[setIndex],
                weight,
                reps,
                unit,
                completed: true,
                completedAt: new Date().toISOString(),
            };

            await db.workout_sessions.update(session.id!, { exercises: session.exercises });
            setActiveSession({ ...session, exercises: session.exercises });

            // Show rest timer
            setIsRestTimerActive(true);

            // Queue for sync
            await queueWorkoutOperation('set_complete', session.id!, { setId, reps, weight });
        }
    }, [activeSession]);

    const addExtraSet = useCallback((exerciseIndex: number) => {
        if (!activeSession) return;

        const session = activeSession;
        const exercise = session.exercises[exerciseIndex];
        if (!exercise) return;

        const newSetNumber = exercise.sets.length + 1;
        const unit = exerciseUnitOverrides[exercise.exerciseId] || 'kg';

        const newSet: WorkoutSet = {
            id: Date.now(),
            setNumber: newSetNumber,
            reps: parseReps('10'), // Default
            weight: 0,
            unit,
            completed: false,
        };

        exercise.sets.push(newSet);

        db.workout_sessions.update(session.id!, { exercises: session.exercises });
        setActiveSession({ ...session, exercises: session.exercises });
    }, [activeSession, exerciseUnitOverrides]);

    const removeExtraSet = useCallback((exerciseIndex: number) => {
        if (!activeSession) return;

        const session = activeSession;
        const exercise = session.exercises[exerciseIndex];
        if (!exercise || exercise.sets.length === 0) return;

        // Only remove if last set is not completed
        const lastSet = exercise.sets[exercise.sets.length - 1];
        if (lastSet.completed) return;

        exercise.sets.pop();

        db.workout_sessions.update(session.id!, { exercises: session.exercises });
        setActiveSession({ ...session, exercises: session.exercises });
    }, [activeSession]);

    const updatePersonalNote = useCallback((exerciseIndex: number, note: string) => {
        if (!activeSession) return;

        const session = activeSession;
        const exercise = session.exercises[exerciseIndex];
        if (!exercise) return;

        exercise.personalNote = note;

        db.workout_sessions.update(session.id!, { exercises: session.exercises });
        setActiveSession({ ...session, exercises: session.exercises });
    }, [activeSession]);

    const nextExercise = useCallback(() => {
        if (!activeSession) return;
        if (currentExerciseIndex < activeSession.exercises.length - 1) {
            setCurrentExerciseIndex(prev => prev + 1);
        }
    }, [activeSession, currentExerciseIndex]);

    const previousExercise = useCallback(() => {
        if (!activeSession) return;
        if (currentExerciseIndex > 0) {
            setCurrentExerciseIndex(prev => prev - 1);
        }
    }, [currentExerciseIndex]);

    const skipRest = useCallback(() => {
        setIsRestTimerActive(false);
    }, []);

    const endWorkout = useCallback(async () => {
        if (!activeSession) return;

        const endTime = new Date().toISOString();
        const duration = Math.floor(
            (new Date(endTime).getTime() - new Date(activeSession.startTime).getTime()) / 1000
        );

        await db.workout_sessions.update(activeSession.id!, {
            status: 'completed',
            endTime,
            duration,
        });

        // Update last completed routine
        if (activeSession.userId) {
            await updateLastCompletedRoutine(activeSession.userId, activeSession.routineId);
        }

        // Queue for sync
        await queueWorkoutOperation('complete', activeSession.id!);

        setActiveSession(null);
        setCurrentExerciseIndex(0);
        setIsRestTimerActive(false);
    }, [activeSession]);

    const abandonWorkout = useCallback(async () => {
        if (!activeSession) return;

        const endTime = new Date().toISOString();

        await db.workout_sessions.update(activeSession.id!, {
            status: 'abandoned',
            endTime,
        });

        // Queue for sync
        await queueWorkoutOperation('abandon', activeSession.id!);

        setActiveSession(null);
        setCurrentExerciseIndex(0);
        setIsRestTimerActive(false);
    }, [activeSession]);

    const clearActiveSession = useCallback(async () => {
        if (!activeSession) return;
        await db.workout_sessions.delete(activeSession.id!);
        setActiveSession(null);
        setCurrentExerciseIndex(0);
        setIsRestTimerActive(false);
    }, [activeSession]);

    const setExerciseUnit = useCallback((exerciseId: number, unit: 'kg' | 'lbs') => {
        setExerciseUnitOverrides(prev => ({
            ...prev,
            [exerciseId]: unit,
        }));
    }, []);

    const getExerciseUnit = useCallback((exerciseId: number): 'kg' | 'lbs' => {
        return exerciseUnitOverrides[exerciseId] || 'kg';
    }, [exerciseUnitOverrides]);

    const value: WorkoutContextType = {
        activeSession,
        currentExerciseIndex,
        exerciseUnitOverrides,
        currentExercise,
        progress,
        isWorkoutComplete,
        isRestTimerActive,
        startWorkout,
        completeSet,
        addExtraSet,
        removeExtraSet,
        updatePersonalNote,
        nextExercise,
        previousExercise,
        skipRest,
        endWorkout,
        abandonWorkout,
        clearActiveSession,
        setExerciseUnit,
        getExerciseUnit,
    };

    return (
        <WorkoutContext.Provider value={value}>
            {children}
        </WorkoutContext.Provider>
    );
};

export const useWorkout = () => {
    const context = useContext(WorkoutContext);
    if (!context) {
        throw new Error('useWorkout must be used within a WorkoutProvider');
    }
    return context;
};

// Helper function to parse reps string like "8-12" to a number
function parseReps(reps: string): number {
    if (reps.includes('-')) {
        const [min] = reps.split('-').map(Number);
        return min || 10;
    }
    return parseInt(reps, 10) || 10;
}
