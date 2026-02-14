# Text Post Card (with Check-in) — Pixel-Perfect Build Spec

**Target**: React Native + TypeScript
**Component Name**: `TextPostCard`
**Purpose**: A social feed post card showing a user's text update with an optional check-in banner, social proof engagement row, action buttons, and a comment preview section. This is the primary "regular post" card type in the feed.

---

## MOCK DATA (Use this to render)

```typescript
const MOCK_DATA = {
  user: {
    name: 'Marcus Webb',
    emoji: '💪',
    streakCount: 31,
    hasStreak: true,            // shows gold ring around avatar + streak badge
  },
  goalTag: {
    label: 'Fitness',
    backgroundColor: 'rgba(0, 255, 136, 0.12)',
    textColor: '#00FF88',
  },
  timeAgo: '45m ago',
  circleName: 'Mindful AM',     // shown after time: "45m ago · Mindful AM"
  checkin: {                     // optional — omit to hide check-in banner
    emoji: '🏋️',
    label: 'Completed',
    action: 'Morning Gym Session',
  },
  content: {
    // The post text. Bold segments are wrapped in <Text> with bold style.
    // "Hit a new PR on deadlifts today — **315 lbs**. Consistency is undefeated. That's 31 days straight of showing up."
    text: 'Hit a new PR on deadlifts today — ',
    boldText: '315 lbs',
    textAfter: '. Consistency is undefeated. That\'s 31 days straight of showing up.',
  },
  engagement: {
    faces: ['👩‍🎨', '🧔', '🧘‍♀️'],   // up to 3 avatar emojis, stacked overlapping
    text: {
      // "**Sarah**, **you** and 8 others"
      names: ['Sarah', 'you'],
      othersCount: 8,
    },
  },
  reactions: {
    count: 10,
    isReacted: true,             // fire emoji reaction is active
    reactionEmoji: '🔥',
  },
  comments: {
    count: 3,
    preview: {                   // the single visible comment
      userEmoji: '🧘‍♀️',
      userName: 'Priya',
      text: '315?! That\'s insane progress. The streak is paying off 💪',
    },
    currentUserEmoji: '🧔',     // for the comment input avatar
  },
};
```

---

## COLOR REFERENCE (Use these exact values)

```typescript
const COLORS = {
  gold:          '#D4AF37',
  goldLight:     '#E7C455',
  goldGlow20:    'rgba(212, 175, 55, 0.2)',
  blackPure:     '#000000',
  blackSoft:     '#0A0A0A',
  blackCard:     '#111111',
  blackElevated: '#1A1A1A',
  white:         '#FFFFFF',
  white80:       'rgba(255, 255, 255, 0.8)',
  white60:       'rgba(255, 255, 255, 0.6)',
  white40:       'rgba(255, 255, 255, 0.4)',
  white20:       'rgba(255, 255, 255, 0.2)',
  white10:       'rgba(255, 255, 255, 0.1)',
  white06:       'rgba(255, 255, 255, 0.06)',
  white03:       'rgba(255, 255, 255, 0.03)',
  green:         '#00FF88',
  greenDim:      'rgba(0, 255, 136, 0.15)',
  greenBorder:   'rgba(0, 255, 136, 0.1)',
  greenIconBg:   'rgba(0, 255, 136, 0.15)',
  redFire:       '#FF6B35',
  redFireDark:   '#FF4500',
};
```

---

## FULL COMPONENT TREE (Top to bottom, exactly as nested)

