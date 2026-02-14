# Circle Privacy System - Complete Solution

## Current Problems
1. Posts have `circle_id` but it's not being used for filtering
2. When fetching circle feeds, ALL posts from members are shown (regardless of which circle)
3. No way to post to multiple circles
4. No way to post to "All Circles" or "No Circles" (public only)

## Proposed Solution

### Privacy Options Structure
```typescript
type PostVisibility = {
  scope: 'private' | 'circles' | 'followers' | 'public';
  circleIds?: string[];  // Which circles to post to (if scope is 'circles')
}
```

### New Privacy Options:
1. **Private** - Only visible to you
2. **Selected Circles** - Choose specific circles (1 or more)
3. **All My Circles** - Post to every circle you're in
4. **Followers Only** - People who follow you, but NOT through circles
5. **Public** - Everyone on the platform

### Database Changes

#### Option 1: Junction Table (Recommended)
```sql
-- Keep existing circle_id for backward compatibility
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS visibility_scope VARCHAR(20) DEFAULT 'circles';

-- Create junction table for multi-circle posts
CREATE TABLE post_circles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, circle_id)
);

-- Index for fast lookups
CREATE INDEX idx_post_circles_post ON post_circles(post_id);
CREATE INDEX idx_post_circles_circle ON post_circles(circle_id);
```

#### Option 2: Array Field (Simpler but less flexible)
```sql
ALTER TABLE posts
ADD COLUMN circle_ids UUID[] DEFAULT '{}';

-- Index for array contains queries
CREATE INDEX idx_posts_circle_ids ON posts USING GIN(circle_ids);
```

### Feed Query Fix

#### Current (BROKEN):
```typescript
// Gets ALL posts from circle members, regardless of circle!
.in('user_id', memberIds)
```

#### Fixed Version:
```typescript
// For specific circle feed
const { data: posts } = await supabase
  .from('posts')
  .select('*')
  .or(`
    circle_id.eq.${circleId},
    id.in.(SELECT post_id FROM post_circles WHERE circle_id = '${circleId}')
  `)
  .order('created_at', { ascending: false });

// For "All Circles" feed
const { data: posts } = await supabase
  .from('posts')
  .select('*')
  .or(`
    circle_id.in.(${userCircleIds}),
    id.in.(SELECT post_id FROM post_circles WHERE circle_id IN (${userCircleIds}))
  `)
  .order('created_at', { ascending: false });
```

### UI Components

#### Privacy Selector for Posts
```tsx
<PrivacySelector>
  <Option value="private">🔒 Only Me</Option>
  <Option value="selected">⭕ Select Circles...</Option>
  <Option value="all-circles">🌐 All My Circles</Option>
  <Option value="followers">👥 Followers Only</Option>
  <Option value="public">🌍 Public</Option>
</PrivacySelector>

// If "Select Circles" chosen:
<CircleMultiSelect>
  {userCircles.map(circle => (
    <Checkbox key={circle.id}>
      {circle.emoji} {circle.name}
    </Checkbox>
  ))}
</CircleMultiSelect>
```

### Implementation Steps

1. **Add circle_id filtering to feeds** (URGENT FIX)
2. **Update post creation to set circle_id**
3. **Add multi-circle selection UI**
4. **Create post_circles junction table**
5. **Update feed queries for multi-circle support**

### Privacy Matrix

| Visibility | Who Can See | Use Case |
|-----------|------------|----------|
| Private | Only you | Personal notes, drafts |
| Specific Circles | Selected circle members only | Team updates, group-specific content |
| All Circles | Members of ALL your circles | General updates for all groups |
| Followers | People following you (not via circles) | Public updates for followers |
| Public | Everyone | Open content |

### Migration Path

1. **Phase 1**: Fix current bug (filter by circle_id)
2. **Phase 2**: Add "All Circles" option
3. **Phase 3**: Add multi-circle selection
4. **Phase 4**: Add public/followers-only options

### Backward Compatibility

- Keep `posts.circle_id` for single-circle posts
- Use `post_circles` for multi-circle posts
- Feed queries check both locations
- Existing posts remain in their original circles