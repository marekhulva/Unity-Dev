# Social Page Redesign — Complete Implementation Spec

**Reference Mockup**: `social-jobs-zuckerberg.html`
**Target File**: `src/features/social/SocialScreenUnified.tsx`
**Date**: 2026-02-09

---

## OVERVIEW

This spec describes the exact redesign of `SocialScreenUnified.tsx` and its child components. The redesign adds 3 new sections (Presence Row, Momentum Banner, Suggested Users) and upgrades 3 existing sections (Header, Circle Selector, Post Cards). The tab bar and modals remain unchanged.

**What changes:**
1. Header — add search + notification icons, remove UserPlus, update logo style
2. Circle Selector — replace bottom-sheet dropdown with horizontal pill row
3. New: Presence Row — horizontal scroll of active circle members
4. Composer — minor style update (rounded card container)
5. New: Momentum Banner — circle activity summary card
6. Post Cards — add engagement faces, comment preview, share button
7. New: Celebration Card — dedicated milestone card type
8. New: Suggested Users section — inline follow suggestions

**What stays the same:**
- Bottom tab bar (in `AppWithAuth.tsx`)
- All modals (CircleMembersModal, JoinCircleModal, DiscoverUsersModal, JoinChallengeModal, ProfileModal)
- FlatList pagination logic, pull-to-refresh
- State management (Zustand store, socialSlice)
- LivingProgressCard (minor border style update only)

---

## 1. HEADER

**File**: `SocialScreenUnified.tsx` — replace existing header `View`
**Current**: Logo "UNITY" + single UserPlus icon button
**New**: Logo "UNITY" + Search icon button + Bell icon button with notification dot

### Layout
```
[UNITY]                           [🔍] [🔔]
```

- Container: `flexDirection: 'row'`, `justifyContent: 'space-between'`, `alignItems: 'center'`
- Padding: `paddingHorizontal: 20`, `paddingTop: 8`, `paddingBottom: 0`

### Logo Text
```js
{
  fontSize: 22,
  fontWeight: '800',
  letterSpacing: 6,
  textTransform: 'uppercase',
  // Gold gradient — use expo-linear-gradient with MaskedView
  // Fallback solid: color: '#D4AF37'
}
```
**Implementation note**: React Native doesn't support CSS `background-clip: text`. Two options:
- **Option A (recommended)**: Use `@react-native-masked-view/masked-view` with `LinearGradient` behind a `Text` mask. Colors: `['#E7C455', '#D4AF37', '#C49B30']`, `start: {x:0,y:0}`, `end: {x:1,y:1}`
- **Option B (simpler)**: Solid `color: '#D4AF37'` — matches existing

### Action Buttons
Two circular icon buttons, right-aligned, `gap: 12`

Each button:
```js
{
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: 'rgba(255,255,255,0.06)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.06)',
  justifyContent: 'center',
  alignItems: 'center',
}
```

Icons from `lucide-react-native`:
- Search icon: `<Search size={18} color="rgba(255,255,255,0.6)" />`
- Bell icon: `<Bell size={18} color="rgba(255,255,255,0.6)" />`

### Notification Dot
Positioned on the Bell button:
```js
{
  position: 'absolute',
  top: 6,
  right: 6,
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: '#D4AF37',
  borderWidth: 2,
  borderColor: '#000000', // matches screen bg
}
```
**Data**: Show dot when `unreadNotificationCount > 0` (add to store if not exists, or hardcode `true` for MVP)

### Gold Accent Line
**Keep existing** `LinearGradient` line below header. No changes.

---

## 2. PRESENCE ROW (NEW COMPONENT)

**New file**: `src/features/social/components/PresenceRow.tsx`
**Position**: Directly below the gold accent line, above the circle selector
**Purpose**: Shows circle members with online/activity indicators. Drives FOMO + engagement.

### Layout
- Horizontal `ScrollView` (or `FlatList` horizontal)
- `showsHorizontalScrollIndicator: false`
- Container padding: `paddingVertical: 16`, `paddingBottom: 12`
- Inner content padding: `paddingHorizontal: 24`
- Gap between items: `16`

### First Item — "Your Day" (Post Prompt)
```
┌─────────────────┐
│  ┌───────────┐  │
│  │  DASHED   │  │
│  │  BORDER   │  │
│  │   🧔      │  │
│  │     [+]   │  │
│  └───────────┘  │
│    Your day     │
└─────────────────┘
```

Avatar ring:
```js
{
  width: 56,
  height: 56,
  borderRadius: 28,
  borderWidth: 2,
  borderStyle: 'dashed',  // Note: RN doesn't support dashed on Android natively
  borderColor: 'rgba(255,255,255,0.2)',
  justifyContent: 'center',
  alignItems: 'center',
}
```
**Android fallback for dashed border**: Use `react-native-svg` `Circle` with `strokeDasharray="4 4"` or use solid `borderColor: 'rgba(255,255,255,0.15)'`

