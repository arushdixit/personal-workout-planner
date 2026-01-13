import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Set {
  id: number;
  weight: number;
  reps: number;
  completed: boolean;
}

interface SetLoggerProps {
  sets: Set[];
  onSetComplete: (setId: number, weight: number, reps: number) => void;
  unit?: "kg" | "lb";
}

const SetLogger = ({ sets, onSetComplete, unit = "kg" }: SetLoggerProps) => {
  const [editingSet, setEditingSet] = useState<number | null>(null);
  const [tempWeight, setTempWeight] = useState(0);
  const [tempReps, setTempReps] = useState(0);

  const handleStartEdit = (set: Set) => {
    setEditingSet(set.id);
    setTempWeight(set.weight);
    setTempReps(set.reps);
  };

  const handleComplete = (setId: number) => {
    onSetComplete(setId, tempWeight, tempReps);
    setEditingSet(null);
  };

  const adjustValue = (type: "weight" | "reps", delta: number) => {
    if (type === "weight") {
      setTempWeight((prev) => Math.max(0, prev + delta));
    } else {
      setTempReps((prev) => Math.max(0, prev + delta));
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 text-xs text-muted-foreground font-medium px-4">
        <span>SET</span>
        <span className="text-center">WEIGHT</span>
        <span className="text-center">REPS</span>
        <span className="text-right">DONE</span>
      </div>
      
      {sets.map((set) => (
        <div
          key={set.id}
          className={cn(
            "glass-card p-4 transition-all duration-300",
            set.completed && "bg-primary/10 ring-1 ring-primary/30",
            editingSet === set.id && "ring-1 ring-primary"
          )}
        >
          {editingSet === set.id ? (
            <div className="grid grid-cols-4 items-center gap-2">
              <span className="font-bold text-lg">{set.id}</span>
              
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={() => adjustValue("weight", -2.5)}
                  className="p-1 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <Input
                  type="number"
                  value={tempWeight}
                  onChange={(e) => setTempWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-16 text-center font-semibold h-8 px-1 bg-background/50"
                  step="0.5"
                />
                <span className="text-xs text-muted-foreground">{unit}</span>
                <button
                  onClick={() => adjustValue("weight", 2.5)}
                  className="p-1 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={() => adjustValue("reps", -1)}
                  className="p-1 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <Input
                  type="number"
                  value={tempReps}
                  onChange={(e) => setTempReps(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-14 text-center font-semibold h-8 px-1 bg-background/50"
                  step="1"
                />
                <button
                  onClick={() => adjustValue("reps", 1)}
                  className="p-1 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex justify-end">
                <Button
                  size="icon"
                  variant="gradient"
                  onClick={() => handleComplete(set.id)}
                  className="w-10 h-10"
                >
                  <Check className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => !set.completed && handleStartEdit(set)}
              className="grid grid-cols-4 items-center w-full"
              disabled={set.completed}
            >
              <span className={cn(
                "font-bold text-lg",
                set.completed && "text-primary"
              )}>
                {set.id}
              </span>
              <span className={cn(
                "text-center font-medium",
                set.completed ? "text-foreground" : "text-muted-foreground"
              )}>
                {set.weight}{unit}
              </span>
              <span className={cn(
                "text-center font-medium",
                set.completed ? "text-foreground" : "text-muted-foreground"
              )}>
                {set.reps}
              </span>
              <div className="flex justify-end">
                {set.completed ? (
                  <div className="w-10 h-10 rounded-xl gradient-red flex items-center justify-center animate-scale-in">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl border-2 border-dashed border-muted-foreground/30" />
                )}
              </div>
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default SetLogger;
