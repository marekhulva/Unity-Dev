# 🔧 Quick Debugging Reference Guide

## 🚨 Emergency Fixes

### "Activities not showing on Daily page"
```bash
# Check 1: Are they in the database?
SELECT * FROM challenge_participants WHERE user_id = 'USER_ID';

# Check 2: Is fetchDailyActions being called?
# Look for: '🟦 [ACTIONS] fetchDailyActions called'

# Fix: Force refresh
window.location.reload();
```

### "Times not saving"
```bash
# Check logs for:
'🔴🔴🔴 [SAVING] Participant:' # Should NOT be undefined
'🔴🔴🔴 [SAVE TIMES] updateParticipantActivityTimes called'

# Fix: Check race condition delay exists (500ms)
# File: JoinChallengeModal.tsx, line ~156
```

### "Modal not appearing"
```javascript
// Check: JoinChallengeModal.tsx, line 187
if (!visible && !showLinkingModal && !showTimeSetupModal) return null;
// ALL three must be checked!
```

---

## 📍 Critical Code Locations

### Where times are saved:
`src/features/challenges/JoinChallengeModal.tsx:156-170`

### Where times are collected:
`src/features/challenges/TimeSetupModal.tsx:106-124`

### Where times are displayed:
`src/features/daily/DailyScreen.tsx:538-543`

### Where activities are fetched:
`src/services/supabase.challenges.service.ts:605-690`

---

## 🔍 Log Markers Meaning

| Marker | Meaning | File |
|--------|---------|------|
| 🔴 [TIME FLOW] | Join flow steps | JoinChallengeModal |
| 🔴🔴🔴 [SAVING] | Critical save operations | JoinChallengeModal |
| 🔴🔴🔴 [SAVE TIMES] | Time saving to DB | supabase.challenges.service |
| 📊 [CHALLENGES] | Challenge data operations | challengeSlice |
| 🟦 [ACTIONS] | Daily actions loading | dailySlice |
| ⏰ [ACTIONS] | Time-related operations | dailySlice |

---

## 🗂️ Database Queries

### Check participant has times:
```sql
SELECT id, activity_times FROM challenge_participants 
WHERE user_id = 'USER_ID';
```

### See formatted times:
```sql
SELECT jsonb_pretty(activity_times) FROM challenge_participants 
WHERE id = 'PARTICIPANT_ID';
```

### Count participants with times:
```sql
SELECT COUNT(*) as total,
       COUNT(CASE WHEN activity_times != '[]'::jsonb THEN 1 END) as with_times
FROM challenge_participants;
```

---

## 🔄 Data Flow Checkpoints

1. **User selects activities** → Check: `selectedActivities` Set has items
2. **Linking modal** → Check: `showLinkingModal` becomes true
3. **Time setup modal** → Check: `showTimeSetupModal` becomes true
4. **Times collected** → Check: `timeStrings` object has entries
5. **Join challenge** → Check: Returns `true`
6. **Get participant** → Check: NOT `undefined` ⚠️
7. **Save times** → Check: `updateParticipantActivityTimes` called
8. **Refresh UI** → Check: `fetchDailyActions` called

---

## ⚡ Performance Issues

### Slow loading:
- Check pagination (should load 5 items max)
- Check for excessive console.logs
- Check network tab for failed requests

### Race conditions:
- Look for operations happening too fast
- Add delays where needed (500ms typical)
- Check for missing `await` keywords

---

## 🛠️ Common Mistakes

1. **Forgetting to check all modal states** in render condition
2. **Not waiting for DB operations** to complete
3. **Assuming fields exist** (display_name vs title)
4. **Not initializing state** when props change
5. **Logging too much** and missing real errors

---

## 📱 Testing Flow

```bash
1. Open browser console
2. Create new account: "test+[timestamp]@example.com"
3. Join group: "TEST123"
4. Open challenge
5. Select 3 activities
6. Skip linking
7. Set times (or use defaults)
8. Click Continue
9. Check Daily page
10. Check console for errors
```

---

## 🔴 If All Else Fails

1. **Clear browser cache**: Cmd+Shift+R
2. **Restart Expo**: Kill terminal, run again
3. **Check Supabase dashboard**: Is DB up?
4. **Create fresh account**: Eliminates user-specific issues
5. **Add targeted logging**: Only where needed

---

## 📱 iOS Runtime Crash Troubleshooting

### Common iOS Crash Causes & Fixes

#### 1. **Web-only APIs causing immediate crash**
**Symptoms**: App crashes immediately on iPhone launch but works on web
**Error**: TurboModuleManager queue crashes
**Common culprits**:
- `window.location`, `window.location.search`
- `localStorage`
- `document` object
- `navigator` object (without proper checks)
- HTML elements like `<input type="time">`

**Fix**:
```javascript
// BAD - crashes on iOS
const param = window.location.search;

// GOOD - safe for all platforms
let param = '';
if (typeof window !== 'undefined' && window.location) {
  param = window.location.search;
}
```

#### 2. **Missing production dependencies**
**Symptoms**: Build succeeds but app crashes at runtime
**Check**: Verify all runtime packages are in `dependencies` not `devDependencies`
```bash
# Example: Supabase must be in dependencies for production
"dependencies": {
  "@supabase/supabase-js": "^2.57.4"  // NOT in devDependencies!
}
```

#### 3. **HTML input elements in React Native**
**Symptoms**: Crash when interacting with time/date inputs
**Fix**: Use platform-specific components
```javascript
// BAD - HTML input crashes iOS
<input type="time" value={time} />

// GOOD - Platform-specific
{Platform.OS === 'web' ? (
  <input type="time" value={time} />
) : (
  <DateTimePicker mode="time" value={date} />
)}
```

#### 4. **localStorage usage**
**Fix**: Always check availability
```javascript
// Safe localStorage usage
if (typeof localStorage !== 'undefined') {
  localStorage.setItem('key', value);
}
```

### Debugging iOS Crashes Without Mac

1. **Get crash logs from iPhone**:
   - Settings → Privacy & Security → Analytics & Improvements → Analytics Data
   - Find logs starting with app name
   - Share via AirDrop/email

2. **Use EAS build logs**:
   ```bash
   eas build:list --platform ios --limit 5
   # Get build ID, then:
   eas build:view [BUILD_ID]
   ```

3. **Compare working vs broken builds**:
   ```bash
   # Check what changed between builds
   git diff [WORKING_COMMIT] HEAD
   ```

4. **Add debug logging strategically**:
   ```javascript
   console.log('🔴 [CHECKPOINT] Before risky operation');
   // risky code
   console.log('🟢 [CHECKPOINT] After risky operation');
   ```

### Prevention Checklist
- [ ] All web-only APIs wrapped in platform checks
- [ ] No HTML elements in React Native components
- [ ] All runtime packages in `dependencies`
- [ ] Test on physical device before TestFlight
- [ ] Increment build number for each submission

---

*Quick reference for Challenge system debugging - Updated Oct 1, 2025*