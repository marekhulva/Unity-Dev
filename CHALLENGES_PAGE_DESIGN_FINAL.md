# Challenges Page - Final Design Specification
## Complete Design with User Clarifications

**Created:** December 26, 2025
**Status:** 🟢 Finalized - Ready for Implementation
**HTML Mockup:** `challenges-page-complete.html`

---

## 🎯 Core Concept: How Challenges Work

**CRITICAL UNDERSTANDING:**

Challenges are NOT just tracking if you did something. **Challenges come with PREDETERMINED ACTIVITIES.**

### Example: "30 Day Cold Shower" Challenge

1. **Challenge Creation:**
   - Admin/creator sets up challenge: "30 Day Cold Shower Challenge"
   - Challenge includes a **predetermined activity**: "Cold Shower ❄️"
   - Duration: 30 days
   - Success threshold: 80% (complete 24/30 days)

2. **When User Joins:**
   - User clicks "Join Challenge"
   - The "Cold Shower ❄️" activity **automatically gets added to their Daily page**
   - Activity appears EVERY DAY for 30 days
   - Activity is **tagged to the challenge**

3. **Daily Check-ins:**
   - User opens Daily page
   - Sees "Cold Shower ❄️" in their action list
   - Completes it (mark as done)
   - **This completion counts toward the challenge**
   - User can post about it (photo, note, etc.)
   - Post appears in **Challenge Feed** (filtered by challenge)

4. **Feed Filtering:**
   - Challenge Feed shows ONLY posts related to that challenge's activities
   - If user posts about "Cold Shower" completion → Shows in "30 Day Cold Shower" feed
   - Other activities user does → NOT shown in this challenge feed
   - **Only participants of the challenge see these posts**

---

## 📱 Page Structure

### **Bottom Navigation**

```
Social | Daily | Circle | CHALLENGES | Profile
```

**Challenges tab is the new 4th tab** (replaced Progress which moved to Profile)

---

## 🏆 CHALLENGES SCREEN - Main View

### **Tab Structure**

```
Challenges Page:
├─ Discover (browse & join new challenges) ← DEFAULT FIRST VIEW
├─ Active (your joined challenges)
└─ Completed (challenge history & badges)
```

**User Flow:**
1. User clicks Challenges tab in bottom navigation
2. **Sees Discover tab first** (default view)
3. Browses available challenges
4. Taps "View Details" to see challenge information
5. Sees "About" tab with "Join" button
6. Joins challenge → Activity auto-added to Daily page
7. Challenge appears in **Active** tab

---

### **TAB 1: DISCOVER** (Default First View)

**What you see:**
- Search bar at top
- Filter chips: All | Global | Circle | Streak | Cumulative
- Browse all available challenges (global + your circles)
- Sort by: Trending | Starting Soon | Most Popular

**Each Challenge Card Shows:**
```
┌─────────────────────────────────┐
│ 📚 Read 30 Minutes Daily        │
│ Global • 30 Days                │
│                                 │
│ 1,234 participants              │
│ Starts: Jan 1, 2026             │
│                                 │
│ Success: 80% completion         │
│ Badge: 🏆 Gold Reader           │
│                                 │
│ [View Details] [Join Challenge] │
└─────────────────────────────────┘
```

**Tap card → Opens Challenge Detail View (even if NOT joined)**
**Tap Join → Joins challenge, adds activities to Daily page**

---

### **TAB 2: ACTIVE**

**What you see:**
- List of all challenges you're currently participating in
- Empty state if no active challenges: "No active challenges. Browse Discover to join!"

**Each Challenge Card Shows:**
```
┌─────────────────────────────────┐
│ ❄️ 30 Day Cold Shower          │
│ Global Challenge                │
│                                 │
│ Day 12/30 ████████░░░░░░ 40%   │
│                                 │
│ Your Rank: #127 • Top 5%       │
│ Current Streak: 12 days 🔥     │
│                                 │
│ [View Details]                  │
└─────────────────────────────────┘
```

**Tap card → Opens Challenge Detail View**

---

### **TAB 3: COMPLETED**

**What you see:**
- List of challenges you've completed
- Show: Badge earned (or failed status)
- Final rank, completion %, date completed

**Each Completed Challenge Card:**
```
┌─────────────────────────────────┐
│ ✅ 75 Hard Challenge            │
│ Completed Jan 15, 2026          │
│                                 │
│ 🏆 Gold Badge Earned            │
│                                 │
│ Final Stats:                    │
│ • Rank: #23/1,045 (Top 2%)     │
│ • Completion: 73/75 (97%)       │
│ • Longest Streak: 58 days       │
│                                 │
│ [View Details]                  │
└─────────────────────────────────┘
```

---

## 🔍 CHALLENGE DETAIL VIEW

**Opened when:**
- User taps any challenge card (Active, Discover, or Completed)
- Works for joined AND un-joined challenges

### **Tab Structure**

**Global Challenges (3 tabs):**
```
Challenge: "❄️ 30 Day Cold Shower"
┌─────────────────────────────────┐
│ [Overview] [Feed] [Forum]       │
└─────────────────────────────────┘
```

**Circle Challenges (2 tabs):**
```
Challenge: "💪 SF Morning Workout"
┌───────────────────────┐
│ [Overview] [Feed]     │
└───────────────────────┘
```

