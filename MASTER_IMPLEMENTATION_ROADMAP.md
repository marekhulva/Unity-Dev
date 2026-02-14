# Master Implementation Roadmap - Unity 2.0
## Circles Rebuild + Challenges System

**Last Updated:** December 26, 2025
**Status:** 🟡 Planning Complete - Ready for Implementation

---

## 📊 Current State Summary

### ✅ What's Already Built

**Multiple Circles Support:**
- ✅ Database supports multiple circles (`circle_members` table)
- ✅ Users can join multiple circles
- ✅ Circle selector UI with horizontal tab scroll
- ✅ Circle creation with emoji picker
- ✅ Circle switching functionality
- ✅ Basic circle management

**Core App Foundation:**
- ✅ Daily actions system
- ✅ Social feed with posts
- ✅ Progress tracking (consistency, goals, stats)
- ✅ Profile system with public/private content
- ✅ Circle leaderboards based on consistency

### ❌ What Needs to Be Built

**Navigation Restructure:**
- ❌ Merge Progress into Profile as 3rd tab
- ❌ Add Challenges tab to bottom navigation
- ❌ Implement Progress tab with Option 8C design (filter dropdown)
- ❌ Add lock icon to Progress tab (private)

**Challenges System (Complete):**
- ❌ Database schema for challenges
- ❌ Challenge types (streak, cumulative, competition, team)
- ❌ Challenge discovery and joining
- ❌ Active challenges widget on Daily page
- ❌ Challenge leaderboards and feeds
- ❌ Badge system with success thresholds
- ❌ Circle-specific challenges (Challenges tab on Circle page)
- ❌ Challenge check-in functionality

**Circle Page Enhancements:**
- ❌ Add tabs to Circle page: Overview | Challenges | Members
- ❌ 7-day circle trend analytics (↑ or ↓)
- ❌ Top Contributor / Bottom Contributor display
- ❌ Circle-specific challenge leaderboards

---

## 🎯 Strategic Decisions Made

### Decision 1: Navigation Structure
**Bottom Nav:** `Social | Daily | Circle | Challenges | Profile`

**Profile Page Structure:**
```
Profile:
├─ Profile tab (public - avatar, bio, public goals)
├─ Posts tab (public - user's social posts)
└─ Progress tab (PRIVATE 🔒 - only visible to you)
   ├─ Consistency metrics
   ├─ Goal progress (with privacy filter)
   ├─ Weekly stats
   ├─ Challenge performance
   └─ Badges & achievements
```

**Circle Page Structure:**
```
Circle (e.g., "SF CIRCLE"):
├─ Overview tab (circle stats + consistency leaderboard)
├─ Challenges tab (circle-specific challenges)
└─ Members tab (all circle members)
```

### Decision 2: Challenge Integration Approach (Option C - Hybrid)

**Daily Page:**
- Active Challenges Widget at top
- Shows challenges you're IN with today's check-in
- Quick action: Complete challenge task

**Challenges Tab (New):**
- Discover (browse global + all circle challenges)
- Active (your joined challenges)
- Completed (challenge history)
- Each challenge → Leaderboard + Feed + About

**Progress Tab (in Profile):**
- Challenge performance section
- Personal stats, rankings across all challenges
- Badges earned
- Challenge history

**Circle Page - Challenges Tab:**
- Circle-specific challenges only
- Circle challenge leaderboards
- Circle challenge stats

### Decision 3: Progress Tab Design
**UI Pattern:** Option 8C (Filter Dropdown)
- Filter dropdown: "All Goals" | "Public Only" | "Private Only"
- Privacy badges on each item: 🌍 Public or 🔒 Private
- Color-coded borders: Green (public) / Red (private)
- Single unified scrollable list

**Reference Mockup:** http://localhost:8056/navigation-option-8c-you-tab-filter.html

### Decision 4: Challenge Rules

**Success Threshold System:**
- Each challenge has configurable success threshold (default: 80%)
- Threshold determines badge eligibility
- Varies by challenge type:
  - Streak-based: % of days completed
  - Cumulative: % of total target reached
  - Competition: Top X% or target reached
  - Team/Circle: Team average or placement

**Badge System:**
- Users collect badges for successfully completed challenges
- Displayed on Progress tab / Profile
- Optional tiered badges (Bronze/Silver/Gold) - TBD

**Circle Statistics:**
- 7-day circle trend analytics (↑ Going Up / ↓ Going Down)
- Top Contributor (MVP): Highest consistency in 7 days
- Bottom Contributor (needs better name): Lowest consistency - shown to group

