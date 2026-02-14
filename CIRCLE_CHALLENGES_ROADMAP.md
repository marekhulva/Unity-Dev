# Circle Challenges Implementation Roadmap

**Branch:** `ChallangeAuto`
**Created:** October 30, 2025
**Goal:** Enable challenges within circles with viral invitation system

---

## 🎯 Overview

This roadmap implements a complete circle challenges system where:
- Circle members can create and join challenges together
- Progress is tracked both in Daily Actions and Challenge pages
- Members get notifications and reminders
- Invitations enable viral growth (invite friends who auto-join circle + challenge)

---

## Phase 1: Core Circle Challenge Experience (Week 1-2)

### 1.1 Challenge Discovery - BOTH Methods

**A. Circle Page Integration** (2-3 days)
- [x] Challenges tab fetches circle challenges (DONE)
- [ ] Challenge cards in Challenges tab
  - [ ] Show: emoji, name, description, participant count
  - [ ] Buttons: "Join" or "View Details"
  - [ ] Visual design matching Social/Progress styling
- [ ] Empty state: "No challenges yet - Create one!"
- [ ] Loading states with ActivityIndicator
- [ ] Error states

**B. Notification System** ✅ COMPLETED (3-4 days)
- [x] Create `notifications` table in database
  - [x] Migration: `20251030_create_notifications_table.sql`
  - [x] RLS policies, indexes, helper functions
  - [x] Added `push_token` column to profiles
- [x] Backend service: `supabase.notifications.service.ts`
  - [x] `createNotification(userId, type, title, body, data)`
  - [x] `getNotifications()`
  - [x] `markAsRead(notificationId)`
  - [x] `markAllAsRead()`
  - [x] `getUnreadCount()`
  - [x] `subscribeToNotifications()` - Realtime updates
- [x] Zustand store slice: `notificationSlice.ts`
  - [x] State: notifications[], unreadCount, loading
  - [x] Actions: fetch, markAsRead, subscribe/unsubscribe
  - [x] Integrated into rootStore
- [x] UI: Notification bell icon in header (shows unread badge)
  - [x] `NotificationBell.tsx` - Shows count, pulse animation
- [x] UI: Notification modal list
  - [x] `NotificationsModal.tsx` - Full notification list with emojis
  - [x] Mark as read on tap
  - [x] Mark all as read button
  - [x] Empty state
- [ ] Backend: When challenge created → notify all circle members (deferred to Phase 2)
- [ ] Push notification infrastructure (Expo Notifications) (deferred to Phase 4)
  - [ ] Request permissions
  - [ ] Store device tokens in profiles table
  - [ ] Send test notification

**Commits:**
- `7518fe0` - Phase 1.1B: Create notification system infrastructure
- `6bfc23f` - Phase 1.1B: Add notification bell UI and notifications modal

---

### 1.2 Challenge Detail View (3-4 days) ✅ COMPLETED

**Location:** Circle → Challenges tab → Click challenge card

**Components to Build:**
- [x] `ChallengeDetailModal.tsx` (already exists, enhanced)
- [x] Challenge header section
  - [x] Large emoji
  - [x] Challenge name
  - [x] Description
  - [ ] "Leave Challenge" button (if joined) - *not needed for MVP*
- [x] Stats card
  - [x] Duration: "30 days"
  - [x] Participants: "5 members joined"
  - [x] Success threshold: "80% required"
- [x] Leaderboard section
  - [x] Leaderboard entries with rank, avatar, name, progress
  - [x] Highlight current user
  - [x] Crown/medal icons for top 3
  - [ ] Filter tabs: All / Circle / Friends - *nice to have, deferred*
  - [ ] Sort options: Rank / Fastest / Perfect - *nice to have, deferred*
- [x] Your progress card (if joined)
  - [x] Current day indicator: "Day 5/30"
  - [x] Completion percentage: "16%"
  - [x] Current streak: "5 days 🔥"
  - [x] Progress bar (visual)
- [x] Join modal (if not joined)
  - [x] Uses existing JoinChallengeFlow component
  - [x] "Join Challenge" button
  - [x] Success handling

**Backend Integration:**
- [x] `useEffect` to fetch challenge details
- [x] Call `supabaseChallengeService.getChallenge(challengeId)`
- [x] Call `supabaseChallengeService.getLeaderboard(challengeId, options)`
- [x] Handle join: `supabaseChallengeService.joinChallenge()`
- [x] Handle leave: `supabaseChallengeService.leaveChallenge()`

