# Session Documentation - Consistency Score Fix & Data Flow

## Date: September 23, 2025

## Major Issues Fixed

### 1. Consistency Score Calculation Problem
**Issue**: Consistency scores were showing 0% even when users had completed actions.

**Root Cause**:
- The `action_completions` table existed but had permission errors (code: 42501)
- When querying this table failed, the system returned 0 completions
- Result: 0/expected = 0% consistency

**Initial Error**:
```
❌ [SUPABASE] Error logging completion:
Object { code: "42501", details: null, hint: null, message: "permission denied for table action_completions" }
```

### 2. Solution Implementation

#### A. Fixed Database Permissions
Created SQL migration to properly set up `action_completions` table:

```sql
-- Fix action_completions table and permissions
DROP TABLE IF EXISTS action_completions CASCADE;

CREATE TABLE action_completions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_action_completions_action_id ON action_completions(action_id);
CREATE INDEX idx_action_completions_user_id ON action_completions(user_id);
CREATE INDEX idx_action_completions_completed_at ON action_completions(completed_at);

-- Enable RLS
ALTER TABLE action_completions ENABLE ROW LEVEL SECURITY;

-- Create proper RLS policies
CREATE POLICY "Users can insert own completions" ON action_completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own completions" ON action_completions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions" ON action_completions
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON action_completions TO authenticated;

-- Populate with existing completion data
INSERT INTO action_completions (action_id, user_id, completed_at)
SELECT id, user_id, completed_at
FROM actions
WHERE completed = true
  AND completed_at IS NOT NULL
  AND completed_at::date = CURRENT_DATE
ON CONFLICT DO NOTHING;
```

#### B. Updated Code Files

**1. supabase.service.ts**
- `getGoalCompletionStats()`: Now properly queries `action_completions` table for cumulative data
- `getOverallCompletionStats()`: Fixed to use cumulative completions
- `completeAction()`: Already inserting into `action_completions` when action is marked complete

**2. ProfileClaude.tsx**
- Added import for `supabaseService`
- Added state: `goalCompletionStats`
- Added `useEffect` to fetch goal completion stats
- Replaced "perfect days" calculation with cumulative consistency from database
- Progress text now shows: "X/Y completed • Building habit"

**3. ProgressMVPEnhanced.tsx**
- Removed "Inspect Database" debug button
- Removed "Fix Missing Data" temporary button
- Cleaned up unused imports

## Data Flow Architecture

### 1. Database Tables

#### actions table
- Stores daily action items for users
- Fields: `id`, `user_id`, `goal_id`, `title`, `date`, `time`, `completed`, `completed_at`, `frequency`
- `completed`: Boolean for TODAY's status
- `completed_at`: Timestamp of LAST completion (overwrites on each completion)

#### action_completions table
- Stores HISTORICAL completion records
- Fields: `id`, `action_id`, `user_id`, `completed_at`, `created_at`
- One row inserted for EACH completion
- Provides cumulative history for consistency calculations

#### goals table
- Stores user goals
- Fields: `id`, `user_id`, `title`, `created_at`, `color`, `active`, `completed`

### 2. Consistency Calculation Formula

**Formula**: `Total Completions / Total Expected × 100`

**Example for 75 HARD Challenge (5 days old)**:
- Actions per day: 6
- Days since creation: 5
- Expected completions: 6 × 5 = 30
- Actual completions (from action_completions): 10
- Consistency: 10/30 = 33%

### 3. Data Flow for Action Completion

```
User checks off action in Daily page
    ↓
dailySlice.toggleAction(id)
    ↓
backendService.completeAction(id)
    ↓
supabaseService.completeAction(id)
    ↓
1. INSERT into action_completions (creates historical record)
2. UPDATE actions SET completed = true, completed_at = NOW()
    ↓
Action marked complete + history preserved
```

### 4. Data Flow for Consistency Display

```
Progress/Profile Page loads
    ↓
useEffect calls supabaseService.getGoalCompletionStats(userId)
    ↓
For each goal:
  - Calculate days since goal.created_at
  - Count actions linked to goal
  - Expected = actions × days
  - Query action_completions for actual count
  - Percentage = actual/expected × 100
    ↓
Returns stats object: { goalId: { expected, completed, percentage } }
    ↓
Component displays consistency %
```

## Key Services & Components

### Backend Services
- **supabaseService.ts**: Main interface to Supabase database
  - `completeAction()`: Marks action complete + logs to history
  - `getGoalCompletionStats()`: Calculates per-goal consistency
  - `getOverallCompletionStats()`: Calculates overall consistency
  - `getTodaysCompletedActions()`: Gets today's completed actions

- **backendService.ts**: Wrapper around supabaseService
  - Provides abstraction layer
  - Handles authentication checks

### State Management (Zustand)
- **dailySlice.ts**: Manages daily actions state
  - `toggleAction()`: Handles action completion
  - `fetchDailyActions()`: Loads actions for today

- **goalsSlice.ts**: Manages goals state
  - Stores user goals
  - Provides goal CRUD operations

### UI Components
- **ProgressMVPEnhanced.tsx**: Progress tab showing consistency metrics
- **ProfileClaude.tsx**: Profile page with goal consistency display
- **CircleScreen.tsx**: Group leaderboard (still needs fixing)
- **DailyScreen.tsx**: Daily actions checklist

## Testing & Verification

### How to Test Consistency:
1. Complete actions throughout multiple days
2. Check Progress page - should show cumulative %
3. Check Profile page - should match Progress page
4. Formula verification: completed_count / (actions_per_day × days_since_creation)

### Console Logs for Debugging:
- `📊 [SUPABASE] Fetching goal completion stats`
- `📊 Goal "X": Y/Z = N%`
- `✅ [SUPABASE] Completion logged in action_completions table`

## Remaining Work

### Circle Page Fix (In Progress)
The Circle page currently uses a different calculation method (last 30 days of individual tasks). Needs to be updated to use the same cumulative consistency from `action_completions` table.

## Important Notes

1. **Data Persistence**: The `action_completions` table is the source of truth for historical data
2. **Daily Reset**: Actions reset daily based on the `date` field, not `completed_at`
3. **Cumulative Nature**: Consistency accumulates over time - it's not a daily snapshot
4. **Performance**: Indexes on `action_completions` ensure fast queries even with large datasets

## Development Commands

```bash
# Start dev server
PORT=8050 npx expo start --web --port 8050

# Database migration
# Run in Supabase SQL Editor - see full SQL above

# Git workflow
git add -A && git commit -m "Fix consistency calculation using action_completions table" && git push origin circle-view-tabs
```

## Files Modified in This Session

1. `/src/services/supabase.service.ts` - Fixed consistency calculations
2. `/src/features/profile/ProfileClaude.tsx` - Updated to use cumulative consistency
3. `/src/features/progress/ProgressMVPEnhanced.tsx` - Removed debug buttons
4. `/fix_action_completions.sql` - Database migration script (created)

## Next Steps

1. Fix Circle page consistency calculation
2. Document complete data flow diagram
3. Create data catalog of all tables and fields
4. Map frontend-backend connections
5. Document API endpoints and data transformations