Inner avatar:
```js
{
  width: 49,
  height: 49,
  borderRadius: 24.5,
  backgroundColor: '#111111',
  justifyContent: 'center',
  alignItems: 'center',
}
```
- Emoji: current user's avatar from `useStore(s => s.user?.avatar)`
- Font size: 24

Plus badge (bottom-right corner):
```js
{
  position: 'absolute',
  bottom: -2,
  right: -2,
  width: 20,
  height: 20,
  borderRadius: 10,
  backgroundColor: '#D4AF37',
  borderWidth: 2.5,
  borderColor: '#000000',
  justifyContent: 'center',
  alignItems: 'center',
}
```
- Plus text: `fontSize: 14`, `fontWeight: '700'`, `color: '#000'`

Name label:
```js
{
  fontSize: 11,
  fontWeight: '500',
  color: 'rgba(255,255,255,0.4)',
  marginTop: 6,
  textAlign: 'center',
  maxWidth: 64,
}
```

**onPress**: Expand the composer (same as tapping composer input)

### Circle Member Items
For each member in the active circle:

```
┌──────────────┐
│ ┌──────────┐ │
│ │ GOLD or  │ │
│ │ GRAY     │ │
│ │ RING     │ │
│ │  👩‍🎨  [●]│ │
│ └──────────┘ │
│    Sarah     │
└──────────────┘
```

Avatar ring — two variants:

**Has new activity (gold ring)**:
```js
// Use LinearGradient as the ring
{
  width: 56,
  height: 56,
  borderRadius: 28,
  padding: 2.5, // creates the ring effect
  // LinearGradient colors: ['#D4AF37', '#E7C455', '#D4AF37']
}
// Inner View (the avatar):
{
  width: '100%',
  height: '100%',
  borderRadius: 25.5, // (56 - 5) / 2
  backgroundColor: '#111111',
  justifyContent: 'center',
  alignItems: 'center',
}
```

**No new activity (gray ring)**:
```js
{
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: 'rgba(255,255,255,0.1)',
  padding: 2.5,
}
```

Online indicator (green dot):
```js
{
  position: 'absolute',
  bottom: 0,
  right: 0,
  width: 14,
  height: 14,
  borderRadius: 7,
  backgroundColor: '#00FF88', // colors.green from tokens
  borderWidth: 2.5,
  borderColor: '#000000',
}
```

Name label:
```js
{
  fontSize: 11,
  fontWeight: '500',
  color: 'rgba(255,255,255,0.6)',
  marginTop: 6,
  textAlign: 'center',
  maxWidth: 64,
  numberOfLines: 1,
  ellipsizeMode: 'tail',
}
```

**onPress**: Open profile modal — `onProfilePress(member.userId)`

### Data Source
- Fetch circle members from existing `useStore(s => s.circleMembers)` or the active circle's member list
- Online status: If available from real-time presence (Supabase Realtime), use it. Otherwise, show online dot for users who posted in last 30 minutes.
- "Has new activity": User posted/checked-in today = gold ring. Otherwise gray ring.
- Sort: Online users first, then by most recent activity

### Divider After Presence Row
```js
// LinearGradient horizontal divider
{
  height: 1,
  marginHorizontal: 24,
}
// Colors: ['transparent', 'rgba(255,255,255,0.06)', 'transparent']
// start: {x:0, y:0}, end: {x:1, y:0}
```

---

## 3. CIRCLE SELECTOR (REDESIGN EXISTING)

**File**: Replace `CircleSelector` usage in `SocialScreenUnified.tsx`
**Current**: Single dropdown button that opens a bottom sheet modal
**New**: Horizontal scrollable pill row (inline, no modal needed for selection)

### Layout
- Horizontal `ScrollView`, `showsHorizontalScrollIndicator: false`
- Container: `paddingVertical: 14`, `paddingTop: 14`, `paddingBottom: 8`
- Content padding: `paddingHorizontal: 24`
- Gap between pills: `8`

### Pill Style — Active
```js
{
  paddingVertical: 7,
  paddingHorizontal: 16,
  borderRadius: 999, // full round
  backgroundColor: '#FFFFFF',
  // No border
}
// Text:
{
  fontSize: 13,
  fontWeight: '600',
  color: '#000000',
}
```

### Pill Style — Inactive
```js
{
  paddingVertical: 7,
  paddingHorizontal: 16,
  borderRadius: 999,
  backgroundColor: 'rgba(255,255,255,0.06)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.06)',
}
// Text:
{
  fontSize: 13,
  fontWeight: '600',
  color: 'rgba(255,255,255,0.6)',
}
```

### Pill with Count Badge
For circles with new unread posts, show a gold count badge:
```js
// Badge (inline after text):
{
  width: 16,
  height: 16,
  borderRadius: 8,
  backgroundColor: '#D4AF37',
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: 6,
}
// Badge text:
{
  fontSize: 10,
  fontWeight: '700',
  color: '#000000',
}
```

