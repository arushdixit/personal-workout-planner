import { Download, FileJson, FileText, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { WorkoutSession } from '@/lib/db';
import { getOverviewStats, getExerciseHistory } from '@/lib/progressUtils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface ExportProgressProps {
    sessions: WorkoutSession[];
    unit: 'kg' | 'lbs';
}

const ExportProgress = ({ sessions, unit }: ExportProgressProps) => {
    const { toast } = useToast();

    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const exportAsJSON = () => {
        const stats = getOverviewStats(sessions);
        const exportData = {
            exportDate: new Date().toISOString(),
            unit,
            summary: stats,
            sessions: sessions.map(s => ({
                id: s.id,
                routineName: s.routineName,
                date: s.date,
                duration: s.duration,
                exercises: s.exercises.map(ex => ({
                    name: ex.exerciseName,
                    sets: ex.sets.filter(set => set.completed).map(set => ({
                        reps: set.reps,
                        weight: set.weight,
                        unit: set.unit,
                    })),
                })),
            })),
        };

        const json = JSON.stringify(exportData, null, 2);
        downloadFile(json, `workout-progress-${format(new Date(), 'yyyy-MM-dd')}.json`, 'application/json');

        toast({
            title: 'Exported as JSON',
            description: 'Your progress data has been downloaded.',
        });
    };

    const exportAsCSV = () => {
        const headers = ['Date', 'Routine', 'Duration (min)', 'Exercises', 'Total Sets', `Total Volume (${unit})`];
        const rows = sessions.map(s => {
            const duration = Math.floor((s.duration || 0) / 60);
            const exerciseCount = s.exercises.length;
            const totalSets = s.exercises.reduce((sum, ex) => sum + ex.sets.filter(set => set.completed).length, 0);
            const totalVolume = s.exercises.reduce((sum, ex) => {
                return sum + ex.sets.filter(set => set.completed).reduce((setSum, set) => {
                    return setSum + (set.reps * set.weight);
                }, 0);
            }, 0);

            return [s.date, s.routineName, duration, exerciseCount, totalSets, Math.round(totalVolume)].join(',');
        });

        const csv = [headers.join(','), ...rows].join('\n');
        downloadFile(csv, `workout-progress-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv');

        toast({
            title: 'Exported as CSV',
            description: 'Your progress data has been downloaded.',
        });
    };

    const exportSummaryText = () => {
        const stats = getOverviewStats(sessions);
        const text = `
FITNESS PROGRESS REPORT
Generated: ${format(new Date(), 'MMMM d, yyyy')}

OVERVIEW
────────────────────────────────
Total Workouts: ${stats.totalWorkouts}
Total Volume: ${stats.totalVolume.toLocaleString()} ${unit}
Total Sets: ${stats.totalSets}
Current Streak: ${stats.currentStreak} days
Average Duration: ${Math.floor(stats.averageDuration / 60)} minutes

THIS WEEK
────────────────────────────────
Workouts: ${stats.thisWeekWorkouts}
Last Week: ${stats.lastWeekWorkouts}
Change: ${stats.thisWeekWorkouts > stats.lastWeekWorkouts ? '↑' : '↓'} ${Math.abs(stats.thisWeekWorkouts - stats.lastWeekWorkouts)}

RECENT SESSIONS
────────────────────────────────
${sessions.slice(0, 10).map(s => {
            const volume = s.exercises.reduce((sum, ex) => {
                return sum + ex.sets.filter(set => set.completed).reduce((setSum, set) => {
                    return setSum + (set.reps * set.weight);
                }, 0);
            }, 0);
            return `${s.date} - ${s.routineName} (${Math.round(volume)} ${unit})`;
        }).join('\n')}

────────────────────────────────
Keep crushing it!
`;

        downloadFile(text.trim(), `workout-summary-${format(new Date(), 'yyyy-MM-dd')}.txt`, 'text/plain');

        toast({
            title: 'Exported Summary',
            description: 'Your progress summary has been downloaded.',
        });
    };

    if (sessions.length === 0) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-white/10 hover:bg-white/10"
                >
                    <Download className="w-4 h-4" />
                    Export
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass border-white/10">
                <DropdownMenuItem onClick={exportAsJSON} className="gap-2">
                    <FileJson className="w-4 h-4" />
                    Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportAsCSV} className="gap-2">
                    <FileText className="w-4 h-4" />
                    Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportSummaryText} className="gap-2">
                    <FileText className="w-4 h-4" />
                    Export Summary
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default ExportProgress;
