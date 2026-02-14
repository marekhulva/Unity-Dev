-- ==========================================
-- TEMPORARY: DISABLE RLS FOR TESTING
-- ==========================================
-- Run this to PROVE that RLS is the problem
-- This will make challenges work immediately
-- ⚠️ WARNING: This is NOT secure for production!
-- We'll re-enable it after confirming it works
-- ==========================================

-- Disable RLS on challenge tables
ALTER TABLE challenges DISABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_forum_threads DISABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_forum_replies DISABLE ROW LEVEL SECURITY;

-- Test query
SELECT id, name, emoji, scope, status FROM challenges LIMIT 5;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '⚠️  RLS HAS BEEN DISABLED FOR TESTING';
  RAISE NOTICE '✅ Try refreshing your app - challenges should now appear';
  RAISE NOTICE '🔒 After confirming it works, run: enable-rls.sql';
END $$;
