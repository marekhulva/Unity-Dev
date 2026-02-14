-- Helper function to insert badges (bypasses RLS)
CREATE OR REPLACE FUNCTION insert_badge(
  p_user_id UUID,
  p_challenge_id UUID,
  p_badge_type TEXT,
  p_badge_emoji TEXT,
  p_badge_name TEXT,
  p_completion_percentage NUMERIC DEFAULT NULL,
  p_days_taken INTEGER DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_badges (
    user_id,
    challenge_id,
    badge_type,
    badge_emoji,
    badge_name,
    completion_percentage,
    days_taken
  ) VALUES (
    p_user_id,
    p_challenge_id,
    p_badge_type,
    p_badge_emoji,
    p_badge_name,
    p_completion_percentage,
    p_days_taken
  )
  ON CONFLICT (user_id, challenge_id) DO NOTHING;
END;
$$;
