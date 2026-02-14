# 🚨 Challenge System - Quick Debug Guide
*For when things aren't working and you need to fix them FAST*

## 🔴 Emergency Checklist

### "Times aren't saving!"
1. **Check the logs for this exact line:**
   ```
   🔴🔴🔴 [SAVING] Participant: {should NOT be undefined}
   ```
   If undefined → Race condition issue → Check line 156 in JoinChallengeModal

2. **Verify database column exists:**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'challenge_participants' 
   AND column_name = 'activity_times';
   ```
   If missing → Run: `ALTER TABLE challenge_participants ADD COLUMN activity_times JSONB DEFAULT '[]'::jsonb;`

3. **Check the 500ms delay is present:**
   File: `src/features/challenges/JoinChallengeModal.tsx`
   Line: 156
   ```typescript
   await new Promise(resolve => setTimeout(resolve, 500));
   ```

### "Activities not showing on Daily!"
1. **Quick SQL check:**
   ```sql
   SELECT * FROM challenge_participants 
   WHERE user_id = 'YOUR_USER_ID' 
   AND activity_times != '[]'::jsonb;
   ```

2. **Force refresh in browser console:**
   ```javascript
   window.location.reload();
   ```

3. **Check fetchDailyActions is called:**
   Look for: `🟦 [ACTIONS] fetchDailyActions called`

### "Modal not appearing!"
Check line 187 in JoinChallengeModal:
```typescript
// ALL THREE must be checked!
if (!visible && !showLinkingModal && !showTimeSetupModal) return null;
```

## 📍 Critical File Locations

| What | Where | Line |
|------|-------|------|
| Join flow orchestration | `src/features/challenges/JoinChallengeModal.tsx` | 144-182 |
| Race condition fix | `src/features/challenges/JoinChallengeModal.tsx` | 156 |
| Modal visibility check | `src/features/challenges/JoinChallengeModal.tsx` | 187 |
| Time collection | `src/features/challenges/TimeSetupModal.tsx` | 106-124 |
| Save times to DB | `src/services/supabase.challenges.service.ts` | 472-495 |
| Display on Daily | `src/features/daily/DailyScreen.tsx` | 538-543 |

## 🔍 Console Log Meanings

```
🔴 [TIME FLOW] Step X → Tracking join flow progress
🔴🔴🔴 [SAVING] → CRITICAL: Check if participant exists!
🔴🔴🔴 [SAVE TIMES] → Database save operation
📊 [CHALLENGES] → Challenge data operations
🟦 [ACTIONS] → Daily actions being fetched
⏰ [ACTIONS] → Time-specific operations
```

## 💊 Quick Fixes

### Fix 1: Activities exist but no times
```sql
-- Check what's in activity_times
SELECT id, jsonb_pretty(activity_times) 
FROM challenge_participants 
WHERE user_id = 'USER_ID';

-- If empty, the save failed - check race condition
```

### Fix 2: Complete fresh start
```bash
# 1. Clear browser cache
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# 2. Create new test account
test+[timestamp]@example.com

# 3. Join test group
Group code: TEST123
```

### Fix 3: Manual time update (emergency)
```sql
UPDATE challenge_participants
SET activity_times = '[
  {"activity_id": "activity_1", "scheduled_time": "09:00"},
  {"activity_id": "activity_2", "scheduled_time": "14:00"}
]'::jsonb
WHERE id = 'PARTICIPANT_ID';
```

## 🎯 Testing Flow (2 minutes)

1. Open browser console
2. Register: `test+[timestamp]@example.com`
3. Join group: `TEST123`
4. Open challenge → Select 3 activities
5. Skip linking → Set times (or use defaults)
6. Click Continue
7. Check Daily page
8. Check console for errors

## ⚡ Performance Check

Too slow? Check:
- Pagination (max 5 items)
- Excessive console.logs
- Failed network requests (Network tab)

## 🔴 If Nothing Works

1. **Check Supabase is up:** https://supabase.com/dashboard
2. **Kill and restart Expo:** Ctrl+C → `PORT=8054 npx expo start --web --port 8054`
3. **Check for TypeScript errors:** `npx tsc --noEmit`
4. **Last resort:** Check git history for working version

## 📱 The Flow That Should Work

```
User Journey:
1. Register/Login
2. Join Circle (group)
3. Open Challenge
4. Select Activities ← Check: selectedActivities Set has items
5. Link Activities (optional)
6. Set Times ← Check: timeStrings object populated
7. Join Challenge ← Check: Returns true
8. Save Times ← Check: participant NOT undefined!
9. View Daily ← Check: Activities appear with times
```

## 🚦 Success Indicators

✅ No undefined participant errors
✅ `updateParticipantActivityTimes` called
✅ `fetchDailyActions` triggered after save
✅ Activities appear on Daily with times
✅ Times persist after refresh

---

*Keep this guide handy - it will save you hours of debugging!*