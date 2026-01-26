import { db, Routine } from './db';

export interface RoutineCyclingResult {
    routine: Routine | null;
    reason: 'no_routines' | 'first_routine' | 'cycle_next' | 'manual_select';
}

export async function determineTodaysRoutine(
    localUserId: number,
    supabaseUserId: string | undefined,
    activeSplit: string,
    lastCompletedRoutineId?: string
): Promise<RoutineCyclingResult> {
    // Get all routines for this user
    // Use supabaseUserId as primary lookup since it's stable across DB cleanups
    let routines: Routine[] = [];

    if (supabaseUserId) {
        routines = await db.routines
            .where('userId')
            .equals(supabaseUserId)
            .toArray();
    }

    // Fallback to localUserId if no supabaseUserId or no routines found
    if (routines.length === 0 && localUserId) {
        routines = await db.routines
            .where('localUserId')
            .equals(localUserId)
            .toArray();
    }

    if (routines.length === 0) {
        return { routine: null, reason: 'no_routines' };
    }

    // Sort routines by name to ensure consistent order
    routines.sort((a, b) => a.name.localeCompare(b.name));

    // If no completed routine, return first routine
    if (!lastCompletedRoutineId) {
        return {
            routine: routines[0],
            reason: 'first_routine'
        };
    }

    // Find the last completed routine
    const lastCompletedIndex = routines.findIndex(
        r => r.id === lastCompletedRoutineId
    );

    // If last completed routine not found, return first
    if (lastCompletedIndex === -1) {
        return {
            routine: routines[0],
            reason: 'first_routine'
        };
    }

    // Cycle to next routine (wrap around)
    const nextIndex = (lastCompletedIndex + 1) % routines.length;

    return {
        routine: routines[nextIndex],
        reason: 'cycle_next'
    };
}

export async function updateLastCompletedRoutine(
    userId: number,
    routineId: string
): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await db.users.update(userId, {
        lastCompletedRoutineId: routineId,
        lastWorkoutDate: today,
    });
}

export async function getLastCompletedRoutine(
    localUserId: number
): Promise<string | undefined> {
    const user = await db.users.get(localUserId);
    return user?.lastCompletedRoutineId;
}

export async function getRoutinesForSplit(
    localUserId: number,
    supabaseUserId: string | undefined,
    activeSplit: string
): Promise<Routine[]> {
    // Use supabaseUserId as primary lookup since it's stable across DB cleanups
    let routines: Routine[] = [];

    if (supabaseUserId) {
        routines = await db.routines
            .where('userId')
            .equals(supabaseUserId)
            .toArray();
    }

    // Fallback to localUserId if no supabaseUserId or no routines found
    if (routines.length === 0 && localUserId) {
        routines = await db.routines
            .where('localUserId')
            .equals(localUserId)
            .toArray();
    }

    // Filter routines that match the active split
    // This assumes routines have a way to identify their split type
    // If not, we return all routines for now
    return routines;
}

export function calculateWorkoutDuration(routine: Routine): number {
    let totalSets = 0;
    let totalRestSeconds = 90; // Default rest

    for (const exercise of routine.exercises) {
        totalSets += exercise.sets;
        totalRestSeconds = exercise.restSeconds || 90;
    }

    // Estimate: 45 seconds per set + rest time between sets
    const setTime = totalSets * 45;
    const restTime = (totalSets - 1) * totalRestSeconds;

    return Math.ceil((setTime + restTime) / 60); // Return in minutes
}

export function getSplitDays(split: string): string[] {
    switch (split) {
        case 'PPL':
            return ['Push', 'Pull', 'Legs'];
        case 'UpperLower':
            return ['Upper', 'Lower'];
        case 'FullBody':
            return ['Full Body'];
        default:
            return ['Full Body'];
    }
}

export function getTodaySplitType(activeSplit: string): string {
    const splitDays = getSplitDays(activeSplit);
    const todayIndex = new Date().getDay() % splitDays.length;
    return splitDays[todayIndex];
}
