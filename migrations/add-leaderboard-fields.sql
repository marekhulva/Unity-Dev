-- ============================================
-- Migration: Add Leaderboard Fields
-- Date: 2025-10-27
-- Description: Add ranking, percentile, and days_taken for leaderboards
-- ============================================

-- Add leaderboard tracking columns to challenge_participants
ALTER TABLE challenge_participants
ADD COLUMN IF NOT EXISTS rank INTEGER,
ADD COLUMN IF NOT EXISTS percentile DECIMAL,
ADD COLUMN IF NOT EXISTS days_taken INTEGER;

-- Add index for fast leaderboard queries (sort by completion % desc, then days_taken asc)
CREATE INDEX IF NOT EXISTS idx_challenge_leaderboard
ON challenge_participants(challenge_id, completion_percentage DESC, days_taken ASC);

-- Add index for user lookups
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user
ON challenge_participants(user_id, challenge_id);

-- Add comments for documentation
COMMENT ON COLUMN challenge_participants.rank IS 'User rank in the challenge leaderboard';
COMMENT ON COLUMN challenge_participants.percentile IS 'User percentile (top X%)';
COMMENT ON COLUMN challenge_participants.days_taken IS 'How many calendar days to complete (for ranking)';

-- Success message
SELECT '✅ Leaderboard fields added successfully!' AS status;
