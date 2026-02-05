import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BotMessageSquare } from 'lucide-react';
import AICoachPanel from './AICoachPanel';
import { useWorkout } from '@/context/WorkoutContext';
import { db, Exercise } from '@/lib/db';

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
            let exercise = await db.exercises.get(currentEx.exerciseId);
            if (!exercise && currentEx.exerciseName) {
                exercise = await db.exercises.where('name').equalsIgnoreCase(currentEx.exerciseName).first();
            }
            setExerciseDetail(exercise || null);
        };
        loadExerciseDetail();
    }, [selectedExerciseIndex, activeSession]);

    // Only show if session is active and not on success screen
    if (!activeSession || showSuccess) return null;

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

            <AICoachPanel
                open={isCoachOpen}
                onOpenChange={setIsCoachOpen}
                sessionInfo={{
                    routineName: activeSession.routineName,
                    totalExercises: activeSession.exercises.length,
                    exercisesProgress: activeSession.exercises.map(ex => ({
                        name: ex.exerciseName,
                        completedCount: ex.sets.filter(s => s.completed).length,
                        totalSets: ex.sets.length
                    }))
                }}
                currentExercise={selectedExerciseIndex !== null ? {
                    id: activeSession.exercises[selectedExerciseIndex].exerciseId,
                    name: activeSession.exercises[selectedExerciseIndex].exerciseName,
                    sets: activeSession.exercises[selectedExerciseIndex].sets,
                    personalNotes: exerciseDetail?.personalNotes
                } : undefined}
            />
        </>
    );
};

export default GlobalAICoach;
