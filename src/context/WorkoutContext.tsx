import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { db, WorkoutSession, WorkoutSessionExercise, WorkoutSet, LocalRoutine } from '@/lib/db';
import { updateLastCompletedRoutine } from '@/lib/routineCycling';
import { useUser } from './UserContext';
import { queueWorkoutOperation } from '@/lib/workoutSyncManager';
import { v4 as uuidv4 } from 'uuid';

interface WorkoutContextType {
    // State
    activeSession: WorkoutSession | null;
    currentExerciseIndex: number;

    // Computed
    currentExercise: WorkoutSessionExercise | null;
    progress: { completed: number; total: number };
    isWorkoutComplete: boolean;
    isRestTimerActive: boolean;
    restTimeLeft: number;
    isRestTimerMinimized: boolean;
    showSuccess: boolean;
    activeView: 'list' | 'detail';
    selectedExerciseIndex: number | null;
    completedStats: {
        duration: number;
        completedSets: number;
        totalSets: number;
        volume: number;
        exerciseCount: number;
    } | null;

    // Actions
    startWorkout: (routine: LocalRoutine, userId: number, supabaseUserId: string) => Promise<WorkoutSession>;
    completeSet: (exerciseIndex: number, setId: number, weight: number, reps: number, unit: 'kg' | 'lbs') => Promise<void>;
    addExtraSet: (exerciseIndex: number) => Promise<void>;
    removeExtraSet: (exerciseIndex: number) => Promise<void>;
    updatePersonalNote: (exerciseIndex: number, note: string) => Promise<void>;
    nextExercise: () => void;
    previousExercise: () => void;
    skipRest: () => void;
    endWorkout: () => Promise<void>;
    abandonWorkout: () => Promise<void>;
    clearActiveSession: () => Promise<void>;
    setMinimizedRest: (minimized: boolean) => void;
    adjustRestTime: (delta: number) => void;
    clearSuccess: () => void;
    setWorkoutView: (view: 'list' | 'detail', index?: number | null) => void;
    isCoachOpen: boolean;
    setIsCoachOpen: (open: boolean) => void;
    coachMessages: any[];
    setCoachMessages: (messages: any[] | ((prev: any[]) => any[])) => void;
    clearCoachMessages: () => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { refreshUsers } = useUser();
    const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [isRestTimerActive, setIsRestTimerActive] = useState(false);
    const [restTimeLeft, setRestTimeLeft] = useState(0);
    const [isRestTimerMinimized, setIsRestTimerMinimized] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [completedStats, setCompletedStats] = useState<{
        duration: number;
        completedSets: number;
        totalSets: number;
        volume: number;
        exerciseCount: number;
    } | null>(null);
    const [activeView, setActiveView] = useState<'list' | 'detail'>('list');
    const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
    const [isCoachOpen, setIsCoachOpen] = useState(() => {
        return localStorage.getItem('ai_coach_open') === 'true';
    });
    const [coachMessages, setCoachMessages] = useState<any[]>([]);

    // Load coach messages from storage on mount or when session changes
    useEffect(() => {
        if (activeSession?.id) {
            const saved = localStorage.getItem(`coach_messages_${activeSession.id}`);
            if (saved) {
                try {
                    setCoachMessages(JSON.parse(saved));
                } catch (e) {
                    console.error('Failed to load coach messages', e);
                    setCoachMessages([{ role: 'assistant', content: "Hey! I'm your Pro-Coach. How can I help you with your workout today?" }]);
                }
            } else {
                setCoachMessages([{ role: 'assistant', content: "Hey! I'm your Pro-Coach. How can I help you with your workout today?" }]);
            }
        }
    }, [activeSession?.id]);

    // Persist coach messages
    useEffect(() => {
        if (activeSession?.id && coachMessages.length > 0) {
            localStorage.setItem(`coach_messages_${activeSession.id}`, JSON.stringify(coachMessages));
        }
    }, [coachMessages, activeSession?.id]);

    const clearCoachMessages = useCallback(() => {
        setCoachMessages([{ role: 'assistant', content: "Hey! I'm your Pro-Coach. How can I help you with your workout today?" }]);
        if (activeSession?.id) {
            localStorage.removeItem(`coach_messages_${activeSession.id}`);
        }
    }, [activeSession?.id]);

