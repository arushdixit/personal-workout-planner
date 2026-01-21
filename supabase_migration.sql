-- Custom Exercise Routine Builder - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create routines table
CREATE TABLE IF NOT EXISTS routines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_user_id INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create routine_exercises table
CREATE TABLE IF NOT EXISTS routine_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL,
  exercise_name TEXT NOT NULL,
  sets INTEGER NOT NULL,
  reps TEXT NOT NULL,
  rest_seconds INTEGER NOT NULL,
  "order" INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own routines" ON routines;
DROP POLICY IF EXISTS "Users can manage their routine exercises" ON routine_exercises;

-- Create RLS policies for routines
CREATE POLICY "Users can manage their own routines"
  ON routines
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for routine_exercises
CREATE POLICY "Users can manage their routine exercises"
  ON routine_exercises
  FOR ALL
  USING (
    routine_id IN (
      SELECT id FROM routines WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    routine_id IN (
      SELECT id FROM routines WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routines_created_at ON routines(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine_id ON routine_exercises(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_order ON routine_exercises("order");

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_routines_updated_at ON routines;
CREATE TRIGGER update_routines_updated_at
    BEFORE UPDATE ON routines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
