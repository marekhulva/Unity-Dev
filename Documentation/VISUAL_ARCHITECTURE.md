# Visual Architecture Diagram - Challenge Implementation App

## Complete Data Flow Architecture

```mermaid
graph TB
    %% Frontend Layer
    subgraph "Frontend - React Native/Expo"
        UI[UI Components]
        Nav[Navigation Stack]

        subgraph "Screens"
            Daily[Daily Screen]
            Progress[Progress Screen]
            Circle[Circle Screen]
            Profile[Profile Screen]
            Social[Social Feed]
        end

        subgraph "State Management - Zustand"
            UserStore[userSlice]
            DailyStore[dailySlice]
            GoalsStore[goalsSlice]
            CircleStore[circleSlice]
            SocialStore[socialSlice]
        end
    end

    %% Service Layer
    subgraph "Service Layer"
        BackendSvc[backend.service.ts]
        SupabaseSvc[supabase.service.ts]
        DailyRevSvc[dailyReviews.service.ts]

        subgraph "API Methods"
            Auth[Authentication]
            CRUD[CRUD Operations]
            Calc[Calculations]
            RT[Real-time]
        end
    end

    %% Supabase Client
    subgraph "Supabase Client SDK"
        JSClient[Supabase JS Client]
        AuthClient[Auth Client]
        RealtimeClient[Realtime Client]
        StorageClient[Storage Client]
    end

    %% Database Layer
    subgraph "Supabase/PostgreSQL Database"
        subgraph "Core Tables"
            Profiles[profiles]
            Actions[actions]
            ActionComp[action_completions]
            Goals[goals]
        end

        subgraph "Social Tables"
            Circles[circles]
            CircleMem[circle_members]
            Posts[posts]
            Reactions[reactions]
            Follows[follows]
        end

        subgraph "Challenge Tables"
            Challenges[challenges]
            ChallPart[challenge_participants]
            ChallComp[challenge_completions]
            ChallAct[challenge_activities]
            ChallTypes[challenge_activity_types]
            ChallRules[challenge_rules]
        end

        subgraph "Analytics Tables"
            Streaks[streaks]
            ProfileViews[profile_views]
        end
    end

    %% Connections
    Daily --> DailyStore
    Progress --> GoalsStore
    Circle --> CircleStore
    Profile --> UserStore
    Social --> SocialStore

    DailyStore --> BackendSvc
    GoalsStore --> BackendSvc
    CircleStore --> BackendSvc
    UserStore --> BackendSvc
    SocialStore --> BackendSvc

    BackendSvc --> SupabaseSvc
    BackendSvc --> DailyRevSvc

    SupabaseSvc --> JSClient
    DailyRevSvc --> JSClient

    JSClient --> AuthClient
    JSClient --> RealtimeClient
    JSClient --> StorageClient

    AuthClient --> Profiles
    JSClient --> Actions
    JSClient --> ActionComp
    JSClient --> Goals
    JSClient --> Circles
    JSClient --> CircleMem
    JSClient --> Posts
    JSClient --> Challenges
    JSClient --> ChallPart
```

## Detailed Data Flow Patterns

### 1. Daily Action Completion Flow
```mermaid
sequenceDiagram
    participant User
    participant DailyScreen
    participant dailySlice
    participant backendService
    participant supabaseService
    participant DB

    User->>DailyScreen: Tap checkbox
    DailyScreen->>dailySlice: toggleAction(id)
    dailySlice->>dailySlice: Optimistic update
    dailySlice->>backendService: completeAction(id)
    backendService->>supabaseService: completeAction(id)

    supabaseService->>DB: INSERT action_completions
    Note over DB: Historical record created

    supabaseService->>DB: UPDATE actions SET completed=true
    Note over DB: Current state updated

    DB-->>supabaseService: Success
    supabaseService-->>backendService: Action completed
    backendService-->>dailySlice: Update confirmed
    dailySlice-->>DailyScreen: UI updated
```

### 2. Consistency Calculation Flow
```mermaid
sequenceDiagram
    participant ProgressScreen
    participant goalsSlice
    participant supabaseService
    participant DB

    ProgressScreen->>goalsSlice: loadGoalStats()
    goalsSlice->>supabaseService: getGoalCompletionStats(userId)

    loop For each goal
        supabaseService->>DB: SELECT FROM goals WHERE user_id
        Note over DB: Get goal creation date

        supabaseService->>DB: SELECT FROM actions WHERE goal_id
        Note over DB: Count linked actions

        supabaseService->>DB: SELECT COUNT FROM action_completions
        Note over DB: Count historical completions

        supabaseService->>supabaseService: Calculate %
        Note over supabaseService: completed/expected × 100
    end

    supabaseService-->>goalsSlice: Stats map
    goalsSlice-->>ProgressScreen: Display consistency
```

### 3. Circle Leaderboard Flow
```mermaid
sequenceDiagram
    participant CircleScreen
    participant circleSlice
    participant supabaseService
    participant DB

    CircleScreen->>circleSlice: loadCircleData()
    circleSlice->>supabaseService: getCircleMembers(circleId)

    supabaseService->>DB: SELECT FROM circle_members
    supabaseService->>DB: JOIN profiles ON user_id

    loop For each member
        supabaseService->>DB: SELECT FROM action_completions
        supabaseService->>supabaseService: Calculate consistency
    end

    supabaseService-->>circleSlice: Members with stats
    circleSlice-->>CircleScreen: Render leaderboard
```

