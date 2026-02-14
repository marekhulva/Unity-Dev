# Momentum System — Auto-Generated Banners & Feed Posts

**Target**: React Native + TypeScript
**Purpose**: Drive daily check-in engagement through social pressure (banner) and celebration (feed posts). Two layers working together — the banner makes you act, the feed post rewards the group.

---

## THE TWO LAYERS

| Layer | Type | Purpose | Psychological Trigger |
|-------|------|---------|----------------------|
| **Banner** | Sticky at top of Social feed | Get the user to check in NOW | FOMO / Social pressure |
| **Feed Post** | Scrollable card in feed | Celebrate group achievement | Dopamine / Social bonding |

---

## LAYER 1: LIVE MOMENTUM BANNER

### What It Is

A compact card pinned near the top of the Social feed (below the presence row and circle pills, above the composer). Shows real-time check-in progress for a single circle.

### Core Rule

**Only show circles where the current user HAS NOT checked in yet.**

This is the single most important rule. The banner is a call to action. Once the user has checked in for a circle, that circle no longer needs to pressure them. The banner should make the user feel: "Everyone else already did it. I'm the one holding us back."

### When To Show

| Condition | Show Banner? |
|-----------|-------------|
| User has unchecked circles with ≥50% check-in rate today | YES — show the highest-priority circle |
| User has unchecked circles with <50% check-in rate today | NO — not enough momentum to create FOMO |
| User has checked in for ALL their circles today | SHOW BRIEFLY as celebration, then collapse/hide |
| User is in 0 circles | NO |
| Circle has fewer than 3 members | NO — skip this circle in priority logic |

### Priority Logic (Which Circle To Show)

When a user is in multiple circles and hasn't checked in for more than one, pick ONE circle to display using this priority order:

```
Priority 1: Circle closest to 100% completion (where user hasn't checked in)
            → "You're the last one!" effect is the strongest FOMO

Priority 2: If tied, pick the circle with the most RECENT check-in
            → Feels most alive, most active right now

Priority 3: If still tied, pick alphabetically by circle name
            → Deterministic, no random flickering
```

**Example:**
- User is in 3 circles: Build Squad (4/6 checked in), Mindful AM (2/8 checked in), Fitness Crew (5/6 checked in)
- User has NOT checked in for any of them
- Fitness Crew wins: 5/6 = 83% > Build Squad 4/6 = 67% > Mindful AM 2/8 = 25%
- Banner shows: "🔥 **Fitness Crew** is on fire — 5 of 6 members checked in today"
- Mindful AM is below 50%, so it wouldn't show even if it were the only option

### Message Templates

| Check-in Rate | Message |
|---------------|---------|
| 50%–74% | "🔥 **{Circle Name}** is building momentum — {X of Y} members checked in today" |
| 75%–99% | "🔥 **{Circle Name}** is on fire — {X of Y} members checked in today" |
| 100% (celebration) | "🏆 **{Circle Name}** went perfect — all {Y} members checked in today" |

### What Happens After User Checks In

```
User checks in for the displayed circle
  ↓
Is there another unchecked circle with ≥50% check-in rate?
  → YES: Banner swaps to show that circle (with new priority calc)
  → NO:  Banner transitions to celebration state or hides

Celebration state (shown briefly):
  "✨ You're all caught up — {Circle Name} is at {X of Y}"
  → Auto-collapses after scrolling or after 10 seconds
  → Can be manually dismissed
```

### Banner Data Shape

```typescript
interface MomentumBannerData {
  circleId: string;
  circleName: string;
  circleEmoji: string | null;     // the circle's emoji, shown in banner
  checkedInCount: number;          // how many members checked in today
  totalMembers: number;            // total circle members
  checkInRate: number;             // checkedInCount / totalMembers (0.0 to 1.0)
  recentCheckinAvatars: string[];  // up to 3-4 emoji avatars of who checked in
  userHasCheckedIn: boolean;       // has the current user checked in for THIS circle
  isPerfect: boolean;              // 100% check-in rate
}
```

### How To Calculate (Query Logic)

Every time the Social feed loads or refreshes:

