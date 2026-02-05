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

    // Insert exercises and sets
    for (const ex of params.exercises) {
        const { data: exerciseData, error: exError } = await supabase
            .from('session_exercises')
            .insert({
                session_id: data.id,
                exercise_id: ex.exercise_id,
                exercise_name: ex.exercise_name,
                exercise_order: ex.order,
            })
            .select()
            .single();

        if (exError) {
            console.error('Error creating session exercise:', exError);
            throw exError;
        }

        const { error: setsError } = await supabase
            .from('session_sets')
            .insert(
                ex.sets.map(set => ({
                    session_exercise_id: exerciseData.id,
                    set_number: set.set_number,
                    reps: set.reps,
                    weight: set.weight,
                    unit: set.unit,
                    completed: false,
                }))
            );

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

export async function completeWorkout(sessionId: number, endTime: string) {
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
        console.warn('Session not found on server, skipping completion:', sessionId);
        return; // Gracefully handle missing session
    }

    const duration = Math.floor(
        (new Date(endTime).getTime() - new Date(sessionData.start_time).getTime()) / 1000
    );

    const { error } = await supabase
        .from('workout_sessions')
        .update({
            status: 'completed',
            end_time: endTime,
            duration_seconds: duration,
        })
        .eq('id', sessionId);

    if (error) {
        console.error('Error completing workout:', error);
        throw error;
    }
}

export async function abandonWorkout(sessionId: number, endTime: string) {
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
        console.warn('Session not found on server, skipping abandonment:', sessionId);
        return; // Gracefully handle missing session
    }

    const duration = Math.floor(
        (new Date(endTime).getTime() - new Date(sessionData.start_time).getTime()) / 1000
    );

    const { error } = await supabase
        .from('workout_sessions')
        .update({
            status: 'abandoned',
            end_time: endTime,
            duration_seconds: duration,
        })
        .eq('id', sessionId);

    if (error) {
        console.error('Error abandoning workout:', error);
        throw error;
    }
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
    const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

    if (sessionError) {
        console.error('Error fetching session:', sessionError);
        throw sessionError;
    }

    const { data: exercises, error: exercisesError } = await supabase
        .from('session_exercises')
        .select('*')
        .eq('session_id', sessionId)
        .order('exercise_order', { ascending: true });

    if (exercisesError) {
        console.error('Error fetching session exercises:', exercisesError);
        throw exercisesError;
    }

    for (const exercise of exercises || []) {
        const { data: sets, error: setsError } = await supabase
            .from('session_sets')
            .select('*')
            .eq('session_exercise_id', exercise.id)
            .order('set_number', { ascending: true });

        if (setsError) {
            console.error('Error fetching session sets:', setsError);
            throw setsError;
        }

        exercise.sets = sets || [];
    }

    return { ...session, exercises };
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
