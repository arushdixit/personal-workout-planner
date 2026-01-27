import { WorkoutSession, WorkoutSessionExercise, WorkoutSet, Exercise } from './db';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, parseISO, differenceInDays, isToday, isYesterday } from 'date-fns';

export interface ExerciseProgressData {
    date: string;
    maxWeight: number;
    totalVolume: number;
    estimated1RM: number;
    sets: WorkoutSet[];
    sessionId?: number;
}

export interface MuscleGroupStats {
    muscle: string;
    volume: number;
    sets: number;
    frequency: number; // Number of times trained
}

export interface WorkoutStreak {
    currentStreak: number;
    longestStreak: number;
    lastWorkoutDate: string | null;
}

export interface OverviewStats {
    totalWorkouts: number;
    totalVolume: number;
    totalSets: number;
    averageDuration: number;
    thisWeekWorkouts: number;
    lastWeekWorkouts: number;
    currentStreak: number;
}

export type TimeRange = '7d' | '30d' | '90d' | '180d' | '365d' | 'all';

/**
 * Calculate estimated 1RM using Epley formula
 * Formula: weight * (1 + reps/30)
 */
export function calculate1RM(weight: number, reps: number): number {
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * Calculate total volume for a set of workout sets
 * Volume = sum(reps * weight)
 */
export function calculateVolume(sets: WorkoutSet[]): number {
    return sets.reduce((sum, set) => {
        if (set.completed) {
            return sum + (set.reps * set.weight);
        }
        return sum;
    }, 0);
}

/**
 * Calculate current workout streak
 * Returns number of consecutive days with workouts
 */
export function calculateStreak(sessions: WorkoutSession[]): WorkoutStreak {
    if (sessions.length === 0) {
        return { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null };
    }

    // Sort by date descending
    const sortedSessions = [...sessions]
        .filter(s => s.status === 'completed')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (sortedSessions.length === 0) {
        return { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null };
    }

    const lastWorkoutDate = sortedSessions[0].date;
    const lastWorkoutDay = parseISO(lastWorkoutDate);

    // If last workout wasn't today or yesterday, streak is broken
    if (!isToday(lastWorkoutDay) && !isYesterday(lastWorkoutDay)) {
        // Still calculate longest streak
        const longestStreak = calculateLongestStreak(sortedSessions);
        return { currentStreak: 0, longestStreak, lastWorkoutDate };
    }

    // Calculate current streak
    let currentStreak = 1;
    const uniqueDates = [...new Set(sortedSessions.map(s => s.date))];

    for (let i = 0; i < uniqueDates.length - 1; i++) {
        const current = parseISO(uniqueDates[i]);
        const next = parseISO(uniqueDates[i + 1]);
        const dayDiff = differenceInDays(current, next);

        if (dayDiff === 1) {
            currentStreak++;
        } else {
            break;
        }
    }

    const longestStreak = Math.max(currentStreak, calculateLongestStreak(sortedSessions));

    return { currentStreak, longestStreak, lastWorkoutDate };
}

function calculateLongestStreak(sortedSessions: WorkoutSession[]): number {
    const uniqueDates = [...new Set(sortedSessions.map(s => s.date))].sort((a, b) =>
        new Date(b).getTime() - new Date(a).getTime()
    );

    let longest = 1;
    let current = 1;

    for (let i = 0; i < uniqueDates.length - 1; i++) {
        const currDate = parseISO(uniqueDates[i]);
        const nextDate = parseISO(uniqueDates[i + 1]);
        const dayDiff = differenceInDays(currDate, nextDate);

        if (dayDiff === 1) {
            current++;
            longest = Math.max(longest, current);
        } else {
            current = 1;
        }
    }

    return longest;
}

/**
 * Get exercise history for a specific exercise
 */
export function getExerciseHistory(
    sessions: WorkoutSession[],
    exerciseId: number
): ExerciseProgressData[] {
    const history: ExerciseProgressData[] = [];

    sessions
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach(session => {
            session.exercises.forEach(ex => {
                if (ex.exerciseId === exerciseId) {
                    const completedSets = ex.sets.filter(s => s.completed);
                    if (completedSets.length === 0) return;

                    const maxWeight = Math.max(...completedSets.map(s => s.weight));
                    const totalVolume = calculateVolume(completedSets);

                    // Calculate best 1RM from this session
                    const estimated1RM = Math.max(
                        ...completedSets.map(s => calculate1RM(s.weight, s.reps))
                    );

                    history.push({
                        date: session.date,
                        maxWeight,
                        totalVolume,
                        estimated1RM,
                        sets: completedSets,
                        sessionId: session.id,
                    });
                }
            });
        });

    return history;
}

/**
 * Calculate muscle group volume distribution
 */
export function calculateMuscleGroupVolume(
    sessions: WorkoutSession[],
    exercisesMap: Map<number, Exercise>
): MuscleGroupStats[] {
    const muscleStats = new Map<string, MuscleGroupStats>();

    sessions.forEach(session => {
        session.exercises.forEach(ex => {
            const exercise = exercisesMap.get(ex.exerciseId);
            if (!exercise) return;

            const volume = calculateVolume(ex.sets.filter(s => s.completed));
            const completedSets = ex.sets.filter(s => s.completed).length;

            // Primary muscles get full volume
            exercise.primaryMuscles.forEach(muscle => {
                const existing = muscleStats.get(muscle) || { muscle, volume: 0, sets: 0, frequency: 0 };
                muscleStats.set(muscle, {
                    muscle,
                    volume: existing.volume + volume,
                    sets: existing.sets + completedSets,
                    frequency: existing.frequency + 1,
                });
            });

            // Secondary muscles get half volume (to avoid double-counting)
            exercise.secondaryMuscles.forEach(muscle => {
                const existing = muscleStats.get(muscle) || { muscle, volume: 0, sets: 0, frequency: 0 };
                muscleStats.set(muscle, {
                    muscle,
                    volume: existing.volume + (volume * 0.5),
                    sets: existing.sets + completedSets,
                    frequency: existing.frequency + 0.5,
                });
            });
        });
    });

    return Array.from(muscleStats.values())
        .sort((a, b) => b.volume - a.volume);
}

/**
 * Calculate total volume across all sessions
 */
export function calculateTotalVolume(sessions: WorkoutSession[]): number {
    return sessions
        .reduce((total, session) => {
            const sessionVolume = session.exercises.reduce((exTotal, ex) => {
                return exTotal + calculateVolume(ex.sets);
            }, 0);
            return total + sessionVolume;
        }, 0);
}

/**
 * Get overview statistics
 */
export function getOverviewStats(sessions: WorkoutSession[]): OverviewStats {
    const completedSessions = sessions;

    // Calculate week boundaries
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekEnd);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

    const thisWeekWorkouts = completedSessions.filter(s => {
        const sessionDate = parseISO(s.date);
        return sessionDate >= thisWeekStart && sessionDate <= thisWeekEnd;
    }).length;

    const lastWeekWorkouts = completedSessions.filter(s => {
        const sessionDate = parseISO(s.date);
        return sessionDate >= lastWeekStart && sessionDate <= lastWeekEnd;
    }).length;

    const totalSets = completedSessions.reduce((sum, session) => {
        return sum + session.exercises.reduce((exSum, ex) => {
            return exSum + ex.sets.filter(s => s.completed).length;
        }, 0);
    }, 0);

    const totalDuration = completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const averageDuration = completedSessions.length > 0
        ? Math.round(totalDuration / completedSessions.length)
        : 0;

    const streak = calculateStreak(completedSessions);

    return {
        totalWorkouts: completedSessions.length,
        totalVolume: calculateTotalVolume(completedSessions),
        totalSets,
        averageDuration,
        thisWeekWorkouts,
        lastWeekWorkouts,
        currentStreak: streak.currentStreak,
    };
}