```
TextPostCard (outer container)
├── Header (row)
│   ├── AvatarWrapper (relative container)
│   │   ├── Avatar (42x42 circle with emoji)
│   │   └── StreakBadge (absolute, bottom-right pill: "🔥 31") — only if hasStreak
│   ├── PostMeta (column)
│   │   ├── UserRow (row)
│   │   │   ├── Username (text: "Marcus Webb")
│   │   │   └── GoalTag (pill: "Fitness")
│   │   └── TimeRow (text: "45m ago · Mindful AM")
│   └── MoreButton (text: "···")
├── CheckinCard (row — green banner) — optional, only if checkin exists
│   ├── CheckinGlow (absolute overlay, subtle gradient sheen)
│   ├── CheckinIcon (36x36 rounded square with emoji)
│   ├── CheckinInfo (column)
│   │   ├── CheckinLabel (text: "COMPLETED")
│   │   └── CheckinAction (text: "Morning Gym Session")
│   └── CheckMark (text: "✓")
├── PostContent (rich text with bold segments)
├── EngagementRow (row)
│   ├── EngagementFaces (overlapping emoji circles)
│   │   ├── Face 1 (👩‍🎨)
│   │   ├── Face 2 (🧔)
│   │   └── Face 3 (🧘‍♀️)
│   └── EngagementText ("**Sarah**, **you** and 8 others")
├── ActionBar (row, top border)
│   ├── ReactButton (emoji reaction: "🔥 10")
│   ├── CommentButton (outline bubble icon: "3")
│   ├── Spacer
│   └── ShareButton (upload icon, no count)
└── CommentPreview (section, top border)
    ├── CommentItem (row)
    │   ├── CommentAvatar (28x28 circle: 🧘‍♀️)
    │   └── CommentBubble (rounded rect)
    │       ├── CommentUser (text: "Priya")
    │       └── CommentText (text: "315?! That's insane progress...")
    ├── ViewAllComments (text: "View all 3 comments")
    └── CommentInputRow (row)
        ├── InputAvatar (24x24 circle: 🧔)
        └── InputField (pill-shaped placeholder: "Add a comment...")
```

---

## LAYER 1: OUTER CONTAINER

The card itself.

```
┌─────────────────────────────────────────┐
│              TextPostCard               │
│                                         │
│  (all content inside with 20px padding) │
│                                         │
└─────────────────────────────────────────┘
```

### Styles:

| Property          | Value                          |
|-------------------|--------------------------------|
| marginHorizontal  | `20`                           |
| marginBottom      | `2`                            |
| padding           | `20` (all sides)               |
| backgroundColor   | `#0A0A0A`                      |
| borderRadius      | `24`                           |
| borderWidth       | `1`                            |
| borderColor       | `rgba(255, 255, 255, 0.06)`    |
| position          | `'relative'`                   |

**No overflow: hidden** on this card (unlike the progress card). The card does not clip content.

---

## LAYER 2: HEADER ROW

The top row with avatar, user info, and more button.

```
┌───────────────────────────────────────────────────┐
│ [Avatar💪]  Marcus Webb  [Fitness]         [···]  │
│   🔥31     45m ago · Mindful AM                   │
└───────────────────────────────────────────────────┘
```

### Header Container:

| Property          | Value                          |
|-------------------|--------------------------------|
| flexDirection     | `'row'`                        |
| alignItems        | `'center'`                     |
| gap               | `12`                           |
| marginBottom      | `14`                           |

---

### 2A: Avatar Wrapper

A relative container holding the avatar circle and the streak badge.

| Property          | Value                          |
|-------------------|--------------------------------|
| position          | `'relative'`                   |
| flexShrink        | `0`                            |

#### Avatar Circle:

| Property          | Value                          |
|-------------------|--------------------------------|
| width             | `42`                           |
| height            | `42`                           |
| borderRadius      | `21` (half of width = circle)  |
| backgroundColor   | `#1A1A1A`                      |
| alignItems        | `'center'`                     |
| justifyContent    | `'center'`                     |

The emoji text inside:

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `20`                           |

Content: `"💪"`

#### Avatar Streak Ring (only if `hasStreak === true`):

When the user has an active streak, add these styles ON TOP of the avatar:

| Property          | Value                          |
|-------------------|--------------------------------|
| borderWidth       | `2`                            |
| borderColor       | `#D4AF37`                      |

**Shadow/Glow**: On iOS, use shadow properties. On Android, this glow won't render (that's OK):

