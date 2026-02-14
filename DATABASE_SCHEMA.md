# Unity Vision - Complete Database Schema Reference

**Generated**: 2026-02-13
**Purpose**: Quick reference for all SQL queries - never guess table/column names again!

---

## Table of Contents
- [Quick Reference Tables](#quick-reference-tables)
- [Challenge System](#challenge-system)
- [Social/Posts System](#socialposts-system)
- [User System](#user-system)
- [Actions & Goals](#actions--goals)
- [All Tables Detailed](#all-tables-detailed)
- [Foreign Key Relationships](#foreign-key-relationships)

---

## Quick Reference Tables

### Most Used Tables (by row count)
| Table | Rows | Purpose |
|-------|------|---------|
| `actions` | 623 | Daily actions/commitments |
| `profiles` | 232 | User profiles |
| `goals` | 231 | User goals |
| `action_completions` | 223 | Completed actions log |
| `follows` | 154 | Social following relationships |
| `challenge_completions` | 63 | Challenge activity completions |
| `circle_members` | 47 | Circle memberships |
| `posts` | 33 | Social feed posts |
| `challenge_participants` | 25 | Users in challenges |
| `challenges` | 18 | Active challenges |

---

## Challenge System

### `challenges` (18 rows)
Primary challenge definitions (7 Day Mental Detox, etc.)

**Key Columns:**
- `id` (uuid) - Primary key
- `name` (text) - "7 Day Mental Detox"
- `type` (text) - Challenge type
- `scope` (text) - "personal" or "circle"
- `circle_id` (uuid) - FK to circles
- `duration_days` (integer) - Length of challenge
- `predetermined_activities` (jsonb) - Activities list
- `status` (text) - "active", "completed", etc.

### `challenge_participants` (25 rows)
Users enrolled in challenges - **CRITICAL FOR LEADERBOARDS**

**Key Columns:**
- `id` (uuid) - Primary key
- `user_id` (uuid) - FK to profiles
- `challenge_id` (uuid) - FK to challenges
- `personal_start_date` (date) - When THIS user started (not challenge start!)
- `current_day` (integer) - What day they're on (1-7, etc.)
- `completed_days` (integer) - How many days fully completed
- `completion_percentage` (numeric) - Score for leaderboard
- `current_streak` (integer) - Consecutive days
- `status` (text) - "active", "completed", "left"
- `rank` (integer) - Leaderboard position
- `percentile` (numeric) - Top X%
- `joined_at` (timestamp) - When they joined
- `activity_times` (jsonb) - Scheduled times for activities

**IMPORTANT**: Use `personal_start_date` for day calculations, NOT challenge start date!

### `challenge_completions` (63 rows)
Individual activity completions (one row per activity per day)

**Key Columns:**
- `id` (uuid) - Primary key
- `user_id` (uuid) - FK to profiles
- `challenge_id` (uuid) - FK to challenges
- `participant_id` (uuid) - FK to challenge_participants
- `action_id` (uuid) - FK to actions (if linked)
- `challenge_activity_id` (text) - Activity identifier (e.g., "detox-sleep")
- `completion_date` (date) - Which day completed
- `completed_at` (timestamp) - Exact timestamp

**Database Constraint**: One completion per user per activity per day

### `challenge_activity_schedules` (3 rows)
User's scheduled times for challenge activities

**Key Columns:**
- `user_id` (uuid) - FK to profiles
- `challenge_id` (uuid) - FK to challenges
- `activity_id` (text) - Activity identifier
- `scheduled_time` (time) - When to do it (e.g., "09:00")

---

## Social/Posts System

### `posts` (33 rows)
Social feed posts (Living Progress Cards, celebrations, etc.)

**Key Columns:**
- `id` (uuid) - Primary key
- `user_id` (uuid) - FK to profiles
- `type` (text) - "daily_progress", "celebration", "checkin", etc.
- `content` (text) - Post text/caption
- `created_at` (timestamp) - When posted
- `visibility` (text) - "public", "circle", etc.
- **Challenge fields:**
  - `is_challenge` (boolean) - Is this a challenge post?
  - `challenge_id` (uuid) - FK to challenges
  - `challenge_name` (text) - Challenge name
  - `challenge_progress` (text) - JSON: `{"current_day": 2, "total_days": 7}`
  - `leaderboard_position` (integer) - User's rank
- **Living Progress Card fields:**
  - `is_daily_progress` (boolean) - Is this a daily progress card?
  - `progress_date` (date) - Which day this card represents
  - `completed_actions` (jsonb) - Array of completed actions
  - `total_actions` (integer) - How many actions total
  - `actions_today` (integer) - How many completed today
- **Visibility:**
  - `circle_id` (uuid) - Specific circle (legacy)
  - `is_private` (boolean) - Only visible to poster
  - `is_explore` (boolean) - Discoverable in Explore
  - `is_network` (boolean) - Visible to all circles + followers

### `post_circles` (14 rows)
Multi-circle posts (one row per circle a post is shared to)

**Key Columns:**
- `post_id` (uuid) - FK to posts
- `circle_id` (uuid) - FK to circles

### `post_reactions` (5 rows)
Fire reactions on posts

**Key Columns:**
- `post_id` (uuid) - FK to posts
- `user_id` (uuid) - FK to profiles

### `post_comments` (1 row)
Comments on posts

**Key Columns:**
- `post_id` (uuid) - FK to posts
- `user_id` (uuid) - FK to profiles
- `content` (text) - Comment text

---

## User System

### `profiles` (232 rows)
User profiles

**Key Columns:**
- `id` (uuid) - Primary key (matches auth.users.id)
- `email` (text) - User email
- `name` (text) - Display name
- `username` (text) - Unique username
- `avatar_url` (text) - Profile picture URL or emoji
- `bio` (text) - Profile bio
- `following_count` (integer) - How many they follow
- `follower_count` (integer) - How many follow them
- `is_admin` (boolean) - Admin privileges

### `follows` (154 rows)
Social following relationships

**Key Columns:**
- `follower_id` (uuid) - FK to profiles (who follows)
- `following_id` (uuid) - FK to profiles (who is followed)

### `circles` (8 rows)
Groups/communities

**Key Columns:**
- `id` (uuid) - Primary key
- `name` (varchar) - Circle name
- `join_code` (varchar) - Invite code (e.g., "JACKSON")
- `emoji` (varchar) - Circle emoji
- `member_count` (integer) - Number of members
- `created_by` (uuid) - FK to profiles

### `circle_members` (47 rows)
Circle memberships

**Key Columns:**
- `circle_id` (uuid) - FK to circles
- `user_id` (uuid) - FK to profiles
- `role` (varchar) - "member", "admin", etc.
- `joined_at` (timestamp) - When joined

---

## Actions & Goals

### `actions` (623 rows)
Daily actions/commitments

**Key Columns:**
- `id` (uuid) - Primary key
- `user_id` (uuid) - FK to profiles
- `goal_id` (uuid) - FK to goals (optional)
- `title` (text) - Action title
- `time` (time) - Scheduled time
- `completed` (boolean) - Persistent completion flag
- `completed_at` (timestamp) - When completed (check if TODAY!)
- `frequency` (text) - "Daily", "Weekly", etc.
- `is_abstinence` (boolean) - Is this a "Don't do X" action?
- `challenge_ids` (uuid[]) - Array of challenge IDs

**IMPORTANT**: Always check `completed_at` date, not just `completed` boolean!

### `action_completions` (223 rows)
Historical log of all action completions

**Key Columns:**
- `id` (uuid) - Primary key
- `action_id` (uuid) - FK to actions
- `user_id` (uuid) - FK to profiles
- `completed_at` (timestamp) - When completed

### `goals` (231 rows)
User goals

**Key Columns:**
- `id` (uuid) - Primary key
- `user_id` (uuid) - FK to profiles
- `title` (text) - Goal title
- `color` (text) - Goal color (hex)
- `category` (text) - Goal category
- `deadline` (date) - Goal deadline
- `progress` (integer) - Progress percentage

---

## All Tables Detailed

### Challenge Tables (Active)
- `challenges` - Challenge definitions (18 rows, 19 columns)
- `challenge_participants` - Users in challenges (25 rows, 26 columns)
- `challenge_completions` - Activity completions (63 rows, 12 columns)
- `challenge_activity_schedules` - Scheduled times (3 rows, 9 columns)
- `challenge_forum_threads` - Forum discussions (0 rows, 15 columns)
- `challenge_forum_replies` - Forum replies (0 rows, 9 columns)

### Challenge Tables (Archived - Old Schema)
- `_archived_challenges_v1` (1 row, 11 columns)
- `_archived_challenge_participants_v1` (2 rows, 10 columns)
- `_archived_challenge_activities_v1` (7 rows, 8 columns)
- `_archived_challenge_completions_v1` (0 rows, 6 columns)
- `_archived_challenge_activity_types_v1` (4 rows, 16 columns)
- `_archived_challenge_rules_v1` (4 rows, 7 columns)

### Social/Posts Tables
- `posts` - Social feed posts (33 rows, 32 columns)
- `post_circles` - Multi-circle visibility (14 rows, 4 columns)
- `post_reactions` - Fire reactions (5 rows, 4 columns)
- `post_comments` - Comments (1 row, 6 columns)
- `likes` - Legacy likes (0 rows, 4 columns)
- `reactions` - Legacy reactions (0 rows, 5 columns)

### User Tables
- `profiles` - User profiles (232 rows, 14 columns)
- `follows` - Following relationships (154 rows, 4 columns)
- `profile_views` - Profile views (0 rows, 4 columns)

### Circle Tables
- `circles` - Communities (8 rows, 12 columns)
- `circle_members` - Memberships (47 rows, 5 columns)

### Action/Goal Tables
- `actions` - Daily actions (623 rows, 20 columns)
- `action_completions` - Completion log (223 rows, 5 columns)
- `goals` - User goals (231 rows, 13 columns)
- `streaks` - Goal streaks (0 rows, 7 columns)

### Daily Review Tables
- `daily_reviews` - Daily reflections (2 rows, 15 columns)
- `daily_review_missed_actions` - Missed action analysis (0 rows, 9 columns)

### Notification Tables
- `notifications` - In-app notifications (1 row, 14 columns)
- `notification_preferences` - User settings (172 rows, 16 columns)
- `notification_schedules` - Scheduled notifications (0 rows, 12 columns)
- `push_tokens` - Device push tokens (0 rows, 8 columns)

### Badge System
- `user_badges` - Earned badges (0 rows, 13 columns)

---

## Foreign Key Relationships

### Challenge Relationships
```
challenges
  ├─> circle_id → circles.id
  └─> created_by → profiles.id

challenge_participants
  ├─> user_id → profiles.id
  └─> challenge_id → challenges.id

challenge_completions
  ├─> user_id → profiles.id
  ├─> challenge_id → challenges.id
  ├─> participant_id → challenge_participants.id
  └─> action_id → actions.id (optional)

challenge_activity_schedules
  ├─> user_id → profiles.id
  └─> challenge_id → challenges.id
```

### Social/Posts Relationships
```
posts
  ├─> user_id → profiles.id
  ├─> circle_id → circles.id
  └─> challenge_id → challenges.id (optional)

post_circles
  ├─> post_id → posts.id
  └─> circle_id → circles.id

post_reactions
  ├─> post_id → posts.id
  └─> user_id → profiles.id

post_comments
  ├─> post_id → posts.id
  └─> user_id → profiles.id
```

### User Relationships
```
profiles
  └─> circle_id → circles.id (optional)

follows
  ├─> follower_id → profiles.id
  └─> following_id → profiles.id
```

### Action/Goal Relationships
```
actions
  ├─> user_id → profiles.id
  └─> goal_id → goals.id (optional)

action_completions
  ├─> action_id → actions.id
  └─> user_id → profiles.id

goals
  └─> user_id → profiles.id
```

---

## Common Query Patterns

### Get user's current challenges
```sql
SELECT c.*, cp.current_day, cp.completion_percentage, cp.status
FROM challenge_participants cp
JOIN challenges c ON cp.challenge_id = c.id
WHERE cp.user_id = 'USER_ID'
  AND cp.status = 'active';
```

### Get challenge leaderboard
```sql
SELECT
  p.name,
  cp.completion_percentage,
  cp.current_streak,
  cp.rank
FROM challenge_participants cp
JOIN profiles p ON cp.user_id = p.id
WHERE cp.challenge_id = 'CHALLENGE_ID'
  AND cp.status != 'left'
ORDER BY cp.rank;
```

### Get user's Living Progress Cards
```sql
SELECT
  posts.*,
  (posts.challenge_progress::json->>'current_day')::int as day_number
FROM posts
WHERE user_id = 'USER_ID'
  AND is_daily_progress = true
  AND is_challenge = true
ORDER BY progress_date DESC;
```

### Calculate correct day number for a user
```sql
SELECT
  (CURRENT_DATE - cp.personal_start_date::date) + 1 as correct_day
FROM challenge_participants cp
WHERE cp.user_id = 'USER_ID'
  AND cp.challenge_id = 'CHALLENGE_ID';
```

---

## Important Notes

### Timezone Handling
- **Database uses UTC for all timestamps**
- Use `AT TIME ZONE 'America/Los_Angeles'` to convert to local time
- `CURRENT_DATE` returns UTC date, which may be +1 day ahead of user's local date

### Day Calculation
- **Always use `personal_start_date`**, not challenge start date
- Formula: `(CURRENT_DATE - personal_start_date) + 1` = current day number
- Day 1 = start date, Day 2 = start date + 1 day, etc.

### Completion Tracking
- `challenge_completions` has unique constraint: one completion per user per activity per day
- Check `completion_date` to see which day the activity was completed for
- Use `progress_date` in posts to match with `completion_date`

### Living Progress Cards
- One card per user per day per challenge
- `challenge_progress` field stores: `{"current_day": X, "total_days": Y}` as TEXT
- Parse as JSON: `(posts.challenge_progress::json->>'current_day')::int`

---

**Last Updated**: 2026-02-13
**Total Tables**: 34 active + 6 archived
**Total Rows**: ~2,500+