**Key Changes:**
- ✅ **Overview is now ALL-IN-ONE** (Stats + Leaderboard + About sections merged)
- ✅ Global challenges have Forum tab
- ✅ Circle challenges skip Forum tab
- ✅ Simplified navigation: Everything in Overview, no need to switch tabs for basic info

**Overview Tab Includes:**
1. **Stats Section**: Challenge dates, participants, requirements
2. **Your Progress**: Day X/Y, progress bar, rank, streak, check-in button
3. **Leaderboard Preview**: Top 3 + your position + nearby ranks (with "View Full" button)
4. **Challenge Details**: Duration, badge, type, creator
5. **Description**: What the challenge is about
6. **Benefits** (if applicable): Why join this challenge
7. **Rules**: Success criteria and requirements
8. **Activities Included**: Which activities will be added to Daily page

**If user has NOT joined:**
- Shows all tabs (can browse before joining)
- "Join Challenge" button floats at bottom
- Default view: **Overview tab** (scrolled to Description section)

**If user HAS joined:**
- Shows all tabs
- Default view: **Overview tab** (scrolled to top - Stats & Progress)
- "Leave Challenge" button in settings/overflow menu

---

### **TAB 1: OVERVIEW** (All-in-One Tab)

**Complete scrollable view with everything:**

```
┌─────────────────────────────────┐
│ ❄️ 30 Day Cold Shower          │
│ Global Challenge                │
│                                 │
│ 🗓️ Dec 1 - Dec 30, 2025        │
│ 👥 1,234 participants           │
│ 🎯 80% completion required      │
└─────────────────────────────────┘

Your Progress:
┌─────────────────────────────────┐
│ Day 12/30                       │
│ ████████░░░░░░░░░░░░ 40%        │
│                                 │
│ Rank #127 • Top 5%              │
│ Streak: 12 days 🔥              │
│                                 │
│ [✅ Check In Now]               │
│ (if activity not done today)    │
└─────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Leaderboard:
Sort: [Rank ▼] [Streak] [Progress %]

🏆 TOP 3
┌─────────────────────────────────┐
│ 🥇 #1 @sarah_runs              │
│    30/30 • Streak: 30 🔥        │
├─────────────────────────────────┤
│ 🥈 #2 @mike_fitness            │
│    30/30 • Streak: 30 🔥        │
├─────────────────────────────────┤
│ 🥉 #3 @jenny_strong            │
│    29/30 • Streak: 25 🔥        │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ #127 YOU                    ⭐  │
│      12/30 • Streak: 12 🔥      │
│      Top 5%                     │
└─────────────────────────────────┘

#128 @alex_daily • 12/30 • Streak: 10 🔥
#129 @chris_fit • 11/30 • Streak: 11 🔥

[View Full Leaderboard]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Challenge Details:
• 📅 Duration: 30 days
• 🗓️ Dec 1 - Dec 30, 2025
• 🎯 Success: 24/30 days (80%)
• 🏆 Badge: ❄️ Ice Warrior (Gold)
• 🎮 Type: Streak Challenge
• 👤 Created by: @wellness_coach

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Description:
Take a cold shower every day for 30 days
to build mental toughness and improve health.

Benefits:
• Improved circulation
• Mental resilience
• Immune system boost
• Better skin & hair

Rules:
• Shower must be at least 2 minutes
• Water must be cold (no warm start)
• Complete 24/30 days to earn badge

Activities Included:
┌─────────────────────────────────┐
│ ❄️ Cold Shower                  │
│ Daily • 2 min minimum           │
│ (Auto-added to your Daily page) │
└─────────────────────────────────┘
```

**Features:**
- **Single scrollable view** with all challenge information
- Shows top 3 + your position + nearby ranks
- "View Full Leaderboard" button expands to full page
- Filter leaderboard: All | Friends | Circle Members
- Real-time progress updates
- No need to switch tabs for basic info

---

### **TAB 2: FEED**

**Activity/Progress posts from participants:**

**ONLY posts related to THIS challenge's activities**
- User completed "Cold Shower ❄️" activity → Post shows here
- User posts photo/note with completion → Shows here
- User completed other activities → Does NOT show here

**Feed Items:**
```
┌─────────────────────────────────┐
│ @sarah_runs • 2 hours ago       │
│                                 │
│ Day 28/30! Almost there! ❄️🔥   │
│                                 │
│ [Photo of cold shower]          │
│                                 │
│ 💙 47  💬 12  🔥 23             │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ @mike_fitness • 5 hours ago     │
│                                 │
│ Day 30! Challenge complete!      │
│ Hit a new record today 🏆       │
│                                 │
│ [Video clip]                    │
│                                 │
│ 💙 152  💬 38  🔥 89            │
└─────────────────────────────────┘

[Check-in with Cold Shower activity]
^^ Floating button at bottom
```

**Features:**
- Only participants see this feed
- Sorted by: Recent | Popular
- React, comment, share
- Filter: All | Friends | Following

**Empty State:**
- "No posts yet. Complete the challenge and share your progress!"

---

### **TAB 3: FORUM** (Reddit-Style Discussion)

**ONLY for Global Challenges**
- Circle challenges skip this tab (smaller groups, discussion happens naturally)

