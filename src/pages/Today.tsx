import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Calendar, Clock, Dumbbell, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import WorkoutHero from '@/components/WorkoutHero';
import WorkoutExerciseCard from '@/components/WorkoutExerciseCard';
import RoutineSelectorModal from '@/components/RoutineSelectorModal';
import ExerciseDetail from '@/components/ExerciseDetail';
import ExerciseWizard from '@/components/ExerciseWizard';
import { useUser } from '@/context/UserContext';
import { useWorkout } from '@/context/WorkoutContext';
import { determineTodaysRoutine, calculateWorkoutDuration } from '@/lib/routineCycling';
import { fetchRoutines } from '@/lib/routineCache';
import { db, Routine, Exercise } from '@/lib/db';
import { cn } from '@/lib/utils';

interface TodayPageProps {
    onStartWorkout: () => void;
    onViewExercise?: (exerciseId: number) => void;
    onNavigateToRoutines?: () => void;
}

const TodayPage = (props: TodayPageProps) => {
    const { onStartWorkout, onNavigateToRoutines } = props;
    const { currentUser } = useUser();
    const { activeSession, startWorkout } = useWorkout();
    
    const [todaysRoutine, setTodaysRoutine] = useState<Routine | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showRoutineSelector, setShowRoutineSelector] = useState(false);
    const [exerciseDetails, setExerciseDetails] = useState<Record<number, Exercise>>({});
    const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);
    const [showWizard, setShowWizard] = useState(false);
    const [editingExercise, setEditingExercise] = useState<Exercise | undefined>();

    // Load today's routine on mount
    useEffect(() => {
        loadTodaysRoutine();
    }, [currentUser?.id, currentUser?.supabaseUserId, currentUser?.activeSplit, currentUser?.lastCompletedRoutineId]);

    // Load exercise details for the routine
    useEffect(() => {
        if (!todaysRoutine) return;

        const loadExerciseDetails = async () => {
            const details: Record<number, Exercise> = {};
            for (const ex of todaysRoutine.exercises) {
                const exercise = await db.exercises.get(ex.exerciseId);
                if (exercise) {
                    details[ex.exerciseId] = exercise;
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

        if (currentUser.supabaseUserId) {
            await fetchRoutines(currentUser.supabaseUserId);
        }

        const result = await determineTodaysRoutine(
            currentUser.id,
            currentUser.supabaseUserId,
            currentUser.activeSplit || 'PPL',
            currentUser.lastCompletedRoutineId
        );

        setTodaysRoutine(result.routine);
        setIsLoading(false);
    };

    const handleStartWorkout = useCallback(async () => {
        if (!todaysRoutine || !currentUser?.id) return;

        await startWorkout(todaysRoutine, currentUser.id, currentUser.supabaseUserId || '');
        onStartWorkout();
    }, [todaysRoutine, currentUser, startWorkout, onStartWorkout]);

    const handleRoutineSelect = (routine: Routine) => {
        setTodaysRoutine(routine);
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

        if (editedExerciseId && viewingExercise?.id === editedExerciseId) {
            const updated = await db.exercises.get(editedExerciseId);
            if (updated) setViewingExercise(updated);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
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
        <div className="space-y-6 animate-slide-up">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold mb-2">
                    {getGreeting()}, {currentUser?.name}
                </h1>
                <p className="text-muted-foreground">
                    {todaysRoutine ? todaysRoutine.name : 'No routine assigned'}
                </p>
            </div>

            {/* Workout Hero */}
            {todaysRoutine ? (
                <WorkoutHero
                    greeting={getGreeting()}
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
                    onClick={handleCreateNewRoutine}
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
                        const exerciseDetail = exerciseDetails[exercise.exerciseId];
                        return (
                            <WorkoutExerciseCard
                                key={exercise.exerciseId}
                                exercise={exercise}
                                exerciseDetail={exerciseDetail}
                                isNext={index === 0}
                                onClick={() => exerciseDetail && setViewingExercise(exerciseDetail)}
                            />
                        );
                    })}
                </div>
            )}

            {/* Routine Selector Modal */}
            <RoutineSelectorModal
                open={showRoutineSelector}
                onOpenChange={setShowRoutineSelector}
                onSelect={handleRoutineSelect}
                onCreateNew={handleCreateNewRoutine}
            />

            {/* Exercise Detail Modal */}
            <ExerciseDetail
                exercise={viewingExercise || ({} as Exercise)}
                open={!!viewingExercise}
                onOpenChange={(open) => {
                    if (!open) setViewingExercise(null);
                }}
                onEdit={viewingExercise?.source === 'exercemus' ? () => {
                    if (document.activeElement) {
                        (document.activeElement as HTMLElement).blur();
                    }
                    setEditingExercise(viewingExercise);
                    setShowWizard(true);
                } : undefined}
            />

            {/* Exercise Wizard Modal */}
            <ExerciseWizard
                exercise={editingExercise}
                open={showWizard}
                onOpenChange={(open) => {
                    setShowWizard(open);
                    if (!open) setEditingExercise(undefined);
                }}
                onComplete={handleWizardComplete}
            />
        </div>
    );
};

export default TodayPage;
