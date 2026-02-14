# Data Architecture Documentation

## Overview
This document outlines the data architecture for the Challenge Implementation app, covering data storage, flow, and analytics capabilities for scalable growth.

## 1. Technology Stack

### Backend Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage (for future media uploads)
- **API**: RESTful via Supabase client

### Frontend Stack
- **Framework**: React Native (Expo)
- **State Management**: Zustand
- **Data Fetching**: Supabase JS Client
- **Local Storage**: AsyncStorage (for offline capabilities)

## 2. Database Schema

### Core Tables

#### auth.users (Supabase Auth)
- **Purpose**: User authentication and identity
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `email` - User email
  - `created_at` - Registration timestamp
  - `last_sign_in_at` - Last login

#### profiles
- **Purpose**: Extended user information
- **Key Fields**:
  - `id` (UUID) - Links to auth.users.id
  - `username` - Unique username
  - `name` - Display name
  - `bio` - User biography
  - `created_at` - Profile creation
  - `updated_at` - Last update
- **Relationships**: 1:1 with auth.users

#### goals
- **Purpose**: User goals/challenges
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `user_id` - Owner of goal
  - `title` - Goal name (e.g., "75 HARD")
  - `created_at` - Start date for calculations
  - `color` - UI display color
  - `active` - Is goal currently active
  - `completed` - Has goal been completed
- **Relationships**: Many:1 with users

#### actions
- **Purpose**: Daily action items
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `user_id` - Owner of action
  - `goal_id` - Associated goal (nullable)
  - `title` - Action description
  - `date` - Scheduled date (YYYY-MM-DD)
  - `time` - Scheduled time
  - `completed` - Completion status for today
  - `completed_at` - Last completion timestamp
  - `frequency` - How often action repeats
  - `challenge_id` - Associated challenge
  - `created_at` - Creation timestamp
- **Relationships**:
  - Many:1 with users
  - Many:1 with goals (optional)
  - Many:1 with challenges (optional)

#### action_completions
- **Purpose**: Historical record of all completions
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `action_id` - Which action was completed
  - `user_id` - Who completed it
  - `completed_at` - When it was completed
  - `created_at` - Record creation
- **Relationships**:
  - Many:1 with actions
  - Many:1 with users
- **Important**: This is the source of truth for consistency calculations

#### circles
- **Purpose**: Social accountability groups
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `name` - Circle name
  - `join_code` - Unique code to join
  - `created_by` - Creator user ID
  - `created_at` - Creation timestamp
- **Relationships**: Many:Many with users via circle_members

#### circle_members
- **Purpose**: Junction table for circle membership
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `circle_id` - Which circle
  - `user_id` - Which user
  - `joined_at` - When they joined
- **Relationships**:
  - Many:1 with circles
  - Many:1 with users

#### posts
- **Purpose**: Social feed content
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `user_id` - Author
  - `content` - Post text
  - `media_urls` - Array of media URLs
  - `privacy` - public/circle/private
  - `circle_id` - If circle-only post
  - `created_at` - Post timestamp
- **Relationships**:
  - Many:1 with users
  - Many:1 with circles (optional)

#### daily_reviews
- **Purpose**: End-of-day reflections
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `user_id` - Review author
  - `date` - Review date
  - `biggest_win` - Text field
  - `biggest_challenge` - Text field
  - `lesson_learned` - Text field
  - `energy_level` - 1-10 scale
  - `mood` - Emoji/text
  - `created_at` - Submission time
- **Relationships**: Many:1 with users

#### challenges
- **Purpose**: Predefined challenge templates
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `title` - Challenge name
  - `description` - Challenge details
  - `duration_days` - Length of challenge
  - `tasks` - JSON array of daily tasks
  - `created_at` - Template creation
- **Relationships**: 1:Many with actions

## 3. Data Flow Patterns

### User Registration Flow
```
1. User signs up via Supabase Auth
   ↓
2. Auth trigger creates profile record
   ↓
3. User completes profile setup
   ↓
4. Profile data saved to profiles table
```

### Daily Action Completion Flow
```
1. User checks action in Daily screen
   ↓
2. Frontend: dailySlice.toggleAction()
   ↓
3. Backend: supabaseService.completeAction()
   ↓
4. Database operations:
   a. INSERT into action_completions (historical record)
   b. UPDATE actions SET completed=true, completed_at=NOW()
   ↓
5. Frontend state updated
   ↓
6. Consistency % recalculated across app
```

### Consistency Calculation Flow
```
1. Component requests consistency data
   ↓
2. supabaseService.getGoalCompletionStats()
   ↓
3. For each goal:
   - Calculate days since created_at
   - Count linked actions
   - Expected = actions × days
   - Query action_completions for actual count
   - Percentage = (actual/expected) × 100
   ↓
4. Return aggregated statistics
```

### Social Feed Flow
```
1. User creates post
   ↓
2. Post saved to posts table
   ↓
3. Real-time subscription notifies followers
   ↓
4. Feed updates automatically
```

## 4. Service Layer Architecture

### Core Services

#### supabase.service.ts
- **Purpose**: Main database interface
- **Key Methods**:
  - `completeAction()` - Mark action complete
  - `getGoalCompletionStats()` - Calculate consistency
  - `getTodaysActions()` - Fetch daily tasks
  - `createPost()` - Social posting

