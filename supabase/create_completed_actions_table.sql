-- Create completed_actions table to persist action completions
CREATE TABLE IF NOT EXISTS completed_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_id UUID REFERENCES actions(id) ON DELETE CASCADE NOT NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  goal_title TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_private BOOLEAN DEFAULT false,
  streak INTEGER DEFAULT 0,
  type TEXT CHECK (type IN ('check', 'photo', 'audio', 'milestone', 'text')) DEFAULT 'check',
  media_url TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Add index for faster queries
  INDEX idx_completed_actions_user_id (user_id),
  INDEX idx_completed_actions_completed_at (completed_at),
  INDEX idx_completed_actions_action_id (action_id)
);

-- Enable RLS
ALTER TABLE completed_actions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own completed actions"
  ON completed_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completed actions"
  ON completed_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own completed actions"
  ON completed_actions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completed actions"
  ON completed_actions FOR DELETE
  USING (auth.uid() = user_id);

-- Function to get today's completed actions
CREATE OR REPLACE FUNCTION get_todays_completed_actions(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  action_id UUID,
  title TEXT,
  goal_title TEXT,
  completed_at TIMESTAMPTZ,
  is_private BOOLEAN,
  streak INTEGER,
  type TEXT,
  media_url TEXT,
  category TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ca.id,
    ca.action_id,
    ca.title,
    ca.goal_title,
    ca.completed_at,
    ca.is_private,
    ca.streak,
    ca.type,
    ca.media_url,
    ca.category
  FROM completed_actions ca
  WHERE ca.user_id = user_uuid
    AND DATE(ca.completed_at) = CURRENT_DATE
  ORDER BY ca.completed_at DESC;
END;
$$ LANGUAGE plpgsql;