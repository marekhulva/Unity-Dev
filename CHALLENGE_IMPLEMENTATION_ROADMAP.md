# Challenge Implementation Roadmap - Unity 2.0

## Status
🟡 Planning Phase - Strategizing features before implementation

**Last Updated:** December 26, 2025

---

## Decisions Made

### ✅ Decision 1: Daily Page - Active Challenges Widget

**Reference:** Option C (Hybrid Approach) - Daily page section
- **Mockup:** http://localhost:8056/challenge-options-all.html (Option C - Daily only)

**What we want:**
- Indicator/widget on Daily page showing active challenges
- Shows challenges user is currently participating in
- Quick view of today's progress/check-in for each challenge
- Positioned at top of Daily page (before daily actions)

**Why:**
- Daily page = ACTION (where user checks off tasks)
- Natural place to complete today's challenge tasks
- Keeps challenges visible in daily routine
- Doesn't require navigating away from Daily page

### ✅ Decision 2: Progress Page - Challenge Progress Indicator

**Reference:** Option C (Hybrid Approach) - Progress page section
- **Mockup:** http://localhost:8056/challenge-options-all.html (Option C - Progress)

**What we want:**
- Section on Progress page showing user's challenge performance
- Indicator of progress in all active challenges
- Personal stats, rankings, badges earned
- Historical view of completed challenges

**Why:**
- Progress page = REFLECTION (where user reviews stats)
- Natural place to see overall challenge performance
- Complements Daily page (action) with Progress page (reflection)
- Shows achievements and motivation over time

### ✅ Decision 3: Navigation Structure - Merge Progress into Profile

**Reference:** Navigation strategy discussion
- **Mockup:** http://localhost:8056/navigation-options-progress-profile-all.html

**What we want:**
- Profile page will have 3 tabs: "Profile", "Posts", "Progress"
- **Progress tab will be PRIVATE** (shown with lock icon 🔒)
- Everything currently in Progress page moves under the Progress tab
- This frees up bottom navigation space for dedicated Challenges tab

**Tab Structure:**
```
Profile Page:
├─ Profile tab (public - avatar, bio, public goals)
├─ Posts tab (public - user's social posts)
└─ Progress tab (PRIVATE - 🔒 only visible to you)
   ├─ Consistency metrics
   ├─ Goal progress
   ├─ Weekly stats
   ├─ Challenge performance
   └─ Badges & achievements
```

**New Bottom Navigation:**
```
Social | Daily | Circle | Challenges | Profile
```

**Why:**
- Keeps navigation clean (5 tabs instead of 6)
- Frees up space for dedicated Challenges tab
- Progress is inherently private/introspective content
- Consolidates all "You" content in Profile section
- Lock icon makes privacy clear

**Design Notes:**
- Progress tab has visible lock icon (🔒)
- Progress tab not visible when others view your profile
- Same design language as existing Profile/Posts tabs
- Maintains all current Progress page functionality

**UI Design Reference - Option 8C:**
- **Reference mockup:** http://localhost:8056/navigation-option-8c-you-tab-filter.html
- **Selected approach:** Filter dropdown pattern (Option 8C)
- **Key UI elements:**
  - Filter dropdown at top: "All Goals (Public + Private)" | "Public Goals Only" | "Private Goals Only"
  - Privacy badges on each goal: 🌍 Public or 🔒 Private
  - Color-coded left borders: Green for public goals, Red for private goals
  - Single unified scrollable list (goals, challenges, stats combined)
  - Consistency widget at top showing 7-day percentage
  - Active goals section with progress bars
  - Active challenges section with progress tracking
- **Note:** This is the EXACT design we want for the Progress tab inside Profile

**Challenge Stats Content (from Option C):**
- **Reference mockup:** http://localhost:8056/challenge-options-all.html (Option C - Progress page section)
- **What to include in Progress tab:**
  - Section header: "Challenge Stats"
  - Progress stat cards for each active challenge containing:
    - Challenge name with emoji (e.g., "❄️ Cold Shower")
    - Challenge type/duration (e.g., "30 Day Challenge" or "SF Circle")
    - Progress fraction (e.g., "12/30")
    - Progress bar (visual representation)
    - Rank, percentile, days remaining (e.g., "Rank #127 • Top 5% • 18 days remaining")
  - Section header: "Your Goals"
  - Goal items with completion percentages
