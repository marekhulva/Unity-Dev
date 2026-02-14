-- Merge duplicate Living Progress Cards for a user on a specific date
-- INSTRUCTIONS:
-- 1. First run find-duplicate-cards.sql to identify duplicates
-- 2. Replace USER_ID_HERE with the actual user_id
-- 3. Replace '2026-02-12' with the correct date if different
-- 4. Run this in Supabase SQL Editor

-- Step 1: Find the duplicate cards for a specific user
WITH user_cards AS (
  SELECT
    id,
    user_id,
    challenge_id,
    completed_actions,
    actions_today,
    created_at,
    updated_at
  FROM posts
  WHERE user_id = 'USER_ID_HERE'  -- ← REPLACE THIS
    AND progress_date = '2026-02-12'
    AND is_daily_progress = true
  ORDER BY created_at ASC
),
-- Step 2: Aggregate all completed actions from all duplicate cards
merged_data AS (
  SELECT
    user_id,
    challenge_id,
    -- Merge all completed_actions arrays
    (
      SELECT json_agg(DISTINCT action)
      FROM (
        SELECT jsonb_array_elements(completed_actions::jsonb) AS action
        FROM user_cards
      ) actions
    ) AS merged_actions,
    -- Sum total actions_today
    SUM(actions_today) AS total_actions,
    -- Keep earliest created_at
    MIN(created_at) AS earliest_created,
    -- Keep latest updated_at
    MAX(updated_at) AS latest_updated,
    -- Keep the first card ID (we'll update this one)
    (SELECT id FROM user_cards ORDER BY created_at ASC LIMIT 1) AS keep_id,
    -- Get IDs of cards to delete
    array_agg(id ORDER BY created_at DESC) FILTER (WHERE id != (SELECT id FROM user_cards ORDER BY created_at ASC LIMIT 1)) AS delete_ids
  FROM user_cards
  GROUP BY user_id, challenge_id
)
-- Step 3: Show what will be merged (REVIEW THIS OUTPUT FIRST!)
SELECT
  'MERGE PREVIEW' AS action,
  keep_id AS "Card to Keep",
  delete_ids AS "Cards to Delete",
  merged_actions AS "Merged Actions",
  total_actions AS "Total Count"
FROM merged_data;

-- Step 4: AFTER REVIEWING, uncomment below to actually merge:
/*
-- Update the card we're keeping with merged data
UPDATE posts
SET
  completed_actions = (SELECT merged_actions FROM merged_data),
  actions_today = (SELECT total_actions FROM merged_data),
  updated_at = NOW()
WHERE id = (SELECT keep_id FROM merged_data);

-- Delete the duplicate cards
DELETE FROM posts
WHERE id = ANY((SELECT delete_ids FROM merged_data));

-- Show result
SELECT 'MERGE COMPLETE' AS status, * FROM posts
WHERE id = (SELECT keep_id FROM merged_data);
*/
