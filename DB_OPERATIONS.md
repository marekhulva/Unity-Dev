# Unity-Dev Database Operations Playbook

> Common database operations with ready-to-use SQL. Replace UUIDs with actual values.
> Reference: `DB_SCHEMA.md` for full schema.

---

## User Management

### Remove user from a circle
```sql
-- 1. Remove from circle_members
DELETE FROM circle_members WHERE circle_id = '<CIRCLE_ID>' AND user_id = '<USER_ID>';

-- 2. Clear legacy circle_id on profile
UPDATE profiles SET circle_id = NULL WHERE id = '<USER_ID>' AND circle_id = '<CIRCLE_ID>';

-- 3. Update denormalized member count
UPDATE circles SET member_count = (
  SELECT COUNT(*) FROM circle_members WHERE circle_id = '<CIRCLE_ID>'
) WHERE id = '<CIRCLE_ID>';
```

### Remove user from a challenge
```sql
-- 1. Delete their completions first (FK dependency)
DELETE FROM challenge_completions WHERE user_id = '<USER_ID>' AND challenge_id = '<CHALLENGE_ID>';

-- 2. Delete their activity schedules
DELETE FROM challenge_activity_schedules WHERE user_id = '<USER_ID>' AND challenge_id = '<CHALLENGE_ID>';

-- 3. Delete their participation
DELETE FROM challenge_participants WHERE user_id = '<USER_ID>' AND challenge_id = '<CHALLENGE_ID>';
```

### Remove user from circle AND challenge
```sql
-- Run both sections above, plus clean up any posts
DELETE FROM post_circles WHERE post_id IN (
  SELECT id FROM posts WHERE user_id = '<USER_ID>' AND challenge_id = '<CHALLENGE_ID>'
) AND circle_id = '<CIRCLE_ID>';
```

### Find a user
```sql
-- By name (username is often NULL, use name instead)
SELECT id, name, username, email FROM profiles WHERE name ILIKE '%<NAME>%';

-- By email
SELECT id, name, username, email FROM profiles WHERE email = '<EMAIL>';

-- List all members of a circle
SELECT p.name, p.id, cm.role FROM circle_members cm
JOIN profiles p ON p.id = cm.user_id WHERE cm.circle_id = '<CIRCLE_ID>';
```

---

## Challenge Operations

### Create a circle challenge
```sql
-- No frontend changes needed — the app reads challenges dynamically from the database.
-- Users in the circle will see the challenge and can join themselves.
INSERT INTO challenges (
  id, name, description, emoji, type, scope, circle_id, duration_days,
  success_threshold, predetermined_activities, badge_emoji, badge_name,
  has_forum, status, created_by
)
VALUES (
  gen_random_uuid(),
  '<CHALLENGE_NAME>',
  '<DESCRIPTION>',
  '<EMOJI>',
  'streak',
  'circle',
  '<CIRCLE_ID>',
  <DURATION_DAYS>,
  75,
  '[
    {
      "id": "<challenge-prefix>-activity-name",
      "title": "Activity Title",
      "emoji": "🔥",
      "frequency": "daily",
      "is_abstinence": true,
      "description": "What the user needs to do/avoid."
    },
    {
      "id": "<challenge-prefix>-timed-activity",
      "title": "Timed Activity",
      "emoji": "⏱️",
      "frequency": "daily",
      "min_duration_minutes": 20,
      "description": "Timed activity description."
    }
  ]'::jsonb,
  '<BADGE_EMOJI>',
  '<BADGE_NAME>',
  true,
  'active',
  '<CREATOR_USER_ID>'
)
RETURNING id, name, circle_id, duration_days, status;
```

### Create a global challenge
```sql
-- Global challenges are visible to ALL users (not tied to any circle).
-- They show up in the Challenges tab under "Global Challenges".
-- Same INSERT as circle challenges but scope='global' and NO circle_id.
INSERT INTO challenges (
  id, name, description, emoji, type, scope, duration_days,
  success_threshold, predetermined_activities, badge_emoji, badge_name,
  has_forum, status, created_by
)
VALUES (
  gen_random_uuid(),
  '<CHALLENGE_NAME>',
  '<DESCRIPTION>',
  '<EMOJI>',
  'streak',
  'global',
  <DURATION_DAYS>,
  75,
  '[
    {
      "id": "<challenge-prefix>-activity-name",
      "title": "Activity Title",
      "emoji": "🔥",
      "frequency": "daily",
      "is_abstinence": true,
      "description": "What the user needs to do/avoid."
    }
  ]'::jsonb,
  '<BADGE_EMOJI>',
  '<BADGE_NAME>',
  true,
  'active',
  '<CREATOR_USER_ID>'
)
RETURNING id, name, scope, duration_days, status;
```

