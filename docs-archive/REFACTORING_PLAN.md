# Unity 2.0 Complete Refactoring & Cleanup Plan

## Current State Analysis

### 🔴 The Core Problems
1. **Confusing import aliases** hiding what's actually used
2. **Multiple versions** of components (V1-V6) creating confusion
3. **Orphaned dependencies** - components only used by other unused components
4. **Duplicate functionality** - multiple components doing the same thing

### 📊 What We're Actually Using (Hidden by Aliases)
```typescript
// AppWithAuth.tsx - THE SOURCE OF CONFUSION
import { ProfileClaudeOptionB as ProfileEnhanced } from './features/profile/ProfileClaudeOptionB';
// ProfileEnhanced is used everywhere, but it's actually ProfileClaudeOptionB!
```

**Active Components:**
- `SocialScreenV6` (should be renamed to SocialScreen)
- `ProfileClaudeOptionB` (aliased as ProfileEnhanced - should be renamed to ProfileScreen)
- `DailyScreen` (V1 - correct, no changes needed)
- `ProgressMVPEnhanced` (should be renamed to ProgressScreen)
- `CircleScreen` (correct, no changes needed)

## 📋 REFACTORING PHASES (Must Do BEFORE Cleanup)

### PHASE 1: Fix Import Aliases & Component Names
**Risk: Low | Impact: High | Time: 30 minutes**

#### Step 1.1: Fix AppWithAuth.tsx Imports
```typescript
// CURRENT (confusing):
import { ProfileClaudeOptionB as ProfileEnhanced } from './features/profile/ProfileClaudeOptionB';
import { SocialScreenV6 as SocialScreen } from './features/social/SocialScreenV6';

// CHANGE TO (clear):
import { ProfileClaudeOptionB } from './features/profile/ProfileClaudeOptionB';
import { SocialScreenV6 } from './features/social/SocialScreenV6';
```

#### Step 1.2: Update Component References in AppWithAuth.tsx
```typescript
// Find and replace:
// ProfileEnhanced → ProfileClaudeOptionB (throughout the file)
// SocialScreen → SocialScreenV6 (if aliased)
```

#### Step 1.3: Fix CircleScreen.tsx Import Alias
```typescript
// CURRENT:
import { ProfileClaudeOptionB as ProfileClaude } from '../profile/ProfileClaudeOptionB';

// CHANGE TO:
import { ProfileClaudeOptionB } from '../profile/ProfileClaudeOptionB';
// Update all ProfileClaude references to ProfileClaudeOptionB
```

#### Step 1.4: Fix DailyScreen.tsx Import Alias
```typescript
// CURRENT:
import { DailyReviewModalV2 as DailyReviewModal } from './DailyReviewModalV2';

// CHANGE TO:
import { DailyReviewModalV2 } from './DailyReviewModalV2';
// Update all DailyReviewModal references to DailyReviewModalV2
```

**✅ TEST POINT 1:** Run app, verify all screens load correctly

---

### PHASE 2: Consolidate Duplicate Components
**Risk: Medium | Impact: High | Time: 1 hour**

#### Step 2.1: Consolidate Privacy Modals
We have 3 versions doing similar things:
- `PrivacySelectionModal.tsx` - Used by DailyScreen
- `PrivacySelectionModalOriginal.tsx` - Used by ActionItem
- `PrivacySelectionModalV2.tsx` - Not used

**Action:**
1. Compare functionality of all three
2. Merge unique features into `PrivacySelectionModal.tsx`
3. Update ActionItem.tsx:
```typescript
// CURRENT:
import { PrivacySelectionModalOriginal as PrivacySelectionModal } from './PrivacySelectionModalOriginal';

// CHANGE TO:
import { PrivacySelectionModal } from './PrivacySelectionModal';
```
4. Test both DailyScreen and ActionItem still work

**✅ TEST POINT 2:** Test privacy selection in Daily screen

---

### PHASE 3: Remove Component Version Numbers
**Risk: Low | Impact: High | Time: 45 minutes**

