# Supabase Cost Optimization Guide

## Current Issues Causing High Egress

1. **Multiple API calls on every page load**
   - Goals fetch
   - Actions fetch
   - Completed actions fetch
   - Circle members fetch
   - Feed fetch
   - Challenges fetch
   - Each challenge's activities (N+1 problem)

2. **No persistent caching**
   - Only using in-memory cache that clears on refresh
   - No localStorage/AsyncStorage usage

3. **Duplicate calls**
   - Same data fetched multiple times
   - No debouncing on rapid navigation

## Immediate Optimizations

### 1. Batch Queries with Joins
```sql
-- Instead of N+1 queries, use single query with join
SELECT 
  c.*,
  json_agg(ca.*) as activities
FROM challenges c
LEFT JOIN challenge_activities ca ON ca.challenge_id = c.id
WHERE c.circle_id = $1
GROUP BY c.id;
```

### 2. Implement Proper Caching
```typescript
// Add to your services
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedData(key: string) {
  const cached = await AsyncStorage.getItem(key);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  }
  return null;
}

async function setCachedData(key: string, data: any) {
  await AsyncStorage.setItem(key, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
}
```

### 3. Reduce Image Egress
```typescript
// Implement image caching
import FastImage from 'react-native-fast-image';

// Use instead of regular Image component
<FastImage
  source={{ 
    uri: imageUrl,
    priority: FastImage.priority.normal,
    cache: FastImage.cacheControl.immutable
  }}
/>
```

### 4. Optimize Realtime Subscriptions
```typescript
// Only subscribe to what you need
const subscription = supabase
  .channel('custom-filter')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'posts',
    filter: `circle_id=eq.${circleId}` // Filter server-side!
  }, handleNewPost)
  .subscribe();
```

### 5. Use RPC for Complex Queries
```sql
-- Create a Postgres function
CREATE OR REPLACE FUNCTION get_circle_dashboard(p_circle_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'challenges', (SELECT json_agg(c.*) FROM challenges c WHERE circle_id = p_circle_id),
    'members', (SELECT json_agg(m.*) FROM circle_members m WHERE circle_id = p_circle_id),
    'recent_posts', (SELECT json_agg(p.*) FROM posts p WHERE circle_id = p_circle_id LIMIT 10)
  );
END;
$$ LANGUAGE plpgsql;

-- Call once instead of 3 separate calls
const { data } = await supabase.rpc('get_circle_dashboard', { p_circle_id: circleId });
```

## Estimated Savings

### Current (per user per day):
- ~500 API calls × 50 users = 25,000 calls/day
- ~50MB egress per user = 2.5GB/day

### After Optimization:
- ~50 API calls × 50 users = 2,500 calls/day (90% reduction)
- ~5MB egress per user = 250MB/day (90% reduction)

## Quick Implementation Priority

1. **TODAY**: Add AsyncStorage caching (1 hour work)
2. **THIS WEEK**: Batch queries with joins (2 hours work)
3. **THIS WEEK**: Add image caching (1 hour work)
4. **LATER**: Create RPC functions for complex queries
5. **LATER**: Implement proper pagination

## Monitor Usage

```sql
-- Run this in Supabase SQL editor to check usage patterns
SELECT 
  date_trunc('hour', created_at) as hour,
  count(*) as requests,
  sum(response_size_bytes)/1024/1024 as mb_egress
FROM edge_logs
WHERE created_at > now() - interval '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```