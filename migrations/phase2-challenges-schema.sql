-- ============================================
-- PHASE 2: CHALLENGES SYSTEM - DATABASE MIGRATION
-- ============================================
-- Created: December 27, 2025
-- Purpose: Archive old challenge schema and create new schema
-- Based on: CHALLENGES_PAGE_DESIGN_FINAL.md
-- Status: Ready to run

-- ============================================
-- STEP 1: ARCHIVE OLD CHALLENGE TABLES
-- ============================================
-- Rename old tables to keep as backup (delete after 30 days if not needed)

ALTER TABLE IF EXISTS challenges RENAME TO _archived_challenges_v1;
ALTER TABLE IF EXISTS challenge_participants RENAME TO _archived_challenge_participants_v1;
ALTER TABLE IF EXISTS challenge_activities RENAME TO _archived_challenge_activities_v1;
ALTER TABLE IF EXISTS challenge_completions RENAME TO _archived_challenge_completions_v1;
ALTER TABLE IF EXISTS challenge_activity_types RENAME TO _archived_challenge_activity_types_v1;
ALTER TABLE IF EXISTS challenge_rules RENAME TO _archived_challenge_rules_v1;

-- ============================================
-- STEP 2: CREATE NEW CHALLENGES TABLE
-- ============================================
-- Supports both Global and Circle challenges

CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '🏆',

  -- Challenge type and scope
  type TEXT NOT NULL CHECK (type IN ('streak', 'cumulative', 'competition', 'team')),
  scope TEXT NOT NULL CHECK (scope IN ('global', 'circle')),
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE, -- NULL for global challenges

  -- Duration and timing
  duration_days INTEGER NOT NULL,
  success_threshold INTEGER DEFAULT 80 CHECK (success_threshold >= 0 AND success_threshold <= 100),

  -- Challenge configuration
  predetermined_activities JSONB NOT NULL DEFAULT '[]'::jsonb,
  rules JSONB DEFAULT '{}'::jsonb,
  benefits JSONB DEFAULT '[]'::jsonb,

  -- Badge configuration
  badge_emoji TEXT DEFAULT '🏆',
  badge_name TEXT,

  -- Forum settings (for global challenges)
  has_forum BOOLEAN DEFAULT false,

  -- Status and metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT circle_required_for_circle_scope CHECK (
    (scope = 'global' AND circle_id IS NULL) OR
    (scope = 'circle' AND circle_id IS NOT NULL)
  )
);

-- ============================================
-- STEP 3: CREATE CHALLENGE PARTICIPANTS TABLE
-- ============================================
-- Personal/Quest model: Each user has their own start date

CREATE TABLE challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Personal start/end dates (quest model)
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  personal_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  personal_end_date DATE, -- Calculated from personal_start_date + duration_days

  -- Progress tracking
  current_day INTEGER DEFAULT 1,
  completed_days INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completion_at TIMESTAMPTZ,

  -- Completion status
  completion_percentage NUMERIC(5,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'abandoned', 'left')),
  badge_earned TEXT CHECK (badge_earned IN ('gold', 'silver', 'bronze', 'failed', 'abandoned')),
  completed_at TIMESTAMPTZ,
  abandoned_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  days_taken INTEGER,

  -- Activity management
  selected_activity_ids UUID[] DEFAULT '{}',
  activity_times JSONB DEFAULT '[]'::jsonb, -- [{activity_id, scheduled_time, is_link, linked_to}]
  linked_action_ids UUID[] DEFAULT '{}',
  kept_activities BOOLEAN,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(challenge_id, user_id)
);

-- ============================================
-- STEP 4: CREATE CHALLENGE ACTIVITY SCHEDULES
-- ============================================
-- Stores reminder schedules for challenge activities

CREATE TABLE challenge_activity_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL, -- References predetermined_activities in challenges.predetermined_activities

  -- Schedule configuration
  scheduled_time TIME NOT NULL,
  reminder_minutes_before INTEGER DEFAULT 15,
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'custom')),
  days_of_week INTEGER[], -- [1,2,3,4,5] for Mon-Fri, NULL for daily

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, challenge_id, activity_id)
);

-- ============================================
-- STEP 5: CREATE CHALLENGE COMPLETIONS TABLE
-- ============================================
-- Tracks individual activity completions

CREATE TABLE challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  action_id UUID REFERENCES actions(id) ON DELETE CASCADE, -- Linked action that was completed

  -- Completion details
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  completion_date DATE DEFAULT CURRENT_DATE,

  -- Verification (optional)
  photo_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_type TEXT DEFAULT 'honor' CHECK (verification_type IN ('honor', 'photo', 'required_photo')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 6: CREATE USER BADGES TABLE
-- ============================================
-- Stores earned badges from challenges

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,

  -- Badge details
  badge_type TEXT NOT NULL CHECK (badge_type IN ('gold', 'silver', 'bronze', 'diamond', 'legendary')),
  badge_emoji TEXT NOT NULL,
  badge_name TEXT NOT NULL,

  -- Display settings
  is_displayed_on_profile BOOLEAN DEFAULT true,
  display_order INTEGER,

  -- Stats
  completion_percentage NUMERIC(5,2),
  final_rank INTEGER,
  total_participants INTEGER,
  days_taken INTEGER,

  earned_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, challenge_id)
);