**Global vs Circle challenges:**
- **Circle**: `scope = 'circle'`, requires `circle_id` — only circle members see it
- **Global**: `scope = 'global'`, NO `circle_id` — all users see it in Challenges tab

**Activity types:**
- **Abstinence** (Don't do X): Set `"is_abstinence": true`, no duration field
- **Timed** (Do X for Y min): Set `"min_duration_minutes": <MINUTES>`, no abstinence field
- **Simple** (Just do it): No abstinence or duration fields needed
- **Day-specific**: Add `"start_day"` and `"end_day"` to limit which days the activity appears (e.g., Brain Dump on Day 1 only)

**Success threshold**: 75 means user needs 75% of total checkmarks to pass. Total = activities_per_day × duration_days.

### Existing Challenges Reference

#### 7 Day Mental Detox (Circle: JING Path)
- **ID**: `6cbb28cf-f679-439a-8222-1a073bae3647`
- **Circle**: `d73be526-5cef-45bb-8121-065bb810ac2f` (JING Path)
- **Duration**: 7 days, 6 activities/day = 42 total checkmarks
- **Activities**: Brain Dump (Day 1 only), Freewriting (Days 2-7), Exercise, In Bed by 10:30 PM, No Social Media, No Long-Form Content, Compliance

#### 30 Day Dopamine Reset (Circle: SF)
- **Circle**: `750236fe-3ff0-4d9f-8b5b-74b29e98735d` (SF)
- **Duration**: 30 days, 6 activities/day = 180 total checkmarks
- **Activities**: No Social Media, No TV Shows, 20 min Meditation (timed), Cold Shower, No Alcohol, No Drugs

#### Andrew Huberman Testosterone Optimization (Global)
- **Scope**: Global (no circle, visible to all users)
- **Duration**: 56 days (8 weeks), 5 activities/day = 280 total checkmarks
- **Activities**: Morning Sunlight, Cold Shower, No Screens Before Bed, In Bed Before 10 PM, No Alcohol

### Find a challenge
```sql
SELECT id, name, status, duration_days, circle_id FROM challenges WHERE name ILIKE '%<NAME>%';
```

### Get leaderboard for a challenge
```sql
SELECT p.name, cp.completion_percentage, cp.completed_days, cp.current_streak, cp.rank, cp.status
FROM challenge_participants cp
JOIN profiles p ON p.id = cp.user_id
WHERE cp.challenge_id = '<CHALLENGE_ID>' AND cp.status != 'left'
ORDER BY cp.completion_percentage DESC;
```

### Get participant info
```sql
SELECT id as participant_id, user_id, personal_start_date, status, completion_percentage
FROM challenge_participants
WHERE challenge_id = '<CHALLENGE_ID>' AND user_id = '<USER_ID>';
```

### View completions for a user in a challenge
```sql
SELECT completion_date, challenge_activity_id, completed_at
FROM challenge_completions
WHERE user_id = '<USER_ID>' AND challenge_id = '<CHALLENGE_ID>'
ORDER BY completion_date, challenge_activity_id;
```

### Count completions per day for a user
```sql
SELECT completion_date, COUNT(*) as completions
FROM challenge_completions
WHERE user_id = '<USER_ID>' AND challenge_id = '<CHALLENGE_ID>'
GROUP BY completion_date ORDER BY completion_date;
```

### Insert challenge completions (template)
```sql
-- First get participant_id and start date:
SELECT id as participant_id, personal_start_date FROM challenge_participants
WHERE user_id = '<USER_ID>' AND challenge_id = '<CHALLENGE_ID>';

-- Then insert (one row per activity per day):
INSERT INTO challenge_completions (id, user_id, challenge_id, participant_id, challenge_activity_id, completion_date, completed_at, created_at)
VALUES (gen_random_uuid(), '<USER_ID>', '<CHALLENGE_ID>', '<PARTICIPANT_ID>', '<ACTIVITY_ID>', '<DATE>', '<DATE> 18:00:00+00', '<DATE> 18:00:00+00');
```

### 7 Day Mental Detox - Activity Schedule
| Activity ID | Title | Days |
|---|---|---|
| detox-brain-dump | Brain Dump | Day 1 only |
| detox-freewrite | Freewriting | Days 2-7 |
| detox-exercise | Exercise | Days 1-7 |
| detox-sleep | In Bed by 10:30 PM | Days 1-7 |
| detox-no-social | No Social Media | Days 1-7 |
| detox-no-content | No Long-Form Content | Days 1-7 |
| detox-compliance | Compliance | Days 1-7 |

**Day 1 = 6 activities** (brain-dump + 5 daily)
**Days 2-7 = 6 activities each** (freewrite + 5 daily)

### Delete completions for a specific day
```sql
DELETE FROM challenge_completions
WHERE challenge_id = '<CHALLENGE_ID>' AND user_id = '<USER_ID>' AND completion_date = '<DATE>';
```

### Reset all completions for a user (start fresh)
```sql
DELETE FROM challenge_completions
WHERE challenge_id = '<CHALLENGE_ID>' AND user_id = '<USER_ID>';
```

### Change a participant's start date
```sql
UPDATE challenge_participants SET personal_start_date = '<NEW_DATE>'
WHERE challenge_id = '<CHALLENGE_ID>' AND user_id = '<USER_ID>';
```

---

## Circle Operations

### Find a circle
```sql
SELECT id, name, emoji, member_count, is_active, invite_code FROM circles WHERE name ILIKE '%<NAME>%';
```

### List all circles
```sql
SELECT id, name, emoji, member_count, invite_code FROM circles WHERE is_active = true ORDER BY name;
```

### Create a circle
```sql
-- 1. Create the circle (invite_code auto-generated by trigger, but join_code is NOT)
INSERT INTO circles (id, name, emoji, description, created_by, member_count, join_code)
VALUES (gen_random_uuid(), '<NAME>', '<EMOJI>', '<DESCRIPTION>', '<CREATOR_USER_ID>', 0, '<JOIN_CODE>')
RETURNING id, name, invite_code, join_code;

-- 2. Add creator as admin (use the returned ID from step 1)
INSERT INTO circle_members (id, circle_id, user_id, role)
VALUES (gen_random_uuid(), '<NEW_CIRCLE_ID>', '<CREATOR_USER_ID>', 'admin');

-- 3. Update member count
UPDATE circles SET member_count = 1 WHERE id = '<NEW_CIRCLE_ID>';
```

**IMPORTANT:** The app uses `join_code` (NOT `invite_code`) when users join a circle. The `invite_code` is auto-generated by trigger but the app's join flow queries `join_code`. Always set `join_code` when creating a circle or it will be NULL and users won't be able to join.

### Change join/invite code
```sql
-- This is the one the app actually uses for joining:
UPDATE circles SET join_code = '<NEW_CODE>' WHERE id = '<CIRCLE_ID>';

-- This is auto-generated by trigger, rarely needs manual update:
UPDATE circles SET invite_code = '<NEW_CODE>' WHERE id = '<CIRCLE_ID>';
```

### Add user to a circle
```sql
INSERT INTO circle_members (id, circle_id, user_id, role)
VALUES (gen_random_uuid(), '<CIRCLE_ID>', '<USER_ID>', 'member');

UPDATE circles SET member_count = (
  SELECT COUNT(*) FROM circle_members WHERE circle_id = '<CIRCLE_ID>'
) WHERE id = '<CIRCLE_ID>';
```

---

## Post Operations

### Delete a post and its related data
```sql
-- Order matters (FK dependencies)
DELETE FROM post_circles WHERE post_id = '<POST_ID>';
DELETE FROM post_comments WHERE post_id = '<POST_ID>';
DELETE FROM post_reactions WHERE post_id = '<POST_ID>';
DELETE FROM reactions WHERE post_id = '<POST_ID>';
DELETE FROM likes WHERE post_id = '<POST_ID>';
DELETE FROM posts WHERE id = '<POST_ID>';
```

### Delete all posts by a user
```sql
DELETE FROM post_circles WHERE post_id IN (SELECT id FROM posts WHERE user_id = '<USER_ID>');
DELETE FROM post_comments WHERE post_id IN (SELECT id FROM posts WHERE user_id = '<USER_ID>');
DELETE FROM post_reactions WHERE post_id IN (SELECT id FROM posts WHERE user_id = '<USER_ID>');
DELETE FROM reactions WHERE post_id IN (SELECT id FROM posts WHERE user_id = '<USER_ID>');
DELETE FROM likes WHERE post_id IN (SELECT id FROM posts WHERE user_id = '<USER_ID>');
DELETE FROM posts WHERE user_id = '<USER_ID>';
```

---

## Full User Deletion (Nuclear Option)

**WARNING: This permanently removes ALL data for a user. Cannot be undone.**

```sql
-- 1. Posts and related
DELETE FROM post_circles WHERE post_id IN (SELECT id FROM posts WHERE user_id = '<USER_ID>');
DELETE FROM post_comments WHERE user_id = '<USER_ID>';
DELETE FROM post_reactions WHERE user_id = '<USER_ID>';
DELETE FROM reactions WHERE user_id = '<USER_ID>';
DELETE FROM likes WHERE user_id = '<USER_ID>';
DELETE FROM posts WHERE user_id = '<USER_ID>';

-- 2. Challenge data
DELETE FROM challenge_completions WHERE user_id = '<USER_ID>';
DELETE FROM challenge_activity_schedules WHERE user_id = '<USER_ID>';
DELETE FROM challenge_participants WHERE user_id = '<USER_ID>';

-- 3. Actions and goals
DELETE FROM action_completions WHERE user_id = '<USER_ID>';
DELETE FROM actions WHERE user_id = '<USER_ID>';
DELETE FROM streaks WHERE user_id = '<USER_ID>';
DELETE FROM goals WHERE user_id = '<USER_ID>';

-- 4. Social
DELETE FROM follows WHERE follower_id = '<USER_ID>' OR following_id = '<USER_ID>';
DELETE FROM circle_members WHERE user_id = '<USER_ID>';

-- 5. Reviews and notifications
DELETE FROM daily_review_missed_actions WHERE review_id IN (SELECT id FROM daily_reviews WHERE user_id = '<USER_ID>');
DELETE FROM daily_reviews WHERE user_id = '<USER_ID>';
DELETE FROM notifications WHERE user_id = '<USER_ID>';
DELETE FROM notification_schedules WHERE user_id = '<USER_ID>';
DELETE FROM notification_preferences WHERE user_id = '<USER_ID>';
DELETE FROM push_tokens WHERE user_id = '<USER_ID>';

-- 6. Profile
DELETE FROM profile_views WHERE viewer_id = '<USER_ID>' OR viewed_id = '<USER_ID>';
DELETE FROM user_badges WHERE user_id = '<USER_ID>';
DELETE FROM profiles WHERE id = '<USER_ID>';

-- 7. Update denormalized counts for affected circles
-- (run after to fix member_count on any circles they were in)
```

---

## Diagnostic Queries

### Check database health for a challenge
```sql
-- Participants vs completions summary
SELECT p.name, cp.status, cp.personal_start_date, cp.completion_percentage,
  (SELECT COUNT(*) FROM challenge_completions cc WHERE cc.user_id = cp.user_id AND cc.challenge_id = cp.challenge_id) as actual_completions
FROM challenge_participants cp
JOIN profiles p ON p.id = cp.user_id
WHERE cp.challenge_id = '<CHALLENGE_ID>' AND cp.status != 'left'
ORDER BY cp.completion_percentage DESC;
```

### Find orphaned data
```sql
-- Completions for users not in challenge
SELECT cc.user_id, COUNT(*) FROM challenge_completions cc
LEFT JOIN challenge_participants cp ON cp.user_id = cc.user_id AND cp.challenge_id = cc.challenge_id
WHERE cc.challenge_id = '<CHALLENGE_ID>' AND cp.id IS NULL
GROUP BY cc.user_id;

-- Circle members not in circle_members table but with circle_id set
SELECT id, name FROM profiles WHERE circle_id = '<CIRCLE_ID>'
AND id NOT IN (SELECT user_id FROM circle_members WHERE circle_id = '<CIRCLE_ID>');
```
