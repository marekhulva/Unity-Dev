# Circles and Following System Documentation

## Overview
Implemented a complete social system with two main components:
- **Circles**: Private groups for teams/communities (e.g., basketball team, meditation group)
- **Following**: Public social network for following users outside your circle

## Database Schema

### Tables Created
1. **circles**
   - `id`: UUID primary key
   - `name`: Circle name
   - `description`: Optional description
   - `invite_code`: Unique 6-character code (auto-generated)
   - `created_by`: User who created the circle
   - `member_count`: Number of members
   - `is_active`: Boolean flag

2. **circle_members**
   - `circle_id`: Reference to circles table
   - `user_id`: Reference to auth.users
   - `role`: 'admin' or 'member'
   - `joined_at`: Timestamp

3. **follows**
   - `follower_id`: User who is following
   - `following_id`: User being followed
   - `created_at`: Timestamp

### Profile Updates
- Added `circle_id` to profiles table
- Added `following_count` and `follower_count` fields

## Features Implemented

### Circle Features
✅ Join circle with invite code
✅ View circle members
✅ Post to circle (only visible to members)
✅ Circle-only feed
✅ Circle name display in UI
✅ Members modal with invite code sharing

### Following Features (Pending)
⏳ Discover users outside circle
⏳ Follow/unfollow users
⏳ Following-only feed
⏳ Follow suggestions

## API Endpoints

### Supabase Service Methods
```typescript
// Circle methods
async joinCircleWithCode(inviteCode: string)
async getMyCircle()
async getCircleMembers(circleId: string)
async createCircle(name: string, description?: string)

// Following methods
async followUser(userId: string)
async unfollowUser(userId: string)
async getFollowing()
async getFollowers()
```

### Backend Service Wrapper
All methods are wrapped in `backendService` for backend abstraction:
- `joinCircleWithCode()`
- `getMyCircle()`
- `getCircleMembers()`
- `followUser()`
- `unfollowUser()`

## UI Components

### Created Components
1. **JoinCircleModal** (`src/features/social/JoinCircleModal.tsx`)
   - Enter 6-character invite code
   - Join circle functionality
   - Create circle button (future)

2. **CircleMembersModal** (`src/features/social/CircleMembersModal.tsx`)
   - Display all circle members
   - Show invite code for sharing
   - Follow/unfollow buttons (future)

### Updated Components
1. **SocialScreen** (`src/features/social/SocialScreen.tsx`)
   - Tab selector: CIRCLE / FOLLOWING
   - Members button (👥) for circle
   - Discover button (➕) for following
   - Circle status display

2. **LiquidGlassTabs** (`src/features/social/components/LiquidGlassTabs.tsx`)
   - Changed from "YOUR CIRCLE / DISCOVER" to "CIRCLE / FOLLOWING"
   - Fixed positioning issues for iOS

## State Management

### Zustand Store Updates
Added to `socialSlice.ts`:
```typescript
// State
circleId: string | null
circleName: string | null
circleMembers: any[]
inviteCode: string | null
following: any[]
followers: any[]

// Actions
joinCircle(inviteCode: string): Promise<boolean>
loadCircleData(): Promise<void>
followUser(userId: string): Promise<void>
unfollowUser(userId: string): Promise<void>
loadFollowing(): Promise<void>
```

## Bug Fixes Today

### 1. User Data Isolation
- **Issue**: Multiple users seeing each other's data
- **Fix**: Removed hardcoded test user ID, enforced authentication

### 2. Circle Members Not Loading
- **Issue**: RLS policy infinite recursion
- **Fix**: Simplified queries, handled null user_ids

### 3. Profile Data Missing
- **Issue**: Posts showing "Anonymous" instead of usernames
- **Fix**: Fixed profile joins in queries, handled snake_case/camelCase

### 4. Time Display
- **Issue**: Posts not showing correct timestamps
- **Fix**: Mapped `created_at` field correctly

### 5. Tab Positioning
- **Issue**: Tabs overlapping or positioned incorrectly on iOS
- **Fix**: Proper SafeArea handling and iOS-optimized spacing

## Test Data

### Test Circle
- **Name**: Test Circle
- **Invite Code**: TEST123
- **Members**: Can be managed via SQL

### SQL Utilities
Located in `/database/test_data/`:
- `create_test_circle.sql` - Creates test circle
- `test_join_circle.sql` - Tests join functionality

## Security Considerations

### RLS Policies
- Circles viewable by all (for future discovery)
- Circle members only visible to other members
- Users can only manage their own follows
- Posts properly filtered by visibility

### Data Validation
- Null user_id handling in circle_members
- Authentication required for all operations
- Proper error handling for missing profiles

## Next Steps

1. **Following System**
   - Create DiscoverUsersModal
   - Implement user search
   - Add follow/unfollow UI
   - Show following feed

2. **Enhancements**
   - Circle creation flow
   - Circle settings/management
   - Leave circle functionality
   - Circle admin features

3. **Social Features**
   - User profiles
   - Activity notifications
   - Direct messages
   - User search/discovery

## Known Issues

1. Comments not yet implemented in backend
2. Circle creation UI not built
3. Following feed needs implementation
4. No way to leave a circle yet
5. No circle admin management tools

## Testing Guide

### Manual Testing Steps
1. Sign up as new user
2. Join circle with code TEST123
3. Post to circle feed
4. View circle members
5. Sign in as different user
6. Verify data isolation
7. Test following (when implemented)

### Database Verification
```sql
-- Check user's circle
SELECT * FROM profiles WHERE id = 'USER_ID';

-- Check circle members
SELECT * FROM circle_members WHERE circle_id = 'CIRCLE_ID';

-- Check follows
SELECT * FROM follows WHERE follower_id = 'USER_ID';
```