**Commits:**
- `c83772e` - Make challenge cards clickable
- `296d7af` - Add progress card to detail modal

---

### 1.3 Daily Tracking - BOTH Methods

**A. Daily Actions Page Integration** ✅ COMPLETED (2-3 days)
- [x] Modify `DailyScreen.tsx`
- [x] Call `getUserChallengeActivities()` on load
- [x] Merge challenge activities with regular actions
- [x] Visual distinction for challenge activities
  - [x] Badge/chip showing challenge name
  - [x] Border or background color
  - [x] Challenge emoji displayed
- [ ] Show current streak next to activity: "3 days 🔥" (deferred)
- [x] Checkbox completion triggers challenge tracking
  - [x] Call `recordChallengeActivity()` when checked
  - [x] Update streak display via service
  - [ ] Show celebration animation on milestone (7, 14 days) (deferred to Phase 2)

**Commits:**
- `e18adf6` - Phase 1.3A: Integrate challenge activities into Daily page

**B. Challenge Detail "Check In" Button** (1-2 days)
- [ ] "Check In" button on Challenge Detail page
- [ ] Modal showing today's required activities
- [ ] Checkboxes for each activity
- [ ] "Submit Check-In" button
- [ ] Instant leaderboard update after check-in
- [ ] Celebration animation on completion
- [ ] Confetti effect on streak milestones

---

### 1.4 Reminder System (3-4 days)

**Push Notifications Setup:**
- [ ] Install Expo Notifications: `npx expo install expo-notifications`
- [ ] Request notification permissions on app load
- [ ] Get and store device token (push token)
- [ ] Add `push_token` column to profiles table
- [ ] Update profile with push token after login
- [ ] Test sending notification from backend

**Scheduled Reminders:**
- [ ] Backend cron job (or Cloud Function)
  - [ ] Query `challenge_activity_schedules` table
  - [ ] Find activities scheduled in next 15 minutes
  - [ ] Send push notification to users
  - [ ] Notification content: "Time for [activity]! Don't break your [X]-day streak 😴"
  - [ ] Deep link to Daily page or Challenge detail
- [ ] Handle notification tap → navigate to correct screen

**In-App Reminders:**
- [ ] Red badge on Challenges tab if incomplete today
- [ ] Banner on Daily page: "3 incomplete challenge activities"
- [ ] Persistent notification until completed

---

## Phase 2: Social Features & Engagement (Week 3-4)

### 2.1 Milestone Auto-Posts (2-3 days)

**Trigger Points:**
- [ ] User joins challenge → post to circle feed
- [ ] Complete first day → post
- [ ] Reach 7-day streak → post
- [ ] Reach 14-day streak → post
- [ ] Reach 21-day streak → post
- [ ] Complete challenge → post
- [ ] Earn badge → post

**Implementation:**
- [ ] Create `createMilestonePost()` helper function
- [ ] Add to `recordChallengeActivity()` after completion
- [ ] Check for milestone conditions
- [ ] Insert into `posts` table with:
  - [ ] `type: 'milestone'`
  - [ ] `challenge_id` reference
  - [ ] `visibility: 'circle'`
  - [ ] Generated content with emoji
- [ ] Test: Join challenge, verify post created
- [ ] Test: Complete 7 days, verify streak post

---

### 2.2 Challenge Creation UI (3-4 days)

**Location:** Circle → Challenges tab → "Create Challenge" button

**Form Components:**
- [ ] Create `CreateChallengeModal.tsx`
- [ ] Form fields:
  - [ ] Challenge name (text input)
  - [ ] Description (textarea)
  - [ ] Emoji picker
  - [ ] Duration (number picker: 7, 14, 30, 60, 90 days)
  - [ ] Success threshold (slider: 50-100%)
  - [ ] Badge emoji picker
  - [ ] Badge name (text input)
- [ ] Activities section (add multiple):
  - [ ] Activity name
  - [ ] Activity emoji
  - [ ] Frequency (daily/weekly)
  - [ ] "+ Add Activity" button
  - [ ] Remove activity button
- [ ] Validation
  - [ ] Name required
  - [ ] At least 1 activity required
  - [ ] Duration > 0
- [ ] "Create Challenge" button
- [ ] Success animation
- [ ] Navigate to new challenge detail

