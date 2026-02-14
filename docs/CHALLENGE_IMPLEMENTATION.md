# Circle Challenges Implementation Documentation

## Overview
Circle Challenges are competitive, time-bound activities that circle members can join to build consistency together. Users select activities from a challenge, track them daily through the existing Daily page, and compete on leaderboards.

## Architecture Decisions

### 1. Challenge Creation
- **Phase 1**: Admin-only (hardcoded challenges)
- **Phase 2**: UI for admin creation  
- **Phase 3**: User-created challenges (future)

### 2. Activity Integration
- Challenge activities appear in Daily page alongside regular habits
- Smart deduplication: When activity names match, prompt user to link or keep separate
- Single completion counts for all linked sources (habit + challenge)

### 3. Scoring System
- Flexibility-focused: Select 3-5 activities, complete any 3 for 100% daily score
- Consistency percentage: (days completed / total days) * 100
- Real-time leaderboard updates

### 4. Database Schema

```sql
-- Core challenge table
challenges:
  - id: UUID
  - circle_id: UUID (FK to circles)
  - title: string
  - description: text
  - start_date: timestamp
  - end_date: timestamp
  - status: enum (upcoming, active, completed)
  - min_activities: integer (default 3)
  - max_activities: integer (default 5)
  - created_by: UUID (FK to profiles)
  - created_at: timestamp

-- Available activities per challenge
challenge_activities:
  - id: UUID
  - challenge_id: UUID (FK to challenges)
  - title: string
  - description: text
  - icon: string (emoji)
  - canonical_name: string (for matching)

-- User participation
challenge_participants:
  - id: UUID
  - challenge_id: UUID (FK to challenges)
  - user_id: UUID (FK to profiles)
  - selected_activities: UUID[] (array of activity IDs)
  - joined_at: timestamp
  - total_completions: integer
  - consistency_percentage: decimal
  - current_streak: integer

-- Daily completions
challenge_completions:
  - id: UUID
  - participant_id: UUID (FK to participants)
  - activity_id: UUID (FK to activities)
  - completed_at: timestamp
  - linked_action_id: UUID (FK to actions, optional)
```

### 5. Backend APIs

```typescript
// Challenge endpoints
GET    /api/circles/:circleId/challenges     // List challenges for circle
POST   /api/challenges/:id/join              // Join with selected activities
GET    /api/challenges/:id/leaderboard       // Get rankings
POST   /api/challenges/:id/complete          // Record activity completion
GET    /api/challenges/:id/my-progress       // Personal stats

// Activity matching
POST   /api/activities/match                 // Check for existing matches
POST   /api/activities/link                  // Link challenge to existing habit
```

### 6. UI Components

```
src/features/challenges/
├── ChallengeCard.tsx           // Challenge display with join/progress
├── ActivitySelectionModal.tsx  // Pick 3-5 activities when joining
├── ActivityMatchModal.tsx      // "Link to existing?" prompt
├── ChallengeLeaderboard.tsx   // Rankings with consistency %
├── ChallengeProgress.tsx      // Group stats & time remaining
└── index.ts                   // Exports
```

### 7. State Management

```typescript
// challengeSlice.ts
interface ChallengeSlice {
  // State
  circleCallenges: Challenge[]
  myParticipations: Participation[]
  currentLeaderboard: LeaderboardEntry[]
  
  // Actions
  fetchCircleChallenges(circleId: string): Promise<void>
  joinChallenge(challengeId: string, activities: string[]): Promise<void>
  completeActivity(participationId: string, activityId: string): Promise<void>
  syncWithDailyActions(): Promise<void>
}
```

## Implementation Phases

### Phase 1: Foundation (Current)
1. ✅ Database tables creation
2. ✅ Backend service methods
3. ✅ Hardcoded Jing Challenge
4. ✅ Basic UI in Circle tab

### Phase 2: Integration
1. ⏳ Activity selection flow
2. ⏳ Daily page integration
3. ⏳ Completion syncing

### Phase 3: Competition
1. ⏳ Live leaderboard
2. ⏳ Progress tracking
3. ⏳ End-of-challenge celebration

## Hardcoded Challenges

### 1. Jing Challenge (30 days)
```javascript
{
  title: "Jing Challenge",
  description: "Build your vital energy through consistent wellness practices",
  activities: [
    { title: "Meditation", icon: "🧘", canonical: "meditation" },
    { title: "Lower Dantian Breathing", icon: "🫁", canonical: "breathing_lower" },
    { title: "Heart Meditation", icon: "❤️", canonical: "meditation_heart" },
    { title: "Cold Showers", icon: "🚿", canonical: "cold_exposure" },
    { title: "Time in Nature", icon: "🌲", canonical: "nature" },
    { title: "Journaling", icon: "📝", canonical: "journaling" },
    { title: "Standing Qi Gong", icon: "🧍", canonical: "qigong" }
  ],
  min_activities: 3,
  max_activities: 5,
  duration: 30,
  circle_only: true
}
```

## Activity Matching Logic

When user selects an activity in a challenge:

1. **Exact Match**: "Meditation" == "Meditation"
   - Prompt: "You already have this habit. Link them?"
   - Yes → Single item in Daily page, counts for both
   - No → Two separate items

2. **Canonical Match**: "Sitting Practice" ~= "Meditation" 
   - Check canonical_name field
   - Prompt with both names shown

3. **No Match**: New activity
   - Add to Daily page with challenge badge
   - Auto-remove when challenge ends (optional)

## Progress Calculation

```typescript
// Daily completion
dailyScore = completedActivities / requiredActivities * 100
// If user selected 5 but only needs 3: completing 3 = 100%

// Overall consistency
consistency = daysWithFullCompletion / totalChallengeDays * 100

// Leaderboard ranking
rank = sortBy(consistency, then by totalCompletions, then by joinDate)
```

## Future Enhancements

1. **Challenge Templates**: Pre-built challenges users can customize
2. **AI Matching**: Smart activity recognition across name variations  
3. **Rewards System**: Badges, points, circle achievements
4. **Challenge History**: Past participation and achievements
5. **Team Challenges**: Sub-groups within circles
6. **Custom Metrics**: Beyond consistency (total reps, duration, etc.)

## Testing Checklist

- [ ] User can see challenges in Circle tab
- [ ] Join flow with 3-5 activity selection works
- [ ] Activity matching prompts appear correctly
- [ ] Activities show in Daily page with badges
- [ ] Single completion updates both habit and challenge
- [ ] Leaderboard updates in real-time
- [ ] Challenge expires and cleans up properly
- [ ] Edge cases: user leaves circle, rejoins challenge, etc.

## Notes for Admin UI Implementation

When building the challenge creation UI, ensure:
1. Activity canonical names are consistent
2. Start/end dates are in the future
3. Min/max activities are logical (min <= max)
4. Circle assignment is validated
5. Preview before creation
6. Ability to edit upcoming (not active) challenges
7. Analytics on participation and completion rates