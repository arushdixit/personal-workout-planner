import { useState, useMemo } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { format, subDays, addDays, parseISO, startOfWeek } from 'date-fns';
import { Calendar as CalendarIcon, Flame, X } from 'lucide-react';
import { CalendarData } from '@/lib/progressUtils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface WorkoutCalendarProps {
    calendarData: CalendarData[];
}

const WorkoutCalendar = ({ calendarData }: WorkoutCalendarProps) => {
    const [selectedDay, setSelectedDay] = useState<any>(null);
    const endDate = new Date();
    const rawStartDate = subDays(endDate, 90);
    const startDate = startOfWeek(rawStartDate, { weekStartsOn: 1 }); // Snap to Monday

    // Convert our data to the format expected by react-calendar-heatmap
    const heatmapValues = calendarData.map(day => ({
        date: day.date,
        count: day.count,
    }));

    const getIntensityClass = (count: number) => {
        if (count === 0) return 'color-empty';
        if (count < 2) return 'color-active opacity-60';
        if (count < 4) return 'color-active opacity-85';
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
                        overflow: visible;
                    }

                    .workout-calendar-container .react-calendar-heatmap text {
                        font-size: 8px;
                        fill: hsl(var(--muted-foreground));
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .workout-calendar-container .react-calendar-heatmap .react-calendar-heatmap-month-label {
                        fill: white;
                        font-family: inherit;
                        font-size: 8px;
                        font-weight: 800;
                        text-transform: uppercase;
                    }

                    .workout-calendar-container .react-calendar-heatmap .react-calendar-heatmap-weekday-label {
                        display: none;
                    }

                    .workout-calendar-container .react-calendar-heatmap .color-empty {
                        fill: rgba(255, 255, 255, 0.04);
                        stroke: rgba(255, 255, 255, 0.1);
                        stroke-width: 0.5px;
                    }

                    .workout-calendar-container .react-calendar-heatmap .color-active {
                        fill: hsl(var(--primary));
                        filter: drop-shadow(0 0 8px hsl(var(--primary) / 0.3));
                        stroke: none;
                    }

                    .workout-calendar-container .react-calendar-heatmap rect {
                        rx: 2px;
                        transition: all 0.2s ease;
                    }

                    .workout-calendar-container .react-calendar-heatmap rect:hover {
                        fill: white !important;
                        filter: drop-shadow(0 0 12px white);
                        cursor: pointer;
                        transform: translateY(-1px);
                    }
                    
                    /* Visual separation between months */
                    .workout-calendar-container .react-calendar-heatmap-month-label {
                        fill: white !important;
                    }

                `}</style>

                <div className="pt-4 relative">
                    <div className="min-w-0">
                        <CalendarHeatmap
                            startDate={startDate}
                            endDate={endDate}
                            values={heatmapValues}
                            gutterSize={2.5}
                            classForValue={(value: any) => {
                                if (!value) return 'color-empty';
                                return getIntensityClass(value.count);
                            }}
                            showWeekdayLabels={false}
                            onClick={(value: any) => {
                                if (value && value.count > 0) {
                                    setSelectedDay(value);
                                }
                            }}
                            transformDayElement={(element, value) => {
                                if (!value || value.count === 0) return element;
                                return element;
                            }}
                        />
                    </div>

                    {/* Popover for selected day details */}
                    {selectedDay && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                            <Popover open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
                                <PopoverTrigger asChild>
                                    <div className="w-0 h-0" />
                                </PopoverTrigger>
                                <PopoverContent className="glass border-white/10 p-4 w-60 animate-in fade-in zoom-in duration-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                            Workout Detail
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 rounded-full hover:bg-white/5"
                                            onClick={() => setSelectedDay(null)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-xl font-black tracking-tight leading-tight">
                                            {format(parseISO(selectedDay.date), 'EEEE')}
                                        </h4>
                                        <p className="text-muted-foreground text-xs font-medium">
                                            {format(parseISO(selectedDay.date), 'MMMM d, yyyy')}
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                            <Flame className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <div className="text-lg font-black leading-none">{selectedDay.count}</div>
                                            <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Workouts Logged</div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}
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