- **Implementation:** All of Option C's Progress page content goes into Profile > Progress tab (styled with Option 8C filter design)
- **Why:** Progress page no longer exists as standalone - it's now a private tab in Profile. All challenge reflection/stats live there.

### ✅ Decision 4: Global Challenge Discovery Carousel (Future Feature)

**Reference:** Option B carousel design pattern
**Mockup:** http://localhost:8056/challenge-options-all.html (Option B - "🏆 Your Active Challenges" carousel)
**Status:** 🔮 Future implementation - Add to backlog for later

**What we liked from Option B:**
- Horizontal scrollable carousel at top of Social page
- Compact challenge cards with:
  - Emoji + challenge name
  - Progress indicator (Day 12/30 or "2 books done")
  - Visual progress bar
  - "See All" link in header

**How we want to repurpose it:**
- **Original purpose:** Show YOUR active challenges
- **New purpose:** Discover and JOIN global challenges

**Proposed Implementation:**
```
Social Page (top section, above feed):
┌────────────────────────────────────────┐
│ 🌍 Discover Global Challenges  [See All]│
├────────────────────────────────────────┤
│ [Card 1] [Card 2] [Card 3] [Card 4] →│
│                                        │
│ Each card shows:                       │
│ • Challenge emoji & name               │
│ • Participant count (e.g., "1,234 joined")│
│ • Duration (e.g., "30 days")           │
│ • "Join" button                        │
│ • Visual preview (emoji, color theme)  │
└────────────────────────────────────────┘
```

**Card Design:**
```
┌─────────────────────┐
│  ❄️                 │
│  Cold Shower        │
│  30 Day Challenge   │
│  1,234 joined       │
│  [Join Challenge]   │
└─────────────────────┘
```

**User Flow:**
1. User opens Social page
2. Carousel at top shows trending/popular global challenges
3. User scrolls horizontally through options
4. Taps card to see challenge details
5. Taps "Join Challenge" to participate
6. After joining, challenge appears in Daily page widget and Profile > Progress tab

**Why this works:**
- Increases challenge discovery (users see opportunities immediately)
- Low-friction joining (right from Social page)
- Visual, engaging format (carousel is eye-catching)
- Doesn't clutter main feed
- Familiar pattern (Instagram Stories, TikTok, etc.)

**Difference from original:**
- **Original (Option B):** Shows challenges you're ALREADY IN
- **This version:** Shows challenges you CAN JOIN (discovery)

**Implementation Priority:**
- 🔮 FUTURE / NICE TO HAVE
- Implement after core challenge system is working
- Phase 10+ (post-launch enhancement)

**Technical Requirements:**
- Query top global challenges (by participant count, trending, new, etc.)
- Filter out challenges user already joined
- Responsive carousel component
- "Join" button triggers challenge join flow
- Update carousel after user joins

**Where it lives:**
- Social page, top section (before feed)
- Alternative: Could also go in Challenges tab > Discover view

**Why it's a future feature:**
- Not critical for MVP
- Nice UX enhancement for discovery
- Requires challenge system to be fully working first
- Can A/B test effectiveness after launch

**When to implement:**
- After Phase 9 (Testing & Polish) is complete
- When we have 10+ active global challenges
- When we see users struggling to discover challenges
- As part of engagement optimization sprint

**Notes for future implementation:**
- Remember to review Option B mockup before building
- Carousel should be horizontal scrollable (not swiper)
- Consider adding filters: "Trending" | "New" | "Ending Soon"
- Could personalize based on user's interests/goals
- Track metrics: Impression → Tap → Join conversion rate

---

### ✅ Decision 5: Reddit-Style Forum for Global Challenges

**Reference:** Community discussion feature