-- ============================================
-- STEP 7: CREATE FORUM TABLES (FOR GLOBAL CHALLENGES)
-- ============================================

-- Forum threads
CREATE TABLE challenge_forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Thread content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('tips', 'questions', 'motivation', 'strategy')),

  -- Thread status
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,

  -- Engagement metrics
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_reply_at TIMESTAMPTZ
);

-- Forum replies
CREATE TABLE challenge_forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES challenge_forum_threads(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES challenge_forum_replies(id) ON DELETE CASCADE, -- For nested replies
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Reply content
  content TEXT NOT NULL,

  -- Engagement metrics
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 8: MODIFY ACTIONS TABLE
-- ============================================
-- Add support for multi-challenge tagging and habit tracking

ALTER TABLE actions
ADD COLUMN IF NOT EXISTS challenge_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_habit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS habit_source TEXT;

-- Add comment to explain challenge_ids
COMMENT ON COLUMN actions.challenge_ids IS 'Array of challenge IDs this action belongs to (supports multi-challenge tagging)';
COMMENT ON COLUMN actions.is_habit IS 'True if this action is a permanent habit (not tied to active challenge)';
COMMENT ON COLUMN actions.habit_source IS 'Source of habit: challenge_converted, user_created, etc.';

-- ============================================
-- STEP 9: CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Challenges indexes
CREATE INDEX idx_challenges_scope ON challenges(scope);
CREATE INDEX idx_challenges_circle_id ON challenges(circle_id) WHERE circle_id IS NOT NULL;
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_challenges_created_by ON challenges(created_by);

-- Challenge participants indexes
CREATE INDEX idx_participants_challenge_id ON challenge_participants(challenge_id);
CREATE INDEX idx_participants_user_id ON challenge_participants(user_id);
CREATE INDEX idx_participants_status ON challenge_participants(status);
CREATE INDEX idx_participants_badge_earned ON challenge_participants(badge_earned) WHERE badge_earned IS NOT NULL;

-- Challenge completions indexes
CREATE INDEX idx_completions_user_id ON challenge_completions(user_id);
CREATE INDEX idx_completions_challenge_id ON challenge_completions(challenge_id);
CREATE INDEX idx_completions_completion_date ON challenge_completions(completion_date);
CREATE INDEX idx_completions_action_id ON challenge_completions(action_id) WHERE action_id IS NOT NULL;

-- User badges indexes
CREATE INDEX idx_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_badges_challenge_id ON user_badges(challenge_id);
CREATE INDEX idx_badges_displayed ON user_badges(user_id, is_displayed_on_profile) WHERE is_displayed_on_profile = true;

-- Forum indexes
CREATE INDEX idx_forum_threads_challenge_id ON challenge_forum_threads(challenge_id);
CREATE INDEX idx_forum_threads_author_id ON challenge_forum_threads(author_id);
CREATE INDEX idx_forum_threads_created_at ON challenge_forum_threads(created_at DESC);
CREATE INDEX idx_forum_replies_thread_id ON challenge_forum_replies(thread_id);
CREATE INDEX idx_forum_replies_author_id ON challenge_forum_replies(author_id);

-- Actions challenge_ids index (GIN for array operations)
CREATE INDEX idx_actions_challenge_ids ON actions USING GIN(challenge_ids);

-- ============================================
-- STEP 10: SET UP ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_activity_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_forum_replies ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CHALLENGES TABLE RLS POLICIES
-- ============================================

-- Everyone can view active challenges
CREATE POLICY "Anyone can view active challenges"
ON challenges FOR SELECT
USING (status = 'active');

-- Only admins can create challenges (for MVP)
CREATE POLICY "Admins can insert challenges"
ON challenges FOR INSERT
WITH CHECK (auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'
));

-- Admins can update their own challenges
CREATE POLICY "Admins can update own challenges"
ON challenges FOR UPDATE
USING (created_by = auth.uid() OR auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'
));

-- ============================================
-- CHALLENGE PARTICIPANTS RLS POLICIES
-- ============================================

-- Users can view participants of challenges they're in
CREATE POLICY "View participants of joined challenges"
ON challenge_participants FOR SELECT
USING (
  user_id = auth.uid() OR
  challenge_id IN (
    SELECT challenge_id FROM challenge_participants WHERE user_id = auth.uid()
  )
);

-- Users can join challenges (insert their own participation)
CREATE POLICY "Users can join challenges"
ON challenge_participants FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own participation
CREATE POLICY "Users can update own participation"
ON challenge_participants FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own participation (leave challenge)
CREATE POLICY "Users can leave challenges"
ON challenge_participants FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- CHALLENGE COMPLETIONS RLS POLICIES
-- ============================================

-- Users can view their own completions
CREATE POLICY "Users can view own completions"
ON challenge_completions FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own completions
CREATE POLICY "Users can record own completions"
ON challenge_completions FOR INSERT
WITH CHECK (user_id = auth.uid());