#### backend.service.ts
- **Purpose**: Abstraction layer over Supabase
- **Benefits**:
  - Easier to mock for testing
  - Can switch backends if needed
  - Centralized error handling

#### supabase.dailyReviews.service.ts
- **Purpose**: Daily review operations
- **Methods**:
  - `saveDailyReview()` - Store review
  - `getTodaysReview()` - Fetch existing
  - `getReviewHistory()` - Historical data

### State Management (Zustand)

#### Store Structure
```
rootStore/
├── userSlice - User profile & auth
├── dailySlice - Daily actions & completion
├── goalsSlice - Goal management
├── circleSlice - Circle membership
├── socialSlice - Social feed
└── analyticsSlice - Usage metrics
```

## 5. Analytics & Monitoring

### Current Analytics Points
1. **User Engagement**
   - Daily active users (via action completions)
   - Consistency percentages
   - Circle participation

2. **Performance Metrics**
   - Action completion rates
   - Goal achievement rates
   - Social interaction metrics

### Future Analytics Implementation
```javascript
// Example analytics event structure
analytics.track('action_completed', {
  user_id: userId,
  action_id: actionId,
  goal_id: goalId,
  consistency_before: 65,
  consistency_after: 67,
  timestamp: new Date()
});
```

### Recommended Analytics Tools
1. **Mixpanel** - User behavior analytics
2. **Sentry** - Error tracking
3. **LogRocket** - Session replay
4. **Supabase Dashboard** - Database metrics

## 6. Security & Privacy

### Row Level Security (RLS)
All tables have RLS enabled with policies:
- Users can only see their own data
- Circle members can see circle data
- Public posts visible to all authenticated users

### Data Privacy
- Personal data encrypted at rest
- HTTPS for all API calls
- JWT tokens for authentication
- Refresh tokens rotate regularly

## 7. Scaling Considerations

### Database Optimization
1. **Indexes** on frequently queried columns:
   - `action_completions(user_id, completed_at)`
   - `actions(user_id, date)`
   - `posts(created_at, privacy)`

2. **Query Optimization**:
   - Use database views for complex queries
   - Implement caching for consistency calculations
   - Batch operations where possible

### Performance Patterns
1. **Lazy Loading**: Load data as needed
2. **Pagination**: Limit query results
3. **Caching**: Store frequently accessed data
4. **Debouncing**: Prevent excessive API calls

## 8. Deployment & Environments

### Current Setup
- **Development**: Local Expo development
- **Database**: Supabase cloud (single project)
- **Version Control**: Git with feature branches

### Recommended Multi-Environment Setup
```
Development → Staging → Production
    ↓           ↓           ↓
Supabase    Supabase    Supabase
  Dev         Stage       Prod
```

## 9. Backup & Recovery

### Current Backup Strategy
- Supabase automatic daily backups
- Point-in-time recovery available

### Recommended Additions
1. Export critical data weekly
2. Test restore procedures monthly
3. Document recovery runbooks

## 10. Feature Addition Workflow

### Adding a New Feature
1. **Database Changes**:
   - Create migration script
   - Update RLS policies
   - Add indexes if needed

2. **Backend Updates**:
   - Add service methods
   - Update types/interfaces
   - Handle errors gracefully

3. **Frontend Integration**:
   - Create/update Zustand slice
   - Build UI components
   - Connect to services

4. **Testing**:
   - Test locally
   - Verify RLS policies
   - Check performance impact

### Example: Adding a "Habits" Feature
```sql
-- 1. Database migration
CREATE TABLE habits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  frequency TEXT, -- daily/weekly/monthly
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add RLS
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own habits" ON habits
  FOR ALL USING (auth.uid() = user_id);
```

```typescript
// 3. Service layer
export const habitsService = {
  async createHabit(habit: Habit) {
    return supabase.from('habits').insert(habit);
  },
  async getUserHabits(userId: string) {
    return supabase.from('habits')
      .select('*')
      .eq('user_id', userId);
  }
};
```

## 11. Monitoring Checklist

### Daily Monitoring
- [ ] Check error logs in Supabase
- [ ] Monitor API response times
- [ ] Review user sign-ups
- [ ] Check consistency calculation performance

### Weekly Review
- [ ] Database size growth
- [ ] Query performance metrics
- [ ] User engagement trends
- [ ] Error rate patterns

### Monthly Tasks
- [ ] Review and optimize slow queries
- [ ] Update documentation
- [ ] Security audit
- [ ] Backup verification

## 12. Quick Reference

### Key Formulas
- **Consistency**: `(completed_actions / expected_actions) × 100`
- **Expected Actions**: `actions_per_day × days_since_goal_created`
- **Streak**: Consecutive days with 100% completion

### Important Files
- `/src/services/supabase.service.ts` - Main DB interface
- `/src/state/rootStore.ts` - State management
- `/supabase/migrations/` - Database changes
- `/DATA_ARCHITECTURE.md` - This document
- `/sess.md` - Session-specific changes

### Common Issues & Solutions
1. **Consistency showing 0%**: Check action_completions permissions
2. **Actions not persisting**: Verify RLS policies
3. **Circle not loading**: Check circle_members join

## 13. Contact & Support

### Development Team
- Database issues: Check Supabase dashboard
- Frontend bugs: Console logs + Expo debugger
- State issues: Redux DevTools for Zustand

### External Resources
- [Supabase Docs](https://supabase.com/docs)
- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)

---

Last Updated: September 23, 2025
Version: 1.0.0