**What we want:**
- Dedicated "Forum" tab within each Global Challenge
- Reddit-style discussion board for tips, questions, advice
- Separate from activity "Feed" (which shows check-ins and progress posts)

**Tab Structure for Global Challenges:**
```
Global Challenge Detail View:
├─ Overview (description, rules, dates)
├─ Leaderboard (rankings)
├─ Feed (activity posts - check-ins, progress updates)
├─ Forum (NEW - discussion threads) 🆕
└─ About (challenge info)
```

**Forum vs Feed Distinction:**
- **Feed** = Activity/Progress posts
  - "Just completed day 15!"
  - "Hit a new PR today!"
  - Photo/video updates of progress
  - Celebration posts
  - Tied to challenge check-ins

- **Forum** = Discussion threads (Reddit-style)
  - "Best tips for cold showers?"
  - "How do you stay motivated on hard days?"
  - "Technique check: Am I doing this right?"
  - "Weekly strategy discussion"
  - Question & Answer format
  - Threaded replies

**Forum Features:**
- Create discussion thread (title + body)
- Upvote system (or just likes)
- Threaded comments/replies
- Sort by: Hot | New | Top | Controversial
- Categories/tags: Tips, Questions, Motivation, Strategy
- Pin important threads (mods/admins)
- Search within forum

**Database Schema Addition:**
```sql
challenge_forum_threads:
  - id (uuid)
  - challenge_id (uuid)
  - user_id (uuid)
  - title (text)
  - body (text)
  - category (enum: tips, questions, motivation, strategy)
  - upvotes (integer)
  - is_pinned (boolean)
  - created_at (timestamptz)
  - updated_at (timestamptz)

challenge_forum_replies:
  - id (uuid)
  - thread_id (uuid)
  - parent_reply_id (uuid, nullable - for nested replies)
  - user_id (uuid)
  - body (text)
  - upvotes (integer)
  - created_at (timestamptz)
  - updated_at (timestamptz)

challenge_forum_votes:
  - id (uuid)
  - user_id (uuid)
  - thread_id (uuid, nullable)
  - reply_id (uuid, nullable)
  - vote_type (enum: upvote, downvote)
  - created_at (timestamptz)
  - UNIQUE(user_id, thread_id) OR UNIQUE(user_id, reply_id)
```

**UI Design:**
```
Forum Tab:
┌──────────────────────────────────┐
│ [Sort: Hot ▼] [+ New Thread]     │
├──────────────────────────────────┤
│ 📌 PINNED                        │
│ "Official Tips & Tricks"          │
│ 234 ↑  •  45 replies  •  2d ago  │
├──────────────────────────────────┤
│ 💡 Tips                          │
│ "How I got through day 10-20"    │
│ 89 ↑  •  12 replies  •  5h ago   │
├──────────────────────────────────┤
│ ❓ Questions                     │
│ "Is morning or evening better?"  │
│ 56 ↑  •  23 replies  •  1d ago   │
└──────────────────────────────────┘
```

**Why This Works:**
- Global challenges have LOTS of participants (100s or 1000s)
- Need structured discussion (not just activity posts)
- Community knowledge sharing
- Tips from experienced members help beginners
- Reddit format proven for community engagement
- Keeps Feed clean (just activity/progress)

**Circle Challenges:**
- Circle challenges can skip Forum tab (circles are smaller, discussion happens naturally)
- OR: Optional forum for large circles (50+ members)

**Implementation Priority:**
- Phase 6.5 (after basic leaderboards/feeds, before badges)
- MEDIUM priority - high engagement value

**Social Feed Integration:**
- **What:** Forum posts from challenges you're IN appear in your Social feed
- **How it works:**
  1. User creates forum thread in "30 Day Cold Shower" challenge
  2. ALL participants of that challenge see it in their Social feed
  3. Feed item shows:
     - User avatar + name
     - "Started a discussion in 30 Day Cold Shower"
     - Thread title (e.g., "Best tips for cold showers?")
     - Preview of thread body (first 2 lines)
     - Category tag (💡 Tips, ❓ Questions, etc.)
     - Reply count, upvote count, time posted
  4. Tap anywhere on feed item → Opens Challenge Detail modal
  5. Modal automatically opens on Forum tab, scrolled to that thread
  6. User can read full thread, reply, upvote

