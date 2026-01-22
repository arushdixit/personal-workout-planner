import { Play, Clock, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkoutHeroProps {
  greeting: string;
  workoutName: string;
  exercises: number;
  estimatedTime: number;
  onStart: () => void;
}

const WorkoutHero = ({
  greeting,
  workoutName,
  exercises,
  estimatedTime,
  onStart,
}: WorkoutHeroProps) => {
  return (
    <div className="relative overflow-hidden rounded-3xl gradient-red p-6 glow-red animate-slide-up">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      </div>
      
      <div className="relative z-10">
        <p className="text-white/80 text-sm font-medium mb-1">{greeting}</p>
        <h2 className="text-2xl font-bold text-white mb-4">
          Next: {workoutName}
        </h2>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-white/90">
            <Flame aria-label="Number of exercises" className="w-4 h-4" role="img" />
            <span className="text-sm font-medium">{exercises} exercises</span>
          </div>
          <div className="flex items-center gap-2 text-white/90">
            <Clock aria-label="Estimated time" className="w-4 h-4" role="img" />
            <span className="text-sm font-medium">~{estimatedTime} min</span>
          </div>
        </div>
        
        <Button
          onClick={onStart}
          variant="glass"
          size="lg"
          className="w-full font-bold text-white border-white/30 hover:bg-white/20"
        >
          <Play className="w-5 h-5 fill-current" />
          Start Workout
        </Button>
      </div>
    </div>
  );
};

export default WorkoutHero;