### Items (in order)
1. "All" — maps to `FEED_ALL`
2. "Following" — maps to `FEED_FOLLOWING`
3. Each circle from `userCircles` — maps to `circle.id`
   - Display: `circle.name`
   - Show count badge if circle has unread posts (if data available)

### Interactions
- `onPress`: call `handleFeedTypeChange(id)`, trigger `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`
- Active pill animates: Use `withTiming` for background color transition, or use `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)`

### Migration Note
The existing `CircleSelector` component and its bottom sheet modal should be **kept** but not rendered inline. Instead, create a new `CirclePillRow` component. The bottom sheet can optionally remain accessible via a "..." overflow pill at the end of the row for circle management (join/leave).

---

## 4. COMPOSER (MINOR UPDATE)

**File**: `SocialScreenUnified.tsx` — update `styles.composer`
**Current**: Borderless section with bottom border divider
**New**: Contained rounded card

### Updated Container Style
```js
{
  marginHorizontal: 20,
  marginTop: 12,
  marginBottom: 0, // momentum banner handles spacing below
  paddingHorizontal: 16,
  paddingVertical: 14,
  backgroundColor: 'rgba(255,255,255,0.03)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.06)',
  borderRadius: 20,
}
```

### Composer Row
```
[Avatar 36px]  [What did you complete today?]  [📷]
```

- Avatar: Keep existing `composerAvatar` style (42x42 → change to 36x36 to save space)
  ```js
  { width: 36, height: 36, borderRadius: 18 }
  ```
- Placeholder text: Keep existing `"What did you complete today?"`
- Placeholder color: `rgba(255,255,255,0.4)`
- Camera/Image icon button: Only show image picker icon in collapsed state (remove Mic for now)
  - Icon: `<ImageIcon size={18} color="rgba(255,255,255,0.4)" />`

### Expanded State
Keep existing expand behavior — show media buttons row + post button. No changes needed.

---

## 5. MOMENTUM BANNER (NEW COMPONENT)

**New file**: `src/features/social/components/MomentumBanner.tsx`
**Position**: Below composer, above feed
**Purpose**: Social proof — shows circle activity summary

### Layout
```
┌────────────────────────────────────────────────┐
│  [🔥 icon]  Circle on fire today     [👩‍🎨][💪][🧘‍♀️][+1] │
│             4 of 6 members checked in          │
└────────────────────────────────────────────────┘
```

### Container
```js
{
  marginHorizontal: 20,
  marginTop: 8,
  marginBottom: 16,
  paddingHorizontal: 20,
  paddingVertical: 16,
  borderRadius: 20,
  backgroundColor: 'rgba(212,175,55,0.08)', // gold tint
  borderWidth: 1,
  borderColor: 'rgba(212,175,55,0.15)',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 14,
  overflow: 'hidden',
}
```

### Background Glow
Subtle radial glow in top-right corner using a positioned View:
```js
{
  position: 'absolute',
  top: -50,
  right: -20,
  width: 150,
  height: 150,
  borderRadius: 75,
  backgroundColor: 'rgba(212,175,55,0.06)',
}
```
**Alternative**: Use `expo-linear-gradient` with `RadialGradient` if available, or just skip this for v1.

### Fire Icon Container
```js
{
  width: 44,
  height: 44,
  borderRadius: 14,
  overflow: 'hidden', // for LinearGradient child
  justifyContent: 'center',
  alignItems: 'center',
}
// LinearGradient inside: colors: ['#D4AF37', '#E7C455']
// Content: Text "🔥" fontSize: 20
```

### Text Content
Title:
```js
{
  fontSize: 14,
  fontWeight: '700',
  color: '#FFFFFF',
  marginBottom: 2,
}
```

Subtitle:
```js
{
  fontSize: 12,
  color: 'rgba(255,255,255,0.6)',
  lineHeight: 16.8, // 12 * 1.4
}
```
- Bold highlight for the count: `color: '#E7C455'`, `fontWeight: '600'`
- Text: `"{checkedInCount} of {totalMembers} members checked in"` or `"checked in already"` if > 50%

### Stacked Avatars (right side)
```js
// Container
{
  flexDirection: 'row',
  marginLeft: 'auto',
}
// Each avatar
{
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: '#111111',
  borderWidth: 2,
  borderColor: 'rgba(212,175,55,0.2)',
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: -8, // overlap
}
// First avatar: marginLeft: 0
// Emoji inside: fontSize: 12
```

Overflow count avatar:
```js
{
  // same size/shape as above
  backgroundColor: 'rgba(212,175,55,0.1)',
}
// Text: fontSize: 10, fontWeight: '700', color: '#D4AF37'
// Content: "+{overflowCount}"
```

