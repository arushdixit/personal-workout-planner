import { useState, useEffect } from 'react';
import { Plus, X, ChevronUp, ChevronDown, Save } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { createRoutine, updateRoutine, type Routine, type RoutineExercise } from '@/lib/supabaseClient';
import ExerciseSelector from '@/components/ExerciseSelector';
import { cn } from '@/lib/utils';

interface RoutineBuilderProps {
    routine?: Routine;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete: () => void;
    supabaseUserId: string;
    localUserId: number;
}

const RoutineBuilder = ({
    routine,
    open,
    onOpenChange,
    onComplete,
    supabaseUserId,
    localUserId,
}: RoutineBuilderProps) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [exercises, setExercises] = useState<RoutineExercise[]>([]);
    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (routine) {
            setName(routine.name);
            setDescription(routine.description || '');
            setExercises(routine.exercises);
        } else {
            setName('');
            setDescription('');
            setExercises([]);
        }
    }, [routine, open]);

    const handleAddExercise = (exerciseId: number, exerciseName: string) => {
        const newExercise: RoutineExercise = {
            exerciseId,
            exerciseName,
            sets: 3,
            reps: '8-12',
            restSeconds: 90,
            order: exercises.length,
            notes: '',
        };
        setExercises([...exercises, newExercise]);
        setShowExerciseSelector(false);
    };

    const handleRemoveExercise = (index: number) => {
        const updated = exercises.filter((_, i) => i !== index);
        // Reorder remaining exercises
        const reordered = updated.map((ex, i) => ({ ...ex, order: i }));
        setExercises(reordered);
    };

    const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === exercises.length - 1)
        ) {
            return;
        }

        const updated = [...exercises];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];

        // Update order values
        const reordered = updated.map((ex, i) => ({ ...ex, order: i }));
        setExercises(reordered);
    };

    const handleUpdateExercise = (index: number, field: keyof RoutineExercise, value: any) => {
        const updated = [...exercises];
        updated[index] = { ...updated[index], [field]: value };
        setExercises(updated);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Please enter a routine name');
            return;
        }

        if (exercises.length === 0) {
            toast.error('Please add at least one exercise');
            return;
        }

        setSaving(true);
        try {
            const routineData: Omit<Routine, 'id' | 'created_at' | 'updated_at'> = {
                user_id: supabaseUserId,
                local_user_id: localUserId,
                name: name.trim(),
                description: description.trim(),
                exercises,
            };

            if (routine?.id) {
                await updateRoutine({ ...routineData, id: routine.id });
                toast.success('Routine updated');
            } else {
                await createRoutine(routineData);
                toast.success('Routine created');
            }

            onComplete();
        } catch (err) {
            console.error('Failed to save routine:', err);
            toast.error('Failed to save routine');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="glass border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{routine ? 'Edit Routine' : 'Create New Routine'}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Routine Name */}
                        <div className="space-y-2">
                            <Label htmlFor="routine-name">Routine Name</Label>
                            <Input
                                id="routine-name"
                                placeholder="e.g., Push Day, Full Body Workout"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-white/5 border-white/10"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="routine-description">Description (Optional)</Label>
                            <Textarea
                                id="routine-description"
                                placeholder="Add notes about this routine..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="bg-white/5 border-white/10 min-h-[80px]"
                            />
                        </div>

                        {/* Exercises */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Exercises</Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowExerciseSelector(true)}
                                    className="border-white/10"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Add Exercise
                                </Button>
                            </div>

                            {exercises.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground border border-dashed border-white/10 rounded-lg">
                                    <p className="text-sm">No exercises added yet</p>
                                    <p className="text-xs mt-1">Click "Add Exercise" to get started</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {exercises.map((exercise, index) => (
                                        <div
                                            key={index}
                                            className="glass-card p-3 space-y-3"
                                        >
                                            {/* Exercise Header */}
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-medium">{exercise.exerciseName}</h4>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleMoveExercise(index, 'up')}
                                                        disabled={index === 0}
                                                        className="h-7 w-7"
                                                    >
                                                        <ChevronUp className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleMoveExercise(index, 'down')}
                                                        disabled={index === exercises.length - 1}
                                                        className="h-7 w-7"
                                                    >
                                                        <ChevronDown className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveExercise(index)}
                                                        className="h-7 w-7 text-red-500 hover:text-red-400"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Exercise Configuration */}
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Sets</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        max="10"
                                                        value={exercise.sets}
                                                        onChange={(e) =>
                                                            handleUpdateExercise(index, 'sets', parseInt(e.target.value) || 1)
                                                        }
                                                        className="bg-white/5 border-white/10 h-8"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Reps</Label>
                                                    <Input
                                                        placeholder="8-12"
                                                        value={exercise.reps}
                                                        onChange={(e) =>
                                                            handleUpdateExercise(index, 'reps', e.target.value)
                                                        }
                                                        className="bg-white/5 border-white/10 h-8"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Rest (sec)</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="300"
                                                        step="15"
                                                        value={exercise.restSeconds}
                                                        onChange={(e) =>
                                                            handleUpdateExercise(index, 'restSeconds', parseInt(e.target.value) || 0)
                                                        }
                                                        className="bg-white/5 border-white/10 h-8"
                                                    />
                                                </div>
                                            </div>

                                            {/* Notes */}
                                            <div className="space-y-1">
                                                <Label className="text-xs">Notes (Optional)</Label>
                                                <Input
                                                    placeholder="Add notes for this exercise..."
                                                    value={exercise.notes || ''}
                                                    onChange={(e) =>
                                                        handleUpdateExercise(index, 'notes', e.target.value)
                                                    }
                                                    className="bg-white/5 border-white/10 h-8 text-xs"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="border-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="gradient-red glow-red border-none"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Routine'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Exercise Selector */}
            <ExerciseSelector
                open={showExerciseSelector}
                onOpenChange={setShowExerciseSelector}
                onSelect={handleAddExercise}
            />
        </>
    );
};

export default RoutineBuilder;
