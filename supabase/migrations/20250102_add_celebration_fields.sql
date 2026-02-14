-- Add celebration fields to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS is_celebration BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS celebration_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create an index for celebration posts for faster querying
CREATE INDEX IF NOT EXISTS idx_posts_celebration ON posts(is_celebration) WHERE is_celebration = true;

-- Add comments for documentation
COMMENT ON COLUMN posts.is_celebration IS 'Flag to indicate if this is an automatic celebration post';
COMMENT ON COLUMN posts.celebration_type IS 'Type of celebration (daily_100, weekly_100, milestone, etc.)';
COMMENT ON COLUMN posts.metadata IS 'Additional metadata for the celebration (userName, completionTime, actionCount, etc.)';