**Discussion threads separate from activity feed:**

```
Sort: [Hot ▼] [New] [Top]  [+ New Thread]

Categories:
[💡 Tips] [❓ Questions] [💪 Motivation] [🎯 Strategy]

📌 PINNED
┌─────────────────────────────────┐
│ 💡 Tips for First-Timers        │
│ by @admin • 234 ⬆️ • 56 replies │
│                                 │
│ Welcome! Here are some tips...  │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ ❓ Best time of day for cold... │
│ by @jenny_strong • 89 ⬆️ • 34 replies │
│                                 │
│ I've been doing mornings but... │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 💪 How do you stay motivated... │
│ by @alex_daily • 67 ⬆️ • 28 replies │
│                                 │
│ Day 15 and struggling. What...  │
└─────────────────────────────────┘

... (infinite scroll)
```

**Tap thread → Opens thread detail:**
```
┌─────────────────────────────────┐
│ ← Back to Forum                 │
├─────────────────────────────────┤
│ ❓ Best time of day for cold    │
│    showers?                     │
│                                 │
│ by @jenny_strong • 2 days ago   │
│ 89 ⬆️ • 34 replies              │
├─────────────────────────────────┤
│                                 │
│ I've been doing mornings but    │
│ I'm freezing all day. Does      │
│ evening work better?            │
│                                 │
│ ⬆️ 89  ⬇️ 2  [Reply]           │
├─────────────────────────────────┤
│                                 │
│ 💬 @mike_fitness (⬆️ 45)        │
│    I do evenings! Helps me...   │
│                                 │
│    ↪️ @sarah_runs (⬆️ 23)       │
│       Same here! The key is...  │
│                                 │
│ 💬 @chris_fit (⬆️ 31)           │
│    Morning is better for...     │
│                                 │
│    ↪️ @jenny_strong (⬆️ 12)     │
│       Thanks! I'll try...       │
│                                 │
└─────────────────────────────────┘

[Write a reply...]
```

**Features:**
- Upvote/downvote threads and replies
- Nested threaded replies (like Reddit)
- Sort by: Hot (upvotes + recency) | New | Top
- Categories: Tips, Questions, Motivation, Strategy
- Pin important threads (admins)
- Search within forum
- Report inappropriate content

**Empty State:**
- "No discussions yet. Start the conversation!"

---

## 🔄 How Activities Work

### **Before Joining Challenge:**

**User's Daily Page:**
```
Daily Actions:
├─ Morning Meditation (their existing action)
├─ 10 Push-ups (their existing action)
└─ Read 20 pages (their existing action)
```

### **User Joins "30 Day Cold Shower" Challenge:**

**What Happens:**
1. User taps "Join Challenge" button
2. Backend adds challenge activities to user's daily actions
3. Activities are tagged with `challenge_id`

**User's Daily Page (After Joining):**
```
🏆 Active Challenges Widget
┌─────────────────────────────────┐
│ ❄️ 30 Day Cold Shower • Day 1/30│
│ ████░░░░░░░░░░░░ 3%             │
└─────────────────────────────────┘

Daily Actions:
├─ ❄️ Cold Shower ⭐️ NEW! (from challenge)
├─ Morning Meditation (their existing action)
├─ 10 Push-ups (their existing action)
└─ Read 20 pages (their existing action)
```

**Challenge activity appears EVERY DAY for 30 days**

### **User Completes Activity:**

1. User marks "❄️ Cold Shower" as done in Daily page
2. Completion is saved to database with `challenge_id` tag
3. User can optionally post about it (photo, note, etc.)
4. Post appears in **Challenge Feed** (only participants see it)
5. Completion counts toward challenge progress (Day 1 → Day 2)
6. Leaderboard updates with new progress

---

## 🌍 Global Challenges vs Circle Challenges

### **Global Challenges**

**Characteristics:**
- Open to ALL users
- Can have 100s or 1000s of participants
- Created by admins or verified users

**Tabs Available (3 tabs):**
```
Overview (all-in-one) | Feed | Forum
```

**Why Forum?**
- Large community needs structured discussion
- Tips help beginners
- Q&A format works for big groups
- Knowledge sharing at scale

---

### **Circle Challenges**

**Characteristics:**
- Only for specific circle members
- Typically 5-50 participants
- Created by circle members or admins

**Tabs Available (2 tabs):**
```
Overview (all-in-one) | Feed
```

**Why NO Forum?**
- Smaller groups (discussion happens naturally in circle)
- Circle already has its own communication
- Less need for structured threads
- Keeps it simpler

**Why all-in-one Overview tab?**
- **Reduces cognitive load** - Fewer tabs to navigate
- **Common user flow** - Check progress → See leaderboard → Read details (all in one scroll)
- **Everything accessible** - Stats, progress, leaderboard, rules, and activities all in one place
- **No tab switching** - All basic info available without navigation
- **"View Full Leaderboard" button** - Expands when deeper dive needed
- **Cleaner UX** - Streamlined from 5 tabs (old) → 3 tabs (global) or 2 tabs (circle)

---

## 📊 Database Schema Implications

### **Challenges Table**
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
  - predetermined_activities (jsonb[])  ← Activities to add to Daily
  - has_forum (boolean, default true for global, false for circle)
