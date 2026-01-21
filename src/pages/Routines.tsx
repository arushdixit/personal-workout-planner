import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Copy, Clock, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { toast } from 'sonner';
import { useUser } from '@/context/UserContext';
import {
    fetchRoutines,
    deleteRoutine,
    duplicateRoutine,
    refreshRoutines
} from '@/lib/routineCache';
import { getSupabaseUserId } from '@/lib/supabaseClient';
import type { Routine } from '@/lib/db';
import RoutineBuilder from '@/components/RoutineBuilder';
import { cn } from '@/lib/utils';

const Routines = () => {
    const { currentUser } = useUser();
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [loading, setLoading] = useState(true);
    const [showBuilder, setShowBuilder] = useState(false);
    const [editingRoutine, setEditingRoutine] = useState<Routine | undefined>();
    const [deleteTarget, setDeleteTarget] = useState<Routine | null>(null);
    const [supabaseUserId, setSupabaseUserId] = useState<string>('');

    useEffect(() => {
        loadRoutines();
    }, [currentUser?.id]);

    const loadRoutines = async () => {
        if (!currentUser?.id) return;

        setLoading(true);
        try {
            const userId = await getSupabaseUserId(currentUser.id);
            setSupabaseUserId(userId);
            const data = await fetchRoutines(userId);
            setRoutines(data);
        } catch (err) {
            console.error('Failed to load routines:', err);
            toast.error('Failed to load routines');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (routine: Routine) => {
        setEditingRoutine(routine);
        setShowBuilder(true);
    };

    const handleDelete = async () => {
        if (!deleteTarget?.id) return;

        try {
            await deleteRoutine(deleteTarget.id);
            toast.success('Routine deleted');
            setDeleteTarget(null);
            loadRoutines();
        } catch (err) {
            console.error('Failed to delete routine:', err);
            toast.error('Failed to delete routine');
        }
    };

    const handleDuplicate = async (routine: Routine) => {
        if (!routine.id || !currentUser?.id) return;

        try {
            await duplicateRoutine(routine.id, supabaseUserId, currentUser.id);
            toast.success('Routine duplicated');
            loadRoutines();
        } catch (err) {
            console.error('Failed to duplicate routine:', err);
            toast.error('Failed to duplicate routine');
        }
    };

    const handleBuilderComplete = () => {
        setShowBuilder(false);
        setEditingRoutine(undefined);
        loadRoutines();
    };

    const handleBuilderCancel = () => {
        setShowBuilder(false);
        setEditingRoutine(undefined);
    };

    const calculateEstimatedTime = (routine: Routine): number => {
        // Estimate: (sets * 30 seconds per set) + rest time
        return routine.exercises.reduce((total, ex) => {
            const workTime = ex.sets * 30; // 30 seconds per set
            const restTime = ex.sets * ex.restSeconds;
            return total + workTime + restTime;
        }, 0) / 60; // Convert to minutes
    };

    if (loading) {
        return (
            <div className="min-h-[100dvh] bg-background flex items-center justify-center">
                <div className="w-8 h-8 gradient-red rounded-full animate-pulse-glow" />
            </div>
        );
    }

    return (
        showBuilder ? (
            <RoutineBuilder
                routine={editingRoutine}
                onCancel={handleBuilderCancel}
                onComplete={handleBuilderComplete}
                supabaseUserId={supabaseUserId}
                localUserId={currentUser?.id || 0}
            />
        ) : (
        <div className="space-y-6 animate-slide-up pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">My Routines</h1>
                    <p className="text-muted-foreground text-sm">
                        {routines.length} {routines.length === 1 ? 'routine' : 'routines'}
                    </p>
                </div>
                <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowBuilder(true)}
                    className="gradient-red glow-red border-none"
                >
                    <Plus className="w-4 h-4 mr-2" /> Create
                </Button>
            </div>

            {/* Routines List */}
            {routines.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No routines yet</p>
                    <p className="text-sm mb-4">Create your first workout routine to get started!</p>
                    <Button onClick={() => setShowBuilder(true)} className="gradient-red glow-red border-none">
                        <Plus className="w-4 h-4 mr-2" /> Create Your First Routine
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {routines.map((routine, index) => (
                        <Card
                            key={routine.id}
                            className="glass border-white/10 animate-slide-up hover:border-primary/50 transition-all duration-300 group cursor-pointer"
                            style={{ animationDelay: `${index * 0.05}s` }}
                            onClick={() => handleEdit(routine)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-1">{routine.name}</h3>
                                        {routine.description && (
                                            <p className="text-sm text-muted-foreground mb-3">{routine.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Dumbbell className="w-3 h-3" />
                                                <span>{routine.exercises.length} exercises</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>~{Math.round(calculateEstimatedTime(routine))} min</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(routine)} aria-label="Edit Routine">
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDuplicate(routine)} aria-label="Duplicate Routine">
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(routine)} className="text-red-500 hover:text-red-400" aria-label="Delete Routine">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent className="glass border-white/10">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Routine?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="glass">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        )
    );
};

export default Routines;
