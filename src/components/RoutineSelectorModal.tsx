import { useState, useEffect } from 'react';
import { Plus, Dumbbell } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { db, LocalRoutine } from '@/lib/db';
import { useUser } from '@/context/UserContext';

interface RoutineSelectorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (routine: LocalRoutine) => void;
    onCreateNew: () => void;
}

const RoutineSelectorModal = ({
    open,
    onOpenChange,
    onSelect,
    onCreateNew
}: RoutineSelectorModalProps) => {
    const { currentUser } = useUser();
    const [routines, setRoutines] = useState<LocalRoutine[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadRoutines = async () => {
            if (!currentUser?.id) {
                setRoutines([]);
                setIsLoading(false);
                return;
            }

            try {
                let userRoutines: LocalRoutine[] = [];

                // Use supabaseUserId as primary lookup since it's stable across DB cleanups
                if (currentUser.supabaseUserId) {
                    userRoutines = await db.routines
                        .where('userId')
                        .equals(currentUser.supabaseUserId)
                        .toArray();
                }

                // Fallback to localUserId if no routines found
                if (userRoutines.length === 0) {
                    userRoutines = await db.routines
                        .where('localUserId')
                        .equals(currentUser.id)
                        .toArray();
                }

                setRoutines(userRoutines);
            } catch (error) {
                console.error('Failed to load routines:', error);
                setRoutines([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (open) {
            loadRoutines();
        }
    }, [open, currentUser?.id, currentUser?.supabaseUserId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glass border-white/10 max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Select a Routine</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 gradient-red rounded-full animate-pulse-glow" />
                        </div>
                    ) : routines.length === 0 ? (
                        <div className="text-center py-8 space-y-4">
                            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                                <Dumbbell className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">No routines created yet</p>
                            <Button onClick={onCreateNew} className="w-full">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Your First Routine
                            </Button>
                        </div>
                    ) : (
                        <>
                            {routines.map((routine) => (
                                <Card
                                    key={routine.id}
                                    className="glass border-white/10 hover:border-primary/50 transition-all cursor-pointer"
                                    onClick={() => onSelect(routine)}
                                >
                                    <CardContent className="p-4">
                                        <h4 className="font-semibold">{routine.name}</h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {routine.exercises.length} exercises
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}

                            <Button
                                variant="outline"
                                onClick={onCreateNew}
                                className="w-full mt-4"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create New Routine
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default RoutineSelectorModal;
