# Living Progress Card — Pixel-Perfect Build Spec

**Target**: React Native + TypeScript
**Component Name**: `LivingProgressCard`
**Purpose**: Shows a user's daily progress with completed action tiles. Has a special "Perfect Day" variant when all actions are completed.

---

## MOCK DATA (Use this to render)

```typescript
const MOCK_DATA = {
  user: {
    name: 'Sarah Chen',
    emoji: '👩‍🎨',
    streakCount: 14,
  },
  isPerfectDay: true,          // all actions completed
  completedCount: 3,
  totalCount: 3,
  timeAgo: '2h ago',
  actions: [
    { emoji: '🧘', name: 'Morning Meditation', completed: true },
    { emoji: '✏️', name: 'Journal Entry', completed: true },
    { emoji: '🏃‍♀️', name: '5K Run', completed: true },
  ],
  likes: 12,
  comments: 4,
  isLiked: true,               // heart is active/filled
};
```

---

## COLOR REFERENCE (Use these exact values)

```typescript
const COLORS = {
  gold:        '#D4AF37',
  goldLight:   '#E7C455',
  goldDim:     'rgba(212, 175, 55, 0.15)',
  goldGlow08:  'rgba(212, 175, 55, 0.08)',
  goldGlow20:  'rgba(212, 175, 55, 0.2)',
  blackPure:   '#000000',
  blackSoft:   '#0A0A0A',
  blackCard:   '#111111',
  blackElevated: '#1A1A1A',
  white:       '#FFFFFF',
  white80:     'rgba(255, 255, 255, 0.8)',
  white60:     'rgba(255, 255, 255, 0.6)',
  white40:     'rgba(255, 255, 255, 0.4)',
  white20:     'rgba(255, 255, 255, 0.2)',
  white10:     'rgba(255, 255, 255, 0.1)',
  white06:     'rgba(255, 255, 255, 0.06)',
  white03:     'rgba(255, 255, 255, 0.03)',
  green:       '#00FF88',
  redFire:     '#FF6B35',
  redFireDark: '#FF4500',
};
```

---

## FULL COMPONENT TREE (Top to bottom, exactly as nested)

```
LivingProgressCard (outer container)
├── GoldTopLine (only if isPerfectDay — 2px gold gradient line at very top)
├── GoldGlow (only if isPerfectDay — subtle elliptical glow below top edge)
├── Header (row)
│   ├── ProgressRing (circular SVG ring with avatar inside)
│   │   ├── RingBackground (full circle, dim track)
│   │   ├── RingFill (partial/full circle, gold, animated)
│   │   └── AvatarInner (emoji centered inside ring)
│   ├── UserInfo (column)
│   │   ├── UserRow (row)
│   │   │   ├── Username (text: "Sarah Chen")
│   │   │   └── StreakBadge (pill: "🔥 14")
│   │   └── SubtitleRow (row)
│   │       ├── PerfectBadge (text: "✦ Perfect Day") — only if isPerfectDay
│   │       ├── Dot separator (text: "·")
│   │       └── TimeAgo (text: "2h ago")
│   └── MoreButton (text: "···")
├── ActionTiles (row of 3 equal-width tiles)
│   └── ActionTile (repeated for each action)
│       ├── CheckMark (emoji: "✅", top-right corner) — only if completed
│       ├── ActionEmoji (emoji: "🧘")
│       └── ActionName (text: "Morning Meditation")
│       └── CompletedBar (green 2px line at bottom) — only if completed
└── Footer (row, separated by top border)
    ├── CompletionStat (text: "3/3 completed")
    ├── Spacer
    ├── HeartButton (filled heart icon + "12")
    └── CommentButton (outline chat bubble icon + "4")
```

---

## LAYER 1: OUTER CONTAINER

The card itself. Everything lives inside this.

