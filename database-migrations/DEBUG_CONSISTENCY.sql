-- DEBUG CONSISTENCY CALCULATIONS FOR JHJH
-- Run these queries in Supabase SQL Editor
-- Replace USER_ID with JHJH's actual user ID

-- ============================================
-- STEP 1: GET JHJH's USER ID
-- ============================================
SELECT id, email, raw_user_meta_data->>'username' as username
FROM auth.users
WHERE email LIKE '%jhjh%'
   OR raw_user_meta_data->>'username' ILIKE '%jhjh%';

-- Use the ID from above in the queries below
-- Example: 'bcd3d06b-b74d-4b6b-8b53-5e4249828a2a'

-- ============================================
-- STEP 2: UNDERSTAND THE DATA STRUCTURE
-- ============================================

-- 2a. Show ALL actions for JHJH with their goal relationships
SELECT
    a.id as action_id,
    a.title as action_title,
    a.goal_id,
    g.title as goal_title,
    a.completed,
    a.completed_at,
    DATE(a.completed_at) as completion_date,
    a.created_at,
    CASE
        WHEN a.completed_at >= CURRENT_DATE THEN 'TODAY'
        WHEN a.completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN 'THIS WEEK'
        ELSE 'OLDER'
    END as period
FROM actions a
LEFT JOIN goals g ON a.goal_id = g.id
WHERE a.user_id = 'bcd3d06b-b74d-4b6b-8b53-5e4249828a2a'  -- JHJH's ID
ORDER BY a.created_at DESC;

-- 2b. Count actions WITH and WITHOUT goal links
SELECT
    COUNT(*) as total_actions,
    COUNT(goal_id) as actions_with_goal_id,
    COUNT(*) - COUNT(goal_id) as actions_without_goal_id
FROM actions
WHERE user_id = 'bcd3d06b-b74d-4b6b-8b53-5e4249828a2a';  -- JHJH's ID

-- ============================================
-- STEP 3: CHECK GOAL CONSISTENCY CALCULATION
-- ============================================

-- 3a. Show each goal and its linked actions
SELECT
    g.id as goal_id,
    g.title as goal_title,
    g.color,
    COUNT(a.id) as total_actions_linked,
    STRING_AGG(a.title, ', ') as linked_action_titles
FROM goals g
LEFT JOIN actions a ON g.id = a.goal_id
WHERE g.user_id = 'bcd3d06b-b74d-4b6b-8b53-5e4249828a2a'  -- JHJH's ID
GROUP BY g.id, g.title, g.color
ORDER BY g.created_at;

-- 3b. Calculate ACTUAL consistency per goal (last 7 days)
WITH goal_daily_completions AS (
    SELECT
        g.id as goal_id,
        g.title as goal_title,
        DATE(a.completed_at) as completion_date,
        COUNT(a.id) as actions_completed_that_day
    FROM goals g
    LEFT JOIN actions a ON g.id = a.goal_id
    WHERE g.user_id = 'bcd3d06b-b74d-4b6b-8b53-5e4249828a2a'  -- JHJH's ID
        AND a.completed_at >= CURRENT_DATE - INTERVAL '7 days'
        AND a.completed_at IS NOT NULL
    GROUP BY g.id, g.title, DATE(a.completed_at)
)
SELECT
    goal_id,
    goal_title,
    COUNT(DISTINCT completion_date) as days_with_completions,
    7 as total_days_in_period,
    ROUND(COUNT(DISTINCT completion_date) * 100.0 / 7, 0) as consistency_percent
FROM goal_daily_completions
GROUP BY goal_id, goal_title
ORDER BY goal_title;

-- ============================================
-- STEP 4: DEBUG THE 14% ISSUE
-- ============================================

