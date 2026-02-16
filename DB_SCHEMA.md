# Unity-Dev Database Schema Map

> Auto-generated 2026-02-16. Use this for writing correct SQL queries.

## Core Tables

### profiles
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | - | PK, FK → auth.users |
| email | text | NO | - | UNIQUE |
| name | text | YES | - | |
| username | text | YES | - | UNIQUE |
| avatar_url | text | YES | - | |
| bio | text | YES | - | |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |
| circle_id | uuid | YES | - | FK → circles.id |
| following_count | integer | YES | 0 | |
| follower_count | integer | YES | 0 | |
| is_private | boolean | YES | false | |
| push_token | text | YES | - | |
| is_admin | boolean | YES | false | |

**Note:** `username` is often NULL. Use `name` for display purposes.

---

### circles
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | gen_random_uuid() | PK |
| name | varchar | NO | - | |
| description | text | YES | - | |
| invite_code | varchar | NO | - | UNIQUE |
| created_by | uuid | YES | - | FK → profiles.id |
| created_at | timestamptz | YES | utc now() | |
| member_count | integer | YES | 0 | **DENORMALIZED - must update manually** |
| is_active | boolean | YES | true | |
| join_code | varchar | YES | - | UNIQUE |
| emoji | varchar | YES | '🔵' | |
| category | varchar | YES | - | |
| is_private | boolean | YES | false | |

### circle_members
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | gen_random_uuid() | PK |
| circle_id | uuid | YES | - | FK → circles.id, UNIQUE(circle_id, user_id) |
| user_id | uuid | YES | - | FK → profiles.id |
| joined_at | timestamptz | YES | utc now() | |
| role | varchar | YES | 'member' | |

**To remove a user from a circle:** Delete from `circle_members` AND update `circles.member_count` AND check `profiles.circle_id`.

---

### challenges
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | gen_random_uuid() | PK |
| name | text | NO | - | |
| description | text | YES | - | |
| emoji | text | YES | '🏆' | |
| type | text | NO | - | |
| scope | text | NO | - | |
| circle_id | uuid | YES | - | FK → circles.id |
| duration_days | integer | NO | - | |
| success_threshold | integer | YES | 80 | |
| predetermined_activities | jsonb | NO | '[]' | |
| rules | jsonb | YES | '{}' | |
| benefits | jsonb | YES | '[]' | |
| badge_emoji | text | YES | '🏆' | |
| badge_name | text | YES | - | |
| has_forum | boolean | YES | false | |
| status | text | YES | 'active' | |
| created_by | uuid | YES | - | FK → profiles.id |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |

### challenge_participants
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | gen_random_uuid() | PK |
| challenge_id | uuid | NO | - | FK → challenges.id, UNIQUE(challenge_id, user_id) |
| user_id | uuid | NO | - | FK → profiles.id |
| joined_at | timestamptz | YES | now() | |
| personal_start_date | date | NO | CURRENT_DATE | |
| personal_end_date | date | YES | - | |
| current_day | integer | YES | 1 | |
| completed_days | integer | YES | 0 | |
| current_streak | integer | YES | 0 | |
| longest_streak | integer | YES | 0 | |
| last_completion_at | timestamptz | YES | - | |
| completion_percentage | numeric | YES | 0 | **NOT consistency_percentage** |
| status | text | YES | 'active' | |
| badge_earned | text | YES | - | |
| completed_at | timestamptz | YES | - | |
| abandoned_at | timestamptz | YES | - | |
| left_at | timestamptz | YES | - | |
| days_taken | integer | YES | - | |
| selected_activity_ids | uuid[] | YES | '{}' | |
| activity_times | jsonb | YES | '[]' | |
| linked_action_ids | uuid[] | YES | '{}' | |
| kept_activities | boolean | YES | - | |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |
| rank | integer | YES | - | |
| percentile | numeric | YES | - | |