```

### **Predetermined Activities Format**
```json
{
  "predetermined_activities": [
    {
      "title": "Cold Shower",
      "emoji": "❄️",
      "frequency": "daily",
      "min_duration_minutes": 2,
      "description": "Take a cold shower for at least 2 minutes"
    }
  ]
}
```

### **When User Joins Challenge**
```sql
-- 1. Add to challenge_participants
INSERT INTO challenge_participants (challenge_id, user_id, joined_at)

-- 2. For each predetermined activity in challenge
INSERT INTO actions (
  user_id,
  title,
  emoji,
  frequency,
  challenge_id,  ← Link to challenge
  start_date,
  end_date
)
```

### **Challenge Feed Filtering**
```sql
-- Get posts for challenge feed
SELECT posts.*
FROM posts
JOIN actions ON posts.action_id = actions.id
WHERE actions.challenge_id = $challenge_id
  AND posts.visibility IN ('public', 'circle')
ORDER BY posts.created_at DESC
```

---

## 🎨 Visual Reference

**HTML Mockup:** `challenges-page-complete.html`

**Shows:**
- Complete Challenges page (Active/Discover/Completed tabs)
- Challenge Detail view (all 5 tabs)
- Global challenge with Forum
- Circle challenge without Forum
- How predetermined activities appear in Daily page
- Feed vs Forum distinction

---

## ✅ Summary

**Challenges Page (Main Navigation):**
- ✅ **Discover** (default first view) → **Active** → **Completed** tabs
- Clean card-based design
- Search and filters
- User flow: Discover → View Details → Join → Appears in Active

**Challenge Detail (Global - 3 Tabs):**
- **Overview** (ALL-IN-ONE: stats + progress + leaderboard + details + rules) ← Triple Merged!
- **Feed** (activity posts from participants)
- **Forum** (Reddit-style discussions)

**Challenge Detail (Circle - 2 Tabs):**
- **Overview** (ALL-IN-ONE: stats + progress + leaderboard + details + rules) ← Triple Merged!
- **Feed** (activity posts from participants)
- NO Forum (smaller groups)

**Key Design Changes:**
- ✅ Discover is now the default first tab (not Active)
- ✅ **All-in-One Overview tab** - Stats + Leaderboard + About all merged
- ✅ **Maximum simplification** - Everything in one scrollable view
- ✅ Reduces cognitive load dramatically (fewer tabs)
- ✅ Global challenges: **3 tabs** (down from 5!)
- ✅ Circle challenges: **2 tabs** (down from 4!)
- ✅ No tab switching needed for basic info

**Overview Tab Contains:**
1. Challenge stats (dates, participants, requirements)
2. Your progress (day X/Y, progress bar, rank, streak)
3. Leaderboard preview (top 3 + your position)
4. Challenge details (duration, badge, type)
5. Description (what it's about)
6. Benefits (why join)
7. Rules (success criteria)
8. Activities (what gets added to Daily)

**How It Works:**
- Challenges have predetermined activities
- Activities auto-add to Daily page when user joins
- Completing activities counts toward challenge
- Posts about challenge activities appear in Challenge Feed
- Only participants see feed/forum content

**Data Flow:**
1. User clicks Challenges tab → Sees **Discover** first
2. Browses challenges → Clicks "View Details"
3. Sees **Overview tab** (scrolled to Description/Details section for un-joined)
4. Joins challenge → Activities auto-add to Daily page
5. Challenge appears in **Active** tab
6. User completes activities → Progress updates
7. Opens challenge detail → Sees **Overview tab** (scrolled to Stats/Progress for joined)
8. Overview shows everything in one scroll: Stats + Progress + Leaderboard + Details

---

## 🔧 CRITICAL DECISIONS & IMPLEMENTATION DETAILS

**Status:** ✅ Locked In - Ready for Phase 2 Database Schema
**Date:** December 26, 2025

These decisions were made during design phase and affect database schema, business logic, and user experience. Document maintained for future reference.

---

### **1. Challenge Creation Permissions**

**Decision:** Admins only for MVP

**Reasoning:**
- Start restrictive, expand later
- Prevents spam and low-quality challenges
- Maintains quality control during early adoption
- Can add "verified creator" role in future phases

**Database Impact:**
```sql
challenges:
- created_by (uuid, references users.id)
- status (enum: draft, active, archived)
- requires_approval (boolean, default true)
```

**Future Phases:**
- Phase 3: Add "verified creator" role
- Phase 4: Community-submitted challenges with approval queue

---

### **2. Challenge Start Timing - PERSONAL/QUEST MODEL** ⭐

**Decision:** Personal start dates (like achievements/quests)

**Reasoning:**
- ✅ **Accessibility:** Users can join anytime, no waiting for "next cohort"
- ✅ **Replayability:** Complete challenge, earn badge, others can still join later
- ✅ **Evergreen:** Challenges never "expire" - available year-round
- ✅ **Lower pressure:** No "I missed the start date" anxiety
- ✅ **Better for discovery:** New users see challenges immediately available

**User Flow:**
```
User joins "30 Day Cold Shower" on Dec 15:
→ Personal challenge starts immediately (Dec 15)
→ Day 1/30 begins today
→ Activities added to Daily page starting today
→ User completes on Jan 13 (30 days later)
→ Badge earned
→ Challenge still available for next person
```

**Leaderboard Impact:**
- Shows "All-Time Leaderboard" (not synchronized cohorts)
- Ranks by completion percentage + speed
- Example: User A (100%, 28 days) ranks higher than User B (100%, 35 days)
- Filter: "All Time | This Month | This Week"

**Database Impact:**
```sql
challenge_participants:
- user_id (uuid)
- challenge_id (uuid)
- joined_at (timestamp) -- When they joined
- personal_start_date (date) -- Their Day 1
- personal_end_date (date) -- Their Day 30
- current_day (integer) -- Which day they're on (1-30)
- completed_days (integer) -- How many completed so far
```

**Why NOT synchronized:**
- ❌ Creates artificial scarcity ("wait for next cohort")
- ❌ Reduces accessibility (users can't join immediately)
- ❌ Limits replayability (can't re-do completed challenges)
- ❌ Forums still work (discussions are about general tips, not "Day 15 today!")

---

### **3. Activity Reminder Setup - MANDATORY ON JOIN** ⭐

**Decision:** Force reminder setup during challenge join flow

**Reasoning:**
- Users WILL forget without reminders
- Setting times upfront prevents drop-off
- Creates commitment through planning
- Reduces "I forgot" excuses

**User Flow:**
```
1. User clicks "Join Challenge"
2. Modal appears: "Set Up Your Schedule"
   ┌────────────────────────────────┐
   │ When will you complete:        │
   │                                │
   │ ❄️ Cold Shower                 │
   │ Frequency: [Every Day ▼]      │
   │ Time: [7:00 AM] ⏰            │
   │ Reminder: [15 min before ▼]   │
   │                                │
   │ [Cancel]  [Complete Setup →]  │
   └────────────────────────────────┘
