-- MIGRATION SCRIPT: Populate action_completions with historical data
-- This creates initial completion records based on current completed_at timestamps

-- For JHJH's user (replace with actual user ID)
-- This assumes each completed_at represents ONE completion today
-- In reality, you might want to add more historical completions

-- Step 1: Insert today's completions (for actions that have completed_at)
INSERT INTO action_completions (action_id, user_id, completed_at)
SELECT
    id as action_id,
    user_id,
    completed_at
FROM actions
WHERE user_id = 'bcd3d06b-b74d-4b6b-8b53-5e4249828a2a'  -- JHJH's ID
    AND completed_at IS NOT NULL;

-- Step 2: Add some historical completions to simulate past consistency
-- This adds completions for the last 7 days at 50% rate
WITH historical_dates AS (
    SELECT generate_series(
        CURRENT_DATE - INTERVAL '7 days',
        CURRENT_DATE - INTERVAL '1 day',
        INTERVAL '1 day'
    )::date as completion_date
),
user_actions AS (
    SELECT id, user_id
    FROM actions
    WHERE user_id = 'bcd3d06b-b74d-4b6b-8b53-5e4249828a2a'
)
INSERT INTO action_completions (action_id, user_id, completed_at)
SELECT
    ua.id,
    ua.user_id,
    (hd.completion_date + TIME '10:00:00')::timestamptz
FROM user_actions ua
CROSS JOIN historical_dates hd
WHERE
    -- Add 50% of possible completions randomly
    random() < 0.5
    -- Don't duplicate if already exists
    AND NOT EXISTS (
        SELECT 1
        FROM action_completions ac
        WHERE ac.action_id = ua.id
        AND DATE(ac.completed_at) = hd.completion_date
    );

-- Step 3: Verify the migration
SELECT
    a.title as action_title,
    COUNT(ac.id) as completion_count,
    MIN(DATE(ac.completed_at)) as first_completion,
    MAX(DATE(ac.completed_at)) as last_completion
FROM actions a
LEFT JOIN action_completions ac ON a.id = ac.action_id
WHERE a.user_id = 'bcd3d06b-b74d-4b6b-8b53-5e4249828a2a'
GROUP BY a.id, a.title
ORDER BY a.title;

-- Step 4: Check the new consistency percentages
WITH goal_stats AS (
    SELECT
        g.id as goal_id,
        g.title as goal_title,
        g.created_at,
        GREATEST(1, EXTRACT(EPOCH FROM (NOW() - g.created_at))/86400)::INT as days_since_creation,
        COUNT(DISTINCT a.id) as action_count
    FROM goals g
    LEFT JOIN actions a ON g.id = a.goal_id
    WHERE g.user_id = 'bcd3d06b-b74d-4b6b-8b53-5e4249828a2a'
    GROUP BY g.id, g.title, g.created_at
),
completion_counts AS (
    SELECT
        a.goal_id,
        COUNT(ac.id) as total_completions
    FROM actions a
    LEFT JOIN action_completions ac ON a.id = ac.action_id
    WHERE a.user_id = 'bcd3d06b-b74d-4b6b-8b53-5e4249828a2a'
    GROUP BY a.goal_id
)
SELECT
    gs.goal_title,
    gs.action_count as actions_per_day,
    gs.days_since_creation as days_active,
    (gs.action_count * gs.days_since_creation) as total_expected,
    COALESCE(cc.total_completions, 0) as total_completed,
    ROUND(
        COALESCE(cc.total_completions, 0) * 100.0 /
        NULLIF(gs.action_count * gs.days_since_creation, 0),
        1
    ) as consistency_percent
FROM goal_stats gs
LEFT JOIN completion_counts cc ON gs.goal_id = cc.goal_id
ORDER BY gs.goal_title;