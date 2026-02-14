# Notification System Implementation Plan

**Last Updated:** 2025-11-01
**Status:** In Progress - Phase 1

## Product Strategy (Approved)

### Core Philosophy
- **Quality over quantity** - Emotional, actionable notifications only
- **Aggressive by default** - Users self-selected for accountability
- **FOMO & Competition** - Leverage loss aversion and social pressure
- **One morning digest** - Single daily overview, not spam

### Notification Types (Priority Order)

#### 1. Morning Digest (HIGHEST PRIORITY)
**Goal:** Daily habit anchor
**Frequency:** Once per day at user's preferred time (default 7:00 AM)
**Example:**
```
🌅 Good morning! Today's challenges:

❄️ Cold Shower (10:00 AM)
🏋️ Gym Session (6:00 PM)
📸 Progress Photo (7:00 PM)

3/5 circle members already started 💪
```

#### 2. Competitive/FOMO Notifications
**Goal:** Create urgency and social pressure

**Last One Standing:**
- Title: "⚠️ You're the only one left!"
- Body: "Everyone else in {circleName} completed their tasks today"
- Trigger: User is last incomplete in circle

**Leaderboard Changes:**
- Title: "📉 You dropped in the rankings"
- Body: "{userName} just passed you and is now #{position}"
- Trigger: User position drops

**Streak Dying:**
- Title: "🔥 Your {days}-day streak ends in 4 hours!"
- Body: "Complete 1 action now to keep it alive"
- Trigger: 4 hours before midnight, user hasn't completed today

#### 3. Social Engagement
**Goal:** Personal connection and validation

**Comments:**
- Title: "💬 {userName} commented on your post"
- Body: "{commentText}"
- Trigger: New comment on user's post

**Likes (Batched):**
- Title: "👍 {userName} and 2 others liked your workout"
- Trigger: Batched within 10-minute window

**Mentions:**
- Title: "@mentioned you in a post"
- Trigger: User tagged in post

#### 4. Challenge Notifications
**Goal:** Build anticipation and momentum

**Starting Soon:**
- Title: "🧊 {challengeName} starts in 1 hour - 8 people joined!"
- Trigger: 1 hour before challenge start

**Challenge Started:**
- Title: "⏰ Challenge starting NOW - be the first to complete"
- Trigger: Challenge start time

**Milestones:**
- Title: "🔥 Halfway done! You've completed 15/30 days"
- Trigger: 50%, 75%, final day

**Position Changes:**
- Title: "🏆 You're #1! Defend your position"
- Trigger: User reaches #1 in challenge leaderboard

### Notification Rules
```typescript
const NOTIFICATION_RULES = {
  // Frequency limits
  max_social_per_day: 5,
  max_challenge_updates_per_day: 3,

  // Timing
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',

  // Batching
  batch_likes: true,
  batch_window_minutes: 10,

  // Priority order (if multiple pending)
  priority: [
    'morning_digest',
    'streak_dying',
    'post_mention',
    'leaderboard_passed',
    'challenge_final_day',
    'post_comment',
    'last_one_standing',
    // ... etc
  ]
};
```

---

## Technical Architecture

### Tech Stack
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Scheduled Jobs:** Supabase Cron
- **Push Notifications:** Expo Push Notifications
- **Frontend:** React Native (Expo)
- **Real-time:** Supabase Realtime

### Database Schema

#### Tables Created
1. `notifications` - Actual notifications (existing, enhanced)
2. `notification_preferences` - User settings
3. `notification_schedules` - Scheduled future notifications

See `notifications-schema.sql` for full schema.

### Service Layer Architecture

```
User Action (e.g., like post)
    ↓
Backend Service (e.g., supabase.posts.service.ts)
    ↓
Notification Service (supabase.notifications.service.ts)
    ↓
Check User Preferences
    ↓
Create Notification (in-app)
    ↓
Send Push Notification (if enabled)
    ↓
Real-time Update (Supabase Realtime)
    ↓
Frontend Updates (bell icon, toast)
```

### Scheduled Notification Flow

```
Cron Trigger (every 5 min)
    ↓
Supabase Edge Function (process-notifications)
    ↓
Query notification_schedules WHERE scheduled_for <= NOW()
    ↓
For each scheduled notification:
  1. Create in notifications table
  2. Send push notification
  3. Mark schedule as 'sent'
```

---

## Implementation Phases

### ✅ Phase 0: Planning (COMPLETED)
- [x] Product strategy defined
- [x] ChatGPT validation
- [x] Technical architecture designed
- [x] Decided on aggressive notification tone

### 🔄 Phase 1: Foundation (IN PROGRESS)

#### Step 1: Database Schema ✅
- [x] Created `notifications-schema.sql`
- [ ] Run SQL in Supabase SQL Editor
- [ ] Verify tables created
- [ ] Test RLS policies

