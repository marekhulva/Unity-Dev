# 📊 Your Database Cheat Sheet - Simple Version

## Main Tables and Their Columns:

### 📁 **circles** (Groups)
- `id` - unique ID
- `name` - circle name
- `invite_code` - code to join (like "TEST123") ⚠️ NOT "code"!
- `description` - optional description
- `created_by` - who created it
- `created_at` - when created
- `member_count` - how many members
- `is_active` - if circle is active

### 👥 **circle_members**
- `id` - unique ID
- `circle_id` - which circle
- `user_id` - which user
- `joined_at` - when they joined
- `role` - their role in circle

### 👤 **profiles** (Users)
- `id` - unique ID
- `email` - user email
- `name` - display name
- `username` - username
- `avatar_url` - profile picture
- `circle_id` - their current circle
- `created_at` - when joined

### 🏆 **challenges**
- `id` - unique ID
- `circle_id` - which circle owns it
- `name` - challenge name
- `description` - what it's about
- `start_date` - when it starts
- `end_date` - when it ends
- `is_active` - if currently active
- `created_by` - who created it

### 🎯 **challenge_participants**
- `id` - unique ID
- `challenge_id` - which challenge
- `user_id` - which user
- `selected_activity_ids` - array of activity IDs they chose
- `linked_action_ids` - array of linked existing habits
- `activity_times` - JSON with scheduled times
- `total_completions` - how many completed
- `consistency_percentage` - their consistency %
- `current_streak` - current streak
- `joined_at` - when joined challenge

### 📝 **challenge_activities**
- `id` - unique ID
- `challenge_id` - which challenge
- `title` - activity name
- `description` - what it is
- `icon` - emoji/icon
- `canonical_name` - standard name

### 🎯 **actions** (Daily habits)
- `id` - unique ID
- `user_id` - which user
- `title` - action name
- `goal_id` - linked to which goal
- `frequency` - how often
- `time` - scheduled time
- `completed` - if done today
- `date` - which date

### 🎯 **goals**
- `id` - unique ID
- `user_id` - which user
- `title` - goal name
- `description` - details
- `target_value` - target number
- `current_value` - current progress
- `deadline` - when to achieve by
- `category` - type of goal

### 📮 **posts**
- `id` - unique ID
- `user_id` - who posted
- `type` - post type (status, photo, etc)
- `content` - text content
- `media_url` - photo/video URL
- `visibility` - who can see (circle/follow/public)
- `created_at` - when posted
- `is_challenge` - if it's a challenge post
- `challenge_id` - which challenge
- `challenge_name` - challenge name

### ✅ **completed_actions**
- `id` - unique ID
- `action_id` - which action
- `user_id` - which user
- `completed_at` - when completed
- `date` - which date
- `notes` - optional notes

## 🔍 Quick Lookups:

**Need the join code column?**
→ It's `invite_code` NOT `code`

**Need user info?**
→ Look in `profiles` NOT `users`

**Need to link challenge to circle?**
→ Use `circle_id` in challenges table

**Need to find who's in a circle?**
→ Check `circle_members` table

**Need challenge participants?**
→ Check `challenge_participants` table

## 📝 Common SQL Fixes:

❌ **Wrong:**
```sql
SELECT * FROM users
SELECT * FROM circles WHERE code = 'TEST123'
```

✅ **Correct:**
```sql
SELECT * FROM profiles
SELECT * FROM circles WHERE invite_code = 'TEST123'
```

---

*Full detailed version with all types: `src/types/database.types.ts`*