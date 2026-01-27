import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Area, AreaChart } from 'recharts';
import { Scale, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { UserProfile } from '@/lib/db';
import { cn } from '@/lib/utils';

interface BodyMetricsChartProps {
    profiles: UserProfile[];
    unit: 'kg' | 'lbs';
}

// This would be enhanced to track historical body metrics
// For now, we'll show a placeholder that can be extended
const BodyMetricsChart = ({ profiles, unit }: BodyMetricsChartProps) => {
    // In a full implementation, you'd have a body_metrics table tracking:
    // - weight over time
    // - body fat % over time
    // - measurements (chest, waist, arms, etc.)

    // For now, we'll show current weight and a message about future tracking
    const currentProfile = profiles[0];

    if (!currentProfile) {
        return null;
    }

    return (
        <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-primary" />
                    <h3 className="font-black text-lg">Body Metrics</h3>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4 bg-white/[0.04] border-white/10 space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Scale className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-3xl font-black text-white tabular-nums">
                            {currentProfile.weight}
                            <span className="text-sm text-muted-foreground ml-1">{unit}</span>
                        </p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                            Current Weight
                        </p>
                    </div>
                </div>

                {currentProfile.bodyFat !== undefined && currentProfile.bodyFat > 0 && (
                    <div className="glass-card p-4 bg-white/[0.04] border-white/10 space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-white tabular-nums">
                                {currentProfile.bodyFat}
                                <span className="text-sm text-muted-foreground ml-1">%</span>
                            </p>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                                Body Fat
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Coming Soon Message */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">
                    📊 Historical Tracking Coming Soon
                </p>
                <p className="text-xs text-muted-foreground/70">
                    Track weight, body fat %, and measurements over time
                </p>
            </div>

            {/* Placeholder for future implementation */}
            <div className="h-48 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-center">
                <div className="text-center space-y-2 opacity-50">
                    <Scale className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Weight trend chart</p>
                    <p className="text-xs text-muted-foreground/70">Will show your progress over time</p>
                </div>
            </div>
        </div>
    );
};

export default BodyMetricsChart;