### challenge_completions
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | - | FK → profiles.id, UNIQUE(user_id, challenge_id, completion_date, challenge_activity_id) |
| challenge_id | uuid | NO | - | FK → challenges.id |
| action_id | uuid | YES | - | FK → actions.id |
| completed_at | timestamptz | YES | now() | |
| completion_date | date | YES | CURRENT_DATE | |
| photo_url | text | YES | - | |
| is_verified | boolean | YES | false | |
| verification_type | text | YES | 'honor' | |
| created_at | timestamptz | YES | now() | |
| challenge_activity_id | text | YES | - | |
| participant_id | uuid | YES | - | FK → challenge_participants.id |

### challenge_activity_schedules
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | - | FK → profiles.id, UNIQUE(user_id, challenge_id, activity_id) |
| challenge_id | uuid | NO | - | FK → challenges.id |
| activity_id | text | NO | - | |
| scheduled_time | time | NO | - | |
| reminder_minutes_before | integer | YES | 15 | |
| frequency | text | YES | 'daily' | |
| days_of_week | array | YES | - | |
| created_at | timestamptz | YES | now() | |

---

### goals
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | - | FK → profiles.id |
| title | text | NO | - | |
| metric | text | YES | - | |
| deadline | date | YES | - | |
| category | text | YES | - | |
| color | text | YES | '#4F46E5' | |
| why | text | YES | - | |
| progress | integer | YES | 0 | |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |
| visibility | text | YES | 'public' | |
| type | text | YES | 'goal' | |

### actions
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | - | FK → profiles.id |
| goal_id | uuid | YES | - | FK → goals.id |
| title | text | NO | - | |
| date | date | YES | CURRENT_DATE | |
| time | time | YES | - | |
| completed | boolean | YES | false | |
| completed_at | timestamptz | YES | - | |
| created_at | timestamptz | YES | now() | |
| frequency | text | YES | - | |
| duration | integer | YES | - | |
| days_per_week | integer | YES | - | |
| time_of_day | time | YES | - | |
| category | text | YES | - | |
| visibility | text | YES | 'public' | |
| scheduled_days | array | YES | - | |
| challenge_ids | uuid[] | YES | '{}' | |
| is_habit | boolean | YES | false | |
| habit_source | text | YES | - | |
| is_abstinence | boolean | YES | false | |

### action_completions
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | uuid_generate_v4() | PK |
| action_id | uuid | YES | - | FK → actions.id |
| user_id | uuid | YES | - | FK → profiles.id |
| completed_at | timestamptz | YES | now() | |
| created_at | timestamptz | YES | now() | |

---

### posts
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | - | FK → profiles.id |
| type | text | NO | - | |
| content | text | NO | - | |
| media_url | text | YES | - | |
| action_title | text | YES | - | |
| goal_title | text | YES | - | |
| goal_color | text | YES | - | |
| streak | integer | YES | - | |
| created_at | timestamptz | YES | now() | |
| circle_id | uuid | YES | - | FK → circles.id |
| visibility | text | YES | - | |
| is_challenge | boolean | YES | false | |
| challenge_name | text | YES | - | |
| challenge_id | uuid | YES | - | FK → challenges.id |
| challenge_progress | text | YES | - | |
| leaderboard_position | integer | YES | - | |
| total_participants | integer | YES | - | |
| is_celebration | boolean | YES | false | |
| celebration_type | varchar | YES | - | |
| metadata | jsonb | YES | - | |
| audio_duration_ms | integer | YES | - | |
| is_private | boolean | YES | false | |
| is_explore | boolean | YES | false | |
| is_network | boolean | YES | false | |
| visibility_scope | text | YES | - | |
| is_daily_progress | boolean | YES | false | |
| progress_date | date | YES | - | |
| completed_actions | jsonb | YES | '[]' | |
| total_actions | integer | YES | 0 | |
| actions_today | integer | YES | 0 | |
| updated_at | timestamptz | YES | now() | |

### post_circles
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | uuid_generate_v4() | PK |
| post_id | uuid | NO | - | FK → posts.id, UNIQUE(post_id, circle_id) |
| circle_id | uuid | NO | - | FK → circles.id |
| created_at | timestamptz | YES | now() | |

### post_comments
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | uuid_generate_v4() | PK |
| post_id | uuid | NO | - | FK → posts.id |
| user_id | uuid | NO | - | FK → profiles.id |
| content | text | NO | - | |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |

