import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, ChevronRight, Dumbbell, ChevronLeft, Timer, Trophy, Star, ArrowRight, Activity, Flame, Medal, Target, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ExerciseDetail from './ExerciseDetail';
import ExerciseWizard from './ExerciseWizard';
import WorkoutTimer from './WorkoutTimer';
import RestTimer, { MinimizedRestTimer } from './RestTimer';
import { useWorkout } from '@/context/WorkoutContext';
import { useUser } from '@/context/UserContext';
import { db, Exercise } from '@/lib/db';
import { getLastExerciseNote } from '@/lib/workoutSession';
import { cn } from '@/lib/utils';

interface WorkoutSessionProps {
    routineId: string;
    onClose: () => void;
}

const WorkoutSession = ({ routineId, onClose }: WorkoutSessionProps) => {
    const {
        activeSession,
        currentExerciseIndex,
        progress,
        isWorkoutComplete,
        isRestTimerActive,
        restTimeLeft,
        completeSet,
        addExtraSet,
        updatePersonalNote,
        endWorkout,
        abandonWorkout,
        showSuccess,
        completedStats,
        clearSuccess,
        activeView,
        selectedExerciseIndex,
        setWorkoutView,
    } = useWorkout();
    const { currentUser } = useUser();

    // Local UI state
    const [showEndDialog, setShowEndDialog] = useState(false);
    const [endDialogType, setEndDialogType] = useState<'complete' | 'abandon'>('complete');
    const [exerciseDetail, setExerciseDetail] = useState<Exercise | null>(null);
    const [showWizard, setShowWizard] = useState(false);
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
    const [lastSessionNote, setLastSessionNote] = useState<string | undefined>();

    useEffect(() => {
        const loadExerciseDetail = async () => {
            if (selectedExerciseIndex === null || !activeSession) return;
            const currentEx = activeSession.exercises[selectedExerciseIndex];
            let exercise = await db.exercises.get(currentEx.exerciseId);
            if (!exercise && currentEx.exerciseName) {
                exercise = await db.exercises.where('name').equalsIgnoreCase(currentEx.exerciseName).first();
            }
            setExerciseDetail(exercise || null);

            // Load last session note
            if (activeSession.userId) {
                const lastNote = await getLastExerciseNote(activeSession.userId, currentEx.exerciseId);
                setLastSessionNote(lastNote);
            }
        };
        loadExerciseDetail();
    }, [selectedExerciseIndex, activeSession]);

    const handleSetComplete = async (exerciseIdx: number, setId: number, weight: number, reps: number, unit: 'kg' | 'lbs') => {
        await completeSet(exerciseIdx, setId, weight, reps, unit);
    };

    const handleAddSet = (exerciseIdx: number) => {
        addExtraSet(exerciseIdx);
    };

    const handleNoteChange = (exerciseIdx: number, note: string) => {
        updatePersonalNote(exerciseIdx, note);
    };

    const handleClose = useCallback(() => {
        clearSuccess();
        onClose();
    }, [clearSuccess, onClose]);

    // If showing success, render the high-energy victory screen as a top-level override
    if (showSuccess) {
        return (
            <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center p-6 overflow-hidden">
                {/* Dynamic Background Effects */}
                <div className="absolute inset-0 -z-10 bg-black">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.15, 0.3, 0.15]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/40 rounded-full blur-[120px]"
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.1, 0.2, 0.1]
                        }}
                        transition={{ duration: 6, repeat: Infinity, delay: 1 }}
                        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-rose-500/30 rounded-full blur-[100px]"
                    />
                </div>

                <motion.div
                    initial={{ scale: 0.8, y: 40, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: "spring", damping: 20, stiffness: 120 }}
                    className="relative w-full max-w-lg space-y-12 text-center"
                >
                    {/* Hero Section */}
                    <div className="space-y-6">
                        <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", delay: 0.2 }}
                            className="relative inline-block"
                        >
                            <div className="absolute inset-0 bg-primary/60 rounded-[2.5rem] blur-3xl animate-pulse" />
                            <div className="relative w-32 h-32 bg-gradient-to-br from-primary via-rose-500 to-orange-500 rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_60px_rgba(239,68,68,0.6)] border border-white/20">
                                <Trophy className="w-16 h-16 text-white" />
                                <motion.div
                                    animate={{ opacity: [0, 1, 0], scale: [0.8, 1.5, 0.8] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute -top-4 -right-4 w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg border-4 border-background"
                                >
                                    <Star className="w-6 h-6 text-white fill-current" />
                                </motion.div>
                            </div>
                        </motion.div>

                        <div className="space-y-2">
                            <motion.h2
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4, type: "spring" }}
                                className="text-6xl font-black tracking-tighter bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent italic"
                            >
                                VICTORY!
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-primary font-black uppercase tracking-[0.5em] text-sm"
                            >
                                Massive Session Logged
                            </motion.p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="grid grid-cols-2 gap-4"
                    >
                        <div className="glass-card p-6 bg-white/[0.04] border-white/10 space-y-4 hover:bg-white/[0.08] transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-orange-500/30 flex items-center justify-center mx-auto text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                                <Flame className="w-7 h-7" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-4xl font-black text-white tabular-nums">{completedStats?.volume.toLocaleString()}</p>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Kg Moved</p>
                            </div>
                        </div>
                        <div className="glass-card p-6 bg-white/[0.04] border-white/10 space-y-4 hover:bg-white/[0.08] transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-primary/30 flex items-center justify-center mx-auto text-primary shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                                <Activity className="w-7 h-7" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-4xl font-black text-white tabular-nums">{completedStats?.completedSets}</p>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sets Done</p>
                            </div>
                        </div>
                        <div className="glass-card p-6 bg-white/[0.04] border-white/10 space-y-4 hover:bg-white/[0.08] transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                <Medal className="w-7 h-7" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-4xl font-black text-white tabular-nums">{completedStats?.exerciseCount}</p>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Exercises</p>
                            </div>
                        </div>
                        <div className="glass-card p-6 bg-white/[0.04] border-white/10 space-y-4 hover:bg-white/[0.08] transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/30 flex items-center justify-center mx-auto text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                                <Timer className="w-7 h-7" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-4xl font-black text-white tabular-nums">{Math.floor((completedStats?.duration ?? 0) / 60)}m</p>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Duration</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="pt-6"
                    >
                        <Button
                            variant="gradient"
                            onClick={handleClose}
                            className="w-full h-20 rounded-[2.5rem] text-2xl font-black group relative overflow-hidden shadow-[0_20px_50px_rgba(239,68,68,0.5)] active:scale-95 transition-all border border-white/10"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-4">
                                FINISH STRONG
                                <ArrowRight className="w-8 h-8 group-hover:translate-x-3 transition-transform" />
                            </span>
                            <motion.div
                                className="absolute inset-0 bg-white/30"
                                initial={{ x: "-100%" }}
                                whileHover={{ x: "100%" }}
                                transition={{ duration: 0.7 }}
                            />
                        </Button>
                        <p className="mt-8 text-muted-foreground/50 text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            Progress Saved & Synced
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-background text-foreground overflow-hidden flex flex-col z-[70]">
            {/* Top Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 p-4 flex items-center justify-between bg-background/80 backdrop-blur-xl border-b border-white/5">
                {activeView === 'detail' ? (
                    <button onClick={() => setWorkoutView('list')} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                ) : (
                    <div className="w-10" />
                )}

                {activeSession && <WorkoutTimer startTime={activeSession.startTime} />}

                <div className="w-10" />
            </div>

            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto overscroll-contain pt-24 pb-36 px-4 custom-scrollbar">
                {activeSession ? (
                    activeView === 'list' ? (
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
                                            onClick={() => { setWorkoutView('detail', idx); }}
                                            className={cn(
                                                "w-full glass-card p-4 flex items-center gap-4 transition-all hover:bg-white/10 group text-left relative overflow-hidden",
                                                isAllCompleted ? "border-emerald-500/30 bg-emerald-500/5 ring-1 ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]" : "border-white/5",
                                                isCurrentlyResting && "border-primary/40 bg-primary/5"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors relative z-10",
                                                isAllCompleted ? "bg-emerald-500/20 text-emerald-500" : "bg-white/5 text-muted-foreground",
                                                isCurrentlyResting && "bg-primary/20 text-primary"
                                            )}>
                                                {isAllCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Dumbbell className="w-6 h-6" />}
                                            </div>
                                            <div className="flex-1 relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <h3 className={cn("font-semibold text-lg", isAllCompleted ? "text-emerald-400" : "text-foreground")}>
                                                        {ex.exerciseName}
                                                    </h3>
                                                    {isCurrentlyResting && (
                                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded-full animate-pulse">
                                                            <Timer className="w-3 h-3 text-primary" />
                                                            <span className="text-[10px] font-black text-primary">{restTimeLeft}s</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">{completedSets} / {ex.sets.length} sets</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        selectedExerciseIndex !== null && exerciseDetail && (
                            <ExerciseDetail
                                exercise={{
                                    ...exerciseDetail,
                                    name: activeSession.exercises[selectedExerciseIndex].exerciseName,
                                    primaryMuscles: exerciseDetail.primaryMuscles || [],
                                    secondaryMuscles: exerciseDetail.secondaryMuscles || [],
                                    sets: activeSession.exercises[selectedExerciseIndex].sets,
                                }}
                                open={activeView === 'detail'}
                                onOpenChange={(open) => !open && setWorkoutView('list')}
                                workoutMode={true}
                                onSetComplete={(setId, weight, reps, unit) => handleSetComplete(selectedExerciseIndex, setId, weight, reps, unit)}
                                onAddSet={() => handleAddSet(selectedExerciseIndex)}
                                unit={currentUser?.unitPreference || 'kg'}
                                personalNote={activeSession.exercises[selectedExerciseIndex].personalNote}
                                onNoteChange={(note) => handleNoteChange(selectedExerciseIndex, note)}
                                lastSessionNote={lastSessionNote}
                                onEdit={() => {
                                    setEditingExercise(exerciseDetail);
                                    setShowWizard(true);
                                }}
                            />
                        )
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                        <div className="relative">
                            <Trophy className="w-20 h-20 text-primary/20 animate-pulse" />
                            <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-primary/30 animate-bounce" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold opacity-30 tracking-tight">Finishing up...</h3>
                            <Button variant="ghost" onClick={onClose} className="opacity-40">
                                Back to Today
                            </Button>
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Controls */}
            {activeView === 'list' && activeSession && (
                <div className="fixed bottom-6 left-0 right-0 z-30 px-4 pb-safe">
                    <div className="flex gap-3 max-w-lg mx-auto">
                        <Button
                            variant="destructive"
                            size="lg"
                            onClick={() => {
                                if (progress.completed > 0) {
                                    setEndDialogType('abandon');
                                    setShowEndDialog(true);
                                } else {
                                    abandonWorkout().then(onClose);
                                }
                            }}
                            className="flex-1 h-14 rounded-2xl font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="gradient"
                            size="lg"
                            onClick={endWorkout}
                            className="flex-[2] h-14 rounded-2xl font-bold shadow-xl glow-red"
                        >
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            {isWorkoutComplete ? 'Finish Workout' : 'End Session Early'}
                        </Button>
                    </div>
                </div>
            )}

            {/* End Confirmation Dialog */}
            <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
                <DialogContent className="glass border-white/10 max-w-sm rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle>{endDialogType === 'abandon' ? 'Abandon Workout?' : 'Finish Workout?'}</DialogTitle>
                        <DialogDescription>
                            {endDialogType === 'abandon'
                                ? 'Your progress for this specific session will not be saved.'
                                : 'Ready to log this workout and see your progress?'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 mt-4">
                        <Button
                            variant={endDialogType === 'abandon' ? "destructive" : "gradient"}
                            onClick={endDialogType === 'abandon' ? () => abandonWorkout().then(onClose) : endWorkout}
                            className="w-full h-12 rounded-xl font-bold"
                        >
                            {endDialogType === 'abandon' ? 'YES, ABANDON' : 'YES, FINISH'}
                        </Button>
                        <Button variant="ghost" onClick={() => setShowEndDialog(false)} className="w-full h-12 rounded-xl">Back to Training</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <RestTimer />
            <MinimizedRestTimer />

            <ExerciseWizard
                exercise={editingExercise || undefined}
                open={showWizard}
                onOpenChange={(open) => {
                    setShowWizard(open);
                    if (!open) setEditingExercise(null);
                }}
                onComplete={async () => {
                    setShowWizard(false);
                    setEditingExercise(null);
                    // Refresh current detail
                    if (selectedExerciseIndex !== null && activeSession) {
                        const currentEx = activeSession.exercises[selectedExerciseIndex];
                        const updated = await db.exercises.get(currentEx.exerciseId);
                        if (updated) setExerciseDetail(updated);
                    }
                }}
            />
        </div>
    );
};

export default WorkoutSession;
