import { db, WorkoutSession, WorkoutSessionExercise, WorkoutSet } from './db';

export async function createWorkoutSession(
    session: Omit<WorkoutSession, 'id'>
): Promise<number> {
    return await db.workout_sessions.add(session);
}

export async function updateWorkoutSession(
    id: number,
    updates: Partial<WorkoutSession>
): Promise<void> {
    await db.workout_sessions.update(id, updates);
}

export async function getWorkoutSession(id: number): Promise<WorkoutSession | undefined> {
    return await db.workout_sessions.get(id);
}

export async function getActiveSession(userId: number): Promise<WorkoutSession | undefined> {
    return await db.workout_sessions
        .where('userId')
        .equals(userId)
        .and(s => s.status === 'in_progress')
        .first();
}

export async function getUserSessions(
    userId: number,
    limit: number = 30
): Promise<WorkoutSession[]> {
    return await db.workout_sessions
        .where('userId')
        .equals(userId)
        .and(s => s.status === 'completed')
        .reverse()
        .limit(limit)
        .toArray();
}

export async function updateSessionExercise(
    sessionId: number,
    exerciseIndex: number,
    updates: Partial<WorkoutSessionExercise>
): Promise<void> {
    const session = await db.workout_sessions.get(sessionId);
    if (!session) return;

    const exercise = session.exercises[exerciseIndex];
    if (exercise) {
        session.exercises[exerciseIndex] = {
            ...exercise,
            ...updates,
        };
        await db.workout_sessions.update(sessionId, { exercises: session.exercises });
    }
}

export async function completeSet(
    sessionId: number,
    exerciseIndex: number,
    setId: number,
    weight: number,
    reps: number,
    unit: 'kg' | 'lbs'
): Promise<void> {
    const session = await db.workout_sessions.get(sessionId);
    if (!session) return;

    const exercise = session.exercises[exerciseIndex];
    const setIndex = exercise?.sets.findIndex(s => s.id === setId);

    if (setIndex !== undefined && setIndex !== -1 && exercise) {
        exercise.sets[setIndex] = {
            ...exercise.sets[setIndex],
            weight,
            reps,
            unit,
            completed: true,
            completedAt: new Date().toISOString(),
        };
        await db.workout_sessions.update(sessionId, { exercises: session.exercises });
    }
}

export async function updateSet(
    sessionId: number,
    exerciseIndex: number,
    setId: number,
    updates: Partial<WorkoutSet>
): Promise<void> {
    const session = await db.workout_sessions.get(sessionId);
    if (!session) return;

    const exercise = session.exercises[exerciseIndex];
    const setIndex = exercise?.sets.findIndex(s => s.id === setId);

    if (setIndex !== undefined && setIndex !== -1 && exercise) {
        exercise.sets[setIndex] = {
            ...exercise.sets[setIndex],
            ...updates,
        };
        await db.workout_sessions.update(sessionId, { exercises: session.exercises });
    }
}

export async function addExtraSet(
    sessionId: number,
    exerciseIndex: number,
    unit: 'kg' | 'lbs'
): Promise<void> {
    const session = await db.workout_sessions.get(sessionId);
    if (!session) return;

    const exercise = session.exercises[exerciseIndex];
    if (exercise) {
        const newSetNumber = exercise.sets.length + 1;
        const newSet: WorkoutSet = {
            id: Date.now(),
            setNumber: newSetNumber,
            reps: 0,
            weight: 0,
            unit,
            completed: false,
        };
        exercise.sets.push(newSet);
        await db.workout_sessions.update(sessionId, { exercises: session.exercises });
    }
}

export async function deleteLastSet(
    sessionId: number,
    exerciseIndex: number
): Promise<void> {
    const session = await db.workout_sessions.get(sessionId);
    if (!session) return;

    const exercise = session.exercises[exerciseIndex];
    if (exercise && exercise.sets.length > 0) {
        exercise.sets.pop();
        await db.workout_sessions.update(sessionId, { exercises: session.exercises });
    }
}

export async function endWorkout(
    sessionId: number,
    status: 'completed' | 'abandoned' = 'completed'
): Promise<void> {
    const session = await db.workout_sessions.get(sessionId);
    if (!session) return;

    const endTime = new Date().toISOString();
    const duration = Math.floor(
        (new Date(endTime).getTime() - new Date(session.startTime).getTime()) / 1000
    );

    await db.workout_sessions.update(sessionId, {
        status,
        endTime,
        duration,
    });
}

export async function getSessionByRoutine(
    userId: number,
    routineId: string
): Promise<WorkoutSession | undefined> {
    return await db.workout_sessions
        .where('userId')
        .equals(userId)
        .and(s => s.routineId === routineId)
        .filter(s => s.status === 'in_progress' || s.status === 'completed')
        .last();
}

export async function getLastSessionForRoutine(
    userId: number,
    routineId: string
): Promise<WorkoutSession | undefined> {
    return await db.workout_sessions
        .where('userId')
        .equals(userId)
        .and(s => s.routineId === routineId && s.status === 'completed')
        .last();
}

export async function getLastExercisePerformance(
    userId: number,
    exerciseId: number
): Promise<WorkoutSet[] | undefined> {
    const session = await db.workout_sessions
        .where('userId')
        .equals(userId)
        .and(s => s.status === 'completed' && s.exercises.some(ex => ex.exerciseId === exerciseId))
        .reverse()
        .first();

    if (!session) return undefined;

    const exercise = session.exercises.find(ex => ex.exerciseId === exerciseId);
    return exercise?.sets.filter(s => s.completed);
}

export async function clearIncompleteSessions(userId: number): Promise<void> {
    const sessions = await db.workout_sessions
        .where('userId')
        .equals(userId)
        .and(s => s.status === 'in_progress')
        .toArray();

    for (const session of sessions) {
        await db.workout_sessions.delete(session.id!);
    }
}
