-- ProLifts Optimized Supabase Schema
-- Updated: 2026-01-26 (Using Performance-Optimized RLS Policies)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: routines
CREATE TABLE IF NOT EXISTS public.routines (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  local_user_id integer,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT routines_pkey PRIMARY KEY (id),
  CONSTRAINT routines_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table: routine_exercises
CREATE TABLE IF NOT EXISTS public.routine_exercises (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  routine_id uuid NOT NULL,
  exercise_id integer NOT NULL,
  exercise_name text NOT NULL,
  sets integer NOT NULL,
  reps text NOT NULL,
  rest_seconds integer NOT NULL,
  "order" integer NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT routine_exercises_pkey PRIMARY KEY (id),
  CONSTRAINT routine_exercises_routine_id_fkey FOREIGN KEY (routine_id) REFERENCES public.routines(id) ON DELETE CASCADE
);

-- Table: workout_sessions
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  uuid uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  user_id uuid NOT NULL,
  routine_id text NOT NULL,
  routine_name text NOT NULL,
  date date NOT NULL,
  start_time timestamp with time zone NOT NULL DEFAULT now(),
  end_time timestamp with time zone,
  duration_seconds integer,
  status text DEFAULT 'in_progress'::text CHECK (status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'abandoned'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT workout_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT workout_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table: session_exercises
CREATE TABLE IF NOT EXISTS public.session_exercises (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  session_id bigint NOT NULL,
  exercise_id integer NOT NULL,
  exercise_name text NOT NULL,
  exercise_order integer NOT NULL,
  personal_note text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT session_exercises_pkey PRIMARY KEY (id),
  CONSTRAINT session_exercises_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.workout_sessions(id) ON DELETE CASCADE
);

-- Table: session_sets
CREATE TABLE IF NOT EXISTS public.session_sets (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  session_exercise_id bigint NOT NULL,
  set_number integer NOT NULL,
  reps integer NOT NULL,
  weight numeric NOT NULL,
  unit text DEFAULT 'kg'::text CHECK (unit = ANY (ARRAY['kg'::text, 'lbs'::text])),
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  rpe numeric,
  feedback text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT session_sets_pkey PRIMARY KEY (id),
  CONSTRAINT session_sets_session_exercise_id_fkey FOREIGN KEY (session_exercise_id) REFERENCES public.session_exercises(id) ON DELETE CASCADE
);

-- Table: user_exercises
CREATE TABLE IF NOT EXISTS public.user_exercises (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id_local integer,
  name text NOT NULL,
  personal_notes text,
  equipment text,
  primary_muscles text[],
  secondary_muscles text[],
  source text,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_exercises ENABLE ROW LEVEL SECURITY;

-- PERFORMANCE OPTIMIZED POLICIES using (SELECT auth.uid())
CREATE POLICY "Users can manage their own routines" ON public.routines 
  FOR ALL USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can manage their own routine exercises" ON public.routine_exercises 
  FOR ALL USING (
    routine_id IN (SELECT id FROM public.routines WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Users can manage their own sessions" ON public.workout_sessions 
  FOR ALL USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can manage their own session exercises" ON public.session_exercises 
  FOR ALL USING (
    session_id IN (SELECT id FROM public.workout_sessions WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Users can manage their own session sets" ON public.session_sets 
  FOR ALL USING (
    session_exercise_id IN (
      SELECT se.id FROM public.session_exercises se 
      JOIN public.workout_sessions ws ON se.session_id = ws.id 
      WHERE ws.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can manage their own exercise notes" ON public.user_exercises 
  FOR ALL USING (user_id = (SELECT auth.uid()));