```
1. Get all circles the current user is a member of
2. For each circle:
   a. Count total members
   b. Skip if totalMembers < 3
   c. Count members who have a check-in with completed_at >= today midnight (local time)
   d. Calculate checkInRate = checkedInCount / totalMembers
   e. Check if current user has checked in today for this circle
3. Filter to circles where:
   - checkInRate >= 0.5 (50%+)
   - userHasCheckedIn === false  (user hasn't done their part yet)
4. Sort by:
   - checkInRate DESC (closest to 100% first)
   - most recent check-in timestamp DESC (tie-breaker)
   - circleName ASC (final tie-breaker)
5. Pick the top result → that's the banner circle
6. If no results (user checked in everywhere or no circle is at 50%+):
   - If any circle is at 100%: show celebration banner briefly
   - Otherwise: hide banner entirely
```

### Refresh Frequency

- On Social feed load (pull-to-refresh)
- On returning to Social tab
- After the user completes a check-in (immediately recalculate)
- Optional: poll every 60 seconds while Social feed is active (keeps it feeling live)

Do NOT use real-time websockets for this. Polling or event-driven refresh is sufficient. The banner doesn't need to update the instant someone else checks in — a 30-60 second delay is fine and saves infrastructure.

---

## LAYER 2: MILESTONE FEED POSTS (Auto-Generated)

### What They Are

Posts that appear in the Social feed like regular content. They look like system-generated cards. Users can like and comment on them. They celebrate collective achievement.

### Trigger Thresholds

Only TWO thresholds. Not three, not four. Two emotions:
- "Things are happening" (50%)
- "We did it" (100%)

| Threshold | Trigger | Card Style |
|-----------|---------|------------|
| **50% Milestone** | The moment the check-in count crosses 50% of total members | Standard post card with momentum styling |
| **100% Perfect Day** | The moment the last member checks in | Celebration card (gold border, special treatment) |

### When They Generate

These posts are created **once per threshold per circle per day**. They are generated server-side (or locally and synced) at the exact moment the threshold is crossed.

```
Member checks in
  ↓
Server counts today's check-ins for that circle
  ↓
Did this check-in cause the circle to cross 50%?
  → YES and no 50% post exists for this circle today: CREATE 50% post
  → NO: do nothing

Did this check-in cause the circle to hit 100%?
  → YES and no 100% post exists for this circle today: CREATE 100% post
  → NO: do nothing
```

**Deduplication rule**: Maximum ONE post per threshold per circle per day. If someone unchecks and rechecks, it doesn't regenerate.

### 50% Milestone Post

A standard-styled card (not celebration-level).

**Content:**

```
🔥 {Circle Emoji} {Circle Name} is building momentum

{X} of {Y} members have checked in today. The streak continues.

[Stacked avatars of who checked in]
```

**Data shape:**

```typescript
interface MomentumFeedPost {
  id: string;
  type: 'momentum_milestone';
  circleId: string;
  circleName: string;
  circleEmoji: string | null;
  threshold: 0.5 | 1.0;
  checkedInCount: number;
  totalMembers: number;
  checkedInAvatars: string[];     // emoji avatars of members who checked in
  createdAt: string;               // ISO timestamp of when threshold was crossed
  likes: number;
  comments: number;
  isAutoGenerated: true;           // flag to distinguish from user-created posts
}
```

### 100% Perfect Day Post

This gets the **celebration card treatment** — gold border, special layout, bigger visual impact. Same style as the Alex Rivera "50 Day Streak" celebration card from the HTML mockup.

**Content:**

```
🏆 {Circle Emoji} {Circle Name}

ALL {Y} MEMBERS
CHECKED IN TODAY

"Perfect Day — {date}"

[🔥 Celebrate]  [💬 Comment]
```

**The 100% post should feel like an EVENT.** This is the emotional payoff that makes people want to come back tomorrow and do it again.

### Feed Placement

- Milestone posts appear in the feed sorted by `createdAt` like any other post
- They intermix with regular user posts
- They should NOT stack (if 3 circles all hit 50% within minutes, they interleave with other content, not cluster together)
- The 100% celebration post gets pinned to near-top of feed for the rest of the day (or until user scrolls past it)

### Who Sees Them

- **50% post**: Only visible to members of that circle
- **100% post**: Visible to all members of that circle. Optionally visible to non-members in "All" feed as social proof ("look what this circle achieved")

---

## MINIMUM CIRCLE SIZE

**3 members minimum** for momentum features.

| Circle Size | Momentum Banner | Feed Posts |
|-------------|----------------|------------|
| 1 member | NO | NO |
| 2 members | NO | NO |
| 3+ members | YES | YES |