---

## 🚀 Implementation Roadmap

### PHASE 1: Navigation Restructure (Week 1)
**Priority:** HIGH - Foundational change

**Tasks:**
1. **Profile Page Tabs**
   - [ ] Add tabs to ProfileScreen: Profile | Posts | Progress
   - [ ] Add lock icon (🔒) to Progress tab
   - [ ] Hide Progress tab when viewing other users' profiles
   - [ ] Ensure smooth tab transitions

2. **Progress Tab Implementation**
   - [ ] Move all ProgressScreen content into Progress tab
   - [ ] Implement Option 8C filter dropdown UI
   - [ ] Add privacy badges (🌍 Public / 🔒 Private)
   - [ ] Add color-coded borders (green/red)
   - [ ] Test filter functionality

3. **Bottom Navigation Update**
   - [ ] Remove Progress from bottom nav
   - [ ] Add Challenges placeholder to bottom nav
   - [ ] Update navigation routes
   - [ ] Test navigation flow

**Deliverable:** Profile page with 3 tabs, Progress removed from bottom nav

---

### PHASE 2: Database Schema for Challenges (Week 1-2)
**Priority:** HIGH - Required for all challenge features

**Tasks:**
1. **Create Challenges Tables**
   ```sql
   challenges:
     - id (uuid)
     - name (text)
     - description (text)
     - type (enum: streak, cumulative, competition, team)
     - scope (enum: global, circle)
     - circle_id (uuid, nullable)
     - duration_days (integer)
     - start_date (timestamptz)
     - end_date (timestamptz)
     - success_threshold (integer, default 80)
     - created_by (uuid)
     - emoji (varchar)
     - rules (jsonb)
     - created_at (timestamptz)

   challenge_participants:
     - id (uuid)
     - challenge_id (uuid)
     - user_id (uuid)
     - joined_at (timestamptz)
     - current_streak (integer)
     - total_completions (integer)
     - completion_percentage (integer)
     - last_check_in (timestamptz)
     - rank (integer)
     - badge_earned (boolean)
     - badge_tier (enum: bronze, silver, gold, nullable)

   challenge_check_ins:
     - id (uuid)
     - challenge_id (uuid)
     - user_id (uuid)
     - date (date)
     - value (numeric, for cumulative)
     - completed (boolean)
     - created_at (timestamptz)

   challenge_posts:
     - post_id (uuid, references posts)
     - challenge_id (uuid, references challenges)
     - created_at (timestamptz)
   ```

2. **RLS Policies**
   - [ ] Challenge visibility based on scope (global vs circle)
   - [ ] Participant data access policies
   - [ ] Check-in permissions
   - [ ] Challenge creation permissions

3. **Backend Services**
   - [ ] `challengeService.ts` - CRUD operations
   - [ ] `challengeParticipantService.ts` - Join/leave/check-in
   - [ ] `challengeLeaderboardService.ts` - Rankings calculation
   - [ ] `challengeBadgeService.ts` - Badge award logic

**Deliverable:** Complete challenge database schema with backend services

---

### PHASE 3: Challenge Discovery & Joining (Week 2-3)
**Priority:** HIGH - Core user flow

**Tasks:**
1. **Challenges Tab Screen**
   - [ ] Create ChallengesScreen.tsx
   - [ ] Add to bottom navigation
   - [ ] Implement tab structure: Discover | Active | Completed

2. **Discover View**
   - [ ] Browse all available challenges
   - [ ] Filter: Global / My Circles / All
   - [ ] Challenge cards with:
     - Name, emoji, description
     - Participant count
     - Duration, start/end date
     - Success threshold
     - "Join" button
   - [ ] Search functionality

3. **Join Challenge Flow**
   - [ ] Challenge detail modal
   - [ ] Show: Overview | Leaderboard | Feed | About
   - [ ] Join button with confirmation
   - [ ] Add to user's active challenges

4. **Active Challenges View**
   - [ ] List of user's active challenges
   - [ ] Show current rank, progress
   - [ ] Quick access to check-in
   - [ ] Tap to see full details

5. **Completed Challenges View**
   - [ ] Historical list of completed challenges
   - [ ] Show badges earned
   - [ ] Show final rank and completion %
   - [ ] Challenge stats

**Deliverable:** Working Challenges tab with discovery and joining

---

### PHASE 4: Daily Page Integration (Week 3-4)
**Priority:** HIGH - Daily user action flow