### Data Source
- Members who checked in today: Query from circle member activity data
- If data not available: Calculate from `unifiedFeed` — count unique users with posts today
- Total members: From `activeCircle.member_count` or `circleMembers.length`
- Show only when a specific circle is selected (not on "All" or "Following" feeds)
- If `checkedInCount === 0`, hide the banner entirely

### Conditional Title Logic
```
checkedInCount / totalMembers >= 0.5 → "Circle on fire today 🔥"
checkedInCount / totalMembers >= 0.3 → "Circle is heating up"
checkedInCount / totalMembers < 0.3  → "Get the momentum going"
```

---

## 6. POST CARD UPGRADES

**File**: `src/features/social/UnifiedPostCardTimeline.tsx`
**These are modifications to the existing component, not a replacement.**

### 6A. Add Streak Ring on Avatar

When `post.streak > 0`, add a gold border to the avatar:
```js
// Conditional style on avatar View:
...(streak > 0 && {
  borderWidth: 2,
  borderColor: '#D4AF37',
  shadowColor: '#D4AF37',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.2,
  shadowRadius: 12,
})
```

### 6B. Streak Badge on Avatar

When `post.streak > 7`, show a fire badge:
```js
// Position: absolute, bottom: -4, right: -4 relative to avatar wrapper
{
  position: 'absolute',
  bottom: -4,
  right: -4,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 1,
  paddingHorizontal: 5,
  paddingVertical: 2,
  borderRadius: 8,
  borderWidth: 2,
  borderColor: 'rgba(255,255,255,0.04)', // match card bg
  overflow: 'hidden',
}
// LinearGradient background: colors: ['#FF6B35', '#FF4500']
// Content: Text "🔥{streak}" fontSize: 9, fontWeight: '800', color: '#FFFFFF'
```

### 6C. Goal Tag Next to Username

When `post.goal` exists, show a colored tag:
```js
// Position: inline in headerText row, after userName
{
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 6,
  backgroundColor: `${post.goalColor || '#B366FF'}20`, // 20 = ~12% opacity hex
}
// Text:
{
  fontSize: 10,
  fontWeight: '600',
  color: post.goalColor || '#B366FF',
  letterSpacing: 0.3,
}
// Content: post.goal (e.g., "Fitness", "Mindfulness")
```

### 6D. Engagement Faces Row (NEW)

Add between content and action bar. Shows WHO reacted (not just a count).

```
[👩‍🎨][🧔][🧘‍♀️]  Sarah, you and 8 others
```

```js
// Container
{
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  marginBottom: 12,
}
```

Stacked face avatars:
```js
{
  width: 20,
  height: 20,
  borderRadius: 10,
  backgroundColor: '#1A1A1A',
  borderWidth: 2,
  borderColor: 'rgba(255,255,255,0.04)', // match card bg
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: -6, // overlap, first: marginLeft: 0
}
// Emoji: fontSize: 9
```

Text:
```js
{
  fontSize: 12,
  color: 'rgba(255,255,255,0.4)',
}
// Bold names: fontWeight: '600', color: 'rgba(255,255,255,0.6)'
```

**Data**: Use `post.reactions` data. If individual reactor info not available in current data model, show: `"{reactionCount} people reacted"` without avatars. This requires a backend enhancement to return reactor details — for MVP, show just the count text.

### 6E. Action Bar Upgrade

**Current**: Fire + Comment buttons
**New**: Fire + Comment + spacer + Share button

Add separator line above:
```js
{
  borderTopWidth: 1,
  borderTopColor: 'rgba(255,255,255,0.06)',
  paddingTop: 12,
}
```

Share button (rightmost):
```js
// Icon: <Share2 size={18} color="rgba(255,255,255,0.35)" /> from lucide-react-native
// Same style as existing engageBtn
// onPress: Share.share({ message: post.content }) using RN's Share API
```

Button labels with counts:
```js
// Fire button text when active: color: '#FF6B35'
// Text style: fontSize: 13, fontWeight: '600'
```

### 6F. Comment Preview (NEW)

Show below action bar when `post.commentCount > 0`. Shows the most recent comment + "View all X comments" link + inline input.

```
─────────────────────────────
[🧘‍♀️]  ┌─ Priya ─────────────────┐
       │ 315?! That's insane... │
       └────────────────────────┘
View all 3 comments
[🧔] [Add a comment...        ]
─────────────────────────────
```

**Show by default** (not hidden behind a toggle). This replaces the current `showComments` toggle behavior. Comments section is always visible if comments exist. Full expansion (showing all comments) remains on tap of "View all".