Why: A 2-person circle hitting 100% is "you and your friend both opened the app." Not momentum. Not social proof. Not impressive. At 3+ members, group dynamics actually exist.

---

## DAILY RESET

**Midnight local time** for the current user.

- All check-in counts reset to 0
- Banner recalculates from scratch
- New milestone posts can generate for today
- Yesterday's momentum banner disappears
- Yesterday's milestone feed posts remain in feed history (they don't delete)

**Edge case**: Circle members in different timezones. Use each VIEWER's local midnight for what they see. The check-in itself stores a UTC timestamp. When calculating "today's check-ins," convert to the viewing user's timezone.

```
User in NYC (EST) opens app at 11pm:
  → Sees check-ins from 12:00am EST today
  → Circle member in LA checked in at 9pm PT (12am EST next day)
  → That LA check-in does NOT count for NYC user's "today"
  → It DOES count for the LA user's "today"
```

This means two users in the same circle might see different counts at the same moment. That's fine. The alternative (UTC midnight for everyone) creates a worse UX where your "day" resets at 7pm or 5am depending on timezone.

---

## DATA MODEL (Database)

### Momentum Posts Table

```sql
CREATE TABLE momentum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES circles(id),
  threshold DECIMAL NOT NULL,           -- 0.5 or 1.0
  checked_in_count INTEGER NOT NULL,
  total_members INTEGER NOT NULL,
  checked_in_user_ids UUID[] NOT NULL,  -- array of user IDs who checked in
  post_date DATE NOT NULL,              -- the calendar date (in UTC)
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Engagement (same as regular posts)
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  -- Deduplication constraint
  UNIQUE(circle_id, threshold, post_date)
);
```

The `UNIQUE(circle_id, threshold, post_date)` constraint enforces the "one post per threshold per circle per day" rule at the database level.

### Check-in Counting Query

```sql
-- Count today's check-ins for a circle (from viewer's perspective)
SELECT COUNT(DISTINCT user_id) as checked_in_count
FROM daily_actions
WHERE circle_id = :circle_id
  AND completed = true
  AND completed_at >= :today_midnight_utc   -- convert user's local midnight to UTC
  AND completed_at < :tomorrow_midnight_utc
```

---

## ENGAGEMENT LOOP (The Full Cycle)

```
┌─────────────────────────────────────────────────────┐
│                    DAILY CYCLE                       │
│                                                      │
│  Morning:                                            │
│    User opens app                                    │
│    → Sees banner: "4 of 6 checked in at Build Squad" │
│    → Feels FOMO                                      │
│    → Checks in                                       │
│    → Banner updates or disappears                    │
│                                                      │
│  Midday:                                             │
│    Circle hits 50%                                   │
│    → Feed post generated: "Building momentum..."     │
│    → Members see it, like it, feel part of something │
│    → Remaining members feel pressure to check in     │
│                                                      │
│  Evening:                                            │
│    Last member checks in → 100%                      │
│    → Celebration card appears: "PERFECT DAY 🏆"      │
│    → Everyone likes and comments                     │
│    → Dopamine hit, social bonding                    │
│    → "Let's do it again tomorrow"                    │
│                                                      │
│  Midnight:                                           │
│    Everything resets                                  │
│    → Fresh start                                     │
│    → Can we streak perfect days?                     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## FUTURE EXTENSIONS (Not for V1, but keep in mind)

These are NOT part of the initial build. Document them here so we don't design ourselves into a corner.

1. **Circle Streak Counter**: "Build Squad has had 5 Perfect Days in a row" — multiplies the celebration effect
2. **Push Notifications**: "You're the last one! 5 of 6 checked in at Fitness Crew" — the nuclear FOMO option
3. **Weekly Recap Post**: "This week: Mindful AM went perfect 4 out of 7 days" — weekly rhythm
4. **Personal Nudge**: If user hasn't checked in by 6pm and their circle is at 75%+, surface the banner more aggressively (or send a notification)
5. **Leaderboard**: Which circle has the most perfect days this month — inter-circle competition

---

## WHAT NOT TO BUILD YET

- No push notifications for V1 (just in-app banner + feed posts)
- No real-time websockets (polling/event-driven is fine)
- No circle streak tracking (just daily, no multi-day tracking)
- No cross-circle comparison ("Build Squad is ahead of Mindful AM")
- No gamification points or rewards beyond the visual celebration