```
┌─────────────────────────────────────────┐
│            LivingProgressCard           │
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
| borderColor       | `rgba(255, 255, 255, 0.06)` — **normal state** |
| borderColor       | `rgba(212, 175, 55, 0.2)` — **if isPerfectDay** |
| overflow          | `'hidden'`                     |
| position          | `'relative'`                   |

---

## LAYER 2: PERFECT DAY DECORATIONS (Only render if `isPerfectDay === true`)

Two decorative elements that sit behind the content using `position: 'absolute'`.

### 2A: Gold Top Line

A thin gold gradient line across the very top edge of the card.

| Property          | Value                          |
|-------------------|--------------------------------|
| position          | `'absolute'`                   |
| top               | `0`                            |
| left              | `0`                            |
| right             | `0`                            |
| height            | `2`                            |
| zIndex            | `0`                            |

**Background**: Use `expo-linear-gradient` `<LinearGradient>`:
- `colors={['#D4AF37', '#E7C455', '#D4AF37']}`
- `start={{ x: 0, y: 0 }}`
- `end={{ x: 1, y: 0 }}`
- (This is a horizontal left-to-right gradient: gold → light gold → gold)

### 2B: Gold Glow

A subtle radial-ish glow that emanates downward from the top center. Since React Native doesn't support `radial-gradient`, approximate it:

| Property          | Value                          |
|-------------------|--------------------------------|
| position          | `'absolute'`                   |
| top               | `0`                            |
| left              | `'20%'`                        |
| right             | `'20%'`                        |
| height            | `60`                           |
| zIndex            | `0`                            |

**Approximation approach**: Use a `<LinearGradient>` as a close approximation:
- `colors={['rgba(212, 175, 55, 0.08)', 'transparent']}`
- `start={{ x: 0.5, y: 0 }}`
- `end={{ x: 0.5, y: 1 }}`
- (Fades from subtle gold glow at top to transparent at bottom)

---

## LAYER 3: HEADER ROW

The top section with avatar ring, user info, and more button.

```
┌──────────────────────────────────────────────┐
│ [ProgressRing]  UserInfo              [···]  │
│  (48x48)        Sarah Chen 🔥14              │
│                 ✦ Perfect Day · 2h ago       │
└──────────────────────────────────────────────┘
```

### Header Container:

| Property          | Value                          |
|-------------------|--------------------------------|
| flexDirection     | `'row'`                        |
| alignItems        | `'center'`                     |
| gap               | `12`                           |
| marginBottom      | `16`                           |
| zIndex            | `1` (sits above the glow)      |

---

### 3A: Progress Ring (48x48 circular ring with avatar emoji inside)

This is a circular progress indicator built with `react-native-svg`.

#### Ring Wrapper:

| Property          | Value                          |
|-------------------|--------------------------------|
| width             | `48`                           |
| height            | `48`                           |
| position          | `'relative'`                   |
| flexShrink        | `0`                            |

#### Ring Background (the dim track circle):

SVG circle that forms the background track.

```tsx
<Svg width={48} height={48} viewBox="0 0 48 48" style={StyleSheet.absoluteFill}>
  <Circle
    cx={24}
    cy={24}
    r={21}
    fill="none"
    stroke="rgba(255, 255, 255, 0.06)"
    strokeWidth={3}
  />
</Svg>
```

#### Ring Fill (the gold progress arc):

SVG circle that shows completion progress. Uses `strokeDasharray` and `strokeDashoffset`.

**Math**:
- Circumference = `2 * π * 21` = `~131.95` → use `132`
- `strokeDasharray={132}`
- `strokeDashoffset = 132 - (132 * completedCount / totalCount)`
- For 3/3 (100%): `strokeDashoffset = 0` (full ring)
- For 2/3 (67%): `strokeDashoffset = 43.6`
- For 1/3 (33%): `strokeDashoffset = 88.4`
- For 0/3 (0%): `strokeDashoffset = 132` (empty ring)

```tsx
<Svg
  width={48}
  height={48}
  viewBox="0 0 48 48"
  style={[StyleSheet.absoluteFill, { transform: [{ rotate: '-90deg' }] }]}
>
  <Circle
    cx={24}
    cy={24}
    r={21}
    fill="none"
    stroke="#D4AF37"
    strokeWidth={3}
    strokeLinecap="round"
    strokeDasharray={132}
    strokeDashoffset={0}  // 0 = fully filled
  />
