-- ============================================================================
-- Script to check and fix RLS policies on challenges table
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Check current RLS policies on challenges table
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
WHERE tablename = 'challenges';

-- 2. Check if RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'challenges';

-- ============================================================================
-- OPTION A: Disable RLS entirely (simplest, but less secure)
-- ============================================================================
-- Uncomment to use:
-- ALTER TABLE challenges DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- OPTION B: Add policy to allow service_role to insert (better security)
-- ============================================================================
-- This allows service_role to insert while keeping RLS for other users

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Allow service role full access" ON challenges;

-- Create policy allowing service_role full access
CREATE POLICY "Allow service role full access"
ON challenges
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Also ensure authenticated users can read challenges
DROP POLICY IF EXISTS "Allow authenticated users to read challenges" ON challenges;

CREATE POLICY "Allow authenticated users to read challenges"
ON challenges
FOR SELECT
TO authenticated
USING (
  scope = 'global'
  OR circle_id IN (
    SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
  )
);

-- Allow challenge creators to insert challenges
DROP POLICY IF EXISTS "Allow users to create challenges" ON challenges;

CREATE POLICY "Allow users to create challenges"
ON challenges
FOR INSERT
TO authenticated
WITH CHECK (
  scope = 'global' -- Can be restricted further if needed
  OR circle_id IN (
    SELECT circle_id FROM circle_members WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- 3. Verify the changes
-- ============================================================================
SELECT
    policyname,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'challenges';
