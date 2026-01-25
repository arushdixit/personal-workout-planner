import { useState, useEffect } from 'react';
import { X, CheckCircle2, ChevronRight, Dumbbell, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ExerciseDetail from './ExerciseDetail';
import WorkoutTimer from './WorkoutTimer';
import { useWorkout } from '@/context/WorkoutContext';
import { db, Exercise } from '@/lib/db';
import { cn } from '@/lib/utils';

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

    const [view, setView] = useState<'list' | 'detail'>('list');
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [showEndDialog, setShowEndDialog] = useState(false);
    const [exerciseDetail, setExerciseDetail] = useState<Exercise | null>(null);

    // Load exercise details for selected exercise
    useEffect(() => {
        const loadExerciseDetail = async () => {
            if (selectedIndex === null || !activeSession) return;
            const currentEx = activeSession.exercises[selectedIndex];

            // Try by ID first
            let exercise = await db.exercises.get(currentEx.exerciseId);

            // Fallback to name-based lookup if ID doesn't match
            if (!exercise && currentEx.exerciseName) {
                exercise = await db.exercises.where('name').equalsIgnoreCase(currentEx.exerciseName).first();
            }

            setExerciseDetail(exercise || null);
        };
        loadExerciseDetail();
    }, [selectedIndex, activeSession]);

    if (!activeSession) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 gradient-red rounded-full animate-pulse-glow" />
            </div>
        );
    }

    const handleSetComplete = async (exerciseIdx: number, setId: number, weight: number, reps: number, unit: 'kg' | 'lbs') => {
        await completeSet(exerciseIdx, setId, weight, reps, unit);
    };

    const handleAddSet = (exerciseIdx: number) => {
        addExtraSet(exerciseIdx);
    };

    const handleNoteChange = (exerciseIdx: number, note: string) => {
        updatePersonalNote(exerciseIdx, note);
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
        <div className="relative min-h-screen bg-background">
            {/* Top Bar with Timer and Close */}
            <div className="fixed top-0 left-0 right-0 z-50 p-4 flex items-center justify-between bg-background/80 backdrop-blur-xl border-b border-white/5">
                {view === 'detail' ? (
                    <button
                        onClick={() => setView('list')}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                        aria-label="Back to workout list"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                ) : (
                    <div className="w-10" />
                )}

                <WorkoutTimer startTime={activeSession.startTime} />

                <button
                    onClick={() => setShowEndDialog(true)}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="pt-24 pb-32 px-4">
                {view === 'list' ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-6">
                            <h2 className="text-3xl font-bold mb-1">{activeSession.routineName}</h2>
                            <p className="text-muted-foreground">{activeSession.exercises.length} exercises to go</p>
                        </div>

                        <div className="grid gap-3">
                            {activeSession.exercises.map((ex, idx) => {
                                const completedSets = ex.sets.filter(s => s.completed).length;
                                const isAllCompleted = completedSets === ex.sets.length && ex.sets.length > 0;

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setSelectedIndex(idx);
                                            setView('detail');
                                        }}
                                        className={cn(
                                            "w-full glass-card p-4 flex items-center gap-4 transition-all hover:bg-white/10 group text-left",
                                            isAllCompleted && "opacity-60"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                                            isAllCompleted ? "bg-emerald-500/20 text-emerald-500" : "bg-white/5 text-muted-foreground"
                                        )}>
                                            {isAllCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Dumbbell className="w-6 h-6" />}
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg">{ex.exerciseName}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {completedSets} / {ex.sets.length} sets completed
                                            </p>
                                        </div>

                                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    selectedIndex !== null && exerciseDetail && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <ExerciseDetail
                                exercise={{
                                    ...exerciseDetail,
                                    name: activeSession.exercises[selectedIndex].exerciseName,
                                    primaryMuscles: exerciseDetail.primaryMuscles || [],
                                    secondaryMuscles: exerciseDetail.secondaryMuscles || [],
                                    sets: activeSession.exercises[selectedIndex].sets,
                                    tutorialUrl: exerciseDetail.tutorialUrl,
                                    tips: exerciseDetail.tips,
                                    beginnerFriendlyInstructions: exerciseDetail.beginnerFriendlyInstructions,
                                    commonMistakes: exerciseDetail.commonMistakes,
                                    injuryPreventionTips: exerciseDetail.injuryPreventionTips,
                                    formCues: exerciseDetail.formCues,
                                }}
                                open={view === 'detail'}
                                onOpenChange={(open) => !open && setView('list')}
                                workoutMode={true}
                                onSetComplete={(setId, weight, reps, unit) => handleSetComplete(selectedIndex, setId, weight, reps, unit)}
                                onAddSet={() => handleAddSet(selectedIndex)}
                                unit={getExerciseUnit(activeSession.exercises[selectedIndex].exerciseId)}
                                onUnitChange={(unit) => setExerciseUnit(activeSession.exercises[selectedIndex].exerciseId, unit)}
                                personalNote={activeSession.exercises[selectedIndex].personalNote}
                                onNoteChange={(note) => handleNoteChange(selectedIndex, note)}
                            />
                        </div>
                    )
                )}
            </div>

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
