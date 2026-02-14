# API & Services Documentation

## Service Layer Architecture

### Overview
The app uses a layered service architecture to separate concerns and maintain clean code organization.

```
UI Components
     ↓
Zustand Store (State Management)
     ↓
Backend Service (Abstraction Layer)
     ↓
Supabase Service (Database Interface)
     ↓
Supabase Database (PostgreSQL)
```

## Core Services

### 1. supabase.service.ts
Primary database interface handling all Supabase operations.

#### Key Methods

##### Authentication
```typescript
signIn(email: string, password: string)
signUp(email: string, password: string, username: string, name: string)
signOut()
getCurrentUser()
```

##### User Profile
```typescript
getProfile(userId: string)
updateProfile(userId: string, updates: Partial<Profile>)
checkUsernameAvailability(username: string)
```

##### Goals Management
```typescript
createGoal(goal: GoalInput)
getUserGoals(userId: string)
updateGoal(goalId: string, updates: Partial<Goal>)
deleteGoal(goalId: string)
getGoalCompletionStats(userId: string)
```

##### Actions Management
```typescript
createAction(action: ActionInput)
getTodaysActions(userId: string)
completeAction(actionId: string)
uncompleteAction(actionId: string)
getActionsForDateRange(userId: string, startDate: string, endDate: string)
```

##### Consistency Calculations
```typescript
getOverallCompletionStats(userId: string)
// Returns: { expected: number, completed: number, percentage: number }

getGoalCompletionStats(userId: string)
// Returns: Map<goalId, { expected, completed, percentage }>
```

##### Social Features
```typescript
createPost(post: PostInput)
getPosts(filter: PostFilter)
deletePost(postId: string)
likePost(postId: string)
unlikePost(postId: string)
```

##### Circle Management
```typescript
createCircle(name: string)
joinCircle(joinCode: string)
getCircleMembers(circleId: string)
leaveCircle(circleId: string)
getCircleStats(circleId: string)
```

##### Daily Reviews
```typescript
saveDailyReview(review: DailyReviewInput)
getTodaysReview(userId: string, date: string)
getReviewHistory(userId: string, limit: number)
```

### 2. backend.service.ts
Abstraction layer providing a clean interface for the frontend.

```typescript
export const backendService = {
  // Wraps supabase.service methods
  // Adds error handling
  // Manages authentication state
  // Handles offline queue (future)
}
```

### 3. supabase.dailyReviews.service.ts
Specialized service for daily review operations.

```typescript
interface DailyReviewService {
  saveDailyReview(review: DailyReview): Promise<void>
  getTodaysReview(userId: string): Promise<DailyReview | null>
  getWeeklyReviews(userId: string): Promise<DailyReview[]>
  getReviewStreak(userId: string): Promise<number>
}
```

## State Management (Zustand)

### Store Slices

#### userSlice
```typescript
interface UserSlice {
  // State
  currentUser: User | null
  profile: Profile | null
  isAuthenticated: boolean

  // Actions
  setUser(user: User): void
  loadProfile(): Promise<void>
  updateProfile(updates: Partial<Profile>): Promise<void>
  logout(): void
}
```

#### dailySlice
```typescript
interface DailySlice {
  // State
  todaysActions: Action[]
  completionRate: number
  isLoading: boolean

  // Actions
  fetchDailyActions(): Promise<void>
  toggleAction(actionId: string): Promise<void>
  addAction(action: Action): Promise<void>
  refreshActions(): Promise<void>
}
```

#### goalsSlice
```typescript
interface GoalsSlice {
  // State
  goals: Goal[]
  activeGoals: Goal[]
  completionStats: Map<string, Stats>

  // Actions
  loadGoals(): Promise<void>
  createGoal(goal: GoalInput): Promise<void>
  updateGoal(id: string, updates: Partial<Goal>): Promise<void>
  calculateConsistency(): void
}
```

#### circleSlice
```typescript
interface CircleSlice {
  // State
  circleId: string | null
  circleName: string | null
  circleMembers: CircleMember[]
  leaderboard: LeaderboardEntry[]

  // Actions
  loadCircleData(): Promise<void>
  joinCircle(code: string): Promise<void>
  leaveCircle(): Promise<void>
  refreshLeaderboard(): Promise<void>
}
```

#### socialSlice
```typescript
interface SocialSlice {
  // State
  posts: Post[]
  isLoadingFeed: boolean
  hasMore: boolean

  // Actions
  loadFeed(page: number): Promise<void>
  createPost(content: string, media?: string[]): Promise<void>
  deletePost(postId: string): Promise<void>
  toggleLike(postId: string): Promise<void>
}
```

## API Response Formats

### Standard Success Response
```typescript
{
  data: T,
  error: null
}
```

### Standard Error Response
```typescript
{
  data: null,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### Pagination Response
```typescript
{
  data: T[],
  count: number,
  page: number,
  pageSize: number,
  hasMore: boolean
}
```

## Real-time Subscriptions

### Circle Updates
```typescript
supabase
  .channel('circle-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'circle_members',
    filter: `circle_id=eq.${circleId}`
  }, handleCircleUpdate)
  .subscribe()
```

### Social Feed
```typescript
supabase
  .channel('social-feed')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'posts'
  }, handleNewPost)
  .subscribe()
```

## Error Handling

### Error Codes
```typescript
enum ErrorCode {
  // Auth errors
  AUTH_INVALID_CREDENTIALS = 'auth/invalid-credentials',
  AUTH_USER_NOT_FOUND = 'auth/user-not-found',
  AUTH_SESSION_EXPIRED = 'auth/session-expired',