**Tasks:**
1. **Active Challenges Widget**
   - [ ] Create ActiveChallengesWidget component
   - [ ] Position at top of Daily page
   - [ ] Show all active challenges user is in
   - [ ] Compact card design:
     - Challenge name, emoji
     - Today's status (completed or not)
     - Current streak or progress
     - Quick check-in button

2. **Challenge Check-In Functionality**
   - [ ] Tap "Check In" button
   - [ ] Mark today's challenge as complete
   - [ ] Update streak/progress
   - [ ] Show success animation
   - [ ] Option to post about it

3. **Challenge-Daily Action Link**
   - [ ] If challenge tied to specific action, show connection
   - [ ] Completing action auto-checks-in to challenge
   - [ ] Visual indicator linking action to challenge

**Deliverable:** Active challenges visible on Daily page with check-in

---

### PHASE 5: Circle Page Enhancement (Week 4-5)
**Priority:** MEDIUM - Circle-specific features

**Tasks:**
1. **Add Tabs to Circle Page**
   - [ ] Restructure CircleScreen to use tabs
   - [ ] Overview | Challenges | Members

2. **Overview Tab**
   - [ ] Keep existing circle stats
   - [ ] Keep consistency leaderboard
   - [ ] Add 7-day trend analytics (↑ or ↓)
   - [ ] Show Top Contributor (MVP)
   - [ ] Show Bottom Contributor (decide on name)

3. **Challenges Tab**
   - [ ] List circle-specific challenges
   - [ ] Only challenges for THIS circle
   - [ ] Show user's rank in each
   - [ ] "Create Challenge" button (circle admins)
   - [ ] Tap challenge → full detail view

4. **Members Tab**
   - [ ] Simple list of all members
   - [ ] Show consistency %
   - [ ] Tap to view profile

5. **Circle Trend Analytics**
   - [ ] Calculate 7-day rolling average
   - [ ] Compare week-over-week
   - [ ] Display ↑ or ↓ indicator
   - [ ] Backend: Daily calculation job

**Deliverable:** Circle page with tabs, trends, and challenges

---

### PHASE 6: Challenge Leaderboards & Social (Week 5-6)
**Priority:** MEDIUM - Social engagement

**Tasks:**
1. **Challenge Detail View**
   - [ ] Create ChallengeDetailModal component
   - [ ] Tabs: Overview | Leaderboard | Feed | About

2. **Leaderboard Tab**
   - [ ] Ranked list of participants
   - [ ] Show: Avatar, name, progress, rank
   - [ ] Highlight current user
   - [ ] Real-time rank updates
   - [ ] Filter: All time / This week / Today

3. **Feed Tab**
   - [ ] Challenge-specific posts feed
   - [ ] Posts tagged with this challenge
   - [ ] "Post to challenge" button
   - [ ] Comments and likes

4. **About Tab**
   - [ ] Challenge description
   - [ ] Rules
   - [ ] Duration, dates
   - [ ] Success threshold
   - [ ] Creator info
   - [ ] Participant count

5. **Post Integration**
   - [ ] When completing challenge, prompt to post
   - [ ] Posts auto-tagged with challenge
   - [ ] Posts appear in both main feed AND challenge feed
   - [ ] Challenge badge on posts

**Deliverable:** Full challenge detail views with leaderboards and feeds

---

### PHASE 6.5: Reddit-Style Forum for Global Challenges (Week 6)
**Priority:** MEDIUM - High engagement value for large challenges

**Why Forum vs Feed:**
- **Feed** = Activity posts (check-ins, progress updates, celebrations)
- **Forum** = Discussion threads (tips, questions, strategies, advice)
- Global challenges can have 100s-1000s of participants
- Structured discussion helps community knowledge sharing

**Tasks:**
1. **Database Schema**
   - [ ] Create `challenge_forum_threads` table
   - [ ] Create `challenge_forum_replies` table (supports nested replies)
   - [ ] Create `challenge_forum_votes` table (upvote/downvote)
   - [ ] RLS policies for forum access
   - [ ] Indexes for performance

2. **Forum Tab UI**
   - [ ] Add "Forum" tab to Challenge Detail view (Global challenges only)
   - [ ] Thread list view with sorting: Hot | New | Top
   - [ ] Categories: Tips, Questions, Motivation, Strategy
   - [ ] Thread preview cards showing:
     - Category icon (💡 Tips, ❓ Questions, etc.)
     - Title, preview of body
     - Upvote count, reply count, time posted
     - 📌 Pin indicator for pinned threads

