# Complete Visibility System Analysis

## 🚨 CRITICAL PRIVACY ISSUES FOUND

### 1. Profile Posts Have NO Privacy
**Problem**: When viewing someone's profile, ALL their posts are shown regardless of visibility settings!
```typescript
// Current getUserPosts - shows EVERYTHING!
.eq('user_id', userId)  // No visibility filtering!
```

**Impact**: Private and circle-only posts are exposed on profiles to anyone!

### 2. Circle Posts Leak Across Circles (FIXED)
**Problem**: Posts appeared in ALL circles, not just the one they were posted to
**Solution Applied**: Now filtering by `circle_id` in feed queries

### 3. Posts Created Without Circle Context
**Problem**: Posts weren't being tagged with which circle they belong to
**Solution Applied**: Now using `activeCircleId` when creating posts

## Current System Overview

### Visibility Options

| Type | Current Behavior | Who Sees It |
|------|-----------------|-------------|
| **Private** | Only visible to poster | Just you |
| **Circle** | Visible to specific circle | Members of the circle you posted to |
| **Followers** | Visible to individual followers | People who follow YOU (not circles) |
| **Public** | Not implemented | Would be everyone |

### The "Follows" System
- **Separate from Circles**: Following is person-to-person, not through circles
- **Table**: `follows` with `follower_id` and `following_id`
- **Used for**: "Followers" visibility option
- **NOT tied to circle membership**

### How It Currently Works

#### When Posting:
1. User selects visibility: Private, Circle, or Followers
2. If "Circle", post goes to currently active circle
3. If "Followers", post visible to individual followers (NOT circle members)
4. Post is created with `circle_id` (if circle visibility)

#### When Viewing Feeds:
1. **Circle Tab**: Shows posts from that specific circle only
2. **All Circles**: Shows posts from ALL your circles combined
3. **Following Tab**: Shows posts from people you individually follow

#### When Viewing Profiles:
**🚨 BROKEN**: Shows ALL posts regardless of privacy!

## What Users Actually Want

Based on your feedback, users want:

### 1. Multi-Circle Posting
```
"Can we make an efficient way to select multiple circles?"
```
- Post once, appear in multiple circles
- Choose specific circles or "All My Circles"

### 2. Followers Should Include Circle Members
```
"Followers should let everyone in your circles see your posts, not just followers"
```
- "Followers" is confusing - should include all circle members
- Maybe rename to "My Network" or "All Connections"

### 3. Clear Profile Privacy
```
"How are we handling who can see what on profiles?"
```
- Need clear rules for profile visibility
- Respect post privacy settings

## Proposed Solution

### New Visibility Options

```typescript
type PostVisibility = {
  scope: 'private' | 'selected_circles' | 'my_network' | 'public';
  circles?: string[];  // Which specific circles (if selected_circles)
}
```

1. **🔒 Private** - Only you
2. **⭕ Selected Circles** - Choose one or more specific circles
3. **🌐 My Network** - All your circles + individual followers
4. **🌍 Public** - Everyone on platform

### Database Changes

#### Option A: Junction Table (Flexible)
```sql
CREATE TABLE post_circles (
  post_id UUID REFERENCES posts(id),
  circle_id UUID REFERENCES circles(id),
  PRIMARY KEY (post_id, circle_id)
);
```

#### Option B: Array Column (Simpler)
```sql
ALTER TABLE posts
ADD COLUMN circle_ids UUID[] DEFAULT '{}';
```

### UI Changes

#### Post Creation:
```
┌─────────────────────────┐
│ Who can see this?       │
├─────────────────────────┤
│ 🔒 Only Me              │
│ ⭕ Select Circles... ▼  │
│   □ Basketball          │
│   □ Work Team          │
│   □ Fitness Group      │
│ 🌐 My Entire Network    │
│ 🌍 Public               │
└─────────────────────────┘
```

#### Profile Viewing:
```typescript
// Fix getUserPosts to respect privacy
async getUserPosts(userId: string, viewerId: string) {
  // Get relationship between viewer and profile owner
  const canSeePrivate = userId === viewerId;
  const isFollowing = await this.checkFollowing(viewerId, userId);
  const sharedCircles = await this.getSharedCircles(viewerId, userId);

  // Build visibility conditions
  let visibilityFilter = "visibility.eq.public";
  if (canSeePrivate) {
    visibilityFilter = "*"; // See everything if own profile
  } else if (isFollowing) {
    visibilityFilter += ",visibility.eq.followers";
  }
  if (sharedCircles.length > 0) {
    visibilityFilter += `,circle_id.in.(${sharedCircles})`;
  }

  return await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .or(visibilityFilter);
}
```

### Implementation Priority

1. **URGENT: Fix Profile Privacy**
   - getUserPosts must filter by visibility
   - Only show posts viewer has permission to see

2. **HIGH: Rename/Clarify "Followers"**
   - Change to "My Network" or similar
   - Include both followers AND circle members

3. **MEDIUM: Multi-Circle Selection**
   - Add circle selector UI
   - Support posting to multiple circles

4. **LOW: Public Posts**
   - Add public visibility option
   - Create discover/explore feed

## Migration Path

### Phase 1: Fix Critical Issues (NOW)
```sql
-- Fix profile post visibility
CREATE OR REPLACE FUNCTION get_user_posts(
  target_user_id UUID,
  viewer_user_id UUID
) RETURNS SETOF posts AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM posts
  WHERE user_id = target_user_id
  AND (
    -- Own posts
    user_id = viewer_user_id
    -- Public posts
    OR visibility = 'public'
    -- Follower posts if following
    OR (visibility = 'followers' AND EXISTS (
      SELECT 1 FROM follows
      WHERE follower_id = viewer_user_id
      AND following_id = target_user_id
    ))
    -- Circle posts if in same circle
    OR (visibility = 'circle' AND circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = viewer_user_id
      INTERSECT
      SELECT circle_id FROM circle_members
      WHERE user_id = target_user_id
    ))
  );
END;
$$ LANGUAGE plpgsql;
```

### Phase 2: Improve UX
- Rename "Followers" to "My Network"
- Add "All My Circles" option
- Improve circle selector UI

### Phase 3: Advanced Features
- Multi-circle posting
- Public feed
- Circle discovery

## Summary of Required Changes

### Immediate Fixes:
1. ✅ Filter posts by circle_id in feeds (DONE)
2. ✅ Add circle_id when creating posts (DONE)
3. ❌ Fix getUserPosts to respect visibility (CRITICAL)
4. ❌ Clarify "Followers" vs "Circle Members" confusion

### Enhancements:
1. Multi-circle posting UI
2. "My Network" visibility (circles + followers)
3. Profile visibility rules
4. Public posts option

### Questions to Answer:
1. Should "Followers" include circle members?
2. Should profiles show different posts based on viewer?
3. How to handle cross-posting to multiple circles?
4. Should we have a "Public" option?