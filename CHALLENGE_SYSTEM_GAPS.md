# Challenge System - Gaps & Strategic Decisions

## 🤔 Your Key Questions

### 1. "Should some global challenges be able to be done within a group?"

**This is a HUGE question that reveals a missing concept: Challenge Templates**

#### Current System:
- A challenge is either global OR circle-specific
- No way to "run a global challenge within your circle"

#### What's Missing: Challenge Templates/Instances Model

**Example Scenario:**
```
"7-Day Cold Shower Challenge" is popular globally
→ Your circle wants to do it TOGETHER with their own leaderboard
→ Current system: Can't do this elegantly
```

**Two Architecture Options:**

**Option A: Template + Instance Model** (More complex, more flexible)
```sql
-- Templates (reusable challenge definitions)
CREATE TABLE challenge_templates (
  id UUID PRIMARY KEY,
  name TEXT,
  description TEXT,
  recommended_duration_days INT,
  activities JSONB,  -- activity definitions
  is_featured BOOLEAN
);

-- Instances (actual running challenges)
CREATE TABLE challenge_instances (
  id UUID PRIMARY KEY,
  template_id UUID REFERENCES challenge_templates(id),
  circle_id UUID REFERENCES circles(id),  -- NULL = global instance
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  participants_count INT
);
```

**Option B: Simpler "Inspired By" Model** (Current system + one field)
```sql
-- Keep current challenges table, add:
ALTER TABLE challenges ADD COLUMN inspired_by_challenge_id UUID;

-- Example:
-- Global challenge: "7-Day Cold Shower" (id: abc-123)
-- Circle creates their own: circle_id = warriors, inspired_by_challenge_id = abc-123
```

---

### 2. "When creating a challenge, how does the system know if it's for group or global?"

**CRITICAL UX DECISION MISSING:**

#### Current State: ❌ No creation UI at all!

#### Where Creation Happens Determines Type:

**Scenario A: Creating from Circle Page**
```
User flow:
1. User is IN a circle (viewing circle page)
2. Clicks "Challenges" tab
3. Clicks "Create Challenge" button
4. Fills out form
5. → Automatically sets circle_id = current_circle
6. → This is a CIRCLE CHALLENGE
```

**Scenario B: Creating from Global Challenges Tab**
```
User flow:
1. User is on main Challenges tab (not in a circle)
2. Clicks "Create Challenge" button
3. Gets permission error? Or admin-only feature?
4. → Would create global challenge (circle_id = NULL)
```

#### Missing: Permission System

**Who can create what?**
- ❌ Currently: No enforcement at all
- ✅ Should be:
  - Global challenges: Admin/creator role only (needs role system)
  - Circle challenges: Any circle member (already have circle membership)

```sql
-- Need to add:
CREATE POLICY "Only circle members can create circle challenges"
  ON challenges FOR INSERT
  WITH CHECK (
    circle_id IS NULL  -- Global (would need admin role check)
    OR
    EXISTS (
      SELECT 1 FROM circle_members
      WHERE circle_id = challenges.circle_id
      AND user_id = auth.uid()
    )
  );
```

---

### 3. "What am I missing? Think holistically"

## 🔍 HOLISTIC GAP ANALYSIS

### A. Challenge Discovery & Browsing

**Missing: Challenge Marketplace/Browse Experience**

Current state:
- ✅ Can fetch global challenges
- ✅ Can fetch circle challenges
- ❌ No "featured challenges" concept
- ❌ No search/filter/sort
- ❌ No categories (meditation, fitness, cold therapy, etc.)
- ❌ No "bring this challenge to your circle" flow

**What users might want:**
```
"I see '30-Day Meditation Challenge' is popular globally
→ I want my circle to do this together
→ How do I make a circle version?"

Current answer: Create it manually from scratch
Better answer: "Start this challenge in your circle" button
```

---

### B. Participation Context & Leaderboards

**Missing: Multi-Context Participation**

