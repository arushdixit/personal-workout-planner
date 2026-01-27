import { motion } from 'framer-motion';
import { Activity, Flame, TrendingUp, Calendar, Timer, Target } from 'lucide-react';
import { OverviewStats } from '@/lib/progressUtils';
import { cn } from '@/lib/utils';

interface ProgressOverviewProps {
    stats: OverviewStats;
    unit: 'kg' | 'lbs';
}

interface StatCardProps {
    label: string;
    value: string | number;
    subtext?: string;
    icon: React.ReactNode;
    gradient: string;
    delay?: number;
    trend?: 'up' | 'down' | 'neutral';
}

const StatCard = ({ label, value, subtext, icon, gradient, delay = 0, trend }: StatCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: 'spring', stiffness: 100 }}
            className="glass-card p-5 hover:bg-white/[0.08] transition-all group relative overflow-hidden"
        >
            {/* Background gradient glow */}
            <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl -z-10",
                gradient
            )} />

            <div className="flex items-start justify-between mb-3">
                <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center",
                    gradient
                )}>
                    {icon}
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                        trend === 'up' ? "bg-emerald-500/20 text-emerald-400" :
                            trend === 'down' ? "bg-red-500/20 text-red-400" :
                                "bg-muted/20 text-muted-foreground"
                    )}>
                        <TrendingUp className={cn(
                            "w-3 h-3",
                            trend === 'down' && "rotate-180"
                        )} />
                        {trend}
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <p className="text-4xl font-black text-white tabular-nums tracking-tight">
                    {value}
                </p>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                    {label}
                </p>
                {subtext && (
                    <p className="text-xs text-muted-foreground/70 font-medium">
                        {subtext}
                    </p>
                )}
            </div>
        </motion.div>
    );
};

const ProgressOverview = ({ stats, unit }: ProgressOverviewProps) => {
    const weekTrend = stats.thisWeekWorkouts > stats.lastWeekWorkouts ? 'up' :
        stats.thisWeekWorkouts < stats.lastWeekWorkouts ? 'down' : 'neutral';

    const formatVolume = (volume: number): string => {
        if (volume >= 1000) {
            return `${(volume / 1000).toFixed(1)}k`;
        }
        return volume.toLocaleString();
    };

    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours}h ${mins}m`;
        }
        return `${minutes}m`;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tight">Dashboard</h2>
                {stats.currentStreak > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.3 }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full border border-orange-500/30"
                    >
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span className="text-sm font-black text-orange-400">
                            {stats.currentStreak} Day Streak
                        </span>
                    </motion.div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <StatCard
                    label="Total Workouts"
                    value={stats.totalWorkouts}
                    icon={<Activity className="w-6 h-6 text-white" />}
                    gradient="bg-gradient-to-br from-primary/30 to-rose-500/30"
                    delay={0.1}
                />

                <StatCard
                    label="Total Volume"
                    value={formatVolume(stats.totalVolume)}
                    subtext={`${stats.totalVolume.toLocaleString()} ${unit} total`}
                    icon={<Target className="w-6 h-6 text-white" />}
                    gradient="bg-gradient-to-br from-emerald-500/30 to-teal-500/30"
                    delay={0.15}
                />

                <StatCard
                    label="This Week"
                    value={stats.thisWeekWorkouts}
                    subtext={`${stats.lastWeekWorkouts} last week`}
                    icon={<Calendar className="w-6 h-6 text-white" />}
                    gradient="bg-gradient-to-br from-blue-500/30 to-cyan-500/30"
                    delay={0.2}
                    trend={weekTrend}
                />

                <StatCard
                    label="Avg Session"
                    value={formatDuration(stats.averageDuration)}
                    subtext={`${stats.totalSets} total sets`}
                    icon={<Timer className="w-6 h-6 text-white" />}
                    gradient="bg-gradient-to-br from-purple-500/30 to-pink-500/30"
                    delay={0.25}
                />
            </div>
        </div>
    );
};

export default ProgressOverview;
