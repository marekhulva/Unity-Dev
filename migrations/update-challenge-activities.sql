-- Update Cold Shower Challenge with its activity
UPDATE challenges
SET predetermined_activities = '[{"id":"cold-shower-1","title":"Cold Shower","emoji":"❄️","frequency":"daily"}]'::jsonb
WHERE name = 'Cold Shower Challenge';

-- Verify the update
SELECT
  name,
  predetermined_activities,
  jsonb_array_length(predetermined_activities) as activity_count
FROM challenges
WHERE name = 'Cold Shower Challenge';
