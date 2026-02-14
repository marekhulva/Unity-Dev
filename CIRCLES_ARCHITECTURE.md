# Multiple Circles - Modular Architecture

## Design Decision: Solution 3 (Horizontal Scroll)
**Selected**: Tab bar with horizontal scroll and full circle names
**Date**: 2025-10-18

## 🏗️ Modular Architecture Pattern

### Component Structure
```
src/
  features/
    circles/
      ├── components/
      │   ├── CircleSelector/
      │   │   ├── index.tsx              # Main wrapper (switches implementations)
      │   │   ├── CircleSelectorProps.ts  # Shared interface
      │   │   ├── TabBarSelector.tsx      # Solution 3: Scrollable tabs
      │   │   ├── DropdownSelector.tsx    # Solution A: Dropdown (future)
      │   │   ├── IconOnlySelector.tsx    # Solution 2: Icons (future)
      │   │   └── config.ts              # Selector configuration
      │   ├── CircleBadge.tsx
      │   ├── JoinCircleModal.tsx
      │   └── CircleManagement.tsx
      ├── hooks/
      │   ├── useCircles.ts
      │   └── useActiveCircle.ts
      └── state/
          └── circlesSlice.ts
```

## 📐 Component Interface

### CircleSelectorProps (Shared by All Implementations)
```typescript
interface CircleSelectorProps {
  circles: Circle[];
  activeCircleId: string | null;
  onCircleSelect: (circleId: string) => void;
  onJoinCircle: () => void;
  loading?: boolean;
}

interface Circle {
  id: string;
  name: string;
  emoji?: string;
  memberCount: number;
  isActive: boolean;
}
```

## 🔄 Easy Switching Mechanism

### 1. Config-Based Switching
```typescript
// src/features/circles/components/CircleSelector/config.ts
export const CIRCLE_SELECTOR_CONFIG = {
  // Change this line to switch implementations
  implementation: 'TAB_BAR' as 'TAB_BAR' | 'DROPDOWN' | 'ICONS',

  // Implementation-specific settings
  tabBar: {
    showMemberCount: false,
    maxVisibleTabs: 'auto',
    showScrollIndicator: true,
    abbreviateAfter: null, // null = never abbreviate
  },

  dropdown: {
    showMemberCount: true,
    defaultExpanded: false,
  },

  icons: {
    showTooltipOnActive: true,
    maxIcons: 6,
  }
};
```

### 2. Main Wrapper Component
```typescript
// src/features/circles/components/CircleSelector/index.tsx
import { CIRCLE_SELECTOR_CONFIG } from './config';
import TabBarSelector from './TabBarSelector';
import DropdownSelector from './DropdownSelector';
import IconOnlySelector from './IconOnlySelector';

export const CircleSelector: React.FC<CircleSelectorProps> = (props) => {
  // Switch implementation based on config
  switch (CIRCLE_SELECTOR_CONFIG.implementation) {
    case 'TAB_BAR':
      return <TabBarSelector {...props} />;
    case 'DROPDOWN':
      return <DropdownSelector {...props} />;
    case 'ICONS':
      return <IconOnlySelector {...props} />;
    default:
      return <TabBarSelector {...props} />;
  }
};
```

## 📍 Where to Change Later

### To Switch Selector Types:
1. **File**: `src/features/circles/components/CircleSelector/config.ts`
2. **Line**: `implementation: 'TAB_BAR'`
3. **Change to**: `'DROPDOWN'` or `'ICONS'`

### To Modify Tab Bar Behavior:
1. **File**: `src/features/circles/components/CircleSelector/TabBarSelector.tsx`
2. **Key Areas**:
   - Line 45-60: Scroll behavior
   - Line 80-95: Tab rendering
   - Line 120-135: Active state styling

### To Add Abbreviations Later:
```typescript
// In config.ts, change:
tabBar: {
  abbreviateAfter: 10, // Abbreviate names > 10 chars
  abbreviationRules: {
    'Basketball Bros United': 'BBros',
    'Wellness Warriors': 'Wellness',
    // Auto-abbreviation function
    auto: (name: string) => name.split(' ')[0].slice(0, 8)
  }
}
```