### post_reactions
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | uuid_generate_v4() | PK |
| post_id | uuid | NO | - | FK → posts.id, UNIQUE(post_id, user_id) |
| user_id | uuid | NO | - | FK → profiles.id |
| created_at | timestamptz | YES | now() | |

### reactions
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | gen_random_uuid() | PK |
| post_id | uuid | NO | - | FK → posts.id, UNIQUE(post_id, user_id) |
| user_id | uuid | NO | - | FK → profiles.id |
| emoji | text | NO | - | |
| created_at | timestamptz | YES | now() | |

### likes
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | gen_random_uuid() | PK |
| post_id | uuid | NO | - | FK → posts.id, UNIQUE(post_id, user_id) |
| user_id | uuid | NO | - | FK → profiles.id |
| created_at | timestamptz | YES | now() | |

---

### follows
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | gen_random_uuid() | PK |
| follower_id | uuid | NO | - | FK → profiles.id, UNIQUE(follower_id, following_id) |
| following_id | uuid | NO | - | FK → profiles.id |
| created_at | timestamptz | YES | now() | |

---

### daily_reviews
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | uuid_generate_v4() | PK |
| user_id | uuid | NO | - | FK → profiles.id, UNIQUE(user_id, review_date) |
| review_date | date | NO | - | |
| total_actions | integer | YES | 0 | |
| completed_actions | integer | YES | 0 | |
| completion_percentage | numeric | YES | 0 | |
| biggest_win | text | YES | - | |
| key_insight | text | YES | - | |
| gratitude | text | YES | - | |
| tomorrow_focus | text | YES | - | |
| tomorrow_intention | text | YES | - | |
| points_earned | integer | YES | 0 | |
| streak_day | integer | YES | 0 | |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |

### daily_review_missed_actions
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | uuid_generate_v4() | PK |
| review_id | uuid | NO | - | FK → daily_reviews.id |
| action_id | uuid | YES | - | |
| action_title | text | NO | - | |
| goal_title | text | YES | - | |
| marked_complete | boolean | YES | false | |
| miss_reason | text | YES | - | |
| obstacles | text | YES | - | |
| created_at | timestamptz | YES | now() | |

---

### streaks
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | - | FK → profiles.id |
| goal_id | uuid | YES | - | FK → goals.id |
| current_streak | integer | YES | 0 | |
| longest_streak | integer | YES | 0 | |
| last_completed | date | YES | - | |
| created_at | timestamptz | YES | now() | |

### user_badges
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | - | FK → profiles.id, UNIQUE(user_id, challenge_id) |
| challenge_id | uuid | NO | - | FK → challenges.id |
| badge_type | text | NO | - | |
| badge_emoji | text | NO | - | |
| badge_name | text | NO | - | |
| is_displayed_on_profile | boolean | YES | true | |
| display_order | integer | YES | - | |
| completion_percentage | numeric | YES | - | |
| final_rank | integer | YES | - | |
| total_participants | integer | YES | - | |
| days_taken | integer | YES | - | |
| earned_at | timestamptz | YES | now() | |

---

### notifications
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | - | FK → profiles.id |
| type | text | NO | - | |
| title | text | NO | - | |
| body | text | NO | - | |
| data | jsonb | YES | '{}' | |
| is_read | boolean | YES | false | |
| created_at | timestamptz | YES | now() | |
| read_at | timestamptz | YES | - | |
| action_url | text | YES | - | |
| category | text | YES | - | |
| tone | text | YES | - | |
| opened_at | timestamptz | YES | - | |
| led_to_action | boolean | YES | false | |

### notification_preferences
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| user_id | uuid | NO | - | PK, FK → profiles.id |
| push_enabled | boolean | YES | true | |
| email_enabled | boolean | YES | false | |
| social_notifications | boolean | YES | true | |
| challenge_notifications | boolean | YES | true | |
| reminder_notifications | boolean | YES | true | |
| competitive_notifications | boolean | YES | true | |
| morning_digest_enabled | boolean | YES | true | |
| morning_digest_time | time | YES | 07:00 | |
| quiet_hours_enabled | boolean | YES | false | |
| quiet_hours_start | time | YES | 22:00 | |
| quiet_hours_end | time | YES | 07:00 | |
| timezone | text | YES | 'UTC' | |
| notification_tone | text | YES | 'aggressive' | |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |

