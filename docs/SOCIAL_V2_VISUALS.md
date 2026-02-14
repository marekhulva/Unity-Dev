# Social Feed V2 Visual Enhancements

## Overview
Further visual-only refinements to increase clarity, reduce clutter, add tasteful motion, and improve readability. All changes are non-breaking and gated behind the `ui.social.v2` feature flag.

## Feature Flag
The V2 enhancements are enabled only in development by default:
```typescript
ui: {
  social: {
    v1: true,  // V1 enhancements (production ready)
    v2: __DEV__ ? true : false // V2 refinements (dev only)
  }
}
```

## Changes Implemented

### 1. **Unified Momentum Visualization**
- **Single primary meter**: Only the ring meter shows by default at top-right
- **Hidden bar meter**: Horizontal bar hidden unless `showDetailMeter={true}`
- **Accessible labels**: All meters include "Momentum X percent" labels
- **No duplicate visuals**: Cleaner cards with single source of truth

### 2. **Micro-Motion Polish**
- **Softer streak glow**: 
  - Intensity reduced from 0.3-0.6 to 0.2-0.4 opacity
  - Radius reduced from 8-16px to 6-12px
  - Duration remains 2s with ease-in-out
- **Momentum ring sweep**: 
  - Highlights when value ≥ 80%
  - One-shot animation on appear (800ms)
  - Automatically disabled with Reduce Motion
- **Reaction chip tap**: 
  - 0.92 → 1.0 spring scale
  - 120ms duration
  - No layout shift

### 3. **Card Depth & Gradients**
- **Vertical gradient**: Top (#13181D) slightly darker than bottom (#12171C)
- **Category rail opacity**: Reduced to 0.6 to not overpower text
- **Soft shadow**: Maintained from `theme.shadow.md`
- **Infinite scroll cue**: Subtle fade at card bottom

### 4. **Whitespace & Spacing**
- **Header gap**: Increased from 12px to 14px
- **Line height**: Body text increased from 20px to 22px
- **Card padding**: Consistent 16px outer padding
- **Visual breathing room**: Better separation between elements

### 5. **Typography Hierarchy**
- **Primary (16px bold)**: Username remains strongest
- **Secondary (14px medium)**: Activity title, brighter than body
- **Tertiary (12px)**: Metadata uses `text.tertiary` (#A7B0B7)
- **Muted (11px)**: Pills and chips use `text.muted` to reduce competition

### 6. **Gold Accent Discipline**
- **Brand gold reserved for**:
  - Streaks and streak badges
  - Awards and milestones
  - High momentum (≥80%)
  - Explicit win states (comebacks)
- **Neutral colors for**:
  - Generic badges and pills
  - Standard metrics
  - Non-achievement states
- **Category accents**:
  - Fitness: Green (#22C55E)
  - Mindfulness: Blue (#60A5FA)
  - Productivity: Purple (#A78BFA)

## New/Enhanced Components

### Atoms Layer (`/src/ui/atoms/`)
- **MomentumRingAnimated**: Ring with sweep highlight for high values
- **StreakBadgeAnimated** (v2): Softer pulsing with lower intensity
- **SocialCardSurface**: Vertical gradient and consistent depth
- **ReactionChipAnimated**: Tap pop animation without layout shift

### PostCard Components
- **PostCardBaseV3**: Unified momentum, improved spacing
- **CheckinCardV3**: Gold discipline, better hierarchy

## Accessibility

✅ **All enhancements include**:
- ARIA labels on all meters and interactive elements
- Automatic animation disable when Reduce Motion is on
- Contrast ratios maintained at ≥ 4.5:1
- Keyboard navigation preserved
- Screen reader announcements for state changes

## Performance

- **60fps maintained**: All animations optimized
- **Reduce Motion respected**: Automatic fallback to static
- **Graceful degradation**: Simpler visuals on low-end devices
- **No layout shifts**: Animations don't affect document flow

## Testing

### Disable animations for testing:
```javascript
// Set in component
disableAnimation={true}

// Or system-wide
Settings > Accessibility > Motion > Reduce Motion
```

### Feature flag testing:
```javascript
// Disable V2 (keeps V1)
ui.social.v2 = false

// Disable all enhancements
ui.social.v1 = false
ui.social.v2 = false
```

## Migration Guide

### For developers:
1. V2 is opt-in via feature flag
2. No breaking changes to existing APIs
3. All props backward compatible
4. New props have sensible defaults

### Rollback procedure:
1. Set `ui.social.v2 = false` in feature flags
2. Changes revert immediately
3. No data migration needed

## Visual Comparison

### V1 → V2 Changes:
- **Momentum**: Dual meters → Single ring (bar hidden)
- **Streak glow**: Strong pulse → Soft breathing
- **Cards**: Flat → Subtle vertical gradient
- **Reactions**: Static → Tap animation
- **Gold usage**: Overused → Reserved for wins
- **Spacing**: Compact → Better breathing room
- **Typography**: Flat hierarchy → Clear 3-tier system

## Known Limitations

- Sweep highlight requires iOS 13+ / Android 10+
- Some gradients simplified in high contrast mode
- Tap animations may be delayed on low-memory devices
- Category detection is keyword-based (may need refinement)

## Future Considerations

- Dynamic category detection from ML model
- Adaptive animations based on device performance
- User preference for animation intensity
- A/B testing framework for visual variations