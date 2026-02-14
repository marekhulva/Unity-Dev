# Testing Guide: Double-Tap Duplicate Prevention

## Quick Verification Checklist

### 1. Frontend Debounce Test
**Goal:** Verify rapid taps are blocked

**Steps:**
1. Open app and navigate to Daily page
2. Find an incomplete action (not yet checked off)
3. Tap the action twice in quick succession (< 500ms)
4. Open browser console or React Native debugger

**Expected Result:**
- Only ONE modal opens
- Console shows: `🚫 [DAILY] Debouncing rapid tap ( XXX ms)`
- Second tap has no effect

### 2. Modal Double-Submit Test
**Goal:** Verify submission flag prevents duplicate API calls

**Steps:**
1. Open Daily page
2. Tap an incomplete action to open privacy/abstinence modal
3. Quickly click the submit button twice
4. Watch console logs

**Expected Result:**
- Console shows: `🚫 [DAILY] Already submitting action: <action-id>`
- Only ONE completion is recorded
- Leaderboard/streak updates only once

### 3. Network Delay Simulation Test
**Goal:** Verify protection during slow network conditions

**Steps:**
1. Open Chrome DevTools (F12)
2. Go to Network tab → Throttling → Select "Slow 3G"
3. Navigate to Daily page
4. Complete an action
5. While request is pending, try to complete the same action again

**Expected Result:**
- Console shows: `🚫 [DAILY] Already submitting action: <action-id>`
- Second attempt is blocked
- Database shows only one completion entry

### 4. Database Constraint Test
**Goal:** Verify database-level duplicate prevention

**Steps:**
1. Go to Supabase Dashboard → SQL Editor
2. Find an existing completion:
```sql
SELECT * FROM challenge_completions
WHERE participant_id IS NOT NULL
LIMIT 1;
```
3. Try to insert a duplicate:
```sql
INSERT INTO challenge_completions (
  user_id,
  challenge_id,
  participant_id,
  challenge_activity_id,
  completion_date,
  verification_type
)
VALUES (
  '<user_id from above>',
  '<challenge_id from above>',
  '<participant_id from above>',
  '<challenge_activity_id from above>',
  '<completion_date from above>',
  'honor'
);
```

**Expected Result:**
- Error: `duplicate key value violates unique constraint "unique_participant_activity_date"`
- Constraint is working correctly

## Debugging Console Output

### Successful Protection Logs

**Debounce Protection:**
```
🚫 [DAILY] Debouncing rapid tap ( 237 ms)
```

**Submission Flag Protection:**
```
🎯 [DailyScreen] handlePrivacySelect called: {...}
🚫 [DAILY] Already submitting action: <action-id>
```

**Normal Successful Submission:**
```
🎯 [DailyScreen] handlePrivacySelect called: {...}
✅ [STORE] Recording completion: {...}
🟢 [STORE] Completion recorded successfully
```

## Manual Database Verification

### Check for Duplicates
```sql
SELECT
  participant_id,
  challenge_activity_id,
  completion_date,
  COUNT(*) as duplicate_count
FROM challenge_completions
GROUP BY participant_id, challenge_activity_id, completion_date
HAVING COUNT(*) > 1;
```

**Expected Result:** 0 rows (no duplicates)

### Verify Unique Constraint Exists
```sql
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'challenge_completions'::regclass
  AND conname = 'unique_participant_activity_date';
```

**Expected Result:**
```
constraint_name: unique_participant_activity_date
constraint_type: u (unique)
definition: UNIQUE (participant_id, challenge_activity_id, completion_date)
```

## Known Issues / Limitations

### Not Protected:
- **Different devices:** If same user on 2 devices completes simultaneously, both will succeed (by design - they're separate sessions)
- **Unchecking actions:** Uncompleting an action is not debounced (not needed - it's a local state update)

### Protected:
- ✅ Rapid tapping on same device
- ✅ Modal button double-clicks
- ✅ Network latency race conditions
- ✅ Database-level duplicates
- ✅ Simultaneous API requests

## Rollback Instructions

If you need to disable the fix temporarily:

### 1. Remove Database Constraint
```sql
ALTER TABLE challenge_completions
DROP CONSTRAINT IF EXISTS unique_participant_activity_date;
```

### 2. Revert Frontend Changes
```bash
git diff src/features/daily/DailyScreenOption2.tsx
# Review changes
git checkout src/features/daily/DailyScreenOption2.tsx
```

## Performance Impact

- **Debounce check:** < 1ms (simple timestamp comparison)
- **Submission flag:** < 1ms (state variable check)
- **Database constraint:** 0ms (uses existing index)

**Total overhead:** Negligible (< 2ms per tap)

## Success Criteria

✅ **Fix is successful if:**
1. Rapid tapping (< 500ms) shows debounce console log
2. Double-clicking submit shows "already submitting" log
3. Database shows no duplicate completions
4. Leaderboard positions are accurate
5. Streaks are not inflated

## Questions or Issues?

If the fix isn't working:
1. Check browser console for error messages
2. Verify migration was applied (check constraint exists)
3. Clear app cache and reload
4. Check React Native debugger logs (for mobile)
