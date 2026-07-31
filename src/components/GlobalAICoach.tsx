import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BotMessageSquare } from 'lucide-react';
import { useWorkout } from '@/context/WorkoutContext';
import { db, Exercise, getExerciseByRef } from '@/lib/db';

const AICoachPanel = lazy(() => import('./AICoachPanel'));

const GlobalAICoach = () => {
    const { activeSession, selectedExerciseIndex, showSuccess, isCoachOpen, setIsCoachOpen } = useWorkout();
    const [exerciseDetail, setExerciseDetail] = useState<Exercise | null>(null);

    useEffect(() => {
        const loadExerciseDetail = async () => {
            if (selectedExerciseIndex === null || !activeSession) {
                setExerciseDetail(null);
                return;
            }
            const currentEx = activeSession.exercises[selectedExerciseIndex];
            const exercise = await getExerciseByRef(currentEx.exerciseId, currentEx.exerciseName);
            setExerciseDetail(exercise || null);
        };
        loadExerciseDetail();
    }, [selectedExerciseIndex, activeSession]);

    // ALL hooks must be called before any early return
    const sessionInfo = useMemo(() => {
        if (!activeSession) return null;
        return {
            routineName: activeSession.routineName,
            totalExercises: activeSession.exercises.length,
            exercisesProgress: activeSession.exercises.map(ex => ({
                name: ex.exerciseName,
                completedCount: ex.sets.filter(s => s.completed).length,
                totalSets: ex.sets.length
            }))
        };
    }, [activeSession]);

    const currentExercise = useMemo(() => {
        if (!activeSession || selectedExerciseIndex === null) return undefined;
        return {
            id: activeSession.exercises[selectedExerciseIndex].exerciseId,
            name: activeSession.exercises[selectedExerciseIndex].exerciseName,
            sets: activeSession.exercises[selectedExerciseIndex].sets,
            personalNotes: exerciseDetail?.personalNotes
        };
    }, [selectedExerciseIndex, activeSession, exerciseDetail]);

    // Only show if session is active and not on success screen
    if (!activeSession || showSuccess || !sessionInfo) return null;

    return (
        <>
            {createPortal(
                <AnimatePresence>
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="fixed bottom-24 right-4 z-[100] pointer-events-none"
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsCoachOpen(true);
                            }}
                            className="w-14 h-14 rounded-2xl gradient-red glow-red flex items-center justify-center shadow-2xl group active:scale-95 transition-all border border-white/20 overflow-hidden relative pointer-events-auto"
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            <BotMessageSquare className="w-7 h-7 text-white relative z-10 group-hover:rotate-12 transition-transform" />
                        </button>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}

            {isCoachOpen && (
                <Suspense fallback={null}>
                    <AICoachPanel
                        open={isCoachOpen}
                        onOpenChange={setIsCoachOpen}
                        sessionInfo={sessionInfo}
                        currentExercise={currentExercise}
                    />
                </Suspense>
            )}
        </>
    );
};

export default GlobalAICoach;
