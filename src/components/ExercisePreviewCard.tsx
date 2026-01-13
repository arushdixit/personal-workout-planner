import { ChevronRight, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExercisePreviewCardProps {
  name: string;
  sets: number;
  reps: string;
  primaryMuscle: string;
  isNext?: boolean;
  onClick?: () => void;
}

const ExercisePreviewCard = ({
  name,
  sets,
  reps,
  primaryMuscle,
  isNext,
  onClick,
}: ExercisePreviewCardProps) => {
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
          {name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {sets} sets × {reps} · {primaryMuscle}
        </p>
      </div>
      
      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
    </button>
  );
};

export default ExercisePreviewCard;
