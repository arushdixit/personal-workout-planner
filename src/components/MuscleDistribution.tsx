import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Activity, AlertCircle } from 'lucide-react';
import { MuscleGroupStats } from '@/lib/progressUtils';
import { cn } from '@/lib/utils';

interface MuscleDistributionProps {
    muscleStats: MuscleGroupStats[];
    topN?: number;
}

// Main muscle groups to focus on
const MAIN_MUSCLES = [
    'chest',
    'lats',
    'deltoids',
    'quadriceps',
    'hamstrings',
    'glutes',
    'biceps',
    'triceps',
    'abs',
];

// Color palette for muscle groups
const MUSCLE_COLORS: Record<string, string> = {
    chest: '#ef4444', // red
    lats: '#3b82f6', // blue
    deltoids: '#f59e0b', // amber
    quadriceps: '#10b981', // emerald
    hamstrings: '#8b5cf6', // purple
    glutes: '#ec4899', // pink
    biceps: '#06b6d4', // cyan
    triceps: '#f97316', // orange
    abs: '#14b8a6', // teal
    traps: '#a855f7', // purple
    calves: '#84cc16', // lime
    forearm: '#64748b', // slate
    default: '#6b7280', // gray
};

const MuscleDistribution = ({ muscleStats, topN = 9 }: MuscleDistributionProps) => {
    const filteredStats = useMemo(() => {
        // Filter to main muscles only
        return muscleStats
            .filter(stat => MAIN_MUSCLES.includes(stat.muscle))
            .slice(0, topN);
    }, [muscleStats, topN]);

    const chartData = useMemo(() => {
        return filteredStats.map(stat => ({
            name: stat.muscle.charAt(0).toUpperCase() + stat.muscle.slice(1),
            value: Math.round(stat.volume),
            sets: stat.sets,
            frequency: Math.round(stat.frequency),
            color: MUSCLE_COLORS[stat.muscle] || MUSCLE_COLORS.default,
        }));
    }, [filteredStats]);

    // Calculate balance (coefficient of variation)
    const calculateBalance = () => {
        if (filteredStats.length < 2) return null;

        const volumes = filteredStats.map(s => s.volume);
        const mean = volumes.reduce((a, b) => a + b, 0) / volumes.length;
        const variance = volumes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / volumes.length;
        const stdDev = Math.sqrt(variance);
        const cv = (stdDev / mean) * 100; // Coefficient of variation as percentage

        // CV < 30% is well balanced, 30-50% is moderate, >50% is imbalanced
        if (cv < 30) return { status: 'balanced', message: 'Well balanced training!' };
        if (cv < 50) return { status: 'moderate', message: 'Fairly balanced' };
        return { status: 'imbalanced', message: 'Consider balancing muscle groups' };
    };

    const balance = calculateBalance();

    if (filteredStats.length === 0) {
        return (
            <div className="glass-card p-8 text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-muted/20 flex items-center justify-center">
                    <Activity className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-bold text-muted-foreground">No Muscle Data</h3>
                    <p className="text-sm text-muted-foreground/70">
                        Complete workouts to see your muscle group distribution
                    </p>
                </div>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="glass-card p-3 text-sm border border-white/10">
                    <p className="font-semibold text-white mb-1">{data.name}</p>
                    <p className="text-primary font-bold">{data.value.toLocaleString()} kg</p>
                    <p className="text-muted-foreground text-xs">{data.sets} sets</p>
                    <p className="text-muted-foreground text-xs">{data.frequency}× trained</p>
                </div>
            );
        }
        return null;
    };

    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        if (percent < 0.05) return null; // Don't show labels for tiny slices

        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                className="text-xs font-bold"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <h3 className="font-black text-lg">Muscle Distribution</h3>
                </div>
                {balance && (
                    <div className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                        balance.status === 'balanced' ? "bg-emerald-500/20 text-emerald-400" :
                            balance.status === 'moderate' ? "bg-amber-500/20 text-amber-400" :
                                "bg-red-500/20 text-red-400"
                    )}>
                        {balance.status === 'imbalanced' && <AlertCircle className="w-3 h-3" />}
                        {balance.message}
                    </div>
                )}
            </div>

            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomLabel}
                            outerRadius={120}
                            innerRadius={60}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    stroke="hsl(var(--background))"
                                    strokeWidth={2}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-2">
                {chartData.map((muscle, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: muscle.color }}
                        />
                        <span className="text-xs font-medium text-muted-foreground truncate">
                            {muscle.name}
                        </span>
                    </div>
                ))}
            </div>

            {/* Top Muscle Stats */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/5">
                {filteredStats.slice(0, 3).map((stat, idx) => (
                    <div key={idx} className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                            #{idx + 1} {stat.muscle}
                        </p>
                        <p className="text-lg font-black text-white tabular-nums">
                            {stat.volume >= 1000
                                ? `${(stat.volume / 1000).toFixed(1)}k`
                                : Math.round(stat.volume).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                            {stat.sets} sets • {Math.round(stat.frequency)}× hits
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MuscleDistribution;