#### Step 3.1: Rename Files
```bash
# Core components
mv src/features/social/SocialScreenV6.tsx src/features/social/SocialScreen.tsx
mv src/features/profile/ProfileClaudeOptionB.tsx src/features/profile/ProfileScreen.tsx
mv src/features/progress/ProgressMVPEnhanced.tsx src/features/progress/ProgressScreen.tsx
mv src/features/daily/DailyReviewModalV2.tsx src/features/daily/DailyReviewModal.tsx
```

#### Step 3.2: Update All Imports
```typescript
// In AppWithAuth.tsx:
import { SocialScreen } from './features/social/SocialScreen';
import { ProfileScreen } from './features/profile/ProfileScreen';
import { ProgressScreen } from './features/progress/ProgressScreen';

// In DailyScreen.tsx:
import { DailyReviewModal } from './DailyReviewModal';

// In CircleScreen.tsx:
import { ProfileScreen } from '../profile/ProfileScreen';

// In SocialScreen.tsx (formerly V6):
import { ProfileScreen } from '../profile/ProfileScreen';
```

#### Step 3.3: Update Internal References
Search and replace across entire codebase:
- `SocialScreenV6` → `SocialScreen`
- `ProfileClaudeOptionB` → `ProfileScreen`
- `ProgressMVPEnhanced` → `ProgressScreen`
- `DailyReviewModalV2` → `DailyReviewModal`

**✅ TEST POINT 3:** Full app test - all navigation working

---

### PHASE 4: Clean Commented Imports
**Risk: None | Impact: Medium | Time: 10 minutes**

Remove all commented import lines from AppWithAuth.tsx:
```typescript
// DELETE ALL THESE:
// import { SocialScreenV2 as SocialScreen } from './features/social/SocialScreenV2';
// import { SocialScreenV3 as SocialScreen } from './features/social/SocialScreenV3';
// import { ProfileEnhanced } from './features/profile/ProfileEnhanced';
// import { ProfileV2 as ProfileEnhanced } from './features/profile/ProfileV2';
// etc...
```

---

## 🗑️ CLEANUP PHASES (Only After Refactoring)

### PHASE 5: Delete Unused Component Groups
**Risk: Low (after refactoring) | Impact: High | Time: 10 minutes**

#### Step 5.1: Delete Old Social Versions & Dependencies
```bash
# Social V1 and its exclusive dependencies
rm src/features/social/SocialScreen.tsx  # Old V1 (we renamed V6 to this)
rm src/features/social/SocialScreenV2.tsx
rm src/features/social/SocialScreenV3.tsx
rm src/features/social/SocialScreenV4.tsx
rm src/features/social/SocialScreenV5.tsx
rm src/features/social/SocialScreenV4_styles.tsx

# Components ONLY used by old social versions
rm src/features/social/components/FeedCard.tsx
rm src/features/social/components/SimpleAudioPlayer.tsx
rm src/features/social/components/CommentSection.tsx
rm src/features/social/components/LiquidGlassTabs.tsx
rm src/features/social/components/PostPromptCard.tsx
rm src/features/social/components/FixedPromptCarousel.tsx
rm src/features/social/components/AnimatedFeedView.tsx
rm src/ui/atoms/NeonDivider.tsx
rm src/components/LightGeometricBackground.tsx
```

#### Step 5.2: Delete Old Profile Versions & Dependencies
```bash
# Profile versions
rm src/features/profile/ProfileEnhanced.tsx
rm src/features/profile/ProfileV2.tsx
rm src/features/profile/ProfileV3.tsx
rm src/features/profile/ProfileV4_1.tsx
rm src/features/profile/ProfileClaude.tsx
rm src/features/profile/ProfileClaudeWithPosts.tsx
rm src/features/profile/ViewUserProfile.tsx

# Components ONLY used by old profiles
rm src/features/social/components/PostCardEnhanced.tsx
rm src/features/onboarding/ResetButton.tsx
rm src/ui/LuxuryGradientBackground.tsx
rm src/ui/GoldParticles.tsx
```

