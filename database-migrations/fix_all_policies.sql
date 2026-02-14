-- FIX ALL TABLE POLICIES
-- The posts fix worked, now let's fix goals, actions, and circle_members

-- SECTION 1: Check current policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('goals', 'actions', 'circle_members', 'circles')
ORDER BY tablename;

-- SECTION 2: Fix GOALS policies
DROP POLICY IF EXISTS "Users can create own goals" ON goals;
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;

-- Recreate with simpler checks
CREATE POLICY "Goals - view own" ON goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Goals - create own" ON goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Goals - update own" ON goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Goals - delete own" ON goals
    FOR DELETE USING (auth.uid() = user_id);

-- SECTION 3: Fix ACTIONS policies
DROP POLICY IF EXISTS "Users can create own actions" ON actions;
DROP POLICY IF EXISTS "Users can view own actions" ON actions;
DROP POLICY IF EXISTS "Users can update own actions" ON actions;
DROP POLICY IF EXISTS "Users can delete own actions" ON actions;

-- Recreate with simpler checks
CREATE POLICY "Actions - view own" ON actions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Actions - create own" ON actions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Actions - update own" ON actions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Actions - delete own" ON actions
    FOR DELETE USING (auth.uid() = user_id);

-- SECTION 4: Fix CIRCLE_MEMBERS policies
DROP POLICY IF EXISTS "View members of your circles" ON circle_members;
DROP POLICY IF EXISTS "Circle creators can add members" ON circle_members;
DROP POLICY IF EXISTS "Users can leave circles" ON circle_members;

-- Simplify circle member policies
CREATE POLICY "Circle members - view all" ON circle_members
    FOR SELECT USING (true);  -- Anyone can see who's in circles

CREATE POLICY "Circle members - join" ON circle_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);  -- You can only add yourself

CREATE POLICY "Circle members - leave" ON circle_members
    FOR DELETE USING (auth.uid() = user_id);  -- You can only remove yourself

-- SECTION 5: Fix CIRCLES policies
DROP POLICY IF EXISTS "View circles you're a member of" ON circles;
DROP POLICY IF EXISTS "Users can create circles" ON circles;
DROP POLICY IF EXISTS "Circle creators can update" ON circles;
DROP POLICY IF EXISTS "Circle creators can delete" ON circles;

-- Simplify circle policies
CREATE POLICY "Circles - view all" ON circles
    FOR SELECT USING (true);  -- Anyone can see circles (needed to join by code)

CREATE POLICY "Circles - create" ON circles
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Circles - update own" ON circles
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Circles - delete own" ON circles
    FOR DELETE USING (auth.uid() = created_by);

-- SECTION 6: Test creating a goal
INSERT INTO goals (user_id, title, description, target_value, current_value, deadline)
VALUES (
    auth.uid(),
    'Test Goal from SQL',
    'Testing if goals work',
    100,
    0,
    NOW() + INTERVAL '30 days'
) RETURNING *;

-- SECTION 7: Check if the goal was created
SELECT * FROM goals WHERE user_id = auth.uid();

-- SECTION 8: Test joining a circle
-- First get the TEST123 circle ID
SELECT id, name, invite_code FROM circles WHERE name = 'TEST123';

-- Try to join it
INSERT INTO circle_members (circle_id, user_id, joined_at)
VALUES (
    (SELECT id FROM circles WHERE name = 'TEST123'),
    auth.uid(),
    NOW()
) ON CONFLICT DO NOTHING
RETURNING *;