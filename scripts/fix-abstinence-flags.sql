-- Fix: Ensure all 4 abstinence activities have is_abstinence: true in the live DB
-- Run in Supabase SQL Editor

-- Set is_abstinence on activities: Sleep (index 3), No Social (4), No Content (5), Compliance (6)
UPDATE challenges
SET predetermined_activities = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'id' IN ('detox-sleep', 'detox-no-social', 'detox-no-content', 'detox-compliance')
      THEN elem || '{"is_abstinence": true}'::jsonb
      ELSE elem - 'is_abstinence'
    END
  )
  FROM jsonb_array_elements(predetermined_activities) AS elem
)
WHERE name = '7 Day Mental Detox';

-- Also update the sleep title/description if not already done
UPDATE challenges
SET predetermined_activities = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'id' = 'detox-sleep'
      THEN jsonb_set(
        jsonb_set(elem, '{title}', '"In Bed by 10:30 PM"'),
        '{description}', '"Be in bed with lights off by 10:30 PM. No screens, no scrolling — just sleep."'
      )
      ELSE elem
    END
  )
  FROM jsonb_array_elements(predetermined_activities) AS elem
)
WHERE name = '7 Day Mental Detox';

-- Verify
SELECT
  elem->>'id' as activity_id,
  elem->>'title' as title,
  elem->>'is_abstinence' as is_abstinence
FROM challenges,
     jsonb_array_elements(predetermined_activities) AS elem
WHERE name = '7 Day Mental Detox';