## Database Relationships

```mermaid
erDiagram
    profiles ||--o{ actions : "has"
    profiles ||--o{ goals : "creates"
    profiles ||--o{ posts : "creates"
    profiles ||--o{ circle_members : "joins"
    profiles ||--o{ challenge_participants : "participates"
    profiles ||--o{ follows : "follows/followed"
    profiles ||--o{ reactions : "reacts"
    profiles ||--o{ profile_views : "views/viewed"

    goals ||--o{ actions : "contains"

    actions ||--o{ action_completions : "completed"

    circles ||--o{ circle_members : "has"
    circles ||--o{ challenges : "hosts"
    circles ||--o{ posts : "shared_in"

    challenges ||--o{ challenge_participants : "has"
    challenges ||--o{ challenge_activities : "includes"
    challenges ||--o{ challenge_activity_types : "defines"
    challenges ||--o{ challenge_rules : "governed_by"
    challenges ||--o{ challenge_completions : "tracked"
    challenges ||--o{ posts : "celebrated"

    challenge_participants ||--o{ challenge_completions : "completes"
    challenge_activities ||--o{ challenge_completions : "completed"

    posts ||--o{ reactions : "receives"

    profiles ||--o{ streaks : "maintains"
```

## Key API Endpoints & Data Flow

### Authentication Flow
```
Frontend → supabase.auth.signIn() → Supabase Auth → profiles table
Frontend → supabase.auth.signUp() → Supabase Auth → trigger → profiles table
```

### Daily Actions
```
Frontend → getTodaysActions(userId) → actions WHERE date=today → Return list
Frontend → completeAction(id) → INSERT action_completions + UPDATE actions
Frontend → uncompleteAction(id) → DELETE FROM action_completions + UPDATE actions
```

### Goals & Consistency
```
Frontend → getUserGoals(userId) → goals WHERE user_id → Return goals
Frontend → getGoalCompletionStats(userId) →
    → goals (get creation dates)
    → actions (count per goal)
    → action_completions (count completed)
    → Calculate percentage
```

### Circles & Social
```
Frontend → joinCircle(code) → circles WHERE invite_code → INSERT circle_members
Frontend → getCircleMembers(circleId) → circle_members JOIN profiles
Frontend → createPost(post) → INSERT posts → Real-time broadcast
Frontend → getPosts(filter) → posts JOIN profiles → Apply visibility rules
```

### Challenges
```
Frontend → getActiveChallenges(circleId) → challenges WHERE circle_id AND is_active
Frontend → joinChallenge(challengeId) → INSERT challenge_participants
Frontend → logChallengeActivity(activityId) → INSERT challenge_completions
Frontend → getChallengeLeaderboard(challengeId) →
    → challenge_participants
    → challenge_completions (COUNT)
    → challenge_rules (apply)
```

## Real-time Subscriptions

```javascript
// Circle member updates
supabase.channel('circle-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'circle_members',
    filter: `circle_id=eq.${circleId}`
  })

// New posts in feed
supabase.channel('social-feed')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'posts'
  })

// Challenge completions
supabase.channel('challenge-progress')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'challenge_completions',
    filter: `challenge_id=eq.${challengeId}`
  })
```

## Security Boundaries (RLS)

```sql
-- Users can only see their own actions
actions: auth.uid() = user_id

-- Users can only see public profiles or followed users
profiles: is_private = false OR id IN (SELECT following_id FROM follows WHERE follower_id = auth.uid())

-- Circle members can see circle content
posts: visibility = 'public' OR (visibility = 'circle' AND circle_id IN (SELECT circle_id FROM circle_members WHERE user_id = auth.uid()))

-- Challenge participants can log completions
challenge_completions: participant_id IN (SELECT id FROM challenge_participants WHERE user_id = auth.uid())
```

## Performance Optimizations

### Indexed Columns
- `actions`: user_id, date (compound index)
- `action_completions`: user_id, action_id, completed_at
- `posts`: user_id, created_at, circle_id, visibility
- `circles_members`: circle_id, user_id
- `challenge_completions`: participant_id, activity_id, completion_date

### Query Patterns
```sql
-- Efficient: Use indexes
SELECT * FROM actions WHERE user_id = ? AND date = ?

-- Efficient: Join with limit
SELECT p.*, pr.username
FROM posts p
JOIN profiles pr ON p.user_id = pr.id
WHERE p.visibility = 'public'
ORDER BY p.created_at DESC
LIMIT 20

-- Efficient: Aggregate with index
SELECT COUNT(*) FROM action_completions
WHERE user_id = ? AND completed_at >= ?
```

## Data Flow Summary

1. **Frontend Layer**: React Native screens interact with Zustand store
2. **State Management**: Zustand slices manage local state and call services
3. **Service Layer**: Abstraction between frontend and Supabase
4. **Supabase Client**: Handles auth, real-time, and database operations
5. **Database**: PostgreSQL with RLS policies ensuring data security

## Key Insights from Database Structure

1. **Comprehensive Challenge System**: Multiple tables for challenges, activities, rules, and completions
2. **Social Features**: Posts, reactions, follows, profile views
3. **Historical Tracking**: action_completions separate from actions for history
4. **Performance Focused**: Extensive indexing on frequently queried columns
5. **Security First**: RLS policies on all tables
6. **Analytics Ready**: streaks and profile_views tables for metrics

---

Last Updated: September 23, 2025
Based on actual database schema discovery