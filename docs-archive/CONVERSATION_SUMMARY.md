# Conversation Summary - Post Photo Fix

## Last GitHub Commit
**Repository:** marekhulva/best-app-fullstack
**Branch:** mvp-release-ready
**Commit:** b2da8f0 - "Fix photo persistence issue - handle file:// URIs from image picker"

## Key Work Completed

### 1. Photo Persistence Fix
**Problem:** Photos showed blank squares day after posting from iOS
**Root Cause:** Image picker returned `file://` URIs that were saved directly to database instead of being uploaded
**Solution:**
- Installed `expo-file-system`
- Updated `uploadImage()` to handle both `file://` and `data:image` URIs
- Updated `createPost()` to detect and upload `file://` URIs before saving
- Performance maintained by not storing base64 in state

### 2. Multi-Circle & Challenges Discussion
**Architecture Decisions:**
- Keep `profiles.circle_id` as primary circle
- Use `circle_members` for all memberships
- Allow posting to selected circles (not all by default)
- Challenges can be circle-specific or public
- Challenges link to existing actions or create new ones

**Implementation Priority:**
1. Multi-circle foundation first
2. Basic circle-only challenges
3. Public challenges
4. Advanced features (metrics, invites, rewards)

### 3. Unity 2.0 Project Created
**New Repository:** https://github.com/marekhulva/unity-2-0
**Local Path:** /home/marek/Unity 2.0
**Purpose:** Clean slate for multi-circle and challenges implementation
**Status:** Initial commit pushed, contains all Unity 1.0 features

### 4. Code Cleanup Analysis
**Created:** CLEANUP.md documentation
**Key Findings:**
- **Active:** SocialScreenV6, ProfileClaudeOptionB, DailyScreen (V1), DailyReviewModalV2
- **Unused:** 35-40 components (~15-20k lines)
- **Version Sprawl:** Up to 6 versions of some screens

## Active Components Summary

### Currently Used (DO NOT DELETE):
- `SocialScreenV6` - Main social feed
- `ProfileClaudeOptionB` - User profiles
- `DailyScreen` (V1) - Daily actions screen
- `DailyReviewModalV2` - Daily review flow
- `ProgressMVPEnhanced` - Progress tracking
- `CircleScreen` - Circle management
- `UnifiedActivityCard` - Feed cards
- `LuxuryPostCardPremium` - Premium cards
- `PrivacySelectionModal` - Check-in privacy

### Can Be Deleted:
- All other Social versions (V1-V5)
- All other Profile versions (7 unused)
- All other Daily versions (V2-V3)
- Old PostCard system
- Backup files
- Demo files

## Next Steps Plan

1. **Immediate:** Start Phase 1 cleanup (remove obvious unused files)
2. **Then:** Implement multi-circle support:
   - Update circle_members table
   - Add circle switcher to Circle page
   - Update feed to show all circles
3. **Finally:** Add challenge system on top

## Important Context

- Using Supabase backend (not custom API)
- TestFlight build #28 is latest
- Working branch was `mvp-release-ready` (now in Unity 2.0)
- Test account: 12221212
- Test circle: TEST123

## Technical Debt Notes

- Many commented-out imports in AppWithAuth.tsx
- Component naming inconsistent (V1, V2, V3 vs Enhanced vs Claude)
- Some components have both .tsx and .backup.tsx versions
- PostCard system partially migrated to UnifiedActivityCard

## Database Considerations

- `profiles.circle_id` - single circle (current)
- `circle_members` table exists but underutilized
- Need migration for multi-circle support
- Challenge tables don't exist yet