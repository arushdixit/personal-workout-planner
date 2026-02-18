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

export interface RemoteRoutine {
    id?: string;
    user_id: string;
    local_user_id: number;
    name: string;
    description?: string;
    exercises: RoutineExercise[];
    created_at?: string;
    updated_at?: string;
}


export interface UserExercise {
    id?: string;
    user_id: string;
    exercise_id_local: number;
    name: string;
    personal_notes?: string;
    equipment?: string;
    primary_muscles?: string[];
    secondary_muscles?: string[];
    source?: string;
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
export async function fetchRoutines(userId: string): Promise<RemoteRoutine[]> {
    const { data: routinesData, error: routinesError } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (routinesError) {
        console.error('Error fetching routines:', routinesError);
        throw routinesError;
    }

    if (!routinesData || routinesData.length === 0) return [];

    // Fetch ALL exercises for ALL routines in a single query (eliminates N+1)
    const routineIds = routinesData.map(r => r.id);
    const { data: allExercisesData, error: exercisesError } = await supabase
        .from('routine_exercises')
        .select('*')
        .in('routine_id', routineIds)
        .order('order', { ascending: true });

    if (exercisesError) {
        console.error('Error fetching routine exercises:', exercisesError);
        // Don't throw — return routines with empty exercises rather than failing entirely
    }

    // Group exercises by routine_id in memory
    const exercisesByRoutineId = new Map<string, RoutineExercise[]>();
    for (const ex of (allExercisesData || [])) {
        const mapped: RoutineExercise = {
            exerciseId: ex.exercise_id,
            exerciseName: ex.exercise_name,
            sets: ex.sets,
            reps: ex.reps,
            restSeconds: ex.rest_seconds,
            order: ex.order,
            notes: ex.notes,
        };
        if (!exercisesByRoutineId.has(ex.routine_id)) {
            exercisesByRoutineId.set(ex.routine_id, []);
        }
        exercisesByRoutineId.get(ex.routine_id)!.push(mapped);
    }

    return routinesData.map(routine => ({
        id: routine.id,
        user_id: routine.user_id,
        local_user_id: routine.local_user_id,
        name: routine.name,
        description: routine.description,
        exercises: exercisesByRoutineId.get(routine.id) || [],
        created_at: routine.created_at,
        updated_at: routine.updated_at,
    }));
}

/**
 * Create a new routine
 */
export async function createRoutine(routine: Omit<RemoteRoutine, 'id' | 'created_at' | 'updated_at'>): Promise<RemoteRoutine> {
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
 * Uses upsert instead of delete+reinsert to prevent data loss if the insert fails.
 */
export async function updateRoutine(routine: RemoteRoutine): Promise<RemoteRoutine> {
    if (!routine.id) throw new Error('Routine ID is required for update');

    const updatedAt = new Date().toISOString();

    // 1. Update routine metadata
    const { error: routineError } = await supabase
        .from('routines')
        .update({
            name: routine.name,
            description: routine.description,
            updated_at: updatedAt,
        })
        .eq('id', routine.id);

    if (routineError) {
        console.error('Error updating routine:', routineError);
        throw routineError;
    }

    // 2. Upsert current exercises (insert new, update existing by order)
    if (routine.exercises.length > 0) {
        const exercisesToUpsert = routine.exercises.map(ex => ({
            routine_id: routine.id,
            exercise_id: ex.exerciseId,
            exercise_name: ex.exerciseName,
            sets: ex.sets,
            reps: ex.reps,
            rest_seconds: ex.restSeconds,
            order: ex.order,
            notes: ex.notes,
        }));

        const { error: upsertError } = await supabase
            .from('routine_exercises')
            .upsert(exercisesToUpsert, { onConflict: 'routine_id,order' });

        if (upsertError) {
            console.error('Error upserting routine exercises:', upsertError);
            throw upsertError;
        }
    }

    // 3. Delete exercises that were removed (orders no longer present)
    const currentOrders = routine.exercises.map(ex => ex.order);
    const { error: deleteError } = await supabase
        .from('routine_exercises')
        .delete()
        .eq('routine_id', routine.id)
        .not('order', 'in', `(${currentOrders.join(',')})`);

    if (deleteError) {
        // Non-fatal: stale exercises remain but won't cause data loss
        console.warn('Error removing stale routine exercises (non-fatal):', deleteError);
    }

    return {
        ...routine,
        updated_at: updatedAt,
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
export async function duplicateRoutine(routineId: string, userId: string, localUserId: number): Promise<RemoteRoutine> {
    // Fetch the original routine
    const routines = await fetchRoutines(userId);
    const original = routines.find(r => r.id === routineId);

    if (!original) {
        throw new Error('Routine not found');
    }

    // Create a copy with a new name
    const copy: Omit<RemoteRoutine, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        local_user_id: localUserId,
        name: `${original.name} (Copy)`,
        description: original.description,
        exercises: original.exercises.map(ex => ({ ...ex })),
    };

    return await createRoutine(copy);
}

/**
 * Upsert user-specific exercise data (personal notes, custom exercises)
 */
export async function upsertUserExercise(exercise: UserExercise): Promise<UserExercise> {
    const { data, error } = await supabase
        .from('user_exercises')
        .upsert({
            user_id: exercise.user_id,
            name: exercise.name,
            exercise_id_local: exercise.exercise_id_local,
            personal_notes: exercise.personal_notes,
            equipment: exercise.equipment,
            primary_muscles: exercise.primary_muscles,
            secondary_muscles: exercise.secondary_muscles,
            source: exercise.source,
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'user_id,name'
        })
        .select()
        .single();

    if (error) {
        console.error('Error upserting user exercise:', error);
        throw error;
    }

    return data;
}

/**
 * Fetch all user-specific exercise data (personal notes)
 */
export async function fetchUserExercises(userId: string): Promise<UserExercise[]> {
    const { data, error } = await supabase
        .from('user_exercises')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching user exercises:', error);
        throw error;
    }

    return data || [];
}
