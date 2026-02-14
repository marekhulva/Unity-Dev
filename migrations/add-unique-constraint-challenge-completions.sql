-- Add unique constraint to prevent duplicate challenge activity completions
-- This prevents race conditions where double-tapping can create duplicate completions
-- Issue #5 from mvpfix.md: Double-tap creates duplicate completions

-- First, check for and remove any existing duplicates
-- Keep only the earliest completion for each participant + activity + day
WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY participant_id, challenge_activity_id, completion_date
      ORDER BY completed_at ASC
    ) as rn
  FROM challenge_completions
  WHERE participant_id IS NOT NULL
    AND challenge_activity_id IS NOT NULL
)
DELETE FROM challenge_completions
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Add the unique constraint to prevent future duplicates
ALTER TABLE challenge_completions
ADD CONSTRAINT unique_participant_activity_date
UNIQUE (participant_id, challenge_activity_id, completion_date);

-- Comment for documentation
COMMENT ON CONSTRAINT unique_participant_activity_date ON challenge_completions IS
'Prevents duplicate completions: one completion per participant + activity + day';

-- Verify the constraint was added
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'challenge_completions'::regclass
  AND conname = 'unique_participant_activity_date';