**Backend Integration:**
- [ ] Create `createChallenge()` in service
- [ ] Insert into `challenges` table with `scope: 'circle'`
- [ ] Notify all circle members
- [ ] Auto-join creator as first participant

---

## Phase 3: Viral Invitation System 🚀 (Week 5)

### 3.1 Database Schema for Invitations (1 day)

- [ ] Create migration file: `create_invitations_table.sql`
- [ ] Run migration in Supabase
```sql
CREATE TABLE circle_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code TEXT UNIQUE NOT NULL,

  -- Source
  inviter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,

  -- Invitee details (optional)
  invitee_email TEXT,
  invitee_phone TEXT,
  invitee_name TEXT,

  -- Message
  personal_message TEXT,

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,

  -- Expiration
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_code ON circle_invitations(invite_code);
CREATE INDEX idx_invitations_email ON circle_invitations(invitee_email);
CREATE INDEX idx_invitations_status ON circle_invitations(status);
CREATE INDEX idx_invitations_inviter ON circle_invitations(inviter_id);
CREATE INDEX idx_invitations_circle ON circle_invitations(circle_id);

-- RLS Policies
ALTER TABLE circle_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations they created"
ON circle_invitations FOR SELECT
USING (inviter_id = auth.uid());

CREATE POLICY "Users can create invitations for their circles"
ON circle_invitations FOR INSERT
WITH CHECK (
  inviter_id = auth.uid() AND
  circle_id IN (
    SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view invitation by code (for accepting)"
ON circle_invitations FOR SELECT
USING (true);
```

---

### 3.2 Invitation Creation Flow (2 days)

**UI Components:**
- [ ] Create `InviteMemberModal.tsx`
- [ ] Location: Circle page → Members → "Invite Member" button
- [ ] Form fields:
  - [ ] Friend's name (optional, for personalization)
  - [ ] Challenge selector (dropdown of active circle challenges)
  - [ ] Personal message (textarea with placeholder)
  - [ ] Preview of invitation
- [ ] Send options:
  - [ ] Copy link button (copies to clipboard)
  - [ ] Share button (native share sheet)
  - [ ] SMS button (opens SMS app with pre-filled message)
  - [ ] Email button (opens email with pre-filled content)
- [ ] Success state: "Invitation created! Share link with your friend"

**Backend Service:**
- [ ] Create `invitations.service.ts`
- [ ] `generateInviteCode()` function
  - [ ] Format: "WESTON-SLEEP-ABC123"
  - [ ] Include inviter name + challenge hint + random string
  - [ ] Ensure uniqueness
- [ ] `createInvitation()` function
  - [ ] Insert into `circle_invitations` table
  - [ ] Return invite code + URL
- [ ] `getInvitation(code)` function
  - [ ] Fetch invitation details
  - [ ] Check if expired
  - [ ] Join with circle and challenge data
- [ ] `acceptInvitation(code, userId)` function
  - [ ] Join circle
  - [ ] Join challenge (if exists)
  - [ ] Mark invitation as accepted
  - [ ] Notify inviter
  - [ ] Create welcome post

---

### 3.3 Deep Linking Setup (2 days)

**Configure Deep Links:**
- [ ] Update `app.json`:
```json
{
  "expo": {
    "scheme": "unityapp",
    "ios": {
      "associatedDomains": ["applinks:yourapp.com"],
      "bundleIdentifier": "com.yourapp.unity"
    },
    "android": {
      "package": "com.yourapp.unity",
      "intentFilters": [{
        "action": "VIEW",
        "data": [{
          "scheme": "https",
          "host": "yourapp.com",
          "pathPrefix": "/invite"
        }]
      }]
    }
  }
}
```
- [ ] Install expo-linking: `npx expo install expo-linking`
- [ ] Set up linking configuration in App.tsx
- [ ] Test deep link: `npx uri-scheme open unityapp://invite/TEST123 --ios`
- [ ] Test universal link: `https://yourapp.com/invite/TEST123`

**Link Handling:**
- [ ] Create `useDeepLinking()` hook
- [ ] Listen for URL events
- [ ] Parse invitation code from URL
- [ ] Store in AsyncStorage if user not logged in
- [ ] Process after authentication

---

### 3.4 Onboarding Flow with Auto-Join (3 days)

**Entry Points:**
- [ ] User clicks invitation link (app installed)
- [ ] User clicks invitation link (app not installed → store redirect)
- [ ] User logs in with pending invitation