| Property          | Value                          |
|-------------------|--------------------------------|
| shadowColor       | `'rgba(212, 175, 55, 0.2)'`   |
| shadowOffset      | `{ width: 0, height: 0 }`     |
| shadowOpacity     | `1`                            |
| shadowRadius      | `12`                           |

#### Streak Badge (positioned absolutely over avatar, bottom-right):

Only render if `hasStreak === true` and `streakCount > 0`.

| Property          | Value                          |
|-------------------|--------------------------------|
| position          | `'absolute'`                   |
| bottom            | `-4`                           |
| right             | `-4`                           |
| flexDirection     | `'row'`                        |
| alignItems        | `'center'`                     |
| gap               | `1`                            |
| paddingVertical   | `2`                            |
| paddingHorizontal | `5`                            |
| borderRadius      | `8`                            |
| borderWidth       | `2`                            |
| borderColor       | `#0A0A0A` (matches card bg)    |
| overflow          | `'hidden'`                     |

**Background**: Use `<LinearGradient>`:
- `colors={['#FF6B35', '#FF4500']}`
- `start={{ x: 0, y: 0 }}`
- `end={{ x: 1, y: 1 }}`

Text inside the badge:

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `9`                            |
| fontWeight        | `'800'`                        |
| color             | `#FFFFFF`                       |

Content: `"🔥 31"`

**IMPORTANT**: Unlike the Living Progress Card where the streak badge is inline next to the username, on THIS card the badge is positioned **absolutely on the avatar** (bottom-right corner). This is the standard positioning for post cards.

---

### 2B: Post Meta (column, to the right of avatar)

| Property          | Value                          |
|-------------------|--------------------------------|
| flex              | `1`                            |
| minWidth          | `0` (prevents text overflow)   |

#### User Row (name + goal tag):

| Property          | Value                          |
|-------------------|--------------------------------|
| flexDirection     | `'row'`                        |
| alignItems        | `'center'`                     |
| gap               | `6`                            |

##### Username:

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `14`                           |
| fontWeight        | `'700'`                        |
| color             | `#FFFFFF`                       |

Content: `"Marcus Webb"`

##### Goal Tag:

A small colored pill showing the goal category.

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `10`                           |
| fontWeight        | `'600'`                        |
| paddingVertical   | `2`                            |
| paddingHorizontal | `8`                            |
| borderRadius      | `6`                            |
| letterSpacing     | `0.3`                          |
| backgroundColor   | `rgba(0, 255, 136, 0.12)` (from goalTag data) |
| color             | `#00FF88` (from goalTag data)  |

Content: `"Fitness"`

**NOTE**: The goal tag colors come from data. Different goals use different colors. For this mock, it's green. The component should accept `backgroundColor` and `textColor` props for the tag.

#### Time Row:

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `12`                           |
| color             | `rgba(255, 255, 255, 0.4)`     |
| marginTop         | `1`                            |

Content: `"45m ago · Mindful AM"`

The `·` (middle dot U+00B7) separates time and circle name. Format: `"{timeAgo} · {circleName}"`

---

### 2C: More Button (rightmost element in header)

Identical to the Living Progress Card spec.

| Property          | Value                          |
|-------------------|--------------------------------|
| width             | `32`                           |
| height            | `32`                           |
| borderRadius      | `16`                           |
| alignItems        | `'center'`                     |
| justifyContent    | `'center'`                     |

Text inside:

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `16`                           |
| color             | `rgba(255, 255, 255, 0.4)`     |
| fontWeight        | `'700'`                        |

Content: `"···"`

---

## LAYER 3: CHECK-IN CARD (Optional — only render if `checkin` data exists)

A green-tinted banner showing what action was completed.

```
┌──────────────────────────────────────────────────┐
│  [🏋️]  COMPLETED                            ✓   │
│         Morning Gym Session                      │
└──────────────────────────────────────────────────┘
```

### Check-in Container:

