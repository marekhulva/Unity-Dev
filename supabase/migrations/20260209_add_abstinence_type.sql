-- Add abstinence action support
-- Abstinence actions are goals like "No Social Media", "No Alcohol"
-- where user is avoiding something rather than doing something

-- Add is_abstinence column to actions table
ALTER TABLE actions
ADD COLUMN is_abstinence BOOLEAN DEFAULT FALSE;

-- Add comment to clarify time field is optional for abstinence actions
COMMENT ON COLUMN actions.time IS 'Scheduled time for action. Optional for abstinence actions (all-day commitments).';

-- Add index for querying abstinence actions
CREATE INDEX idx_actions_abstinence ON actions(user_id, is_abstinence) WHERE is_abstinence = true;