</Svg>
```

**IMPORTANT**: The ring starts from the top (12 o'clock position). The `rotate: '-90deg'` transform on the SVG container achieves this. Without it, the arc starts from the right (3 o'clock).

#### Avatar Inner (emoji centered inside the ring):

Sits on top of both SVG layers, centered.

| Property          | Value                          |
|-------------------|--------------------------------|
| position          | `'absolute'`                   |
| top               | `6`                            |
| left              | `6`                            |
| right             | `6`                            |
| bottom            | `6`                            |
| borderRadius      | `999` (full circle)            |
| backgroundColor   | `#111111`                      |
| alignItems        | `'center'`                     |
| justifyContent    | `'center'`                     |

The emoji text inside:

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `16`                           |

Content: The user's emoji (e.g., `👩‍🎨`)

---

### 3B: User Info (column to the right of ring)

| Property          | Value                          |
|-------------------|--------------------------------|
| flex              | `1`                            |

#### User Row (name + streak badge):

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

Content: `"Sarah Chen"`

##### Streak Badge:

A small pill showing the fire emoji and count.

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `10`                           |
| fontWeight        | `'800'`                        |
| color             | `#FFFFFF`                       |
| paddingVertical   | `2`                            |
| paddingHorizontal | `6`                            |
| borderRadius      | `8`                            |
| overflow          | `'hidden'`                     |

**Background**: Use `<LinearGradient>` wrapping the text:
- `colors={['#FF6B35', '#FF4500']}`
- `start={{ x: 0, y: 0 }}`
- `end={{ x: 1, y: 1 }}`
- (135 degree gradient: orange-red → deep red)

Content: `"🔥 14"` (fire emoji, space, number)

**NOTE**: In the HTML, the streak badge on other card types is positioned absolutely on the avatar. But on THIS card (progress card), it is positioned `static` inline next to the username. This is an intentional override for this specific card type.

#### Subtitle Row:

| Property          | Value                          |
|-------------------|--------------------------------|
| flexDirection     | `'row'`                        |
| alignItems        | `'center'`                     |
| gap               | `4`                            |
| marginTop         | `1`                            |

##### Perfect Badge (only if `isPerfectDay`):

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `10`                           |
| fontWeight        | `'700'`                        |
| color             | `#D4AF37`                       |
| textTransform     | `'uppercase'`                  |
| letterSpacing     | `1`                            |

Content: `"✦ Perfect Day"`

The `✦` is the Unicode character U+2726 (four-pointed star). Copy it directly.

##### Dot Separator:

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `12`                           |
| color             | `rgba(255, 255, 255, 0.2)`     |

Content: `"·"` (middle dot, U+00B7)

##### Time Ago:

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `12`                           |
| color             | `rgba(255, 255, 255, 0.4)`     |

Content: `"2h ago"`

---

### 3C: More Button (rightmost element in header)

A circular touch target with three dots.

| Property          | Value                          |
|-------------------|--------------------------------|
| width             | `32`                           |
| height            | `32`                           |
| borderRadius      | `16` (half of width)           |
| alignItems        | `'center'`                     |
| justifyContent    | `'center'`                     |

Text inside:

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `16`                           |
| color             | `rgba(255, 255, 255, 0.4)`     |
| fontWeight        | `'700'`                        |

Content: `"···"` (three middle dots, or use `"•••"` — the visual is three evenly-spaced dots in a row)

---

## LAYER 4: ACTION TILES

A horizontal row of equal-width tiles, one per action.

```
┌────────────┐ ┌────────────┐ ┌────────────┐
│         ✅ │ │         ✅ │ │         ✅ │
│     🧘     │ │     ✏️     │ │    🏃‍♀️     │
│  Morning   │ │  Journal   │ │   5K Run   │
│ Meditation │ │   Entry    │ │            │
│ ▃▃▃▃▃▃▃▃▃ │ │ ▃▃▃▃▃▃▃▃▃ │ │ ▃▃▃▃▃▃▃▃▃ │  ← green bottom bar
└────────────┘ └────────────┘ └────────────┘
```

### Tiles Container:

| Property          | Value                          |
|-------------------|--------------------------------|
| flexDirection     | `'row'`                        |
| gap               | `8`                            |
| marginBottom      | `14`                           |
| zIndex            | `1`                            |

### Individual Tile:

