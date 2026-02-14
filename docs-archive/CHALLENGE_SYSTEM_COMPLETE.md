# Challenge System - Complete Technical Documentation
*Last Updated: August 29, 2025*

## 🎯 Overview
The Challenge System allows users to join group challenges, select activities, set scheduled times, and track progress on the Daily page. This document covers the entire implementation including the fix for activity times not saving.

## 📊 Data Flow Architecture

### User Journey
1. User joins a group (Circle)
2. User opens challenge from group
3. User selects activities to track
4. User optionally links activities to existing habits
5. User sets scheduled times for activities
6. User completes join flow
7. Activities with times appear on Daily page

### Technical Flow
```
JoinChallengeModal
    ↓ (selects activities)
ActivityLinkingModal (optional)
    ↓ (links to habits)
TimeSetupModal
    ↓ (sets times)
supabaseChallengeService.joinChallenge()
    ↓ (creates participant record)
supabaseChallengeService.updateParticipantActivityTimes()
    ↓ (saves times to DB)
dailySlice.fetchDailyActions()
    ↓ (fetches updated actions)
DailyScreen (displays activities with times)
```

## 🗄️ Database Schema

### challenge_participants
```sql
CREATE TABLE challenge_participants (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    challenge_id UUID REFERENCES challenges(id),
    selected_activities TEXT[], -- Array of activity IDs
    activity_times JSONB DEFAULT '[]'::jsonb, -- NEW: Stores scheduled times
    joined_at TIMESTAMP,
    created_at TIMESTAMP
);
```

### activity_times JSONB Structure
```json
[
    {
        "activity_id": "activity_1",
        "scheduled_time": "09:00"
    },
    {
        "activity_id": "activity_2",
        "scheduled_time": "14:30"
    }
]
```

## 🔧 Key Components & Files

### 1. JoinChallengeModal.tsx
**Location:** `src/features/challenges/JoinChallengeModal.tsx`

**Critical Functions:**
- `handleJoinChallenge()` (line 144-182)
  - Orchestrates the entire join flow
  - **CRITICAL FIX:** Added 500ms delay to handle race condition
  ```typescript
  // Line 156 - Race condition fix
  await new Promise(resolve => setTimeout(resolve, 500));
  const participant = await supabaseChallengeService.getMyParticipation(challenge.id);
  ```

**Modal Visibility Fix (line 187):**
```typescript
// Must check ALL three modals
if (!visible && !showLinkingModal && !showTimeSetupModal) return null;
```

### 2. TimeSetupModal.tsx
**Location:** `src/features/challenges/TimeSetupModal.tsx`

**Key Features:**
- Collects scheduled times for each activity
- Initializes default times (9:00 AM)
- Filters to only save times for non-linked activities

**Critical useEffect (line 28-39):**
```typescript
React.useEffect(() => {
  if (activities && activities.length > 0) {
    const defaultTimes: Record<string, Date> = {};
    activities.forEach(activity => {
      const defaultTime = new Date();
      defaultTime.setHours(9, 0, 0, 0);
      defaultTimes[activity.id] = defaultTime;
    });
    setActivityTimes(defaultTimes);
  }
}, [activities]);
```

### 3. supabase.challenges.service.ts
**Location:** `src/services/supabase.challenges.service.ts`

**New Method - updateParticipantActivityTimes (line 472-495):**
```typescript
async updateParticipantActivityTimes(
  participantId: string, 
  times: Record<string, string>
) {
  const activityTimes = Object.entries(times).map(([activityId, time]) => ({
    activity_id: activityId,
    scheduled_time: time
  }));
  
  const { data, error } = await supabase
    .from('challenge_participants')
    .update({ activity_times: activityTimes })
    .eq('id', participantId)
    .select();
    
  return data?.[0];
}
```

### 4. DailyScreen.tsx
**Location:** `src/features/daily/DailyScreen.tsx`

**Display Logic (line 538-543):**
```typescript
{challengeActivities.length > 0 && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Challenge Activities</Text>
    {challengeActivities.map(renderActionItem)}
  </View>
)}
```

## 🐛 Common Issues & Solutions

### Issue 1: Times Not Saving
**Symptom:** User sets times but they don't appear on Daily page

**Root Cause:** Race condition - participant record not immediately available after join

**Solution:** Added 500ms delay in JoinChallengeModal:
```typescript
await new Promise(resolve => setTimeout(resolve, 500));
```

### Issue 2: Modal Not Appearing
**Symptom:** TimeSetupModal never shows

**Root Cause:** Component returning null too early

