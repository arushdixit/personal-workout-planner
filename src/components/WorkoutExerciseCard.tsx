import { ChevronRight, Dumbbell, CheckCircle2, Circle } from 'lucide-react';
import { RoutineExercise } from '@/lib/db';
import { Exercise } from '@/lib/db';
import { cn } from '@/lib/utils';

interface WorkoutExerciseCardProps {
    exercise: RoutineExercise;
    exerciseDetail?: Exercise;
    isNext?: boolean;
    onClick?: () => void;
}

const WorkoutExerciseCard = ({
    exercise,
    exerciseDetail,
    isNext,
    onClick,
}: WorkoutExerciseCardProps) => {
    const completedSets = 0; // This would come from active session in real implementation

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full glass-card p-4 flex items-center gap-4 transition-all duration-300 hover:bg-white/10 group",
                isNext && "ring-1 ring-primary/50"
            )}
        >
            <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                isNext ? "gradient-red" : "bg-muted"
            )}>
                <Dumbbell className={cn("w-6 h-6", isNext ? "text-white" : "text-muted-foreground")} />
            </div>

            <div className="flex-1 text-left">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {exercise.exerciseName}
                </h3>
                <p className="text-sm text-muted-foreground">
                    {exercise.sets} sets × {exercise.reps} reps
                    {exerciseDetail?.primaryMuscles && exerciseDetail.primaryMuscles.length > 0 && (
                        <> · {exerciseDetail.primaryMuscles[0]}</>
                    )}
                </p>
            </div>

            <div className="flex items-center gap-2">
                {isNext && (
                    <span className="text-xs font-medium text-primary">UP NEXT</span>
                )}
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
        </button>
    );
};

export default WorkoutExerciseCard;
