import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { aggregateCoachContext, getPerformanceInsights } from '@/lib/AICoachService';
import { useUser } from '@/context/UserContext';
import { cn } from '@/lib/utils';

const CoachsCorner = () => {
    const { currentUser } = useUser();
    const [insights, setInsights] = useState<{ winning: string; warning: string; insight: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasAttempted, setHasAttempted] = useState(false);

    const loadInsights = async () => {
        if (!currentUser?.id) return;
        setLoading(true);
        try {
            const context = await aggregateCoachContext(currentUser.id);
            if (context) {
                const results = await getPerformanceInsights(context);
                setInsights(results);
            }
        } finally {
            setLoading(false);
            setHasAttempted(true);
        }
    };

    useEffect(() => {
        // We don't auto-load to save tokens, user clicks to reveal
    }, []);

    if (!insights && hasAttempted && !loading) {
        return (
            <div className="glass-card p-6 text-center space-y-4 border-white/5">
                <p className="text-sm text-muted-foreground">My sensors are a bit foggy. Can't see your trends clearly yet.</p>
                <Button variant="outline" size="sm" onClick={loadInsights} className="rounded-xl border-white/10">Try Again</Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h3 className="font-black text-lg uppercase tracking-tight">Coach's Corner</h3>
                </div>
                {!insights && !loading && (
                    <Button
                        variant="gradient"
                        size="sm"
                        onClick={loadInsights}
                        className="h-8 px-4 rounded-full text-[10px] font-black uppercase tracking-widest"
                    >
                        Reveal Insights
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="glass-card p-12 flex flex-col items-center justify-center space-y-4 items-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Running Bio-Metric Analysis...</p>
                </div>
            ) : insights ? (
                <div className="grid gap-3">
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-card p-4 border-l-4 border-l-emerald-500 bg-emerald-500/5 flex gap-4 items-start"
                    >
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">The Win</p>
                            <p className="text-sm font-medium leading-relaxed italic">"{insights.winning}"</p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-4 border-l-4 border-l-amber-500 bg-amber-500/5 flex gap-4 items-start"
                    >
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">The Warning</p>
                            <p className="text-sm font-medium leading-relaxed italic">"{insights.warning}"</p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-4 border-l-4 border-l-primary bg-primary/5 flex gap-4 items-start"
                    >
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                            <Lightbulb className="w-5 h-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">The Insight</p>
                            <p className="text-sm font-medium leading-relaxed italic">"{insights.insight}"</p>
                        </div>
                    </motion.div>
                </div>
            ) : (
                <div className="glass-card p-8 border-dashed border-white/10 flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                    <p className="text-xs text-muted-foreground max-w-[200px]">Unlock narrative insights based on your last 30 days of training.</p>
                </div>
            )}
        </div>
    );
};

export default CoachsCorner;
