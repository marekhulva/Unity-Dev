# Unused Components Backup
**Date:** 2025-10-18
**Reason:** Refactoring to clean up component version sprawl

## What This Folder Contains
This folder contains all the unused component versions that were removed during the refactoring process. These files are kept here as a backup in case we need to reference them or restore any functionality.

## Active Components (NOT in this folder)
The following components are actively used and remain in the main codebase:
- `SocialScreen.tsx` (formerly SocialScreenV6)
- `ProfileScreen.tsx` (formerly ProfileClaudeOptionB)
- `ProgressScreen.tsx` (formerly ProgressMVPEnhanced)
- `DailyScreen.tsx` (original V1)
- `DailyReviewModal.tsx` (formerly DailyReviewModalV2)
- `CircleScreen.tsx`
- `ActionItem.tsx`
- `PrivacySelectionModal.tsx` (consolidated version)
- `UnifiedActivityCard.tsx`
- `LuxuryPostCardPremium.tsx`

## Moved Components
### Social Screen Versions
- SocialScreen.tsx (old V1)
- SocialScreenV2.tsx through SocialScreenV5.tsx
- Old social components only used by these versions

### Profile Versions
- ProfileEnhanced.tsx
- ProfileV2.tsx, ProfileV3.tsx, ProfileV4_1.tsx
- ProfileClaude.tsx, ProfileClaudeWithPosts.tsx
- ViewUserProfile.tsx

### Daily Screen Versions
- DailyScreenV2.tsx, DailyScreenV3.tsx
- DailyReviewModal.tsx (old V1)
- DailyReviewModalEnhanced.tsx
- ActionItemV2.tsx
- PrivacySelectionModalOriginal.tsx (replaced by consolidated version)
- PrivacySelectionModalV2.tsx

### Progress Versions
- ProgressScreen.tsx (old V1)
- ProgressMinimal.tsx
- ProgressMVP.tsx
- ProgressiOS2025.tsx

## How to Restore
If you need to restore any of these files:
1. Copy the needed file from this backup folder
2. Move it back to its original location
3. Update any imports as necessary
4. Test thoroughly

## Note
These files were moved, not deleted, as a safety measure. After confirming the application works correctly without them for a reasonable period, this folder can be safely deleted.