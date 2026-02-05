import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Dumbbell, Calendar, LineChart, TrendingUp, Loader2 } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { db, WorkoutSession, Exercise } from '@/lib/db';
import {
    getOverviewStats,
    getExerciseHistory,
    calculateMuscleGroupVolume,
    groupSessionsByDate,
    filterByTimeRange,
    findPersonalRecords,
    TimeRange,
} from '@/lib/progressUtils';
import ProgressOverview from '@/components/ProgressOverview';
import ExerciseProgressChart from '@/components/ExerciseProgressChart';
import WorkoutCalendar from '@/components/WorkoutCalendar';
import MuscleDistribution from '@/components/MuscleDistribution';
import ComparisonChart from '@/components/ComparisonChart';
import ExportProgress from '@/components/ExportProgress';
import BodyMetricsChart from '@/components/BodyMetricsChart';
import PRBadge from '@/components/PRBadge';
import CoachsCorner from '@/components/CoachsCorner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const Progress = () => {
    const { currentUser } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>('30d');
    const [userProfiles, setUserProfiles] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'exercises' | 'calendar' | 'analysis'>('overview');

    // Load data
    useEffect(() => {
        const loadData = async () => {
            if (!currentUser?.supabaseUserId) return;

            setIsLoading(true);
            try {
                // Load all completed workout sessions
                const allSessions = await db.workout_sessions
                    .where('supabaseUserId')
                    .equals(currentUser.supabaseUserId)
                    .and(s => s.status === 'completed')
                    .toArray();

                setSessions(allSessions);

                // Get unique exercise IDs from sessions
                const exerciseIds = new Set<number>();
                allSessions.forEach(session => {
                    session.exercises.forEach(ex => exerciseIds.add(ex.exerciseId));
                });

                // Load exercise details
                const exerciseList = await db.exercises
                    .where('id')
                    .anyOf([...exerciseIds])
                    .toArray();

                setExercises(exerciseList);

                // Load user profiles for body metrics
                const profiles = await db.users.toArray();
                setUserProfiles(profiles);

                // Auto-select first exercise with data
                if (exerciseList.length > 0 && !selectedExerciseId) {
                    setSelectedExerciseId(exerciseList[0].id!);
                }
            } catch (error) {
                console.error('Error loading progress data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [currentUser]);

    // Calculate stats
    const overviewStats = useMemo(() => {
        return getOverviewStats(sessions);
    }, [sessions]);

    const filteredSessions = useMemo(() => {
        return filterByTimeRange(sessions, timeRange);
    }, [sessions, timeRange]);

    const exerciseHistory = useMemo(() => {
        if (!selectedExerciseId) return [];
        return getExerciseHistory(filteredSessions, selectedExerciseId);
    }, [filteredSessions, selectedExerciseId]);

    const calendarData = useMemo(() => {
        return groupSessionsByDate(sessions);
    }, [sessions]);

    const muscleStats = useMemo(() => {
        const exerciseMap = new Map(exercises.map(ex => [ex.id!, ex]));
        return calculateMuscleGroupVolume(filteredSessions, exerciseMap);
    }, [filteredSessions, exercises]);

    const personalRecords = useMemo(() => {
        if (!selectedExerciseId) return { maxWeight: null, max1RM: null, maxVolume: null };
        return findPersonalRecords(exerciseHistory);
    }, [exerciseHistory, selectedExerciseId]);

    // Get exercises that have been performed
    const exercisesWithData = useMemo(() => {
        const exerciseIds = new Set<number>();
        sessions.forEach(session => {
            session.exercises.forEach(ex => exerciseIds.add(ex.exerciseId));
        });

        return exercises
            .filter(ex => exerciseIds.has(ex.id!))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [sessions, exercises]);

    const selectedExercise = exercises.find(ex => ex.id === selectedExerciseId);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                    <p className="text-muted-foreground">Loading your progress...</p>
                </div>
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-4xl mx-auto ">
                    <div className="flex items-center gap-3 mb-8">
                        <TrendingUp className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-black tracking-tight">Progress</h1>
                    </div>

                    <div className="glass-card p-12 text-center space-y-6">
                        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-rose-500/20 flex items-center justify-center">
                            <TrendingUp className="w-12 h-12 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black">Start Your Journey</h2>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                Complete your first workout to start tracking your progress and see your gains over time!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            <div className="max-w-4xl mx-auto space-y-6">



                {/* Tab Navigation - Added sliding "magic pill" animation */}
                <div className="relative flex gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
                    {[
                        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                        { id: 'exercises', label: 'Exercises', icon: Dumbbell },
                        { id: 'calendar', label: 'Calendar', icon: Calendar },
                        { id: 'analysis', label: 'Analysis', icon: LineChart },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "relative flex-1 flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-300 z-10",
                                activeTab === tab.id ? "text-white" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeProgressTab"
                                    className="absolute inset-0 bg-primary rounded-xl shadow-xl shadow-primary/20"
                                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                />
                            )}
                            <span className="relative z-20 mb-1 leading-none">
                                <tab.icon className={cn(
                                    "w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300",
                                    activeTab === tab.id ? "scale-110" : "scale-100"
                                )} />
                            </span>
                            <span className="relative z-20 truncate w-full text-center">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="space-y-6"
                >
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <>
                            <CoachsCorner />
                            <ProgressOverview stats={overviewStats} unit={currentUser?.unitPreference || 'kg'} />
                            <ComparisonChart sessions={sessions} unit={currentUser?.unitPreference || 'kg'} />
                        </>
                    )}

                    {/* EXERCISES TAB */}
                    {activeTab === 'exercises' && (
                        <div className="space-y-4">
                            {/* Time Range Selector - Stretched to full width */}
                            <div className="w-full">
                                <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl w-full">
                                    {(['7d', '30d', '90d', '365d', 'all'] as TimeRange[]).map((range) => (
                                        <button
                                            key={range}
                                            onClick={() => setTimeRange(range)}
                                            className={cn(
                                                "flex-1 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                                                timeRange === range
                                                    ? "bg-primary text-white shadow-lg"
                                                    : "text-muted-foreground hover:text-white hover:bg-white/10"
                                            )}
                                        >
                                            {range === '7d' && 'Week'}
                                            {range === '30d' && 'Month'}
                                            {range === '90d' && '3M'}
                                            {range === '365d' && 'Year'}
                                            {range === 'all' && 'All'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Exercise Selector */}
                            {exercisesWithData.length > 0 && (
                                <Select
                                    value={selectedExerciseId?.toString()}
                                    onValueChange={(value) => setSelectedExerciseId(Number(value))}
                                >
                                    <SelectTrigger className="glass-card border-white/10 h-12 text-base font-semibold">
                                        <SelectValue placeholder="Select an exercise" />
                                    </SelectTrigger>
                                    <SelectContent className="glass border-white/10 max-h-80">
                                        {exercisesWithData.map((exercise) => (
                                            <SelectItem
                                                key={exercise.id}
                                                value={exercise.id!.toString()}
                                                className="font-medium"
                                            >
                                                {exercise.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {/* Exercise Chart */}
                            {selectedExercise && (
                                <>
                                    {/* PR Badges */}
                                    <PRBadge
                                        records={personalRecords}
                                        exerciseName={selectedExercise.name}
                                        unit={currentUser?.unitPreference || 'kg'}
                                    />

                                    <ExerciseProgressChart
                                        exerciseHistory={exerciseHistory}
                                        exerciseName={selectedExercise.name}
                                        timeRange={timeRange}
                                        unit={currentUser?.unitPreference || 'kg'}
                                    />
                                </>
                            )}
                        </div>
                    )}

                    {/* CALENDAR TAB */}
                    {activeTab === 'calendar' && (
                        <WorkoutCalendar calendarData={calendarData} />
                    )}

                    {/* ANALYSIS TAB */}
                    {activeTab === 'analysis' && (
                        <>
                            {muscleStats.length > 0 && (
                                <MuscleDistribution muscleStats={muscleStats} topN={9} />
                            )}
                            {userProfiles.length > 0 && (
                                <BodyMetricsChart
                                    profiles={userProfiles}
                                    unit={currentUser?.unitPreference || 'kg'}
                                />
                            )}
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Progress;
