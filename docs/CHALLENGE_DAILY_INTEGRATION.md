# Challenge-Daily Integration Plan

## Current State Analysis

### What We Have Implemented:
1. ✅ **Challenge UI in Circle Tab**: Users can view challenges
2. ✅ **Join Flow**: Users select 3-5 activities when joining
3. ✅ **Dashboard**: Shows leaderboard and progress tracking
4. ✅ **Database Schema**: All tables created with proper structure
5. ✅ **Backend Services**: APIs for joining, tracking, leaderboard
6. ✅ **Challenge activities appear in Daily page** (Phase 1 Complete!)
7. ✅ **Visual distinction with purple badge** "⚡ Jing Challenge"
8. ✅ **Completion syncing** - Completing in Daily updates challenge progress

### What's Missing (Phase 2):
1. ❌ **Activity matching/deduplication logic**
2. ❌ **Linking UI for matched activities**
3. ❌ **Smart canonical matching**

## Integration Architecture

### Data Flow:
```
User Joins Challenge → Selected Activities → Daily Page Integration
                                                ↓
                                          Activity Matching
                                                ↓
                                    [Match Found?] → Link to Existing
                                          ↓
                                    [No Match] → Create New Daily Item
                                          ↓
                                    User Completes in Daily
                                          ↓
                                    Update Challenge Progress
```

## Implementation Steps

### Step 1: Extend ActionItem Type
```typescript
// In dailySlice.ts
export type ActionItem = {
  // ... existing fields ...
  challengeId?: string;        // If from a challenge
  challengeActivityId?: string; // The specific activity in challenge
  challengeParticipantId?: string; // To track completions
  challengeName?: string;      // For display
  isFromChallenge?: boolean;   // Quick flag
};
```

### Step 2: Activity Matching Logic

When user joins challenge, for each selected activity:

1. **Check Exact Title Match**:
   ```typescript
   const existingAction = actions.find(a => 
     a.title.toLowerCase() === activity.title.toLowerCase()
   );
   ```

2. **Check Canonical Match**:
   ```typescript
   const canonicalMatch = actions.find(a => 
     a.canonical_name === activity.canonical_name
   );
   ```

3. **User Decision Modal**:
   - If match found: "You already have '{title}' in your daily routine. Link them?"
   - Options: [Link Activities] [Keep Separate]

### Step 3: Modify fetchDailyActions

```typescript
fetchDailyActions: async () => {
  // 1. Fetch regular daily actions
  const regularActions = await backendService.getDailyActions();
  
  // 2. Fetch challenge activities for user
  const challengeActivities = await backendService.getUserChallengeActivities();
  
  // 3. Merge without duplicates (respecting user's linking choices)
  const mergedActions = mergeActionsWithChallenges(
    regularActions, 
    challengeActivities
  );
  
  set({ actions: mergedActions });
}
```

### Step 4: Visual Distinction in Daily Page

```typescript
// In DailyScreen.tsx - Action Item Component
{action.isFromChallenge && (
  <View style={styles.challengeBadge}>
    <Text style={styles.challengeBadgeText}>
      ⚡ {action.challengeName}
    </Text>
  </View>
)}
```

### Step 5: Completion Syncing

```typescript
toggleAction: async (id) => {
  const action = get().actions.find(a => a.id === id);
  
  // Regular completion
  await backendService.completeAction(id);
  
  // If it's a challenge activity, also record challenge completion
  if (action?.challengeParticipantId && action?.challengeActivityId) {
    await backendService.recordChallengeActivity(
      action.challengeParticipantId,
      action.challengeActivityId,
      id // Link to the daily action
    );
  }
}
```

## Database Updates Needed

### 1. Add linking table:
```sql
CREATE TABLE challenge_activity_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES challenge_participants(id),
  challenge_activity_id UUID REFERENCES challenge_activities(id),
  daily_action_id UUID REFERENCES actions(id),
  link_type VARCHAR(20) DEFAULT 'manual', -- 'manual', 'auto', 'separate'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(participant_id, challenge_activity_id)
);
```

