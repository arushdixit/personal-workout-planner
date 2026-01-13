import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, ChevronRight, Sparkles, Loader2, Check, X, Search } from 'lucide-react';
import { db, Exercise, EquipmentType, EQUIPMENT_TYPES } from '@/lib/db';
import { lookupExercise } from '@/lib/openrouter';
import AnatomyDiagram from './AnatomyDiagram';
import { useUser } from '@/context/UserContext';

interface ExerciseWizardProps {
    exercise?: Exercise; // If provided, we're in edit mode
    onComplete: () => void;
    onCancel: () => void;
}

const ExerciseWizard = ({ exercise, onComplete, onCancel }: ExerciseWizardProps) => {
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
        mastered: exercise?.mastered || false,
    });

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
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md space-y-6 animate-scale-in">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <button onClick={onCancel} className="p-2 rounded-full hover:bg-white/10">
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-bold">
                            {isEditMode ? 'Edit Exercise' : 'Add Exercise'}
                        </h2>
                        <div className="w-9" /> {/* Spacer */}
                    </div>

                    {/* Progress */}
                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map(i => (
                            <div
                                key={i}
                                className={`flex-1 h-1 rounded-full transition-all ${i <= step ? 'gradient-red' : 'bg-white/10'
                                    }`}
                            />
                        ))}
                    </div>

                    <div className="glass-card p-6 space-y-6">
                        {/* Step 1: Name + Suggestions + AI */}
                        {step === 1 && (
                            <div className="space-y-4">
                                <div className="space-y-2 relative">
                                    <Label htmlFor="name">Exercise Name</Label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Input
                                                id="name"
                                                placeholder="e.g., Incline Dumbbell Press"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                                className="bg-white/5 border-white/10 w-full"
                                            />
                                            {showSuggestions && (
                                                <div className="absolute z-50 w-full mt-1 glass rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
                                                    {suggestions.map(s => (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => handleSelectSuggestion(s)}
                                                            className="w-full px-4 py-3 text-left hover:bg-white/10 flex flex-col transition-colors border-b border-white/5 last:border-none"
                                                        >
                                                            <span className="font-medium text-sm">{s.name}</span>
                                                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                                                {s.equipment} • {s.primaryMuscles.join(', ')}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            variant="glass"
                                            size="icon"
                                            onClick={handleAiLookup}
                                            disabled={!formData.name.trim() || aiLoading}
                                            title="Lookup with AI"
                                        >
                                            {aiLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Sparkles className="w-4 h-4 text-primary" />
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Search className="w-3 h-3" /> Search from database or use AI.
                                    </p>
                                </div>

                                {/* Equipment */}
                                <div className="space-y-2">
                                    <Label>Equipment</Label>
                                    <Select
                                        value={formData.equipment}
                                        onValueChange={v => setFormData({ ...formData, equipment: v as EquipmentType })}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/10">
                                            <SelectValue placeholder="Select equipment" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {EQUIPMENT_TYPES.map(eq => (
                                                <SelectItem key={eq} value={eq}>{eq}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Muscle Selection */}
                        {step === 2 && (
                            <div className="space-y-4">
                                <div className="flex justify-center gap-2 mb-4">
                                    <Button
                                        variant={muscleMode === 'primary' ? 'default' : 'glass'}
                                        size="sm"
                                        onClick={() => setMuscleMode('primary')}
                                        className={muscleMode === 'primary' ? 'gradient-red border-none' : ''}
                                    >
                                        Primary ({formData.primaryMuscles?.length || 0})
                                    </Button>
                                    <Button
                                        variant={muscleMode === 'secondary' ? 'default' : 'glass'}
                                        size="sm"
                                        onClick={() => setMuscleMode('secondary')}
                                        className={muscleMode === 'secondary' ? 'bg-orange-500 border-none' : ''}
                                    >
                                        Secondary ({formData.secondaryMuscles?.length || 0})
                                    </Button>
                                </div>

                                <AnatomyDiagram
                                    selectedPrimary={formData.primaryMuscles}
                                    selectedSecondary={formData.secondaryMuscles}
                                    onTogglePrimary={m => toggleMuscle(m, 'primary')}
                                    onToggleSecondary={m => toggleMuscle(m, 'secondary')}
                                    mode={muscleMode}
                                    gender={gender}
                                />
                            </div>
                        )}

                        {/* Step 3: Optional Details */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="repRange">Rep Range (optional)</Label>
                                    <Input
                                        id="repRange"
                                        placeholder="e.g., 8-12"
                                        value={formData.repRange}
                                        onChange={e => setFormData({ ...formData, repRange: e.target.value })}
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="formCues">Form Cues (optional)</Label>
                                    <Textarea
                                        id="formCues"
                                        placeholder="e.g., Keep elbows at 45°, chest up, squeeze at top"
                                        value={formData.formCues}
                                        onChange={e => setFormData({ ...formData, formCues: e.target.value })}
                                        className="bg-white/5 border-white/10 min-h-[80px]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tutorialUrl">Tutorial Video URL (optional)</Label>
                                    <Input
                                        id="tutorialUrl"
                                        placeholder="https://youtube.com/watch?v=..."
                                        value={formData.tutorialUrl}
                                        onChange={e => setFormData({ ...formData, tutorialUrl: e.target.value })}
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>

                                <div className="flex items-center justify-between py-2">
                                    <Label htmlFor="mastered">Mark as Mastered</Label>
                                    <Switch
                                        id="mastered"
                                        checked={formData.mastered}
                                        onCheckedChange={v => setFormData({ ...formData, mastered: v })}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 4: Review */}
                        {step === 4 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-center">{formData.name}</h3>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="glass p-3 rounded-xl">
                                        <p className="text-muted-foreground text-xs mb-1">Equipment</p>
                                        <p className="font-semibold">{formData.equipment}</p>
                                    </div>
                                    <div className="glass p-3 rounded-xl">
                                        <p className="text-muted-foreground text-xs mb-1">Rep Range</p>
                                        <p className="font-semibold">{formData.repRange || 'Not set'}</p>
                                    </div>
                                </div>

                                <div className="glass p-3 rounded-xl">
                                    <p className="text-muted-foreground text-xs mb-1">Primary Muscles</p>
                                    <div className="flex flex-wrap gap-1">
                                        {formData.primaryMuscles.length > 0 ? (
                                            formData.primaryMuscles.map(m => (
                                                <span key={m} className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs capitalize">
                                                    {m.replace(/[_-]/g, ' ')}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-muted-foreground">None selected</span>
                                        )}
                                    </div>
                                </div>

                                <div className="glass p-3 rounded-xl">
                                    <p className="text-muted-foreground text-xs mb-1">Secondary Muscles</p>
                                    <div className="flex flex-wrap gap-1">
                                        {formData.secondaryMuscles.length > 0 ? (
                                            formData.secondaryMuscles.map(m => (
                                                <span key={m} className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs capitalize">
                                                    {m.replace(/[_-]/g, ' ')}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-muted-foreground">None selected</span>
                                        )}
                                    </div>
                                </div>

                                {formData.formCues && (
                                    <div className="glass p-3 rounded-xl max-h-[150px] overflow-y-auto">
                                        <p className="text-muted-foreground text-xs mb-1">Form Cues & Instructions</p>
                                        <p className="text-sm">{formData.formCues}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex gap-3 pt-4">
                            {step > 1 && (
                                <Button variant="glass" onClick={handleBack} className="flex-1">
                                    <ChevronLeft className="mr-2 w-4 h-4" /> Back
                                </Button>
                            )}
                            {step < 4 ? (
                                <Button
                                    variant="default"
                                    onClick={handleNext}
                                    disabled={step === 1 && !formData.name.trim()}
                                    className="flex-1 gradient-red glow-red border-none"
                                >
                                    Next <ChevronRight className="ml-2 w-4 h-4" />
                                </Button>
                            ) : (
                                <Button
                                    variant="default"
                                    onClick={handleSubmit}
                                    disabled={loading || formData.primaryMuscles.length === 0}
                                    className="flex-1 gradient-red glow-red border-none"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Check className="mr-2 w-4 h-4" />
                                            {isEditMode ? 'Update' : 'Save Exercise'}
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Click outside to close suggestions */}
            {showSuggestions && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setShowSuggestions(false)}
                />
            )}
        </div>
    );
};

export default ExerciseWizard;