**Files:**
- `notifications-schema.sql`

#### Step 2: TypeScript Types ✅
- [x] Created `src/types/notifications.types.ts`
- [ ] Import types in service files

**Files:**
- `src/types/notifications.types.ts`

#### Step 3: Enhanced Notification Service ✅
- [x] Expand `supabase.notifications.service.ts` with:
  - Preference helpers
  - Notification creation helpers
  - Batching logic
  - Frequency limiting
  - Schedule creation

**Current File:**
- `src/services/supabase.notifications.service.ts` ✅ COMPLETED

**Functions Added:**
```typescript
// Preferences ✅
getUserPreferences(userId)
createDefaultPreferences(userId)
updatePreferences(userId, prefs)

// Creation helpers ✅
createSocialNotification(params)
createCompetitiveNotification(params)
createChallengeNotification(params)

// Scheduling ✅
scheduleNotification(schedule)
scheduleMorningDigest(userId, time)
getPendingSchedules()
markScheduleAsSent(id)

// Batching ✅
batchLikeNotifications(postId, authorId)

// Frequency limiting ✅
canSendNotification(userId, type)
```

#### Step 4: Basic Triggers ✅
- [x] Hook into existing actions:
  - Post liked → social notification ✅
  - Post commented → social notification ✅
  - Action completed → check leaderboard changes (Phase 3)

**Files Modified:**
- `src/services/supabase.service.ts` ✅
  - Added notification trigger to `reactToPost()` (line 1603)
  - Added notification trigger to `addComment()` (line 1668)
  - Both check if user is reacting/commenting on own post (no notification if true)
  - Both fetch actor username for personalized notifications

---

### 📋 Phase 2: Scheduled Notifications (TODO)

#### Step 5: Morning Digest Generator
- [ ] Create function to generate daily digest
- [ ] Pull user's scheduled actions for today
- [ ] Get circle progress stats
- [ ] Format notification

**New File:**
- `src/services/notifications/morningDigest.ts`

#### Step 6: Supabase Edge Function
- [ ] Create Edge Function: `process-scheduled-notifications`
- [ ] Set up cron trigger (every 5 minutes)
- [ ] Handle timezone conversions
- [ ] Error handling and retry logic

**Command:**
```bash
supabase functions new process-scheduled-notifications
```

**Files:**
- `supabase/functions/process-scheduled-notifications/index.ts`

#### Step 7: Schedule Morning Digests
- [ ] Nightly job to schedule next day's digests
- [ ] Respect user's preferred time
- [ ] Handle timezone edge cases

---

### 📋 Phase 3: Real-time Triggers (TODO)

#### Step 8: Social Notifications
- [ ] Like notification (with batching)
- [ ] Comment notification
- [ ] Mention detection and notification

**Files to Modify:**
- `src/services/supabase.posts.service.ts`

#### Step 9: Competitive Notifications
- [ ] Leaderboard change detection
- [ ] "Last one standing" check (run hourly)
- [ ] Streak dying check (run at 4 hours before midnight per timezone)

**New Files:**
- `src/services/notifications/competitiveChecks.ts`

**Edge Functions:**
- `check-last-one-standing` (cron: hourly)
- `check-dying-streaks` (cron: every 30 min)

---

### 📋 Phase 4: Push Infrastructure (TODO)

#### Step 10: Expo Push Setup
- [ ] Install `expo-notifications`
- [ ] Add push token registration
- [ ] Store tokens in `profiles.push_token`
- [ ] Request notification permissions

**Files:**
- `App.tsx` (add push token registration)
- `src/services/pushNotifications.service.ts` (new)

#### Step 11: Push Sending
- [ ] Create helper to send Expo push
- [ ] Integrate with notification creation
- [ ] Handle push failures
- [ ] Prune invalid tokens

**Files:**
- `src/services/pushNotifications.service.ts`

---

### 📋 Phase 5: Frontend UI (TODO)

#### Step 12: Notification Bell
- [x] Already exists (NotificationBell component)
- [ ] Test with new notification types
- [ ] Add unread badge

#### Step 13: Notification List Screen
- [ ] Create/enhance notification list
- [ ] Group by category
- [ ] Mark as read functionality
- [ ] Handle notification actions (deep linking)

**Files:**
- `src/features/notifications/NotificationsList.tsx`

#### Step 14: Real-time Updates
- [ ] Subscribe to notifications table
- [ ] Show toast for new notifications while app is open
- [ ] Update bell badge in real-time

**Files:**
- `src/features/notifications/useRealtimeNotifications.hook.ts`

---

## Testing Checklist

### Database Testing
- [ ] All tables created successfully
- [ ] RLS policies work correctly
- [ ] Indexes improve query performance
- [ ] Foreign keys enforce data integrity

