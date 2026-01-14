import { Exercise } from '@/lib/db';
import { X, Dumbbell, Target, Info, Video, ListChecks, Lightbulb, Edit, ChevronLeft } from 'lucide-react';
import AnatomyDiagram from './AnatomyDiagram';
import { useUser } from '@/context/UserContext';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from '@/components/ui/button';

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

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="h-[98dvh] border-none bg-background flex flex-col focus:outline-none">
                <DrawerHeader className="sr-only">
                    <DrawerTitle>{exercise.name}</DrawerTitle>
                    <DrawerDescription>{exercise.description || `Details for ${exercise.name}`}</DrawerDescription>
                </DrawerHeader>

                {/* Custom Header */}
                <div className="flex-shrink-0 sticky top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => onOpenChange(false)}
                            className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors"
                            aria-label="Go back"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Exercise Intel</span>
                        </div>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6 text-muted-foreground" />
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar pb-32">
                    {/* Visual Hero */}
                    <div className="relative pt-8 pb-10 px-6 bg-gradient-to-b from-rose-950/20 to-transparent">
                        <div className="max-w-5xl mx-auto">
                            <div className="flex items-center gap-2 text-rose-500 font-bold uppercase text-[10px] tracking-[0.4em] mb-3">
                                <Dumbbell className="w-4 h-4" />
                                {exercise.equipment}
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] mb-4">
                                {exercise.name}
                            </h2>
                            {exercise.category && (
                                <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{exercise.category}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-6 max-w-5xl mx-auto w-full">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Visuals */}
                            <div className="lg:col-span-5 space-y-8">
                                <section className="space-y-6">
                                    <div className="flex items-center gap-2 text-rose-500 font-bold uppercase text-[10px] tracking-widest border-l-2 border-rose-500 pl-4">
                                        <Target className="w-4 h-4" />
                                        Biomechanical Map
                                    </div>
                                    <div className="bg-rose-950/5 rounded-[3rem] p-8 border border-white/5 shadow-inner">
                                        <AnatomyDiagram
                                            selectedPrimary={primaryMuscles}
                                            selectedSecondary={secondaryMuscles}
                                            gender={gender}
                                            mode="read-only"
                                        />
                                    </div>
                                </section>

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
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-rose-600" /> Primary Focus
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {primaryMuscles.map(m => (
                                                <span key={m} className="px-5 py-3 bg-rose-600/10 text-rose-400 rounded-2xl text-[11px] font-black uppercase tracking-wider border border-rose-600/20">
                                                    {m.replace(/[_-]/g, ' ')}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    {secondaryMuscles.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-orange-400" /> Assisting
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {secondaryMuscles.map(m => (
                                                    <span key={m} className="px-5 py-3 bg-orange-400/10 text-orange-400 rounded-2xl text-[11px] font-bold border border-orange-400/20 uppercase tracking-wide">
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
                                        <div className="flex-1 min-w-[160px] bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-2">Volume Range</p>
                                            <p className="text-4xl font-black text-rose-500 tracking-tighter">{exercise.repRange}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Procedure */}
                                {exercise.instructions && exercise.instructions.length > 0 && (
                                    <section className="space-y-8">
                                        <div className="flex items-center gap-2 text-rose-500 font-bold uppercase text-[10px] tracking-widest border-l-2 border-rose-500 pl-4">
                                            <ListChecks className="w-4 h-4" />
                                            Execution Protocol
                                        </div>
                                        <div className="space-y-6">
                                            {instructions.map((step, i) => (
                                                <div key={i} className="flex gap-6 group items-start">
                                                    <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-black text-white border border-white/10 group-hover:bg-rose-600 transition-all shadow-lg">
                                                        {(i + 1).toString().padStart(2, '0')}
                                                    </span>
                                                    <p className="text-base text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors pt-0.5">
                                                        {step}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Insights */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {(exercise.formCues || exercise.description) && (
                                        <div className="bg-rose-950/20 p-8 rounded-[3rem] border border-rose-900/30 relative overflow-hidden group">
                                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/10 blur-[80px] rounded-full group-hover:bg-rose-500/20 transition-all" />
                                            <Info className="w-6 h-6 text-rose-500 mb-6" />
                                            {exercise.description && (
                                                <p className="text-xs font-semibold italic text-muted-foreground mb-4 leading-relaxed">
                                                    "{exercise.description}"
                                                </p>
                                            )}
                                            {exercise.formCues && (
                                                <div className="text-sm font-medium leading-[1.6]">
                                                    {exercise.formCues}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {tips.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-amber-500 font-bold uppercase text-[10px] tracking-widest pl-4">
                                                <Lightbulb className="w-4 h-4" />
                                                Expert Insights
                                            </div>
                                            <div className="grid gap-3">
                                                {tips.map((tip, i) => (
                                                    <div key={i} className="flex gap-3 p-5 bg-amber-500/5 rounded-3xl border border-amber-500/10 text-xs text-amber-200/80 leading-relaxed italic">
                                                        <span className="text-amber-500 font-bold">•</span>
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
                                        className="block relative group overflow-hidden rounded-[3rem] p-1 shadow-2xl transition-all active:scale-[0.98]"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-rose-400 group-hover:opacity-100 opacity-80 transition-opacity" />
                                        <div className="relative bg-background rounded-[2.9rem] p-8 flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-[2rem] bg-rose-600 flex items-center justify-center shadow-2xl shadow-rose-600/40 group-hover:rotate-6 transition-transform">
                                                    <Video className="w-8 h-8 text-white" />
                                                </div>
                                                <div>
                                                    <div className="text-lg font-black tracking-tight">Clinical Tutorial</div>
                                                    <div className="text-xs text-muted-foreground">Watch execution details</div>
                                                </div>
                                            </div>
                                            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/5 transition-all">
                                                <X className="w-6 h-6 rotate-45" />
                                            </div>
                                        </div>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
};

export default ExerciseDetail;
