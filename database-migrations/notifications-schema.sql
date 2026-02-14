-- ============================================
-- NOTIFICATION SYSTEM EXPANSION
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. NOTIFICATION PREFERENCES
-- ============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

  -- Channel toggles
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,

  -- Category toggles
  social_notifications BOOLEAN DEFAULT true,
  challenge_notifications BOOLEAN DEFAULT true,
  reminder_notifications BOOLEAN DEFAULT true,
  competitive_notifications BOOLEAN DEFAULT true,

  -- Morning digest settings
  morning_digest_enabled BOOLEAN DEFAULT true,
  morning_digest_time TIME DEFAULT '07:00:00',

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '07:00:00',

  -- User timezone (critical for scheduling)
  timezone TEXT DEFAULT 'UTC',

  -- Notification tone preference
  notification_tone TEXT DEFAULT 'aggressive' CHECK (notification_tone IN ('aggressive', 'supportive', 'minimal')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON notification_preferences(user_id);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own preferences" ON notification_preferences;
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON notification_preferences;
CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 2. NOTIFICATION SCHEDULES
-- ============================================

CREATE TABLE IF NOT EXISTS notification_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- What kind of notification
  notification_type TEXT NOT NULL,

  -- When to send
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Notification data
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  action_url TEXT,

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_schedules_user ON notification_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_pending ON notification_schedules(scheduled_for, status)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_schedules_type ON notification_schedules(notification_type);

-- Enable RLS
ALTER TABLE notification_schedules ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own schedules" ON notification_schedules;
CREATE POLICY "Users can view own schedules"
  ON notification_schedules FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage schedules" ON notification_schedules;
CREATE POLICY "Service can manage schedules"
  ON notification_schedules FOR ALL
  WITH CHECK (true);

-- ============================================
-- 3. UPDATE NOTIFICATIONS TABLE
-- ============================================

-- Add category for filtering
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category TEXT
  CHECK (category IN ('digest', 'social', 'challenge', 'competitive', 'system'));

-- Add tone tracking for A/B testing
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS tone TEXT
  CHECK (tone IN ('aggressive', 'supportive', 'neutral'));

-- Add opened tracking
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS led_to_action BOOLEAN DEFAULT false;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ============================================
-- 4. DEFAULT PREFERENCES FOR EXISTING USERS
-- ============================================

-- Create default preferences for all existing users
INSERT INTO notification_preferences (user_id, timezone)
SELECT id, 'UTC' FROM profiles
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create preferences
DROP TRIGGER IF EXISTS on_profile_created_create_notif_prefs ON profiles;
CREATE TRIGGER on_profile_created_create_notif_prefs
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Function to get user's local time
CREATE OR REPLACE FUNCTION get_user_local_time(p_user_id UUID)
RETURNS TIME AS $$
DECLARE
  user_tz TEXT;
  local_time TIME;
BEGIN
  SELECT timezone INTO user_tz
  FROM notification_preferences
  WHERE user_id = p_user_id;

  IF user_tz IS NULL THEN
    user_tz := 'UTC';
  END IF;

  SELECT (NOW() AT TIME ZONE user_tz)::TIME INTO local_time;

  RETURN local_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. VERIFICATION
-- ============================================

SELECT '=== VERIFICATION ===' as section;

SELECT 'notification_preferences table:' as check_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_preferences')
       THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 'notification_schedules table:' as check_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_schedules')
       THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Show sample preferences
SELECT '=== SAMPLE PREFERENCES ===' as section;
SELECT user_id, morning_digest_enabled, morning_digest_time, notification_tone, timezone
FROM notification_preferences
LIMIT 3;
