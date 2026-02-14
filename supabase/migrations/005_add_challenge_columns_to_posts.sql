-- Add challenge-specific columns to posts table
-- These columns store challenge metadata for challenge-related posts

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS is_challenge BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS challenge_name TEXT,
ADD COLUMN IF NOT EXISTS challenge_id UUID REFERENCES challenges(id),
ADD COLUMN IF NOT EXISTS challenge_progress TEXT,
ADD COLUMN IF NOT EXISTS leaderboard_position INTEGER,
ADD COLUMN IF NOT EXISTS total_participants INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN posts.is_challenge IS 'Flag indicating if this post is from a challenge activity';
COMMENT ON COLUMN posts.challenge_name IS 'Name of the challenge (e.g., Jing Challenge)';
COMMENT ON COLUMN posts.challenge_id IS 'Reference to the challenge';
COMMENT ON COLUMN posts.challenge_progress IS 'Progress text (e.g., 3/3 daily complete)';
COMMENT ON COLUMN posts.leaderboard_position IS 'User position in challenge leaderboard at time of post';
COMMENT ON COLUMN posts.total_participants IS 'Total number of participants in the challenge';

-- Create index for faster challenge post queries
CREATE INDEX IF NOT EXISTS idx_posts_challenge ON posts(challenge_id) WHERE is_challenge = true;