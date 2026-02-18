import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Dumbbell, Edit, Trash2, Filter, CheckCircle, Globe, User, PlusCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { db, Exercise, MUSCLE_GROUPS, EQUIPMENT_TYPES } from '@/lib/db';
import ExerciseWizard from '@/components/ExerciseWizard';
import ExerciseDetail from '@/components/ExerciseDetail';
import RoutineSelectorModal from '@/components/RoutineSelectorModal';
import RoutineBuilder from '@/components/RoutineBuilder';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import { useLiveQuery } from 'dexie-react-hooks';

interface LibraryProps {
    selectedExerciseId?: string | null;
    onOpenExercise?: (id: number) => void;
    onCloseExercise?: () => void;
}

const Library = ({ selectedExerciseId, onOpenExercise, onCloseExercise }: LibraryProps) => {
    const { currentUser } = useUser();
    const [editingExercise, setEditingExercise] = useState<Exercise | undefined>();
    const [viewingExercise, setViewingExercise] = useState<Exercise | undefined>();

    // Restore state variables
    const [search, setSearch] = useState('');
    const [view, setView] = useState<'my' | 'global'>('global');
    const [filterMuscle, setFilterMuscle] = useState<string>('all');
    const [filterEquipment, setFilterEquipment] = useState<string>('all');
    const [showWizard, setShowWizard] = useState(false);

    // Use useLiveQuery for high-performance reactive data fetching
    const exercises = useLiveQuery(
        () => db.exercises.toArray(),
        [],
        [] as Exercise[]
    );

    // Handle exercise selection from URL params
    useEffect(() => {
        if (selectedExerciseId && exercises.length > 0) {
            const exercise = exercises.find(ex => ex.id === parseInt(selectedExerciseId));
            if (exercise && exercise.id !== viewingExercise?.id) {
                setViewingExercise(exercise);
            } else if (!exercise && viewingExercise) {
                // Clear viewing if exercise not found or ID was removed
                setViewingExercise(undefined);
            }
        } else if (!selectedExerciseId && viewingExercise) {
            // Clear viewing if exerciseId was removed from URL
            setViewingExercise(undefined);
        }
    }, [selectedExerciseId, exercises.length]);

    // Update URL when exercise is selected manually
    const handleExerciseClick = (exercise: Exercise) => {
        if (onOpenExercise) {
            onOpenExercise(exercise.id);
        } else {
            // Fallback if callback not provided
            const url = new URL(window.location.href);
            url.searchParams.set('tab', 'library');
            url.searchParams.set('exerciseId', exercise.id.toString());
            window.history.replaceState({}, '', url.toString());
        }
        setViewingExercise(exercise);
    };
    const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // NEW: Routine selector state
    const [showRoutineSelector, setShowRoutineSelector] = useState(false);
    const [selectedExerciseForAdd, setSelectedExerciseForAdd] = useState<Exercise | null>(null);

    const filteredExercises = useMemo(() => {
        return exercises.filter(ex => {
            // When searching in 'my' view, show all exercises (both my library + global)
            // Otherwise, filter by view
            const matchesView = view === 'my'
                ? (search.trim() !== '' ? true : (ex.source !== 'exercemus' || ex.inLibrary))
                : (ex.source === 'exercemus');

            const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
            const matchesMuscle = filterMuscle === 'all' || ex.primaryMuscles.includes(filterMuscle);
            const matchesEquipment = filterEquipment === 'all' || ex.equipment === filterEquipment;

            return matchesView && matchesSearch && matchesMuscle && matchesEquipment;
        });
    }, [exercises, view, search, filterMuscle, filterEquipment]);

    const displayExercises = useMemo(() => {
        if (view === 'my') return filteredExercises.slice(0, 100);

        // For global library, we group them
        const groups: Record<string, Exercise[]> = {};
        filteredExercises.forEach(ex => {
            const primary = ex.primaryMuscles[0] || 'Other';
            if (!groups[primary]) groups[primary] = [];
            groups[primary].push(ex);
        });

        // Sort groups by MUSCLE_GROUPS order
        const sortedGroups: Record<string, Exercise[]> = {};
        MUSCLE_GROUPS.forEach(muscle => {
            if (groups[muscle]) {
                sortedGroups[muscle] = groups[muscle];
            }
        });

        // Add any muscles that aren't in MUSCLE_GROUPS (if any)
        Object.keys(groups).forEach(muscle => {
            if (!sortedGroups[muscle]) {
                sortedGroups[muscle] = groups[muscle];
            }
        });

        return sortedGroups;
    }, [filteredExercises, view]);

    const toggleGroup = (muscle: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(muscle)) next.delete(muscle);
            else next.add(muscle);
            return next;
        });
    };

    const handleEdit = (exercise: Exercise) => {
        setEditingExercise(exercise);
        setShowWizard(true);
    };

    const handleDelete = async () => {
        if (!deleteTarget?.id) return;
        try {
            await db.exercises.delete(deleteTarget.id);
            setDeleteTarget(null);
        } catch (err) {
            console.error('Failed to delete exercise:', err);
        }
    };

    const handleWizardComplete = async () => {
        setShowWizard(false);
        const editedExerciseId = editingExercise?.id;
        setEditingExercise(undefined);

        // If we were viewing an exercise, refresh it with updated data
        if (editedExerciseId && viewingExercise?.id === editedExerciseId) {
            const updated = await db.exercises.get(editedExerciseId);
            if (updated) setViewingExercise(updated);
        }
    };

    const handleAddToMy = async (ex: Exercise) => {
        setSelectedExerciseForAdd(ex);
        setShowRoutineSelector(true);
    };

    const handleRoutineSelect = (routineId: string) => {
        // This would typically add the exercise to the selected routine
        // For now, we'll just show a toast
        toast.success(`Exercise added to routine`);
        setShowRoutineSelector(false);
        setSelectedExerciseForAdd(null);

        // Mark the exercise as in library
        if (selectedExerciseForAdd?.id) {
            db.exercises.update(selectedExerciseForAdd.id, { inLibrary: true });
        }
    };

    const handleCreateNewRoutine = () => {
        setShowRoutineSelector(false);
        toast.info('Navigate to Routines page to create a new routine');
    };

    const handleRemoveFromMy = async (ex: Exercise) => {
        if (!ex.id) return;
        try {
            await db.exercises.update(ex.id, { inLibrary: false });
            toast.success(`${ex.name} removed from your exercises`);
        } catch (err) {
            console.error('Failed to remove exercise:', err);
        }
    };


    // Loading state is handled by the fact that useLiveQuery returns an empty array initially
    // or we can use a simpler check if we really want a spinner
    const isInitialLoad = exercises.length === 0 && !search;

    if (isInitialLoad) {
        return (
            <div className="min-h-[100dvh] bg-background flex items-center justify-center">
                <div className="w-8 h-8 gradient-red rounded-full animate-pulse-glow" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-slide-up pb-10">
            {/* View Switcher - Flipped order: Global first, My second */}
            <div className="relative flex p-1 bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <button
                    onClick={() => setView('global')}
                    className={cn(
                        "relative flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold transition-colors duration-300 z-10",
                        view === 'global' ? "text-white" : "text-muted-foreground hover:text-white"
                    )}
                >
                    {view === 'global' && (
                        <motion.div
                            layoutId="activeLibraryTab"
                            className="absolute inset-0 bg-primary/20 rounded-lg border border-primary/30"
                            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                        />
                    )}
                    <Globe className="w-4 h-4 relative z-20" />
                    <span className="relative z-20">Global Library</span>
                </button>
                <button
                    onClick={() => setView('my')}
                    className={cn(
                        "relative flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold transition-colors duration-300 z-10",
                        view === 'my' ? "text-white" : "text-muted-foreground hover:text-white"
                    )}
                >
                    {view === 'my' && (
                        <motion.div
                            layoutId="activeLibraryTab"
                            className="absolute inset-0 bg-primary/20 rounded-lg border border-primary/30"
                            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                        />
                    )}
                    <User className="w-4 h-4 relative z-20" />
                    <span className="relative z-20">My Exercises</span>
                </button>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        {view === 'my' ? 'My Exercises' : 'Exercemus Library'}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {view === 'global' ? 'Choose from 800+ professional exercises' : `${exercises.filter(e => e.source !== 'exercemus').length} custom exercises`}
                    </p>
                </div>
                <div className="flex gap-2">

                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => setShowWizard(true)}
                        className="gradient-red glow-red border-none"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search name or muscle..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10"
                />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                <Select value={filterMuscle} onValueChange={setFilterMuscle}>
                    <SelectTrigger className="bg-white/5 border-white/10 flex-1">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Muscle" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Muscles</SelectItem>
                        {MUSCLE_GROUPS.map(m => (
                            <SelectItem key={m} value={m} className="capitalize">
                                {m.replace(/[_-]/g, ' ')}
                            </SelectItem>
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

            {/* Exercise List */}
            <div className="space-y-4 pb-20">
                {filteredExercises.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No exercises found.</p>
                        <p className="text-sm">Try adjusting your filters or search terms.</p>
                    </div>
                ) : view === 'my' ? (
                    (displayExercises as Exercise[]).map((ex) => (
                        <Card
                            key={ex.id}
                            className="glass border-white/10 hover:border-primary/50 transition-all duration-300 group cursor-pointer"
                            onClick={() => handleExerciseClick(ex)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold">{ex.name}</h3>
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
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {Array.from(new Set(ex.primaryMuscles)).slice(0, 3).map(m => (
                                                <span
                                                    key={m}
                                                    className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs capitalize"
                                                >
                                                    {m.replace(/[_-]/g, ' ')}
                                                </span>
                                            ))}
                                            {Array.from(new Set(ex.primaryMuscles)).length > 3 && (
                                                <span className="px-2 py-0.5 bg-white/10 rounded text-xs">
                                                    +{Array.from(new Set(ex.primaryMuscles)).length - 3}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {ex.category ? ex.category.charAt(0).toUpperCase() + ex.category.slice(1) : 'Exercise'} {ex.repRange && `· ${ex.repRange} reps`}
                                        </p>
                                    </div>
                                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                        {ex.source === 'exercemus' && !ex.inLibrary && search.trim() !== '' ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleAddToMy(ex)}
                                                className={cn(ex.inLibrary && "text-green-500")}
                                                aria-label="Add to My Exercises"
                                            >
                                                <PlusCircle className="w-4 h-4" />
                                            </Button>
                                        ) : ex.source === 'exercemus' ? (
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(ex)}
                                                    aria-label="Edit Note / Video"
                                                    title="Edit Note / Video"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveFromMy(ex)}
                                                    className="text-muted-foreground hover:text-red-400"
                                                    aria-label="Remove from My Exercises"
                                                    title="Remove from My Exercises"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        handleEdit(ex);
                                                    }}
                                                    aria-label="Edit Exercise"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        setDeleteTarget(ex);
                                                    }}
                                                    className="text-red-500 hover:text-red-400"
                                                    aria-label="Delete Exercise"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    Object.entries(displayExercises as Record<string, Exercise[]>).map(([muscle, muscleExercises], gIndex) => (
                        <div key={muscle} className="space-y-2">
                            <button
                                onClick={() => toggleGroup(muscle)}
                                className="w-full flex items-center justify-between p-3 glass-card hover:bg-white/10 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg gradient-red flex items-center justify-center">
                                        <Dumbbell className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold capitalize">{muscle.replace(/[_-]/g, ' ')}</h3>
                                        <p className="text-xs text-muted-foreground">{muscleExercises.length} exercises</p>
                                    </div>
                                </div>
                                {expandedGroups.has(muscle) ? (
                                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                )}
                            </button>

                            {expandedGroups.has(muscle) && (
                                <div className="pl-2 space-y-2 animate-slide-up">
                                    {muscleExercises.map((ex, index) => (
                                        <Card
                                            key={ex.id}
                                            className="glass border-white/10 hover:border-primary/50 transition-all duration-300 cursor-pointer"
                                            onClick={() => handleExerciseClick(ex)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-semibold">{ex.name}</h3>
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
                                                        <p className="text-xs text-muted-foreground">
                                                            {ex.category ? ex.category.charAt(0).toUpperCase() + ex.category.slice(1) : 'Exercise'} {ex.repRange && `· ${ex.repRange} reps`}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleAddToMy(ex)}
                                                            className={cn(ex.inLibrary && "text-green-500")}
                                                        >
                                                            {ex.inLibrary ? <CheckCircle className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
                {view === 'global' ? (
                    <p className="text-center text-xs text-muted-foreground py-4">
                        Showing all {filteredExercises.length} exercises.
                    </p>
                ) : filteredExercises.length > 100 && (
                    <p className="text-center text-xs text-muted-foreground py-4">
                        Showing first 100 of {filteredExercises.length} results.
                    </p>
                )}
            </div>

            {/* Wizard Modal */}
            <ExerciseWizard
                exercise={editingExercise}
                open={showWizard}
                onOpenChange={(open) => {
                    setShowWizard(open);
                    if (!open) setEditingExercise(undefined);
                }}
                onComplete={async () => {
                    setShowWizard(false);
                    const editedExerciseId = editingExercise?.id;
                    setEditingExercise(undefined);
                    // If we were viewing an exercise, refresh it with updated data
                    if (editedExerciseId && viewingExercise?.id === editedExerciseId) {
                        const updated = await db.exercises.get(editedExerciseId);
                        if (updated) setViewingExercise(updated);
                    }
                }}
            />

            <ExerciseDetail
                exercise={viewingExercise || ({} as Exercise)}
                open={!!viewingExercise}
                onOpenChange={(open) => {
                    if (!open) {
                        // Blur any focused element before closing
                        if (document.activeElement) {
                            (document.activeElement as HTMLElement).blur();
                        }
                        setViewingExercise(undefined);
                        // Notify parent to close exercise
                        if (onCloseExercise) {
                            onCloseExercise();
                        }
                    }
                }}
                onEdit={() => {
                    // Blur focus before opening wizard to prevent aria-hidden conflicts
                    if (document.activeElement) {
                        (document.activeElement as HTMLElement).blur();
                    }
                    setEditingExercise(viewingExercise);
                    setShowWizard(true);
                }}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent className="glass border-white/10">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Exercise?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="glass">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Routine Selector Modal */}
            <RoutineSelectorModal
                open={showRoutineSelector}
                onOpenChange={setShowRoutineSelector}
                onSelect={(routine) => {
                    // Add exercise to routine and mark as in library
                    toast.success(`${selectedExerciseForAdd?.name} added to ${routine.name}`);
                    if (selectedExerciseForAdd?.id) {
                        db.exercises.update(selectedExerciseForAdd.id, { inLibrary: true });
                    }
                    setShowRoutineSelector(false);
                    setSelectedExerciseForAdd(null);
                }}
                onCreateNew={() => {
                    setShowRoutineSelector(false);
                    // Open RoutineBuilder page or navigate to it
                    // For now, just show a toast
                    toast.info('Navigate to Routines page to create a new routine');
                }}
            />


        </div>
    );
};

export default Library;
