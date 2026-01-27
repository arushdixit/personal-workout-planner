import { useMemo } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { format, subDays, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Flame } from 'lucide-react';
import { CalendarData } from '@/lib/progressUtils';

interface WorkoutCalendarProps {
    calendarData: CalendarData[];
}

const WorkoutCalendar = ({ calendarData }: WorkoutCalendarProps) => {
    const endDate = new Date();
    const startDate = subDays(endDate, 90); // Show last 3 months by default

    // Convert our data to the format expected by react-calendar-heatmap
    const heatmapValues = calendarData.map(day => ({
        date: day.date,
        count: day.count,
    }));

    const getIntensityClass = (count: number) => {
        if (count === 0) return 'color-empty';
        return 'color-active';
    };

    return (
        <div className="glass-card p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-black text-xl tracking-tight leading-tight uppercase">Consistency</h3>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Daily Workout Log</p>
                    </div>
                </div>
            </div>

            <div className="workout-calendar-container relative">
                <style>{`
                    .workout-calendar-container .react-calendar-heatmap {
                        width: 100%;
                        height: auto;
                    }

                    .workout-calendar-container .react-calendar-heatmap text {
                        font-size: 8px;
                        fill: hsl(var(--muted-foreground));
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    /* Position month labels clearly above the heatmap */
                    .workout-calendar-container .react-calendar-heatmap .react-calendar-heatmap-month-label {
                        dominant-baseline: text-before-edge;
                        transform: translateY(-12px);
                    }

                    .workout-calendar-container .react-calendar-heatmap .color-empty {
                        fill: hsl(var(--muted) / 0.1);
                        stroke: none;
                    }

                    .workout-calendar-container .react-calendar-heatmap .color-active {
                        fill: hsl(var(--primary));
                        filter: drop-shadow(0 0 8px hsl(var(--primary) / 0.4));
                        stroke: none;
                    }

                    .workout-calendar-container .react-calendar-heatmap rect {
                        rx: 3px;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    }

                    .workout-calendar-container .react-calendar-heatmap rect:hover {
                        fill: white !important;
                        filter: drop-shadow(0 0 12px white);
                        cursor: crosshair;
                        transform: scale(1.1);
                        transform-origin: center;
                    }
                    
                    /* Visual separation between months */
                    .workout-calendar-container .react-calendar-heatmap-month-label {
                        fill: white !important;
                        font-family: inherit;
                    }
                `}</style>

                <div className="pt-4">
                    <CalendarHeatmap
                        startDate={startDate}
                        endDate={endDate}
                        values={heatmapValues}
                        gutterSize={3}
                        classForValue={(value: any) => {
                            if (!value) return 'color-empty';
                            return getIntensityClass(value.count);
                        }}
                        titleForValue={(value: any) => {
                            if (!value || !value.date) return 'Rest day';
                            return `${format(parseISO(value.date), 'MMM d, yyyy')}: ${value.count} workout${value.count > 1 ? 's' : ''}`;
                        }}
                        showWeekdayLabels={false}
                    />
                </div>
            </div>


            {calendarData.length === 0 && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-md rounded-3xl flex items-center justify-center z-10 border border-white/5">
                    <div className="text-center p-8 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                            <Flame className="w-8 h-8 text-primary shadow-lg shadow-primary/20" />
                        </div>
                        <div>
                            <h4 className="font-black text-xl text-white uppercase tracking-tight">Zero Activity</h4>
                            <p className="text-sm text-muted-foreground max-w-[240px] mx-auto font-medium">
                                Complete a session to start charting your progress.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkoutCalendar;
