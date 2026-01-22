import { useState, useMemo } from 'react';
import { Check, Minus, Plus, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import PlateVisualizer from './PlateVisualizer';
import { WorkoutSet } from '@/lib/db';

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
    const [editingSet, setEditingSet] = useState<number | null>(null);
    const [tempWeight, setTempWeight] = useState(0);
    const [tempReps, setTempReps] = useState(0);

    const handleStartEdit = (set: WorkoutSet) => {
        if (set.completed) return;
        setEditingSet(set.id);
        setTempWeight(set.weight);
        setTempReps(set.reps);
    };

    const handleComplete = (setId: number) => {
        onSetComplete(setId, tempWeight, tempReps, unit);
        setEditingSet(null);
    };

    const handleCancel = () => {
        setEditingSet(null);
        setTempWeight(0);
        setTempReps(0);
    };

    const adjustValue = (type: 'weight' | 'reps', delta: number) => {
        if (type === 'weight') {
            const increment = unit === 'kg' ? 2.5 : 5;
            setTempWeight((prev) => Math.max(0, prev + delta * increment));
        } else {
            setTempReps((prev) => Math.max(0, prev + delta));
        }
    };

    const formatTime = (isoString?: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const completedCount = useMemo(() => 
        sets.filter(s => s.completed).length, 
    [sets]);

    return (
        <div className="space-y-4">
            {/* Unit Toggle */}
            <div className="flex items-center justify-center gap-2 py-2">
                <Button
                    variant={unit === 'kg' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onUnitChange('kg')}
                    className={cn(
                        "w-16",
                        unit === 'kg' && "gradient-red"
                    )}
                >
                    kg
                </Button>
                <Button
                    variant={unit === 'lbs' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onUnitChange('lbs')}
                    className={cn(
                        "w-16",
                        unit === 'lbs' && "gradient-red"
                    )}
                >
                    lbs
                </Button>
            </div>

            {/* Progress Summary */}
            <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
                <span>{completedCount} / {sets.length} sets completed</span>
            </div>

            {/* Sets List */}
            <div className="space-y-3">
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
                            <div className="space-y-3">
                                {/* Weight Input with Quick Adjust */}
                                <div className="flex items-center justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => adjustValue('weight', -1)}
                                        className="h-10 w-10"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </Button>
                                    <div className="relative w-24">
                                        <Input
                                            type="number"
                                            value={tempWeight}
                                            onChange={(e) => setTempWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                                            className="text-center font-semibold h-10 pr-8 bg-background/50"
                                            step={unit === 'kg' ? '2.5' : '5'}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                            {unit}
                                        </span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => adjustValue('weight', 1)}
                                        className="h-10 w-10"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Plate Visualization */}
                                {tempWeight > 0 && (
                                    <div className="flex justify-center py-2">
                                        <PlateVisualizer
                                            weight={tempWeight}
                                            unit={unit}
                                        />
                                    </div>
                                )}

                                {/* Reps Input with Quick Adjust */}
                                <div className="flex items-center justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => adjustValue('reps', -1)}
                                        className="h-10 w-10"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </Button>
                                    <Input
                                        type="number"
                                        value={tempReps}
                                        onChange={(e) => setTempReps(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-20 text-center font-semibold h-10"
                                        step="1"
                                    />
                                    <span className="text-sm text-muted-foreground w-8">reps</span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => adjustValue('reps', 1)}
                                        className="h-10 w-10"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="ghost"
                                        onClick={handleCancel}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="gradient"
                                        onClick={() => handleComplete(set.id)}
                                        className="flex-1"
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        Complete Set
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => !set.completed && handleStartEdit(set)}
                                className="w-full grid grid-cols-12 items-center gap-2"
                                disabled={set.completed}
                            >
                                {/* Set Number */}
                                <div className={cn(
                                    "col-span-1 text-lg font-bold text-center",
                                    set.completed ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {set.setNumber}
                                </div>

                                {/* Weight */}
                                <div className="col-span-4 text-left">
                                    {set.completed ? (
                                        <div>
                                            <span className="font-semibold">
                                                {set.weight} {set.unit}
                                            </span>
                                            {set.completedAt && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                    <Clock className="w-3 h-3" />
                                                    {formatTime(set.completedAt)}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">
                                            -- {unit}
                                        </span>
                                    )}
                                </div>

                                {/* Reps */}
                                <div className={cn(
                                    "col-span-3 text-center font-medium",
                                    set.completed ? "text-foreground" : "text-muted-foreground"
                                )}>
                                    {set.completed ? `${set.reps} reps` : '--'}
                                </div>

                                {/* Status */}
                                <div className="col-span-4 flex justify-end items-center gap-2">
                                    {set.completed ? (
                                        <div className="w-8 h-8 rounded-full gradient-red flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30" />
                                    )}
                                </div>
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Add/Remove Set Buttons */}
            <div className="flex gap-2">
                {canAddSet && (
                    <Button
                        variant="outline"
                        onClick={onAddSet}
                        className="flex-1"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Set
                    </Button>
                )}
                {canRemoveSet && sets.length > 1 && !sets[sets.length - 1].completed && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onRemoveSet}
                        className="text-destructive hover:text-destructive"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
};

export default SetLogger;
