# Claude Code Assistant Instructions

## Project Context
This is a React Native (Expo) app for goal tracking, daily actions, and social accountability.

## ⚠️ DEBUGGING PROTOCOL (CRITICAL - READ FIRST)

**NEVER CLAIM SOMETHING IS FIXED WITHOUT VERIFICATION**

When debugging database/query issues:

### 1. Compare Broken Code to Working Code FIRST
- If Feature A is broken but Feature B works, read Feature B's code FIRST
- Example: Circle leaderboard broken? Read challenge leaderboard code that works
- Copy the working pattern, don't guess at solutions

### 2. Verify Database Schema Before Querying
- Check what columns ACTUALLY exist by:
  - Reading working queries in the codebase
  - Checking migration files in `supabase/migrations/`
  - Looking at error messages for exact column names
- Migration files may be outdated - trust working code more than migrations

### 3. Common Database Column Name Issues
- Challenge participants table uses: `completion_percentage` (NOT `consistency_percentage`)
- Always check: `completed_days`, `days_taken`, `current_day`, `current_streak`
- DO NOT query: `total_completions` (doesn't exist)

### 4. Working Code Reference Points
- **Challenge leaderboard** (`supabase.challenges.service.ts` lines 570-599) - PROVEN to work correctly
- Uses: `completion_percentage`, `completed_days`, `days_taken`, `current_day`, `current_streak`
- Status filter: `.neq('status', 'left')` includes both active AND completed

### 5. Port and Directory Verification
- **ALWAYS verify correct directory**: `/home/marek/Unity-vision` (NOT Unity-Vision-experiment)
- **ALWAYS verify correct port**: 8081 (NOT 8083)
- Check console output to confirm which version is running

### 6. Verification Checklist Before Claiming "Fixed"
- [ ] Console shows no database errors
- [ ] Test data appears correctly (e.g., Angel and Zaine show 29%)
- [ ] Browser console logs show expected values
- [ ] User can confirm the fix visually in UI

### 7. Never Rush - Be Methodical
1. Read error message completely
2. Find working code that does similar thing
3. Compare working vs broken
4. Make minimal targeted fix
5. Verify fix actually works
6. THEN say it's fixed

**If you break this protocol, you waste time and frustrate the user.**

### 8. SQL Query Format (CRITICAL)
**ALWAYS provide SQL queries as a single copy-paste block**
- User should be able to copy the entire query and paste it into Supabase SQL Editor
- Do NOT break queries into multiple steps unless it would break something
- Exception: Only split if running all at once would cause errors or not perform correctly
- Multiple SELECT statements in one block are fine (they'll show results inline)
- Format: Provide ONE code block with all SQL statements together

## Key Commands

### Development
```bash
# Start dev server
cd /home/marek/Challenge\ Implementation && PORT=8054 npx expo start --web --port 8054

# Build for TestFlight
eas build --platform ios --profile preview

# Run linting (if available)
npm run lint

# Run type checking (if available)
npm run typecheck
```

### Build Numbers (CRITICAL)
**ALWAYS CHECK app.json FOR CURRENT BUILD NUMBER BEFORE BUILDING**
- Current iOS build number: Check `ios.buildNumber` in app.json
- Must increment by 1 for each new TestFlight build
- Last successful build: #18 (as of Sept 25, 2025)
- Build command: `EXPO_NO_PROMPT_FOR_CI=1 eas build --platform ios --profile production --auto-submit --non-interactive`

### Git Workflow
```bash
# Always work on circle-view-tabs branch
git checkout circle-view-tabs

# Commit pattern
git add -A && git commit -m "Descriptive message

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>" && git push origin circle-view-tabs
```

## Important Implementation Details

### Daily Actions Reset Logic
- Actions have `completed` (persistent) and `completed_at` (timestamp) fields
- Always check if `completed_at` is TODAY when displaying completion status
- Actions reset at midnight automatically by checking timestamp

### Premium Post Cards
- Only show for activities that are BOTH:
  1. In a challenge
  2. Tied to a goal
- Use `LuxuryPostCardPremium` component
- Include silver metallic overlay for challenge activities

### Daily Review System
- Use `DailyReviewModalV2` (not the old version)
- Bottom sheet pattern, max 75% screen height
- Saves automatically at each step
- Backend: `supabase.dailyReviews.service.ts`

### Challenge Participants Table Schema (REFERENCE)
**Working columns** (verified in `supabase.challenges.service.ts`):
- `user_id`, `challenge_id`, `status`
- `completion_percentage` (NOT consistency_percentage)
- `completed_days`, `days_taken`, `current_day`, `current_streak`
- `rank`, `percentile`
- `selected_activity_ids` (new challenges)
- `joined_at`, `personal_start_date`

**DO NOT query these** (they don't exist):
- `total_completions` ❌
- `consistency_percentage` ❌
- `days_participated` ❌

**Always reference working challenge leaderboard code** (`supabase.challenges.service.ts` lines 582-599) for correct column names.

### Database Operations
- Always use Supabase service layer, not direct queries
- RLS policies are enabled - respect user context
- UTC timestamps, display in local timezone
- **CRITICAL**: Before writing ANY database query:
  1. Find working code that queries the same table
  2. Copy the exact column names from working code
  3. Do NOT guess at column names or trust outdated migrations
  4. Check console errors for exact "column does not exist" messages

### Action Completion & Sharing System (MVP)

**Current MVP Approach: Public-Only Posting**
- All action completions are shared publicly (all circles + followers)
- Privacy selection UI has been commented out (not deleted)
- Users cannot choose to keep posts private in MVP

**How It Works:**

1. **Regular Actions (Timed activities)**
   - User taps action → `PrivacySelectionModal` opens
   - Modal shows: Photo/Comment options + public notice
   - Defaults: All circles + followers selected
   - File: `src/features/daily/PrivacySelectionModal.tsx`

2. **Abstinence Actions (No X, Don't Y)**
   - User taps action → `AbstinenceModal` opens
   - Modal shows: Yes/No + Photo/Comment + public notice
   - Defaults: All circles + followers selected
   - File: `src/features/daily/AbstinenceModal.tsx`

3. **Living Progress Cards**
   - Challenge actions update daily Living Progress Card
   - Always shows in feed (public)
   - Aggregates all challenge actions for that day
   - Individual posts only created if user adds comment/photo

**Data Flow:**
```
User completes action
  ↓
Modal opens with public notice
  ↓
User adds comment/photo (optional)
  ↓
handlePrivacySelect / handleAbstinenceComplete called
  ↓
selectedCircleIds = all user circles
includeFollowers = true (always)
  ↓
Backend creates post with visibility
  ↓
Post appears in all circles' feeds + followers' feeds
```

**Where Privacy Code Lives (Commented Out):**
- `PrivacySelectionModal.tsx` lines ~421-562 (circle selection UI)
- `AbstinenceModal.tsx` lines ~304-365 (circle selection UI)

**To Re-Enable Privacy Controls:**
1. Uncomment the privacy sections in both modals
2. Remove the public notice sections
3. User will be able to choose which circles see posts
4. Default behavior: all circles checked on modal open

**Key State Variables:**
- `selectedCircleIds: Set<string>` - Which circles see the post
- `includeFollowers: boolean` - Whether followers see it
- In MVP: Always initialized to ALL circles + followers = true

**Action Completion is Final:**
- Once an action is completed, it CANNOT be uncompleted
- Removed uncomplete flow from `ActionItem.tsx` (Feb 10, 2026)
- Reasoning:
  - Conflicts with challenge database constraint (one completion per day)
  - Undermines social accountability (everyone already saw the post)
  - Users actually want to EDIT completions (add comment/photo), not undo them
- Tapping completed action gives error haptic, does nothing
- Future: May add EDIT feature to change comment/photo without affecting completion status

## Onboarding System (Toggle On/Off)

**Current Status**: DISABLED for MVP (Feb 2026) - Users skip straight to app
**Can be re-enabled**: Yes, easily (see instructions below)

### How It Works

**Components**:
- `OnboardingFlow.tsx` - 8-step flow (Journey selection, Goals, Milestones, Actions, etc.)
- `ProfileSetupScreen.tsx` - Name, username, avatar setup
- `AppWithAuth.tsx` - Controls what screens are shown

**State Flags** (in `authSlice.ts`):
- `hasCompletedProfileSetup` - Controls ProfileSetupScreen
- `hasCompletedOnboarding` - Controls OnboardingFlow
- Stored in AsyncStorage, persists across app restarts

**Flow Logic** (in `AppWithAuth.tsx` lines 226-380):
```
New user registers
  ↓
hasCompletedProfileSetup = false → Show ProfileSetupScreen
  ↓ (user completes)
hasCompletedOnboarding = false → Show OnboardingFlow
  ↓ (user completes)
hasCompletedOnboarding = true → Show main app tabs
```

### To DISABLE Onboarding (Current MVP State)

**Option 1: Skip onboarding for new users** (Recommended)
In `src/state/slices/authSlice.ts` line ~141:
```typescript
// Change this:
await AsyncStorage.setItem('hasCompletedOnboarding', 'false');

// To this:
await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
```

**Option 2: Comment out OnboardingFlow render**
In `src/AppWithAuth.tsx` lines ~375-390, comment out the entire block:
```typescript
{/* showOnboarding && (
  <View style={{...}}>
    <OnboardingFlow onComplete={...} />
  </View>
) */}
```

### To RE-ENABLE Onboarding

**Reverse the changes above**:
1. Set `hasCompletedOnboarding` back to `'false'` in authSlice register
2. Uncomment OnboardingFlow render in AppWithAuth
3. Test with a new user account (existing users won't see it)

**To force existing users through onboarding**:
```typescript
// In AppWithAuth or a migration script:
await AsyncStorage.setItem('hasCompletedOnboarding', 'false');
await AsyncStorage.setItem('isNewUser', 'true');
// User will see onboarding on next launch
```

### Onboarding Screens (8 steps)

1. **JourneySelectionScreen** - Pick program/goal type
2. **JourneyConfirmationScreen** - Confirm selection
3. **GoalSettingScreen** - Set main goal
4. **MilestonesScreen** - Define milestones
5. **ActionsCommitmentsScreen** - Choose daily actions
6. **ReviewCommitScreen** - Review and commit
7. **TimeSelectionScreen** - Set action times
8. **RoutineBuilderScreen** - Build routine

**Files**:
- `/src/features/onboarding/OnboardingFlow.tsx` - Main flow controller
- `/src/features/onboarding/ProfileSetupScreen.tsx` - Profile setup
- `/src/features/onboarding/[Screen].tsx` - Individual screens
- `/src/state/slices/authSlice.ts` - Onboarding state management
- `/src/AppWithAuth.tsx` - Onboarding render logic

### MVP Decision (Feb 2026)

**Why disabled**:
- 8 steps = ~70% abandon rate
- Users invited to challenges don't need setup (they get challenge activities)
- Each tab has empty states with CTAs ("Add action +", "Join circle")
- Faster to value (auth → app in 10 seconds)

**When to re-enable**:
- If users are confused without guided setup
- If retention suffers from lack of initial actions/goals
- If data shows users not discovering key features

## Code Style Guidelines
- NO comments unless explicitly requested
- Follow existing patterns in codebase
- Mobile-first responsive design
- Use TypeScript strictly
- Prefer editing existing files over creating new ones

## Current Branch
Working on: `Unity-Vision`

## Testing Accounts
- Username: 12221212
- Test Circle: TEST123

## Known Issues to Watch For
1. Keyboard overlap on iOS - use KeyboardAvoidingView
2. Action completion persistence - check TODAY's date
3. Challenge activity times - may be missing scheduled_time

## File Structure
```
src/
  features/
    daily/          - Daily actions and reviews
    social/         - Social feed and posts
  services/         - Backend services
  state/           - Zustand store and slices
  components/      - Reusable components
supabase/
  migrations/      - Database migrations
```

## Before Major Changes
1. Check SESSION_DOCUMENTATION.md for detailed history
2. Verify no duplicate work
3. Test on mobile viewport (iPhone sizes)
4. Check console logs for debugging info

## Performance Notes
- If session feels slow, consider restarting
- Batch tool calls when possible
- Use Task tool for complex searches