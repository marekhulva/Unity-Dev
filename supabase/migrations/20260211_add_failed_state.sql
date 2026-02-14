-- Migration: Add failed state tracking for actions
-- Created: 2026-02-11
-- Purpose: Track when actions are attempted but failed (e.g., abstinence violations)

-- Add failed column to actions table
ALTER TABLE actions
ADD COLUMN IF NOT EXISTS failed BOOLEAN DEFAULT FALSE;

-- Create index for failed actions queries
CREATE INDEX IF NOT EXISTS idx_actions_failed
ON actions(user_id, failed)
WHERE failed = TRUE;

-- Add failed tracking to action_completions history table
ALTER TABLE action_completions
ADD COLUMN IF NOT EXISTS failed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Create index for failed completions queries
CREATE INDEX IF NOT EXISTS idx_action_completions_failed
ON action_completions(user_id, failed)
WHERE failed = TRUE;

COMMENT ON COLUMN actions.failed IS 'True if action was attempted but user did not complete successfully (e.g., broke abstinence commitment)';
COMMENT ON COLUMN action_completions.failed IS 'True if this specific completion was a failure';
COMMENT ON COLUMN action_completions.failure_reason IS 'Optional reason why user failed (e.g., comment from abstinence modal)';
