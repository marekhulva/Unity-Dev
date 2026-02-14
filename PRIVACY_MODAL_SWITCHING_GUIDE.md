# Privacy Modal Switching Guide

## ⚠️ IMPORTANT: How to Switch Between Privacy Modal Versions

We have multiple versions of the privacy selection modal for the Daily screen. This guide explains how to properly switch between them.

## Available Versions

### 1. **Two-Option Toggle** (Original)
- File: `PrivacySelectionModalOriginal.tsx`
- Options: Private / Circle
- Simple binary toggle switch

### 2. **Three-Way Toggle** (Current Default)
- File: `PrivacySelectionModal.tsx`
- Options: Private / Circle / Followers
- Toggle cycles through three states with animated dot

### 3. **Segmented Control**
- File: `PrivacySelectionModalV2.tsx`
- Options: Private / Circle / Followers
- Three buttons side by side (iOS-style)

## How to Switch Versions

### ⚠️ CRITICAL: The Correct Way

**DO NOT** try to switch by changing imports with aliases like this:
```typescript
// This WILL NOT WORK due to bundler issues!
import { PrivacySelectionModalOriginal as PrivacySelectionModal } from './PrivacySelectionModalOriginal';
```

**INSTEAD**, directly replace the main file:

#### To Use Two-Option Version:
```bash
# Backup current version
cp src/features/daily/PrivacySelectionModal.tsx src/features/daily/PrivacySelectionModal.backup.tsx

# Replace with two-option version
cp src/features/daily/PrivacySelectionModalOriginal.tsx src/features/daily/PrivacySelectionModal.tsx
```

#### To Use Three-Way Toggle (Default):
```bash
# Restore from backup if you switched to another version
cp src/features/daily/PrivacySelectionModal.backup.tsx src/features/daily/PrivacySelectionModal.tsx
```

#### To Use Segmented Control:
```bash
# Backup current version
cp src/features/daily/PrivacySelectionModal.tsx src/features/daily/PrivacySelectionModal.backup.tsx

# Replace with segmented control version
cp src/features/daily/PrivacySelectionModalV2.tsx src/features/daily/PrivacySelectionModal.tsx

# Fix the export name (V2 exports as PrivacySelectionModalV2)
# Edit the file and change:
# export const PrivacySelectionModalV2 
# to: 
# export const PrivacySelectionModal
```

## Where It's Used

The modal is imported in:
- `src/features/daily/DailyScreenV2.tsx` - Main usage
- `src/features/daily/ActionItem.tsx` - Alternative component (not used by DailyScreenV2)

**Note:** DailyScreenV2 renders actions inline and uses its own PrivacySelectionModal import, NOT the one from ActionItem.

## Handler Compatibility

### For Two-Option Version:
The handler expects `'private' | 'public'`:
```typescript
const handlePrivacySelect = (visibility: 'private' | 'public', contentType: ...) => {
  // Map 'public' to 'circle' for backend
  const mappedVisibility = visibility === 'public' ? 'circle' : visibility;
  // ... rest of handler
}
```

### For Three-Way Versions:
The handler expects `'private' | 'circle' | 'followers'`:
```typescript
const handlePrivacySelect = (visibility: 'private' | 'circle' | 'followers', contentType: ...) => {
  // Use visibility directly
  // ... rest of handler
}
```

## Troubleshooting

### Issue: Changes not taking effect
1. Clear Expo cache: `rm -rf .expo/web/cache`
2. Hard refresh browser: Ctrl+Shift+R (Cmd+Shift+R on Mac)
3. Restart dev server if needed

### Issue: Import alias not working
- The Expo/Webpack bundler has issues with import aliases for components
- Always use the file replacement method described above

### Issue: Wrong modal showing
- Check the console for debug messages
- Verify which file is actually being imported
- Make sure DailyScreenV2.tsx is importing from './PrivacySelectionModal' (not a specific version)

## Current Configuration

As of last update:
- **Active Version**: Three-Way Toggle (PrivacySelectionModal.tsx)
- **Backup Available**: PrivacySelectionModal.backup.tsx (if exists)

## Testing

After switching versions:
1. Go to Daily screen
2. Click on an action to complete
3. Verify the correct number of options appear
4. Test the toggle/selection functionality
5. Complete an action and verify it posts correctly

---

**Remember**: Always use file replacement, not import aliases, when switching between modal versions!