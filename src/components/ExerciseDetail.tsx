import { Exercise } from '@/lib/db';
import { X, Dumbbell, Target, Info, Video, ListChecks, Lightbulb, Edit, ChevronLeft, ShieldCheck, AlertCircle, Timer, Zap } from 'lucide-react';
import AnatomyDiagram from './AnatomyDiagram';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface ExerciseDetailProps {
    exercise: Exercise;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit?: () => void;
}

const ExerciseDetail = ({ exercise, open, onOpenChange, onEdit }: ExerciseDetailProps) => {
    const { currentUser } = useUser();
    const gender = currentUser?.gender || 'male';

    if (!open && !exercise?.name) return null;

    // Provide defaults for mapping to avoid crashes when exercise is empty
    const primaryMuscles = exercise?.primaryMuscles || [];
    const secondaryMuscles = exercise?.secondaryMuscles || [];
    const instructions = exercise?.instructions || [];
    const tips = exercise?.tips || [];

    const content = (
        <div className={cn(
            "fixed top-0 left-0 right-0 bottom-20 z-[9999] bg-background flex flex-col focus:outline-none overflow-hidden transition-all duration-300",
            open ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
        )}>

            <div className="flex-shrink-0 h-20 flex items-center justify-between px-6 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors group"
                        aria-label="Go back"
                    >
                        <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-[0.4em] text-white/70">Exercise Intel</span>
                    </div>
                </div>
                <button
                    onClick={() => onOpenChange(false)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                    aria-label="Close"
                >
                    <X className="w-8 h-8 text-muted-foreground" />
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar pb-32">
                <div className="relative pt-12 pb-14 px-8 bg-gradient-to-b from-rose-950/20 to-transparent">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center gap-3 text-rose-500 font-bold uppercase text-xs tracking-[0.5em] mb-4">
                            <Dumbbell className="w-5 h-5" />
                            {exercise.equipment}
                        </div>
                        <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8 mt-2">
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.85]">
                                {exercise.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                {exercise.difficulty && (
                                    <Badge
                                        className={cn(
                                            "px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border shadow-lg",
                                            exercise.difficulty === 'Beginner' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                            exercise.difficulty === 'Intermediate' && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                                            exercise.difficulty === 'Advanced' && "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                        )}
                                    >
                                        {exercise.difficulty}
                                    </Badge>
                                )}
                                {exercise.category && (
                                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-xl backdrop-blur-md">
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{exercise.category}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 max-w-5xl mx-auto w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Visuals */}
                        <div className="lg:col-span-5 space-y-8">
                            <section className="space-y-6">
                                <div className="flex items-center gap-2 text-rose-500 font-bold uppercase text-xs tracking-widest border-l-2 border-rose-500 pl-4">
                                    <Target className="w-4 h-4" />
                                    Biomechanical Map
                                </div>
                                <div className="bg-white/[0.02] rounded-[2rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
                                    <AnatomyDiagram
                                        selectedPrimary={primaryMuscles}
                                        selectedSecondary={secondaryMuscles}
                                        gender={gender}
                                        mode="read-only"
                                    />
                                </div>
                            </section>

                            {exercise.tempo && (
                                <div className="bg-white/[0.02] p-8 rounded-[2rem] border border-white/5 flex items-center justify-between group">
                                    <div className="flex items-center gap-5">
                                        <div className="p-4 rounded-2xl bg-rose-600/10 border border-rose-600/20 shadow-lg shadow-rose-600/10">
                                            <Timer className="w-6 h-6 text-rose-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-black mb-1">Optimal Tempo</p>
                                            <p className="text-2xl font-black text-white">{exercise.tempo}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {onEdit && (
                                <Button
                                    onClick={onEdit}
                                    className="w-full h-16 rounded-[2rem] text-lg font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-foreground transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]"
                                >
                                    <Edit className="w-5 h-5" />
                                    Personalize Notes
                                </Button>
                            )}
                        </div>

                        {/* Intelligence Content */}
                        <div className="lg:col-span-7 space-y-12">
                            {/* Muscle Focus */}
                            <section className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="text-xs text-muted-foreground uppercase tracking-widest font-black flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.4)]" /> Primary Focus
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {primaryMuscles.map(m => (
                                            <span key={m} className="px-5 py-3 bg-rose-600/10 text-rose-400 rounded-xl text-xs font-black uppercase tracking-wider border border-rose-600/20 shadow-sm">
                                                {m.replace(/[_-]/g, ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                {secondaryMuscles.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="text-xs text-muted-foreground uppercase tracking-widest font-black flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.4)]" /> Assisting
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {secondaryMuscles.map(m => (
                                                <span key={m} className="px-5 py-3 bg-orange-400/10 text-orange-400 rounded-xl text-xs font-bold border border-orange-400/20 uppercase tracking-wide shadow-sm">
                                                    {m.replace(/[_-]/g, ' ')}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* Performance Metrics */}
                            <div className="flex flex-wrap gap-4">
                                {exercise.repRange && (
                                    <div className="flex-1 min-w-[160px] bg-white/[0.02] p-10 rounded-[2rem] border border-white/5 group hover:border-rose-500/20 transition-colors">
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-black mb-3">Volume Range</p>
                                        <p className="text-5xl font-black text-rose-500 tracking-tighter transition-transform group-hover:scale-105 origin-left">{exercise.repRange}</p>
                                    </div>
                                )}
                            </div>

                            {/* Procedure */}
                            {(exercise.beginnerFriendlyInstructions || exercise.instructions) && (
                                <section className="space-y-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-rose-500 font-bold uppercase text-xs tracking-widest border-l-2 border-rose-500 pl-4">
                                            <ListChecks className="w-5 h-5" />
                                            Execution Protocol
                                        </div>
                                        {exercise.beginnerFriendlyInstructions && (
                                            <Badge variant="outline" className="text-xs uppercase tracking-wider border-rose-500/30 text-rose-500/70 bg-rose-500/5 px-3 py-1">
                                                Simplified for Clarity
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="space-y-8">
                                        {(exercise.beginnerFriendlyInstructions || instructions).map((step, i) => (
                                            <div key={i} className="flex gap-8 group items-start">
                                                <span className="flex-shrink-0 w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-xs font-black text-white border border-white/10 group-hover:bg-rose-600 group-hover:border-rose-500 transition-all shadow-xl">
                                                    {(i + 1).toString().padStart(2, '0')}
                                                </span>
                                                <p className="text-lg text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors pt-1.5 font-medium">
                                                    {step}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Intelligence Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Form Cues */}
                                {(exercise.formCuesArray || exercise.formCues) && (
                                    <div className="bg-rose-950/20 p-10 rounded-[2rem] border border-rose-900/30 relative overflow-hidden group">
                                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/10 blur-[80px] rounded-full group-hover:bg-rose-500/20 transition-all" />
                                        <div className="flex items-center gap-3 mb-8">
                                            <Zap className="w-6 h-6 text-rose-500" />
                                            <span className="text-xs text-rose-500 uppercase tracking-widest font-black">Critical Cues</span>
                                        </div>

                                        {exercise.formCuesArray ? (
                                            <ul className="space-y-4">
                                                {exercise.formCuesArray.map((cue, i) => (
                                                    <li key={i} className="text-base font-semibold leading-relaxed flex items-start gap-3">
                                                        <span className="w-2 h-2 rounded-full bg-rose-500 mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                                        {cue}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-base font-semibold leading-[1.6]">{exercise.formCues}</p>
                                        )}
                                    </div>
                                )}

                                {/* Common Mistakes */}
                                {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
                                    <div className="bg-orange-950/10 p-10 rounded-[2rem] border border-orange-900/20 relative overflow-hidden group">
                                        <div className="flex items-center gap-3 mb-8">
                                            <AlertCircle className="w-6 h-6 text-orange-500" />
                                            <span className="text-xs text-orange-500 uppercase tracking-widest font-black">Avoid These</span>
                                        </div>
                                        <ul className="space-y-4">
                                            {exercise.commonMistakes.map((mistake, i) => (
                                                <li key={i} className="text-sm text-orange-100 font-medium leading-relaxed flex items-start gap-3 italic">
                                                    <span className="text-orange-500 font-bold text-lg leading-none mt-0.5">×</span>
                                                    {mistake}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Injury Prevention */}
                                {exercise.injuryPreventionTips && exercise.injuryPreventionTips.length > 0 && (
                                    <div className="md:col-span-2 bg-emerald-950/10 p-10 rounded-[2rem] border border-emerald-900/20 relative overflow-hidden group">
                                        <div className="flex items-center gap-3 mb-8">
                                            <ShieldCheck className="w-6 h-6 text-emerald-500" />
                                            <span className="text-xs text-emerald-500 uppercase tracking-widest font-black">Safety Protocol</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            {exercise.injuryPreventionTips.map((tip, i) => (
                                                <div key={i} className="flex gap-3 p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-sm font-medium text-emerald-100 leading-relaxed backdrop-blur-sm">
                                                    {tip}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {tips.length > 0 && (
                                    <div className="md:col-span-2 space-y-6">
                                        <div className="flex items-center gap-3 text-amber-500 font-bold uppercase text-xs tracking-widest pl-4">
                                            <Lightbulb className="w-5 h-5" />
                                            Legacy Wisdom
                                        </div>
                                        <div className="grid gap-4">
                                            {tips.map((tip, i) => (
                                                <div key={i} className="flex gap-4 p-6 bg-amber-500/5 rounded-[2rem] border border-amber-500/10 text-sm font-medium text-amber-100/90 leading-relaxed italic shadow-inner">
                                                    <span className="text-amber-500 font-black text-xl">•</span>
                                                    {tip}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Multi-Media */}
                            {exercise.tutorialUrl && (
                                <a
                                    href={exercise.tutorialUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block relative group overflow-hidden rounded-[2rem] p-1 shadow-2xl transition-all active:scale-[0.98]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-rose-400 group-hover:opacity-100 opacity-80 transition-opacity" />
                                    <div className="relative bg-background rounded-[1.9rem] p-10 flex items-center justify-between">
                                        <div className="flex items-center gap-8">
                                            <div className="w-20 h-20 rounded-3xl bg-rose-600 flex items-center justify-center shadow-2xl shadow-rose-600/40 group-hover:rotate-6 transition-transform">
                                                <Video className="w-10 h-10 text-white" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-black tracking-tight mb-1">Clinical Tutorial</div>
                                                <div className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Watch execution details</div>
                                            </div>
                                        </div>
                                        <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/5 transition-all">
                                            <X className="w-8 h-8 rotate-45" />
                                        </div>
                                    </div>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
};

export default ExerciseDetail;
