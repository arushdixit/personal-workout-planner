import { useState, useMemo } from 'react';
import { Check, Plus, Trash2, Timer, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { WorkoutSet } from '@/lib/db';
import { useWorkout } from '@/context/WorkoutContext';

interface SetLoggerProps {
    sets: WorkoutSet[];
    onSetComplete: (setId: number, weight: number, reps: number, unit: 'kg' | 'lbs') => void;
    onAddSet: () => void;
    onRemoveSet?: () => void;
    unit: 'kg' | 'lbs';
    onUnitChange: (unit: 'kg' | 'lbs') => void;
    canAddSet?: boolean;
    canRemoveSet?: boolean;
}

const SetLogger = ({
    sets,
    onSetComplete,
    onAddSet,
    onRemoveSet,
    unit,
    onUnitChange,
    canAddSet = true,
    canRemoveSet = false,
}: SetLoggerProps) => {
    const { isRestTimerActive, restTimeLeft } = useWorkout();

    // Local state for input values
    const [inputValues, setInputValues] = useState<Record<number, { weight: string; reps: string }>>({});

    const handleInputChange = (setId: number, field: 'weight' | 'reps', value: string) => {
        setInputValues(prev => ({
            ...prev,
            [setId]: {
                ...(prev[setId] || { weight: '', reps: '' }),
                [field]: value
            }
        }));
    };

    const handleLogSet = (set: WorkoutSet) => {
        const values = inputValues[set.id] || {
            weight: set.weight > 0 ? set.weight.toString() : '',
            reps: set.reps > 0 ? set.reps.toString() : ''
        };
        const weight = parseFloat(values.weight) || 0;
        const reps = parseInt(values.reps, 10) || 0;
        onSetComplete(set.id, weight, reps, unit);
    };

    const nextIncompleteSetId = useMemo(() => {
        return sets.find(s => !s.completed)?.id || null;
    }, [sets]);

    const completedCount = useMemo(() =>
        sets.filter(s => s.completed).length,
        [sets]);

    return (
        <div className="space-y-4">
            {/* Header / Progress */}
            <div className="flex items-center justify-between gap-4 py-2 border-b border-white/5">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Workout Progress</span>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-foreground">{completedCount}</span>
                        <span className="text-muted-foreground text-sm">/ {sets.length} sets</span>
                    </div>
                </div>
                <div className="flex bg-white/5 rounded-xl p-1.5 border border-white/5">
                    <button
                        onClick={() => onUnitChange('kg')}
                        className={cn(
                            "px-4 py-1.5 text-xs font-black rounded-lg transition-all",
                            unit === 'kg' ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "text-muted-foreground hover:text-white/60"
                        )}
                    >
                        KG
                    </button>
                    <button
                        onClick={() => onUnitChange('lbs')}
                        className={cn(
                            "px-4 py-1.5 text-xs font-black rounded-lg transition-all",
                            unit === 'lbs' ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "text-muted-foreground hover:text-white/60"
                        )}
                    >
                        LBS
                    </button>
                </div>
            </div>

            {/* Sets List */}
            <div className="space-y-3">
                {sets.map((set, index) => {
                    const isActuallyNext = set.id === nextIncompleteSetId;
                    const isNext = isActuallyNext && !isRestTimerActive;
                    const isResting = isActuallyNext && isRestTimerActive;
                    const isCompleted = set.completed;

                    // Allow interaction if it's the next set OR if it's already completed (for editing)
                    const isDisabled = !isActuallyNext && !isCompleted;

                    const currentValues = inputValues[set.id] || {
                        weight: isCompleted ? set.weight.toString() : (set.weight > 0 ? set.weight.toString() : ''),
                        reps: isCompleted ? set.reps.toString() : (set.reps > 0 ? set.reps.toString() : '')
                    };

                    return (
                        <div
                            key={set.id}
                            className={cn(
                                "relative overflow-hidden transition-all duration-500 rounded-3xl border",
                                isNext
                                    ? "bg-primary/5 border-primary/30 p-5 ring-1 ring-primary/20 shadow-[0_0_30px_rgba(239,68,68,0.05)]"
                                    : isCompleted
                                        ? "bg-emerald-500/[0.03] border-emerald-500/20 p-4 opacity-80"
                                        : "bg-white/[0.02] border-white/5 p-4 grayscale opacity-40"
                            )}
                        >
                            {/* Set Badge */}
                            <div className={cn(
                                "absolute top-0 right-0 px-4 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest",
                                isNext ? "bg-primary text-white" :
                                    isResting ? "bg-primary/40 text-white" :
                                        isCompleted ? "bg-emerald-500 text-white" :
                                            "bg-white/10 text-muted-foreground"
                            )}>
                                {isCompleted ? 'Completed' : isNext ? 'Active' : isResting ? 'Resting' : 'Locked'}
                            </div>

                            <div className="flex flex-col gap-4">
                                {/* First Row: Details */}
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 transition-colors",
                                        isNext ? "bg-primary/20 text-primary" : isCompleted ? "bg-emerald-500/20 text-emerald-500" : "bg-white/5 text-muted-foreground"
                                    )}>
                                        {set.setNumber}
                                    </div>

                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Weight</span>
                                            <Input
                                                type="number"
                                                inputMode="decimal"
                                                disabled={isDisabled}
                                                value={currentValues.weight}
                                                onChange={(e) => handleInputChange(set.id, 'weight', e.target.value)}
                                                onBlur={() => isCompleted && handleLogSet(set)}
                                                placeholder={unit}
                                                className={cn(
                                                    "h-12 text-center text-lg font-black bg-black/20 border-0 focus-visible:ring-2 focus-visible:ring-primary/50 transition-all rounded-xl",
                                                    isCompleted && "text-emerald-400 focus:text-foreground",
                                                    (isNext || isResting) && "bg-white/5"
                                                )}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Reps</span>
                                            <Input
                                                type="number"
                                                inputMode="numeric"
                                                disabled={isDisabled}
                                                value={currentValues.reps}
                                                onChange={(e) => handleInputChange(set.id, 'reps', e.target.value)}
                                                onBlur={() => isCompleted && handleLogSet(set)}
                                                placeholder="0"
                                                className={cn(
                                                    "h-12 text-center text-lg font-black bg-black/20 border-0 focus-visible:ring-2 focus-visible:ring-primary/50 transition-all rounded-xl",
                                                    isCompleted && "text-emerald-400 focus:text-foreground",
                                                    (isNext || isResting) && "bg-white/5"
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {!isNext && isCompleted && (
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                            <Check className="w-5 h-5 text-emerald-500" />
                                        </div>
                                    )}
                                </div>

                                {/* Second Row: Big Log Button (Only for active set) */}
                                {(isNext || isResting) && (
                                    <div className="flex gap-3 animate-in slide-in-from-top-2 duration-500">
                                        <Button
                                            onClick={() => handleLogSet(set)}
                                            disabled={isResting}
                                            className={cn(
                                                "flex-1 h-14 text-lg font-black shadow-xl rounded-2xl active:scale-95 transition-all",
                                                isResting
                                                    ? "bg-white/5 text-muted-foreground cursor-not-allowed"
                                                    : "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                                            )}
                                        >
                                            {isResting ? (
                                                <>
                                                    <Timer className="w-6 h-6 mr-2 animate-spin-slow" />
                                                    RESTING...
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="w-6 h-6 mr-2 stroke-[3px]" />
                                                    LOG SET
                                                </>
                                            )}
                                        </Button>

                                        {/* Timer Indicator if resting */}
                                        {isResting && (
                                            <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex flex-col items-center justify-center animate-pulse">
                                                <Timer className="w-4 h-4 text-primary mb-1" />
                                                <span className="text-[10px] font-black tabular-nums text-primary">{restTimeLeft}s</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add/Remove Set Buttons */}
            <div className="flex gap-3 pt-4">
                {canAddSet && (
                    <Button
                        variant="glass"
                        onClick={onAddSet}
                        className="flex-1 h-14 border-dashed border-2 border-white/5 hover:bg-white/5 hover:border-primary/30 rounded-2xl font-black text-muted-foreground hover:text-foreground"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        ADD EXTRA SET
                    </Button>
                )}
                {canRemoveSet && sets.length > 1 && !sets[sets.length - 1].completed && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onRemoveSet}
                        className="h-14 w-14 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-white/5"
                    >
                        <Trash2 className="w-5 h-5" />
                    </Button>
                )}
            </div>
        </div>
    );
};

export default SetLogger;