Comment bubble:
```js
// Container
{
  flexDirection: 'row',
  gap: 10,
  alignItems: 'flex-start',
  marginTop: 12,
  paddingTop: 12,
  borderTopWidth: 1,
  borderTopColor: 'rgba(255,255,255,0.06)',
}

// Avatar
{
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: '#1A1A1A',
  justifyContent: 'center',
  alignItems: 'center',
}
// Emoji: fontSize: 12

// Bubble
{
  flex: 1,
  backgroundColor: 'rgba(255,255,255,0.03)',
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 14,
  borderTopLeftRadius: 4, // chat bubble effect
}
// Username: fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.8)'
// Text: fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 18.2
```

"View all" link:
```js
{
  fontSize: 12,
  color: 'rgba(255,255,255,0.4)',
  fontWeight: '600',
  marginTop: 8,
}
// onPress: setShowAllComments(true) — expand to show all
```

Inline comment input:
```js
// Row: flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10
// Mini avatar: width: 24, height: 24, borderRadius: 12
// Input container:
{
  flex: 1,
  backgroundColor: 'rgba(255,255,255,0.03)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.06)',
  borderRadius: 999,
  paddingHorizontal: 14,
  paddingVertical: 7,
}
// Placeholder: "Add a comment...", fontSize: 12, color: 'rgba(255,255,255,0.4)'
```

---

## 7. CELEBRATION CARD (NEW VARIANT)

**File**: Modify `UnifiedPostCardTimeline.tsx` — upgrade the existing `isCelebration` branch
**Current**: Simple inline row with gold text
**New**: Full hero card with large milestone number

### When to Show
`post.is_celebration === true` AND `post.streak >= 10` (significant milestones: 10, 25, 50, 100, etc.)

### Layout
```
┌──────────────────────────────────────────┐
│  [🎸 avatar]  Alex Rivera         [···]  │
│               ✦ Milestone reached        │
│                                          │
│                  50                       │
│              DAY STREAK                   │
│                                          │
│      [🔥 Celebrate]  [💬 Comment]        │
└──────────────────────────────────────────┘
```

### Container
```js
{
  marginHorizontal: 8, // match existing item margin
  marginBottom: 12,
  borderRadius: 24,
  borderWidth: 1,
  borderColor: 'rgba(212,175,55,0.2)',
  overflow: 'hidden',
}
```

### Background
Use LinearGradient:
```js
colors: ['rgba(212,175,55,0.08)', 'rgba(0,0,0,0.95)', 'rgba(212,175,55,0.04)']
// start: {x:0, y:0}, end: {x:1, y:1}
// padding: 24 horizontal, 24 vertical
```

Background glow (decorative):
```js
{
  position: 'absolute',
  top: -50,
  right: -30,
  width: 200,
  height: 200,
  borderRadius: 100,
  backgroundColor: 'rgba(212,175,55,0.06)',
}
```

### Header Row
```js
// flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16
```

Avatar:
```js
{
  width: 48,
  height: 48,
  borderRadius: 24,
  borderWidth: 2,
  borderColor: '#D4AF37',
  shadowColor: '#D4AF37',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.3,
  shadowRadius: 20,
  justifyContent: 'center',
  alignItems: 'center',
}
// Background: LinearGradient colors: ['rgba(212,175,55,0.2)', '#111111']
// Emoji: fontSize: 22
```

Username:
```js
{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }
```

Milestone label:
```js
{ fontSize: 12, fontWeight: '600', color: '#E7C455' }
// Content: "✦ Milestone reached"
```

### Center — Big Number
```js
// Container: textAlign: 'center', paddingVertical: 12
```

Number:
```js
{
  fontSize: 56,
  fontWeight: '900',
  lineHeight: 56,
  letterSpacing: -2,
  // Gold gradient text (same MaskedView technique as header logo)
  // Fallback: color: '#D4AF37'
}
```

Label below number:
```js
{
  fontSize: 14,
  fontWeight: '600',
  color: 'rgba(255,255,255,0.6)',
  textTransform: 'uppercase',
  letterSpacing: 3,
  textAlign: 'center',
}
// Content: "DAY STREAK" or other milestone type
```

### Action Buttons
Centered row, `gap: 8`, `marginTop: 16`

Primary button (Celebrate):
```js
{
  paddingHorizontal: 20,
  paddingVertical: 8,
  borderRadius: 999,
  overflow: 'hidden',
}
// LinearGradient background: colors: ['#D4AF37', '#E7C455']
// Text: fontSize: 13, fontWeight: '600', color: '#000000'
// Content: "🔥 Celebrate"
// onPress: handleReact (same as fire reaction)
```

Secondary button (Comment):
```js
{
  paddingHorizontal: 20,
  paddingVertical: 8,
  borderRadius: 999,
  backgroundColor: 'rgba(255,255,255,0.06)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
}
// Text: fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)'
// Content: "💬 Comment"
// onPress: toggle comment input
```

---

## 8. SUGGESTED USERS SECTION (NEW COMPONENT)

