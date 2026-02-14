# Challenge System Architecture Strategy

## Current State: UNIFIED TABLE DESIGN ✅

**Good news:** You already have a well-designed architecture that handles BOTH global and circle challenges in a single system!

---

## Database Architecture

### Single Table: `challenges`

```sql
CREATE TABLE challenges (
  id UUID PRIMARY KEY,
  circle_id UUID REFERENCES circles(id),  -- ⭐ KEY FIELD
  title TEXT,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT,  -- 'upcoming', 'active', 'completed'
  -- ... other fields ...
)
```

### The Differentiation Strategy:

**Global Challenge:**
- `circle_id = NULL`
- Visible to ALL users across the app
- Example: "30-Day Meditation Challenge" (everyone can join)

**Circle Challenge:**
- `circle_id = <specific circle UUID>`
- Only visible to members of that circle
- Example: "Morning Warriors 7-Day Cold Shower" (only Morning Warriors members)

---

## Service Layer (Already Built)

### File: `src/services/supabase.challenges.service.ts`

```typescript
// Fetch global challenges (circle_id IS NULL)
getGlobalChallenges(): Promise<Challenge[]>

// Fetch circle-specific challenges (circle_id = circleId)
getCircleChallenges(circleId: string): Promise<Challenge[]>
```

**RLS Policies handle permissions:**
- Global challenges: Anyone can view
- Circle challenges: Only circle members can view (enforced by database)

---

## UI/UX Differences

### Where They Appear:

**Global Challenges:**
- **Location:** Challenges tab (main app navigation)
- **Discovery:** "Discover" sub-tab shows all available global challenges
- **Audience:** All app users
- **Creation:** Admin/creator feature

**Circle Challenges:**
- **Location:** Circle page → Challenges tab
- **Discovery:** Only shows challenges for THAT specific circle
- **Audience:** Only members of the circle
- **Creation:** Any circle member (Phase 2.2 - to be built)

---

## What's Already Built ✅

1. **Database schema** - `challenges` table with `circle_id` field
2. **Service methods** - `getGlobalChallenges()` and `getCircleChallenges()`
3. **RLS policies** - Proper security at database level
4. **Global Challenges UI** - Full ChallengesScreen with discover/active/completed
5. **Zustand store** - Separate state for `globalChallenges` and `circleChallenges`
6. **Leaderboard system** - Works for both types
7. **Participation tracking** - Same tables for both types
8. **Activity linking** - Links to daily actions for both types

---

## What Needs to Be Built ❌

### For Circle Challenges:

**Phase 1.1A: Circle Page Integration** (Partially done)
- [ ] Challenges tab in Circle page (fetch works, UI incomplete)
- [ ] Challenge cards display
- [ ] Empty state when no challenges

**Phase 1.3A: Daily Actions Integration** ✅ DONE
- [x] Circle challenge activities show in Daily tab
- [x] Special styling for challenge activities
- [x] Completing posts to circle feed

**Phase 2.1: Milestone Auto-posts**
- [ ] When user joins circle challenge → auto-post to feed
- [ ] When user hits streak milestone → celebration post
- [ ] When user completes challenge → victory post

**Phase 2.2: Challenge Creation UI**
- [ ] "Create Challenge" button in Circle → Challenges tab
- [ ] Creation flow modal
- [ ] Select activities, set duration, success threshold
- [ ] Notification to all circle members when created

**Phase 3: Invitation System**
- [ ] Invite friends to join circle challenge
- [ ] Deep link brings them into circle + auto-joins challenge

---

## Practical Usage Examples

### Example 1: Global Challenge
```
User Story: Sarah wants to meditate more
→ Opens Challenges tab
→ Sees "30-Day Meditation Challenge" (global)
→ Joins (circle_id = NULL)
→ Activities appear in her Daily tab
→ Competes on global leaderboard with all users
```

### Example 2: Circle Challenge
```
User Story: Morning Warriors want accountability
→ Member creates "7-Day Cold Shower Challenge" in circle
→ Only Morning Warriors members see it
→ 5 members join (circle_id = morning-warriors-uuid)
→ Activities appear in their Daily tabs
→ Compete on leaderboard (only Morning Warriors shown)
→ Posts to Morning Warriors feed when completing
```

---

## Key Architectural Decisions

### ✅ Good Choices (Keep these):

1. **Unified table** - Avoids code duplication, easier to maintain
2. **Nullable circle_id** - Simple, elegant differentiation
3. **RLS policies** - Security at database level, not app level
4. **Same participation system** - `challenge_participants` works for both
5. **Leaderboard filters** - Can show "All" or "Circle" views

### 🔄 Considerations:

1. **Challenge creation permissions:**
   - Global: Should be admin-only or curated
   - Circle: Any member can create (needs permission check)

2. **Notification scope:**
   - Global: Notify users who follow similar activities?
   - Circle: Notify ALL circle members when created

3. **Feed posts:**
   - Global challenge posts: Where do they go? (Personal feed only?)
   - Circle challenge posts: Go to circle feed ✅

---

## Recommendation: Next Steps

### Priority 1 (Test Current System):
1. Create a test circle challenge via SQL
2. Verify it shows in circle page
3. Test joining and seeing activities in Daily tab
4. Verify posts go to circle feed

### Priority 2 (Build Missing Pieces):
1. **Phase 2.2**: Build challenge creation UI (so you don't need SQL)
2. **Phase 2.1**: Add milestone auto-posts (celebrations!)
3. **Phase 1.1A**: Finish circle challenges tab UI

### Priority 3 (Polish):
1. Notifications when challenge created
2. Invitation system
3. Push notifications

---

## SQL to Test Circle Challenge

```sql
-- Create a test circle challenge for your "TEST123" circle
INSERT INTO challenges (
  id,
  circle_id,
  title,
  description,
  start_date,
  end_date,
  status,
  min_activities,
  scoring_type,
  created_by
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM circles WHERE invite_code = 'TEST123'),
  '🧊 7-Day Cold Shower Challenge',
  'Take a cold shower every morning for 7 days. Build mental toughness together!',
  NOW(),
  NOW() + INTERVAL '7 days',
  'active',
  7,
  'consistency',
  (SELECT id FROM profiles WHERE name = '12221212' LIMIT 1)
);

-- Add some activities to the challenge
INSERT INTO challenge_activities (challenge_id, title, description, canonical_name, points_per_completion, order_index)
VALUES
  ((SELECT id FROM challenges WHERE title LIKE '%Cold Shower%' LIMIT 1), '🚿 Morning Cold Shower', '2-minute cold shower', 'cold_shower', 10, 1),
  ((SELECT id FROM challenges WHERE title LIKE '%Cold Shower%' LIMIT 1), '🧊 Ice Bath', '5-minute ice bath', 'ice_bath', 20, 2);
```

This will create a working circle challenge you can test immediately!
