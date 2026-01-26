import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Sparkles, Loader2, Check, X, Search } from 'lucide-react';
import { db, Exercise, EquipmentType, EQUIPMENT_TYPES } from '@/lib/db';
import { lookupExercise } from '@/lib/openrouter';
import AnatomyDiagram from './AnatomyDiagram';
import { useUser } from '@/context/UserContext';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer";

interface ExerciseWizardProps {
    exercise?: Exercise; // If provided, we're in edit mode
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete: () => void;
}

const ExerciseWizard = ({ exercise, open, onOpenChange, onComplete }: ExerciseWizardProps) => {
    const { currentUser } = useUser();
    const isEditMode = !!exercise;
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [muscleMode, setMuscleMode] = useState<'primary' | 'secondary'>('primary');
    const [suggestions, setSuggestions] = useState<Exercise[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const gender = currentUser?.gender || 'male';

    const [formData, setFormData] = useState({
        name: exercise?.name || '',
        primaryMuscles: exercise?.primaryMuscles || [],
        secondaryMuscles: exercise?.secondaryMuscles || [],
        equipment: exercise?.equipment || ('Barbell' as EquipmentType),
        repRange: exercise?.repRange || '',
        formCues: exercise?.formCues || '',
        tutorialUrl: exercise?.tutorialUrl || '',
        personalNotes: exercise?.personalNotes || '',
        inLibrary: exercise?.inLibrary || false,
    });

    useEffect(() => {
        if (open) {
            setFormData({
                name: exercise?.name || '',
                primaryMuscles: exercise?.primaryMuscles || [],
                secondaryMuscles: exercise?.secondaryMuscles || [],
                equipment: exercise?.equipment || ('Barbell' as EquipmentType),
                repRange: exercise?.repRange || '',
                formCues: exercise?.formCues || '',
                tutorialUrl: exercise?.tutorialUrl || '',
                personalNotes: exercise?.personalNotes || '',
                inLibrary: exercise?.inLibrary || false,
            });
            setStep(1);
        }
    }, [open, exercise]);

    useEffect(() => {
        const searchLocal = async () => {
            if (formData.name.length < 2 || isEditMode) {
                setSuggestions([]);
                return;
            }
            const results = await db.exercises
                .where('name')
                .startsWithIgnoreCase(formData.name)
                .limit(5)
                .toArray();
            setSuggestions(results);
            setShowSuggestions(results.length > 0);
        };

        const timer = setTimeout(searchLocal, 300);
        return () => clearTimeout(timer);
    }, [formData.name, isEditMode]);

    const handleSelectSuggestion = (suggested: Exercise) => {
        setFormData(prev => ({
            ...prev,
            name: suggested.name,
            primaryMuscles: suggested.primaryMuscles,
            secondaryMuscles: suggested.secondaryMuscles,
            equipment: suggested.equipment,
            // Combine description and instructions for formCues if it's from Exercemus
            formCues: suggested.formCues || (suggested.description ? suggested.description + '. ' : '') + (suggested.instructions?.join(' ') || ''),
            tutorialUrl: suggested.tutorialUrl || '',
        }));
        setShowSuggestions(false);
    };

    const handleNext = () => setStep(s => Math.min(s + 1, 4));
    const handleBack = () => setStep(s => Math.max(s - 1, 1));

    const handleAiLookup = async () => {
        if (!formData.name.trim()) return;
        setAiLoading(true);
        try {
            const suggestion = await lookupExercise(formData.name);
            if (suggestion) {
                setFormData(prev => ({
                    ...prev,
                    primaryMuscles: suggestion.primaryMuscles,
                    secondaryMuscles: suggestion.secondaryMuscles,
                    equipment: suggestion.equipment as EquipmentType,
                    repRange: suggestion.repRange,
                    formCues: suggestion.formCues,
                }));
            }
        } finally {
            setAiLoading(false);
        }
    };

    const toggleMuscle = (muscle: string, type: 'primary' | 'secondary') => {
        setFormData(prev => {
            const key = type === 'primary' ? 'primaryMuscles' : 'secondaryMuscles';
            const current = (prev[key] || []) as string[];
            const updated = current.includes(muscle)
                ? current.filter(m => m !== muscle)
                : [...current, muscle];
            return { ...prev, [key]: updated };
        });
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const now = new Date().toISOString();
            const exerciseData: Omit<Exercise, 'id'> = {
                ...formData,
                createdAt: exercise?.createdAt || now,
                updatedAt: now,
            };

            if (isEditMode && exercise?.id) {
                await db.exercises.update(exercise.id, exerciseData);
            } else {
                await db.exercises.add(exerciseData);
            }
            onComplete();
        } catch (err) {
            console.error('Failed to save exercise:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="h-[96dvh] bg-background border-none flex flex-col focus:outline-none z-[100]">
                <DrawerHeader className="sr-only">
                    <DrawerTitle>{isEditMode ? 'Edit Exercise' : 'Add New Exercise'}</DrawerTitle>
                    <DrawerDescription>Fill in the details to customize your exercise intelligence.</DrawerDescription>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar p-6">
                    <div className="max-w-md mx-auto space-y-8">
                        {/* Custom Header */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => onOpenChange(false)}
                                className="p-2 -ml-2 rounded-full hover:bg-white/10"
                            >
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                            <h2 className="text-lg font-black uppercase tracking-[0.2em]">
                                {isEditMode ? 'Refine' : 'Add'} Exercise
                            </h2>
                            <div className="w-9" />
                        </div>

                        {/* Progress */}
                        {!isEditMode && (
                            <div className="flex gap-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div
                                        key={i}
                                        className={`flex-1 h-1 rounded-full transition-all ${i <= step ? 'gradient-red' : 'bg-white/10'}`}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="space-y-6">
                            {isEditMode ? (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Exercise Name</Label>
                                        <p className="text-2xl font-black tracking-tight p-5 bg-white/5 rounded-3xl border border-white/10">
                                            {formData.name}
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        <Label htmlFor="personalNotes" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Your Personal Notes</Label>
                                        <Textarea
                                            id="personalNotes"
                                            placeholder="Add your own tips, cues, or reminders for this exercise..."
                                            value={formData.personalNotes}
                                            onChange={e => setFormData({ ...formData, personalNotes: e.target.value })}
                                            className="bg-white/5 border-white/10 h-32 rounded-3xl p-5"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <Label htmlFor="tutorialUrl" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Video Link (YouTube/Website)</Label>
                                        <Input
                                            id="tutorialUrl"
                                            placeholder="https://..."
                                            value={formData.tutorialUrl}
                                            onChange={e => setFormData({ ...formData, tutorialUrl: e.target.value })}
                                            className="bg-white/5 border-white/10 h-14 rounded-2xl px-5"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Step 1: Name + Suggestions + AI */}
                                    {step === 1 && (
                                        <div className="space-y-6 animate-slide-up">
                                            <div className="space-y-4 relative">
                                                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Exercise Name</Label>
                                                <div className="flex gap-3">
                                                    <div className="relative flex-1">
                                                        <Input
                                                            id="name"
                                                            placeholder="e.g., Incline Dumbbell Press"
                                                            value={formData.name}
                                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                                            className="bg-white/5 border-white/10 h-14 rounded-2xl px-5 w-full"
                                                        />
                                                        {showSuggestions && (
                                                            <div className="absolute z-50 w-full mt-2 glass rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-scale-in">
                                                                {suggestions.map(s => (
                                                                    <button
                                                                        key={s.id}
                                                                        onClick={() => handleSelectSuggestion(s)}
                                                                        className="w-full px-5 py-4 text-left hover:bg-white/10 flex flex-col transition-colors border-b border-white/5 last:border-none"
                                                                    >
                                                                        <span className="font-bold text-sm">{s.name}</span>
                                                                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">
                                                                            {s.equipment} • {Array.from(new Set(s.primaryMuscles)).join(', ')}
                                                                        </span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleAiLookup();
                                                        }}
                                                        disabled={!formData.name.trim() || aiLoading}
                                                        className="w-14 h-14 rounded-2xl shrink-0 bg-white/5 hover:bg-white/10"
                                                    >
                                                        {aiLoading ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <Sparkles className="w-5 h-5 text-rose-500" />
                                                        )}
                                                    </Button>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground flex items-center gap-2 pl-1">
                                                    <Search className="w-3 h-3" /> Auto-suggest from 800+ exercises or use AI.
                                                </p>
                                            </div>

                                            <div className="space-y-4">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Equipment</Label>
                                                <Select
                                                    value={formData.equipment}
                                                    onValueChange={v => setFormData({ ...formData, equipment: v as EquipmentType })}
                                                >
                                                    <SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-2xl px-5">
                                                        <SelectValue placeholder="Select equipment" />
                                                    </SelectTrigger>
                                                    <SelectContent className="glass border-white/10">
                                                        {EQUIPMENT_TYPES.map(eq => (
                                                            <SelectItem key={eq} value={eq} className="capitalize">{eq}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 2: Muscle Selection */}
                                    {step === 2 && (
                                        <div className="space-y-6 animate-slide-up">
                                            <div className="flex justify-center gap-3">
                                                <button
                                                    onClick={() => setMuscleMode('primary')}
                                                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${muscleMode === 'primary' ? 'gradient-red text-white shadow-lg' : 'bg-white/5 text-muted-foreground'}`}
                                                >
                                                    Primary ({formData.primaryMuscles?.length || 0})
                                                </button>
                                                <button
                                                    onClick={() => setMuscleMode('secondary')}
                                                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${muscleMode === 'secondary' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white/5 text-muted-foreground'}`}
                                                >
                                                    Secondary ({formData.secondaryMuscles?.length || 0})
                                                </button>
                                            </div>

                                            <div className="bg-rose-950/5 rounded-[3rem] p-8 border border-white/5">
                                                <AnatomyDiagram
                                                    selectedPrimary={formData.primaryMuscles}
                                                    selectedSecondary={formData.secondaryMuscles}
                                                    onTogglePrimary={m => toggleMuscle(m, 'primary')}
                                                    onToggleSecondary={m => toggleMuscle(m, 'secondary')}
                                                    mode={muscleMode}
                                                    gender={gender}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 3: Details */}
                                    {step === 3 && (
                                        <div className="space-y-6 animate-slide-up">
                                            <div className="space-y-4">
                                                <Label htmlFor="repRange" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Rep Range</Label>
                                                <Input
                                                    id="repRange"
                                                    placeholder="e.g. 8-12"
                                                    value={formData.repRange}
                                                    onChange={e => setFormData({ ...formData, repRange: e.target.value })}
                                                    className="bg-white/5 border-white/10 h-14 rounded-2xl px-5"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <Label htmlFor="formCues" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Performance Notes</Label>
                                                <Textarea
                                                    id="formCues"
                                                    placeholder="e.g. Control the descent, squeeze at the top"
                                                    value={formData.formCues}
                                                    onChange={e => setFormData({ ...formData, formCues: e.target.value })}
                                                    className="bg-white/5 border-white/10 h-24 rounded-2xl p-5"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <Label htmlFor="tutorialUrl" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tutorial Link</Label>
                                                <Input
                                                    id="tutorialUrl"
                                                    placeholder="YouTube URL..."
                                                    value={formData.tutorialUrl}
                                                    onChange={e => setFormData({ ...formData, tutorialUrl: e.target.value })}
                                                    className="bg-white/5 border-white/10 h-14 rounded-2xl px-5"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 4: Review */}
                                    {step === 4 && (
                                        <div className="space-y-6 animate-slide-up">
                                            <h3 className="text-3xl font-black tracking-tighter text-center">{formData.name}</h3>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="glass-card p-5 text-center">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Equipment</p>
                                                    <p className="font-bold text-sm capitalize">{formData.equipment}</p>
                                                </div>
                                                <div className="glass-card p-5 text-center">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Volume</p>
                                                    <p className="font-bold text-sm">{formData.repRange || 'Dynamic'}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Targeted Intelligence</Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {formData.primaryMuscles.map(m => (
                                                        <span key={m} className="px-4 py-2 bg-rose-500/10 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-wider border border-rose-500/20">
                                                            {m.replace(/[_-]/g, ' ')}
                                                        </span>
                                                    ))}
                                                    {formData.secondaryMuscles.map(m => (
                                                        <span key={m} className="px-4 py-2 bg-orange-500/10 text-orange-500 rounded-full text-[10px] font-black uppercase tracking-wider border border-orange-500/20">
                                                            {m.replace(/[_-]/g, ' ')}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer Nav */}
                        <div className="flex gap-4 pt-6 pb-12">
                            {isEditMode ? (
                                <>
                                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 h-14 rounded-2xl bg-white/5 hover:bg-white/10">
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="flex-1 h-14 rounded-2xl gradient-red glow-red border-none font-bold"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Intelligence'}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    {step > 1 && (
                                        <Button variant="ghost" onClick={handleBack} className="flex-1 h-14 rounded-2xl bg-white/5 hover:bg-white/10">
                                            <ChevronLeft className="mr-2 w-4 h-4" /> Back
                                        </Button>
                                    )}
                                    {step < 4 ? (
                                        <Button
                                            onClick={handleNext}
                                            disabled={step === 1 && !formData.name.trim()}
                                            className="flex-1 h-14 rounded-2xl gradient-red glow-red border-none font-bold ml-auto"
                                        >
                                            Next Step <ChevronRight className="ml-2 w-4 h-4" />
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={loading || formData.primaryMuscles.length === 0}
                                            className="flex-1 h-14 rounded-2xl gradient-red glow-red border-none font-bold"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Finalize Exercise'}
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
};

export default ExerciseWizard;