3. **Create Thread Flow**
   - [ ] "New Thread" button
   - [ ] Modal with:
     - Title input
     - Body (rich text editor)
     - Category selector
   - [ ] Post thread
   - [ ] Navigate to thread detail

4. **Thread Detail View**
   - [ ] Full thread content (title, body, author, timestamp)
   - [ ] Upvote/downvote buttons
   - [ ] Reply section
   - [ ] Nested/threaded replies (like Reddit)
   - [ ] "Load more replies" for long threads
   - [ ] Upvote individual replies

5. **Forum Features**
   - [ ] Upvote/downvote logic (prevent double voting)
   - [ ] Sort threads by: Hot (upvotes + recency), New (timestamp), Top (all-time upvotes)
   - [ ] Pin thread functionality (challenge creator/admins)
   - [ ] Search within forum
   - [ ] Report inappropriate content

6. **Backend Services**
   - [ ] `challengeForumService.ts`
     - createThread()
     - getThreads() with sorting/filtering
     - getThreadDetail()
     - addReply()
     - upvoteThread() / downvoteThread()
     - pinThread()
   - [ ] Vote counting logic
   - [ ] Hot algorithm (Reddit-style scoring)

**Circle Challenges:**
- Skip Forum tab for circle challenges (smaller groups, discussion happens naturally)
- OR: Add Forum for large circles (50+ members) - TBD

**UI Design Pattern:**
```
Challenge Detail:
┌────────────────────────────────────┐
│ [Overview] [Leaderboard] [Feed] [Forum] [About] │
├────────────────────────────────────┤
│ Forum Tab:                         │
│ [Sort: Hot ▼]    [+ New Thread]   │
├────────────────────────────────────┤
│ 📌 PINNED                          │
│ Official Tips & Tricks             │
│ ↑234 • 45 replies • 2d ago        │
├────────────────────────────────────┤
│ 💡 Tips                            │
│ How I got through day 10-20        │
│ ↑89 • 12 replies • 5h ago         │
├────────────────────────────────────┤
│ ❓ Questions                       │
│ Is morning or evening better?      │
│ ↑56 • 23 replies • 1d ago         │
└────────────────────────────────────┘
```

**Deliverable:** Working forum system for global challenges with discussion threads and voting

---

### PHASE 7: Badge System & Rewards (Week 6-7)
**Priority:** MEDIUM - Motivation & gamification

**Tasks:**
1. **Badge Award Logic**
   - [ ] Background job runs at challenge end_date
   - [ ] Calculate completion_percentage per user
   - [ ] Award badge if >= success_threshold
   - [ ] Optional: Determine tier (Bronze/Silver/Gold)
   - [ ] Update challenge_participants table

2. **Badge Display**
   - [ ] Show badges on Progress tab
   - [ ] Badge collection view
   - [ ] Badge details: Challenge, date, completion %
   - [ ] Share badge functionality

3. **Notifications**
   - [ ] Badge earned notification
   - [ ] Challenge ending soon notification
   - [ ] New circle challenge notification
   - [ ] Rank change notification

4. **Badge UI**
   - [ ] Badge icon design
   - [ ] Tier colors (Bronze/Silver/Gold)
   - [ ] Badge showcase on profile
   - [ ] Empty state when no badges

**Deliverable:** Working badge system with display and notifications

---

### PHASE 8: Challenge Creation (Week 7-8)
**Priority:** LOW - Admin/power user feature

**Tasks:**
1. **Create Challenge Modal**
   - [ ] Name, description, emoji
   - [ ] Challenge type selection
   - [ ] Scope: Global or Circle
   - [ ] Duration (start/end dates)
   - [ ] Success threshold setting
   - [ ] Rules configuration

2. **Challenge Types Setup**
   - [ ] Streak-based: Daily check-in (yes/no)
   - [ ] Cumulative: Enter value daily (e.g., minutes)
   - [ ] Competition: Track highest/most
   - [ ] Team: Circle vs Circle

3. **Permissions**
   - [ ] Circle admins can create circle challenges
   - [ ] Global challenges (admin only? or anyone?)
   - [ ] Edit/delete challenge (creator only)

**Deliverable:** Challenge creation flow for admins/circle creators

---

### PHASE 9: Testing & Polish (Week 8-9)
**Priority:** HIGH - Quality assurance