**Flow Implementation:**
- [ ] Detect invitation code in URL on app launch
- [ ] If not authenticated:
  - [ ] Store invitation code in AsyncStorage
  - [ ] Show login/signup screen
  - [ ] Display: "Weston invited you to Night Owls! Sign up to join"
- [ ] After authentication:
  - [ ] Check for stored invitation code
  - [ ] Fetch invitation details
  - [ ] Show confirmation modal
- [ ] Confirmation modal:
  - [ ] Inviter name and avatar
  - [ ] Circle name and emoji
  - [ ] Challenge name and emoji (if included)
  - [ ] Personal message
  - [ ] "Accept Invitation" button
  - [ ] "View Details First" button
- [ ] On accept:
  - [ ] Call `acceptInvitation()` service
  - [ ] Show success animation
  - [ ] Navigate to Circle page
- [ ] Post-acceptance:
  - [ ] Add user to circle_members
  - [ ] Add user to challenge_participants (if challenge included)
  - [ ] Mark invitation as accepted
  - [ ] Send notification to inviter
  - [ ] Create "joined circle" post
  - [ ] Navigate to circle/challenge

**Backend Logic:**
- [ ] `acceptInvitation()` implementation:
```typescript
async acceptInvitation(inviteCode: string, userId: string) {
  // 1. Get invitation
  const invitation = await getInvitation(inviteCode);
  if (!invitation || invitation.status !== 'pending') {
    return { success: false, error: 'Invalid invitation' };
  }
  if (new Date() > new Date(invitation.expires_at)) {
    return { success: false, error: 'Invitation expired' };
  }

  // 2. Join circle
  await supabase.from('circle_members').insert({
    circle_id: invitation.circle_id,
    user_id: userId,
    role: 'member'
  });

  // 3. Join challenge (if exists)
  if (invitation.challenge_id) {
    const { data: challenge } = await supabase
      .from('challenges')
      .select('predetermined_activities, duration_days')
      .eq('id', invitation.challenge_id)
      .single();

    const activityIds = challenge.predetermined_activities.map(a => a.id);

    await supabase.from('challenge_participants').insert({
      challenge_id: invitation.challenge_id,
      user_id: userId,
      selected_activity_ids: activityIds,
      personal_start_date: new Date().toISOString(),
      status: 'active'
    });
  }

  // 4. Mark invitation accepted
  await supabase.from('circle_invitations')
    .update({
      status: 'accepted',
      accepted_by: userId,
      accepted_at: new Date().toISOString()
    })
    .eq('invite_code', inviteCode);

  // 5. Notify inviter
  await createNotification(
    invitation.inviter_id,
    'invitation_accepted',
    `${userName} joined your circle!`,
    `${userName} accepted your invitation to ${circleName}`
  );

  // 6. Create welcome post
  await supabase.from('posts').insert({
    user_id: userId,
    content: `Just joined ${circleName}! 🎉`,
    type: 'member_joined',
    circle_ids: [invitation.circle_id],
    visibility: 'circle'
  });

  return { success: true };
}
```

---

### 3.5 Invitation Landing Page (2 days)

**Web Page for Non-App Users:**
- [ ] Create landing page: `public/invite/[code].html`
- [ ] Fetch invitation details from API
- [ ] Display:
  - [ ] Inviter name and avatar
  - [ ] Circle name, emoji, description
  - [ ] Challenge name, emoji, description
  - [ ] Personal message
  - [ ] Social proof: "5 friends already competing"
  - [ ] Benefits list
  - [ ] Download app buttons (iOS + Android)
  - [ ] "Already have account? Login" link
- [ ] SEO optimization:
  - [ ] Meta tags with invitation details
  - [ ] Open Graph tags for social sharing
  - [ ] Dynamic title: "Join [Inviter] in [Circle]"
- [ ] Mobile-responsive design
- [ ] Deep link button that opens app if installed

**API Endpoint:**
- [ ] Create `/api/invitations/[code]` endpoint
- [ ] Return invitation details (without auth)
- [ ] Return 404 if expired or invalid

---

### 3.6 Invitation Management (1 day)

**Inviter Dashboard:**
- [ ] Create "My Invitations" page
- [ ] Show all invitations I've sent
- [ ] Filter: Pending / Accepted / Expired
- [ ] Each invitation shows:
  - [ ] Invitee name (if provided)
  - [ ] Circle + Challenge
  - [ ] Status
  - [ ] Created date
  - [ ] Accepted date (if accepted)
  - [ ] "Copy Link" button
  - [ ] "Resend" button (sends notification)