**Question:** If I'm in "30-Day Meditation" (global), and 3 of my circle members are also in it...
- Do we see each other on the leaderboard?
- Is there a "Circle Members" filter?
- Can we compete just among ourselves while also in the global challenge?

**Current System:**
- Leaderboard has filter options: 'all' | 'friends' | 'circle'
- But 'circle' filter on a GLOBAL challenge shows... nobody? (no circle_id)

**Missing Logic:**
```typescript
// When viewing global challenge leaderboard
// Filter by "My Circles" = show participants who are in ANY of my circles
getLeaderboard(challengeId, {
  filter: 'my_circles', // NEW
  circleId?: string      // Optional: specific circle
})
```

---

### C. Challenge Lifecycle & Timing

**Missing: Recurring vs One-Time**

**Global Challenges:**
- Often ongoing/evergreen (join anytime)
- "30-Day Meditation" - you start your personal 30 days when you join
- Leaderboard is "all time" or "this month"

**Circle Challenges:**
- Usually synchronized sprints (everyone starts together)
- "7-Day Cold Shower - Starting Monday"
- Leaderboard is "for this specific run"

**Currently:** All challenges have fixed start_date/end_date
**Missing:** Flexible start model (personal vs synchronized)

```sql
-- Might need:
ALTER TABLE challenges ADD COLUMN start_mode TEXT; -- 'synchronized' | 'rolling'

-- Synchronized: Everyone follows challenge start_date/end_date
-- Rolling: Each participant has personal start date (30 days from join)
```

---

### D. Social Feed Integration

**Missing: Clear Rules for Where Posts Go**

**Current behavior:**
- Challenge completion creates a post
- Post includes challenge data
- Post goes to... where exactly?

**Questions:**
1. Global challenge completion → Personal feed only? Or goes to circles you're in?
2. Circle challenge completion → Circle feed only? Or also personal?
3. Can other users see my global challenge posts if we're not in same circle?

**Missing: Post Visibility Model**
```typescript
interface Post {
  // ... existing fields
  visibility: 'public' | 'circles' | 'private';
  challenge_id?: string;
  circle_id?: string;  // If challenge is circle-scoped
}

// Logic:
// - Circle challenge post → circle feed + personal feed
// - Global challenge post → personal feed + visible to friends?
```

---

### E. Challenge Categories & Tags

**Missing: Organization System**

Current: Flat list of challenges
Missing:
- Categories (Meditation, Fitness, Cold Exposure, Journaling, etc.)
- Tags (beginner, advanced, 30-day, quick-win, etc.)
- Search by activity type
- "Challenges you might like" recommendations

```sql
ALTER TABLE challenges ADD COLUMN category TEXT;
ALTER TABLE challenges ADD COLUMN tags TEXT[];
ALTER TABLE challenges ADD COLUMN difficulty TEXT; -- 'beginner' | 'intermediate' | 'advanced'
```

---

### F. Challenge Creation UX Flow

**Missing: The Entire Creation UI**

**Decisions Needed:**

1. **Starting Point:**
   - "Create from scratch"
   - "Start from template" (if we build template system)
   - "Bring global challenge to circle"

2. **Form Fields:**
   - Basic: Name, emoji, description
   - Duration: Fixed dates vs "X days from join"
   - Activities: List of activities (title, emoji, frequency)
   - Success criteria: % required, streak requirements
   - Visual: Banner image, color theme

3. **Activity Definition:**
   - Pre-defined activities (meditation, cold shower) vs custom
   - Link to existing actions? Or create new?
   - Frequency: daily, weekly, optional

4. **Visibility:**
   - If creating in circle → automatically circle challenge
   - If admin creating globally → global challenge
   - No choice needed (context determines it)

---

### G. Permissions & Roles

**Missing: Role-Based Access Control**

**Current state:**
- No admin role system
- No check on who can create global challenges
- No check on challenge editing/deletion

