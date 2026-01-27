import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';
import { Star, TrendingUp, Trophy, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExerciseProgressData, TimeRange, formatChartDate, findPersonalRecords } from '@/lib/progressUtils';
import { cn } from '@/lib/utils';

interface ExerciseProgressChartProps {
    exerciseHistory: ExerciseProgressData[];
    exerciseName: string;
    timeRange: TimeRange;
    unit: 'kg' | 'lbs';
}

type ChartType = 'weight' | 'volume' | '1rm';

const ExerciseProgressChart = ({ exerciseHistory, exerciseName, timeRange, unit }: ExerciseProgressChartProps) => {
    const [activeChart, setActiveChart] = useState<ChartType>('weight');

    const chartData = useMemo(() => {
        return exerciseHistory.map(entry => ({
            date: formatChartDate(entry.date, timeRange),
            fullDate: entry.date,
            weight: entry.maxWeight,
            volume: entry.totalVolume,
            '1rm': Math.round(entry.estimated1RM * 10) / 10,
        }));
    }, [exerciseHistory, timeRange]);

    const personalRecords = useMemo(() => {
        return findPersonalRecords(exerciseHistory);
    }, [exerciseHistory]);

    if (exerciseHistory.length === 0) {
        return (
            <div className="glass-card p-8 text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-muted/20 flex items-center justify-center">
                    <Target className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-bold text-muted-foreground">No Data Yet</h3>
                    <p className="text-sm text-muted-foreground/70">
                        Complete a workout with this exercise to see your progress
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
                    <p className="font-semibold text-white mb-1">{data.fullDate}</p>
                    {activeChart === 'weight' && (
                        <p className="text-primary font-bold">
                            {data.weight} {unit}
                        </p>
                    )}
                    {activeChart === 'volume' && (
                        <p className="text-emerald-400 font-bold">
                            {data.volume.toLocaleString()} {unit} volume
                        </p>
                    )}
                    {activeChart === '1rm' && (
                        <p className="text-amber-400 font-bold">
                            {data['1rm']} {unit} est. 1RM
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    const getChartColor = (type: ChartType) => {
        switch (type) {
            case 'weight': return 'hsl(var(--primary))';
            case 'volume': return 'hsl(142, 71%, 45%)'; // emerald
            case '1rm': return 'hsl(38, 92%, 50%)'; // amber
        }
    };

    const getGradientId = (type: ChartType) => {
        switch (type) {
            case 'weight': return 'weightGradient';
            case 'volume': return 'volumeGradient';
            case '1rm': return '1rmGradient';
        }
    };

    const renderChart = () => {
        const isPRData = (date: string) => {
            if (activeChart === 'weight') return personalRecords.maxWeight?.date === date;
            if (activeChart === '1rm') return personalRecords.max1RM?.date === date;
            if (activeChart === 'volume') return personalRecords.maxVolume?.date === date;
            return false;
        };

        const dataKey = activeChart === '1rm' ? '1rm' : activeChart;
        const color = getChartColor(activeChart);
        const gradientId = getGradientId(activeChart);

        if (activeChart === 'volume') {
            return (
                <BarChart data={chartData}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.2} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.1} />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        width={45}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                        dataKey={dataKey}
                        fill={`url(#${gradientId})`}
                        radius={[8, 8, 0, 0]}
                    />
                </BarChart>
            );
        }

        return (
            <LineChart data={chartData}>
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={color} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.1} />
                <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    width={45}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                    type="monotone"
                    dataKey={dataKey}
                    stroke={`url(#${gradientId})`}
                    strokeWidth={3}
                    dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        const isPR = isPRData(payload.fullDate);
                        return (
                            <g>
                                {isPR && (
                                    <>
                                        <circle
                                            cx={cx}
                                            cy={cy}
                                            r={12}
                                            fill={color}
                                            opacity={0.2}
                                            className="animate-ping"
                                        />
                                        <Star
                                            x={cx - 8}
                                            y={cy - 8}
                                            className="w-4 h-4 fill-amber-400 text-amber-400"
                                        />
                                    </>
                                )}
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={isPR ? 7 : 5}
                                    fill={color}
                                    stroke="hsl(var(--background))"
                                    strokeWidth={2}
                                />
                            </g>
                        );
                    }}
                    activeDot={{
                        fill: color,
                        strokeWidth: 3,
                        stroke: 'hsl(var(--background))',
                        r: 8,
                        filter: 'url(#glow)',
                    }}
                />
            </LineChart>
        );
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="space-y-2">
                <h3 className="text-xl font-black">{exerciseName}</h3>

                {/* Chart Type Selector */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveChart('weight')}
                        className={cn(
                            "flex-1 py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all",
                            activeChart === 'weight'
                                ? "bg-primary/20 text-primary border border-primary/30"
                                : "bg-white/5 text-muted-foreground hover:bg-white/10"
                        )}
                    >
                        Max Weight
                    </button>
                    <button
                        onClick={() => setActiveChart('1rm')}
                        className={cn(
                            "flex-1 py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all",
                            activeChart === '1rm'
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-white/5 text-muted-foreground hover:bg-white/10"
                        )}
                    >
                        Est. 1RM
                    </button>
                    <button
                        onClick={() => setActiveChart('volume')}
                        className={cn(
                            "flex-1 py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all",
                            activeChart === 'volume'
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-white/5 text-muted-foreground hover:bg-white/10"
                        )}
                    >
                        Volume
                    </button>
                </div>
            </div>

            {/* Chart */}
            <div className="glass-card p-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeChart}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="h-64"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            {renderChart()}
                        </ResponsiveContainer>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Personal Records */}
            {(personalRecords.maxWeight || personalRecords.max1RM || personalRecords.maxVolume) && (
                <div className="glass-card p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        <h4 className="font-black text-sm uppercase tracking-wider">Personal Records</h4>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {personalRecords.maxWeight && (
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Max Weight</p>
                                <p className="text-2xl font-black text-white tabular-nums">
                                    {personalRecords.maxWeight.value}
                                    <span className="text-sm text-muted-foreground ml-1">{unit}</span>
                                </p>
                                <p className="text-[10px] text-muted-foreground/70">{personalRecords.maxWeight.date}</p>
                            </div>
                        )}
                        {personalRecords.max1RM && (
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Est. 1RM</p>
                                <p className="text-2xl font-black text-amber-400 tabular-nums">
                                    {personalRecords.max1RM.value}
                                    <span className="text-sm text-muted-foreground ml-1">{unit}</span>
                                </p>
                                <p className="text-[10px] text-muted-foreground/70">{personalRecords.max1RM.date}</p>
                            </div>
                        )}
                        {personalRecords.maxVolume && (
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Max Volume</p>
                                <p className="text-2xl font-black text-emerald-400 tabular-nums">
                                    {personalRecords.maxVolume.value >= 1000
                                        ? `${(personalRecords.maxVolume.value / 1000).toFixed(1)}k`
                                        : personalRecords.maxVolume.value
                                    }
                                    <span className="text-sm text-muted-foreground ml-1">{unit}</span>
                                </p>
                                <p className="text-[10px] text-muted-foreground/70">{personalRecords.maxVolume.date}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExerciseProgressChart;