**Tasks:**
1. **Functional Testing**
   - [ ] Test all challenge types
   - [ ] Test join/leave flows
   - [ ] Test check-in functionality
   - [ ] Test leaderboard accuracy
   - [ ] Test badge awards
   - [ ] Test circle-specific challenges
   - [ ] Test privacy (circle vs global)

2. **Performance Testing**
   - [ ] Leaderboard query optimization
   - [ ] Feed loading with challenges
   - [ ] Badge calculation efficiency
   - [ ] Large challenge participant counts

3. **UI/UX Polish**
   - [ ] Animations and transitions
   - [ ] Loading states
   - [ ] Empty states
   - [ ] Error handling
   - [ ] Success feedback

4. **Edge Cases**
   - [ ] Challenge ending during user session
   - [ ] Leaving circle with active challenges
   - [ ] Deleting circle with challenges
   - [ ] User with 20+ active challenges

**Deliverable:** Tested, polished, production-ready challenge system

---

### PHASE 10: Global Challenge Discovery Carousel (Post-Launch)
**Priority:** LOW - Future enhancement for discovery optimization

**Background:**
From Option B mockup (http://localhost:8056/challenge-options-all.html), we liked the "🏆 Your Active Challenges" carousel design. We want to **repurpose this UI pattern** for a different use case: **discovering and joining global challenges**.

**Original Design (Option B):**
- Showed YOUR active challenges in a horizontal carousel
- Compact cards with emoji, name, progress, progress bar
- At top of Social page

**New Purpose:**
- Show challenges you CAN JOIN (discovery)
- Help users find trending/popular global challenges
- Low-friction joining directly from carousel

**What to Build:**

1. **Carousel Component**
   - [ ] Horizontal scrollable carousel (not swiper)
   - [ ] Position: Top of Social page (or Challenges tab > Discover)
   - [ ] Header: "🌍 Discover Global Challenges" + "See All" link
   - [ ] Shows 3-4 cards at once, scroll for more

2. **Challenge Card Design**
   ```
   ┌───────────────────┐
   │  ❄️               │  ← Emoji (large)
   │  Cold Shower      │  ← Challenge name
   │  30 Day Challenge │  ← Duration
   │  1,234 joined     │  ← Participant count
   │  [Join Challenge] │  ← Join button
   └───────────────────┘
   ```

3. **Data & Logic**
   - [ ] Query: Get top global challenges (by trending/new/popular)
   - [ ] Filter out challenges user already joined
   - [ ] Show: Emoji, name, duration, participant count
   - [ ] Tap card → Show challenge detail modal
   - [ ] Tap "Join" → Trigger join flow
   - [ ] After join → Update carousel (remove joined challenge)

4. **User Flow**
   ```
   1. User opens Social page
   2. Sees carousel at top with trending challenges
   3. Scrolls horizontally through options
   4. Taps a card → Challenge detail modal opens
   5. Reads overview, leaderboard, etc.
   6. Taps "Join Challenge"
   7. Challenge added to their active challenges
   8. Now appears in Daily widget + Profile > Progress tab
   ```

5. **Carousel Variants** (A/B test later)
   - Sort by: Trending | New | Ending Soon | Most Popular
   - Personalized: Based on user's goals/interests
   - Seasonal: Highlight holiday/season challenges
   - Circle-relevant: Show challenges from user's circles

**Why It's a Future Feature:**
- Not critical for MVP launch
- Requires challenge system to be fully built first
- Need 10+ global challenges to make carousel worthwhile
- Can measure discovery metrics after basic implementation
- Nice UX enhancement, not blocker

**When to Implement:**
- After Phase 9 (Testing & Polish) is complete
- When we have 10+ active global challenges
- When we observe users struggling to find challenges
- Part of "Engagement Optimization" sprint post-launch

**Success Metrics:**
- Carousel impression rate (% of Social page views)
- Card tap rate (% who interact with carousel)
- Join conversion rate (carousel → join challenge)
- Compare discovery: Carousel vs Challenges tab

**Reference Mockup:**
http://localhost:8056/challenge-options-all.html (Option B)

**Technical Notes:**
- Reuse carousel component from Option B HTML
- Ensure mobile responsiveness (touch scrolling)
- Cache challenge data (refresh every 5 mins)
- Lazy load images/emojis
- Analytics tracking on each interaction

**Notes for Future Implementation:**
- Review Option B mockup before building (design already exists)
- Consider adding "Dismiss" option (user can hide carousel)
- Could replace with "Your Active Challenges" carousel if user has 3+ active
- Track which challenges get most clicks for algorithm optimization

**Deliverable:** Discovery carousel driving increased challenge participation

---

## 📋 Implementation Priority Matrix

### Must Have (Launch Blockers)
1. Navigation restructure (Profile tabs)
2. Challenge database schema
3. Challenge discovery & joining
4. Daily page widget
5. Basic leaderboards

### Should Have (Launch v1)
6. Circle page challenges tab
7. Challenge feeds
8. Badge system
9. Circle trend analytics

### Nice to Have (Future iterations)
10. Challenge creation (for users)
11. Advanced badge tiers
12. Challenge templates
13. Inter-circle competitions
14. Global challenge discovery carousel (Option B repurposed)

---

## 🏁 How to Start (Step-by-Step)

### Day 1: Navigation Restructure Prep
1. Read current ProfileScreen.tsx and ProgressScreen.tsx
2. Review Option 8C mockup design thoroughly
3. Plan component structure for tabbed Profile
4. Create branch: `feature/profile-progress-merge`

### Day 2-3: Implement Profile Tabs
1. Add tab navigation to ProfileScreen
2. Create ProgressTab component
3. Move ProgressScreen content into ProgressTab
4. Implement filter dropdown (Option 8C)
5. Add privacy badges and color coding
6. Test thoroughly

### Day 4: Update Bottom Navigation
1. Remove Progress from bottom nav
2. Add Challenges placeholder
3. Update route configuration
4. Test navigation flow

### Day 5-7: Challenge Database Schema
1. Write SQL migration file
2. Create TypeScript types
3. Implement RLS policies
4. Test database operations
5. Create backend service files (empty shells)

### Week 2: Begin Challenge Implementation
1. Start with PHASE 3 (Discovery & Joining)
2. Build ChallengesScreen skeleton
3. Implement Discover view
4. Build challenge cards
5. Create join flow

**Continue following phases in order...**

---

## 📚 Reference Documentation

**Strategy & Decisions:**
- `CHALLENGE_STRATEGY_SESSION.md` - Full strategy analysis
- `CHALLENGE_IMPLEMENTATION_ROADMAP.md` - Detailed decisions
- `CIRCLES.md` - Multi-circle architecture
- `MULTIPLE_CIRCLES_PLAN.md` - Circle implementation history

**Mockups:**
- http://localhost:8056/challenge-options-all.html - All challenge options
- http://localhost:8056/navigation-options-all.html - Navigation options
- http://localhost:8056/navigation-options-progress-profile-all.html - Progress/Profile merge
- http://localhost:8056/navigation-option-8c-you-tab-filter.html - Selected design (Option 8C)
- http://localhost:8056/circle-page-complete.html - Circle page with tabs

**Code References:**
- `src/features/profile/ProfileScreen.tsx` - Current profile implementation
- `src/features/progress/ProgressScreen.tsx` - Current progress implementation
- `src/features/circles/` - Circle implementation
- `src/state/` - Zustand state management

---

## ⚠️ Important Notes

### Design Consistency
- Use existing dark luxury theme (black + gold accents)
- Follow current component patterns
- Maintain visual consistency across all screens

### Privacy Considerations
- Progress tab is PRIVATE (only visible to owner)
- Circle challenges only visible to circle members
- Global challenges visible to everyone
- Private goals stay private even in challenges

### Performance Considerations
- Leaderboards: Cache rankings, update every 5 minutes
- Challenge feeds: Paginate, lazy load
- Badge calculations: Background job, not real-time
- Circle stats: Pre-calculate daily

### Data Migration
- Existing users must not break
- Backward compatibility during transition
- Gradual rollout (test with one circle first)

---

## 🎯 Success Criteria

**Launch Ready When:**
- ✅ Navigation restructure complete (Profile with tabs)
- ✅ Challenge discovery and joining works
- ✅ Users can check-in to challenges daily
- ✅ Leaderboards display correctly
- ✅ Badges award on challenge completion
- ✅ Circle challenges separated from global
- ✅ No major bugs in testing
- ✅ Performance acceptable (< 2s load times)

**Metrics to Track:**
- % of users joining challenges
- Average challenges per user
- Daily check-in rate
- Challenge completion rate
- Badge distribution
- Engagement increase (posts, comments)

---

**Ready to begin?** Start with Day 1 tasks and work through phases sequentially.

**Questions?** Refer to strategy docs or ask for clarification before building.

**Status:** 🟢 All planning complete, ready for implementation