**New file**: `src/features/social/components/SuggestedUsersSection.tsx`
**Position**: Inserted into the FlatList after every ~5 posts (or as a ListFooterComponent section)
**Purpose**: Growth loop — discover and follow new users

### Layout
```
┌────────────────────────────────────────────┐
│ 👥 People in your circles also follow      │
│                                            │
│ ┌──────┐  ┌──────┐  ┌──────┐              │
│ │  🎯  │  │  📷  │  │  🎮  │              │
│ │ Kai   │  │ Mia  │  │Devon │              │
│ │3 mutual│ │2 mutual│ │5 mutual│            │
│ │[Follow]│ │[Follow]│ │[Follow]│            │
│ └──────┘  └──────┘  └──────┘              │
└────────────────────────────────────────────┘
```

### Outer Container
```js
{
  marginHorizontal: 20,
  marginVertical: 16,
  padding: 16,
  backgroundColor: 'rgba(255,255,255,0.03)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.06)',
  borderRadius: 20,
}
```

### Header Text
```js
{
  fontSize: 13,
  fontWeight: '700',
  color: 'rgba(255,255,255,0.6)',
  marginBottom: 12,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
}
// Icon: <UserPlus size={16} color="rgba(255,255,255,0.4)" />
// Text: "People in your circles also follow"
```

### Cards Row
Horizontal `ScrollView`, `gap: 10`, `showsHorizontalScrollIndicator: false`

Each card:
```js
{
  minWidth: 140,
  padding: 14,
  backgroundColor: '#111111',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.06)',
  borderRadius: 16,
  alignItems: 'center',
  gap: 8,
}
```

Avatar:
```js
{
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: '#1A1A1A',
  justifyContent: 'center',
  alignItems: 'center',
}
// Emoji: fontSize: 20
```

Name: `fontSize: 13, fontWeight: '600', color: '#FFFFFF'`
Mutual: `fontSize: 11, color: 'rgba(255,255,255,0.4)'`
- Content: `"{count} mutual"` — number of shared circle members

Follow button:
```js
{
  paddingHorizontal: 18,
  paddingVertical: 6,
  borderRadius: 999,
  backgroundColor: '#FFFFFF',
}
// Text: fontSize: 12, fontWeight: '700', color: '#000000'
// Content: "Follow"
```

**onPress Follow**: Call `followUser(userId)` from store. Change button to:
```js
{
  backgroundColor: 'rgba(255,255,255,0.1)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.2)',
}
// Text: "Following", color: 'rgba(255,255,255,0.6)'
```

### Data Source
- Use existing `DiscoverUsersModal` data/logic — the same API that fetches suggested users
- Filter to users not already followed
- Show max 5 suggestions
- Hide section if no suggestions available

### Insertion Logic
In `SocialScreenUnified.tsx`, insert the suggestion section as a special item in the FlatList data array at index 5 (after 5th post), or render it as part of `ListFooterComponent` if feed is short.

---

## 9. LIVING PROGRESS CARD (MINOR UPDATE)

**File**: `src/features/social/components/LivingProgressCard.tsx`

### Changes
1. **Perfect Day border**: Add gold border when `isPerfectDay`:
   ```js
   ...(isPerfectDay && {
     borderColor: 'rgba(212,175,55,0.2)',
   })
   ```

2. **Action bar at bottom**: Add fire reaction + comment buttons below the footer, matching the engagement bar pattern from regular posts. This makes progress cards interactive.
   ```js
   // Below footer, add:
   // borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)'
   // paddingTop: 12
   // Same engageBtn style as UnifiedPostCardTimeline
   ```

3. **Add engagement faces**: Same pattern as Section 6D above the action bar

---

## 10. TAB BAR

**No changes required.** The tab bar is defined in `AppWithAuth.tsx` and remains as-is. For reference, the current 5 tabs are: Social, Daily, Circle, Challenges, Profile.

---

## 11. ANIMATIONS & INTERACTIONS

### Haptic Feedback (existing pattern — extend to new components)
- Pill selection: `Haptics.impactAsync(ImpactFeedbackStyle.Light)`
- Fire reaction: `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` (already exists)
- Follow button: `Haptics.impactAsync(ImpactFeedbackStyle.Medium)`
- Presence item tap: `Haptics.impactAsync(ImpactFeedbackStyle.Light)`
- Celebration "Celebrate" button: `Haptics.notificationAsync(NotificationFeedbackType.Success)`

### Reaction Animation (already exists — no change)
```js
scale.value = withSequence(
  withTiming(1.3, { duration: 80 }),
  withSpring(1, { damping: 10 })
);
```

### Pill Selection Animation
When a pill becomes active, animate background opacity transition:
```js
// Use Animated.View with useAnimatedStyle
// backgroundColor interpolation from rgba(255,255,255,0.06) → rgba(255,255,255,1)
// Duration: 200ms, easing: Easing.out(Easing.ease)
```