3. User CANNOT skip (no "Skip" or "Later" button)
4. After setup → "You're in! Day 1 starts tomorrow"
```

**Multi-Activity Challenges (e.g., 75 Hard):**
```
Setup wizard with 5 steps:
→ Step 1/5: Morning Workout (6:00 AM ⏰)
→ Step 2/5: Evening Workout (6:00 PM ⏰)
→ Step 3/5: Diet Tracking (After meals)
→ Step 4/5: Reading (8:00 PM ⏰)
→ Step 5/5: Progress Photo (Morning)
```

**Database Impact:**
```sql
challenge_activity_schedules:
- user_id (uuid)
- challenge_id (uuid)
- activity_id (uuid)
- scheduled_time (time) -- e.g., 07:00:00
- reminder_minutes_before (integer, default 15)
- frequency (enum: daily, weekly, custom)
- days_of_week (integer[], nullable) -- For weekly [1,3,5] = Mon/Wed/Fri
- created_at (timestamp)
```

**Anti-Forgetting Measures:**
- ✅ Push notification 15 min before scheduled time
- ✅ Daily summary at 8am: "Today's challenge activities: 3 remaining"
- ✅ Streak warning at 9pm: "Your streak will break in 3 hours!"
- ✅ Accountability: Show streak count in challenge card (creates loss aversion)

---

### **4. Leaderboard Ranking Logic**

**Decision:** Primary = Progress %, Secondary = Days to Complete

**Formula:**
```
Rank Score = (completed_days / total_days) * 1000 + (1000 - days_taken)

Example:
User A: 30/30 (100%) in 28 days → Score = 1000 + (1000 - 28) = 1972
User B: 30/30 (100%) in 35 days → Score = 1000 + (1000 - 35) = 1965
User C: 28/30 (93%) in 30 days → Score = 933 + (1000 - 30) = 1903

Ranking: A > B > C
```

**Reasoning:**
- Completion % most important (rewarded discipline)
- Speed breaks ties (rewards consistency)
- Fair for all-time leaderboards

**Filter Chips:**
- **Rank ▼** (default) → Sort by rank score
- **Fastest** → Sort by days_taken ascending (completed only)
- **Perfect** → Filter 100% completion only

**Database Query:**
```sql
SELECT
  u.username,
  cp.completed_days,
  cp.total_days,
  cp.completed_days::float / cp.total_days * 100 AS progress_pct,
  cp.days_taken,
  (cp.completed_days::float / cp.total_days * 1000) + (1000 - cp.days_taken) AS rank_score,
  RANK() OVER (ORDER BY rank_score DESC) as rank
FROM challenge_participants cp
JOIN users u ON cp.user_id = u.id
WHERE cp.challenge_id = $1
  AND cp.status = 'active' OR cp.status = 'completed'
