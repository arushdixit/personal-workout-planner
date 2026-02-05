import { useState, useEffect, useRef } from 'react';
import { BotMessageSquare, Send, User, Bot, X, Loader2, AlertCircle, Info, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription
} from '@/components/ui/drawer';
import {
    CoachMessage,
    CoachContext,
    getCoachResponse,
    aggregateCoachContext
} from '@/lib/AICoachService';
import { useWorkout } from '@/context/WorkoutContext';
import { useUser } from '@/context/UserContext';
import { WorkoutSet } from '@/lib/db';
import { cn } from '@/lib/utils';

interface AICoachPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sessionInfo?: {
        routineName: string;
        totalExercises: number;
        exercisesProgress?: { name: string; completedCount: number; totalSets: number }[];
    };
    currentExercise?: {
        id: number;
        name: string;
        sets: WorkoutSet[];
        personalNotes?: string;
    };
}

const AICoachPanel = ({ open, onOpenChange, sessionInfo, currentExercise }: AICoachPanelProps) => {
    const { currentUser } = useUser();
    const { coachMessages: messages, setCoachMessages: setMessages, clearCoachMessages } = useWorkout();
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [context, setContext] = useState<CoachContext | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Automated Advice State
    const [automatedAdvice, setAutomatedAdvice] = useState<string | null>(null);

    useEffect(() => {
        if (open && currentUser?.id) {
            const loadContext = async () => {
                const ctx = await aggregateCoachContext(currentUser.id, currentExercise?.id, sessionInfo);
                if (ctx && currentExercise) {
                    ctx.currentExercise = {
                        name: currentExercise.name,
                        sets: currentExercise.sets,
                        personalNotes: currentExercise.personalNotes
                    };
                }
                console.debug('AICoachPanel: Full context aggregated:', ctx);
                setContext(ctx);
            };
            loadContext();
        }
    }, [open, currentUser?.id, currentExercise, sessionInfo]);

    // Check for automated advice when feedback changes
    useEffect(() => {
        if (!currentExercise?.sets) return;

        const lastSetWithFeedback = [...currentExercise.sets].reverse().find(s => s.feedback && s.feedback.length > 5);
        if (lastSetWithFeedback?.feedback && !automatedAdvice) {
            triggerAutomatedAdvice(lastSetWithFeedback.feedback);
        }
    }, [currentExercise?.sets]);

    const triggerAutomatedAdvice = async (feedback: string) => {
        if (!context) return;
        setLoading(true);
        const advice = await getCoachResponse([
            { role: 'user', content: `I just finished a set and noted: "${feedback}". Any specific form advice?` }
        ], context);
        setAutomatedAdvice(advice);
        setLoading(false);
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || !context) return;

        console.debug('AICoachPanel: Current messages count before send:', messages.length);

        const newMessages: CoachMessage[] = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        console.debug('AICoachPanel: Sending message:', input);
        try {
            const response = await getCoachResponse(newMessages, context);
            console.debug('AICoachPanel: Received response:', response);
            if (response) {
                setMessages([...newMessages, { role: 'assistant', content: response }]);
            } else {
                console.warn('AICoachPanel: Received empty or null response from service');
            }
        } catch (error) {
            console.error('AICoachPanel: Error getting coach response:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="h-[85vh] bg-background border-none flex flex-col focus:outline-none">
                <DrawerHeader className="border-b border-white/5 pb-6">
                    <div className="relative flex items-center justify-center max-w-lg mx-auto w-full min-h-[56px]">
                        <div className="absolute left-0 top-0">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                                <BotMessageSquare className="w-6 h-6 text-primary" />
                            </div>
                        </div>

                        <div className="text-center">
                            <DrawerTitle className="text-xl font-black tracking-tight uppercase">AI Coach</DrawerTitle>
                            <DrawerDescription className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/50">
                                Pro-Athlete Intelligence
                            </DrawerDescription>
                        </div>

                        <div className="absolute right-0 top-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={clearCoachMessages}
                                className="w-10 h-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all border border-white/5 active:scale-90"
                                title="Clear Chat"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </DrawerHeader>

                <div className="flex-1 overflow-hidden flex flex-col max-w-lg mx-auto w-full">
                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-6 pb-20">
                            {/* Automated Advice Section */}
                            {automatedAdvice && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-primary/10 border border-primary/20 rounded-2xl p-4 space-y-2"
                                >
                                    <div className="flex items-center gap-2 text-primary">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Active Form Alert</span>
                                    </div>
                                    <div className="text-sm text-foreground/90 leading-relaxed font-medium">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {automatedAdvice}
                                        </ReactMarkdown>
                                    </div>
                                    <Button
                                        variant="link"
                                        className="p-0 h-auto text-[10px] text-primary hover:text-primary/80 font-black uppercase tracking-widest"
                                        onClick={() => setAutomatedAdvice(null)}
                                    >
                                        Dismiss
                                    </Button>
                                </motion.div>
                            )}

                            {messages.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={cn(
                                        "flex gap-3",
                                        m.role === 'user' ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                        m.role === 'user' ? "bg-white/10" : "bg-primary/20"
                                    )}>
                                        {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-primary" />}
                                    </div>
                                    <div className={cn(
                                        "max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed",
                                        m.role === 'user'
                                            ? "bg-white/5 rounded-tr-none border border-white/5"
                                            : "bg-white/10 rounded-tl-none border border-white/10"
                                    )}>
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                                ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                                                ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                                                li: ({ children }) => <li className="text-sm">{children}</li>,
                                                strong: ({ children }) => <strong className="font-black text-primary/90">{children}</strong>,
                                                table: ({ children }) => (
                                                    <div className="my-4 overflow-x-auto rounded-lg border border-white/10">
                                                        <table className="w-full text-xs text-left border-collapse bg-black/20">
                                                            {children}
                                                        </table>
                                                    </div>
                                                ),
                                                thead: ({ children }) => <thead className="bg-white/5 border-b border-white/10">{children}</thead>,
                                                th: ({ children }) => <th className="p-2 font-bold text-muted-foreground uppercase tracking-tight">{children}</th>,
                                                td: ({ children }) => <td className="p-2 border-b border-white/5 last:border-0">{children}</td>,
                                                blockquote: ({ children }) => (
                                                    <blockquote className="border-l-2 border-primary/50 pl-3 my-2 italic text-muted-foreground">
                                                        {children}
                                                    </blockquote>
                                                ),
                                            }}
                                        >
                                            {m.content}
                                        </ReactMarkdown>
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none animate-pulse text-xs text-muted-foreground">
                                        Analyzing performance context...
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    {/* Chat Input */}
                    <div className="p-4 bg-background border-t border-white/5">
                        <div className="relative flex items-center gap-2">
                            <Input
                                placeholder="Ask about form, pain, or progress..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                disabled={loading}
                                className="bg-white/5 border-white/10 h-12 rounded-xl pr-12 focus-visible:ring-primary/20"
                            />
                            <Button
                                size="icon"
                                onClick={handleSendMessage}
                                disabled={loading || !input.trim()}
                                className="absolute right-1.5 w-9 h-9 rounded-lg gradient-red border-none"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex justify-between items-center mt-3 px-1">
                            <div className="flex items-center gap-1.5 opacity-50">
                                <Info className="w-3 h-3" />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Powered by OpenRouter</span>
                            </div>
                            <span className="text-[9px] font-bold text-muted-foreground">Context: {currentExercise?.name || 'Full Workout'}</span>
                        </div>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
};

export default AICoachPanel;