| Property          | Value                          |
|-------------------|--------------------------------|
| flex              | `1`                            |
| padding           | `12` (all sides)               |
| borderRadius      | `14`                           |
| backgroundColor   | `rgba(255, 255, 255, 0.03)`    |
| borderWidth       | `1`                            |
| borderColor       | `rgba(255, 255, 255, 0.06)`    |
| alignItems        | `'center'`                     |
| position          | `'relative'`                   |
| overflow          | `'hidden'`                     |

### Check Mark (top-right, only if `completed === true`):

| Property          | Value                          |
|-------------------|--------------------------------|
| position          | `'absolute'`                   |
| top               | `6`                            |
| right             | `6`                            |
| fontSize          | `10`                           |

Content: `"✅"`

### Action Emoji (centered):

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `20`                           |
| marginBottom      | `4`                            |
| textAlign         | `'center'`                     |

### Action Name (centered below emoji):

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `11`                           |
| fontWeight        | `'600'`                        |
| color             | `rgba(255, 255, 255, 0.6)`     |
| lineHeight        | `14.3` (11 * 1.3)              |
| textAlign         | `'center'`                     |

### Completed Bottom Bar (only if `completed === true`):

A thin green line at the very bottom of the tile.

| Property          | Value                          |
|-------------------|--------------------------------|
| position          | `'absolute'`                   |
| bottom            | `0`                            |
| left              | `0`                            |
| right             | `0`                            |
| height            | `2`                            |
| backgroundColor   | `#00FF88`                      |

---

## LAYER 5: FOOTER

Separated from tiles by a thin line. Contains completion stat on the left, heart + comment buttons on the right.

```
┌──────────────────────────────────────────────┐
│  ─ ─ ─ ─ ─ ─ ─ ─ border top ─ ─ ─ ─ ─ ─ ─ │
│  3/3 completed              ❤️ 12   💬 4    │
└──────────────────────────────────────────────┘
```

### Footer Container:

| Property          | Value                          |
|-------------------|--------------------------------|
| flexDirection     | `'row'`                        |
| alignItems        | `'center'`                     |
| paddingTop        | `12`                           |
| borderTopWidth    | `1`                            |
| borderTopColor    | `rgba(255, 255, 255, 0.06)`    |
| zIndex            | `1`                            |

### Completion Stat (left side):

A row showing "**3/3** completed" where the number portion is gold.

| Property          | Value                          |
|-------------------|--------------------------------|
| flexDirection     | `'row'`                        |
| alignItems        | `'center'`                     |
| gap               | `4`                            |

##### Bold Number Part ("3/3"):

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `12`                           |
| fontWeight        | `'700'`                        |
| color             | `#E7C455`                       |

##### Regular Part ("completed"):

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `12`                           |
| fontWeight        | `'400'`                        |
| color             | `rgba(255, 255, 255, 0.4)`     |

### Spacer:

| Property          | Value                          |
|-------------------|--------------------------------|
| flex              | `1`                            |

### Heart Button (filled, active state):

A touchable row with a filled heart SVG icon and the count.

| Property          | Value                          |
|-------------------|--------------------------------|
| flexDirection     | `'row'`                        |
| alignItems        | `'center'`                     |
| gap               | `6`                            |
| paddingVertical   | `8`                            |
| paddingHorizontal | `10`                           |
| borderRadius      | `12`                           |
| backgroundColor   | `'transparent'`                |

#### Heart Icon:

Use `lucide-react-native` `Heart` icon **OR** an SVG path. The heart is **FILLED** (not outline) because `isLiked` is true.

**SVG Path** (filled heart):
```
M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z
```

| Property          | Value                          |
|-------------------|--------------------------------|
| width             | `18`                           |
| height            | `18`                           |
| fill              | `#FF6B35` (active/liked)       |

**If NOT liked**: Use outline version with `stroke="#FF6B35"`, `fill="none"`, `strokeWidth={2}`

#### Heart Count Text:

| Property          | Value                          |
|-------------------|--------------------------------|
| fontSize          | `13`                           |
| fontWeight        | `'600'`                        |
| color             | `#FF6B35` (active/liked)       |

Content: `"12"`

**If NOT liked**: `color: rgba(255, 255, 255, 0.6)`

