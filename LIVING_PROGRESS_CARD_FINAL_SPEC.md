# Living Progress Card - Final Design Specification

**Created**: 2026-01-30
**Status**: APPROVED for implementation
**Last Updated**: After HTML mockup iterations

---

## Core Concept

**One card per user per day that updates in place** - not multiple posts.

When user completes actions throughout the day:
- SAME card updates (not new post created)
- Shows all completed actions
- Updates progress percentage and ring
- Highlights newest completed action

---

## Global Style Rules

### Colors (STRICT)
- **Gold accent**: `#E7B43A` (ONLY bright color allowed)
- **Background**: `#1a1a1a` charcoal with subtle noise texture
- **Text**: White `#fff` for primary, `#888` for metadata, `#666` for muted
- **Borders**: `rgba(255, 255, 255, 0.08)` very subtle
- **NO bright green** - removed from all elements

### Card Container
- **Width**: Full width with 16px left/right margin in feed
- **Border radius**: 22px
- **Padding**: 16px inner padding
- **Border**: 1px solid `rgba(255, 255, 255, 0.08)`
- **Shadow**: `0 4px 12px rgba(0, 0, 0, 0.3)` - soft, not strong
- **Background**: Dark charcoal with repeating subtle noise texture
- **Height**: SAME for all states - no wrapping, no extra rows

---

## Card Layout Structure (ALL STATES)

### Row 1: Header
**Left group:**
- Avatar: 40x40 circle
- Username: 18px bold white
- Metadata line under name: "Today X of N  YY%"
  - Format: `Today <highlight>2 of 4</highlight>  50%`
  - Highlight "X of N" in gold `#E7B43A`
  - Rest in muted gray `#888`
  - Font size: 14px

**Right group:**
- Progress ring: 52x52 (56x56 for 100% state)
- Ring stroke: 5px width
- Ring background: `rgba(255, 255, 255, 0.15)` dark gray
- Ring fill: `#E7B43A` gold
- Center text: "YY%" in white, 15px bold

### Row 2: Completed Label
- Text: "COMPLETED" (uppercase)
- Color: `#E7B43A` gold
- Font size: 12px
- Font weight: 600
- Letter spacing: 0.5px
- Position: Left-aligned above action tiles
- Margin: 4px bottom spacing to tiles

### Row 3: Action Tiles (CRITICAL RULES)

**Display Rules:**
- **ONLY show completed actions** - never show incomplete/unfinished actions
- **Always single row** - no wrapping to second row
- **No "+X more" tiles** - show all actual completed actions
- **Newest action always leftmost** - highlighted tile is first

**Tile Styling:**
- Height: 44px
- Min-width: 110px
- Max-width: 160px
- Border radius: 14px
- Gap between tiles: 10px
- Padding: 0 12px horizontal
- Background: `rgba(255, 255, 255, 0.04)` for normal
- Background: `rgba(255, 255, 255, 0.06)` for completed
- Border: 1px solid `rgba(255, 255, 255, 0.08)`

**Tile Content:**
- Icon: 20px emoji, left side
- Label: 16px medium weight, right of icon
- Label color: `#777` for normal, `#ccc` for completed

**Newest Tile Highlight (leftmost):**
- Background: `rgba(231, 180, 58, 0.08)`
- Border: 2px solid `#E7B43A`
- Shadow: `0 0 16px rgba(231, 180, 58, 0.25)` - soft gold glow
- Label color: `#E7B43A` gold, font-weight 600
- Padding: 0 11px (1px less due to 2px border)

### Row 4: Footer (IN-PROGRESS STATES ONLY)
- Text format: "X left: Action1, Action2, Action3"
- Color: `#666` muted gray
- Font size: 13px
- "X left" count in `#888` slightly brighter
- **100% state has NO footer**

---

## State-Specific Rules

### In-Progress State (1-99%)

**Header:**
- Metadata: "Today X of N  YY%" (highlight "X of N" in gold)
- Ring: Partial fill based on percentage

**Action Tiles:**
- Show ALL completed actions
- Newest completed action = leftmost with gold highlight
- Other completed actions = normal completed style

**Footer:**
- Shows "X left: ..." with remaining action names

**Example (2 of 4, 50%):**
```
Row 1: Avatar | Marek | "Today 2 of 4  50%" | Ring 50%
Row 2: "COMPLETED"
Row 3: [Run - gold highlight] [Read - normal]
Row 4: "2 left: Workout, Journal"
```

### Perfect Day State (100%)

**Special Styling:**
- **Thin gold top line**: 2px height, gradient from transparent to gold to transparent
- **Glow**: `0 0 8px rgba(231, 180, 58, 0.4)` on top line
- **Bigger ring**: 56x56 instead of 52x52
- **Ring**: Full 100% gold fill
- **NO footer** - removed completely

**Header:**
- Metadata: "Today 4 of 4  100%" (highlight "4 of 4" in gold)
- Ring: 100% filled with gold

**Action Tiles:**
- Show ALL completed actions (all 4 or however many)
- Newest completed action = leftmost with gold highlight
- Other completed actions = normal completed style

**Example (4 of 4, 100%):**
```
[Gold top line with glow]
Row 1: Avatar | Marek | "Today 4 of 4  100%" | Ring 100%
Row 2: "COMPLETED"
Row 3: [Workout - gold] [Read - normal] [Run - normal] [Meditate - normal]
(No footer)
```

