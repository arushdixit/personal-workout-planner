import { useState, useEffect, useMemo } from 'react';
import { Plus, X, ChevronUp, ChevronDown, Save, ArrowLeft, Search, Filter, Dumbbell, PlusCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createRoutineOptimistic, updateRoutineOptimistic } from '@/lib/routineCache';
import { type LocalRoutine, type RoutineExercise } from '@/lib/db';
import { db, Exercise, MUSCLE_GROUPS, EQUIPMENT_TYPES } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ExerciseDetail from './ExerciseDetail';
import ExerciseWizard from './ExerciseWizard';

interface RoutineBuilderProps {
    routine?: LocalRoutine;
    onCancel: () => void;
    onComplete: () => void;
    supabaseUserId: string;
    localUserId: number;
}

const RoutineBuilder = ({
    routine,
    onCancel,
    onComplete,
    supabaseUserId,
    localUserId,
}: RoutineBuilderProps) => {
    const [name, setName] = useState('');
    const [exercises, setExercises] = useState<RoutineExercise[]>([]);
    const [saving, setSaving] = useState(false);

    // Inline global exercise list state
    const [allExercises, setAllExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterMuscle, setFilterMuscle] = useState<string>('all');
    const [filterEquipment, setFilterEquipment] = useState<string>('all');
    const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<Exercise | null>(null);
    const [showExerciseDetail, setShowExerciseDetail] = useState(false);
    const [showWizard, setShowWizard] = useState(false);
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

    useEffect(() => {
        if (routine) {
            setName(routine.name);
            setExercises(routine.exercises);
        } else {
            setName('');
            setExercises([]);
        }
    }, [routine]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const all = await db.exercises.toArray();
                setAllExercises(all);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filteredGlobalExercises = useMemo(() => {
        return allExercises.filter(ex => {
            const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
            const matchesMuscle = filterMuscle === 'all' || ex.primaryMuscles.includes(filterMuscle);
            const matchesEquipment = filterEquipment === 'all' || ex.equipment === filterEquipment;
            return matchesSearch && matchesMuscle && matchesEquipment;
        });
    }, [allExercises, search, filterMuscle, filterEquipment]);

    const handleAddExercise = (exerciseId: number, exerciseName: string) => {
        const newExercise: RoutineExercise = {
            exerciseId,
            exerciseName,
            sets: 3,
            reps: '12',
            restSeconds: 90,
            order: exercises.length,
            notes: '',
        };
        setExercises([...exercises, newExercise]);
    };

    const isExerciseSelected = (exerciseId: number) => {
        return exercises.some(ex => ex.exerciseId === exerciseId);
    };

    const handleToggleExercise = (exercise: Exercise) => {
        if (isExerciseSelected(exercise.id!)) {
            // Remove the exercise
            handleRemoveExerciseByExerciseId(exercise.id!);
        } else {
            // Add the exercise
            handleAddExercise(exercise.id!, exercise.name);
        }
    };

    const handleRemoveExerciseByExerciseId = (exerciseId: number) => {
        const updated = exercises.filter(ex => ex.exerciseId !== exerciseId);
        // Reorder remaining exercises
        const reordered = updated.map((ex, i) => ({ ...ex, order: i }));
        setExercises(reordered);
    };

    const handleShowExerciseDetail = (exercise: Exercise) => {
        setSelectedExerciseDetail(exercise);
        setShowExerciseDetail(true);
    };

    const handleExerciseDetailChange = (open: boolean) => {
        setShowExerciseDetail(open);
        if (!open) {
            setSelectedExerciseDetail(null);
        }
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

    const handleUpdateExercise = (index: number, field: keyof RoutineExercise, value: RoutineExercise[keyof RoutineExercise]) => {
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
            const routineData: Omit<LocalRoutine, 'id' | 'createdAt' | 'updatedAt'> = {
                userId: supabaseUserId,
                localUserId: localUserId,
                name: name.trim(),
                description: '',
                exercises,
            };

            if (routine?.id) {
                await updateRoutineOptimistic({ ...routineData, id: routine.id, createdAt: routine.createdAt, updatedAt: routine.updatedAt });
                toast.success('Routine updated');
            } else {
                await createRoutineOptimistic(routineData, supabaseUserId, localUserId);
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
        <div className="min-h-[100dvh] flex flex-col overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between flex-shrink-0 py-3 border-b border-white/10">
                <div className="flex items-center gap-3 px-4">
                    <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Back">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-lg font-semibold">{routine ? 'Edit' : 'Create'} Routine</h1>
                </div>
                <div className="px-4">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        size="icon"
                        className="gradient-red glow-red border-none"
                        aria-label="Save Routine"
                    >
                        <Save className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-6 space-y-6">
                {/* Routine Name */}
                <div className="space-y-2 px-4">
                    <Label htmlFor="routine-name">Routine Name</Label>
                    <Input
                        id="routine-name"
                        placeholder="e.g., Push Day, Full Body Workout"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-white/5 border-white/10"
                    />
                </div>

                {/* Builder layout: left = selected exercises, right = global exercise list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
                    {/* Selected exercises */}
                    <div className="space-y-3">
                        <h2 className="text-lg font-semibold">Selected Exercises</h2>
                        {exercises.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground border border-dashed border-white/10 rounded-lg">
                                <p className="text-sm">No exercises added yet</p>
                                <p className="text-xs mt-1">Use the list on the right to add exercises</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {exercises.map((exercise, index) => (
                                    <div key={index} className="glass-card p-3 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-medium">{exercise.exerciseName}</h4>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleMoveExercise(index, 'up')} disabled={index === 0} className="h-7 w-7">
                                                    <ChevronUp className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleMoveExercise(index, 'down')} disabled={index === exercises.length - 1} className="h-7 w-7">
                                                    <ChevronDown className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveExercise(index)} className="h-7 w-7 text-red-500 hover:text-red-400">
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Sets</Label>
                                                <Input type="number" min="1" max="10" value={exercise.sets} onChange={(e) => handleUpdateExercise(index, 'sets', parseInt(e.target.value) || 1)} className="bg-white/5 border-white/10 h-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Reps</Label>
                                                <Input placeholder="8-12" value={exercise.reps} onChange={(e) => handleUpdateExercise(index, 'reps', e.target.value)} className="bg-white/5 border-white/10 h-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Rest (sec)</Label>
                                                <Input type="number" min="0" max="300" step="15" value={exercise.restSeconds} onChange={(e) => handleUpdateExercise(index, 'restSeconds', parseInt(e.target.value) || 0)} className="bg-white/5 border-white/10 h-8" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Global exercise list */}
                    <div className="space-y-3">
                        <h2 className="text-lg font-semibold">Global Exercises</h2>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Search exercises..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10" />
                        </div>

                        <div className="flex gap-2">
                            <Select value={filterMuscle} onValueChange={setFilterMuscle}>
                                <SelectTrigger className="bg-white/5 border-white/10 flex-1">
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Muscle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Muscles</SelectItem>
                                    {MUSCLE_GROUPS.map(m => (
                                        <SelectItem key={m} value={m} className="capitalize">{m.replace(/[_-]/g, ' ')}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={filterEquipment} onValueChange={setFilterEquipment}>
                                <SelectTrigger className="bg-white/5 border-white/10 flex-1">
                                    <Dumbbell className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Equipment" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Equipment</SelectItem>
                                    {EQUIPMENT_TYPES.map(eq => (
                                        <SelectItem key={eq} value={eq}>{eq}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 gradient-red rounded-full animate-pulse-glow" />
                                </div>
                            ) : (
                                filteredGlobalExercises.map((ex) => (
                                    <Card key={ex.id} className="glass border-white/10 hover:border-primary/50 transition-all duration-300 cursor-pointer" onClick={() => handleShowExerciseDetail(ex)}>
                                        <CardContent className="p-3 flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium">{ex.name}</h4>
                                                    {ex.difficulty && (
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "px-1.5 py-0 h-4 text-[8px] font-black uppercase tracking-tighter border-0",
                                                                ex.difficulty === 'Beginner' && "bg-emerald-500/10 text-emerald-400",
                                                                ex.difficulty === 'Intermediate' && "bg-blue-500/10 text-blue-400",
                                                                ex.difficulty === 'Advanced' && "bg-orange-500/10 text-orange-400"
                                                            )}
                                                        >
                                                            {ex.difficulty}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {Array.from(new Set(ex.primaryMuscles)).slice(0, 3).map(m => (
                                                        <span key={m} className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs capitalize">
                                                            {m.replace(/[_-]/g, ' ')}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleExercise(ex);
                                                }}
                                                className={cn(
                                                    "transition-all",
                                                    isExerciseSelected(ex.id!)
                                                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 active:bg-green-500/30"
                                                        : "hover:bg-transparent active:bg-accent"
                                                )}
                                            >
                                                {isExerciseSelected(ex.id!) ? (
                                                    <>
                                                        <Check className="w-4 h-4 mr-1" /> Added
                                                    </>
                                                ) : (
                                                    <>
                                                        <PlusCircle className="w-4 h-4 mr-1" /> Add
                                                    </>
                                                )}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Exercise Detail Modal */}
            {selectedExerciseDetail && (
                <ExerciseDetail
                    exercise={selectedExerciseDetail}
                    open={showExerciseDetail}
                    onOpenChange={handleExerciseDetailChange}
                    onEdit={() => {
                        setEditingExercise(selectedExerciseDetail);
                        setShowWizard(true);
                    }}
                />
            )}

            <ExerciseWizard
                exercise={editingExercise || undefined}
                open={showWizard}
                onOpenChange={(open) => {
                    setShowWizard(open);
                    if (!open) setEditingExercise(null);
                }}
                onComplete={async () => {
                    setShowWizard(false);
                    setEditingExercise(null);
                    // Refresh exercises list if needed, but definitely refresh selected detail
                    if (selectedExerciseDetail?.id) {
                        const updated = await db.exercises.get(selectedExerciseDetail.id);
                        if (updated) setSelectedExerciseDetail(updated);
                    }
                    // Refresh global list to show updated notes/info
                    const all = await db.exercises.toArray();
                    setAllExercises(all);
                }}
            />
        </div>
    );
}

export default RoutineBuilder;