  // Database errors
  DB_PERMISSION_DENIED = '42501',
  DB_CONSTRAINT_VIOLATION = '23505',
  DB_NOT_FOUND = '404',

  // Business logic errors
  CIRCLE_ALREADY_MEMBER = 'circle/already-member',
  CIRCLE_NOT_FOUND = 'circle/not-found',
  GOAL_LIMIT_REACHED = 'goal/limit-reached'
}
```

### Error Handler
```typescript
export const handleError = (error: any): ErrorResponse => {
  console.error('[API Error]', error);

  if (error.code === '42501') {
    return {
      code: ErrorCode.DB_PERMISSION_DENIED,
      message: 'You do not have permission to perform this action'
    };
  }

  // Handle other errors...

  return {
    code: 'UNKNOWN',
    message: 'An unexpected error occurred'
  };
};
```

## Performance Optimizations

### Query Optimization
```typescript
// Bad: Multiple queries
const user = await getUser(userId);
const goals = await getUserGoals(userId);
const actions = await getUserActions(userId);

// Good: Single query with joins
const { data } = await supabase
  .from('profiles')
  .select(`
    *,
    goals (*),
    actions (*)
  `)
  .eq('id', userId)
  .single();
```

### Caching Strategy
```typescript
class CacheService {
  private cache = new Map();
  private ttl = 5 * 60 * 1000; // 5 minutes

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key: string, data: any) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.ttl
    });
  }
}
```

### Debouncing
```typescript
const debouncedSearch = debounce(async (query: string) => {
  const results = await searchActions(query);
  setSearchResults(results);
}, 300);
```

## Testing Utilities

### Mock Service
```typescript
export const mockSupabaseService = {
  async getProfile(userId: string) {
    return { id: userId, username: 'testuser', name: 'Test User' };
  },

  async getTodaysActions(userId: string) {
    return [
      { id: '1', title: 'Morning workout', completed: false },
      { id: '2', title: 'Read 10 pages', completed: true }
    ];
  }
  // ... other mocked methods
};
```

### Test Helpers
```typescript
export const createTestUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser'
});

export const createTestGoal = (overrides = {}) => ({
  id: 'test-goal-id',
  title: '75 HARD',
  user_id: 'test-user-id',
  created_at: new Date().toISOString(),
  ...overrides
});
```

## Migration Guide

### Adding a New Service Method
1. Define in supabase.service.ts
2. Add to backend.service.ts wrapper
3. Create Zustand action if needed
4. Update TypeScript interfaces
5. Add error handling
6. Document in this file

### Example: Adding Habit Tracking
```typescript
// 1. supabase.service.ts
async createHabit(habit: HabitInput) {
  const { data, error } = await supabase
    .from('habits')
    .insert(habit)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 2. backend.service.ts
createHabit: (habit: HabitInput) => {
  return handleApiCall(() => supabaseService.createHabit(habit));
}

// 3. habitsSlice.ts
createHabit: async (habit: HabitInput) => {
  set({ isCreating: true });
  try {
    const newHabit = await backendService.createHabit(habit);
    set(state => ({
      habits: [...state.habits, newHabit],
      isCreating: false
    }));
  } catch (error) {
    set({ isCreating: false });
    throw error;
  }
}
```

## Security Considerations

### Input Validation
```typescript
const validateActionInput = (action: ActionInput) => {
  if (!action.title || action.title.length < 1) {
    throw new Error('Title is required');
  }
  if (action.title.length > 200) {
    throw new Error('Title too long');
  }
  // Additional validation...
};
```

### SQL Injection Prevention
- Always use parameterized queries
- Never concatenate user input into SQL
- Use Supabase client methods

### XSS Prevention
```typescript
import DOMPurify from 'isomorphic-dompurify';

const sanitizeUserContent = (content: string) => {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: []
  });
};
```

## Monitoring & Logging

### Logging Strategy
```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  log(level: LogLevel, message: string, data?: any) {
    if (__DEV__ || level >= LogLevel.WARN) {
      console.log(`[${LogLevel[level]}] ${message}`, data);
    }

    // Send to analytics in production
    if (!__DEV__ && level >= LogLevel.ERROR) {
      analytics.track('error', { message, data });
    }
  }
}
```

### Performance Monitoring
```typescript
const measurePerformance = async (name: string, fn: Function) => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;

    analytics.track('performance', {
      operation: name,
      duration,
      success: true
    });

    return result;
  } catch (error) {
    const duration = performance.now() - start;

    analytics.track('performance', {
      operation: name,
      duration,
      success: false,
      error: error.message
    });

    throw error;
  }
};
```

## Quick Reference

### Common API Calls
| Action | Method | Endpoint |
|--------|--------|----------|
| Get user profile | `getProfile(userId)` | `/profiles?id=eq.{userId}` |
| Get today's actions | `getTodaysActions(userId)` | `/actions?user_id=eq.{userId}&date=eq.{today}` |
| Complete action | `completeAction(actionId)` | `/actions?id=eq.{actionId}` UPDATE |
| Get consistency | `getOverallCompletionStats(userId)` | `/action_completions` COUNT |
| Create post | `createPost(post)` | `/posts` INSERT |
| Join circle | `joinCircle(code)` | `/circles?join_code=eq.{code}` |

### Rate Limits
- API calls: 1000/hour per user
- File uploads: 100MB max
- Batch operations: 1000 records max

### Environment Variables
```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

Last Updated: September 23, 2025
Related: DATA_ARCHITECTURE.md, DATA_FLOW_DIAGRAMS.md