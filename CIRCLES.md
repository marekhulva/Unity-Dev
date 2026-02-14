# Circles - Multi-Circle Membership Feature

## Overview
Enable users to join and participate in multiple circles simultaneously, with the ability to switch between them and post to selected circles.

## Current State
- Users can only be in ONE circle at a time (`profiles.circle_id`)
- Posts can only go to ONE circle (`posts.circle_id`)
- Users must create multiple accounts to participate in multiple circles

## Desired State

### Core Features

#### 1. Multiple Circle Memberships
- Users can join multiple circles
- `circle_members` table already supports this
- Each user has an "active circle" they're currently viewing
- Add `active_circle_id` to `profiles` table to track current view

#### 2. Circle Switching
- UI dropdown/selector to switch between circles user is member of
- Switching changes which circle's feed you see
- Switching changes default circle for new posts
- Remember last active circle per session

#### 3. Multi-Circle Posting
- When creating a post with "circle" visibility:
  - Show checkboxes for all circles user is member of
  - User can select one or multiple circles to post to
  - Option to post to ALL circles at once
- Create `post_circles` junction table to support posts in multiple circles

#### 4. Circle Privacy (IMPORTANT)
**Circles are completely separate communities:**
- Posts to Circle A are ONLY visible to Circle A members
- Posts to Circle B are ONLY visible to Circle B members
- No cross-circle visibility of posts
- User profiles might be visible across circles, but posts are isolated

### Privacy Settings (Unchanged)
Existing post privacy options remain:
- **Circle** = Only visible to members of selected circle(s)
- **Followers** = Visible to all followers + current circle members
- **Private** = Only visible to post author (for activities not shared)

## Use Cases

### Founder/Admin Use Case
- Founder is in multiple circles: "TEST123", "Jing", "Fitness Group"
- Can switch between circles to see different communities
- Can post updates to specific circles or all circles
- Example: Post workout update to "Fitness Group" only, post announcement to all circles

### Regular User Use Case
- User joins "Running Club" and "Book Club"
- Views Running Club feed most of the time
- Switches to Book Club on weekends
- Posts reading progress only to Book Club
- Posts race results only to Running Club

### Privacy Example
- User is in both "Fitness Circle" and "Startup Circle"
- Posts workout photo to Fitness Circle → Only Fitness Circle members see it
- Posts startup update to Startup Circle → Only Startup Circle members see it
- Posts personal milestone to both → Each circle sees it independently

## Technical Implementation

### Database Changes Required

#### 1. Modify `profiles` table
```sql
ALTER TABLE profiles
ADD COLUMN active_circle_id UUID REFERENCES circles(id) ON DELETE SET NULL;
```

#### 2. Create `post_circles` junction table
```sql
CREATE TABLE post_circles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, circle_id)
);
```

#### 3. Update `posts` table logic
- Keep `posts.circle_id` for backward compatibility and default circle
- Use `post_circles` table for multi-circle posts
- Feed queries check both `posts.circle_id` and `post_circles.circle_id`

### UI Changes Required

#### 1. Circle Switcher Component
**Location:** Top navigation or settings
- Dropdown showing all circles user is member of
- Current active circle highlighted
- Switching updates `profiles.active_circle_id`
- Refreshes feed to show new circle's posts

#### 2. Post Composer Updates
**When selecting "Circle" visibility:**
- Show list of circles user is member of
- Checkboxes to select target circle(s)
- Default: currently active circle pre-selected
- Option: "Post to all my circles"

#### 3. Feed Updates
**Circle Feed View:**
- Only show posts where:
  - `posts.circle_id = user's active_circle_id` OR
  - Post exists in `post_circles` for active_circle_id
- Respect existing privacy settings

### Backend Service Changes

#### 1. Feed Service (`feedService.ts`)
```typescript
// Update getCircleFeed to check post_circles table
const circlePosts = await supabase
  .from('posts')
  .select(`
    *,
    post_circles!inner(circle_id)
  `)
  .eq('post_circles.circle_id', activeCircleId)
  .order('created_at', { ascending: false });
```

#### 2. Post Creation Service (`postsService.ts`)
```typescript
// When creating post with circle visibility
async function createPost(postData, targetCircleIds) {
  // Create post
  const post = await supabase.from('posts').insert(postData);

  // If multiple circles, insert into post_circles
  if (targetCircleIds.length > 0) {
    await supabase.from('post_circles').insert(
      targetCircleIds.map(circleId => ({
        post_id: post.id,
        circle_id: circleId
      }))
    );
  }
}
```

#### 3. Profile Service
```typescript
// Get user's circles
async function getUserCircles(userId) {
  return await supabase
    .from('circle_members')
    .select('circles(*)')
    .eq('user_id', userId);
}

// Update active circle
async function setActiveCircle(userId, circleId) {
  return await supabase
    .from('profiles')
    .update({ active_circle_id: circleId })
    .eq('id', userId);
}
```

## Migration Strategy

### Phase 1: Database Setup
1. Run migration to add `active_circle_id` to profiles
2. Create `post_circles` table with RLS policies
3. Backfill `active_circle_id` with current `circle_id` for existing users

### Phase 2: Backend Updates
1. Update feed queries to check `post_circles`
2. Update post creation to support multiple circles
3. Add endpoints for circle switching
4. Update RLS policies

### Phase 3: UI Implementation
1. Add circle switcher component
2. Update post composer with circle selector
3. Update feed to use active circle
4. Test with multiple circles

### Phase 4: Testing
1. Test switching between circles
2. Test posting to single circle
3. Test posting to multiple circles
4. Verify privacy isolation between circles
5. Test with founder account joining 3+ circles

## Benefits

### For Users
- Join multiple communities without multiple accounts
- Better organize different aspects of life
- Maintain privacy boundaries between circles
- Seamless switching between communities

### For Founders/Admins
- Participate in all circles from one account
- Post announcements to multiple circles
- Monitor multiple communities
- Better community management

### For Platform
- Higher user engagement (more circles = more content)
- Better data for recommendations
- Clearer community boundaries
- Scalable architecture

## Future Enhancements (Not in Scope)

- Cross-circle discovery (suggest circles to join)
- Circle analytics (activity levels, growth)
- Circle-to-circle collaboration features
- Private vs. public circles
- Circle categories/tags
- Circle search functionality

## Questions to Resolve

1. Should there be a limit on how many circles a user can join?
2. Should users automatically join a default circle on signup?
3. What happens to `profiles.circle_id` - deprecate or keep for backward compatibility?
4. Should circle admins be able to remove members?
5. Should there be circle join requests/approvals?

## Status

**Current:** Planning/Design Phase
**Next Step:** Review and approve migration SQL
**Blocked By:** None
**Priority:** Medium (Nice to have, not critical)
