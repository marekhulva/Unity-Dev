-- Add emoji and additional metadata fields to circles table
-- Run this in Supabase SQL Editor

-- Add emoji column with default blue circle
ALTER TABLE circles
ADD COLUMN IF NOT EXISTS emoji VARCHAR(10) DEFAULT '🔵';

-- Add description column
ALTER TABLE circles
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add category column
ALTER TABLE circles
ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Add privacy setting
ALTER TABLE circles
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Update any existing circles with default emoji if NULL
UPDATE circles
SET emoji = '🔵'
WHERE emoji IS NULL;

-- Verify the columns were added
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'circles'
AND column_name IN ('emoji', 'description', 'category', 'is_private');