ORDER BY rank_score DESC
LIMIT 100;
```

---

### **5. Challenge Completion & Failure Handling**

**Decision:** Badge tiers based on completion percentage

**Badge Tiers:**
```
🏆 Gold   - ≥80% completion (e.g., 24+/30 days)
🥈 Silver - ≥60% <80% completion (e.g., 18-23/30 days)
🥉 Bronze - ≥40% <60% completion (e.g., 12-17/30 days)
❌ Failed - <40% completion OR abandoned
```

**Reasoning:**
- Rewards partial completion (not all-or-nothing)
- Silver/Bronze still feel like achievement
- Encourages trying even if you miss some days
- Failed state for <40% prevents "badge spam"

**Challenge End Flow:**

**User completes Day 30:**
```
Modal appears:
┌────────────────────────────────────┐
│ 🎉 Challenge Complete!             │
│                                    │
│ ❄️ 30 Day Cold Shower              │
│ You completed: 25/30 (83%)         │
│                                    │
│ 🏆 Gold Badge Earned!              │
│                                    │
│ Final Stats:                       │
│ • Rank: #127 of 1,234              │
│ • Streak: 25 days 🔥               │
│ • Completed in: 32 days            │
│                                    │
│ [View Leaderboard] [Done]          │
└────────────────────────────────────┘
```

**Challenge moves to "Completed" tab** with badge displayed

**Retry Logic:**
- User can retake challenge anytime
- Previous attempts show in history
- Best badge displayed on profile

**Database Impact:**
```sql
challenge_participants:
- completion_percentage (numeric) -- e.g., 83.33
- badge_earned (enum: gold, silver, bronze, failed, abandoned)
- completed_at (timestamp, nullable)
- abandoned_at (timestamp, nullable)
- days_taken (integer) -- How many calendar days to complete
- status (enum: active, completed, failed, abandoned)
```

---

### **6. Leaving Challenges - "Keep Habits" Option**

**Decision:** Soft leave with habit preservation

**User Flow:**
```
User clicks "Leave Challenge":

Modal appears:
┌────────────────────────────────────┐
│ ⚠️ Leave "Cold Shower Challenge"? │
│                                    │
│ Your progress: 12/30 (40%)         │
│ Current streak: 12 days 🔥         │
│                                    │
│ What happens:                      │
│ • Activities stay in Daily         │
│ • You keep your habits             │
│ • You leave the leaderboard        │
│ • You can't access Forum           │
│ • Badge will not be earned         │
│                                    │
│ [Cancel] [Keep Habits & Leave]     │
└────────────────────────────────────┘
```

**After leaving:**
- ✅ Activities remain in Daily as regular actions
- ✅ Challenge tags removed (no longer counts toward challenge)
- ✅ Removed from leaderboard immediately
- ✅ Forum access removed
- ✅ Can re-join same challenge later (starts fresh)

**Reasoning:**
- Don't punish users for leaving (they keep habits they built)
- Encourages trying challenges (low risk)
- Clear consequences (no badge, no leaderboard)

**Database Impact:**
```sql
challenge_participants:
- left_at (timestamp, nullable)
- kept_activities (boolean) -- Did they keep habits?
- status → 'left' (enum value)

-- Activities get updated:
UPDATE actions
SET challenge_ids = array_remove(challenge_ids, $challenge_id)
WHERE user_id = $1;
```

---

### **7. Challenge End - Habit Continuation Modal** ⭐

**Decision:** Mandatory post-challenge modal to convert habits

**User Flow:**
```
Challenge ends (user completes Day 30):

Modal appears:
┌────────────────────────────────────┐
│ 🎉 Challenge Complete!             │
│                                    │
│ ❄️ 30 Day Cold Shower              │
│ 🏆 Gold Badge Earned!              │
│                                    │
│ Keep this habit going?             │
│                                    │
│ ☑️ Cold Shower ❄️                  │
│    Continue as daily habit         │
│    Time: 7:00 AM ⏰                │
│    (Will stay in Daily page)       │
│                                    │
│ [Remove Activity]                  │
│ [Keep in Daily Routine]            │
└────────────────────────────────────┘
```

**Multi-activity challenges:**
```
┌────────────────────────────────────┐
│ Select habits to keep:             │
│                                    │
│ ☑️ Morning Workout (6:00 AM)       │
│ ☐ Evening Workout (6:00 PM)        │
│ ☑️ Diet Tracking (All day)         │
│ ☐ Reading 10 pages (8:00 PM)       │
│ ☐ Progress Photo (Morning)         │
│                                    │
│ [Save Selections]                  │
└────────────────────────────────────┘
```

**Reasoning:**
- Challenges are habit builders (this is the payoff!)
- Explicit choice = higher commitment
- Prevents automatic clutter in Daily page
- User controls their routine

**Database Logic:**
```sql
-- User selects "Keep in Daily Routine":
UPDATE actions
SET challenge_ids = array_remove(challenge_ids, $challenge_id),
    is_habit = true,
    habit_source = 'challenge_converted'
WHERE user_id = $1
  AND $challenge_id = ANY(challenge_ids);

-- User selects "Remove Activity":
DELETE FROM actions
WHERE user_id = $1
  AND $challenge_id = ANY(challenge_ids);
```

---

### **8. Duplicate Activities - Auto-Merge with Multi-Tag** ⭐

**Decision:** Intelligent merging of duplicate activities

**Problem:**
```
User joins:
- "75 Hard" (includes "Morning Workout" at 6:00 AM)
- "30 Day Fitness" (includes "Morning Workout" at 6:00 AM)

Without merging: User sees TWO "Morning Workout" activities
With merging: User sees ONE activity that counts for BOTH
```

**Merge Logic:**
```
Check for duplicates by:
1. Same activity title (case-insensitive)
2. Same scheduled time (±15 min window)
3. Same user

If match found:
→ ADD challenge to challenge_ids array
→ Update UI to show multiple tags