### Celebration Card Entry
When celebration card scrolls into view:
```js
entering={FadeInDown.duration(400).springify().damping(15)}
```

### Follow Button State
```js
// Use withTiming for scale bounce
scale.value = withSequence(
  withTiming(0.95, { duration: 50 }),
  withSpring(1, { damping: 12 })
);
```

---

## 12. NEW IMPORTS NEEDED

Add to `SocialScreenUnified.tsx`:
```js
import { Search, Bell, Share2 } from 'lucide-react-native';
import { PresenceRow } from './components/PresenceRow';
import { MomentumBanner } from './components/MomentumBanner';
import { SuggestedUsersSection } from './components/SuggestedUsersSection';
import { CirclePillRow } from '../circles/components/CirclePillRow';
```

Add to `UnifiedPostCardTimeline.tsx`:
```js
import { Share2 } from 'lucide-react-native';
import { Share } from 'react-native';
```

---

## 13. COMPONENT TREE (FINAL)

```
SocialScreenUnified
├── Header
│   ├── Logo Text "UNITY" (gold)
│   └── Action Buttons
│       ├── Search (opens DiscoverUsersModal)
│       └── Bell (opens notifications - future)
│           └── NotificationDot
├── Gold Accent Line (LinearGradient)
├── FlatList
│   ├── ListHeaderComponent
│   │   ├── PresenceRow (NEW)
│   │   │   ├── YourDay item (self)
│   │   │   └── MemberItem[] (circle members)
│   │   ├── SectionDivider
│   │   ├── CirclePillRow (REDESIGNED)
│   │   │   └── Pill[] (All, Following, Circle names...)
│   │   ├── Composer (UPDATED)
│   │   └── MomentumBanner (NEW, conditional)
│   ├── Feed Items (mixed types)
│   │   ├── LivingProgressCard (for daily_progress posts)
│   │   ├── UnifiedPostCardTimeline (UPDATED)
│   │   │   ├── Streak Ring + Badge on avatar
│   │   │   ├── Goal Tag
│   │   │   ├── Check-in card / Text / Photo
│   │   │   ├── Engagement Faces Row (NEW)
│   │   │   ├── Action Bar (fire, comment, share)
│   │   │   └── Comment Preview (NEW)
│   │   │       ├── Latest comment bubble
│   │   │       ├── "View all X comments"
│   │   │       └── Inline comment input
│   │   ├── CelebrationCard (UPGRADED)
│   │   └── SuggestedUsersSection (NEW, inserted at index ~5)
│   └── ListFooterComponent
│       └── Loading / "You're all caught up"
├── CircleMembersModal (unchanged)
├── JoinCircleModal (unchanged)
├── DiscoverUsersModal (unchanged)
├── JoinChallengeModal (unchanged)
└── ProfileModal (unchanged)
```

---

## 14. DATA MODEL ADDITIONS

### New fields on Post type (optional — for full feature support)

Add to `src/state/slices/socialSlice.ts`:
```ts
export type Post = {
  // ... existing fields ...

  // NEW: Reactor details for engagement faces
  reactors?: Array<{
    userId: string;
    avatar: string;
    username: string;
  }>;

  // NEW: Milestone type for celebration cards
  milestoneType?: 'streak' | 'perfect_days' | 'actions_completed';
  milestoneValue?: number;
};
```

### New store fields (optional)

Add to root store or a new presence slice:
```ts
// Circle member presence
circlePresence: Array<{
  userId: string;
  username: string;
  avatar: string;
  isOnline: boolean;
  hasNewActivity: boolean;
  lastActivityAt: string;
}>;

// Unread notification count
unreadNotificationCount: number;

// Suggested users
suggestedUsers: Array<{
  userId: string;
  username: string;
  avatar: string;
  mutualCount: number;
  isFollowing: boolean;
}>;
```

**MVP approach**: If backend data isn't ready, derive presence from feed data:
- `circlePresence`: Extract unique users from today's posts in the current circle feed
- `hasNewActivity`: User has a post today
- `isOnline`: User has a post in the last 30 minutes
- `suggestedUsers`: Use existing discover users API data

---

## 15. IMPLEMENTATION ORDER

### Phase 1 — Visual Only (no new data needed)
1. Update Header (search + bell icons)
2. Create `CirclePillRow` component (replace dropdown with pills)
3. Update Composer container style
4. Update `UnifiedPostCardTimeline` action bar (add share button, top border)
5. Upgrade Celebration card branch in `UnifiedPostCardTimeline`

### Phase 2 — Enhanced Engagement (uses existing data)
6. Add streak ring/badge on post avatars
7. Add goal tag next to usernames
8. Add comment preview section (always-visible latest comment)
9. Add engagement count text row above action bar

### Phase 3 — New Sections (may need new data)
10. Create `PresenceRow` component (derive from feed data for MVP)
11. Create `MomentumBanner` component (derive from feed data for MVP)
12. Create `SuggestedUsersSection` component (reuse discover users data)

