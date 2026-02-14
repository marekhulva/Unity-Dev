-- Create a function to update participant stats after each completion
CREATE OR REPLACE FUNCTION update_participant_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_total_completions INT;
  v_days_participated INT;
  v_total_days INT;
  v_consistency DECIMAL(5,2);
  v_current_streak INT;
  v_joined_date DATE;
BEGIN
  -- Get participant's join date
  SELECT DATE(joined_at) INTO v_joined_date
  FROM challenge_participants
  WHERE id = NEW.participant_id;
  
  -- Calculate total completions for this participant
  SELECT COUNT(DISTINCT completion_date) INTO v_total_completions
  FROM challenge_completions
  WHERE participant_id = NEW.participant_id;
  
  -- Calculate days since joined
  v_total_days := GREATEST(1, CURRENT_DATE - v_joined_date + 1);
  
  -- Calculate consistency percentage
  v_consistency := (v_total_completions::DECIMAL / v_total_days) * 100;
  
  -- Calculate current streak (simplified - counts consecutive days ending today)
  WITH streak_data AS (
    SELECT completion_date,
           completion_date - ROW_NUMBER() OVER (ORDER BY completion_date)::INT AS streak_group
    FROM (
      SELECT DISTINCT completion_date
      FROM challenge_completions
      WHERE participant_id = NEW.participant_id
      ORDER BY completion_date DESC
    ) AS dates
  )
  SELECT COUNT(*) INTO v_current_streak
  FROM streak_data
  WHERE streak_group = (
    SELECT streak_group 
    FROM streak_data 
    WHERE completion_date = CURRENT_DATE
    LIMIT 1
  );
  
  -- If no streak today, set to 0
  IF v_current_streak IS NULL THEN
    v_current_streak := 0;
  END IF;
  
  -- Update participant stats
  UPDATE challenge_participants
  SET 
    total_completions = v_total_completions,
    consistency_percentage = v_consistency,
    current_streak = v_current_streak
  WHERE id = NEW.participant_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update stats after each completion
DROP TRIGGER IF EXISTS update_stats_after_completion ON challenge_completions;
CREATE TRIGGER update_stats_after_completion
AFTER INSERT ON challenge_completions
FOR EACH ROW
EXECUTE FUNCTION update_participant_stats();

-- Test: Update stats for all existing participants
UPDATE challenge_participants cp
SET 
  total_completions = (
    SELECT COUNT(DISTINCT completion_date)
    FROM challenge_completions cc
    WHERE cc.participant_id = cp.id
  ),
  consistency_percentage = CASE 
    WHEN CURRENT_DATE - DATE(cp.joined_at) + 1 > 0 THEN
      ((SELECT COUNT(DISTINCT completion_date) FROM challenge_completions WHERE participant_id = cp.id)::DECIMAL / 
       (CURRENT_DATE - DATE(cp.joined_at) + 1)) * 100
    ELSE 0
  END;

-- Check the updated stats
SELECT 
  p.email,
  cp.total_completions,
  cp.consistency_percentage,
  cp.current_streak,
  cp.joined_at
FROM challenge_participants cp
JOIN profiles p ON p.id = cp.user_id
WHERE p.email = 'eeeee@eeee.com';