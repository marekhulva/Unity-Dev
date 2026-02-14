-- Mark abstinence activities in the Mental Detox challenge
-- Update the predetermined_activities JSON to add is_abstinence flag

UPDATE challenges
SET predetermined_activities = jsonb_set(
  jsonb_set(
    jsonb_set(
      predetermined_activities,
      '{4,is_abstinence}',  -- Index 4: "No Social Media"
      'true'::jsonb
    ),
    '{5,is_abstinence}',  -- Index 5: "No Long-Form Content"
    'true'::jsonb
  ),
  '{6,is_abstinence}',  -- Index 6: "Detox Compliance"
  'true'::jsonb
)
WHERE name = '7 Day Mental Detox';

-- Verify the update
SELECT
  name,
  jsonb_array_length(predetermined_activities) as activity_count,
  (predetermined_activities->4->>'title') as activity_4,
  (predetermined_activities->4->>'is_abstinence') as is_abstinence_4,
  (predetermined_activities->5->>'title') as activity_5,
  (predetermined_activities->5->>'is_abstinence') as is_abstinence_5,
  (predetermined_activities->6->>'title') as activity_6,
  (predetermined_activities->6->>'is_abstinence') as is_abstinence_6
FROM challenges
WHERE name = '7 Day Mental Detox';
