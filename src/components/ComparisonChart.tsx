import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { WorkoutSession } from '@/lib/db';
import { calculateTotalVolume } from '@/lib/progressUtils';
import { cn } from '@/lib/utils';

interface ComparisonChartProps {
    sessions: WorkoutSession[];
    unit: 'kg' | 'lbs';
}

const ComparisonChart = ({ sessions, unit }: ComparisonChartProps) => {
    const [compareMonths, setCompareMonths] = useState(2); // Default: this month vs last month

    const getMonthData = (monthsAgo: number) => {
        const targetDate = subMonths(new Date(), monthsAgo);
        const monthStart = startOfMonth(targetDate);
        const monthEnd = endOfMonth(targetDate);

        const monthSessions = sessions.filter(s => {
            const sessionDate = parseISO(s.date);
            return sessionDate >= monthStart && sessionDate <= monthEnd && s.status === 'completed';
        });

        const totalVolume = calculateTotalVolume(monthSessions);
        const totalWorkouts = monthSessions.length;
        const totalSets = monthSessions.reduce((sum, session) => {
            return sum + session.exercises.reduce((exSum, ex) => {
                return exSum + ex.sets.filter(s => s.completed).length;
            }, 0);
        }, 0);
        const avgDuration = monthSessions.length > 0
            ? Math.round(monthSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / monthSessions.length)
            : 0;

        return {
            month: format(targetDate, 'MMM yyyy'),
            volume: totalVolume,
            workouts: totalWorkouts,
            sets: totalSets,
            avgDuration,
        };
    };

    const thisMonth = getMonthData(0);
    const lastMonth = getMonthData(1);
    const twoMonthsAgo = getMonthData(2);

    const comparisonData = [
        { name: twoMonthsAgo.month, ...twoMonthsAgo },
        { name: lastMonth.month, ...lastMonth },
        { name: thisMonth.month, ...thisMonth },
    ];

    const volumeChange = lastMonth.volume > 0
        ? ((thisMonth.volume - lastMonth.volume) / lastMonth.volume) * 100
        : 0;

    const workoutChange = lastMonth.workouts > 0
        ? ((thisMonth.workouts - lastMonth.workouts) / lastMonth.workouts) * 100
        : 0;

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="glass-card p-3 text-sm border border-white/10">
                    <p className="font-semibold text-white mb-2">{data.name}</p>
                    <div className="space-y-1 text-xs">
                        <p className="text-primary font-bold">{data.volume.toLocaleString()} {unit} volume</p>
                        <p className="text-muted-foreground">{data.workouts} workouts</p>
                        <p className="text-muted-foreground">{data.sets} sets</p>
                        <p className="text-muted-foreground">{Math.floor(data.avgDuration / 60)}m avg</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (sessions.length === 0) {
        return null;
    }

    return (
        <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-black text-lg">Monthly Comparison</h3>
                <div className="flex gap-2">
                    <div className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
                        volumeChange > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    )}>
                        {volumeChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(volumeChange).toFixed(1)}% volume
                    </div>
                    <div className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
                        workoutChange > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    )}>
                        {workoutChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(workoutChange).toFixed(1)}% workouts
                    </div>
                </div>
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={comparisonData}>
                        <defs>
                            <linearGradient id="volumeGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="hsl(var(--primary))" />
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                            </linearGradient>
                            <linearGradient id="workoutsGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="hsl(142, 71%, 45%)" />
                                <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.6} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.1} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        />
                        <YAxis
                            yAxisId="left"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                            width={50}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                            width={40}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="volume"
                            stroke="url(#volumeGradient)"
                            strokeWidth={3}
                            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'hsl(var(--background))', r: 5 }}
                            activeDot={{ r: 8 }}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="workouts"
                            stroke="url(#workoutsGradient)"
                            strokeWidth={3}
                            dot={{ fill: 'hsl(142, 71%, 45%)', strokeWidth: 2, stroke: 'hsl(var(--background))', r: 5 }}
                            activeDot={{ r: 8 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/5">
                {comparisonData.map((month, idx) => (
                    <div key={idx} className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                            {month.name}
                        </p>
                        <p className="text-lg font-black text-white tabular-nums">
                            {month.workouts}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                            {month.volume >= 1000 ? `${(month.volume / 1000).toFixed(1)}k` : month.volume} {unit}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ComparisonChart;
