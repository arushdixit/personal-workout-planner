import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Search, Dumbbell, Edit, Trash2, Filter, CheckCircle, Globe, User } from 'lucide-react';
import { db, Exercise, MUSCLE_GROUPS, EQUIPMENT_TYPES } from '@/lib/db';
import ExerciseWizard from '@/components/ExerciseWizard';
import { cn } from '@/lib/utils';

const Library = () => {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterMuscle, setFilterMuscle] = useState<string>('all');
    const [filterEquipment, setFilterEquipment] = useState<string>('all');
    const [view, setView] = useState<'my' | 'global'>('my');
    const [showWizard, setShowWizard] = useState(false);
    const [editingExercise, setEditingExercise] = useState<Exercise | undefined>();
    const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);

    const loadExercises = async () => {
        setLoading(true);
        try {
            // In a real app with 1k+ exercises, we would use pagination
            // For now we'll load them all but prioritize filtering in memory
            const all = await db.exercises.toArray();
            setExercises(all);
        } catch (err) {
            console.error('Failed to load exercises:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadExercises();
    }, []);

    const filteredExercises = useMemo(() => {
        return exercises.filter(ex => {
            const matchesView = view === 'my'
                ? (ex.source !== 'exercemus' || ex.mastered)
                : (ex.source === 'exercemus');

            const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
            const matchesMuscle = filterMuscle === 'all' || ex.primaryMuscles.includes(filterMuscle);
            const matchesEquipment = filterEquipment === 'all' || ex.equipment === filterEquipment;

            return matchesView && matchesSearch && matchesMuscle && matchesEquipment;
        }).slice(0, 100); // Limit to 100 for performance
    }, [exercises, view, search, filterMuscle, filterEquipment]);

    const handleEdit = (exercise: Exercise) => {
        setEditingExercise(exercise);
        setShowWizard(true);
    };

    const handleDelete = async () => {
        if (!deleteTarget?.id) return;
        try {
            await db.exercises.delete(deleteTarget.id);
            setDeleteTarget(null);
            loadExercises();
        } catch (err) {
            console.error('Failed to delete exercise:', err);
        }
    };

    const handleWizardComplete = () => {
        setShowWizard(false);
        setEditingExercise(undefined);
        loadExercises();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 gradient-red rounded-full animate-pulse-glow" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-slide-up">
            {/* View Switcher */}
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
                <button
                    onClick={() => setView('my')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all",
                        view === 'my' ? "glass gradient-red-text shadow-xl" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <User className="w-4 h-4" />
                    My Exercises
                </button>
                <button
                    onClick={() => setView('global')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all",
                        view === 'global' ? "glass gradient-red-text shadow-xl" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Globe className="w-4 h-4" />
                    Global Library
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
                <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowWizard(true)}
                    className="gradient-red glow-red border-none"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add
                </Button>
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
            <div className="space-y-3 pb-20">
                {filteredExercises.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No exercises found.</p>
                        <p className="text-sm">Try adjusting your filters or search terms.</p>
                    </div>
                ) : (
                    filteredExercises.map((ex, index) => (
                        <Card
                            key={ex.id}
                            className="glass border-white/10 animate-slide-up"
                            style={{ animationDelay: `${index * 0.03}s` }}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold">{ex.name}</h3>
                                            {ex.mastered && (
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                            )}
                                            {ex.source === 'exercemus' && (
                                                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 uppercase font-bold tracking-tighter">
                                                    Exercemus
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {ex.primaryMuscles.slice(0, 3).map(m => (
                                                <span
                                                    key={m}
                                                    className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs capitalize"
                                                >
                                                    {m.replace(/[_-]/g, ' ')}
                                                </span>
                                            ))}
                                            {ex.primaryMuscles.length > 3 && (
                                                <span className="px-2 py-0.5 bg-white/10 rounded text-xs">
                                                    +{ex.primaryMuscles.length - 3}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {ex.equipment} {ex.repRange && `· ${ex.repRange} reps`}
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(ex)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeleteTarget(ex)}
                                            className="text-red-500 hover:text-red-400"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
                {view === 'global' && filteredExercises.length === 100 && (
                    <p className="text-center text-xs text-muted-foreground">
                        Showing first 100 results. Use search/filters to find others.
                    </p>
                )}
            </div>

            {/* Wizard Modal */}
            {showWizard && (
                <ExerciseWizard
                    exercise={editingExercise}
                    onComplete={handleWizardComplete}
                    onCancel={() => {
                        setShowWizard(false);
                        setEditingExercise(undefined);
                    }}
                />
            )}

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
        </div>
    );
};

export default Library;
