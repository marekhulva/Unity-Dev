-- Fix RLS policies for challenge_activity_schedules table
-- Allow users to manage their own schedule overrides

-- Policy: Users can view their own schedule overrides
CREATE POLICY "Users can view their own schedule overrides"
ON challenge_activity_schedules
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own schedule overrides
CREATE POLICY "Users can insert their own schedule overrides"
ON challenge_activity_schedules
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own schedule overrides
CREATE POLICY "Users can update their own schedule overrides"
ON challenge_activity_schedules
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own schedule overrides
CREATE POLICY "Users can delete their own schedule overrides"
ON challenge_activity_schedules
FOR DELETE
USING (auth.uid() = user_id);