    // Effect to persist coach open state
    useEffect(() => {
        localStorage.setItem('ai_coach_open', isCoachOpen.toString());
    }, [isCoachOpen]);

    // Load any active session on mount
    useEffect(() => {
        const loadActiveSession = async () => {
            const currentUser = await db.users.limit(1).first();
            if (currentUser?.id) {
                const session = await db.workout_sessions
                    .where('userId')
                    .equals(currentUser.id)
                    .and(s => s.status === 'in_progress')
                    .reverse()
                    .first();

                if (session) {
                    setActiveSession(session);

                    // Recover saved UI state if it exists for this session
                    const savedState = localStorage.getItem(`workout_ui_state_${session.id}`);
                    if (savedState) {
                        try {
                            const { view, index } = JSON.parse(savedState);
                            setActiveView(view);
                            setSelectedExerciseIndex(index);
                        } catch (e) {
                            console.error('Failed to restore UI state', e);
                        }
                    }

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

    // Rest Timer Logic
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isRestTimerActive && restTimeLeft > 0) {
            timer = setInterval(() => {
                setRestTimeLeft(prev => {
                    if (prev <= 1) {
                        setIsRestTimerActive(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isRestTimerActive, restTimeLeft]);

    // Persist UI state change
    useEffect(() => {
        if (activeSession?.id) {
            localStorage.setItem(`workout_ui_state_${activeSession.id}`, JSON.stringify({
                view: activeView,
                index: selectedExerciseIndex
            }));
        }
    }, [activeView, selectedExerciseIndex, activeSession?.id]);

    // Computed values
    const currentExercise = useMemo(() =>
        activeSession?.exercises[currentExerciseIndex] || null
        , [activeSession, currentExerciseIndex]);

    const progress = useMemo(() => {
        if (!activeSession) return { completed: 0, total: 0 };

        let totalSets = 0;
        let completedSets = 0;

        for (const exercise of activeSession.exercises) {
            totalSets += exercise.sets.length;
            completedSets += exercise.sets.filter(s => s.completed).length;
        }

        return { completed: completedSets, total: totalSets };
    }, [activeSession]);

    const isWorkoutComplete = useMemo(() => {
        if (!activeSession) return false;
        return activeSession.exercises.every(ex =>
            ex.sets.every(set => set.completed)
        );
    }, [activeSession]);

    // Actions
    const startWorkout = useCallback(async (
        routine: LocalRoutine,
        userId: number,
        supabaseUserId: string
    ): Promise<WorkoutSession> => {
        await db.workout_sessions
            .where('userId')
            .equals(userId)
            .and(s => s.status === 'in_progress')
            .delete();

        const now = new Date().toISOString();
        const today = now.split('T')[0];

        const allCompletedSessions = await db.workout_sessions
            .where('userId')
            .equals(userId)
            .and(s => s.status === 'completed')
            .toArray();

        const exercises = await Promise.all(routine.exercises.map(async (ex, index) => {
            // Filter in memory — avoids N separate full-table scans
            const relevantSessions = allCompletedSessions
                .filter(s => s.exercises.some(e => e.exerciseId === ex.exerciseId))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            const lastPerformance = relevantSessions.length > 0
                ? relevantSessions[0].exercises
                    .find(e => e.exerciseId === ex.exerciseId)?.sets || []
                : [];

            const defaultWeight = lastPerformance[0]?.weight || 0;
            const defaultReps = lastPerformance[0]?.reps || parseReps(ex.reps);
            const defaultUnit = lastPerformance[0]?.unit || 'kg';

            return {
                exerciseId: ex.exerciseId,
                exerciseName: ex.exerciseName,
                order: ex.order,
                restSeconds: ex.restSeconds,
                sets: Array.from({ length: ex.sets }, (_, setIndex) => {
                    const historicalSet = lastPerformance[setIndex];
                    return {
                        id: crypto.randomUUID(),
                        setNumber: setIndex + 1,
                        reps: historicalSet?.reps || defaultReps,
                        weight: historicalSet?.weight || defaultWeight,
                        unit: historicalSet?.unit || defaultUnit,
                        completed: false,
                    };
                }),
            };
        }));

        const sessionForDexie: Omit<WorkoutSession, 'id'> & { id?: number } = {
            userId,
            supabaseUserId,
            routineId: routine.id!,
            routineName: routine.name,
            date: today,
            startTime: now,
            exercises,
            status: 'in_progress',
        };

        const localId = await db.workout_sessions.add(sessionForDexie);
        const createdSession: WorkoutSession = {
            ...sessionForDexie,
            id: localId as number,
            uuid: uuidv4(),
        };

        await db.workout_sessions.update(localId as number, { uuid: createdSession.uuid });

        setActiveSession(createdSession);
        setCurrentExerciseIndex(0);
        setIsRestTimerActive(false);

        queueWorkoutOperation('create', localId as number).catch(console.error);

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
        const set = exercise.sets.find(s => s.id === setId);
        const wasAlreadyCompleted = set?.completed;

        const updatedExercises = session.exercises.map((ex, idx) => {
            if (idx !== exerciseIndex) return ex;
            return {
                ...ex,
                sets: ex.sets.map(s => {
                    // Update the target set
                    if (s.id === setId) {
                        return {
                            ...s,
                            weight,
                            reps,
                            unit,
                            completed: true,
                            completedAt: s.completedAt || new Date().toISOString(),
                        };
                    }
                    // Carry forward values to subsequent incomplete sets
                    if (!s.completed && s.setNumber > (set?.setNumber || 0)) {
                        return {
                            ...s,
                            weight,
                            reps,
                            unit
                        };
                    }
                    return s;
                })
            };
        });

        await db.workout_sessions.update(session.id!, { exercises: updatedExercises });
        setActiveSession({ ...session, exercises: updatedExercises });

        // Only trigger rest timer if it's the first time logging this set
        if (!wasAlreadyCompleted) {
            const restSeconds = exercise.restSeconds || 90;
            setRestTimeLeft(restSeconds);
            setIsRestTimerActive(true);
            setIsRestTimerMinimized(false);
        }

        await queueWorkoutOperation('set_complete', session.id!, { setId, reps, weight });
    }, [activeSession]);

    const addExtraSet = useCallback(async (exerciseIndex: number) => {
        if (!activeSession) return;

        const updatedExercises = activeSession.exercises.map((ex, idx) => {
            if (idx !== exerciseIndex) return ex;

            const lastSet = ex.sets[ex.sets.length - 1];
            const newSetNumber = ex.sets.length + 1;
            const unit = lastSet?.unit || 'kg';
            const newSet: WorkoutSet = {
                id: Date.now(),
                setNumber: newSetNumber,
                reps: lastSet?.reps || parseReps('10'),
                weight: lastSet?.weight || 0,
                unit,
                completed: false,
            };

            return {
                ...ex,
                sets: [...ex.sets, newSet]
            };
        });

        await db.workout_sessions.update(activeSession.id!, { exercises: updatedExercises });
        setActiveSession({ ...activeSession, exercises: updatedExercises });
    }, [activeSession]);

    const removeExtraSet = useCallback(async (exerciseIndex: number) => {
        if (!activeSession) return;

        const exercise = activeSession.exercises[exerciseIndex];
        if (!exercise || exercise.sets.length === 0) return;

        const lastSet = exercise.sets[exercise.sets.length - 1];
        if (lastSet.completed) return;

        const updatedExercises = activeSession.exercises.map((ex, idx) => {
            if (idx !== exerciseIndex) return ex;
            return {
                ...ex,
                sets: ex.sets.slice(0, -1)
            };
        });

        await db.workout_sessions.update(activeSession.id!, { exercises: updatedExercises });
        setActiveSession({ ...activeSession, exercises: updatedExercises });
    }, [activeSession]);

    const updatePersonalNote = useCallback(async (exerciseIndex: number, note: string) => {
        if (!activeSession) return;

        const updatedExercises = activeSession.exercises.map((ex, idx) => {
            if (idx !== exerciseIndex) return ex;
            return { ...ex, personalNote: note };
        });

        await db.workout_sessions.update(activeSession.id!, { exercises: updatedExercises });
        setActiveSession({ ...activeSession, exercises: updatedExercises });

        // Trigger sync
        queueWorkoutOperation('exercise_note', activeSession.id!, {
            exerciseOrder: activeSession.exercises[exerciseIndex].order,
            note
        }).catch(err => console.error('[WorkoutContext] Failed to queue note sync:', err));
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
        setRestTimeLeft(0);
    }, []);

    const setMinimizedRest = useCallback((minimized: boolean) => {
        setIsRestTimerMinimized(minimized);
    }, []);

    const adjustRestTime = useCallback((delta: number) => {
        setRestTimeLeft(prev => Math.max(0, prev + delta));
    }, []);

    const endWorkout = useCallback(async () => {
        if (!activeSession) return;

        const endTime = new Date().toISOString();
        const duration = Math.floor(
            (new Date(endTime).getTime() - new Date(activeSession.startTime).getTime()) / 1000
        );

        // Calculate detailed stats
        let totalVolumeKg = 0;
        let completedSetsCount = 0;
        let exerciseCount = 0;

        activeSession.exercises.forEach(ex => {
            let exCompleted = false;
            ex.sets.forEach(set => {
                if (set.completed) {
                    const weight = Number(set.weight) || 0;
                    const reps = Number(set.reps) || 0;

                    // Standardize everything to KG for the summary
                    const weightInKg = set.unit === 'lbs' ? weight * 0.453592 : weight;

                    totalVolumeKg += weightInKg * reps;
                    completedSetsCount++;
                    exCompleted = true;
                }
            });
            if (exCompleted) exerciseCount++;
        });

        const finalVolume = Math.round(totalVolumeKg);

        setCompletedStats({
            duration,
            completedSets: completedSetsCount,
            totalSets: progress.total,
            volume: finalVolume,
            exerciseCount
        });

        setShowSuccess(true);

        try {
            await db.workout_sessions.update(activeSession.id!, {
                status: 'completed',
                endTime,
                duration,
            });

            if (activeSession.userId) {
                console.log('[Workout] Cycling routine:', activeSession.routineId);
                await updateLastCompletedRoutine(activeSession.userId, activeSession.routineId);
                await refreshUsers();
            }

            await queueWorkoutOperation('complete', activeSession.id!);
        } catch (err) {
            console.error('[Workout] Error finishing workout:', err);
        }

        setActiveSession(null);
        setCurrentExerciseIndex(0);
        setIsRestTimerActive(false);
    }, [activeSession, progress, refreshUsers]);

    const clearSuccess = useCallback(() => {
        setShowSuccess(false);
        setCompletedStats(null);
    }, []);

    const abandonWorkout = useCallback(async () => {
        if (!activeSession) return;

        const endTime = new Date().toISOString();

        await db.workout_sessions.update(activeSession.id!, {
            status: 'abandoned',
            endTime,
        });

        await queueWorkoutOperation('abandon', activeSession.id!);

        setActiveSession(null);
        setCurrentExerciseIndex(0);
        setIsRestTimerActive(false);
    }, [activeSession]);

    const clearActiveSession = useCallback(async () => {
        if (activeSession?.id) {
            localStorage.removeItem(`workout_ui_state_${activeSession.id}`);
        }
    }, [activeSession]);

    const setWorkoutView = useCallback((view: 'list' | 'detail', index: number | null = null) => {
        setActiveView(view);
        setSelectedExerciseIndex(index);
    }, []);

    const value: WorkoutContextType = useMemo(() => ({
        activeSession,
        currentExerciseIndex,
        currentExercise,
        progress,
        isWorkoutComplete,
        isRestTimerActive,
        restTimeLeft,
        isRestTimerMinimized,
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
        setMinimizedRest,
        adjustRestTime,
        showSuccess,
        completedStats,
        clearSuccess,
        activeView,
        selectedExerciseIndex,
        setWorkoutView,
        isCoachOpen,
        setIsCoachOpen,
        coachMessages,
        setCoachMessages,
        clearCoachMessages
    }), [
        activeSession,
        currentExerciseIndex,
        currentExercise,
        progress,
        isWorkoutComplete,
        isRestTimerActive,
        restTimeLeft,
        isRestTimerMinimized,
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
        setMinimizedRest,
        adjustRestTime,
        showSuccess,
        completedStats,
        clearSuccess,
        activeView,
        selectedExerciseIndex,
        setWorkoutView,
        isCoachOpen,
        setIsCoachOpen,
        coachMessages,
        setCoachMessages,
        clearCoachMessages
    ]);

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

function parseReps(reps: string): number {
    if (reps.includes('-')) {
        const [min] = reps.split('-').map(Number);
        return min || 10;
    }
    return parseInt(reps, 10) || 10;
}
