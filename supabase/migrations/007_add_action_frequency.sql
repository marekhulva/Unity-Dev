-- Add frequency and scheduled_days fields to actions table for routine scheduling
ALTER TABLE actions
ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT 'daily' CHECK (
  frequency IN ('daily', 'every_other_day', 'three_per_week', 'weekly', 'weekdays', 'weekends', 'monthly')
),
ADD COLUMN IF NOT EXISTS scheduled_days TEXT[],
ADD COLUMN IF NOT EXISTS duration INTEGER; -- Duration in minutes

-- Add comment for clarity
COMMENT ON COLUMN actions.frequency IS 'How often the action should appear';
COMMENT ON COLUMN actions.scheduled_days IS 'Specific days for weekly and three_per_week frequencies (e.g., [monday, wednesday, friday])';
COMMENT ON COLUMN actions.duration IS 'Duration of the action in minutes';