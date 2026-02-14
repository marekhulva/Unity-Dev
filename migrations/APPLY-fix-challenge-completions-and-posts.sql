-- ============================================
-- Migration: Fix Challenge Completions and Posts Foreign Key
-- Date: 2025-10-27
-- Description:
--   1. Add challenge_activity_id and participant_id columns to challenge_completions
--   2. Fix posts table foreign key to reference new challenges table
-- ============================================

-- ============================================
-- PART 1: Update challenge_completions table
-- ============================================

-- Add challenge_activity_id column to store string IDs like "cold-shower-1"
ALTER TABLE challenge_completions
ADD COLUMN IF NOT EXISTS challenge_activity_id TEXT;

-- Add participant_id to reference challenge_participants table
ALTER TABLE challenge_completions
ADD COLUMN IF NOT EXISTS participant_id UUID REFERENCES challenge_participants(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_challenge_completions_participant_activity
ON challenge_completions(participant_id, challenge_activity_id, completion_date);

-- Add comments for documentation
COMMENT ON COLUMN challenge_completions.challenge_activity_id IS 'String ID of the challenge activity from predetermined_activities (e.g., "cold-shower-1")';
COMMENT ON COLUMN challenge_completions.participant_id IS 'Reference to the challenge_participants table';

-- ============================================
-- PART 2: Fix posts table foreign key
-- ============================================

-- Drop the old foreign key constraint referencing archived table
ALTER TABLE posts
DROP CONSTRAINT IF EXISTS posts_challenge_id_fkey;

-- Add new foreign key constraint referencing the new challenges table
ALTER TABLE posts
ADD CONSTRAINT posts_challenge_id_fkey
FOREIGN KEY (challenge_id)
REFERENCES challenges(id)
ON DELETE SET NULL;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify challenge_completions structure
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'challenge_completions'
ORDER BY ordinal_position;

-- Verify posts foreign key
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'posts'
  AND tc.constraint_name = 'posts_challenge_id_fkey';

-- Success message
SELECT '✅ Migration completed successfully!' AS status;
