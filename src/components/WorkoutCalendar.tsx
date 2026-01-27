import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { format, subDays, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Flame } from 'lucide-react';
import { CalendarData } from '@/lib/progressUtils';
import { cn } from '@/lib/utils';

interface WorkoutCalendarProps {
    calendarData: CalendarData[];
    weeksToShow?: number;
}

const WorkoutCalendar = ({ calendarData, weeksToShow = 12 }: WorkoutCalendarProps) => {
    const endDate = new Date();
    const startDate = subDays(endDate, weeksToShow * 7);

    // Convert our data to the format expected by react-calendar-heatmap
    const heatmapValues = calendarData.map(day => ({
        date: day.date,
        count: day.count,
        volume: day.volume,
        routines: day.routines,
    }));

    // Calculate intensity based on volume
    const maxVolume = Math.max(...calendarData.map(d => d.volume), 1);

    const getIntensityClass = (volume: number) => {
        if (volume === 0) return 'color-empty';
        const normalized = volume / maxVolume;
        if (normalized < 0.25) return 'color-scale-1';
        if (normalized < 0.5) return 'color-scale-2';
        if (normalized < 0.75) return 'color-scale-3';
        return 'color-scale-4';
    };

    const CustomTooltip = ({ value }: any) => {
        if (!value || !value.date) return null;

        return (
            <div className="absolute z-50 glass-card p-3 text-sm border border-white/10 pointer-events-none whitespace-nowrap">
                <p className="font-semibold text-white mb-1">
                    {format(parseISO(value.date), 'MMM d, yyyy')}
                </p>
                {value.count > 0 ? (
                    <>
                        <p className="text-primary font-bold">
                            {value.count} workout{value.count > 1 ? 's' : ''}
                        </p>
                        <p className="text-muted-foreground text-xs">
                            {value.volume.toLocaleString()} kg total
                        </p>
                        {value.routines && value.routines.length > 0 && (
                            <p className="text-muted-foreground text-xs mt-1">
                                {value.routines.join(', ')}
                            </p>
                        )}
                    </>
                ) : (
                    <p className="text-muted-foreground">Rest day</p>
                )}
            </div>
        );
    };

    const getLegend = () => {
        return (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">Less</span>
                <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-sm bg-white/5 border border-white/10" />
                    <div className="w-3 h-3 rounded-sm bg-primary/20" />
                    <div className="w-3 h-3 rounded-sm bg-primary/40" />
                    <div className="w-3 h-3 rounded-sm bg-primary/60" />
                    <div className="w-3 h-3 rounded-sm bg-primary/80" />
                </div>
                <span className="font-medium">More</span>
            </div>
        );
    };

    return (
        <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    <h3 className="font-black text-lg">Workout Consistency</h3>
                </div>
                {getLegend()}
            </div>

            <div className="workout-calendar-container">
                <style>{`
          .workout-calendar-container .react-calendar-heatmap {
            width: 100%;
          }

          .workout-calendar-container .react-calendar-heatmap text {
            font-size: 10px;
            fill: hsl(var(--muted-foreground));
            font-weight: 600;
          }

          .workout-calendar-container .react-calendar-heatmap .color-empty {
            fill: hsl(var(--muted) / 0.1);
            stroke: hsl(var(--border));
            stroke-width: 1;
            rx: 2;
          }

          .workout-calendar-container .react-calendar-heatmap .color-scale-1 {
            fill: hsl(var(--primary) / 0.2);
            stroke: hsl(var(--primary) / 0.3);
            stroke-width: 1;
            rx: 2;
          }

          .workout-calendar-container .react-calendar-heatmap .color-scale-2 {
            fill: hsl(var(--primary) / 0.4);
            stroke: hsl(var(--primary) / 0.5);
            stroke-width: 1;
            rx: 2;
          }

          .workout-calendar-container .react-calendar-heatmap .color-scale-3 {
            fill: hsl(var(--primary) / 0.6);
            stroke: hsl(var(--primary) / 0.7);
            stroke-width: 1;
            rx: 2;
          }

          .workout-calendar-container .react-calendar-heatmap .color-scale-4 {
            fill: hsl(var(--primary) / 0.9);
            stroke: hsl(var(--primary));
            stroke-width: 1;
            rx: 2;
            filter: drop-shadow(0 0 4px hsl(var(--primary) / 0.5));
          }

          .workout-calendar-container .react-calendar-heatmap rect:hover {
            stroke: hsl(var(--primary));
            stroke-width: 2;
            filter: drop-shadow(0 0 6px hsl(var(--primary) / 0.8));
          }
        `}</style>

                <CalendarHeatmap
                    startDate={startDate}
                    endDate={endDate}
                    values={heatmapValues}
                    classForValue={(value: any) => {
                        if (!value) return 'color-empty';
                        return getIntensityClass(value.volume);
                    }}
                    tooltipDataAttrs={(value: any) => {
                        return {
                            'data-tip': value ? JSON.stringify(value) : '',
                        };
                    }}
                    showWeekdayLabels
                />
            </div>

            {calendarData.length === 0 && (
                <div className="text-center py-8 space-y-2">
                    <Flame className="w-12 h-12 mx-auto text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                        Start working out to build your consistency heatmap!
                    </p>
                </div>
            )}
        </div>
    );
};

export default WorkoutCalendar;