-- ============================================
-- USER BADGES RLS POLICIES
-- ============================================

-- Everyone can view displayed badges on profiles
CREATE POLICY "Anyone can view displayed badges"
ON user_badges FOR SELECT
USING (is_displayed_on_profile = true);

-- Users can view all their own badges
CREATE POLICY "Users can view own badges"
ON user_badges FOR SELECT
USING (user_id = auth.uid());

-- System can insert badges (via trigger or function)
-- Users cannot manually insert badges
CREATE POLICY "System can insert badges"
ON user_badges FOR INSERT
WITH CHECK (false); -- Badges are only inserted via stored procedures

-- Users can update display settings of their badges
CREATE POLICY "Users can update own badge display"
ON user_badges FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND
  -- Only allow updating display settings, not badge data
  badge_type = (SELECT badge_type FROM user_badges WHERE id = user_badges.id) AND
  badge_emoji = (SELECT badge_emoji FROM user_badges WHERE id = user_badges.id)
);

-- ============================================
-- FORUM RLS POLICIES
-- ============================================

-- Participants can view forum threads for their challenges
CREATE POLICY "View forum threads for joined challenges"
ON challenge_forum_threads FOR SELECT
USING (
  challenge_id IN (
    SELECT challenge_id FROM challenge_participants
    WHERE user_id = auth.uid() AND status IN ('active', 'completed')
  )
);

-- Participants can create forum threads
CREATE POLICY "Participants can create forum threads"
ON challenge_forum_threads FOR INSERT
WITH CHECK (
  author_id = auth.uid() AND
  challenge_id IN (
    SELECT challenge_id FROM challenge_participants
    WHERE user_id = auth.uid() AND status IN ('active', 'completed')
  )
);

-- Authors can update their own threads
CREATE POLICY "Authors can update own threads"
ON challenge_forum_threads FOR UPDATE
USING (author_id = auth.uid());

-- Similar policies for forum replies
CREATE POLICY "View forum replies for joined challenges"
ON challenge_forum_replies FOR SELECT
USING (
  thread_id IN (
    SELECT id FROM challenge_forum_threads
    WHERE challenge_id IN (
      SELECT challenge_id FROM challenge_participants
      WHERE user_id = auth.uid() AND status IN ('active', 'completed')
    )
  )
);

CREATE POLICY "Participants can create forum replies"
ON challenge_forum_replies FOR INSERT
WITH CHECK (
  author_id = auth.uid() AND
  thread_id IN (
    SELECT id FROM challenge_forum_threads
    WHERE challenge_id IN (
      SELECT challenge_id FROM challenge_participants
      WHERE user_id = auth.uid() AND status IN ('active', 'completed')
    )
  )
);

CREATE POLICY "Authors can update own replies"
ON challenge_forum_replies FOR UPDATE
USING (author_id = auth.uid());

-- ============================================
-- STEP 11: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to automatically update personal_end_date when participant joins
CREATE OR REPLACE FUNCTION set_personal_end_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.personal_end_date IS NULL THEN
    NEW.personal_end_date := NEW.personal_start_date + (
      SELECT duration_days FROM challenges WHERE id = NEW.challenge_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_personal_end_date
BEFORE INSERT ON challenge_participants
FOR EACH ROW
EXECUTE FUNCTION set_personal_end_date();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_challenges_updated_at
BEFORE UPDATE ON challenges
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at
BEFORE UPDATE ON challenge_participants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_threads_updated_at
BEFORE UPDATE ON challenge_forum_threads
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_replies_updated_at
BEFORE UPDATE ON challenge_forum_replies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 12: INSERT SAMPLE GLOBAL CHALLENGE (OPTIONAL)
-- ============================================

-- Uncomment to insert a sample challenge for testing
/*
INSERT INTO challenges (
  name,
  description,
  emoji,
  type,
  scope,
  duration_days,
  success_threshold,
  predetermined_activities,
  badge_emoji,
  badge_name,
  has_forum,
  status
) VALUES (
  '30 Day Cold Shower Challenge',
  'Take a cold shower every day for 30 days to build mental toughness and improve health.',
  '❄️',
  'streak',
  'global',
  30,
  80,
  '[{
    "title": "Cold Shower",
    "emoji": "❄️",
    "frequency": "daily",
    "min_duration_minutes": 2,
    "description": "Take a cold shower for at least 2 minutes"
  }]'::jsonb,
  '❄️',
  'Ice Warrior',
  true,
  'active'
);
*/

-- ============================================
-- MIGRATION COMPLETE! ✅
-- ============================================

-- Next steps:
-- 1. Update src/services/supabase.challenges.service.ts
-- 2. Create TypeScript types for new schema
-- 3. Update Zustand store
-- 4. Build UI components

-- To check migration status:
SELECT
  'Migration completed successfully!' as status,
  COUNT(*) as new_challenge_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'challenges',
    'challenge_participants',
    'challenge_completions',
    'user_badges',
    'challenge_forum_threads',
    'challenge_forum_replies'
  );
