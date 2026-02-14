# Database Architecture Documentation

## Overview
This application uses Supabase (PostgreSQL) as the backend database with Row Level Security (RLS) enabled for data protection.

## Core Tables

### 1. `auth.users` (Supabase Auth)
- Managed by Supabase Authentication
- Fields:
  - `id` (UUID) - Primary key
  - `email` (string)
  - `raw_user_meta_data` (JSONB) - Contains username, etc.

### 2. `profiles`
- User profile information
- Fields:
  - `id` (UUID) - References auth.users(id)
  - `username` (string) - Unique username
  - `display_name` (string) - Display name
  - `avatar_url` (string) - Profile picture URL
  - `bio` (text) - User biography
  - `circle_id` (UUID) - References circles(id)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

### 3. `goals`
- User goals/objectives
- Fields:
  - `id` (UUID) - Primary key
  - `user_id` (UUID) - References auth.users(id)
  - `title` (string) - Goal name
  - `description` (text) - Goal details
  - `color` (string) - Display color (hex)
  - `icon` (string) - Goal icon/emoji
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

### 4. `actions`
- Daily actions/habits linked to goals
- Fields:
  - `id` (UUID) - Primary key
  - `user_id` (UUID) - References auth.users(id)
  - `goal_id` (UUID) - References goals(id)
  - `title` (string) - Action name
  - `frequency` (string) - How often (e.g., "Daily")
  - `time` (string) - Scheduled time
  - `completed` (boolean) - Today's completion status
  - `completed_at` (timestamp) - Last completion timestamp
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

### 5. `action_completions` (NEW)
- Tracks every completion of an action (history)
- Fields:
  - `id` (UUID) - Primary key
  - `action_id` (UUID) - References actions(id)
  - `user_id` (UUID) - References auth.users(id)
  - `completed_at` (timestamp) - When completed
  - `created_at` (timestamp)

### 6. `circles`
- Social accountability groups
- Fields:
  - `id` (UUID) - Primary key
  - `name` (string) - Circle name
  - `code` (string) - Join code (unique)
  - `created_by` (UUID) - References auth.users(id)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

### 7. `circle_members`
- Circle membership junction table
- Fields:
  - `id` (UUID) - Primary key
  - `circle_id` (UUID) - References circles(id)
  - `user_id` (UUID) - References auth.users(id)
  - `role` (string) - "member" or "admin"
  - `joined_at` (timestamp)

### 8. `posts`
- Social feed posts
- Fields:
  - `id` (UUID) - Primary key
  - `user_id` (UUID) - References auth.users(id)
  - `content` (text) - Post content
  - `type` (string) - Post type (celebration, update, etc.)
  - `visibility` (string) - "public", "circle", "private"
  - `media_url` (string) - Attached media
  - `metadata` (JSONB) - Additional data
  - `created_at` (timestamp)

### 9. `challenges`
- Group challenges
- Fields:
  - `id` (UUID) - Primary key
  - `title` (string) - Challenge name
  - `description` (text)
  - `created_by` (UUID) - References auth.users(id)
  - `circle_id` (UUID) - References circles(id)
  - `start_date` (date)
  - `end_date` (date)
  - `created_at` (timestamp)

### 10. `challenge_participants`
- Users participating in challenges
- Fields:
  - `id` (UUID) - Primary key
  - `challenge_id` (UUID) - References challenges(id)
  - `user_id` (UUID) - References auth.users(id)
  - `activity_times` (JSONB) - Scheduled times for activities
  - `joined_at` (timestamp)

## Data Flow

### Creating an Action
1. User creates action via UI
2. Frontend calls `backendService.createAction()`
3. Backend inserts into `actions` table with `goal_id`
4. Action appears in daily list

### Completing an Action
1. User marks action as complete in Daily tab
2. Frontend calls `backendService.completeAction(actionId)`
3. Backend:
   - Inserts row into `action_completions` table (new completion record)
   - Updates `actions.completed = true` and `actions.completed_at = NOW()`
4. Action shows as completed for today

### Calculating Consistency
1. Progress page loads
2. Frontend calls `backendService.getGoalCompletionStats(userId)`
3. Backend:
   - For each goal, calculates days since creation
   - Counts linked actions (expected = actions × days)
   - Counts rows in `action_completions` for those actions
   - Returns percentage (completed / expected × 100)
4. UI displays per-goal and overall consistency

## API Layer

### Service Architecture
```
Frontend (React Native)
    ↓
backendService.ts (Abstraction layer)
    ↓
supabaseService.ts (Direct Supabase queries)
    ↓
Supabase PostgreSQL Database
```

### Key Backend Methods

#### Actions
- `createAction(data)` - Creates new action
- `completeAction(id)` - Marks complete & logs to history
- `updateAction(id, data)` - Updates action details
- `deleteAction(id)` - Removes action
- `getDailyActions()` - Gets today's actions

#### Goals
- `createGoal(data)` - Creates new goal
- `updateGoal(id, data)` - Updates goal
- `deleteGoal(id)` - Removes goal
- `getGoals()` - Gets user's goals

#### Statistics
- `getGoalCompletionStats(userId)` - Per-goal consistency
- `getOverallCompletionStats(userId)` - Overall consistency

#### Social
- `createPost(data)` - Creates social post
- `getCircleFeed()` - Gets circle posts
- `getPublicFeed()` - Gets public posts

## Row Level Security (RLS)

All tables have RLS enabled with policies:

### Common Pattern
```sql
-- Users can only see/edit their own data
CREATE POLICY "Users can manage own data" ON table_name
FOR ALL USING (auth.uid() = user_id);
```

### Special Cases
- `circles`: Members can view circle data
- `posts`: Visibility based on `visibility` field
- `action_completions`: Users can only see their own history

## Indexes

Key indexes for performance:

```sql
-- Fast action queries
CREATE INDEX idx_actions_user_goal ON actions(user_id, goal_id);

-- Fast completion lookups
CREATE INDEX idx_completions_action ON action_completions(action_id);
CREATE INDEX idx_completions_user ON action_completions(user_id);

-- Fast circle member lookups
CREATE INDEX idx_circle_members ON circle_members(circle_id, user_id);
```

## Consistency Calculation Formula

### Per-Goal
```
Actions per day = count(actions where goal_id = X)
Days since creation = NOW() - goal.created_at
Expected = Actions per day × Days since creation
Completed = count(action_completions where action_id IN goal_actions)
Consistency % = (Completed / Expected) × 100
```

### Overall
```
Sum all goals' expected completions
Sum all goals' actual completions
Overall % = (Total Completed / Total Expected) × 100
```

## Important Notes

1. **Completion History**: The `action_completions` table is critical for accurate consistency tracking. Without it, we can only see TODAY's status.

2. **Timezone Handling**: All timestamps are stored in UTC. Client converts to local timezone for display.

3. **Data Integrity**: Foreign keys ensure referential integrity. Deleting a user cascades to their data.

4. **Performance**: With proper indexes, queries remain fast even with thousands of completions.

5. **Security**: RLS policies ensure users can only access their own data (except for public/circle posts).