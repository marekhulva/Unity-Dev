-- Clean up and fix ALL Row Level Security policies
-- Run this in Supabase SQL Editor

-- First, drop ALL existing policies on these tables
DO $$ 
DECLARE
    pol record;
BEGIN
    -- Drop all policies on goals
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'goals'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON goals', pol.policyname);
    END LOOP;
    
    -- Drop all policies on actions
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'actions'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON actions', pol.policyname);
    END LOOP;
    
    -- Drop all policies on posts
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'posts'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON posts', pol.policyname);
    END LOOP;
    
    -- Drop all policies on reactions
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'reactions'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON reactions', pol.policyname);
    END LOOP;
    
    -- Drop all policies on profiles
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
END $$;

-- Now create fresh policies

-- Goals: Users can manage their own
CREATE POLICY "goals_select" ON goals
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "goals_insert" ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals_update" ON goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "goals_delete" ON goals
  FOR DELETE USING (auth.uid() = user_id);

-- Actions: Users can manage their own
CREATE POLICY "actions_select" ON actions
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "actions_insert" ON actions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "actions_update" ON actions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "actions_delete" ON actions
  FOR DELETE USING (auth.uid() = user_id);

-- Posts: Authenticated users can create and view all posts
CREATE POLICY "posts_select" ON posts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "posts_insert" ON posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "posts_update" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "posts_delete" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- Reactions: Authenticated users can manage
CREATE POLICY "reactions_select" ON reactions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "reactions_all" ON reactions
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Profiles: Everyone can view, users update own
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

SELECT 'All RLS policies cleaned and recreated successfully!' as message;