| Property          | Value                          |
|-------------------|--------------------------------|
| flexDirection     | `'row'`                        |
| alignItems        | `'center'`                     |
| gap               | `12`                           |
| marginBottom      | `14`                           |
| paddingVertical   | `14`                           |
| paddingHorizontal | `16`                           |
| borderRadius      | `16`                           |
| backgroundColor   | `rgba(0, 255, 136, 0.15)`      |
| borderWidth       | `1`                            |
| borderColor       | `rgba(0, 255, 136, 0.1)`       |
| position          | `'relative'`                   |
| overflow          | `'hidden'`                     |

### 3A: Check-in Glow Overlay (subtle diagonal gradient sheen)

An absolute-positioned overlay that adds a subtle diagonal glow.

| Property          | Value                          |
|-------------------|--------------------------------|
| position          | `'absolute'`                   |
| top               | `0`                            |
| left              | `0`                            |
| right             | `0`                            |
| bottom            | `0`                            |
| opacity           | `0.06`                         |

**Background**: Use `<LinearGradient>`:
- `colors={['#00FF88', 'transparent']}`
- `start={{ x: 0, y: 0 }}`
- `end={{ x: 0.6, y: 1 }}`
- (135 degree gradient: green at top-left fading to transparent at ~60%)

### 3B: Check-in Icon

| Property          | Value                          |
|-------------------|--------------------------------|
| width             | `36`                           |
| height            | `36`                           |
| borderRadius      | `10`                           |
| backgroundColor   | `rgba(0, 255, 136, 0.15)`      |
| alignItems        | `'center'`                     |
| justifyContent    | `'center'`                     |
| flexShrink        | `0`                            |

Emoji text inside:

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `16`                           |

Content: `"🏋️"`

### 3C: Check-in Info (column)

| Property          | Value                          |
|-------------------|--------------------------------|
| flex              | `1`                            |

#### Check-in Label:

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `11`                           |
| fontWeight        | `'600'`                        |
| textTransform     | `'uppercase'`                  |
| letterSpacing     | `1`                            |
| color             | `#00FF88`                       |
| opacity           | `0.6`                          |
| marginBottom      | `2`                            |

Content: `"Completed"`

**NOTE**: The `opacity: 0.6` is applied to the label text only, making it a softer green. The effective visible color is approximately `rgba(0, 255, 136, 0.6)`.

#### Check-in Action:

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `14`                           |
| fontWeight        | `'600'`                        |
| color             | `#FFFFFF`                       |

Content: `"Morning Gym Session"`

### 3D: Check Mark (rightmost)

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `18`                           |
| color             | `#00FF88`                       |

Content: `"✓"` (checkmark character, NOT the emoji ✅. This is the plain text Unicode checkmark U+2713)

---

## LAYER 4: POST CONTENT

The main text body of the post.

### Post Content Container:

| Property          | Value                          |
|-------------------|--------------------------------|
| marginBottom      | `14`                           |

### Text Styles:

**Regular text:**

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `15`                           |
| lineHeight        | `23.25` (15 * 1.55)            |
| color             | `rgba(255, 255, 255, 0.8)`     |
| letterSpacing     | `0.1`                          |

**Bold text** (e.g., "315 lbs"):

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `15`                           |
| fontWeight        | `'600'`                        |
| color             | `#FFFFFF`                       |

Implementation: Use nested `<Text>` components:
```tsx
<Text style={styles.postContent}>
  Hit a new PR on deadlifts today —{' '}
  <Text style={styles.postContentBold}>315 lbs</Text>
  . Consistency is undefeated. That's 31 days straight of showing up.
</Text>
```

Content: `"Hit a new PR on deadlifts today — **315 lbs**. Consistency is undefeated. That's 31 days straight of showing up."`

---

## LAYER 5: ENGAGEMENT ROW

Shows who reacted — stacked avatar faces + text.

```
┌──────────────────────────────────────────────────┐
│ (👩‍🎨)(🧔)(🧘‍♀️)  **Sarah**, **you** and 8 others    │
└──────────────────────────────────────────────────┘
```

### Engagement Container:

| Property          | Value                          |
|-------------------|--------------------------------|
| flexDirection     | `'row'`                        |
| alignItems        | `'center'`                     |
| gap               | `4`                            |
| marginBottom      | `12`                           |

