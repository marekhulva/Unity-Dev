-- Fix action_completions RLS to allow reading other users' completion counts
-- This is necessary for Circle page to show consistency stats

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view own completions" ON action_completions;

-- Create new policy that allows reading all users' completions
-- (needed for Circle page to show other members' consistency)
CREATE POLICY "Anyone can view all completions" ON action_completions
    FOR SELECT USING (true);

-- Keep insert restricted to own data
DROP POLICY IF EXISTS "Users can insert own completions" ON action_completions;
CREATE POLICY "Users can insert own completions" ON action_completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Keep delete restricted to own data
DROP POLICY IF EXISTS "Users can delete own completions" ON action_completions;
CREATE POLICY "Users can delete own completions" ON action_completions
    FOR DELETE USING (auth.uid() = user_id);