## 🎨 Implementation Details for Solution 3

### TabBarSelector.tsx Structure
```typescript
const TabBarSelector = ({ circles, activeCircleId, onCircleSelect, onJoinCircle }) => {
  const scrollRef = useRef<ScrollView>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
      >
        {/* All Circles Tab */}
        <TouchableOpacity
          style={[styles.tab, !activeCircleId && styles.activeTab]}
          onPress={() => onCircleSelect(null)}
        >
          <Text style={styles.emoji}>🌐</Text>
          <Text style={styles.tabText}>All Circles</Text>
        </TouchableOpacity>

        {/* Individual Circle Tabs */}
        {circles.map(circle => (
          <TouchableOpacity
            key={circle.id}
            style={[styles.tab, activeCircleId === circle.id && styles.activeTab]}
            onPress={() => onCircleSelect(circle.id)}
          >
            {circle.emoji && <Text style={styles.emoji}>{circle.emoji}</Text>}
            <Text style={styles.tabText}>{circle.name}</Text>
          </TouchableOpacity>
        ))}

        {/* Join New Circle */}
        <TouchableOpacity style={styles.addTab} onPress={onJoinCircle}>
          <Text style={styles.addIcon}>➕</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Scroll Indicator */}
      {showScrollIndicator && (
        <View style={styles.scrollIndicator}>
          <Text style={styles.scrollArrow}>→</Text>
        </View>
      )}
    </View>
  );
};
```

## 🔮 Future Migration Paths

### Phase 1: Current Implementation (Solution 3)
- Horizontal scroll with full names
- No abbreviations
- Scroll indicator for overflow

### Phase 2: Add Smart Features (If Needed)
- Add long-press for circle info
- Add swipe-to-delete from tab bar
- Add reorder functionality

### Phase 3: Easy Switch Options
- A/B test different implementations
- User preference setting
- Responsive switching (tabs on tablet, dropdown on phone)

## 📊 Metrics to Track

To decide if we need to change later:
1. **Average circles per user** - If > 5, might need different solution
2. **Scroll interactions** - If excessive, consider abbreviations
3. **User feedback** - Confusion about hidden tabs
4. **Tap accuracy** - Misclicks on small tabs

## 🚀 Implementation Checklist

### Step 1: Core Structure
- [ ] Create `circlesSlice.ts` with state management
- [ ] Create `CircleSelector` component structure
- [ ] Implement `TabBarSelector.tsx` for Solution 3

### Step 2: Integration Points
- [ ] Add to `SocialScreen.tsx` header
- [ ] Add to `DailyScreen.tsx` header
- [ ] Add to `ProgressScreen.tsx` header
- [ ] Add to `ChallengesScreen.tsx` header

### Step 3: Data Flow
- [ ] Connect to backend for circle data
- [ ] Implement circle switching logic
- [ ] Update feed filtering

### Step 4: Polish
- [ ] Add animations for tab switching
- [ ] Add scroll indicators
- [ ] Add haptic feedback

## 🔧 Quick Change Guide

### Want to switch to dropdown later?
```bash
# 1. Open config file
src/features/circles/components/CircleSelector/config.ts

# 2. Change one line:
implementation: 'DROPDOWN'  # was 'TAB_BAR'

# 3. Done! The UI switches automatically
```

### Want to add abbreviations?
```bash
# 1. Open TabBarSelector.tsx
# 2. Find line ~85 (tab text rendering)
# 3. Add abbreviation logic:
<Text style={styles.tabText}>
  {circle.name.length > 12
    ? `${circle.name.slice(0, 10)}...`
    : circle.name}
</Text>
```

### Want to limit visible tabs?
```bash
# 1. In config.ts, add:
maxVisibleTabs: 4

# 2. In TabBarSelector.tsx, slice the circles:
{circles.slice(0, config.maxVisibleTabs).map(...)}
```

---

This architecture ensures that changing the selector implementation is a **one-line change** while keeping all the business logic intact!