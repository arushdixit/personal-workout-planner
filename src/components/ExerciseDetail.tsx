import { Exercise } from '@/lib/db';
import { X, ChevronLeft, Edit, Dumbbell } from 'lucide-react';
import AnatomyDiagram from './AnatomyDiagram';
import MuscleIcon from './MuscleIcon';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import { useState, useRef, useEffect } from 'react';

interface ExerciseDetailProps {
    exercise: Exercise;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit?: () => void;
}

type Tab = 'instructions' | 'target';

const ExerciseDetail = ({ exercise, open, onOpenChange, onEdit }: ExerciseDetailProps) => {
    const { currentUser } = useUser();
    const gender = currentUser?.gender || 'male';
    const [activeTab, setActiveTab] = useState<Tab>('instructions');
    const dialogRef = useRef<HTMLDivElement>(null);

    // Close modal when exercise changes or open becomes false
    useEffect(() => {
        if (!exercise || !open) {
            return;
        }
    }, [exercise, open]);

    // Focus the modal when it opens
    useEffect(() => {
        if (open && dialogRef.current) {
            dialogRef.current.focus();
        }
    }, [open]);

    if (!open && !exercise?.name) return null;

    // Provide defaults for mapping to avoid crashes when exercise is empty
    const primaryMuscles = exercise?.primaryMuscles || [];
    const secondaryMuscles = exercise?.secondaryMuscles || [];
    const beginnerInstructions = exercise?.beginnerFriendlyInstructions || exercise?.instructions || [];
    const commonMistakes = exercise?.commonMistakes || [];
    const formCues = exercise?.formCuesArray || (exercise?.formCues ? [exercise.formCues] : []);
    const injuryPreventionTips = exercise?.injuryPreventionTips || [];

    const content = (
        <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${exercise.name} details`}
            tabIndex={-1}
            className={cn(
                "fixed top-0 left-0 right-0 bottom-0 z-50 bg-background flex flex-col focus:outline-none overflow-hidden transition-all duration-300",
                open ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
            )}
        >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 z-50 bg-background border-b border-white/5">
                <button
                    onClick={() => onOpenChange(false)}
                    className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors"
                    aria-label="Go back"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="flex-1 text-lg font-bold text-center px-4 truncate">{exercise.name}</h1>
                {onEdit && (
                    <button
                        onClick={onEdit}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                        aria-label="Edit exercise"
                    >
                        <Edit className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Video/Image Area */}
            <div className="flex-shrink-0 bg-gradient-to-b from-zinc-900 to-background aspect-video max-h-[40vh] relative overflow-hidden">
                {exercise.tutorialUrl ? (
                    // YouTube Video Embed
                    <iframe
                        className="absolute inset-0 w-full h-full"
                        src={exercise.tutorialUrl.includes('youtube.com') || exercise.tutorialUrl.includes('youtu.be')
                            ? exercise.tutorialUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
                            : exercise.tutorialUrl
                        }
                        title={`${exercise.name} tutorial`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    // Fallback to exercise image placeholder
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                        <div className="text-center p-8">
                            <Dumbbell className="w-16 h-16 mx-auto mb-4 text-white/20" />
                            <p className="text-sm text-white/40">No video available</p>
                        </div>
                    </div>
                )}
                {/* Tempo indicator in bottom right */}
                {exercise.tempo && (
                    <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                        <span className="text-white font-bold text-sm">{exercise.tempo}</span>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex-shrink-0 flex gap-2 px-6 border-b border-white/5">
                <button
                    onClick={() => setActiveTab('instructions')}
                    className={cn(
                        "px-6 py-3 text-sm font-bold transition-all relative",
                        activeTab === 'instructions'
                            ? "text-white"
                            : "text-muted-foreground hover:text-white/70"
                    )}
                >
                    Instructions
                    {activeTab === 'instructions' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('target')}
                    className={cn(
                        "px-6 py-3 text-sm font-bold transition-all relative",
                        activeTab === 'target'
                            ? "text-white"
                            : "text-muted-foreground hover:text-white/70"
                    )}
                >
                    Target
                    {activeTab === 'target' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                    )}
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar">
                {activeTab === 'instructions' && (
                    <div className="px-6 py-6 space-y-8">
                        {/* Personal Notes - Always at the top if they exist */}
                        {exercise.personalNotes && (
                            <section className="space-y-4 animate-slide-up">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                        Your Personal Notes
                                    </h2>
                                    {onEdit && (
                                        <button
                                            onClick={onEdit}
                                            className="px-3 py-1.5 text-xs font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors flex items-center gap-1.5"
                                        >
                                            <Edit className="w-3 h-3" />
                                            Edit
                                        </button>
                                    )}
                                </div>
                                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-6">
                                    <p className="text-sm text-purple-50/90 leading-relaxed whitespace-pre-wrap">
                                        {exercise.personalNotes}
                                    </p>
                                </div>
                            </section>
                        )}

                        {/* Beginner Friendly Instructions */}
                        {beginnerInstructions.length > 0 && (
                            <section className="space-y-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Beginner Friendly Tips
                                </h2>
                                <div className="space-y-3">
                                    {beginnerInstructions.map((instruction, i) => (
                                        <div key={i} className="flex gap-3 items-start">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold mt-0.5">
                                                {i + 1}
                                            </span>
                                            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                                                {instruction}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Add Personal Notes Button - Show if no notes exist */}
                        {!exercise.personalNotes && onEdit && (
                            <button
                                onClick={onEdit}
                                className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600/20 to-purple-500/20 border-2 border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 p-6"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-500/10 to-purple-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                <div className="relative flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Edit className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-purple-300 mb-1">Add Your Personal Notes</p>
                                        <p className="text-xs text-purple-400/70">Customize this exercise with your own tips and reminders</p>
                                    </div>
                                </div>
                            </button>
                        )}

                        {/* Things to Avoid */}
                        {commonMistakes.length > 0 && (
                            <section className="space-y-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                    Things to Avoid
                                </h2>
                                <div className="space-y-3">
                                    {commonMistakes.map((mistake, i) => (
                                        <div key={i} className="flex gap-3 items-start bg-orange-500/5 border border-orange-500/10 rounded-xl p-4">
                                            <span className="text-orange-500 font-bold text-lg leading-none">×</span>
                                            <p className="text-sm text-orange-100/90 leading-relaxed flex-1">
                                                {mistake}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Form Cues */}
                        {formCues.length > 0 && (
                            <section className="space-y-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    Form Cues
                                </h2>
                                <div className="space-y-3">
                                    {formCues.map((cue, i) => (
                                        <div key={i} className="flex gap-3 items-start bg-rose-500/5 border border-rose-500/10 rounded-xl p-4">
                                            <span className="w-2 h-2 rounded-full bg-rose-500 mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                            <p className="text-sm text-white/90 leading-relaxed flex-1 font-medium">
                                                {cue}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Injury Prevention Tips */}
                        {injuryPreventionTips.length > 0 && (
                            <section className="space-y-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    Injury Prevention
                                </h2>
                                <div className="space-y-3">
                                    {injuryPreventionTips.map((tip, i) => (
                                        <div key={i} className="flex gap-3 items-start bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
                                            <span className="text-blue-500 font-bold text-lg leading-none">🛡️</span>
                                            <p className="text-sm text-blue-100/90 leading-relaxed flex-1">
                                                {tip}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Rep Range */}
                        {exercise.repRange && (
                            <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">
                                    Recommended Rep Range
                                </p>
                                <p className="text-3xl font-black text-rose-500">{exercise.repRange}</p>
                            </section>
                        )}
                    </div>
                )}

                {activeTab === 'target' && (
                    <div className="px-6 py-6 space-y-8">
                        {/* Primary Muscle Groups */}
                        {primaryMuscles.length > 0 && (
                            <section className="space-y-4">
                                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                    Primary Muscle Groups
                                </h2>
                                <div className="space-y-3">
                                    {primaryMuscles.map((muscle) => (
                                        <div
                                            key={muscle}
                                            className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-white/10"
                                        >
                                            <MuscleIcon muscleName={muscle} isPrimary={true} />
                                            <span className="text-base font-semibold capitalize">
                                                {muscle.replace(/[_-]/g, ' ')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Secondary Muscle Groups */}
                        {secondaryMuscles.length > 0 && (
                            <section className="space-y-4">
                                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                    Secondary Muscle Groups
                                </h2>
                                <div className="space-y-3">
                                    {secondaryMuscles.map((muscle) => (
                                        <div
                                            key={muscle}
                                            className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-white/10"
                                        >
                                            <MuscleIcon muscleName={muscle} isPrimary={false} />
                                            <span className="text-base font-semibold capitalize">
                                                {muscle.replace(/[_-]/g, ' ')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(content, document.body);
};

export default ExerciseDetail;