If no match:
→ CREATE new activity
```

**Daily Page Display:**
```
┌────────────────────────────────────┐
│ ✅ Morning Workout                 │
│    6:00 AM                         │
│    🏆 75 Hard • 30 Day Fitness     │
│    (Counts for both challenges)    │
│                                    │
│    [Complete]                      │
└────────────────────────────────────┘
```

**When user completes:**
- ✅ Progress updates for BOTH challenges
- ✅ Streak updates for BOTH challenges
- ✅ One post can tag both challenges
- ✅ Efficient (no duplicate work)

**Edge Case - Different Times:**
```
75 Hard: Morning Workout at 6:00 AM
30 Day Fitness: Morning Workout at 7:30 AM

→ Keep SEPARATE (different times = different intents)
```

**Database Schema:**
```sql
actions:
- challenge_ids (uuid[]) -- Array of challenge IDs, NOT single challenge_id
- title (text)
- scheduled_time (time)

-- Check for duplicates:
SELECT * FROM actions
WHERE user_id = $1
  AND LOWER(title) = LOWER($title)
  AND ABS(EXTRACT(EPOCH FROM (scheduled_time - $time))) < 900; -- 15 min

-- Add challenge to existing activity:
UPDATE actions
SET challenge_ids = array_append(challenge_ids, $new_challenge_id)
WHERE id = $activity_id;
```

**Reasoning:**
- Reduces clutter in Daily page
- More efficient for users (one action, multiple benefits)
- Encourages joining multiple challenges
- Realistic (morning workout is morning workout)

---

### **9. Activity Verification - Honor System + Optional Proof**

**Decision:** Trust-based with optional photo verification

**Verification Levels:**

**1. Honor System (Default):**
- User checks "Cold Shower ✓"
- Counts toward progress
- No proof required
- Social pressure to be honest

**2. Photo Proof (Optional):**
- User uploads photo when checking off
- Shows on leaderboard: "📸 Verified"
- Community can see proof in Feed
- Builds credibility

**3. Required Proof (Challenge-Specific):**
- Challenge creator sets "Proof Required"
- User MUST upload photo to complete
- Used for high-stakes challenges with prizes

**Reasoning:**
- Can't truly verify physical activities (no IoT sensors in MVP)
- Honor system works for most users (intrinsic motivation)
- Photo option for those who want accountability
- Keeps friction low (don't force photos for every activity)

**Anti-Cheat Measures:**
- Flag suspicious patterns (completing 30 days in 1 hour)
- Community reporting ("Report as fraudulent")
- Admin review for top leaderboard spots

**Database Impact:**
```sql
challenge_completions:
- id (uuid)
- user_id (uuid)
- challenge_id (uuid)
- action_id (uuid)
- completed_at (timestamp)
- photo_url (text, nullable)
- is_verified (boolean, default false)
- verification_type (enum: honor, photo, required_photo)

-- Flag suspicious:
SELECT user_id, COUNT(*) as rapid_completions
FROM challenge_completions
WHERE completed_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 10; -- Flag users completing 10+ in 1 hour
```

---

### **10. Progress Tracking - Real-Time Updates**

**Decision:** Immediate updates with async leaderboard recalc

**User Flow:**
```
User checks "Cold Shower ✓" in Daily:

Immediate (< 500ms):
1. ✅ Action marked complete
2. ✅ Challenge progress: 12/30 → 13/30
3. ✅ Streak updated: 12 → 13 🔥
4. ✅ UI updates in real-time

Background (async, ~2-5 seconds):
5. ✅ Leaderboard rank recalculated
6. ✅ Feed post created (if user chose to share)
7. ✅ Notifications sent to followers
```

**Database Transaction:**
```sql
BEGIN;

-- 1. Mark action complete
UPDATE actions
SET completed = true,
    completed_at = NOW()
WHERE id = $action_id;

-- 2. Update challenge progress
UPDATE challenge_participants
SET completed_days = completed_days + 1,
    current_day = current_day + 1,
    current_streak = current_streak + 1,
    last_completion_at = NOW()
WHERE user_id = $user_id
  AND challenge_id = $challenge_id;

-- 3. Insert completion record
INSERT INTO challenge_completions
  (user_id, challenge_id, action_id, completed_at)
VALUES ($user_id, $challenge_id, $action_id, NOW());

COMMIT;

-- 4. Trigger async job for leaderboard recalc (background)
NOTIFY 'leaderboard_update', json_build_object('challenge_id', $challenge_id);
```

**Streak Break Detection:**
```sql
-- Check if streak should break (missed yesterday)
SELECT
  CASE
    WHEN last_completion_at < CURRENT_DATE - INTERVAL '1 day'
    THEN 0 -- Reset streak
    ELSE current_streak + 1 -- Continue streak
  END as new_streak
