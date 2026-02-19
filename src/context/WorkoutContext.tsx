import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo, useRef } from 'react';
import { db, WorkoutSession, WorkoutSessionExercise, WorkoutSet, LocalRoutine } from '@/lib/db';
import { updateLastCompletedRoutine } from '@/lib/routineCycling';
import { useUser } from './UserContext';
import { queueWorkoutOperation } from '@/lib/workoutSyncManager';
import { v4 as uuidv4 } from 'uuid';

/** Play a short double-beep using the Web Audio API */
function playRestCompleteSound() {
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const playBeep = (startTime: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = 880; // A5 note
            gain.gain.setValueAtTime(0.6, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
            osc.start(startTime);
            osc.stop(startTime + 0.4);
        };
        playBeep(ctx.currentTime);
        playBeep(ctx.currentTime + 0.5);
        // Close context after sound finishes
        setTimeout(() => ctx.close(), 1200);
    } catch (e) {
        // Silently fail if audio is not available
    }
}

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
                    // AUTO-ABANDON logic: Check if session is older than 2 hours
                    const startTime = new Date(session.startTime).getTime();
                    const now = Date.now();
                    const twoHoursInMs = 2 * 60 * 60 * 1000;

                    if (now - startTime > twoHoursInMs) {
                        console.log('[WorkoutContext] Auto-abandoning stale session:', session.id);
                        await db.workout_sessions.update(session.id!, {
                            status: 'abandoned',
                            endTime: new Date().toISOString(),
                        });
                        await queueWorkoutOperation('abandon', session.id!);
                        setActiveSession(null);
                        return;
                    }

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

    // Timestamp-based rest timer — accurate even after screen lock
    const timerEndAtRef = useRef<number | null>(null);
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    /** Acquire Wake Lock to prevent screen sleeping during rest */
    const acquireWakeLock = useCallback(async () => {
        if (!('wakeLock' in navigator)) return;
        try {
            wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (_) {
            // Wake lock not granted — silently ignore (e.g. document not visible)
        }
    }, []);

    const releaseWakeLock = useCallback(() => {
        if (wakeLockRef.current) {
            wakeLockRef.current.release().catch(() => { });
            wakeLockRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!isRestTimerActive) {
            timerEndAtRef.current = null;
            releaseWakeLock();
            return;
        }

        // Set the absolute end timestamp when timer first becomes active
        if (timerEndAtRef.current === null) {
            timerEndAtRef.current = Date.now() + restTimeLeft * 1000;
        }

        acquireWakeLock();

        const tick = () => {
            const remaining = Math.max(0, Math.round((timerEndAtRef.current! - Date.now()) / 1000));
            setRestTimeLeft(remaining);
            if (remaining <= 0) {
                setIsRestTimerActive(false);
                timerEndAtRef.current = null;
                releaseWakeLock();
                playRestCompleteSound();
            }
        };

        // Tick every 250ms for smooth display
        const interval = setInterval(tick, 250);

        // Resync immediately when screen is unlocked / app comes back to foreground
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && timerEndAtRef.current !== null) {
                tick();
                // Re-acquire wake lock if lost (e.g. brief screen-off)
                if (!wakeLockRef.current) acquireWakeLock();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
        // We intentionally only re-run when isRestTimerActive changes, not on every restTimeLeft tick
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRestTimerActive]);

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

        // Only fetch the most recent sessions — enough to find last performance per exercise,
        // without loading the entire history into memory (which grows forever)
        const recentSessions = await db.workout_sessions
            .where('userId')
            .equals(userId)
            .reverse()
            .filter(s => s.status === 'completed')
            .limit(15)
            .toArray();

        const exercises = await Promise.all(routine.exercises.map(async (ex, index) => {
            // Filter in memory — recentSessions is already newest-first from .reverse()
            const relevantSessions = recentSessions
                .filter(s => s.exercises.some(e => e.exerciseId === ex.exerciseId));

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
        // Always read from DB to get the most up-to-date state (avoids stale closure on first call)
        const session = await db.workout_sessions.get(activeSession.id!);
        if (!session) return;

        const exercise = session.exercises[exerciseIndex];
        const set = exercise.sets.find(s => s.id === setId);
        const wasAlreadyCompleted = set?.completed === true;

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
                        return { ...s, weight, reps, unit };
                    }
                    return s;
                })
            };
        });

        await db.workout_sessions.update(session.id!, { exercises: updatedExercises });
        // Use functional update form to guarantee we merge into the latest React state,
        // not the potentially-stale `session` snapshot from the beginning of this call.
        setActiveSession(prev => prev ? { ...prev, exercises: updatedExercises } : prev);

        // Only trigger rest timer if it's the first time logging this set
        if (!wasAlreadyCompleted) {
            const restSeconds = exercise.restSeconds || 90;
            // Reset the end-time reference so the new timer gets a fresh anchor
            timerEndAtRef.current = Date.now() + restSeconds * 1000;
            setRestTimeLeft(restSeconds);
            setIsRestTimerActive(true);
            setIsRestTimerMinimized(false);
        }

        await queueWorkoutOperation('set_complete', session.id!, {
            setId,
            reps,
            weight,
            exerciseOrder: exercise.order,
            setNumber: set?.setNumber
        });
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

        // Trigger sync
        const exercise = updatedExercises[exerciseIndex];
        const lastSet = exercise.sets[exercise.sets.length - 1];
        queueWorkoutOperation('add_set', activeSession.id!, {
            exerciseOrder: exercise.order,
            setNumber: lastSet.setNumber,
            unit: lastSet.unit
        }).catch(err => console.error('[WorkoutContext] Failed to queue set add sync:', err));
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
        timerEndAtRef.current = null;
        setIsRestTimerActive(false);
        setRestTimeLeft(0);
        releaseWakeLock();
    }, [releaseWakeLock]);

    const setMinimizedRest = useCallback((minimized: boolean) => {
        setIsRestTimerMinimized(minimized);
    }, []);

    const adjustRestTime = useCallback((delta: number) => {
        // Shift the absolute end timestamp so the timestamp-based timer stays in sync
        if (timerEndAtRef.current !== null) {
            timerEndAtRef.current = timerEndAtRef.current + delta * 1000;
        }
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
        timerEndAtRef.current = null;
        setIsRestTimerActive(false);
        releaseWakeLock();
    }, [activeSession, progress, refreshUsers, releaseWakeLock]);

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
        timerEndAtRef.current = null;
        setIsRestTimerActive(false);
        releaseWakeLock();
    }, [activeSession, releaseWakeLock]);

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
