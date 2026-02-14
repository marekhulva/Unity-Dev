# Floating Composer Design Documentation

## Overview
The "Share Your Victory" composer in SocialScreenV6.tsx has been redesigned as a floating component with a premium glass morphism effect.

## Design Philosophy
Inspired by Steve Jobs and Jony Ive's design principles - functional clarity through considered contrast and hierarchy while maintaining elegance.

## Current Implementation

### Position
- **Location**: Floating at bottom of screen
- **Bottom spacing**: 120px from bottom (above navigation bar)
- **Horizontal margins**: 16px from left and right edges

### Visual Design

#### Color Scheme
```javascript
// Dark glass base for strong contrast
backgroundColor: 'rgba(0,0,0,0.7)'  // 70% black when collapsed
backgroundColor: 'rgba(0,0,0,0.85)' // 85% black when expanded

// Golden accent system
borderColor: 'rgba(255,215,0,0.3)'  // 30% golden border (collapsed)
borderColor: 'rgba(255,215,0,0.5)'  // 50% golden border (expanded)

// Icon colors
iconColor: 'rgba(255,215,0,0.8)'    // 80% golden icons
```

#### Key Style Properties
```javascript
floatingComposer: {
  position: 'absolute',
  bottom: 120,                         // Spacing from navigation
  borderRadius: 24,                    // Modern rounded corners
  shadowColor: '#000000',              // Dark shadow for depth
  shadowOpacity: 0.5,
  shadowRadius: 30,
  elevation: 20,
  zIndex: 1000
}
```

#### Special Effects
1. **BlurView backdrop** - Frosted glass effect with intensity 80
2. **Golden gradient overlay** - Subtle warmth from top-left to bottom-right
3. **Top accent line** - 1px golden line for premium feel

## How to Modify

### To adjust positioning:
- Edit `bottom: 120` in `floatingComposer` style
- Also update same value in `floatingComposerExpanded`

### To change transparency/contrast:
- Modify `backgroundColor` rgba values
- Current: 0.7 (collapsed) / 0.85 (expanded)
- Lower values = more transparent
- Higher values = more opaque

### To adjust the golden accent:
- Border: Change `borderColor` rgba values
- Icons: Update color prop in Camera/ImageIcon/Mic components
- Gradient: Modify LinearGradient colors array

### To revert to original white glass:
```javascript
// Original white glass values (saved in commit a9f54bb)
borderColor: 'rgba(255,255,255,0.35)'
backgroundColor: 'rgba(255,255,255,0.03)'
shadowColor: '#FFFFFF'
iconColor: 'rgba(255,215,0,0.4)'
```

## Version History
- **Commit a9f54bb**: Original white glass version before improvements
- **Current**: Dark glass with golden accents for better contrast

## File Location
`/src/features/social/SocialScreenV6.tsx` (lines 715-950, 1318-1350)