### 5A: Engagement Faces (overlapping circles)

A row of small emoji circles that overlap each other (stacked left to right).

| Property          | Value                          |
|-------------------|--------------------------------|
| flexDirection     | `'row'`                        |
| marginRight       | `6`                            |

#### Individual Face:

| Property          | Value                          |
|-------------------|--------------------------------|
| width             | `20`                           |
| height            | `20`                           |
| borderRadius      | `10`                           |
| backgroundColor   | `#1A1A1A`                      |
| borderWidth       | `2`                            |
| borderColor       | `#0A0A0A` (matches card bg)    |
| alignItems        | `'center'`                     |
| justifyContent    | `'center'`                     |

Emoji text inside:

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `9`                            |

**CRITICAL — Overlap logic**:
- First face: `marginLeft: 0`
- Second face and beyond: `marginLeft: -6` (creates the overlapping stack effect)

This means face 2 overlaps face 1 by 6px, face 3 overlaps face 2 by 6px, etc.

Mock faces: `['👩‍🎨', '🧔', '🧘‍♀️']`

### 5B: Engagement Text

A text line with bold names and regular "and X others".

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `12`                           |
| color             | `rgba(255, 255, 255, 0.4)`     |

**Bold names** within the text:

| Property          | Value                          |
|-------------------|--------------------------------|
| fontWeight        | `'600'`                        |
| color             | `rgba(255, 255, 255, 0.6)`     |

Implementation with nested `<Text>`:
```tsx
<Text style={styles.engagementText}>
  <Text style={styles.engagementBold}>Sarah</Text>
  {', '}
  <Text style={styles.engagementBold}>you</Text>
  {' and 8 others'}
</Text>
```

Content: `"**Sarah**, **you** and 8 others"`

---

## LAYER 6: ACTION BAR

A row of action buttons separated from the content above by a thin top border.

```
┌──────────────────────────────────────────────────┐
│  ─ ─ ─ ─ ─ ─ ─ border top ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  [😊🔥 10]   [💬 3]                       [↑]   │
└──────────────────────────────────────────────────┘
```

### Action Bar Container:

| Property          | Value                          |
|-------------------|--------------------------------|
| flexDirection     | `'row'`                        |
| alignItems        | `'center'`                     |
| paddingTop        | `12`                           |
| borderTopWidth    | `1`                            |
| borderTopColor    | `rgba(255, 255, 255, 0.06)`    |
| gap               | `4`                            |

---

### 6A: React Button (leftmost — active state)

The reaction button. When active, shows the fire emoji and count in the active color.

| Property          | Value                          |
|-------------------|--------------------------------|
| flexDirection     | `'row'`                        |
| alignItems        | `'center'`                     |
| gap               | `6`                            |
| paddingVertical   | `8`                            |
| paddingHorizontal | `14`                           |
| borderRadius      | `12`                           |
| backgroundColor   | `'transparent'`                |

#### React Icon:

This button uses a **smiley face** SVG icon (NOT a heart — this is different from the Living Progress Card).

**SVG — Smiley face icon** (two paths):

Path 1 — Circle:
```
M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z
```
- `fill="rgba(255, 107, 53, 0.15)"` (subtle red-orange fill when active)
- `stroke="#FF6B35"`
- `strokeWidth={2}`

Path 2 — Eyes and smile:
```
M15.5 11c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z
```
- `fill="#FF6B35"` (when active)

| Property          | Value                          |
|-------------------|--------------------------------|
| width             | `18`                           |
| height            | `18`                           |

**If NOT reacted**: Both paths use `stroke="rgba(255, 255, 255, 0.6)"`, `fill="none"` for path 1, `fill="rgba(255, 255, 255, 0.6)"` for path 2.

#### React Text:

| Property          | Value (active)                 |
|-------------------|--------------------------------|
| fontSize          | `13`                           |
| fontWeight        | `'600'`                        |
| color             | `#FF6B35`                       |

