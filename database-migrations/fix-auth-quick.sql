-- QUICK FIX: Disable the notification preferences trigger temporarily
-- This will let you log in, and we'll debug the trigger issue separately
-- Run this in Supabase SQL Editor

-- Drop the trigger (we can recreate it later once we fix the issue)
DROP TRIGGER IF EXISTS on_profile_created_create_notif_prefs ON profiles;

-- The function is fine, we're just disabling it from auto-running
-- Users can still get notification preferences created manually later

-- Verify trigger is gone
SELECT
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

-- This should return empty (no triggers on profiles for notifications)