-- 4a. Show completion pattern for last 7 days
SELECT
    generate_series::date as check_date,
    COUNT(a.id) as total_actions_that_day,
    COUNT(CASE WHEN DATE(a.completed_at) = generate_series::date THEN 1 END) as completed_that_day,
    STRING_AGG(
        CASE WHEN DATE(a.completed_at) = generate_series::date THEN a.title END,
        ', '
    ) as completed_action_titles
FROM generate_series(
    CURRENT_DATE - INTERVAL '6 days',
    CURRENT_DATE,
    INTERVAL '1 day'
) AS generate_series
CROSS JOIN actions a
WHERE a.user_id = 'bcd3d06b-b74d-4b6b-8b53-5e4249828a2a'  -- JHJH's ID
GROUP BY generate_series::date
ORDER BY generate_series::date DESC;

-- 4b. Show what the app is actually calculating
-- This mimics the getGoalConsistency function
WITH calculation AS (
    SELECT
        g.id as goal_id,
        g.title as goal_title,
        COUNT(DISTINCT a.id) as actions_linked_to_goal,
        COUNT(DISTINCT a.id) * 7 as expected_completions_7_days,
        COUNT(
            CASE
                WHEN a.completed_at >= CURRENT_DATE - INTERVAL '7 days'
                THEN 1
            END
        ) as actual_completions_7_days
    FROM goals g
    LEFT JOIN actions a ON g.id = a.goal_id
    WHERE g.user_id = 'bcd3d06b-b74d-4b6b-8b53-5e4249828a2a'  -- JHJH's ID
    GROUP BY g.id, g.title
)
SELECT
    goal_title,
    actions_linked_to_goal,
    expected_completions_7_days,
    actual_completions_7_days,
    CASE
        WHEN expected_completions_7_days > 0
        THEN ROUND(actual_completions_7_days * 100.0 / expected_completions_7_days, 0)
        ELSE 0
    END as calculated_consistency_percent,
    CASE
        WHEN actual_completions_7_days = 1 AND expected_completions_7_days = 7
        THEN '14% is correct: 1 completion out of 7 expected'
        ELSE 'Check the numbers'
    END as explanation
FROM calculation;

-- ============================================
-- STEP 5: OVERALL CONSISTENCY CHECK
-- ============================================

-- What the app calculates for overall consistency
SELECT
    COUNT(DISTINCT a.id) as total_unique_actions,
    COUNT(DISTINCT a.id) * 7 as expected_completions_7_days,
    COUNT(
        CASE
            WHEN a.completed_at >= CURRENT_DATE - INTERVAL '7 days'
            THEN 1
        END
    ) as actual_completions_7_days,
    ROUND(
        COUNT(
            CASE
                WHEN a.completed_at >= CURRENT_DATE - INTERVAL '7 days'
                THEN 1
            END
        ) * 100.0 / (COUNT(DISTINCT a.id) * 7),
        0
    ) as overall_consistency_percent
FROM actions a
WHERE a.user_id = 'bcd3d06b-b74d-4b6b-8b53-5e4249828a2a';  -- JHJH's ID

-- ============================================
-- STEP 6: WHAT SHOULD WE SEE IN THE UI?
-- ============================================

-- Summary view of what Progress page should show
SELECT
    'Overall' as metric_type,
    (
        SELECT ROUND(
            COUNT(CASE WHEN completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) * 100.0
            / NULLIF(COUNT(DISTINCT id) * 7, 0),
            0
        )
        FROM actions
        WHERE user_id = 'bcd3d06b-b74d-4b6b-8b53-5e4249828a2a'
    ) as consistency_percent
UNION ALL
SELECT
    'Goal: ' || g.title as metric_type,
    ROUND(
        COUNT(CASE WHEN a.completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) * 100.0
        / NULLIF(COUNT(DISTINCT a.id) * 7, 0),
        0
    ) as consistency_percent
FROM goals g
LEFT JOIN actions a ON g.id = a.goal_id
WHERE g.user_id = 'bcd3d06b-b74d-4b6b-8b53-5e4249828a2a'
GROUP BY g.id, g.title;