Content: `"🔥 10"` (fire emoji + space + count)

**If NOT reacted**: `color: rgba(255, 255, 255, 0.6)`, no emoji prefix, just the count.

---

### 6B: Comment Button

| Property          | Value                          |
|-------------------|--------------------------------|
| flexDirection     | `'row'`                        |
| alignItems        | `'center'`                     |
| gap               | `6`                            |
| paddingVertical   | `8`                            |
| paddingHorizontal | `14`                           |
| borderRadius      | `12`                           |
| backgroundColor   | `'transparent'`                |

#### Comment Icon:

**SVG Path** (outline speech bubble):
```
M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z
```

| Property          | Value                          |
|-------------------|--------------------------------|
| width             | `18`                           |
| height            | `18`                           |
| fill              | `'none'`                       |
| stroke            | `rgba(255, 255, 255, 0.6)`     |
| strokeWidth       | `2`                            |

#### Comment Count Text:

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `13`                           |
| fontWeight        | `'600'`                        |
| color             | `rgba(255, 255, 255, 0.6)`     |

Content: `"3"`

---

### 6C: Spacer

| Property          | Value                          |
|-------------------|--------------------------------|
| flex              | `1`                            |

---

### 6D: Share Button (rightmost, no count)

| Property          | Value                          |
|-------------------|--------------------------------|
| flexDirection     | `'row'`                        |
| alignItems        | `'center'`                     |
| paddingVertical   | `8`                            |
| paddingHorizontal | `14`                           |
| borderRadius      | `12`                           |
| backgroundColor   | `'transparent'`                |

#### Share Icon:

**SVG — Upload/share icon** (three elements):

Path (box):
```
M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8
```

Polyline (arrow head):
```
points="16 6 12 2 8 6"
```

Line (arrow shaft):
```
x1="12" y1="2" x2="12" y2="15"
```

All elements:

| Property          | Value                          |
|-------------------|--------------------------------|
| width             | `18`                           |
| height            | `18`                           |
| fill              | `'none'`                       |
| stroke            | `rgba(255, 255, 255, 0.6)`     |
| strokeWidth       | `2`                            |

**No count text** — the share button has only the icon, no number.

---

## LAYER 7: COMMENT PREVIEW

A section below the action bar showing one comment, a "view all" link, and an inline comment input.

```
┌──────────────────────────────────────────────────┐
│  ─ ─ ─ ─ ─ ─ ─ border top ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                                  │
│  [🧘‍♀️]  ┌─Priya──────────────────────────────┐  │
│         │ 315?! That's insane progress. The  │  │
│         │ streak is paying off 💪             │  │
│         └────────────────────────────────────┘  │
│                                                  │
│  View all 3 comments                             │
│                                                  │
│  [🧔] [ Add a comment...                      ] │
└──────────────────────────────────────────────────┘
```

### Comment Preview Container:

| Property          | Value                          |
|-------------------|--------------------------------|
| marginTop         | `12`                           |
| paddingTop        | `12`                           |
| borderTopWidth    | `1`                            |
| borderTopColor    | `rgba(255, 255, 255, 0.06)`    |

---

### 7A: Comment Item (the single visible comment)

| Property          | Value                          |
|-------------------|--------------------------------|
| flexDirection     | `'row'`                        |
| gap               | `10`                           |
| alignItems        | `'flex-start'`                 |

#### Comment Avatar:

| Property          | Value                          |
|-------------------|--------------------------------|
| width             | `28`                           |
| height            | `28`                           |
| borderRadius      | `14`                           |
| backgroundColor   | `#1A1A1A`                      |
| alignItems        | `'center'`                     |
| justifyContent    | `'center'`                     |
| flexShrink        | `0`                            |

Emoji text inside:

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `12`                           |

Content: `"🧘‍♀️"`

#### Comment Bubble:

A rounded rectangle with a flattened top-left corner (chat bubble shape).