### notification_schedules
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | - | FK → profiles.id |
| notification_type | text | NO | - | |
| scheduled_for | timestamptz | NO | - | |
| title | text | NO | - | |
| body | text | NO | - | |
| data | jsonb | YES | '{}' | |
| action_url | text | YES | - | |
| status | text | YES | 'pending' | |
| error_message | text | YES | - | |
| sent_at | timestamptz | YES | - | |
| created_at | timestamptz | YES | now() | |

### push_tokens
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | - | FK → profiles.id, UNIQUE(user_id, token) |
| token | text | NO | - | |
| platform | text | NO | - | |
| device_name | text | YES | - | |
| last_used_at | timestamptz | YES | now() | |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |

### profile_views
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | uuid_generate_v4() | PK |
| viewer_id | uuid | NO | - | FK → profiles.id, UNIQUE(viewer_id, viewed_id, viewed_at) |
| viewed_id | uuid | NO | - | FK → profiles.id |
| viewed_at | timestamptz | YES | now() | |

---

### challenge_forum_threads
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | gen_random_uuid() | PK |
| challenge_id | uuid | NO | - | FK → challenges.id |
| author_id | uuid | NO | - | FK → profiles.id |
| title | text | NO | - | |
| content | text | NO | - | |
| category | text | YES | - | |
| is_pinned | boolean | YES | false | |
| is_locked | boolean | YES | false | |
| upvotes | integer | YES | 0 | |
| downvotes | integer | YES | 0 | |
| reply_count | integer | YES | 0 | |
| view_count | integer | YES | 0 | |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |
| last_reply_at | timestamptz | YES | - | |

### challenge_forum_replies
| Column | Type | Nullable | Default | FK |
|--------|------|----------|---------|-----|
| id | uuid | NO | gen_random_uuid() | PK |
| thread_id | uuid | NO | - | FK → challenge_forum_threads.id |
| parent_reply_id | uuid | YES | - | FK → challenge_forum_replies.id (self-ref) |
| author_id | uuid | NO | - | FK → profiles.id |
| content | text | NO | - | |
| upvotes | integer | YES | 0 | |
| downvotes | integer | YES | 0 | |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |

---

## Denormalized Counters (must update manually)
- `circles.member_count` — count of `circle_members` for that circle
- `profiles.following_count` / `follower_count` — count of `follows`
- `challenge_forum_threads.reply_count` — count of replies

## Key Relationships
```
profiles ←──── circle_members ────→ circles
profiles.circle_id ────→ circles (legacy? primary circle)
profiles ←──── challenge_participants ────→ challenges ────→ circles
profiles ←──── challenge_completions ────→ challenges
challenge_completions.participant_id ────→ challenge_participants
profiles ←──── actions ────→ goals
profiles ←──── posts ────→ circles, challenges
posts ←──── post_circles ────→ circles
profiles ←──── follows (follower_id, following_id)
posts ←──── likes, reactions, post_reactions, post_comments
```

---

## Views

### post_visibility_details
- View for post visibility logic

### post_like_counts
- View for aggregated like counts per post

---

## Functions / RPCs

| Function | Returns | Purpose |
|----------|---------|---------|
| complete_challenge_activity | jsonb | Record a challenge activity completion |
| create_challenge | uuid | Create a new challenge |
| create_default_notification_preferences | trigger | Auto-create notif prefs for new users |
| generate_invite_code | text | Generate circle invite code |
| get_explore_feed | records | Fetch explore feed posts |
| get_post_reactions | record | Get reactions for a post |
| get_unread_notification_count | integer | Count unread notifications |
| get_user_local_time | time | Get user's local time from timezone |
| get_visible_posts | records | Fetch posts visible to current user |
| handle_new_user | trigger | Create profile on auth.users insert |
| insert_badge | void | Insert a user badge |
| join_circle_with_code | record | Join circle using invite/join code |
| mark_all_notifications_as_read | void | Mark all notifications read |
| mark_notification_as_read | void | Mark single notification read |
| set_invite_code | trigger | Auto-set invite code on circle create |
| set_personal_end_date | trigger | Auto-set end date on participant insert |
| toggle_like | json | Toggle like on a post |
| update_participant_stats | trigger | Update stats after completion insert |
| update_push_tokens_updated_at | trigger | Auto-update push_tokens.updated_at |
| update_updated_at | trigger | Auto-update updated_at column |
| update_updated_at_column | trigger | Auto-update updated_at column (variant) |

