# 🌍 Explore & Discovery Feature

## Overview
Transform Unity 2.0 from a private goal tracker into a social platform with viral discovery potential, similar to Instagram's Explore page.

## Feature Description

### What is Explore?
A public feed where users can discover:
- Content from users they don't follow
- Trending challenges and goals
- Success stories and milestones
- New circles to join
- People with similar interests

### Why This Changes Everything

**Current State:** Private circles app (like WhatsApp)
**With Explore:** Social platform with growth potential (like Instagram)

## Visibility Hierarchy

```
🔒 Private         → Only me (drafts, personal notes)
⭕ Current Circle  → Specific circle members only
🌐 All My Circles  → All circles I'm in
👥 My Network      → Circles + individual followers
🌍 Everyone        → PUBLIC - Appear in Explore!
```

## Implementation Plan

### Phase 1: Foundation (Week 1)
- [ ] Add "public" visibility option to posts table
- [ ] Update privacy selector UI with "Everyone" option
- [ ] Create basic Explore tab/screen
- [ ] Show all public posts chronologically

### Phase 2: Discovery (Week 2)
- [ ] Add trending algorithm (reactions, comments, views)
- [ ] Implement categories (Fitness, Work, Creative, etc.)
- [ ] Add search functionality
- [ ] Create "Suggested People" section

### Phase 3: Engagement (Week 3)
- [ ] Success stories highlights
- [ ] Challenge leaderboards
- [ ] Location-based discovery
- [ ] Hashtag system

### Phase 4: Algorithm (Week 4)
- [ ] Personalized recommendations
- [ ] Similar users/goals matching
- [ ] Engagement-based ranking
- [ ] Time decay for freshness

## UI Design

### Main Navigation
```
[Daily] [Circles] [Explore] [Profile]
                      ↑ NEW
```

### Explore Screen Layout
```
┌─────────────────────────┐
│ 🔍 Search               │
├─────────────────────────┤
│ Trending Challenges 🔥  │
│ [75 Hard] [30 Day] ... │
├─────────────────────────┤
│ For You                 │
│ ┌─────────┬─────────┐  │
│ │ Post 1  │ Post 2  │  │
│ └─────────┴─────────┘  │
│ ┌─────────┬─────────┐  │
│ │ Post 3  │ Post 4  │  │
│ └─────────┴─────────┘  │
├─────────────────────────┤
│ Success Stories 🎉      │
│ • John: 100 day streak! │
│ • Sarah: Goal complete! │
├─────────────────────────┤
│ Discover Circles        │
│ [Join Basketball NYC]   │
│ [Join Morning Runners]  │
└─────────────────────────┘
```

## Database Changes

### Add to posts table
```sql
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trending_score FLOAT DEFAULT 0;

-- Index for explore queries
CREATE INDEX idx_posts_public_trending ON posts(visibility, trending_score DESC)
WHERE visibility = 'public';
```

### New table for explore metrics
```sql
CREATE TABLE post_metrics (
  post_id UUID PRIMARY KEY REFERENCES posts(id),
  view_count INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  engagement_rate FLOAT DEFAULT 0,
  trending_score FLOAT DEFAULT 0,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Algorithm Logic

### Trending Score Calculation
```typescript
function calculateTrendingScore(post) {
  const hoursSincePost = (Date.now() - post.created_at) / (1000 * 60 * 60);
  const engagement = post.reactions + (post.comments * 2) + (post.shares * 3);

  // Time decay factor (newer posts score higher)
  const timeDecay = Math.max(0, 1 - (hoursSincePost / 168)); // 1 week decay

  // Engagement velocity (engagement per hour)
  const velocity = engagement / Math.max(1, hoursSincePost);

  // Final score
  return (engagement * 0.3) + (velocity * 0.5) + (timeDecay * 0.2);
}
```

## Privacy Considerations

### Default Settings
- New users default to "My Network" for posts
- Explicit opt-in required for "Everyone" visibility
- Clear privacy indicators on all posts

### Safety Features
- Report inappropriate content
- Block/mute users
- Content moderation queue
- Community guidelines

## Success Metrics

### Key Performance Indicators
- Daily Active Users (DAU)
- Posts marked as "public" percentage
- Explore screen engagement time
- New follows from Explore
- Circle joins from Explore

### Target Metrics (First 3 Months)
- 30% of posts public
- 40% DAU visiting Explore
- 5 min average Explore session
- 20% of new follows from Explore

## Technical Implementation

### API Endpoints
```typescript
// Get explore feed
GET /api/explore/feed?category=trending&limit=20

// Get trending challenges
GET /api/explore/challenges

// Get success stories
GET /api/explore/success-stories

// Get suggested users
GET /api/explore/suggested-users
```

### State Management
```typescript
// New store slice
interface ExploreSlice {
  exploreFeed: Post[];
  trendingChallenges: Challenge[];
  suggestedUsers: User[];
  exploreCategory: 'trending' | 'recent' | 'following';

  fetchExploreFeed: () => Promise<void>;
  loadMoreExplore: () => Promise<void>;
}
```

## Competitive Analysis

### Instagram Explore
- Algorithm-based recommendations
- Grid layout
- Categories at top
- IGTV/Reels integration

### TikTok For You Page
- Single post focus
- Infinite scroll
- Heavy on algorithm
- Quick engagement

### Our Unique Angle
- Goal/challenge focused
- Progress celebrations
- Circle discovery
- Accountability emphasis

## Rollout Strategy

### Soft Launch (Week 1-2)
- Enable for 10% of users
- Monitor engagement metrics
- Gather feedback
- Fix critical issues

### Beta (Week 3-4)
- Expand to 50% of users
- A/B test layouts
- Optimize algorithm
- Add moderation tools

### Full Launch (Week 5)
- 100% availability
- Marketing campaign
- Influencer outreach
- Press release

## Future Enhancements

### Version 2.0
- Sponsored challenges
- Verified accounts
- Creator tools
- Analytics dashboard

### Version 3.0
- AI recommendations
- Live challenges
- Video posts
- Monetization

## Summary

The Explore feature transforms Unity 2.0 from a private goal-tracking app into a social platform with viral growth potential. By adding public visibility and discovery mechanisms, we create:

1. **User Growth** - New users find value immediately
2. **Engagement** - More reasons to open the app daily
3. **Community** - Connect beyond existing circles
4. **Virality** - Great content can spread organically
5. **Monetization** - Future sponsored content opportunities

This is THE feature that could make Unity 2.0 explode in popularity!