- [ ] Stats card:
  - [ ] Total invitations sent
  - [ ] Acceptance rate
  - [ ] Most successful circle

**Backend Service:**
- [ ] `getMyInvitations()` - fetch all invitations created by user
- [ ] `getInvitationStats(userId)` - aggregate stats

---

## Phase 4: Advanced Features (Month 2+)

### 4.1 Circle vs Circle Competition
- [ ] Global leaderboard of circles (not just members)
- [ ] Aggregate circle scores (average consistency)
- [ ] "Challenge Another Circle" feature
- [ ] Circle rivalry mechanics
- [ ] Circle badges and achievements

### 4.2 Strava Integration
- [ ] OAuth connection flow
- [ ] Store access tokens securely
- [ ] Subscribe to Strava webhooks
- [ ] Auto-verify fitness activities
- [ ] Rich leaderboards (pace, distance, elevation)
- [ ] "Verified by Strava" badge on activities
- [ ] Cross-post achievements to Strava

### 4.3 Apple Health / Google Fit Integration
- [ ] HealthKit integration (iOS)
- [ ] Google Fit integration (Android)
- [ ] Passive activity tracking
- [ ] Sleep tracking for sleep challenges
- [ ] Meditation minutes for meditation challenges
- [ ] Step tracking for step challenges

### 4.4 Challenge Templates
- [ ] Popular challenges pre-configured
- [ ] One-click circle challenge creation
- [ ] Community challenge library
- [ ] "Import Challenge" feature
- [ ] Template categories (fitness, wellness, productivity)

### 4.5 Advanced Notifications
- [ ] Daily digest emails
- [ ] Weekly progress reports
- [ ] "You're falling behind!" nudges
- [ ] "Your friend just passed you!" alerts
- [ ] Smart notification timing (ML-based)
- [ ] Notification preferences (frequency, types)

---

## 📊 Success Metrics

**Track These KPIs:**
- [ ] Challenge creation rate
- [ ] Challenge join rate
- [ ] Daily completion rate
- [ ] Challenge completion rate (% who finish)
- [ ] Invitation acceptance rate
- [ ] Viral coefficient (invites per user)
- [ ] User retention (D1, D7, D30)
- [ ] Daily active users in challenges
- [ ] Average challenge duration
- [ ] Most popular challenge types

---

## 🧪 Testing Checklist

**Before Each Release:**
- [ ] Create a test circle with test users
- [ ] Create a test challenge
- [ ] Join challenge as multiple users
- [ ] Complete activities and verify:
  - [ ] Leaderboard updates correctly
  - [ ] Streaks calculate correctly
  - [ ] Notifications sent at right time
  - [ ] Badges awarded correctly
- [ ] Test invitation flow end-to-end
- [ ] Test deep linking on iOS + Android
- [ ] Test with expired invitation
- [ ] Test with already-accepted invitation
- [ ] Test edge cases (leave challenge, rejoin, etc.)

---

## 🚀 Deployment Steps

**For Each Phase:**
1. [ ] Run database migrations in Supabase
2. [ ] Test on local dev environment
3. [ ] Deploy backend changes (if any)
4. [ ] Deploy web landing page (if Phase 3)
5. [ ] Build and test iOS app
6. [ ] Build and test Android app
7. [ ] Submit to TestFlight (iOS)
8. [ ] Submit to Google Play Internal Testing (Android)
9. [ ] Gather feedback from testers
10. [ ] Fix critical bugs
11. [ ] Release to production

---

## 📝 Notes

- Backend services layer already exists (✅ `supabase.challenges.service.ts`)
- Database schema already exists (✅ Phase 2 migration)
- Zustand store needs challenge slices
- Need to add challenge types to TypeScript types
- Consider rate limiting on invitation creation (max 10/day?)
- Consider invitation expiry cleanup job (delete after 30 days)

---

## 🎯 Priority Order

1. **Phase 1.2** - Challenge Detail View (core functionality)
2. **Phase 1.3A** - Daily Actions integration (where users interact daily)
3. **Phase 1.1B** - Notification system (engagement driver)
4. **Phase 3** - Invitation system (viral growth engine)
5. **Phase 2** - Social features (retention)
6. **Phase 4** - Advanced features (differentiation)

---

**Last Updated:** October 30, 2025
**Branch:** ChallangeAuto
**Status:** Ready to implement
