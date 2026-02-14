-- Update "Sleep Goal" → "In Bed by 10:30 PM" (abstinence) in 7 Day Mental Detox
-- Run against production Supabase

UPDATE challenges
SET predetermined_activities = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'id' = 'detox-sleep' THEN
        jsonb_set(
          jsonb_set(
            jsonb_set(
              elem,
              '{title}', '"In Bed by 10:30 PM"'
            ),
            '{description}', '"Be in bed with lights off by 10:30 PM. No screens, no scrolling — just sleep."'
          ),
          '{is_abstinence}', 'true'
        )
      ELSE elem
    END
  )
  FROM jsonb_array_elements(predetermined_activities) elem
),
description = replace(
  replace(description, '😴 Sleep Goal (8+ hours)', '😴 In Bed by 10:30 PM'),
  '😴 Sleep Goal (8+ hours)', '😴 In Bed by 10:30 PM'
)
WHERE name = '7 Day Mental Detox';
