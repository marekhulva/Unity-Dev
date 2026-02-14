-- FIX: Allow the trigger to insert notification preferences during signup
-- The issue is that RLS policies are blocking the trigger from inserting

-- Drop the old policy that's too restrictive
DROP POLICY IF EXISTS "Users can update own preferences" ON notification_preferences;

-- Create separate policies for different operations
-- 1. Users can SELECT their own preferences
-- (This one is fine as-is)

-- 2. Users can INSERT their own preferences
CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Users can UPDATE their own preferences
CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. IMPORTANT: Allow the trigger function to bypass RLS
-- This is needed because during signup, auth.uid() might not be set yet
ALTER TABLE notification_preferences FORCE ROW LEVEL SECURITY;

-- Grant the service role permission to insert (for triggers)
-- This allows the SECURITY DEFINER function to work
GRANT INSERT ON notification_preferences TO authenticated;
GRANT INSERT ON notification_preferences TO service_role;

-- Verify the policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'notification_preferences';