| Property          | Value                          |
|-------------------|--------------------------------|
| flex              | `1`                            |
| backgroundColor   | `rgba(255, 255, 255, 0.03)`    |
| paddingVertical   | `8`                            |
| paddingHorizontal | `12`                           |
| borderRadius      | `14`                           |
| borderTopLeftRadius | `4` ← **IMPORTANT**: overrides the 14px on top-left only |

**CRITICAL**: The `borderTopLeftRadius: 4` creates the chat bubble "tail" effect — the corner closest to the avatar is flattened while all other corners remain rounded at 14px. In React Native, set all four corners explicitly:
```typescript
borderTopLeftRadius: 4,
borderTopRightRadius: 14,
borderBottomLeftRadius: 14,
borderBottomRightRadius: 14,
```

##### Comment Username:

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `12`                           |
| fontWeight        | `'700'`                        |
| color             | `rgba(255, 255, 255, 0.8)`     |

Content: `"Priya"`

##### Comment Text:

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `13`                           |
| color             | `rgba(255, 255, 255, 0.6)`     |
| lineHeight        | `18.2` (13 * 1.4)              |
| marginTop         | `1`                            |

Content: `"315?! That's insane progress. The streak is paying off 💪"`

---

### 7B: View All Comments Link

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `12`                           |
| color             | `rgba(255, 255, 255, 0.4)`     |
| fontWeight        | `'600'`                        |
| marginTop         | `8`                            |

Content: `"View all 3 comments"` (where 3 is from `comments.count`)

---

### 7C: Comment Input Row

A row with the current user's tiny avatar and a pill-shaped input placeholder.

| Property          | Value                          |
|-------------------|--------------------------------|
| flexDirection     | `'row'`                        |
| alignItems        | `'center'`                     |
| gap               | `8`                            |
| marginTop         | `10`                           |

#### Input Avatar:

| Property          | Value                          |
|-------------------|--------------------------------|
| width             | `24`                           |
| height            | `24`                           |
| borderRadius      | `12`                           |
| backgroundColor   | `#1A1A1A`                      |
| alignItems        | `'center'`                     |
| justifyContent    | `'center'`                     |
| flexShrink        | `0`                            |

Emoji text inside:

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `10`                           |

