-- Add type field to goals table to distinguish between goals and routines
ALTER TABLE goals
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'goal' CHECK (type IN ('goal', 'routine'));

-- Make deadline nullable for routines
ALTER TABLE goals
ALTER COLUMN deadline DROP NOT NULL;

-- Make metric nullable for routines (they might not need metrics)
ALTER TABLE goals
ALTER COLUMN metric DROP NOT NULL;

-- Update existing records: if deadline is null, mark as routine
UPDATE goals
SET type = 'routine'
WHERE deadline IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN goals.type IS 'Distinguishes between goals (with deadlines) and routines (ongoing habits)';