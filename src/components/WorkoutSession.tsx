import { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ActiveExercise from './ActiveExercise';
import { useWorkout } from '@/context/WorkoutContext';
import { db, Exercise } from '@/lib/db';

interface WorkoutSessionProps {
    routineId: string;
    onClose: () => void;
}

const WorkoutSession = ({ routineId, onClose }: WorkoutSessionProps) => {
    const {
        activeSession,
        currentExerciseIndex,
        currentExercise,
        progress,
        isWorkoutComplete,
        isRestTimerActive,
        completeSet,
        addExtraSet,
        updatePersonalNote,
        nextExercise,
        previousExercise,
        skipRest,
        endWorkout,
        abandonWorkout,
        getExerciseUnit,
        setExerciseUnit,
    } = useWorkout();

    const [showEndDialog, setShowEndDialog] = useState(false);
    const [exerciseDetail, setExerciseDetail] = useState<Exercise | null>(null);

    // Load exercise details for current exercise
    useEffect(() => {
        const loadExerciseDetail = async () => {
            if (!currentExercise) return;
            const exercise = await db.exercises.get(currentExercise.exerciseId);
            setExerciseDetail(exercise || null);
        };
        loadExerciseDetail();
    }, [currentExercise]);

    // Find current exercise in active session
    const currentSet = activeSession?.exercises[currentExerciseIndex];

    if (!activeSession || !currentExercise || !currentSet) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 gradient-red rounded-full animate-pulse-glow" />
            </div>
        );
    }

    const handleSetComplete = async (setId: number, weight: number, reps: number, unit: 'kg' | 'lbs') => {
        await completeSet(currentExerciseIndex, setId, weight, reps, unit);
    };

    const handleAddSet = () => {
        addExtraSet(currentExerciseIndex);
    };

    const handleNoteChange = (note: string) => {
        updatePersonalNote(currentExerciseIndex, note);
    };

    const handleEndWorkout = async () => {
        await endWorkout();
        setShowEndDialog(false);
        onClose();
    };

    const handleAbandonWorkout = async () => {
        await abandonWorkout();
        setShowEndDialog(false);
        onClose();
    };

    return (
        <div className="relative">
            {/* Close button */}
            <button
                onClick={() => setShowEndDialog(true)}
                className="fixed top-4 right-4 z-50 p-2 rounded-full bg-background hover:bg-white/10 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>

            {/* Progress indicator */}
            <div className="fixed top-4 left-4 right-20 z-40">
                <div className="flex items-center justify-between text-sm text-white mb-1">
                    <span>{progress.completed}/{progress.total} sets</span>
                    <span>{Math.round((progress.completed / progress.total) * 100)}%</span>
                </div>
                <div className="h-2 bg-background/80 backdrop-blur-md rounded-full overflow-hidden">
                    <div
                        className="h-full gradient-red transition-all duration-300"
                        style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                    />
                </div>
            </div>

            {/* Active Exercise */}
            <ActiveExercise
                exercise={{
                    ...exerciseDetail!,
                    name: currentExercise.exerciseName,
                    primaryMuscles: exerciseDetail?.primaryMuscles || [],
                    secondaryMuscles: exerciseDetail?.secondaryMuscles || [],
                    sets: currentExercise.sets,
                    tutorialUrl: exerciseDetail?.tutorialUrl,
                    tips: exerciseDetail?.tips,
                    beginnerFriendlyInstructions: exerciseDetail?.beginnerFriendlyInstructions,
                    commonMistakes: exerciseDetail?.commonMistakes,
                    injuryPreventionTips: exerciseDetail?.injuryPreventionTips,
                    formCues: exerciseDetail?.formCues,
                }}
                currentIndex={currentExerciseIndex}
                totalExercises={activeSession.exercises.length}
                onPrevious={previousExercise}
                onNext={nextExercise}
                onSetComplete={handleSetComplete}
                onAddSet={handleAddSet}
                unit={getExerciseUnit(currentExercise.exerciseId)}
                onUnitChange={(unit) => setExerciseUnit(currentExercise.exerciseId, unit)}
                personalNote={currentExercise.personalNote}
                onNoteChange={handleNoteChange}
            />

            {/* End Workout Button (when workout is complete) */}
            {isWorkoutComplete && (
                <div className="fixed bottom-24 left-4 right-4 z-30">
                    <Button
                        variant="gradient"
                        size="lg"
                        onClick={() => setShowEndDialog(true)}
                        className="w-full h-14 text-lg font-bold glow-red"
                    >
                        <CheckCircle2 className="w-6 h-6 mr-2" />
                        Workout Complete!
                    </Button>
                </div>
            )}

            {/* Rest Timer (controlled by context) */}
            {isRestTimerActive && !isWorkoutComplete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-background rounded-3xl p-8 max-w-sm w-full mx-4 text-center">
                        <p className="text-muted-foreground mb-4">Rest Time</p>
                        <p className="text-6xl font-bold gradient-red-text mb-6">1:30</p>
                        <Button variant="glass" onClick={skipRest} className="w-full">
                            Skip Rest
                        </Button>
                    </div>
                </div>
            )}

            {/* End Workout Dialog */}
            <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
                <DialogContent className="glass border-white/10 max-w-sm">
                    <DialogHeader>
                        <DialogTitle>End Workout?</DialogTitle>
                        <DialogDescription>
                            {isWorkoutComplete
                                ? 'Great job! You completed all sets.'
                                : 'You still have sets remaining. Are you sure you want to end?'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 mt-4">
                        {isWorkoutComplete ? (
                            <Button
                                variant="gradient"
                                onClick={handleEndWorkout}
                                className="w-full"
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Finish Workout
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="gradient"
                                    onClick={handleEndWorkout}
                                    className="w-full"
                                >
                                    Finish Anyway
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleAbandonWorkout}
                                    className="w-full"
                                >
                                    Abandon Workout
                                </Button>
                            </>
                        )}
                        <Button
                            variant="ghost"
                            onClick={() => setShowEndDialog(false)}
                            className="w-full"
                        >
                            Continue Workout
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WorkoutSession;