Content: `"🧔"` (current user's emoji)

#### Input Field (pill-shaped placeholder):

This is **NOT** an actual TextInput in the mock — it's a static View styled to look like one.

| Property          | Value                          |
|-------------------|--------------------------------|
| flex              | `1`                            |
| backgroundColor   | `rgba(255, 255, 255, 0.03)`    |
| borderWidth       | `1`                            |
| borderColor       | `rgba(255, 255, 255, 0.06)`    |
| borderRadius      | `999` (full pill shape)        |
| paddingVertical   | `7`                            |
| paddingHorizontal | `14`                           |

Placeholder text inside:

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `12`                           |
| color             | `rgba(255, 255, 255, 0.4)`     |

Content: `"Add a comment..."`

---

## VISUAL STATES

### State 1: Post with Check-in + Active Reaction (shown in mock)
- Check-in banner: VISIBLE (green)
- React button: ACTIVE (fire emoji, `#FF6B35` color, smiley icon filled)
- All other elements as described

### State 2: Post without Check-in
- Check-in banner: HIDDEN (remove entirely, not collapsed)
- Everything else the same — post content follows directly after the header

### State 3: No Reactions (inactive)
- React button: INACTIVE (smiley icon outline only, `rgba(255,255,255,0.6)` color, count only no emoji prefix)
- Engagement row: Could still show faces if others reacted

### State 4: No Comments
- Comment preview section: HIDDEN entirely
- Action bar is the last element

### State 5: No Streak
- Avatar: No gold border, no glow shadow
- Streak badge: HIDDEN
- Avatar is just the plain circle with emoji

---

## DEPENDENCIES

```
react-native-svg          — for SVG icons (smiley, comment bubble, share)
expo-linear-gradient       — for StreakBadge gradient and CheckinGlow overlay
```

---

## FULL DIMENSIONAL DIAGRAM

```
←────────────── screen width ──────────────→
     ←──── card (screen - 40px margins) ──→

┌───────────────────────────────────────────┐
│                                           │
│  20px padding all around                  │
│  ┌─────────────────────────────────────┐  │
│  │ HEADER (gap: 12)                    │  │
│  │                                     │  │
│  │ ┌──────┐  ┌──────────────┐  ┌───┐  │  │
│  │ │42x42 │  │Marcus Webb   │  │···│  │  │
│  │ │  💪  │  │ [Fitness]    │  │32 │  │  │
│  │ │🔥31  │  │45m · MindAM  │  │x32│  │  │
│  │ └──────┘  └──────────────┘  └───┘  │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  14px marginBottom from header            │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │ CHECK-IN CARD (green)               │  │
│  │                                     │  │
│  │  [🏋️]  COMPLETED              ✓    │  │
│  │  36x36  Morning Gym Session         │  │
│  │                                     │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  14px marginBottom from checkin           │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │ POST CONTENT                        │  │
│  │                                     │  │
│  │ Hit a new PR on deadlifts today     │  │
│  │ — **315 lbs**. Consistency is       │  │
│  │ undefeated. That's 31 days          │  │
│  │ straight of showing up.             │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  14px marginBottom from content           │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │ ENGAGEMENT ROW                      │  │
│  │                                     │  │
│  │ (👩‍🎨)(🧔)(🧘‍♀️)  Sarah, you and 8    │  │
│  │  20px each     others               │  │
│  │  -6px overlap                       │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  12px marginBottom from engagement        │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │ ── border (1px, white06) ────────── │  │
│  │ 12px paddingTop                     │  │
│  │ ACTION BAR (gap: 4)                 │  │
│  │                                     │  │
│  │ [😊🔥10] [💬 3]           [↑share] │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │ ── border (1px, white06) ────────── │  │
│  │ 12px paddingTop + marginTop         │  │
│  │ COMMENT PREVIEW                     │  │
│  │                                     │  │
│  │ [🧘‍♀️] ┌Priya─────────────────────┐ │  │
│  │  28px │315?! That's insane...    │ │  │
│  │       └──────────────────────────┘ │  │
│  │                                     │  │
│  │ View all 3 comments     (8px mt)    │  │
│  │                                     │  │
│  │ [🧔] [Add a comment...]  (10px mt) │  │
│  │ 24px   pill input                   │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  20px padding bottom                      │
└───────────────────────────────────────────┘
 2px margin bottom
```

---

## FONT

Use the system default font (React Native default). No custom font import needed.

All text uses the `fontWeight` values specified per element.

---

## KEY DIFFERENCES FROM LIVING PROGRESS CARD

| Feature              | Living Progress Card       | Text Post Card (this)        |
|----------------------|---------------------------|------------------------------|
| Avatar size          | 48x48 (inside SVG ring)   | 42x42 (plain circle)        |
| Streak badge         | Inline next to username    | Absolute on avatar corner    |
| Avatar ring          | SVG progress ring          | Simple 2px gold border       |
| Content section      | Action tiles (3 boxes)     | Free-form rich text          |
| Check-in banner      | None                       | Green check-in card          |
| Engagement row       | None                       | Stacked faces + text         |
| Like/React icon      | Filled heart               | Smiley face                  |
| Share button         | None                       | Upload/share icon            |
| Comment preview      | None                       | Full comment section         |
| Perfect Day state    | Yes (gold decorations)     | No equivalent                |

---

## WHAT NOT TO DO

- Do NOT add any onPress handlers or navigation logic
- Do NOT fetch data from any API
- Do NOT add animations
- Do NOT add shadows to the card container
- Do NOT add any extra spacing, dividers, or elements not listed here
- Do NOT make the comment input functional — it's a static placeholder view
- Do NOT use actual TextInput for the comment field — use a View + Text
- Do NOT round any of the values listed — use them exactly as specified
- Do NOT forget the `borderTopLeftRadius: 4` on the comment bubble — this is a key design detail
- Do NOT forget the `-6px marginLeft` overlap on engagement faces — without it they look like a plain row
