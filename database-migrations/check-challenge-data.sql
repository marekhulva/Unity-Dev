-- Check what's in the Cold Shower Challenge
SELECT 
  id,
  name,
  predetermined_activities,
  jsonb_typeof(predetermined_activities) as json_type,
  jsonb_array_length(predetermined_activities) as activity_count
FROM challenges
WHERE name = 'Cold Shower Challenge';
