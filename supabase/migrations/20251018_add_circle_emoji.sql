-- Add emoji and additional fields to circles table
-- Date: 2025-10-18
-- Purpose: Enable circle customization with emojis, descriptions, and privacy settings

-- Add emoji field (default to blue circle)
ALTER TABLE circles
ADD COLUMN IF NOT EXISTS emoji VARCHAR(10) DEFAULT '🔵';

-- Add description field
ALTER TABLE circles
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add category field for circle classification
ALTER TABLE circles
ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Add privacy setting
ALTER TABLE circles
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Add member limit
ALTER TABLE circles
ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 50;

-- Update existing circles with default emojis based on names (optional)
UPDATE circles
SET emoji = CASE
  WHEN LOWER(name) LIKE '%basketball%' OR LOWER(name) LIKE '%bball%' OR LOWER(name) LIKE '%hoops%' THEN '🏀'
  WHEN LOWER(name) LIKE '%wellness%' OR LOWER(name) LIKE '%yoga%' OR LOWER(name) LIKE '%meditation%' THEN '🧘'
  WHEN LOWER(name) LIKE '%fitness%' OR LOWER(name) LIKE '%gym%' OR LOWER(name) LIKE '%workout%' THEN '💪'
  WHEN LOWER(name) LIKE '%book%' OR LOWER(name) LIKE '%reading%' OR LOWER(name) LIKE '%study%' THEN '📚'
  WHEN LOWER(name) LIKE '%startup%' OR LOWER(name) LIKE '%business%' OR LOWER(name) LIKE '%work%' THEN '💼'
  WHEN LOWER(name) LIKE '%gaming%' OR LOWER(name) LIKE '%game%' THEN '🎮'
  WHEN LOWER(name) LIKE '%music%' OR LOWER(name) LIKE '%band%' THEN '🎸'
  WHEN LOWER(name) LIKE '%art%' OR LOWER(name) LIKE '%creative%' THEN '🎨'
  WHEN LOWER(name) LIKE '%food%' OR LOWER(name) LIKE '%cooking%' THEN '🍔'
  WHEN LOWER(name) LIKE '%test%' THEN '🧪'
  ELSE '🔵'
END
WHERE emoji IS NULL OR emoji = '🔵';

-- Add comment for documentation
COMMENT ON COLUMN circles.emoji IS 'Unicode emoji to represent the circle visually';
COMMENT ON COLUMN circles.description IS 'Optional description of the circle purpose and guidelines';
COMMENT ON COLUMN circles.category IS 'Category classification for discovery (fitness, work, social, etc)';
COMMENT ON COLUMN circles.is_private IS 'Whether the circle requires approval to join';
COMMENT ON COLUMN circles.max_members IS 'Maximum number of members allowed in the circle';