-- Fix action_completions table and permissions
-- Run this in Supabase SQL Editor

-- Drop existing table if it has issues
DROP TABLE IF EXISTS action_completions CASCADE;

-- Create a proper completion history table
CREATE TABLE action_completions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_action_completions_action_id ON action_completions(action_id);
CREATE INDEX idx_action_completions_user_id ON action_completions(user_id);
CREATE INDEX idx_action_completions_completed_at ON action_completions(completed_at);

-- Enable RLS
ALTER TABLE action_completions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can manage own completion history" ON action_completions;
DROP POLICY IF EXISTS "Users can insert own completions" ON action_completions;
DROP POLICY IF EXISTS "Users can view own completions" ON action_completions;

-- Create proper RLS policies
CREATE POLICY "Users can insert own completions" ON action_completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own completions" ON action_completions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions" ON action_completions
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON action_completions TO authenticated;
GRANT USAGE ON SEQUENCE action_completions_id_seq TO authenticated;

-- Populate with existing completion data (if any)
-- This will add one entry per completed action for today
INSERT INTO action_completions (action_id, user_id, completed_at)
SELECT id, user_id, completed_at
FROM actions
WHERE completed = true
  AND completed_at IS NOT NULL
  AND completed_at::date = CURRENT_DATE
ON CONFLICT DO NOTHING;

-- Verify the table works
SELECT COUNT(*) as completion_count FROM action_completions;