/**
 * Find personal records for an exercise
 */
export interface PersonalRecord {
    type: 'weight' | '1rm' | 'volume';
    value: number;
    date: string;
    sets?: WorkoutSet[];
}

export function findPersonalRecords(history: ExerciseProgressData[]): {
    maxWeight: PersonalRecord | null;
    max1RM: PersonalRecord | null;
    maxVolume: PersonalRecord | null;
} {
    if (history.length === 0) {
        return { maxWeight: null, max1RM: null, maxVolume: null };
    }

    let maxWeight = history[0];
    let max1RM = history[0];
    let maxVolume = history[0];

    history.forEach(entry => {
        if (entry.maxWeight > maxWeight.maxWeight) maxWeight = entry;
        if (entry.estimated1RM > max1RM.estimated1RM) max1RM = entry;
        if (entry.totalVolume > maxVolume.totalVolume) maxVolume = entry;
    });

    return {
        maxWeight: { type: 'weight', value: maxWeight.maxWeight, date: maxWeight.date, sets: maxWeight.sets },
        max1RM: { type: '1rm', value: max1RM.estimated1RM, date: max1RM.date },
        maxVolume: { type: 'volume', value: maxVolume.totalVolume, date: maxVolume.date },
    };
}

/**
 * Group sessions by date for calendar heatmap
 */
export interface CalendarData {
    date: string;
    count: number;
    volume: number;
    routines: string[];
}

export function groupSessionsByDate(sessions: WorkoutSession[]): CalendarData[] {
    const grouped = new Map<string, CalendarData>();

    sessions
        .filter(s => s.status === 'completed')
        .forEach(session => {
            const existing = grouped.get(session.date);
            const volume = session.exercises.reduce((sum, ex) =>
                sum + calculateVolume(ex.sets), 0
            );

            if (existing) {
                existing.count++;
                existing.volume += volume;
                if (!existing.routines.includes(session.routineName)) {
                    existing.routines.push(session.routineName);
                }
            } else {
                grouped.set(session.date, {
                    date: session.date,
                    count: 1,
                    volume,
                    routines: [session.routineName],
                });
            }
        });

    return Array.from(grouped.values()).sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );
}

/**
 * Filter sessions by time range
 */
export function filterByTimeRange(sessions: WorkoutSession[], range: TimeRange): WorkoutSession[] {
    if (range === 'all') return sessions;

    const now = new Date();
    const daysMap: Record<Exclude<TimeRange, 'all'>, number> = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '180d': 180,
        '365d': 365,
    };

    const days = daysMap[range];
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return sessions.filter(s => new Date(s.date) >= cutoffDate);
}

/**
 * Format date for charts
 */
export function formatChartDate(dateStr: string, range: TimeRange): string {
    const date = parseISO(dateStr);

    if (range === '7d') {
        return format(date, 'MMM d'); // Jan 1 instead of Mon
    } else if (range === '30d') {
        return format(date, 'MMM d'); // Jan 1
    } else if (range === '90d' || range === '180d') {
        return format(date, 'MMM d'); // Jan 1
    } else {
        return format(date, 'MMM yyyy'); // Jan 2024
    }
}