---

## Triggers

| Trigger | Table | Event | Function |
|---------|-------|-------|----------|
| update_stats_after_completion | _archived_challenge_completions_v1 | INSERT | update_participant_stats() |
| update_forum_replies_updated_at | challenge_forum_replies | UPDATE | update_updated_at_column() |
| update_forum_threads_updated_at | challenge_forum_threads | UPDATE | update_updated_at_column() |
| update_participants_updated_at | challenge_participants | UPDATE | update_updated_at_column() |
| trigger_set_personal_end_date | challenge_participants | INSERT | set_personal_end_date() |
| update_challenges_updated_at | challenges | UPDATE | update_updated_at_column() |
| trigger_set_invite_code | circles | INSERT | set_invite_code() |
| update_daily_reviews_updated_at | daily_reviews | UPDATE | update_updated_at_column() |
| update_goals_updated_at | goals | UPDATE | update_updated_at() |
| update_profiles_updated_at | profiles | UPDATE | update_updated_at() |
| update_push_tokens_updated_at | push_tokens | UPDATE | update_push_tokens_updated_at() |

**Note:** No trigger on `challenge_completions` INSERT for the new schema (stats are computed on-the-fly by the app).

---

## Key Unique Constraints

| Table | Constraint |
|-------|-----------|
| challenge_completions | (user_id, challenge_id, challenge_activity_id, completion_date) |
| challenge_participants | (challenge_id, user_id) |
| challenge_activity_schedules | (user_id, challenge_id, activity_id) |
| circle_members | (circle_id, user_id) |
| follows | (follower_id, following_id) |
| likes | (post_id, user_id) |
| post_circles | (post_id, circle_id) |
| post_reactions | (post_id, user_id) |
| reactions | (post_id, user_id) |
| daily_reviews | (user_id, review_date) |
| user_badges | (user_id, challenge_id) |
| push_tokens | (user_id, token) |

---

## RLS Policy Summary

Most tables use standard patterns:
- **SELECT**: Authenticated users can read (some tables public, some restricted to own data)
- **INSERT**: Users can insert own records (`auth.uid() = user_id`)
- **UPDATE**: Users can update own records
- **DELETE**: Limited (action_completions, circle members, follows, likes, reactions)

Notable:
- `challenges` has service_role full access policy
- `challenge_completions` has `users_own_completions` ALL policy
- `notification_schedules` has service role management
- `posts` has complex visibility policies (smart visibility, explore, network)

---

## Common Operations Cheat Sheet

**Remove user from circle:**
```sql
DELETE FROM circle_members WHERE circle_id = '...' AND user_id = '...';
UPDATE profiles SET circle_id = NULL WHERE id = '...' AND circle_id = '...';
UPDATE circles SET member_count = (SELECT COUNT(*) FROM circle_members WHERE circle_id = '...') WHERE id = '...';
```

**Check user's challenge completions:**
```sql
SELECT completion_date, challenge_activity_id FROM challenge_completions
WHERE user_id = '...' AND challenge_id = '...' ORDER BY completion_date, challenge_activity_id;
```

**Get leaderboard for a challenge:**
```sql
SELECT p.name, cp.completion_percentage, cp.completed_days, cp.current_streak, cp.rank
FROM challenge_participants cp JOIN profiles p ON p.id = cp.user_id
WHERE cp.challenge_id = '...' AND cp.status != 'left' ORDER BY cp.completion_percentage DESC;
```

---

## Archived Tables (ignore)
- `_archived_challenge_*_v1` — old schema, not in use