**Solution:** Check all three modal states:
```typescript
if (!visible && !showLinkingModal && !showTimeSetupModal) return null;
```

### Issue 3: Activities Not Showing
**Symptom:** Challenge activities don't appear on Daily page

**Root Cause:** Database column missing or data not refreshing

**Solution:** 
1. Ensure activity_times column exists
2. Call fetchDailyActions after saving

### Issue 4: Field Name Confusion
**Symptom:** Activities show "undefined" as title

**Root Cause:** Inconsistent field names (display_name vs title)

**Solution:** Use correct field for each activity type:
- Challenge activities: `display_name`
- Regular actions: `title`

## 🔍 Debugging Guide

### Console Log Markers
| Marker | Meaning | Location |
|--------|---------|----------|
| 🔴 [TIME FLOW] | Join flow steps | JoinChallengeModal |
| 🔴🔴🔴 [SAVING] | Critical save operations | JoinChallengeModal |
| 🔴🔴🔴 [SAVE TIMES] | Time saving to DB | supabase.challenges.service |
| 📊 [CHALLENGES] | Challenge data ops | challengeSlice |
| 🟦 [ACTIONS] | Daily actions loading | dailySlice |
| ⏰ [ACTIONS] | Time-related ops | dailySlice |

### SQL Debugging Queries

**Check if participant has times:**
```sql
SELECT id, activity_times 
FROM challenge_participants 
WHERE user_id = 'USER_ID';
```

**View formatted activity times:**
```sql
SELECT jsonb_pretty(activity_times) 
FROM challenge_participants 
WHERE id = 'PARTICIPANT_ID';
```

**Check all participants in a challenge:**
```sql
SELECT 
    cp.id,
    u.email,
    cp.selected_activities,
    cp.activity_times,
    cp.joined_at
FROM challenge_participants cp
JOIN users u ON u.id = cp.user_id
WHERE cp.challenge_id = 'CHALLENGE_ID'
ORDER BY cp.joined_at DESC;
```

**Count participants with/without times:**
```sql
SELECT 
    COUNT(*) as total_participants,
    COUNT(CASE WHEN activity_times != '[]'::jsonb THEN 1 END) as with_times,
    COUNT(CASE WHEN activity_times = '[]'::jsonb THEN 1 END) as without_times
FROM challenge_participants
WHERE challenge_id = 'CHALLENGE_ID';
```

## 📝 Testing Checklist

1. **Fresh User Test:**
   - [ ] Create new account
   - [ ] Join group (Circle)
   - [ ] Open challenge
   - [ ] Select 3 activities
   - [ ] Skip linking (or link some)
   - [ ] Set custom times
   - [ ] Complete join
   - [ ] Verify activities appear on Daily
   - [ ] Verify times are displayed

2. **Console Verification:**
   - [ ] No undefined participant errors
   - [ ] updateParticipantActivityTimes called
   - [ ] fetchDailyActions called after save
   - [ ] No field name errors

3. **Database Verification:**
   - [ ] Participant record exists
   - [ ] activity_times column populated
   - [ ] Times match what user selected

## 🚀 Implementation Timeline

### Phase 1: Initial Implementation ✅
- Basic challenge join flow
- Activity selection
- Database structure

### Phase 2: Activity Linking ✅
- Link challenge activities to existing habits
- Skip duplicates

### Phase 3: Time Scheduling ✅
- TimeSetupModal component
- Store scheduled times
- Display on Daily page

### Phase 4: Bug Fixes (Aug 29, 2025) ✅
- Fixed race condition
- Fixed modal visibility
- Added activity_times column
- Fixed field name issues

## 💡 Key Learnings

1. **Race Conditions:** Always consider timing when chaining async operations
2. **Modal State Management:** Check all relevant states when determining visibility
3. **Database Migrations:** Always verify columns exist before using them
4. **Field Naming:** Maintain consistency between frontend (camelCase) and backend (snake_case)
5. **Debugging:** Use targeted logging at critical points in data flow

## 📌 Quick Reference

### Add activity_times column if missing:
```sql
ALTER TABLE challenge_participants
ADD COLUMN IF NOT EXISTS activity_times JSONB DEFAULT '[]'::jsonb;
```

### Force refresh Daily actions:
```javascript
await store.getState().fetchDailyActions();
```

### Check participant data:
```javascript
const participant = await supabaseChallengeService.getMyParticipation(challengeId);
console.log('Participant:', participant);
console.log('Activity times:', participant?.activity_times);
```

---

*This documentation reflects the working state after fixing the activity times issue on August 29, 2025*