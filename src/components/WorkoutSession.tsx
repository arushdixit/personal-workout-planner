import { useState, useEffect } from 'react';
import { X, CheckCircle2, ChevronRight, Dumbbell, ChevronLeft, Timer, Trophy, Star, ArrowRight, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ExerciseDetail from './ExerciseDetail';
import WorkoutTimer from './WorkoutTimer';
import RestTimer, { MinimizedRestTimer } from './RestTimer';
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
        restTimeLeft,
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
    const [showSuccess, setShowSuccess] = useState(false);
    const [completedStats, setCompletedStats] = useState<{ duration: number, completedSets: number, totalSets: number } | null>(null);
    const [endDialogType, setEndDialogType] = useState<'complete' | 'abandon'>('complete');
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

    if (!activeSession && !showSuccess) {
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
        const stats = await endWorkout();
        if (stats) setCompletedStats(stats);
        setShowEndDialog(false);
        setShowSuccess(true);
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

            <div className="pt-24 pb-32 px-4 flex-1">
                {activeSession ? (
                    view === 'list' ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-6">
                                <h2 className="text-3xl font-bold mb-1">{activeSession.routineName}</h2>
                                <p className="text-muted-foreground">{activeSession.exercises.length} exercises total</p>
                            </div>

                            <div className="grid gap-3">
                                {activeSession.exercises.map((ex, idx) => {
                                    const completedSets = ex.sets.filter(s => s.completed).length;
                                    const isAllCompleted = completedSets === ex.sets.length && ex.sets.length > 0;
                                    const isCurrentlyResting = isRestTimerActive && idx === currentExerciseIndex;

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setSelectedIndex(idx);
                                                setView('detail');
                                            }}
                                            className={cn(
                                                "w-full glass-card p-4 flex items-center gap-4 transition-all hover:bg-white/10 group text-left relative overflow-hidden",
                                                isAllCompleted
                                                    ? "border-emerald-500/30 bg-emerald-500/5 ring-1 ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                                                    : "border-white/5",
                                                isCurrentlyResting && "border-primary/40 bg-primary/5"
                                            )}
                                        >
                                            {isAllCompleted && (
                                                <div className="absolute right-0 top-0 w-24 h-24 -mr-8 -mt-8 bg-emerald-500/10 rounded-full blur-2xl animate-pulse" />
                                            )}

                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors relative z-10",
                                                isAllCompleted ? "bg-emerald-500/20 text-emerald-500" : "bg-white/5 text-muted-foreground",
                                                isCurrentlyResting && "bg-primary/20 text-primary"
                                            )}>
                                                {isAllCompleted ? <CheckCircle2 className="w-6 h-6 animate-in zoom-in duration-300" /> : <Dumbbell className="w-6 h-6" />}
                                            </div>

                                            <div className="flex-1 relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <h3 className={cn(
                                                        "font-semibold text-lg transition-colors",
                                                        isAllCompleted ? "text-emerald-400" : "text-foreground"
                                                    )}>
                                                        {ex.exerciseName}
                                                    </h3>
                                                    {isCurrentlyResting && (
                                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded-full animate-pulse">
                                                            <Timer className="w-3 h-3 text-primary" />
                                                            <span className="text-[10px] font-black text-primary tabular-nums">{restTimeLeft}s</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {completedSets} / {ex.sets.length} sets completed
                                                </p>
                                            </div>

                                            <ChevronRight className={cn(
                                                "w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform relative z-10",
                                                isAllCompleted && "text-emerald-500"
                                            )} />
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
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] animate-pulse">
                        <Trophy className="w-12 h-12 text-primary/20 mb-4" />
                        <p className="text-muted-foreground">Saving your progress...</p>
                    </div>
                )}
            </div>

            {/* Workout Controls (when in list view) */}
            {view === 'list' && !isWorkoutComplete && (
                <div className="fixed bottom-6 left-0 right-0 z-30 px-4 pb-safe">
                    <div className="flex gap-3 max-w-lg mx-auto">
                        <Button
                            variant="destructive"
                            size="lg"
                            onClick={() => {
                                const completedSets = progress.completed;
                                if (completedSets > 0) {
                                    // If any sets are completed, ask for confirmation
                                    setShowEndDialog(true);
                                    setEndDialogType('abandon');
                                } else {
                                    handleAbandonWorkout();
                                }
                            }}
                            className="flex-1 h-14 text-base font-bold whitespace-normal leading-tight px-2 rounded-2xl"
                        >
                            Cancel Workout
                        </Button>
                        <Button
                            variant="gradient"
                            size="lg"
                            onClick={() => {
                                setShowEndDialog(true);
                                setEndDialogType('complete');
                            }}
                            className="flex-1 h-14 text-base font-bold whitespace-normal leading-tight px-2 shadow-xl glow-red rounded-2xl"
                        >
                            <CheckCircle2 className="w-5 h-5 mr-1" />
                            Finish Workout
                        </Button>
                    </div>
                </div>
            )}

            {/* End Workout Button (when workout is complete) */}
            {isWorkoutComplete && (
                <div className="fixed bottom-6 left-0 right-0 z-30 px-4 pb-safe">
                    <Button
                        variant="gradient"
                        size="lg"
                        onClick={() => {
                            setShowEndDialog(true);
                            setEndDialogType('complete');
                        }}
                        className="w-full max-w-lg mx-auto h-14 text-lg font-bold glow-red block rounded-2xl"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-6 h-6" />
                            Workout Complete!
                        </div>
                    </Button>
                </div>
            )}

            {/* Rest Timer Overlay */}
            <RestTimer />

            {/* Minimized Rest Timer */}
            <MinimizedRestTimer />

            {/* End Workout Dialog */}
            <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
                {/* ... existing dialog content ... */}
                <DialogContent className="glass border-white/10 max-w-sm rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle>
                            {endDialogType === 'complete' ? 'Finish Workout?' : 'Cancel Workout?'}
                        </DialogTitle>
                        <DialogDescription>
                            {endDialogType === 'complete'
                                ? (isWorkoutComplete
                                    ? 'Great job! You completed all sets.'
                                    : 'You still have sets remaining. Are you sure you want to finish?')
                                : 'Are you sure you want to cancel? Your progress for this session will be lost.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 mt-4">
                        {endDialogType === 'complete' ? (
                            <Button
                                variant="gradient"
                                onClick={handleEndWorkout}
                                className="w-full h-12 rounded-xl font-bold"
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                {isWorkoutComplete ? 'Finish Workout' : 'Finish Anyway'}
                            </Button>
                        ) : (
                            <Button
                                variant="destructive"
                                onClick={handleAbandonWorkout}
                                className="w-full h-12 rounded-xl font-black"
                            >
                                YES, ABANDON WORKOUT
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            onClick={() => setShowEndDialog(false)}
                            className="w-full h-12 rounded-xl"
                        >
                            Continue Workout
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Congratulation Screen */}
            <Dialog open={showSuccess} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-md bg-background border-none p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
                    <div className="relative pt-12 pb-8 px-6 text-center space-y-8 animate-in zoom-in-95 duration-500">
                        {/* Animated Background Orbs */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -z-10 animate-pulse" />

                        {/* Success Icon */}
                        <div className="relative inline-flex">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                            <div className="relative w-24 h-24 bg-gradient-to-tr from-primary to-rose-500 rounded-3xl flex items-center justify-center rotate-12 shadow-2xl">
                                <Trophy className="w-12 h-12 text-white -rotate-12" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-lg border-4 border-background animate-bounce">
                                <Star className="w-4 h-4 text-white fill-current" />
                            </div>
                        </div>

                        {/* Text */}
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black tracking-tight text-foreground">WORKOUT COMPLETE!</h2>
                            <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">You're crushing it today</p>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="glass-card p-4 space-y-1">
                                <div className="flex items-center justify-center gap-2 text-primary">
                                    <Activity className="w-4 h-4" />
                                    <span className="text-2xl font-black">{completedStats?.completedSets ?? progress.completed}</span>
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Sets Logged</p>
                            </div>
                            <div className="glass-card p-4 space-y-1">
                                <div className="flex items-center justify-center gap-2 text-primary">
                                    <Timer className="w-4 h-4" />
                                    <span className="text-2xl font-black">{Math.floor((completedStats?.duration ?? (activeSession?.duration || 0)) / 60)}m</span>
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Duration</p>
                            </div>
                        </div>

                        {/* Motivation */}
                        <div className="p-6 glass-card border-primary/20 bg-primary/5 rounded-3xl">
                            <p className="text-sm font-medium italic text-foreground/80 lowercase first-letter:uppercase">
                                "The only bad workout is the one that didn't happen. Great job showing up."
                            </p>
                        </div>

                        <Button
                            variant="gradient"
                            onClick={onClose}
                            className="w-full h-16 rounded-[1.5rem] text-lg font-black shadow-[0_10px_30px_rgba(239,68,68,0.3)] hover:scale-[1.02] active:scale-95 transition-all group"
                        >
                            <span className="flex items-center gap-2">
                                Back to Dashboard
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WorkoutSession;
