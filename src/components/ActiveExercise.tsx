import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Play, AlertTriangle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
    const [detailsOpen, setDetailsOpen] = useState(false);
    const gender = currentUser?.gender || 'male';

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
            <div className="pt-6 px-4 pb-4">
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

            {/* Anatomy / Tutorial Tabs */}
            <div className="px-4 mb-6">
                <Tabs defaultValue="anatomy" className="w-full">
                    <TabsList className="w-full grid grid-cols-2 mb-4">
                        <TabsTrigger value="anatomy">Anatomy</TabsTrigger>
                        <TabsTrigger value="tutorial">Tutorial</TabsTrigger>
                    </TabsList>

                    <TabsContent value="anatomy">
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

                    <TabsContent value="tutorial">
                        <div className="glass-card p-4">
                            {exercise.tutorialUrl ? (
                                <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                                    <iframe
                                        src={exercise.tutorialUrl}
                                        className="w-full h-full rounded-xl"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            ) : (
                                <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                                    <div className="text-center">
                                        <Play className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                                        <p className="text-muted-foreground">No tutorial available</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Set logger */}
            <div className="px-4">
                <SetLogger
                    sets={exercise.sets}
                    onSetComplete={handleSetComplete}
                    onAddSet={onAddSet}
                    unit={unit}
                    onUnitChange={onUnitChange}
                />
            </div>

            {/* Personal Notes */}
            <div className="px-4 mt-6">
                <div className="glass-card p-4">
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
            </div>

            {/* Collapsible Details Section */}
            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen} className="px-4 mt-6">
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium w-full">
                    <ChevronDown className={cn(
                        "w-4 h-4 transition-transform",
                        detailsOpen && "rotate-180"
                    )} />
                    Exercise Details
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                    <Tabs defaultValue="tips">
                        <TabsList className="w-full grid grid-cols-5 mb-4">
                            <TabsTrigger value="tips">Tips</TabsTrigger>
                            <TabsTrigger value="beginner">Beginner</TabsTrigger>
                            <TabsTrigger value="mistakes">Mistakes</TabsTrigger>
                            <TabsTrigger value="safety">Safety</TabsTrigger>
                            <TabsTrigger value="form">Form</TabsTrigger>
                        </TabsList>

                        <TabsContent value="tips">
                            <div className="glass-card p-4 space-y-2">
                                {exercise.tips?.map((tip, i) => (
                                    <p key={i} className="text-sm">{tip}</p>
                                )) || <p className="text-muted-foreground text-sm">No tips available</p>}
                            </div>
                        </TabsContent>

                        <TabsContent value="beginner">
                            <div className="glass-card p-4 space-y-2">
                                {exercise.beginnerFriendlyInstructions?.map((item, i) => (
                                    <p key={i} className="text-sm">{item}</p>
                                )) || <p className="text-muted-foreground text-sm">No beginner tips</p>}
                            </div>
                        </TabsContent>

                        <TabsContent value="mistakes">
                            <div className="glass-card p-4 space-y-2">
                                {exercise.commonMistakes?.map((mistake, i) => (
                                    <p key={i} className="text-sm">{mistake}</p>
                                )) || <p className="text-muted-foreground text-sm">No common mistakes recorded</p>}
                            </div>
                        </TabsContent>

                        <TabsContent value="safety">
                            <div className="glass-card p-4 space-y-2">
                                {exercise.injuryPreventionTips?.map((tip, i) => (
                                    <p key={i} className="text-sm">{tip}</p>
                                )) || <p className="text-muted-foreground text-sm">No safety tips</p>}
                            </div>
                        </TabsContent>

                        <TabsContent value="form">
                            <div className="glass-card p-4">
                                <p className="text-sm">{exercise.formCues || 'No form cues available'}</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CollapsibleContent>
            </Collapsible>

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
