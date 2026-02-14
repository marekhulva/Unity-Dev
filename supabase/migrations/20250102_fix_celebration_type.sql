-- First, drop the existing check constraint on posts.type
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_type_check;

-- Add the new check constraint that includes 'celebration' as a valid type
ALTER TABLE posts ADD CONSTRAINT posts_type_check 
CHECK (type IN ('checkin', 'status', 'photo', 'audio', 'goal', 'activity', 'milestone', 'progress', 'celebration'));

-- Ensure the celebration fields exist (in case the previous migration didn't run)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS is_celebration BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS celebration_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create an index for celebration posts for faster querying (if not exists)
CREATE INDEX IF NOT EXISTS idx_posts_celebration ON posts(is_celebration) WHERE is_celebration = true;

-- Add comments for documentation
COMMENT ON COLUMN posts.is_celebration IS 'Flag to indicate if this is an automatic celebration post';
COMMENT ON COLUMN posts.celebration_type IS 'Type of celebration (daily_100, weekly_100, milestone, etc.)';
COMMENT ON COLUMN posts.metadata IS 'Additional metadata for the celebration (userName, completionTime, actionCount, etc.)';