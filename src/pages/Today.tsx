import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar, Clock, Dumbbell, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import WorkoutHero from '@/components/WorkoutHero';
import WorkoutExerciseCard from '@/components/WorkoutExerciseCard';

const RoutineSelectorModal = lazy(() => import('@/components/RoutineSelectorModal'));
const ExerciseDetail = lazy(() => import('@/components/ExerciseDetail'));
const ExerciseWizard = lazy(() => import('@/components/ExerciseWizard'));
import { useUser } from '@/context/UserContext';
import { useWorkout } from '@/context/WorkoutContext';
import { determineTodaysRoutine, calculateWorkoutDuration } from '@/lib/routineCycling';
import { fetchRoutines } from '@/lib/routineCache';
import { db, LocalRoutine, Exercise, getExerciseByRef } from '@/lib/db';
import { cn } from '@/lib/utils';

const ROUTINE_CACHE_KEY = 'prolifts_cached_routine';

const getCachedRoutine = (): LocalRoutine | null => {
    try {
        const saved = localStorage.getItem(ROUTINE_CACHE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
};

const setCachedRoutine = (routine: LocalRoutine | null) => {
    try {
        if (routine) {
            localStorage.setItem(ROUTINE_CACHE_KEY, JSON.stringify(routine));
        } else {
            localStorage.removeItem(ROUTINE_CACHE_KEY);
        }
    } catch {}
};

interface TodayPageProps {
    onStartWorkout: () => void;
    onViewExercise?: (exerciseId: number, fromTab?: string) => void;
    onViewExerciseInline?: (exercise: Exercise) => void;
    onNavigateToRoutines?: () => void;
}

const TodayPage = (props: TodayPageProps) => {
    const { onStartWorkout, onViewExercise, onViewExerciseInline, onNavigateToRoutines } = props;
    const { currentUser } = useUser();
    const { activeSession, startWorkout } = useWorkout();

    const cachedRoutine = getCachedRoutine();
    const [todaysRoutine, setTodaysRoutine] = useState<LocalRoutine | null>(cachedRoutine);
    const [isLoading, setIsLoading] = useState<boolean>(!cachedRoutine);
    const [showRoutineSelector, setShowRoutineSelector] = useState(false);
    const [exerciseDetails, setExerciseDetails] = useState<Record<number, Exercise>>({});
    const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);
    const [showWizard, setShowWizard] = useState(false);
    const [editingExercise, setEditingExercise] = useState<Exercise | undefined>();
    const [manuallySelectedRoutine, setManuallySelectedRoutine] = useState(false);

    // Load today's routine on mount or when user changes
    useEffect(() => {
        // Don't reload if user manually selected a routine
        if (manuallySelectedRoutine) return;

        loadTodaysRoutine();
    }, [currentUser?.id, currentUser?.supabaseUserId]);

    // Reload routine when a workout is completed (lastCompletedRoutineId changes)
    useEffect(() => {
        if (manuallySelectedRoutine && currentUser?.lastCompletedRoutineId) {
            // User completed a workout, reset manual selection and reload
            setManuallySelectedRoutine(false);
            loadTodaysRoutine();
        }
    }, [currentUser?.lastCompletedRoutineId]);

    // Load exercise details for the routine
    useEffect(() => {
        if (!todaysRoutine) return;

        const loadExerciseDetails = async () => {
            const details: Record<number, Exercise> = {};
            for (const ex of todaysRoutine.exercises) {
                // Name lookup first to ensure cross-device ID mapping correctness
                const exercise = await getExerciseByRef(ex.exerciseId, ex.exerciseName);

                if (exercise && exercise.id) {
                    details[ex.exerciseId] = exercise;
                    details[exercise.id] = exercise;
                }
            }
            setExerciseDetails(details);
        };

        loadExerciseDetails();
    }, [todaysRoutine]);

    const loadTodaysRoutine = async () => {
        if (!currentUser?.id) {
            setIsLoading(false);
            return;
        }

        try {
            // Query IndexedDB in background — UI is already painted from localStorage cache
            const initialResult = await determineTodaysRoutine(
                currentUser.id,
                currentUser.supabaseUserId,
                currentUser.activeSplit || 'PPL',
                currentUser.lastCompletedRoutineId
            );

            if (initialResult.routine) {
                setTodaysRoutine(initialResult.routine);
                setCachedRoutine(initialResult.routine);
            } else {
                setCachedRoutine(null);
            }
            setIsLoading(false);

            // Fetch remote routines in background without blocking
            if (currentUser.supabaseUserId) {
                fetchRoutines(currentUser.supabaseUserId).then(async () => {
                    const finalResult = await determineTodaysRoutine(
                        currentUser.id,
                        currentUser.supabaseUserId,
                        currentUser.activeSplit || 'PPL',
                        currentUser.lastCompletedRoutineId
                    );
                    if (finalResult.routine) {
                        setTodaysRoutine(finalResult.routine);
                        setCachedRoutine(finalResult.routine);
                    }
                }).catch(console.error);
            }
        } catch (error) {
            console.error('[Today] Error loading routine:', error);
            setIsLoading(false);
        } finally {
            setManuallySelectedRoutine(false);
        }
    };

    const handleStartWorkout = useCallback(async () => {
        if (!todaysRoutine || !currentUser?.id) return;

        await startWorkout(todaysRoutine, currentUser.id, currentUser.supabaseUserId || '');
        onStartWorkout();
    }, [todaysRoutine, currentUser, startWorkout, onStartWorkout]);

    const handleRoutineSelect = (routine: LocalRoutine) => {
        setTodaysRoutine(routine);
        setCachedRoutine(routine);
        setManuallySelectedRoutine(true); // Mark as manually selected
        setShowRoutineSelector(false);
    };

    const handleCreateNewRoutine = () => {
        // Navigate directly to routines tab and show the routine builder
        if (onNavigateToRoutines) {
            onNavigateToRoutines();
        }
    };

    const handleWizardComplete = async () => {
        setShowWizard(false);
        const editedExerciseId = editingExercise?.id;
        setEditingExercise(undefined);

        if (editedExerciseId) {
            const updated = await db.exercises.get(editedExerciseId);
            if (updated) {
                // Update local cache so the list reflects changes immediately
                setExerciseDetails(prev => ({ ...prev, [editedExerciseId]: updated }));
                if (viewingExercise?.id === editedExerciseId) setViewingExercise(updated);
            }
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 16) return 'Good afternoon';
        return 'Good evening';
    };

    const estimatedTime = todaysRoutine
        ? calculateWorkoutDuration(todaysRoutine)
        : 0;

    const exerciseCount = todaysRoutine?.exercises.length || 0;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 gradient-red rounded-full animate-pulse-glow" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold mb-2">
                    {getGreeting()}, {currentUser?.name}
                </h1>

            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={todaysRoutine?.id || 'empty-routine'}
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20, scale: 0.98 }}
                    transition={{
                        duration: 0.2,
                        ease: [0.23, 1, 0.32, 1]
                    }}
                    className="space-y-6"
                >
                    {/* Workout Hero */}
                    {todaysRoutine ? (
                        <WorkoutHero
                            workoutName={todaysRoutine.name}
                            exercises={exerciseCount}
                            estimatedTime={estimatedTime}
                            onStart={handleStartWorkout}
                        />
                    ) : (
                        <Card className="glass-card p-8 text-center space-y-4">
                            <div className="w-16 h-16 mx-auto rounded-full gradient-red flex items-center justify-center glow-red">
                                <Dumbbell className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-1">No routine found</h3>
                                <p className="text-muted-foreground text-sm mb-4">
                                    Create a routine to get started with your workouts
                                </p>
                                <Button onClick={handleCreateNewRoutine}>
                                    Create Routine
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Change Routine Button */}
                    {todaysRoutine && (
                        <Button
                            variant="ghost"
                            onClick={() => setShowRoutineSelector(true)}
                            className="w-full justify-between"
                        >
                            <span>Change Routine</span>
                            <ChevronDown className="w-4 h-4" />
                        </Button>
                    )}

                    {/* Exercise List */}
                    {todaysRoutine && todaysRoutine.exercises.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold">Today's Exercises</h3>
                            {todaysRoutine.exercises.map((exercise, index) => {
                                // Find the exercise detail by looking through all details by name first
                                const exerciseDetail = (exercise.exerciseName ? Object.values(exerciseDetails).find(
                                    ex => ex.name.toLowerCase() === exercise.exerciseName.toLowerCase()
                                ) : undefined) || exerciseDetails[exercise.exerciseId];

                                return (
                                    <WorkoutExerciseCard
                                        key={`${todaysRoutine.id}-${exercise.exerciseId}-${index}`}
                                        exercise={exercise}
                                        exerciseDetail={exerciseDetail}
                                        isNext={index === 0}
                                        onClick={async () => {
                                            let detail = exerciseDetail;
                                            if (!detail) {
                                                detail = await getExerciseByRef(exercise.exerciseId, exercise.exerciseName);
                                            }
                                            if (detail && onViewExerciseInline) {
                                                onViewExerciseInline(detail);
                                            }
                                        }}
                                    />
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            <Suspense fallback={null}>
                {showRoutineSelector && (
                    <RoutineSelectorModal
                        open={showRoutineSelector}
                        onOpenChange={setShowRoutineSelector}
                        onSelect={handleRoutineSelect}
                        onCreateNew={handleCreateNewRoutine}
                    />
                )}

                {showWizard && (
                    <ExerciseWizard
                        exercise={editingExercise}
                        open={showWizard}
                        onOpenChange={(open) => {
                            setShowWizard(open);
                            if (!open) setEditingExercise(undefined);
                        }}
                        onComplete={handleWizardComplete}
                    />
                )}
            </Suspense>
        </div>
    );
};

export default TodayPage;
