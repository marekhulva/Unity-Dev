# Fix for Issue #5: Double-Tap Creates Duplicate Completions

## Problem
Tapping an action twice quickly records it twice in the database, creating inflated streaks and wrong leaderboard positions. This happens because:

1. **Frontend**: No debounce or submission flag prevented rapid taps
2. **Backend**: Duplicate check had a race condition window between checking and inserting

## Solution Implemented

### Frontend Protection (3 layers)
File: `/home/marek/Unity-vision/src/features/daily/DailyScreenOption2.tsx`

1. **Debouncing** (500ms window)
   - Added `lastTapTime` state to track when user last tapped
   - Reject taps within 500ms of previous tap
   - Prevents accidental double-taps

2. **Submission Flag** (per-action)
   - Added `completingActionId` state to track which action is currently being submitted
   - Check if action is already being submitted before allowing new submission
   - Prevents duplicate API calls while first is in flight

3. **Try-Finally Pattern**
   - Wrapped submission logic in try-finally blocks
   - Ensures `completingActionId` is always cleared, even if errors occur
   - Applied to both `handlePrivacySelect` and `handleAbstinenceComplete`

### Backend Protection (Database Level)
File: `/home/marek/Unity-vision/migrations/add-unique-constraint-challenge-completions.sql`

Added unique constraint on `challenge_completions` table:
```sql
UNIQUE (participant_id, challenge_activity_id, completion_date)
```

This prevents duplicate completions at the database level, even if both requests pass the frontend checks and backend query check simultaneously.

## Changes Made

### 1. DailyScreenOption2.tsx

**Added state variables:**
```typescript
const [completingActionId, setCompletingActionId] = useState<string | null>(null);
const [lastTapTime, setLastTapTime] = useState<number>(0);
```

**Modified `handleTaskToggle`:**
- Added 500ms debounce check
- Added submission flag check
- Prevents opening modal if action is already submitting

**Modified `handlePrivacySelect`:**
- Added submission flag check at start
- Set `completingActionId` before submission
- Wrapped logic in try-finally to clear flag

**Modified `handleAbstinenceComplete`:**
- Added submission flag check at start
- Set `completingActionId` before submission
- Wrapped logic in try-finally to clear flag

### 2. Database Migration

**Created:** `migrations/add-unique-constraint-challenge-completions.sql`

This migration:
1. Removes any existing duplicates (keeps earliest completion)
2. Adds unique constraint to prevent future duplicates
3. Documents the constraint with a comment

## Testing Steps

1. **Rapid tap test:**
   - Open Daily page
   - Tap an action twice very quickly (< 500ms apart)
   - Expected: Only one completion recorded
   - Check: Console logs show "Debouncing rapid tap"

2. **Double-click modal test:**
   - Open Daily page
   - Tap action to open modal
   - Click submit button twice quickly
   - Expected: Only one completion recorded
   - Check: Console logs show "Already submitting action"

3. **Network delay test:**
   - Open Daily page with slow network (Chrome DevTools throttling)
   - Tap action, click submit
   - While waiting, try to submit again
   - Expected: Second submit rejected
   - Check: Console logs show "Already submitting action"

4. **Database constraint test:**
   - Manually try to insert duplicate completion via Supabase dashboard
   - Expected: Error from unique constraint violation

## Migration Instructions

### Option 1: Via Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Copy content of `/home/marek/Unity-vision/migrations/add-unique-constraint-challenge-completions.sql`
3. Paste and run

### Option 2: Via psql (if available)
```bash
psql $DATABASE_URL -f migrations/add-unique-constraint-challenge-completions.sql
```

## Rollback Plan

If issues occur, you can remove the unique constraint:

```sql
ALTER TABLE challenge_completions
DROP CONSTRAINT IF EXISTS unique_participant_activity_date;
```

## Performance Impact

- **Frontend**: Negligible - just timestamp comparison and state checks
- **Backend**: None - constraint uses existing index
- **Database**: The unique constraint uses the existing index `idx_challenge_completions_participant_activity`, so no performance penalty

## Related Files

- `/home/marek/Unity-vision/src/features/daily/DailyScreenOption2.tsx` - Frontend protection
- `/home/marek/Unity-vision/src/services/supabase.challenges.service.ts` - Backend duplicate check (lines 1086-1096)
- `/home/marek/Unity-vision/migrations/add-unique-constraint-challenge-completions.sql` - Database constraint

## Notes

- The backend already had a duplicate check (line 1086-1096 in `supabase.challenges.service.ts`), but it had a race condition window
- The unique constraint closes this race condition window completely
- Frontend debouncing improves UX by providing immediate feedback
- All three layers together ensure no duplicates can ever be created