- **Why this matters:**
  - Increases forum engagement (users don't need to manually check forum)
  - Keeps challenge discussions visible in main feed
  - Natural discovery ("Oh, someone asked about cold showers")
  - Contextual - only see forum posts from YOUR challenges

- **Database:**
  - Forum threads flagged with `show_in_feed` boolean
  - Feed query includes: Regular posts + Forum threads from user's challenges
  - Feed item type: "forum_thread" vs "post"

- **Feed Rendering:**
  ```
  Social Feed:
  ┌────────────────────────────────┐
  │ [Avatar] Mike Chen             │
  │ Started a discussion in        │
  │ ❄️ 30 Day Cold Shower         │
  │                                │
  │ 💡 "Best tips for beginners?"  │
  │ I'm on day 3 and struggling... │
  │                                │
  │ ↑ 23  💬 12 replies  • 2h ago │
  │ Tap to join discussion →       │
  └────────────────────────────────┘
  ```

- **Privacy:**
  - Only participants of that challenge see forum threads in feed
  - Circle challenge forums → Only circle members see in feed
  - Global challenge forums → All participants see in feed
  - Non-participants don't see forum threads from challenges they're not in

- **Feed vs Forum Distinction:**
  - **Social Feed:** Preview of forum activity (discover discussions)
  - **Forum Tab:** Full threaded discussion (participate in depth)
  - Feed acts as notification/discovery layer
  - Forum is the destination for deep engagement

---

## Challenge Rules & Features

### Success Threshold & Badge System

**Success Threshold Concept:**
- Each challenge has a **success threshold** (configurable percentage)
- Users don't need 100% completion to "succeed" at a challenge
- Threshold determines badge eligibility
- **How threshold works depends on challenge type**

**Challenge Types & Threshold Application:**

1. **Streak-Based Challenges** (e.g., 30 Day Cold Shower)
   - Binary: Did it or didn't do it each day
   - Success threshold: 80% means 24/30 days completed
   - If user completes 24+ days → Gets badge
   - If user completes <24 days → No badge

2. **Cumulative Challenges** (e.g., 100 Hours of Meditation)
   - Track total accumulated amount
   - Success threshold: 80% means 80/100 hours
   - If user completes 80+ hours → Gets badge
   - Doesn't matter how it's distributed (could be 2hrs/day or irregular)

3. **Competition Challenges** (e.g., Most Pushups This Week)
   - Rank-based or target-based
   - Success threshold could be:
     - Finish in top X% (e.g., top 20% get badge)
     - OR reach target number (e.g., 500 pushups total = 80% of 625 target)
   - Depends on challenge setup by creator

4. **Team/Circle Challenges**
   - Circle vs Circle competition
   - Success threshold: Team average meets X%
   - OR: Your circle finishes in top X positions

**Badge Collection:**
- Users collect badges for successfully completed challenges
- Badges displayed on Progress page / Profile
- Badge shows: Challenge name, completion date, completion percentage

**Optional: Badge Tier System (Under Discussion)**
- Potential tiered badge system based on completion percentage:
  - Bronze: Met threshold (80%)
  - Silver: High completion (90%+)
  - Gold: Perfect completion (100%)
- **Note:** This is optional - we may implement simple badge (earned/not earned) instead
- Decision pending: Simple vs Tiered badges

**Implementation Notes:**
- Threshold set by challenge creator (default: 80%)
- Can vary by challenge difficulty:
  - Easy challenges: 70% threshold
  - Medium challenges: 80% threshold
  - Hard challenges: 85% threshold
  - Epic challenges: 90% threshold
- Badge earned at challenge end date (not during)
- Historical tracking: Users can see all badges earned over time

**Database Considerations:**
```
challenges table:
  - success_threshold (integer, 0-100, default 80)

challenge_participants table:
  - badge_earned (boolean)
  - completion_percentage (integer)
  - badge_tier (bronze/silver/gold, nullable)
```

### Circle Statistics & Performance Tracking

**7-Day Circle Trend Analytics:**
- Circle page shows group performance trend over past 7 days
- Visual indicator: ↑ Going Up or ↓ Going Down
- Based on average consistency percentage change
- Example: "87% avg consistency (↑ 5% from last week)"

**Circle Contributors:**

**Top Contributor (MVP):**
- Member contributing MOST to circle's success
- Calculated by: Highest consistency % in last 7 days
- Display: Highlighted member with special badge/indicator
- Alternative names to consider:
  - "Circle Champion"
  - "Top Performer"
  - "Consistency Leader"
  - "Star Member"
  - "Circle MVP" (Most Valuable Performer)

**Bottom Contributor (needs better name):**
- Member with lowest consistency % in last 7 days
- Purpose: Gentle accountability, not shaming
- Potential names (non-negative):
  - "Needs Support"
  - "Growth Opportunity"
  - "Comeback Candidate"
  - "Rising Star Potential"
  - "Support Needed"
- **Note:** Display should be encouraging, not punitive
- Could show privately (only to that member) vs publicly

**Visual Implementation:**
```
Circle Stats Card:
├─ Overall: 87% avg consistency
├─ 7-Day Trend: ↑ 5% (improving!)
├─ Top Contributor: John Smith (98%)
└─ Needs Support: Mike Johnson (45%) [or private?]
```

**Important Considerations:**
- Should "bottom contributor" be visible to everyone or private?
- How to make it motivational vs demotivating?
- Consider showing top 3 contributors instead of bottom?
- Alternative: Show "Most Improved" instead of "Bottom"

**Database Needs:**
```
Calculate daily:
- 7-day rolling average consistency per circle
- Week-over-week comparison
- Individual member 7-day consistency
- Rank members within circle
```

---

## Features Under Consideration

### 🤔 Pending Decisions

**1. Social Page - Global Challenge Discovery**
- Where to browse/discover all challenges (global + circle challenges)
- Need to decide on exact placement/design

**2. Circle Page - Circle-Specific Challenges**
- Already built in mockup: http://localhost:8056/circle-page-complete.html
- Shows challenges tab for each circle
- Need to confirm this approach

**4. Challenge Detail View**
- Modal/page that shows full challenge details
- Leaderboard, feed, overview, personal progress
- Used across all pages

---

## Implementation Phases (TBD)

### Phase 1: Foundation
- [ ] Database schema for challenges
- [ ] Backend API for challenges
- [ ] Basic challenge types (streak, cumulative, competition)

### Phase 2: Daily Page Integration
- [ ] Active challenges widget on Daily page
- [ ] Check-in functionality
- [ ] Today's challenge tasks display

### Phase 3: Discovery & Joining
- [ ] Browse challenges (location TBD - likely Social page)
- [ ] Join challenge flow
- [ ] Challenge detail modal

### Phase 4: Circle Integration
- [ ] Circle-specific challenges
- [ ] Circle challenges tab
- [ ] Circle challenge leaderboards

### Phase 5: Social Features
- [ ] Challenge posts/feed
- [ ] Challenge leaderboards (global)
- [ ] Challenge sharing

### Phase 6: Progress Tracking
- [ ] Challenge history on Progress page
- [ ] Badges and achievements
- [ ] Stats and analytics

---

## Notes & Open Questions

### Open Questions:
1. Where should global challenge browsing live? (Social page? Dedicated section?)
2. How do users create challenges? (Admins only? Circle admins? Anyone?)
3. What challenge types to support first? (Streak? Cumulative? Competition?)
4. Rewards system? (XP? Badges? Just leaderboard rankings?)

### References:
- Full strategy session: `CHALLENGE_STRATEGY_SESSION.md`
- All mockups: http://localhost:8056/challenge-options-all.html
- Circle page complete: http://localhost:8056/circle-page-complete.html

---

## Next Steps

1. Continue reviewing mockups
2. Make decisions on remaining features
3. Finalize design approach
4. Create detailed implementation plan
5. Begin coding when ready
