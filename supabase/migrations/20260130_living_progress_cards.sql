-- ============================================
-- Migration: Living Progress Cards
-- ============================================
-- Created: 2026-01-30
-- Purpose: Add support for daily progress cards that consolidate multiple action completions
--          into a single card per user per day that updates in place.

-- Add Living Progress Card fields to posts table
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS is_daily_progress BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS progress_date DATE,
  ADD COLUMN IF NOT EXISTS completed_actions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS total_actions INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actions_today INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add comments for documentation
COMMENT ON COLUMN posts.is_daily_progress IS 'Identifies this post as a daily progress card (one per user per day)';
COMMENT ON COLUMN posts.progress_date IS 'Date for which progress is tracked (YYYY-MM-DD format)';
COMMENT ON COLUMN posts.completed_actions IS 'JSONB array of completed actions with metadata (actionId, title, goalTitle, goalColor, completedAt, streak, order)';
COMMENT ON COLUMN posts.total_actions IS 'Total number of daily actions configured for this user';
COMMENT ON COLUMN posts.actions_today IS 'Count of completed actions (equals length of completed_actions array)';
COMMENT ON COLUMN posts.updated_at IS 'Last update timestamp - bumps to top of feed on each completion';

-- Create unique index to ensure one card per user per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_progress_user_date
  ON posts(user_id, progress_date)
  WHERE is_daily_progress = true;

-- Create index for efficient feed queries
CREATE INDEX IF NOT EXISTS idx_posts_daily_progress
  ON posts(is_daily_progress, progress_date, updated_at DESC)
  WHERE is_daily_progress = true;

-- Update type constraint to include 'daily_progress'
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_type_check;
ALTER TABLE posts ADD CONSTRAINT posts_type_check
  CHECK (type IN ('checkin', 'status', 'photo', 'audio', 'goal', 'celebration', 'daily_progress'));

-- Insert feature flag (default OFF for safe rollout)
-- Note: Assuming feature_flags table exists with columns: name (text), enabled (boolean), description (text)
INSERT INTO feature_flags (name, enabled, description)
VALUES ('use_living_progress_cards', false, 'Consolidate daily actions into one card per user per day')
ON CONFLICT (name) DO UPDATE SET enabled = false, description = 'Consolidate daily actions into one card per user per day';

-- Verification query
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'posts'
  AND column_name IN ('is_daily_progress', 'progress_date', 'completed_actions', 'total_actions', 'actions_today', 'updated_at')
ORDER BY ordinal_position;

-- ============================================
-- JSONB Structure Documentation
-- ============================================
-- completed_actions array structure:
-- [
--   {
--     "actionId": "uuid",
--     "title": "Morning Run",
--     "goalTitle": "Fitness",
--     "goalColor": "#E7B43A",
--     "completedAt": "2026-01-30T08:15:00Z",
--     "streak": 5,
--     "order": 1
--   }
-- ]
-- Note: order field determines newest (higher = more recent)
-- ============================================