---

## Action Tile Selection Logic

**What to show in tiles:**
1. ALL completed actions for the day
2. Newest completed = leftmost (highlighted with gold)
3. Older completed = following tiles (normal completed style)
4. Incomplete actions = NOT shown in tiles (only in footer text)

**If user has completed 1 action:**
- Show 1 tile (highlighted)

**If user has completed 3 actions:**
- Show 3 tiles (newest leftmost with highlight)

**If user has completed 5+ actions:**
- Show ALL 5+ tiles in single row (may need horizontal scroll if too many)
- OR implement max 3-4 visible with scroll
- **NEVER use "+X more" placeholder tile**

---

## Typography

- **Username**: 18px, bold, white
- **Metadata**: 14px, `#888` gray (highlight in `#E7B43A`)
- **Progress %**: 15px, bold, white (100% can be gold)
- **"COMPLETED" label**: 12px, bold, gold, uppercase, letter-spacing 0.5px
- **Action tile labels**: 16px, medium weight
  - Newest: `#E7B43A` gold, 600 weight
  - Completed: `#ccc` light gray, 500 weight
  - Incomplete: `#777` gray (but not shown in tiles)
- **Footer text**: 13px, `#666` muted
- **Footer count**: 13px, `#888` slightly brighter

---

## Spacing & Layout

**Card padding**: 16px all sides
**Header margin-bottom**: 12px
**"COMPLETED" label margin-bottom**: 4px
**Action tiles margin-bottom**: 10px
**Tile gap**: 10px between tiles
**Footer bottom padding**: implicit from card padding

**Perfect Day additions:**
- Top gold line: At very top of card (position absolute or pseudo-element)
- No extra vertical spacing added

---

## Animations & Transitions

**Action tiles:**
- Transition: `all 0.2s ease`
- Smooth border/shadow changes when new action completed

**Progress ring:**
- Smooth stroke-dashoffset transition when percentage updates

---

## Data Structure (for implementation)

```typescript
interface DailyProgressPost {
  id: string;
  user_id: string;
  type: 'daily_progress';
  is_daily_progress: true;
  progress_date: string; // 'YYYY-MM-DD'

  completed_actions: Array<{
    actionId: string;
    title: string;
    goalTitle?: string;
    goalColor?: string;
    completedAt: string; // ISO timestamp
    streak: number;
    order: number; // To determine which is newest
  }>;

  total_actions: number; // Total daily actions for user
  actions_today: number; // Count of completed (= completed_actions.length)

  created_at: string;
  updated_at: string; // Updates each time action completed
}
```

---

## Database Rules

**One card per user per day:**
- Unique index on `(user_id, progress_date)`
- When action completed:
  - Find today's card (`WHERE user_id = X AND progress_date = CURRENT_DATE`)
  - If exists: UPDATE `completed_actions` array, increment `actions_today`, set `updated_at = NOW()`
  - If not exists: INSERT new daily progress card

**Feed sorting:**
- Cards sort by `updated_at` DESC
- Each completion bumps card to top of feed

---

## Edge Cases

**Midnight rollover:**
- New day = new card (unique index on progress_date ensures this)

**Uncomplete action:**
- Remove from `completed_actions` array
- Decrement `actions_today`
- Update `updated_at`
- If `actions_today` becomes 0, optionally delete card or keep with empty array

**Multiple devices:**
- Database unique constraint prevents duplicates
- Real-time updates show changes across devices

**User has 0 daily actions:**
- Don't create card (nothing to track)

**User completes all actions (100%):**
- Show Perfect Day styling
- Keep card even if no more actions to complete

---

## Implementation Phases (Reference)

1. **Database migration** - Add columns to posts table
2. **Backend services** - findOrCreate, update, remove functions
3. **State management** - Update Post interface and transformPost
4. **UI component** - Build LivingProgressCard.tsx
5. **Integration** - Hook into action completion flow
6. **Feature flag** - `use_living_progress_cards` for rollout

---

## Visual Reference

See HTML mockup: `/home/marek/Unity-vision/living-progress-card-v3.html`

**States demonstrated:**
1. In-progress 50% (2 of 4)
2. Perfect Day 100% (4 of 4) with gold top line
3. Early progress 25% (1 of 4)
4. Multiple actions 33% (2 of 6)

---

## Acceptance Criteria

- ✅ Same card height for all states
- ✅ Only gold accent color used
- ✅ Only completed actions shown in tiles
- ✅ Newest action always leftmost with gold highlight
- ✅ "COMPLETED" label above tiles
- ✅ No "+X more" tiles
- ✅ 100% has gold top line and bigger ring
- ✅ Footer only for in-progress states
- ✅ One card per user per day updates in place

---

## What NOT to Do

- ❌ Don't use bright green (#06FFA5) anywhere
- ❌ Don't show incomplete actions in tile grid
- ❌ Don't wrap action tiles to second row
- ❌ Don't use "+X more" placeholder tiles
- ❌ Don't center "COMPLETED" label - left-align above tiles
- ❌ Don't show footer for 100% state
- ❌ Don't add green status dot on avatar
- ❌ Don't make tiles different sizes (use min/max width)
- ❌ Don't create new post for each action - update same card

---

**END OF SPECIFICATION**
