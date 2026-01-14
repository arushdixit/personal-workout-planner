import { Exercise } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { X, Dumbbell, Target, Info, Video, CheckCircle2, ListChecks, Lightbulb, Clock, GitFork, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExerciseDetailProps {
    exercise: Exercise;
    onClose: () => void;
    onEdit?: () => void;
}

const ExerciseDetail = ({ exercise, onClose, onEdit }: ExerciseDetailProps) => {
    return (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
                    {/* Header Image/Background */}
                    <div className="h-32 bg-gradient-to-br from-red-600/20 to-orange-600/20 relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-8 -mt-12 relative">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                            <div className="space-y-1">
                                <h2 className="text-3xl font-bold tracking-tight">{exercise.name}</h2>
                                <div className="flex items-center gap-2 text-muted-foreground uppercase text-xs tracking-widest font-bold">
                                    <Dumbbell className="w-4 h-4" />
                                    {exercise.equipment}
                                </div>
                            </div>
                            {onEdit && (
                                <Button
                                    onClick={onEdit}
                                    variant="default"
                                    className="gradient-red glow-red border-none h-11 px-8 rounded-xl shadow-lg"
                                >
                                    Edit Note / Video
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column: Muscles & Info */}
                            <div className="space-y-8">
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider">
                                        <Target className="w-4 h-4" />
                                        Muscle Groups
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-2">Primary Targets</p>
                                            <div className="flex flex-wrap gap-2">
                                                {exercise.primaryMuscles.map(m => (
                                                    <span key={m} className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium border border-red-500/20 capitalize">
                                                        {m.replace(/[_-]/g, ' ')}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        {exercise.secondaryMuscles.length > 0 && (
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-2">Secondary / Affected</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {exercise.secondaryMuscles.map(m => (
                                                        <span key={m} className="px-3 py-1.5 bg-orange-500/10 text-orange-400 rounded-lg text-sm font-medium border border-orange-500/20 capitalize">
                                                            {m.replace(/[_-]/g, ' ')}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {exercise.repRange && (
                                    <section className="space-y-2">
                                        <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Target Range
                                        </div>
                                        <p className="text-xl font-semibold bg-white/5 p-4 rounded-2xl inline-block border border-white/5">
                                            {exercise.repRange} Reps
                                        </p>
                                    </section>
                                )}

                                {exercise.tutorialUrl && (
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider">
                                            <Video className="w-4 h-4" />
                                            Video Resource
                                        </div>
                                        <a
                                            href={exercise.tutorialUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 group"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Video className="w-5 h-5 text-red-400" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">Watch Tutorial</p>
                                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{exercise.tutorialUrl}</p>
                                            </div>
                                        </a>
                                    </section>
                                )}
                            </div>

                            {/* Right Column: Descriptions & Instructions */}
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    {exercise.tempo && (
                                        <section className="space-y-2">
                                            <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider">
                                                < Clock className="w-4 h-4" />
                                                Tempo
                                            </div>
                                            <p className="text-lg font-mono bg-white/5 p-3 rounded-xl border border-white/5">
                                                {exercise.tempo}
                                            </p>
                                        </section>
                                    )}
                                    {exercise.aliases && exercise.aliases.length > 0 && (
                                        <section className="space-y-2">
                                            <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider">
                                                <Copy className="w-4 h-4" />
                                                Also known as
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {exercise.aliases.map(a => (
                                                    <span key={a} className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-md">
                                                        {a}
                                                    </span>
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </div>

                                {exercise.variationOf && exercise.variationOf.length > 0 && (
                                    <section className="space-y-2">
                                        <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider">
                                            <GitFork className="w-4 h-4" />
                                            Variation Of
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {exercise.variationOf.map(v => (
                                                <span key={v} className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-md capitalize">
                                                    {v}
                                                </span>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {(exercise.formCues || exercise.description) && (
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider">
                                            <Info className="w-4 h-4" />
                                            About & Form Cues
                                        </div>
                                        <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                                            {exercise.description && (
                                                <p className="text-sm leading-relaxed text-muted-foreground italic">
                                                    "{exercise.description}"
                                                </p>
                                            )}
                                            {exercise.formCues && (
                                                <p className="text-sm leading-relaxed font-medium">
                                                    {exercise.formCues}
                                                </p>
                                            )}
                                        </div>
                                    </section>
                                )}

                                {exercise.instructions && exercise.instructions.length > 0 && (
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider">
                                            <ListChecks className="w-4 h-4" />
                                            Step-by-Step
                                        </div>
                                        <div className="space-y-3">
                                            {exercise.instructions.map((step, i) => (
                                                <div key={i} className="flex gap-4 group">
                                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold mt-0.5 border border-white/10 group-hover:bg-primary transition-colors">
                                                        {i + 1}
                                                    </span>
                                                    <p className="text-sm text-muted-foreground leading-snug group-hover:text-foreground transition-colors">
                                                        {step}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {exercise.tips && exercise.tips.length > 0 && (
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-2 text-orange-400 font-bold uppercase text-xs tracking-wider">
                                            <Lightbulb className="w-4 h-4" />
                                            Expert Tips
                                        </div>
                                        <ul className="space-y-2">
                                            {exercise.tips.map((tip, i) => (
                                                <li key={i} className="flex gap-2 text-sm text-muted-foreground italic">
                                                    <span className="text-orange-400">•</span>
                                                    {tip}
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExerciseDetail;
