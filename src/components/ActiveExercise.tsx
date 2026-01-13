import { useState } from "react";
import { ChevronLeft, ChevronRight, Info, Play, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnatomyDiagram from "./AnatomyDiagram";
import SetLogger from "./SetLogger";
import RestTimer from "./RestTimer";
import { useUser } from "@/context/UserContext";

interface Exercise {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  sets: { id: number; weight: number; reps: number; completed: boolean }[];
  notes?: string;
  warning?: string;
}

interface ActiveExerciseProps {
  exercise: Exercise;
  currentIndex: number;
  totalExercises: number;
  onPrevious: () => void;
  onNext: () => void;
  onSetComplete: (exerciseId: string, setId: number, weight: number, reps: number) => void;
}

const ActiveExercise = ({
  exercise,
  currentIndex,
  totalExercises,
  onPrevious,
  onNext,
  onSetComplete,
}: ActiveExerciseProps) => {
  const { currentUser } = useUser();
  const [showRest, setShowRest] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const gender = currentUser?.gender || 'male';

  const progress = ((currentIndex + 1) / totalExercises) * 100;
  const completedSets = exercise.sets.filter((s) => s.completed).length;

  const handleSetComplete = (setId: number, weight: number, reps: number) => {
    onSetComplete(exercise.id, setId, weight, reps);
    if (completedSets + 1 < exercise.sets.length) {
      setShowRest(true);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-40 h-1 bg-muted">
        <div
          className="h-full gradient-red transition-all duration-500 glow-red"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="pt-6 px-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={onPrevious} disabled={currentIndex === 0}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            {currentIndex + 1} / {totalExercises}
          </span>
          <Button variant="ghost" size="icon" onClick={onNext} disabled={currentIndex === totalExercises - 1}>
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">{exercise.name}</h1>
        <p className="text-center text-muted-foreground text-sm">
          {completedSets} / {exercise.sets.length} sets completed
        </p>
      </div>

      {/* Warning banner */}
      {exercise.warning && (
        <div className="mx-4 mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-start gap-3 animate-slide-up">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-destructive text-sm">Previous Note</p>
            <p className="text-sm text-destructive/80">{exercise.warning}</p>
          </div>
        </div>
      )}

      {/* Anatomy diagram */}
      <div className="px-4 mb-6">
        <div className="glass-card p-4">
          <AnatomyDiagram
            selectedPrimary={exercise.primaryMuscles}
            selectedSecondary={exercise.secondaryMuscles}
            view="front"
            gender={gender}
            mode="read-only"
          />
        </div>
      </div>

      {/* Tutorial toggle */}
      <div className="px-4 mb-4">
        <button
          onClick={() => setShowTutorial(!showTutorial)}
          className="w-full glass-card p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Play className="w-5 h-5 text-primary" />
            <span className="font-medium">Watch Tutorial</span>
          </div>
          <Info className="w-5 h-5 text-muted-foreground" />
        </button>

        {showTutorial && (
          <div className="mt-3 glass-card p-4 animate-slide-up">
            <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Video tutorial placeholder</p>
            </div>
          </div>
        )}
      </div>

      {/* Set logger */}
      <div className="px-4">
        <SetLogger
          sets={exercise.sets}
          onSetComplete={handleSetComplete}
          unit="kg"
        />
      </div>

      {/* Notes section */}
      <div className="px-4 mt-6">
        <div className="glass-card p-4">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            How did this feel?
          </label>
          <textarea
            placeholder="Add notes about form, pain, or progress..."
            className="w-full bg-transparent border-none resize-none focus:outline-none text-foreground placeholder:text-muted-foreground/50 min-h-[80px]"
          />
        </div>
      </div>

      {/* Rest timer overlay */}
      {showRest && (
        <RestTimer
          duration={90}
          onComplete={() => setShowRest(false)}
          onSkip={() => setShowRest(false)}
        />
      )}
    </div>
  );
};

export default ActiveExercise;