#### Step 5.3: Delete Old Daily/Progress Versions
```bash
rm src/features/daily/DailyScreenV2.tsx
rm src/features/daily/DailyScreenV3.tsx
rm src/features/daily/DailyReviewModal.tsx  # Old V1
rm src/features/daily/DailyReviewModalEnhanced.tsx
rm src/features/daily/ActionItemV2.tsx
rm src/features/daily/PrivacySelectionModalOriginal.tsx  # After consolidation
rm src/features/daily/PrivacySelectionModalV2.tsx

rm src/features/progress/ProgressScreen.tsx  # Old V1
rm src/features/progress/ProgressMinimal.tsx
rm src/features/progress/ProgressMVP.tsx
rm src/features/progress/ProgressiOS2025.tsx
```

#### Step 5.4: Delete Unused PostCard System
```bash
# Entire folder - never imported from outside
rm -rf src/features/social/components/PostCard/
```

#### Step 5.5: Delete Backup Files
```bash
rm src/features/daily/PrivacySelectionModal.backup.tsx
rm src/components/ProfileHighlights.backup.tsx
rm src/components/ProfilePostsTimeline.backup.tsx
```

**✅ TEST POINT 4:** Final comprehensive test

---

## 📊 Success Metrics

### Before Refactoring
- ❌ Confusing aliases (ProfileEnhanced = ProfileClaudeOptionB)
- ❌ Multiple versions (V1-V6)
- ❌ ~120 component files
- ❌ Unclear dependencies
- ❌ ~50,000 lines of code

### After Refactoring
- ✅ Clear component names
- ✅ Single version of each component
- ✅ ~75 component files (37% reduction)
- ✅ Clear dependency tree
- ✅ ~32,000 lines of code (36% reduction)

## ⚠️ Pre-Refactoring Checklist

### Required Before Starting:
- [ ] Create backup branch: `git checkout -b refactoring-cleanup`
- [ ] Commit all current changes: `git add -A && git commit -m "Pre-refactoring backup"`
- [ ] Ensure app currently builds and runs
- [ ] Have testing device/simulator ready
- [ ] Block out 2-3 hours for complete process

### Tools Needed:
- [ ] Code editor with find/replace across files
- [ ] Terminal for git and file operations
- [ ] Browser/simulator for testing

## 🚨 Risk Mitigation

### If Something Breaks:
1. **After Phase 1-2**: Easy rollback, just revert the import changes
2. **After Phase 3**: File renames can be reverted with git
3. **After Phase 5**: Deleted files can be restored from git
4. **Emergency**: `git checkout main && git branch -D refactoring-cleanup`

### Common Issues & Solutions:
- **"Module not found"**: Check if import path needs updating
- **"Component not defined"**: Check if alias was removed but reference wasn't updated
- **Type errors**: Update TypeScript interfaces if component names changed

## 📝 Post-Refactoring Tasks

1. **Update Documentation**
   - Update README with new component structure
   - Remove references to version numbers
   - Document the clean architecture

2. **Update Team**
   - Inform team of new component names
   - Share this refactoring document
   - Update any external documentation

3. **Set Standards**
   ```
   GOING FORWARD:
   ✅ Use git branches for experiments, not V1/V2/V3 files
   ✅ Use clear import names, no confusing aliases
   ✅ Delete unused code immediately, don't comment it out
   ✅ One component = one file = one purpose
   ```

## 🎯 Next Steps After Cleanup

With clean codebase, we can now:
1. Implement multi-circle support efficiently
2. Add challenge features without confusion
3. Onboard new developers quickly
4. Maintain and debug easily

---

## Summary: Order of Operations

1. **REFACTOR FIRST** (Phases 1-4): Fix aliases, consolidate duplicates, rename components
2. **TEST THOROUGHLY**: After each phase
3. **CLEANUP LAST** (Phase 5): Delete unused files only after refactoring is complete
4. **DOCUMENT**: Update all documentation

**Total Estimated Time**: 2-3 hours
**Risk Level**: Low to Medium (with proper testing)
**Impact**: Massive improvement in code maintainability

---

**READY TO START?** Begin with creating the backup branch, then proceed with Phase 1.