### Phase 4 — Polish
13. Add all animations (pill transitions, celebration entry, follow bounce)
14. Add haptic feedback to new interactions
15. Add engagement faces with reactor avatars (needs backend)
16. Add real-time presence via Supabase Realtime (future)

---

## 16. EXACT COLOR REFERENCE (Quick Copy-Paste)

| Token | Value | Usage |
|-------|-------|-------|
| Gold Primary | `#D4AF37` | Buttons, accents, logo |
| Gold Light | `#E7C455` | Gradients, highlights |
| Gold Dim | `rgba(212,175,55,0.15)` | Banners, tinted bg |
| Gold Glow | `rgba(212,175,55,0.08)` | Momentum banner bg |
| Gold Border | `rgba(212,175,55,0.15)` | Banner border |
| Black Pure | `#000000` | Screen bg |
| Black Soft | `#0A0A0A` | Card bg variant |
| Black Card | `#111111` | Card bg, elevated |
| Black Elevated | `#1A1A1A` | Nested elements |
| White Full | `#FFFFFF` | Primary text, active pill |
| White 80 | `rgba(255,255,255,0.8)` | Body text |
| White 60 | `rgba(255,255,255,0.6)` | Secondary text, labels |
| White 40 | `rgba(255,255,255,0.4)` | Tertiary text, timestamps |
| White 20 | `rgba(255,255,255,0.2)` | Dashed borders |
| White 10 | `rgba(255,255,255,0.1)` | Hover states |
| White 06 | `rgba(255,255,255,0.06)` | Card borders, dividers |
| White 04 | `rgba(255,255,255,0.04)` | Card bg (timeline) |
| White 03 | `rgba(255,255,255,0.03)` | Composer bg, bubbles |
| Green | `#00FF88` | Online dot, success |
| Green Dim | `rgba(0,255,136,0.12)` | Check-in bg |
| Blue | `#00D4FF` | Goal glow |
| Blue Dim | `rgba(0,212,255,0.12)` | Goal tag bg |
| Purple | `#B366FF` | Default accent |
| Fire Red | `#FF6B35` | Fire reaction active |
| Fire Dark | `#FF4500` | Streak badge gradient |

---

## 17. TYPOGRAPHY REFERENCE

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Logo "UNITY" | 22 | 800 | #D4AF37 (gradient) |
| Post Username | 14-15 | 700 | #F5F5F5 |
| Post Body Text | 15 | 400 | rgba(255,255,255,0.8) |
| Post Time | 12 | 400 | rgba(255,255,255,0.4) |
| Goal Tag | 10 | 600 | goalColor |
| Streak Badge | 9 | 800 | #FFFFFF |
| Pill Active | 13 | 600 | #000000 |
| Pill Inactive | 13 | 600 | rgba(255,255,255,0.6) |
| Presence Name | 11 | 500 | rgba(255,255,255,0.6) |
| Momentum Title | 14 | 700 | #FFFFFF |
| Momentum Subtitle | 12 | 400 | rgba(255,255,255,0.6) |
| Comment Username | 12 | 700 | rgba(255,255,255,0.8) |
| Comment Text | 13 | 400 | rgba(255,255,255,0.6) |
| Engagement Text | 12 | 400 | rgba(255,255,255,0.4) |
| Action Button | 13 | 600 | rgba(255,255,255,0.6) |
| Celebration Number | 56 | 900 | #D4AF37 (gradient) |
| Celebration Label | 14 | 600 | rgba(255,255,255,0.6) |
| Section Header | 13 | 700 | rgba(255,255,255,0.6) |
| Follow Button | 12 | 700 | #000000 |
| Suggestion Name | 13 | 600 | #FFFFFF |
| Suggestion Mutual | 11 | 400 | rgba(255,255,255,0.4) |

---

## 18. SPACING REFERENCE

| Element | Value | Notes |
|---------|-------|-------|
| Screen horizontal padding | 20px | Header, banner, composer |
| Card horizontal margin | 8px | Post cards (existing) |
| Card internal padding | 20px | Post cards (existing) |
| Card border radius | 24px | All cards |
| Pill gap | 8px | Between pills |
| Presence item gap | 16px | Between avatars |
| Presence row h-padding | 24px | Left/right scroll inset |
| Section gap (between cards) | 8px (mockup) / 12px (existing) | Keep existing 12 |
| Momentum banner margin-bottom | 16px | Before feed |
| Avatar sizes: Presence | 56px ring, inner varies | |
| Avatar sizes: Post | 36-42px | Keep existing 36 |
| Avatar sizes: Celebration | 48px | With gold border |
| Avatar sizes: Comment | 28px | Small |
| Avatar sizes: Engagement face | 20px | Tiny, overlapping |
| Avatar sizes: Suggestion | 44px | Medium |
