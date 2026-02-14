# Active Components Registry
**Last Updated:** 2025-08-30
**Purpose:** Track which components are actually being used to avoid confusion

## 🎯 ACTIVE COMPONENTS

### Navigation & App Structure
- **App Entry:** `AppWithAuth.tsx`
- **Tab Navigation:** Bottom tabs with Social, Daily, Progress, Profile

### Screen Components (Main Views)

| Feature | Active Component | Location | Notes |
|---------|-----------------|----------|--------|
| **Social** | `SocialScreenV6` | `src/features/social/SocialScreenV6.tsx` | V6 with metallic gold gradient |
| **Daily** | `DailyScreen` | `src/features/daily/DailyScreen.tsx` | Main daily actions view - Fixed Review button overlap |
| **Progress** | `ProgressMVPEnhanced` | `src/features/progress/ProgressMVPEnhanced.tsx` | Highlights & Milestones hero card |
| **Profile** | `ProfileClaude` | `src/features/profile/ProfileClaude.tsx` | Claude's version with fixed photo persistence |
| **Challenges** | `ChallengeDetailScreen` | `src/features/challenges/ChallengeDetailScreen.tsx` | Challenge details view |

### Component Hierarchy

#### Social Feed Components
```
SocialScreenV6
└── LuxuryPostCard (defined inline at line 1214)
    ├── Activity/Checkin posts → Silver styling for challenges
    ├── Photo posts
    ├── Audio posts
    └── Status posts
```

#### Daily Screen Components
```
DailyScreen
├── ActionItem (individual action cards)
├── PrivacySelectionModal (post privacy selection)
└── DailyReviewModalEnhanced (end of day review)
```

#### Challenge Components
```
ChallengeDetailScreen
├── Today's Progress (right side)
├── Leaderboard (left side)
└── Activity selection flow
```

## ⚠️ DEPRECATED/UNUSED Components

These components exist but are NOT being used:
- `PostCard.tsx` - NOT USED (replaced by LuxuryPostCard)
- `PostCardEnhanced.tsx` - NOT USED
- `PostCardBase.tsx`, `PostCardBaseV2.tsx`, `PostCardBaseV3.tsx` - NOT USED
- `SocialScreen.tsx` through `SocialScreenV5.tsx` - OLD VERSIONS

## 🔍 How to Find Active Component

1. Check `AppWithAuth.tsx` for which screen version is imported
2. Look for components actually rendered in that screen
3. Use browser React DevTools to see component tree
4. Add console.log in suspected component to verify

## 📝 When to Update This File

- When switching between component versions
- When creating new components
- When deprecating old components
- After major refactoring

## 📅 Recent Updates (2025-08-30)

### Progress Page
- **Hero Card Redesign:** Replaced consistency card with Highlights & Milestones layout
- **Fixed Layout Issues:** Adjusted padding to prevent "ACTIVE GOALS" from being hidden
- **Add Goals Button:** Now fixed at bottom of screen for easy access

### Daily Page
- **Fixed Review Button Overlap:** Increased bottom padding to prevent button from covering last activity

### Social Page (ShareComposer)
- **Fixed Keyboard Overlap on iPhone:** Added KeyboardAvoidingView with ScrollView
- **Improved Modal Behavior:** Changed animation to 'slide' for better keyboard interaction

### Profile Page
- **Fixed Photo Persistence:** Profile photos now persist using base64 encoding on mobile
- **Fixed iPhone Dynamic Island:** Proper safe area handling for iPhone 15 and newer

## Debug Commands

```javascript
// Add to console to check active components
window.showActiveComponents?.()
```