### Comment Button (outline, inactive state):

A touchable row with an outline speech bubble SVG icon and the count.

| Property          | Value                          |
|-------------------|--------------------------------|
| flexDirection     | `'row'`                        |
| alignItems        | `'center'`                     |
| gap               | `6`                            |
| paddingVertical   | `8`                            |
| paddingHorizontal | `10`                           |
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

Content: `"4"`

---

## VISUAL STATES

### State 1: Perfect Day (all actions completed)
- Card border: `rgba(212, 175, 55, 0.2)` (gold tint)
- Gold top line: VISIBLE
- Gold glow: VISIBLE
- Perfect badge: VISIBLE ("✦ PERFECT DAY")
- Ring: 100% filled
- All action tiles: Show ✅ and green bottom bar

### State 2: Partial Completion (e.g., 2 of 3 done)
- Card border: `rgba(255, 255, 255, 0.06)` (default dim)
- Gold top line: HIDDEN
- Gold glow: HIDDEN
- Perfect badge: HIDDEN (subtitle just shows time ago)
- Ring: Partially filled (proportional)
- Completed tiles: Show ✅ and green bar
- Incomplete tiles: No ✅, no green bar

### State 3: No Completions
- Same as State 2 but ring is empty (strokeDashoffset = 132)
- No tiles show ✅ or green bar

---

## DEPENDENCIES

```
react-native-svg          — for the progress ring (Circle, Svg)
expo-linear-gradient       — for GoldTopLine, GoldGlow, and StreakBadge gradient
```

---

## FULL DIMENSIONAL DIAGRAM

```
←────────────── screen width ──────────────→
     ←──── card (screen - 40px margins) ──→

┌─ gold line (2px) ─────────────────────────┐  ← only if perfectDay
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│                                           │
│  20px padding all around                  │
│  ┌─────────────────────────────────────┐  │
│  │ HEADER ROW (gap: 12)               │  │
│  │                                     │  │
│  │ ┌──────┐  ┌──────────────┐  ┌───┐  │  │
│  │ │48x48 │  │Sarah Chen    │  │···│  │  │
│  │ │ring  │  │🔥14          │  │32 │  │  │
│  │ │👩‍🎨   │  │✦ PERFECT DAY │  │x32│  │  │
│  │ │      │  │· 2h ago      │  │   │  │  │
│  │ └──────┘  └──────────────┘  └───┘  │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  16px gap                                 │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │ ACTION TILES (gap: 8)              │  │
│  │                                     │  │
│  │ ┌──────────┐┌──────────┐┌─────────┐│  │
│  │ │       ✅ ││       ✅ ││      ✅ ││  │
│  │ │   🧘     ││   ✏️     ││  🏃‍♀️    ││  │
│  │ │ Morning  ││ Journal  ││  5K Run ││  │
│  │ │Meditatio ││  Entry   ││        ││  │
│  │ │▃▃green▃▃ ││▃▃green▃▃ ││▃green▃▃ ││  │
│  │ └──────────┘└──────────┘└─────────┘│  │
│  └─────────────────────────────────────┘  │
│                                           │
│  14px gap                                 │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │ ─ ─ ─ border (1px, white06) ─ ─ ─  │  │
│  │ 12px paddingTop                     │  │
│  │                                     │  │
│  │ 3/3 completed      ❤️ 12   💬 4    │  │
│  │ (gold) (dim)        (fire)  (dim)   │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  20px padding bottom                      │
└───────────────────────────────────────────┘
 2px margin bottom
```

---

## FONT

Use the system default font (React Native default). No custom font import needed.

All text uses the `fontWeight` values specified per element. React Native supports `'400'`, `'500'`, `'600'`, `'700'`, `'800'` as string weights.

---

## WHAT NOT TO DO

- Do NOT add any onPress handlers or navigation logic
- Do NOT fetch data from any API
- Do NOT add animations (except the ring can optionally animate its dashoffset on mount)
- Do NOT add shadows to the card (the card has no shadow in the design)
- Do NOT add any extra spacing, dividers, or elements not listed here
- Do NOT use opacity on the card container
- Do NOT round any of the values listed — use them exactly as specified
