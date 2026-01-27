import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from 'recharts';
import { Dumbbell, Info } from 'lucide-react';
import { format, addMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { WorkoutSession } from '@/lib/db';
import { calculateTotalVolume } from '@/lib/progressUtils';

interface ComparisonChartProps {
    sessions: WorkoutSession[];
    unit: 'kg' | 'lbs';
}

const ComparisonChart = ({ sessions, unit }: ComparisonChartProps) => {
    // Generate data for 6 months starting from the current month
    const comparisonData = Array.from({ length: 6 }).map((_, i) => {
        const targetDate = addMonths(new Date(), i);
        const monthStart = startOfMonth(targetDate);
        const monthEnd = endOfMonth(targetDate);

        // Filter sessions by month
        const monthSessions = sessions.filter(s => {
            const sessionDate = parseISO(s.date);
            return sessionDate >= monthStart && sessionDate <= monthEnd && s.status === 'completed';
        });

        const volume = calculateTotalVolume(monthSessions);

        return {
            name: format(targetDate, 'MMM'),
            full: format(targetDate, 'MMMM yyyy'),
            volume,
            workouts: monthSessions.length,
            isCurrent: i === 0,
            isFuture: i > 0
        };
    });

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="glass-card p-3 text-sm border border-white/10 shadow-2xl">
                    <p className="font-black text-white mb-1">{data.full}</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <p className="text-primary font-bold">{data.volume.toLocaleString()} {unit}</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (sessions.length === 0) return null;

    return (
        <div className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-black text-lg">Monthly Progress</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Volume tracking</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-white/5 px-2 py-1 rounded-full">
                    <Info className="w-3 h-3" />
                    <span>Showing next 6 months</span>
                </div>
            </div>

            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.05} vertical={false} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 'bold' }}
                        />
                        <YAxis hide />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                        <Bar
                            dataKey="volume"
                            radius={[6, 6, 0, 0]}
                            barSize={32}
                        >
                            {comparisonData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.isCurrent ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.15)'}
                                    stroke={entry.isCurrent ? 'none' : 'hsl(var(--primary) / 0.2)'}
                                    strokeDasharray={entry.isFuture ? "4 4" : "0"}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {comparisonData.slice(0, 3).map((month, idx) => (
                    <div key={idx} className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-black">
                            {month.name}
                        </p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-white tabular-nums">
                                {month.volume >= 1000 ? `${(month.volume / 1000).toFixed(1)}k` : month.volume}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-bold uppercase">{unit}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ComparisonChart;