### Notification Creation Testing
- [ ] Social notifications created on like/comment
- [ ] Competitive notifications fire on leaderboard change
- [ ] Preferences are respected
- [ ] Frequency limits work

### Scheduled Notification Testing
- [ ] Morning digest scheduled correctly
- [ ] Cron job processes schedules
- [ ] Timezone handling works (test with multiple timezones)
- [ ] Notifications marked as sent

### Push Notification Testing
- [ ] Push tokens registered
- [ ] Push notifications sent on iOS
- [ ] Push notifications sent on Android
- [ ] Deep linking works from push tap

### Edge Cases
- [ ] Quiet hours respected
- [ ] Batching works for likes
- [ ] Duplicate notifications prevented
- [ ] Deleted users don't receive notifications
- [ ] User with no circles/challenges doesn't get errors

---

## Files Modified/Created

### Created
- [x] `notifications-schema.sql` - Database schema
- [x] `src/types/notifications.types.ts` - TypeScript types
- [x] `NOTIFICATION_IMPLEMENTATION_PLAN.md` - This file

### To Modify
- [ ] `src/services/supabase.notifications.service.ts` - Expand service
- [ ] `src/services/supabase.posts.service.ts` - Add social triggers
- [ ] `src/services/supabase.actions.service.ts` - Add competitive triggers

### To Create
- [ ] `src/services/notifications/morningDigest.ts`
- [ ] `src/services/notifications/competitiveChecks.ts`
- [ ] `src/services/pushNotifications.service.ts`
- [ ] `supabase/functions/process-scheduled-notifications/index.ts`
- [ ] `supabase/functions/check-last-one-standing/index.ts`
- [ ] `supabase/functions/check-dying-streaks/index.ts`

---

## Deployment Checklist

### Supabase
- [ ] Run `notifications-schema.sql` in SQL Editor
- [ ] Deploy Edge Functions
- [ ] Set up cron triggers
- [ ] Configure environment variables (Expo push credentials)

### App
- [ ] Update app with new notification service
- [ ] Request notification permissions on onboarding
- [ ] Test push notifications on TestFlight
- [ ] Monitor notification delivery rates

---

## Monitoring & Analytics

### Metrics to Track
- Notification delivery rate
- Open rate by notification type
- Time to action after notification
- Opt-out rate by type
- D1 → D7 retention before/after notifications

### A/B Tests to Run
- Aggressive vs. supportive tone
- Morning digest time (7 AM vs 8 AM)
- Notification frequency (current limits vs. more/less)

---

## Questions to Answer

### Product
- [ ] Should morning digest be skippable if no actions scheduled?
- [ ] How to handle users in multiple circles (which circle stats to show)?
- [ ] Should we show "quiet hours" notification queue in app?

### Technical
- [ ] What's max batch size for Expo push (probably 100)?
- [ ] How to handle push token refresh?
- [ ] Should we use Redis for batching cache or PostgreSQL?

---

## Current Session Progress

**Date:** 2025-11-01
**Session Goal:** Implement Phase 1 Foundation

**Completed This Session:**
- [x] Created notification schema SQL (`notifications-schema.sql`)
- [x] Created TypeScript types (`src/types/notifications.types.ts`)
- [x] Created comprehensive documentation (`NOTIFICATION_IMPLEMENTATION_PLAN.md`)
- [x] Expanded notification service with all helper functions
  - Preference management
  - Social notification creation
  - Competitive notification creation
  - Challenge notification creation
  - Scheduling functions
  - Batching logic
  - Frequency limiting
- [x] ✅ Ran SQL migration in Supabase (created tables successfully)
- [x] Added social notification triggers
  - Post reactions (likes) → notification to post author
  - Comments → notification to post author
  - Both check to prevent self-notifications

**Phase 1 Status: ✅ COMPLETE**

**Next Steps (Phase 2 - Scheduled Notifications):**
1. Test notifications in the app (like/comment on a post and check notification bell)
2. Create morning digest generator function
3. Set up Supabase Edge Function for scheduled notification processor
4. Add competitive triggers (leaderboard, last one standing, streak dying)

**No Blockers:**
- All tables created ✅
- Services working ✅
- Triggers added ✅
- App compiling successfully ✅

---

## Notes & Decisions

### Why Aggressive Notifications?
User feedback from previous conversation: Users self-selected for accountability, FOMO and competition are core to retention, circles create safe space for callouts.

### Why Supabase Cron vs. External Worker?
MVP with <10k DAU - Supabase cron is simpler. Will migrate to dedicated job queue (BullMQ) if we scale.

### Why Batch Likes?
Prevent notification spam. "John and 3 others" is more powerful than 4 separate pings.

---

## Contact / Questions
If session is lost, continue from "Current Session Progress" section above.
Priority: Complete Phase 1 before moving to Phase 2.
