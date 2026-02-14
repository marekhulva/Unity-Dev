-- ============================================
-- COMPLETE SQL MIGRATION PACKAGE (FIXED)
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,

  CONSTRAINT notifications_type_check CHECK (type IN (
    'challenge_invite',
    'challenge_start',
    'activity_reminder',
    'streak_milestone',
    'challenge_complete',
    'badge_earned',
    'circle_challenge_created'
  ))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_push_token ON profiles(push_token) WHERE push_token IS NOT NULL;

CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_all_notifications_as_read()
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE user_id = auth.uid() AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = auth.uid() AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. ADMIN SYSTEM
-- ============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

UPDATE profiles
SET is_admin = TRUE
WHERE name = '12221212' OR email LIKE '%12221212%';

-- ============================================
-- 3. VERIFY CHALLENGES TABLE EXISTS
-- ============================================

-- Check if challenges table exists, if not, provide helpful message
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'challenges') THEN
    RAISE NOTICE 'WARNING: challenges table does not exist. You need to run migration 004_create_challenges_tables.sql first!';
  END IF;
END $$;

-- ============================================
-- 4. CHALLENGE PERMISSIONS (only if table exists)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'challenges') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can create circle challenges" ON challenges;
    DROP POLICY IF EXISTS "Admins can create global challenges" ON challenges;
    DROP POLICY IF EXISTS "Circle members can create challenges" ON challenges;

    -- Circle members can create challenges
    EXECUTE 'CREATE POLICY "Circle members can create challenges"
      ON challenges FOR INSERT
      WITH CHECK (
        circle_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM circle_members
          WHERE circle_members.circle_id = challenges.circle_id
          AND circle_members.user_id = auth.uid()
        )
      )';

    -- Only admins can create global challenges
    EXECUTE 'CREATE POLICY "Admins can create global challenges"
      ON challenges FOR INSERT
      WITH CHECK (
        circle_id IS NULL
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.is_admin = TRUE
        )
      )';

    RAISE NOTICE '✅ Challenge policies created successfully';
  END IF;
END $$;

-- ============================================
-- 5. TEST DATA: Create sample challenge (only if challenges table exists)
-- ============================================

DO $$
DECLARE
  test_circle_id UUID;
  test_user_id UUID;
  new_challenge_id UUID;
  challenges_exists BOOLEAN;
BEGIN
  -- Check if challenges table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'challenges'
  ) INTO challenges_exists;

  IF NOT challenges_exists THEN
    RAISE NOTICE '⚠️  Skipping test challenge creation - challenges table does not exist';
    RAISE NOTICE '   Please run migration: 004_create_challenges_tables.sql first';
    RETURN;
  END IF;

  -- Get circle and user
  SELECT id INTO test_circle_id FROM circles WHERE invite_code = 'TEST123' LIMIT 1;
  SELECT id INTO test_user_id FROM profiles WHERE name = '12221212' OR email LIKE '%12221212%' LIMIT 1;

  IF test_circle_id IS NULL THEN
    RAISE NOTICE '⚠️  Circle TEST123 not found - skipping test challenge creation';
    RETURN;
  END IF;

  IF test_user_id IS NULL THEN
    RAISE NOTICE '⚠️  User 12221212 not found - skipping test challenge creation';
    RETURN;
  END IF;

  -- Create test challenge
  INSERT INTO challenges (
    id, circle_id, title, description, start_date, end_date,
    status, min_activities, scoring_type, created_by, icon, color
  )
  VALUES (
    gen_random_uuid(), test_circle_id,
    '🧊 7-Day Cold Shower Challenge',
    'Take a cold shower every morning for 7 days. Build mental toughness together as a circle!',
    NOW(), NOW() + INTERVAL '7 days',
    'active', 7, 'consistency', test_user_id, '🧊', '#4A90E2'
  )
  RETURNING id INTO new_challenge_id;

  -- Add activities
  INSERT INTO challenge_activities (challenge_id, title, description, canonical_name, points_per_completion, order_index)
  VALUES
    (new_challenge_id, '🚿 Morning Cold Shower', '2-minute cold shower to start your day', 'cold_shower', 10, 1),
    (new_challenge_id, '🧊 Ice Bath', '5-minute ice bath for the brave', 'ice_bath', 20, 2),
    (new_challenge_id, '❄️ Cold Face Dunk', '30-second cold water face dunk', 'cold_face', 5, 3);

  RAISE NOTICE '✅ Successfully created test challenge with ID: %', new_challenge_id;
END $$;

-- ============================================
-- 6. TEST DATA: Create test notification
-- ============================================

DO $$
DECLARE
  test_user_id UUID;
BEGIN
  SELECT id INTO test_user_id FROM profiles WHERE name = '12221212' OR email LIKE '%12221212%' LIMIT 1;

  IF test_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, body, data, action_url, is_read, created_at)
    VALUES (
      test_user_id,
      'circle_challenge_created',
      '🎯 New Circle Challenge Created!',
      'Your circle just started the "7-Day Cold Shower Challenge". Join now to participate with your circle mates!',
      '{"challengeId": "test-123", "circleName": "TEST123"}'::jsonb,
      '/challenges/test-123',
      false,
      NOW()
    );

    RAISE NOTICE '✅ Successfully created test notification';
  ELSE
    RAISE NOTICE '⚠️  User 12221212 not found - skipping test notification';
  END IF;
END $$;

-- ============================================
-- 7. VERIFICATION QUERIES
-- ============================================

SELECT '=== VERIFICATION RESULTS ===' as section;

-- Check notifications table
SELECT 'Notifications table:' as check_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications')
       THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check challenges table
SELECT 'Challenges table:' as check_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'challenges')
       THEN '✅ EXISTS' ELSE '❌ MISSING - Run 004_create_challenges_tables.sql' END as status;

-- Check admin flag
SELECT 'Admin flag:' as check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_name = 'profiles' AND column_name = 'is_admin'
       ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check your admin status
SELECT '=== YOUR ACCOUNT ===' as section;
SELECT name, email, is_admin,
  CASE WHEN is_admin THEN '✅ ADMIN' ELSE '❌ NOT ADMIN' END as admin_status
FROM profiles
WHERE name = '12221212' OR email LIKE '%12221212%';

-- Check notifications
SELECT '=== YOUR NOTIFICATIONS ===' as section;
SELECT type, title, is_read, created_at
FROM notifications
WHERE user_id = (SELECT id FROM profiles WHERE name = '12221212' OR email LIKE '%12221212%' LIMIT 1)
ORDER BY created_at DESC
LIMIT 5;

-- Check challenges (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'challenges') THEN
    RAISE NOTICE '=== CHALLENGES ===';
    PERFORM * FROM (
      SELECT c.title, c.status,
        CASE WHEN c.circle_id IS NULL THEN '🌍 Global' ELSE '⭕ Circle' END as type,
        ci.name as circle_name
      FROM challenges c
      LEFT JOIN circles ci ON c.circle_id = ci.id
      ORDER BY c.created_at DESC
      LIMIT 5
    ) AS challenges_list;
  END IF;
END $$;