FROM challenge_participants
WHERE user_id = $user_id AND challenge_id = $challenge_id;
```

**Reasoning:**
- Users expect instant feedback (dopamine hit)
- Leaderboard can update slightly delayed (acceptable)
- Transaction ensures data consistency
- Async jobs prevent UI lag

---

### **11. Badge Display - Everywhere**

**Decision:** Show badges across all surfaces

**Badge Locations:**

**1. Profile Screen:**
```
┌────────────────────────────────────┐
│ 👤 @username                       │
│                                    │
│ 🏆 Badges (12)                     │
│ ┌─────┐ ┌─────┐ ┌─────┐           │
│ │ ❄️  │ │ 📚  │ │ 💪  │           │
│ │Gold │ │Silv │ │Gold │           │
│ └─────┘ └─────┘ └─────┘           │
└────────────────────────────────────┘
```

**2. Leaderboard:**
```
#1 @sarah_runs 🏆 30/30 • Streak: 30
#2 @mike_fitness 🏆 30/30 • Streak: 28
#3 YOU ⭐ 🥈 28/30 • Streak: 25
```

**3. Completed Challenges Tab:**
```
┌────────────────────────────────────┐
│ ✅ 75 Hard Challenge               │
│ Completed Jan 15, 2026             │
│                                    │
│ 🏆 Gold Badge Earned               │
│ • Rank: #23/1,045 (Top 2%)         │
│ • Completion: 73/75 (97%)          │
└────────────────────────────────────┘
```

**4. Posts:**
```
┌────────────────────────────────────┐
│ @username • 2h ago                 │
│ 🏆 Gold Badge: Cold Shower         │
│                                    │
│ Day 30/30! Challenge complete!     │
│ [Photo]                            │
└────────────────────────────────────┘
```

**5. User Avatar (Badge Count):**
```
👤 @username 🏆×12
```

**Badge Rarity System (Future):**
```
🏆 Gold - Common (≥80%)
🥈 Silver - Common (≥60%)
🥉 Bronze - Common (≥40%)
💎 Diamond - Rare (100% + 10 forum posts)
👑 Legendary - Ultra Rare (Top 3 + 100% + fastest completion)
```

**Database Impact:**
```sql
user_badges:
- id (uuid)
- user_id (uuid)
- challenge_id (uuid)
- badge_type (enum: gold, silver, bronze, diamond, legendary)
- earned_at (timestamp)
- is_displayed_on_profile (boolean, default true)
- display_order (integer, nullable) -- User can reorder

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_displayed ON user_badges(user_id, is_displayed_on_profile);
```

---

### **12. Forum & Feed Access - Public Viewing**

**Decision:** Everyone can view, only participants can post

**Access Rules:**

**Before Joining Challenge:**
- ✅ Can view Overview tab (includes all info)
- ✅ Can view Feed tab (see what people are posting)
- ✅ Can view Forum tab (read discussions)
- ❌ Cannot post in Feed
- ❌ Cannot post in Forum
- ❌ Cannot react to posts

**After Joining Challenge:**
- ✅ Can view all tabs
- ✅ Can post in Feed
- ✅ Can post in Forum
- ✅ Can react to posts (likes, fire, etc.)
- ✅ Can comment on posts

**After Leaving/Completing Challenge:**
- ✅ Can view all tabs (historical access)
- ✅ Can post in Feed (if completed successfully)
- ❌ Cannot post if abandoned/failed
- ✅ Can react and comment

**Privacy Override:**
- User checks activity as private (in Daily completion modal)
- Post does NOT appear in Challenge Feed
- Only user can see their own private completions

**Reasoning:**
- Public viewing = social proof (encourages joining)
- Users can assess challenge quality before joining
- Historical access = users keep connection to community
- Privacy option = user control

**Database Checks:**
```sql
-- Check if user can post:
SELECT EXISTS(
  SELECT 1 FROM challenge_participants
  WHERE user_id = $user_id
    AND challenge_id = $challenge_id
    AND (status = 'active' OR status = 'completed')
) as can_post;

-- Check if post should appear in feed:
SELECT p.* FROM posts p
JOIN actions a ON p.action_id = a.id
WHERE $challenge_id = ANY(a.challenge_ids)
  AND p.visibility IN ('public', 'circle') -- NOT 'private'
ORDER BY p.created_at DESC;
```

---

## 📊 Database Schema Summary

**New Tables Required:**

```sql
-- Core challenge data
challenges (id, name, description, type, scope, duration_days, success_threshold, created_by, status, predetermined_activities)

-- User participation
challenge_participants (user_id, challenge_id, joined_at, personal_start_date, current_day, completed_days, status, badge_earned)

-- Activity schedules
challenge_activity_schedules (user_id, challenge_id, activity_id, scheduled_time, reminder_minutes_before, frequency)

-- Completion tracking
challenge_completions (user_id, challenge_id, action_id, completed_at, photo_url, is_verified)

-- Badge system
user_badges (user_id, challenge_id, badge_type, earned_at, is_displayed_on_profile)

-- Forum threads (separate from feed posts)
challenge_forum_threads (challenge_id, author_id, title, category, created_at)
challenge_forum_replies (thread_id, author_id, content, created_at)
```

**Modified Tables:**

```sql
-- Actions table update
actions:
- challenge_ids (uuid[]) -- CHANGED from challenge_id to array
- is_habit (boolean) -- ADDED
- habit_source (text, nullable) -- ADDED

-- Posts table update
posts:
- Links to actions via action_id (existing)
- Challenge posts auto-filtered via action.challenge_ids
```

---

**Last Updated:** December 26, 2025
**Status:** ✅ Design Complete + Critical Decisions Documented
**Next:** Phase 2 - Database Schema Implementation
