import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Types ---

export interface RoutineExercise {
    exerciseId: number;
    exerciseName: string;
    sets: number;
    reps: string; // e.g., "8-12" or "10"
    restSeconds: number;
    order: number;
    notes?: string;
}

export interface Routine {
    id?: string;
    user_id: string;
    local_user_id: number;
    name: string;
    description?: string;
    exercises: RoutineExercise[];
    created_at?: string;
    updated_at?: string;
}

// --- Authentication ---

/**
 * Sign Up with Email and Password
 */
export async function signUp(email: string, password: string): Promise<{ user: any, error: any }> {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    return { user: data.user, error };
}

/**
 * Sign In with Email and Password
 */
export async function signIn(email: string, password: string): Promise<{ user: any, error: any }> {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    return { user: data.user, error };
}

/**
 * Sign Out
 */
export async function signOut(): Promise<{ error: any }> {
    const { error } = await supabase.auth.signOut();
    return { error };
}

/**
 * Get the current Supabase User
 */
export async function getCurrentUser(): Promise<any> {
    const { data } = await supabase.auth.getUser();
    return data.user;
}

/**
 * Get the current Supabase User ID (or null if not logged in)
 */
export async function getSupabaseUserId(): Promise<string | null> {
    const user = await getCurrentUser();
    return user ? user.id : null;
}

// --- Routine CRUD Operations ---

/**
 * Fetch all routines for a user
 */
export async function fetchRoutines(userId: string): Promise<Routine[]> {
    const { data: routinesData, error: routinesError } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (routinesError) {
        console.error('Error fetching routines:', routinesError);
        throw routinesError;
    }

    if (!routinesData) return [];

    // Fetch exercises for each routine
    const routines: Routine[] = [];
    for (const routine of routinesData) {
        const { data: exercisesData, error: exercisesError } = await supabase
            .from('routine_exercises')
            .select('*')
            .eq('routine_id', routine.id)
            .order('order', { ascending: true });

        if (exercisesError) {
            console.error('Error fetching routine exercises:', exercisesError);
            continue;
        }

        const exercises: RoutineExercise[] = (exercisesData || []).map(ex => ({
            exerciseId: ex.exercise_id,
            exerciseName: ex.exercise_name,
            sets: ex.sets,
            reps: ex.reps,
            restSeconds: ex.rest_seconds,
            order: ex.order,
            notes: ex.notes,
        }));

        routines.push({
            id: routine.id,
            user_id: routine.user_id,
            local_user_id: routine.local_user_id,
            name: routine.name,
            description: routine.description,
            exercises,
            created_at: routine.created_at,
            updated_at: routine.updated_at,
        });
    }

    return routines;
}

/**
 * Create a new routine
 */
export async function createRoutine(routine: Omit<Routine, 'id' | 'created_at' | 'updated_at'>): Promise<Routine> {
    // Insert routine
    const { data: routineData, error: routineError } = await supabase
        .from('routines')
        .insert({
            user_id: routine.user_id,
            local_user_id: routine.local_user_id,
            name: routine.name,
            description: routine.description,
        })
        .select()
        .single();

    if (routineError) {
        console.error('Error creating routine:', routineError);
        throw routineError;
    }

    // Insert exercises
    if (routine.exercises.length > 0) {
        const exercisesToInsert = routine.exercises.map(ex => ({
            routine_id: routineData.id,
            exercise_id: ex.exerciseId,
            exercise_name: ex.exerciseName,
            sets: ex.sets,
            reps: ex.reps,
            rest_seconds: ex.restSeconds,
            order: ex.order,
            notes: ex.notes,
        }));

        const { error: exercisesError } = await supabase
            .from('routine_exercises')
            .insert(exercisesToInsert);

        if (exercisesError) {
            console.error('Error creating routine exercises:', exercisesError);
            throw exercisesError;
        }
    }

    return {
        ...routine,
        id: routineData.id,
        created_at: routineData.created_at,
        updated_at: routineData.updated_at,
    };
}

/**
 * Update an existing routine
 */
export async function updateRoutine(routine: Routine): Promise<Routine> {
    if (!routine.id) throw new Error('Routine ID is required for update');

    // Update routine metadata
    const { error: routineError } = await supabase
        .from('routines')
        .update({
            name: routine.name,
            description: routine.description,
            updated_at: new Date().toISOString(),
        })
        .eq('id', routine.id);

    if (routineError) {
        console.error('Error updating routine:', routineError);
        throw routineError;
    }

    // Delete existing exercises
    const { error: deleteError } = await supabase
        .from('routine_exercises')
        .delete()
        .eq('routine_id', routine.id);

    if (deleteError) {
        console.error('Error deleting routine exercises:', deleteError);
        throw deleteError;
    }

    // Insert updated exercises
    if (routine.exercises.length > 0) {
        const exercisesToInsert = routine.exercises.map(ex => ({
            routine_id: routine.id,
            exercise_id: ex.exerciseId,
            exercise_name: ex.exerciseName,
            sets: ex.sets,
            reps: ex.reps,
            rest_seconds: ex.restSeconds,
            order: ex.order,
            notes: ex.notes,
        }));

        const { error: exercisesError } = await supabase
            .from('routine_exercises')
            .insert(exercisesToInsert);

        if (exercisesError) {
            console.error('Error updating routine exercises:', exercisesError);
            throw exercisesError;
        }
    }

    return {
        ...routine,
        updated_at: new Date().toISOString(),
    };
}

/**
 * Delete a routine
 */
export async function deleteRoutine(routineId: string): Promise<void> {
    // Delete routine (exercises will be cascade deleted)
    const { error } = await supabase
        .from('routines')
        .delete()
        .eq('id', routineId);

    if (error) {
        console.error('Error deleting routine:', error);
        throw error;
    }
}

/**
 * Duplicate a routine
 */
export async function duplicateRoutine(routineId: string, userId: string, localUserId: number): Promise<Routine> {
    // Fetch the original routine
    const routines = await fetchRoutines(userId);
    const original = routines.find(r => r.id === routineId);

    if (!original) {
        throw new Error('Routine not found');
    }

    // Create a copy with a new name
    const copy: Omit<Routine, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        local_user_id: localUserId,
        name: `${original.name} (Copy)`,
        description: original.description,
        exercises: original.exercises.map(ex => ({ ...ex })),
    };

    return await createRoutine(copy);
}
