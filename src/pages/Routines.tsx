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
import { CacheStatus, CacheStatusState } from '@/components/CacheStatus';
import { toast } from 'sonner';
import { useUser } from '@/context/UserContext';
import {
    fetchRoutines,
    deleteRoutineOptimistic,
    duplicateRoutine,
    refreshRoutines,
    getCacheStatus,
} from '@/lib/routineCache';
import { type Routine as SupabaseRoutine } from '@/lib/supabaseClient';
import { triggerImmediateSync } from '@/lib/syncManager';
import type { Routine } from '@/lib/db';
import RoutineBuilder from '@/components/RoutineBuilder';
import { cn } from '@/lib/utils';

interface RoutinesProps {
    showBuilderOnLoad?: boolean;
}

const Routines = ({ showBuilderOnLoad = false }: RoutinesProps) => {
    const { currentUser } = useUser();
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [loading, setLoading] = useState(true);
    const [showBuilder, setShowBuilder] = useState(showBuilderOnLoad);
    const [editingRoutine, setEditingRoutine] = useState<Routine | undefined>();
    const [deleteTarget, setDeleteTarget] = useState<Routine | null>(null);
    const [supabaseUserId, setSupabaseUserId] = useState<string>('');
    const [cacheState, setCacheState] = useState<CacheStatusState>('fresh');
    const [lastSynced, setLastSynced] = useState<string>('');
    const [pendingSync, setPendingSync] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        loadRoutines();
        triggerImmediateSync();

        return () => {
            triggerImmediateSync();
        };
    }, [currentUser?.id]);

    useEffect(() => {
        if (currentUser?.supabaseUserId) {
            setSupabaseUserId(currentUser.supabaseUserId);
        }
    }, [currentUser?.supabaseUserId]);

    const setupCacheStatusListener = () => {
        if (!supabaseUserId) return;

        const updateCacheStatus = async () => {
            try {
                const status = await getCacheStatus(supabaseUserId);

                if (status.pendingSync > 0) {
                    setCacheState('needsSync');
                } else if (status.isStale) {
                    setCacheState('stale');
                } else if (status.isFresh) {
                    setCacheState('fresh');
                } else {
                    setCacheState('error');
                }

                setLastSynced(status.lastSynced || '');
                setPendingSync(status.pendingSync);
            } catch (err) {
                console.error('Failed to update cache status:', err);
            }
        };

        updateCacheStatus();
        const interval = setInterval(updateCacheStatus, 30000);

        return () => clearInterval(interval);
    };

    useEffect(() => {
        if (supabaseUserId) {
            const cleanup = setupCacheStatusListener();
            return () => {
                if (cleanup) cleanup();
            };
        }
    }, [supabaseUserId]);

    const loadRoutines = async () => {
        if (!currentUser?.id) return;

        setLoading(true);
        try {
            const userId = currentUser.supabaseUserId;
            if (!userId) {
                setLoading(false);
                return;
            }
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

    const handleRefresh = async () => {
        if (!currentUser?.id || !currentUser.supabaseUserId) return;

        setIsRefreshing(true);
        try {
            const data = await refreshRoutines(currentUser.supabaseUserId);
            setRoutines(data);
            setCacheState('fresh');
            setLastSynced(new Date().toISOString());
            toast.success('Routines refreshed');
            triggerImmediateSync();
        } catch (err) {
            console.error('Failed to refresh routines:', err);
            toast.error('Failed to refresh routines');
            setCacheState('error');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleEdit = (routine: Routine) => {
        setEditingRoutine(routine);
        setShowBuilder(true);
    };

    const handleDelete = async () => {
        if (!deleteTarget?.id) return;

        try {
            await deleteRoutineOptimistic(deleteTarget.id);
            toast.success('Routine deleted');
            setDeleteTarget(null);
            
            const updatedRoutines = routines.filter(r => r.id !== deleteTarget.id);
            setRoutines(updatedRoutines);
        } catch (err) {
            console.error('Failed to delete routine:', err);
            toast.error('Failed to delete routine');
        }
    };

    const handleDuplicate = async (routine: Routine) => {
        if (!routine.id || !currentUser?.id) return;

        try {
            const newRoutine = await duplicateRoutine(routine.id, supabaseUserId, currentUser.id);
            toast.success('Routine duplicated');
            
            setRoutines(prev => [...prev, newRoutine]);
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
        return routine.exercises.reduce((total, ex) => {
            const workTime = ex.sets * 30;
            const restTime = ex.sets * ex.restSeconds;
            return total + workTime + restTime;
        }, 0) / 60;
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
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">My Routines</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-muted-foreground text-sm">
                            {routines.length} {routines.length === 1 ? 'routine' : 'routines'}
                        </p>
                        <CacheStatus
                            state={cacheState}
                            lastSynced={lastSynced}
                            pendingSync={pendingSync}
                            onRefresh={handleRefresh}
                            isRefreshing={isRefreshing}
                        />
                    </div>
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
