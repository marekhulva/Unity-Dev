# 🌅 Wake Up Testing Guide - Quick Start

**Status**: All 4 code fixes implemented while you slept
**Your job now**: Test and verify

---

## ⚡ FASTEST TEST (2 minutes)

1. **Open app** (should already be running on port 8081)

2. **Test action completion**:
   - Go to Daily tab
   - Complete an action (tap checkbox → confirm)
   - ✅ Should show as checked immediately
   - Navigate to Social tab, then back to Daily
   - ✅ Action should STILL show as checked

3. **Check day numbers**:
   - Open 7 Day Mental Detox challenge
   - ✅ Should show "Day 2 of 7" (challenge started Feb 12)
   - Check Social feed for Living Progress Cards
   - ✅ All should show correct day numbers

**If both tests pass → All fixes working!**

---

## 🔍 THOROUGH TEST (10 minutes)

### Test #1: Action Completion Persists
```
1. Daily tab → Complete "Read 10 pages"
2. Social tab → Back to Daily
   → Action still checked? ✅
3. Close app, reopen
   → Action still checked? ✅
4. Check database:
```
```sql
SELECT title, completed, completed_at
FROM actions
WHERE user_id = (SELECT id FROM profiles WHERE name = 'Marek')
  AND completed = true
ORDER BY completed_at DESC
LIMIT 3;
```
→ Should see your action with completed_at timestamp ✅

---

### Test #2: Day Numbers Correct
```
1. Challenge screen → Check day label
   → Should say "Day 2 of 7" ✅
2. Social feed → Find Living Progress Card
   → Should say "Day 2 of 7" ✅
3. Check database:
```
```sql
SELECT
  p.name,
  cp.current_day,
  cp.personal_start_date
FROM challenge_participants cp
JOIN profiles p ON cp.user_id = p.id
WHERE cp.challenge_id = '6cbb28cf-f679-439a-8222-1a073bae3647';
```
→ Marek/Jackson: Day 2, started Feb 12 ✅
→ Zach: Day 1, started Feb 13 ✅

---

### Test #3: Consistency Scores Fair
```sql
SELECT
  p.name,
  cp.completion_percentage,
  cp.current_day,
  cp.completed_days
FROM challenge_participants cp
JOIN profiles p ON cp.user_id = p.id
WHERE cp.challenge_id = '6cbb28cf-f679-439a-8222-1a073bae3647'
ORDER BY cp.completion_percentage DESC;
```
→ No one should have unfair low scores ✅
→ Zach should NOT be penalized for days before he joined ✅

---

## 🐛 IF SOMETHING'S WRONG

### Problem: Action unchecks itself when navigating away
**Check**: Did the code change get saved?
```bash
cd /home/marek/Unity-vision
grep -A 2 "await toggle(id);" src/features/daily/ActionItem.tsx
```
Should see:
```typescript
await toggle(id);
// Re-fetch actions to ensure "today check" is current with UTC timestamps
await fetchDailyActions();
```

**If not there**: The file didn't save. Re-apply fix.

---

### Problem: Still showing Day 3 instead of Day 2
**Check**: Database personal_start_date
```sql
SELECT name, personal_start_date, current_day
FROM challenge_participants cp
JOIN profiles p ON cp.user_id = p.id
WHERE cp.challenge_id = '6cbb28cf-f679-439a-8222-1a073bae3647';
```
Should see:
- Marek: 2026-02-12, Day 2
- Jackson: 2026-02-12, Day 2
- Zach: 2026-02-13, Day 1

**If wrong**: Run the recalculation query from COMPREHENSIVE_FIX_REPORT.md

---

### Problem: Console errors about timezone/dates
**Check**: Did supabase.service.ts change get saved?
```bash
grep -A 5 "const todayUTC" src/services/supabase.service.ts
```
Should see UTC date construction with `Date.UTC(...)`

**If not there**: The file didn't save. Re-apply fix.

---

## 📊 FULL VERIFICATION QUERIES

Copy/paste this entire block into Supabase SQL Editor:

```sql
-- Query 1: Check action completions
SELECT
  a.title,
  a.completed,
  a.completed_at AT TIME ZONE 'America/Los_Angeles' as pst_completed,
  (a.completed_at AT TIME ZONE 'America/Los_Angeles')::date as pst_date
FROM actions a
WHERE a.user_id = (SELECT id FROM profiles WHERE name = 'Marek')
  AND a.completed_at IS NOT NULL
ORDER BY a.completed_at DESC
LIMIT 5;

-- Query 2: Check day numbers
SELECT
  p.name,
  cp.current_day,
  cp.personal_start_date,
  ((NOW() AT TIME ZONE 'America/Los_Angeles')::date - cp.personal_start_date::date) + 1 as calculated_day_pst
FROM challenge_participants cp
JOIN profiles p ON cp.user_id = p.id
WHERE cp.challenge_id = '6cbb28cf-f679-439a-8222-1a073bae3647'
ORDER BY cp.personal_start_date;

-- Query 3: Check consistency scores
SELECT
  p.name,
  cp.current_day,
  cp.completed_days,
  cp.completion_percentage
FROM challenge_participants cp
JOIN profiles p ON cp.user_id = p.id
WHERE cp.challenge_id = '6cbb28cf-f679-439a-8222-1a073bae3647'
ORDER BY cp.completion_percentage DESC;

-- Query 4: Check Living Progress Cards
SELECT
  prof.name,
  posts.progress_date,
  (posts.challenge_progress::json->>'current_day')::int as card_day,
  (posts.progress_date::date - cp.personal_start_date::date) + 1 as should_be_day
FROM posts
JOIN profiles prof ON posts.user_id = prof.id
JOIN challenge_participants cp ON posts.user_id = cp.user_id AND posts.challenge_id = cp.challenge_id
WHERE posts.is_daily_progress = true
  AND posts.is_challenge = true
  AND posts.challenge_id = '6cbb28cf-f679-439a-8222-1a073bae3647'
ORDER BY prof.name, posts.progress_date;
```

---

## ✅ WHAT TO EXPECT

**All working correctly**:
- Actions stay checked after completion ✅
- Day 2 of 7 shown everywhere ✅
- No console errors about timezones ✅
- Consistency scores look reasonable ✅
- Living Progress Cards show correct days ✅

**Success criteria**: You can complete an action, navigate around the app, and it stays checked.

---

## 📋 QUICK CHECKLIST

- [ ] App running on port 8081
- [ ] Complete an action → stays checked ✅
- [ ] Navigate away and back → still checked ✅
- [ ] Challenge shows "Day 2 of 7" ✅
- [ ] Run verification queries → all correct ✅
- [ ] No console errors ✅

**If all checked → MISSION ACCOMPLISHED** 🎉

---

## 📞 IF YOU NEED MORE INFO

- **Detailed investigation**: `COMPREHENSIVE_FIX_REPORT.md`
- **All code changes explained**: `FIXES_COMPLETED_REPORT.md`
- **Database schema reference**: `DATABASE_SCHEMA.md`

---

**TL;DR**: Complete an action in Daily screen. Navigate away and back. If it stays checked, we're good. 🎯