**Needed:**
```sql
-- Option 1: Simple admin flag
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Option 2: Roles system
CREATE TABLE user_roles (
  user_id UUID REFERENCES profiles(id),
  role TEXT, -- 'admin' | 'creator' | 'user'
  PRIMARY KEY (user_id, role)
);

-- Check in RLS:
CREATE POLICY "Admins can create global challenges"
  ON challenges FOR INSERT
  WITH CHECK (
    (circle_id IS NOT NULL)  -- Circle challenges (any member)
    OR
    (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  );
```

---

### H. Notification Strategy

**Missing: Clear Notification Rules**

**When to notify:**
- ✅ Challenge created in circle → notify all circle members
- ❓ Global challenge launches → notify... everyone? Subscribers only?
- ✅ Friend joins a challenge you're in → notify you
- ✅ You're falling behind → reminder notification
- ✅ Milestone achieved → celebration notification
- ❓ Challenge ending soon → warning notification

**Different types:**
- In-app notifications (what we built)
- Push notifications (Phase 4)
- Email digests (future)

---

### I. Analytics & Insights

**Missing: Challenge Performance Tracking**

**For creators:**
- How many people joined?
- What's the completion rate?
- Which activities are most popular?
- What day do most people drop off?

**For participants:**
- Your all-time challenge stats
- Badges earned
- Total days participated across all challenges
- Personal best streaks

---

### J. Challenge Variations

**Missing: Different Challenge Types**

Current system assumes: "Complete X activities over Y days"

**Other possible types:**
1. **Team challenges** - Circle divides into teams
2. **Streak challenges** - Consecutive days required
3. **Points challenges** - Accumulate points, not just completions
4. **Milestone challenges** - Achieve specific milestones (not time-based)
5. **Ladder challenges** - Increasing difficulty each week

---

## 🎯 RECOMMENDED PRIORITY DECISIONS

### 🔴 CRITICAL (Decide Now):

1. **Challenge Creation Context:**
   - ✅ **Decision:** Creating from circle page = circle challenge (set circle_id automatically)
   - ✅ **Decision:** Global challenges are admin-curated only (for now)

2. **Template Question:**
   - ❌ **Skip templates for MVP** - Too complex
   - ✅ **Use "Inspired By" model if needed later** - Can manually recreate popular challenges in circles

3. **Post Visibility:**
   - ✅ **Decision:** Circle challenge posts → circle feed
   - ✅ **Decision:** Global challenge posts → personal feed only (for now)

### 🟡 MEDIUM (Decide Soon):

4. **Categories/Search:**
   - Add basic category field (can always expand)

5. **Leaderboard Filters:**
   - Keep current filter options
   - Add "my circles" filter for global challenges

6. **Challenge Timing:**
   - Start with synchronized start/end dates
   - Can add rolling start later if needed

### 🟢 LOW (Future Enhancement):

7. **Templates System** - V2 feature
8. **Team Challenges** - V2 feature
9. **Advanced Analytics** - V2 feature

---

## 📋 IMMEDIATE ACTION ITEMS

To unblock development:

1. **Add admin flag to profiles:**
   ```sql
   ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
   UPDATE profiles SET is_admin = TRUE WHERE email = 'your-admin@email.com';
   ```

2. **Update RLS policy on challenges:**
   ```sql
   CREATE POLICY "Users can create circle challenges"
     ON challenges FOR INSERT
     WITH CHECK (
       circle_id IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM circle_members
         WHERE circle_id = challenges.circle_id
         AND user_id = auth.uid()
       )
     );
   ```

3. **Document post visibility rules** in code comments

4. **Build Phase 2.2: Challenge Creation UI** (now that decisions are made)

---

## 💡 KEY INSIGHTS

1. **Context is King:** Where you create determines what you create (circle vs global)
2. **Simplicity First:** Skip templates, keep one table, use circle_id as discriminator
3. **Permissions Matter:** Need basic admin system before allowing global challenge creation
4. **Social Integration:** Need clear rules for where posts appear
5. **Discovery Needs Work:** Currently no way to browse/search challenges effectively

Would you like me to proceed with building Phase 2.2 (Challenge Creation UI) with these decisions in mind?