### 2. Update challenge_completions:
```sql
ALTER TABLE challenge_completions
ADD COLUMN daily_action_id UUID REFERENCES actions(id);
```

## Backend API Updates

### 1. New Endpoint: Get User's Challenge Activities
```typescript
GET /api/users/:userId/challenge-activities
Response: {
  activities: [{
    id: string,
    challengeId: string,
    challengeName: string,
    activityId: string,
    title: string,
    icon: string,
    participantId: string,
    linkedActionId?: string // If already linked
  }]
}
```

### 2. New Endpoint: Link/Unlink Activities
```typescript
POST /api/challenge-activities/link
Body: {
  participantId: string,
  challengeActivityId: string,
  dailyActionId: string,
  linkType: 'manual' | 'auto'
}
```

### 3. Update Complete Action
```typescript
POST /api/actions/:id/complete
// Should also check if this action is linked to any challenges
// and update challenge progress automatically
```

## UI Components Needed

### 1. Activity Match Modal
```typescript
<ActivityMatchModal
  visible={showMatchModal}
  existingAction={matchedAction}
  challengeActivity={selectedActivity}
  onLink={() => linkActivities()}
  onKeepSeparate={() => createSeparate()}
/>
```

### 2. Challenge Badge Component
```typescript
<ChallengeBadge 
  challengeName="Jing Challenge"
  daysRemaining={15}
/>
```

## Testing Scenarios

1. **New User Flow**:
   - Join challenge with 5 activities
   - All appear in Daily page
   - Complete 3 → 100% daily progress
   - Check leaderboard updates

2. **Existing User with Matches**:
   - Has "Meditation" in daily routine
   - Joins challenge with "Meditation"
   - Gets prompt to link
   - Single completion counts for both

3. **Edge Cases**:
   - User leaves challenge mid-way
   - User rejoins same challenge
   - Challenge ends - activities removed?
   - User has multiple challenges

## Phase 1 Implementation (COMPLETED ✅)

### Files Modified:
1. **`src/state/slices/dailySlice.ts`**:
   - Extended `ActionItem` type with challenge fields
   - Modified `fetchDailyActions` to fetch and merge challenge activities
   - Updated `toggleAction` to handle challenge completions

2. **`src/services/supabase.challenges.service.ts`**:
   - Added `getUserChallengeActivities()` method
   - Fetches all active challenge participations for user

3. **`src/services/backend.service.ts`**:
   - Added wrapper for `getUserChallengeActivities()`

4. **`src/features/daily/DailyScreen.tsx`**:
   - Added purple challenge badge display
   - Shows challenge icon next to activity title
   - Styled with distinctive purple color scheme

### How It Works:
1. User joins challenge in Circle tab, selects 3-5 activities
2. `fetchDailyActions` now fetches both regular actions AND challenge activities
3. Challenge activities display with "⚡ Jing Challenge" badge
4. When user completes challenge activity, it calls `recordChallengeActivity`
5. Challenge progress updates automatically in leaderboard

### Testing Checklist:
- [x] Join challenge with 3-5 activities
- [x] Activities appear in Daily page with badge
- [x] Completing activity updates challenge progress
- [x] Leaderboard reflects completions
- [ ] Multiple days of completions tracked correctly
- [ ] Streak calculation works

## Priority Order

1. **Phase 1** (MVP - COMPLETED):
   - ✅ Add challenge activities to Daily page
   - ✅ Basic completion syncing
   - ✅ Visual badge for challenge items

2. **Phase 2** (In Progress):
   - Activity matching/linking
   - Deduplication logic
   - Link management UI

3. **Phase 3** (Future):
   - Smart canonical matching
   - Bulk linking options
   - Historical challenge data

## Current Blockers

1. Need to decide: When challenge ends, do activities stay in Daily?
2. How to handle if user is in multiple challenges with same activity?
3. Should linked activities show combined streaks?

## Next Immediate Steps

1. Extend `ActionItem` type in `dailySlice.ts`
2. Create backend endpoint for fetching user's challenge activities
3. Modify `fetchDailyActions` to include challenge activities
4. Add challenge badge to Daily page UI
5. Implement completion syncing