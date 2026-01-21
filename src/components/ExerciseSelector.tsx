import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Dumbbell, CheckCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { db, Exercise, MUSCLE_GROUPS, EQUIPMENT_TYPES } from '@/lib/db';
import { cn } from '@/lib/utils';

interface ExerciseSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (exerciseId: number, exerciseName: string) => void;
}

const ExerciseSelector = ({ open, onOpenChange, onSelect }: ExerciseSelectorProps) => {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterMuscle, setFilterMuscle] = useState<string>('all');
    const [filterEquipment, setFilterEquipment] = useState<string>('all');

    useEffect(() => {
        if (open) {
            loadExercises();
        }
    }, [open]);

    const loadExercises = async () => {
        setLoading(true);
        try {
            // Load exercises from user's library (custom + added from global)
            const all = await db.exercises.toArray();
            const myExercises = all.filter(ex => ex.source !== 'exercemus' || ex.inLibrary);
            setExercises(myExercises);
        } catch (err) {
            console.error('Failed to load exercises:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredExercises = useMemo(() => {
        return exercises.filter(ex => {
            const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
            const matchesMuscle = filterMuscle === 'all' || ex.primaryMuscles.includes(filterMuscle);
            const matchesEquipment = filterEquipment === 'all' || ex.equipment === filterEquipment;
            return matchesSearch && matchesMuscle && matchesEquipment;
        });
    }, [exercises, search, filterMuscle, filterEquipment]);

    const handleSelect = (exercise: Exercise) => {
        if (!exercise.id) return;
        onSelect(exercise.id, exercise.name);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glass border-white/10 max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Select Exercise</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search exercises..."
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
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-8 h-8 gradient-red rounded-full animate-pulse-glow" />
                            </div>
                        ) : filteredExercises.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No exercises found.</p>
                                <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
                            </div>
                        ) : (
                            filteredExercises.map((ex) => (
                                <Card
                                    key={ex.id}
                                    className="glass border-white/10 hover:border-primary/50 transition-all duration-300 cursor-pointer"
                                    onClick={() => handleSelect(ex)}
                                >
                                    <CardContent className="p-3">
                                        <div className="flex items-start justify-between">
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
                                                        <span
                                                            key={m}
                                                            className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs capitalize"
                                                        >
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
                                                    handleSelect(ex);
                                                }}
                                                className="text-primary"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                Select
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ExerciseSelector;
