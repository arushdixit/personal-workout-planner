import { supabase } from './supabaseClient';

export interface CreateSessionParams {
    user_id: string;
    routine_id: string;
    routine_name: string;
    date: string;
    start_time: string;
    exercises: {
        exercise_id: number;
        exercise_name: string;
        order: number;
        sets: {
            set_number: number;
            reps: number;
            weight: number;
            unit: 'kg' | 'lbs';
        }[];
    }[];
}

export interface SessionExerciseInput {
    exercise_id: number;
    exercise_name: string;
    order: number;
    sets: {
        set_number: number;
        reps: number;
        weight: number;
        unit: 'kg' | 'lbs';
    }[];
}

export async function createWorkoutSession(params: CreateSessionParams) {
    const { data, error } = await supabase
        .from('workout_sessions')
        .insert({
            user_id: params.user_id,
            routine_id: params.routine_id,
            routine_name: params.routine_name,
            date: params.date,
            start_time: params.start_time,
            status: 'in_progress',
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating workout session:', error);
        throw error;
    }

    if (params.exercises.length === 0) return data;

    // Bulk-insert all exercises in one round-trip
    const { data: exerciseRows, error: exError } = await supabase
        .from('session_exercises')
        .insert(
            params.exercises.map(ex => ({
                session_id: data.id,
                exercise_id: ex.exercise_id,
                exercise_name: ex.exercise_name,
                exercise_order: ex.order,
            }))
        )
        .select();

    if (exError) {
        console.error('Error creating session exercises:', exError);
        throw exError;
    }

    // Build a map from order → server exercise ID for set insertion
    const orderToId = new Map<number, number>();
    for (const row of exerciseRows || []) {
        orderToId.set(row.exercise_order, row.id);
    }

    // Collect all sets across all exercises and bulk-insert in one round-trip
    const allSets = params.exercises.flatMap(ex => {
        const exerciseId = orderToId.get(ex.order);
        if (!exerciseId) return [];
        return ex.sets.map(set => ({
            session_exercise_id: exerciseId,
            set_number: set.set_number,
            reps: set.reps,
            weight: set.weight,
            unit: set.unit,
            completed: false,
        }));
    });

    if (allSets.length > 0) {
        const { error: setsError } = await supabase
            .from('session_sets')
            .insert(allSets);

        if (setsError) {
            console.error('Error creating session sets:', setsError);
            throw setsError;
        }
    }

    return data;
}

export async function updateSessionExercise(
    sessionId: number,
    exerciseOrder: number,
    personalNote?: string
) {
    const { error } = await supabase
        .from('session_exercises')
        .update({ personal_note: personalNote })
        .eq('session_id', sessionId)
        .eq('exercise_order', exerciseOrder);

    if (error) {
        console.error('Error updating session exercise:', error);
        throw error;
    }
}

export async function completeSessionSet(
    setId: number,
    reps: number,
    weight: number,
    completedAt: string
) {
    const { error } = await supabase
        .from('session_sets')
        .update({
            reps,
            weight,
            completed: true,
            completed_at: completedAt,
        })
        .eq('id', setId);

    if (error) {
        console.error('Error completing session set:', error);
        throw error;
    }
}

export async function updateSessionSet(
    setId: number,
    updates: { reps?: number; weight?: number; completed?: boolean; completed_at?: string }
) {
    const { error } = await supabase
        .from('session_sets')
        .update(updates)
        .eq('id', setId);

    if (error) {
        console.error('Error updating session set:', error);
        throw error;
    }
}

export async function addSessionSet(
    sessionExerciseId: number,
    setNumber: number,
    unit: 'kg' | 'lbs'
) {
    const { error } = await supabase
        .from('session_sets')
        .insert({
            session_exercise_id: sessionExerciseId,
            set_number: setNumber,
            reps: 0,
            weight: 0,
            unit,
            completed: false,
        });

    if (error) {
        console.error('Error adding session set:', error);
        throw error;
    }
}

/**
 * Finalize a workout session (complete or abandon).
 * Merged from the former completeWorkout + abandonWorkout to eliminate duplication.
 */
export async function finalizeWorkout(
    sessionId: number,
    endTime: string,
    status: 'completed' | 'abandoned'
) {
    const { data: sessionData, error: fetchError } = await supabase
        .from('workout_sessions')
        .select('start_time')
        .eq('id', sessionId)
        .maybeSingle();

    if (fetchError) {
        console.error('Error fetching session:', fetchError);
        throw fetchError;
    }

    if (!sessionData) {
        console.warn(`Session not found on server, skipping ${status}:`, sessionId);
        return;
    }

    const duration = Math.floor(
        (new Date(endTime).getTime() - new Date(sessionData.start_time).getTime()) / 1000
    );

    const { error } = await supabase
        .from('workout_sessions')
        .update({ status, end_time: endTime, duration_seconds: duration })
        .eq('id', sessionId);

    if (error) {
        console.error(`Error ${status} workout:`, error);
        throw error;
    }
}

/** @deprecated Use finalizeWorkout instead */
export async function completeWorkout(sessionId: number, endTime: string) {
    return finalizeWorkout(sessionId, endTime, 'completed');
}

/** @deprecated Use finalizeWorkout instead */
export async function abandonWorkout(sessionId: number, endTime: string) {
    return finalizeWorkout(sessionId, endTime, 'abandoned');
}

export async function fetchWorkoutSessions(
    userId: string,
    limit: number = 30
) {
    const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching workout sessions:', error);
        throw error;
    }

    return data || [];
}

export async function fetchAllWorkoutSessionsWithDetails(userId: string) {
    const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
            *,
            session_exercises (
                *,
                session_sets (*)
            )
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching all workout sessions with details:', error);
        throw error;
    }

    return data || [];
}

export async function fetchWorkoutSessionDetails(sessionId: number) {
    // Single nested query instead of N+1 (one query per exercise)
    const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
            *,
            session_exercises (
                *,
                session_sets (*)
            )
        `)
        .eq('id', sessionId)
        .order('exercise_order', { referencedTable: 'session_exercises', ascending: true })
        .single();

    if (error) {
        console.error('Error fetching session details:', error);
        throw error;
    }

    return data;
}

export async function updateWorkoutSession(
    sessionId: number,
    updates: {
        status?: 'in_progress' | 'completed' | 'abandoned';
        end_time?: string;
        duration_seconds?: number;
    }
) {
    const { error } = await supabase
        .from('workout_sessions')
        .update(updates)
        .eq('id', sessionId);

    if (error) {
        console.error('Error updating workout session:', error);
        throw error;
    }
}
