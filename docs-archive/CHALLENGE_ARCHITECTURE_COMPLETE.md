# 🏆 Challenge System - Complete Technical Documentation
*Last Updated: August 29, 2025*

## 🎯 Purpose
This document provides complete technical documentation of the Challenge system architecture, data flow, and troubleshooting guide. Written so any engineer can understand and debug the system immediately.

---

## 📊 System Overview

### What is the Challenge System?
- Group-based challenges where users select and track daily activities
- Users can link challenge activities to existing habits
- Each activity can have a scheduled time
- Progress tracked via leaderboard and completion percentages

### Key Components
1. **Join Flow**: Select activities → Link to existing (optional) → Set times → Join
2. **Daily Display**: Shows challenge activities with scheduled times
3. **Tracking**: Mark activities complete, update streaks
4. **Leaderboard**: Ranks participants by consistency

---

## 🔄 Complete Data Flow

### 1. Challenge Join Flow

```
User clicks "Join Challenge"
    ↓
JoinChallengeModal opens
    ↓
User selects activities (min-max required)
    ↓
Clicks "Join Challenge" button
    ↓
ActivityLinkingModal opens (optional - can skip)
    ↓
TimeSetupModal opens (sets times for NEW activities)
    ↓
handleTimeSetupComplete() called
    ↓
joinChallenge() creates participant record
    ↓
⚠️ CRITICAL: 500ms delay (race condition fix)
    ↓
getMyParticipation() fetches participant
    ↓
updateParticipantActivityTimes() saves times
    ↓
fetchDailyActions() refreshes UI
```

### 2. Data Storage Flow

```
Frontend State (Zustand)
    ↓
Backend Service Layer (router)
    ↓
Supabase Challenge Service
    ↓
PostgreSQL Database
```

---

## 🗄️ Database Schema

### challenge_participants
```sql
CREATE TABLE challenge_participants (
    id UUID PRIMARY KEY,
    challenge_id UUID REFERENCES challenges(id),
    user_id UUID REFERENCES profiles(id),
    selected_activity_ids TEXT[], -- Array of activity IDs
    linked_action_ids TEXT[],     -- Maps to existing user actions
    activity_times JSONB,          -- Stores scheduled times
    total_completions INTEGER DEFAULT 0,
    consistency_percentage NUMERIC DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    joined_at TIMESTAMP DEFAULT NOW()
);
```

### activity_times Format
```json
[
    {
        "activity_id": "uuid-here",
        "scheduled_time": "9:00 AM"
    }
]
```

---

## 🧩 Key Components

### Frontend Components

#### JoinChallengeModal (`src/features/challenges/JoinChallengeModal.tsx`)
- **Purpose**: Main modal for joining challenges
- **State**: 
  - `selectedActivities`: Set of selected activity IDs
  - `showLinkingModal`: Controls ActivityLinkingModal
  - `showTimeSetupModal`: Controls TimeSetupModal
- **Critical Code**:
  ```typescript
  // Line 187 - CRITICAL: Must check all modals
  if (!visible && !showLinkingModal && !showTimeSetupModal) return null;
  ```

#### TimeSetupModal (`src/features/challenges/TimeSetupModal.tsx`)
- **Purpose**: Set scheduled times for activities
- **Key Functions**:
  - `handleComplete()`: Collects times for NEW activities only
  - `formatTime()`: Converts Date to "HH:MM AM/PM" string
- **Critical Issue Fixed**: Default times initialization in useEffect

#### ActivityLinkingModal (`src/features/challenges/ActivityLinkingModal.tsx`)
- **Purpose**: Link challenge activities to existing habits
- **Output**: `Record<activityId, actionId>` mapping

### Backend Services

#### supabase.challenges.service.ts
Key methods:
- `joinChallenge()`: Creates participant record
- `getMyParticipation()`: Fetches current user's participation
- `updateParticipantActivityTimes()`: Saves activity times
- `getUserParticipations()`: Gets all participations with activities

#### challengeSlice.ts (Zustand)
- `joinChallenge()`: Orchestrates join flow
- `loadChallenge()`: Loads challenge data
- Returns only `true/false`, not participant data

#### dailySlice.ts
- `fetchDailyActions()`: Loads regular + challenge activities
- Maps `activity_times` to activities for display
- Creates action items with time property

---

## 🐛 Common Issues & Solutions

### Issue 1: Times Not Saving
**Symptom**: Activities appear but without scheduled times

