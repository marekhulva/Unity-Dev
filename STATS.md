# Consistency Statistics Documentation

## Consistency Formulas

### Per-Goal Consistency
**Formula: Total Completions for Goal / Total Expected for Goal**

Example:
- Goal created 30 days ago
- 5 actions linked to this goal
- Expected: 5 actions × 30 days = 150 total
- Actual completions: 75
- **Goal Consistency: 75/150 = 50%**

### Overall Consistency
**Formula: Total Completions (All Goals) / Total Expected (All Goals)**

Example:
- Goal A: 30 days old, 3 actions, 45 completions = 45/90 = 50%
- Goal B: 20 days old, 2 actions, 30 completions = 30/40 = 75%
- **Overall: (45+30)/(90+40) = 75/130 = 58%**

## Current Database Limitation

**THE PROBLEM**: The `actions` table only stores `completed_at` timestamp for the LAST completion, not a history of all completions.

When you complete an action:
1. It updates `completed_at` to NOW
2. Previous completion history is lost
3. We can't count how many times it was completed in the past

## Solution: Add Completion History Table

Run this SQL in Supabase SQL Editor:

```sql
-- Create a completion history table
CREATE TABLE action_completions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_action_completions_action_id ON action_completions(action_id);
CREATE INDEX idx_action_completions_user_id ON action_completions(user_id);
CREATE INDEX idx_action_completions_completed_at ON action_completions(completed_at);

-- Enable RLS
ALTER TABLE action_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage own completion history" ON action_completions
    FOR ALL USING (auth.uid() = user_id);
```

## Query to Calculate Per-Goal Consistency

```sql
-- Calculate consistency for each goal
WITH goal_stats AS (
    SELECT
        g.id as goal_id,
        g.title as goal_title,
        g.created_at,
        GREATEST(1, EXTRACT(EPOCH FROM (NOW() - g.created_at))/86400)::INT as days_since_creation,
        COUNT(DISTINCT a.id) as action_count
    FROM goals g
    LEFT JOIN actions a ON g.id = a.goal_id
    WHERE g.user_id = 'YOUR_USER_ID'
    GROUP BY g.id, g.title, g.created_at
),
completion_counts AS (
    SELECT
        a.goal_id,
        COUNT(ac.id) as total_completions
    FROM actions a
    LEFT JOIN action_completions ac ON a.id = ac.action_id
    WHERE a.user_id = 'YOUR_USER_ID'
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
```

## Query to Calculate Overall Consistency

```sql
-- Calculate overall consistency across all goals
WITH all_completions AS (
    SELECT
        g.id as goal_id,
        g.created_at,
        GREATEST(1, EXTRACT(EPOCH FROM (NOW() - g.created_at))/86400)::INT as days_since_creation,
        COUNT(DISTINCT a.id) as action_count,
        COUNT(ac.id) as completion_count
    FROM goals g
    LEFT JOIN actions a ON g.id = a.goal_id
    LEFT JOIN action_completions ac ON a.id = ac.action_id
    WHERE g.user_id = 'YOUR_USER_ID'
    GROUP BY g.id, g.created_at
)
SELECT
    SUM(action_count * days_since_creation) as total_expected_all_goals,
    SUM(completion_count) as total_completed_all_goals,
    ROUND(
        SUM(completion_count) * 100.0 /
        NULLIF(SUM(action_count * days_since_creation), 0),
        1
    ) as overall_consistency_percent
FROM all_completions;
```

## Implementation Notes

After creating the `action_completions` table:

1. **When completing an action**, insert a new row:
   ```sql
   INSERT INTO action_completions (action_id, user_id)
   VALUES ('ACTION_ID', 'USER_ID');
   ```

2. **Update your backend service** to insert into `action_completions` whenever an action is marked complete

3. **The Progress page** will then show accurate cumulative consistency percentages

## Why Current Percentages Are Wrong

Without the completion history table:
- Goal created 30 days ago with 5 actions
- Expected: 5 × 30 = 150 total completions
- But we only see TODAY's status (maybe 5 completions)
- Shows: 5/150 = 3.3% (wrong!)

With the completion history table:
- Can count ALL historical completions
- If you've completed 75 times over 30 days
- Shows: 75/150 = 50% (correct!)