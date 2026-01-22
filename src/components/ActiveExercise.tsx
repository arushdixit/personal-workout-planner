import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Play, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnatomyDiagram from "./AnatomyDiagram";
import SetLogger from "./SetLogger";
import RestTimer from "./RestTimer";
import { useUser } from "@/context/UserContext";
import { WorkoutSet, Exercise } from "@/lib/db";

interface ActiveExerciseProps {
    exercise: Exercise & { sets: WorkoutSet[] };
    currentIndex: number;
    totalExercises: number;
    onPrevious: () => void;
    onNext: () => void;
    onSetComplete: (setId: number, weight: number, reps: number, unit: 'kg' | 'lbs') => void;
    onAddSet: () => void;
    unit: 'kg' | 'lbs';
    onUnitChange: (unit: 'kg' | 'lbs') => void;
    personalNote?: string;
    onNoteChange: (note: string) => void;
}

const ActiveExercise = ({
    exercise,
    currentIndex,
    totalExercises,
    onPrevious,
    onNext,
    onSetComplete,
    onAddSet,
    unit,
    onUnitChange,
    personalNote,
    onNoteChange,
}: ActiveExerciseProps) => {
    const { currentUser } = useUser();
    const [showRest, setShowRest] = useState(false);
    const gender = currentUser?.gender || 'male';
    const [activeTab, setActiveTab] = useState<'sets' | 'tutorial' | 'muscles'>('sets');

    const progress = ((currentIndex + 1) / totalExercises) * 100;
    const completedSets = exercise.sets.filter((s) => s.completed).length;

    const handleSetComplete = (setId: number, weight: number, reps: number, setUnit: 'kg' | 'lbs') => {
        onSetComplete(setId, weight, reps, setUnit);
        if (completedSets + 1 < exercise.sets.length) {
            setShowRest(true);
        }
    };

    return (
        <div className="min-h-screen pb-24">
            {/* Progress bar */}
            <div className="fixed top-0 left-0 right-0 z-40 h-1 bg-muted">
                <div
                    className="h-full gradient-red transition-all duration-500 glow-red"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Header */}
            <div className="relative z-30 pt-14 px-4 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onPrevious}
                        disabled={currentIndex === 0}
                        aria-label="Previous exercise"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <span className="text-sm font-medium text-muted-foreground">
                        {currentIndex + 1} / {totalExercises}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onNext}
                        disabled={currentIndex === totalExercises - 1}
                        aria-label="Next exercise"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </Button>
                </div>

                <h1 className="text-2xl font-bold text-center mb-2">{exercise.name}</h1>
                <p className="text-center text-muted-foreground text-sm">
                    {completedSets} / {exercise.sets.length} sets completed
                </p>
            </div>

            {/* Warning banner */}
            {exercise.tips && exercise.tips.length > 0 && (
                <div className="mx-4 mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-start gap-3 animate-slide-up">
                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-destructive text-sm">Previous Note</p>
                        <p className="text-sm text-destructive/80">{exercise.tips[0]}</p>
                    </div>
                </div>
            )}

            {/* Main Content Tabs */}
            <div className="px-4 mb-6">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'sets' | 'tutorial' | 'muscles')} className="w-full">
                    <TabsList className="w-full grid grid-cols-3 mb-6">
                        <TabsTrigger value="sets">Sets</TabsTrigger>
                        <TabsTrigger value="tutorial">Tutorial</TabsTrigger>
                        <TabsTrigger value="muscles">Target Muscles</TabsTrigger>
                    </TabsList>

                    <TabsContent value="sets" className="mt-0 space-y-6">
                        <SetLogger
                            sets={exercise.sets}
                            onSetComplete={handleSetComplete}
                            onAddSet={onAddSet}
                            unit={unit}
                            onUnitChange={onUnitChange}
                        />
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                How did this feel?
                            </label>
                            <Textarea
                                placeholder="Add notes about form, pain, or progress..."
                                value={personalNote || ''}
                                onChange={(e) => onNoteChange(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="tutorial" className="mt-0">
                        <div className="space-y-6">
                            {exercise.tutorialUrl && (
                                <div className="aspect-video bg-muted rounded-xl overflow-hidden">
                                    <iframe
                                        src={exercise.tutorialUrl}
                                        className="w-full h-full"
                                        allowFullScreen
                                    />
                                </div>
                            )}

                            {exercise.beginnerFriendlyInstructions && exercise.beginnerFriendlyInstructions.length > 0 && (
                                <section className="space-y-3">
                                    <h3 className="font-semibold text-emerald-400">Beginner Friendly Tips</h3>
                                    <div className="space-y-2">
                                        {exercise.beginnerFriendlyInstructions.map((item, i) => (
                                            <p key={i} className="text-sm text-muted-foreground">{item}</p>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
                                <section className="space-y-3">
                                    <h3 className="font-semibold text-orange-400">Things to Avoid</h3>
                                    <div className="space-y-2">
                                        {exercise.commonMistakes.map((mistake, i) => (
                                            <p key={i} className="text-sm text-orange-100/90">{mistake}</p>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {exercise.formCues && (
                                <section className="space-y-3">
                                    <h3 className="font-semibold text-rose-400">Form Cues</h3>
                                    <p className="text-sm text-white/90">{exercise.formCues}</p>
                                </section>
                            )}

                            {exercise.injuryPreventionTips && exercise.injuryPreventionTips.length > 0 && (
                                <section className="space-y-3">
                                    <h3 className="font-semibold text-blue-400">Injury Prevention</h3>
                                    <div className="space-y-2">
                                        {exercise.injuryPreventionTips.map((tip, i) => (
                                            <p key={i} className="text-sm text-blue-100/90">{tip}</p>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {exercise.repRange && (
                                <div className="bg-white/5 rounded-xl p-4">
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest">Recommended Rep Range</p>
                                    <p className="text-2xl font-bold text-rose-500">{exercise.repRange}</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="muscles" className="mt-0">
                        <div className="glass-card p-4">
                            <AnatomyDiagram
                                selectedPrimary={exercise.primaryMuscles || []}
                                selectedSecondary={exercise.secondaryMuscles || []}
                                view="front"
                                gender={gender}
                                mode="read-only"
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Rest timer overlay */}
            {showRest && (
                <RestTimer
                    duration={90}
                    onComplete={() => setShowRest(false)}
                    onSkip={() => setShowRest(false)}
                />
            )}
        </div>
    );
};

export default ActiveExercise;