**Root Causes**:
1. **Race Condition**: Participant fetch happens before DB commit
   - **Solution**: Added 500ms delay before fetching
   ```typescript
   await new Promise(resolve => setTimeout(resolve, 500));
   const participant = await supabaseChallengeService.getMyParticipation(challenge.id);
   ```

2. **Modal Not Showing**: Component returns null too early
   - **Solution**: Check all modal states
   ```typescript
   if (!visible && !showLinkingModal && !showTimeSetupModal) return null;
   ```

3. **Times Not Initialized**: Empty state on mount
   - **Solution**: Initialize in useEffect when activities change

### Issue 2: Activities Not Appearing
**Symptom**: Challenge joined but activities don't show on Daily page

**Causes**:
1. Missing `fetchDailyActions()` on mount
2. Incorrect field mapping (display_name vs title)
3. Missing activity_times column in DB

### Issue 3: Cannot Join Challenge
**Symptom**: Join button doesn't work or errors

**Check**:
1. User has joined a circle/group first
2. Min/max activity selection limits
3. Network/auth issues

---

## 🔍 Debugging Guide

### Essential Logs to Check
```javascript
// Join flow started
'🔴 [TIME FLOW] Step 1: Join button clicked'
'🔴 [TIME FLOW] Step 2: After linking modal'
'🔴 [TIME FLOW] Step 3: TimeSetupModal rendered'
'🔴 [TIME FLOW] Step 4: Continue clicked'
'🔴 [TIME FLOW] Step 5: Joining challenge'

// Critical save points
'🔴🔴🔴 [SAVING] Participant:'
'🔴🔴🔴 [SAVE TIMES] Times to save:'

// Data loading
'📊 [CHALLENGES] Participation activity_times:'
'⏰ [ACTIONS] Scheduled time for this activity:'
```

### SQL Queries for Debugging
```sql
-- Check if times are saved
SELECT id, user_id, activity_times, 
       jsonb_array_length(COALESCE(activity_times, '[]'::jsonb)) as num_times
FROM challenge_participants
ORDER BY joined_at DESC;

-- See actual times content
SELECT id, jsonb_pretty(activity_times) as formatted_times
FROM challenge_participants
WHERE activity_times IS NOT NULL AND activity_times != '[]'::jsonb;
```

---

## 🔧 Quick Fixes

### Clear All Logs
Remove excessive logging that clutters console:
1. Search for `console.log` with regex
2. Keep only critical flow logs (🔴 markers)
3. Remove data dump logs

### Force Refresh Data
```javascript
// In browser console
window.location.reload(true);

// Or in code
await fetchDailyActions();
await loadChallenge(challengeId);
```

### Reset User's Challenge
```sql
-- Remove participant to let them rejoin
DELETE FROM challenge_participants 
WHERE user_id = 'user-uuid' AND challenge_id = 'challenge-uuid';
```

---

## 📁 File Structure

```
src/
├── features/
│   ├── challenges/
│   │   ├── JoinChallengeModal.tsx      # Main join flow
│   │   ├── TimeSetupModal.tsx          # Time selection
│   │   ├── ActivityLinkingModal.tsx    # Link to existing
│   │   └── ChallengeCard.tsx           # Display card
│   └── daily/
│       ├── DailyScreen.tsx             # Shows activities
│       └── ActionItem.tsx              # Activity display
├── services/
│   ├── supabase.challenges.service.ts  # Challenge API
│   ├── backend.service.ts              # Service router
│   └── supabase.service.ts             # Base Supabase
└── state/
    ├── slices/
    │   ├── challengeSlice.ts           # Challenge state
    │   └── dailySlice.ts               # Daily actions state
    └── rootStore.ts                     # Zustand store
```

---

## 🚀 Testing Checklist

When testing challenge features:

- [ ] Create new user account
- [ ] Join a circle/group
- [ ] Open challenge modal
- [ ] Select activities (check min/max)
- [ ] Skip or complete linking
- [ ] Set times (check if picker works)
- [ ] Click Continue
- [ ] Verify activities appear on Daily
- [ ] Verify times are displayed
- [ ] Check database has activity_times

---

## 💡 Key Insights

1. **Race conditions are common** with Supabase - add delays when needed
2. **Modal visibility logic** must account for all sub-modals
3. **State initialization** in React hooks can be tricky with props
4. **Field naming inconsistencies** (display_name vs title) cause issues
5. **Always check logs** before adding more - they reveal the issue

---

## 📞 Support

For issues not covered here:
1. Check logs for 🔴 markers
2. Verify database schema matches
3. Test with fresh user account
4. Check network tab for API errors

---

*This documentation reflects the system state after fixing the activity times save issue on August 29, 2025*