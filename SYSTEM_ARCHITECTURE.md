# System Architecture & Data Catalog
Created: 2025-01-21

## 🏗️ SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
├─────────────────────────────────────────────────────────────┤
│  React Native (Expo)                                         │
│  ├── UI Components (Progress, Daily, Social, etc.)          │
│  ├── State Management (Zustand)                             │
│  └── Service Layer                                          │
├─────────────────────────────────────────────────────────────┤
│                      BACKEND SERVICE                         │
├─────────────────────────────────────────────────────────────┤
│  Backend Service (backend.service.ts)                       │
│  ├── Supabase Service (supabase.service.ts)                │
│  └── API Service (api.service.ts) - NOT USED                │
├─────────────────────────────────────────────────────────────┤
│                         DATABASE                             │
├─────────────────────────────────────────────────────────────┤
│  Supabase PostgreSQL                                        │
│  └── Tables: actions, goals, profiles, etc.                 │
└─────────────────────────────────────────────────────────────┘
```

## 📊 DATABASE CATALOG

### VERIFIED TABLES (From Error Messages & Code)

#### ✅ Table: `actions`
**Status**: EXISTS (verified from console - no errors when querying)
```sql
CREATE TABLE actions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    title VARCHAR(255),
    goal_id UUID REFERENCES goals(id),
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,  -- When it was completed
    created_at TIMESTAMP DEFAULT NOW(),
    time VARCHAR(10),  -- Time of day (e.g., "09:00")
    -- Other fields unknown
);
```

#### ✅ Table: `goals`
**Status**: EXISTS (verified - data returned)
```sql
CREATE TABLE goals (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    title VARCHAR(255),
    metric VARCHAR(255),
    deadline DATE,
    category VARCHAR(50),
    color VARCHAR(7),
    why TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### ✅ Table: `profiles`
**Status**: EXISTS (verified - profile data returned)
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users,
    username VARCHAR(50),
    display_name VARCHAR(100),
    has_avatar BOOLEAN DEFAULT false,
    avatar_type VARCHAR(20),
    circle_id VARCHAR(20),
    -- Other fields
);
```

#### ❌ Table: `daily_actions`
**Status**: DOES NOT EXIST
- Error: "Could not find the table 'public.daily_actions' in the schema cache"
- This was a mistake in the code - doesn't exist!

## 🔌 API ENDPOINTS & DATA FLOW

### 1. GOALS DATA FLOW

```
UI Component (ProgressMVPEnhanced.tsx)
    ↓
useStore().fetchGoals()  [goalsSlice.ts:177120]
    ↓
backend.getGoals()  [backend.service.ts:160917]
    ↓
supabaseService.getGoals()  [supabase.service.ts:162455]
    ↓
supabase.from('goals').select('*').eq('user_id', user.id)
    ↓
Returns: Goal[] with consistency: 0, status: 'On Track'
```

### 2. ACTIONS DATA FLOW

```
UI Component (ProgressMVPEnhanced.tsx)
    ↓
useStore().fetchDailyActions()  [actionsSlice.ts:176715]
    ↓
backend.getDailyActions()  [backend.service.ts:160981]
    ↓
supabaseService.getDailyActions()  [supabase.service.ts:245]
    ↓
supabase.from('actions')
    .select('*, goal:goals(id, title, color)')
    .eq('user_id', user.id)
    ↓
Transform: action.completed = (completed_at >= TODAY)  [Line 278]
    ↓
Returns: Action[] with completed MODIFIED to today only!
```

### 3. COMPLETION DATA FLOW

```
User clicks checkbox
    ↓
useStore().completeAction(id)
    ↓
backend.completeAction(id)
    ↓
supabaseService.completeAction(id)  [Line 348]
    ↓
supabase.from('actions')
    .update({
        completed: true,
        completed_at: new Date().toISOString()
    })
```

## 🔍 CRITICAL DATA TRANSFORMATIONS

### Transform 1: getDailyActions() - Line 277-286
```typescript
// STRIPS HISTORICAL COMPLETION DATA!
const completedToday = action.completed_at && new Date(action.completed_at) >= today;
return {
    ...action,
    completed: completedToday,  // ← OVERRIDES original value
    completedAt: action.completed_at  // ← Should preserve timestamp
}
```

### Transform 2: Field Name Mapping
```
Database → Frontend
completed_at → completedAt (camelCase)
goal_id → goalId
user_id → userId
```

## 🐛 IDENTIFIED ISSUES

### Issue 1: Missing completed_at Data
**Evidence**: Console shows all actions have `completed_at: undefined`
**Possible Causes**:
1. Data was never saved (completion not working)
2. Field not included in SELECT query
3. Field name mismatch
4. Data exists but not for this user

### Issue 2: Field Override
**Location**: getDailyActions() Line 281
**Problem**: `completed` field overridden to TODAY only
**Impact**: Historical completion status lost

### Issue 3: Inconsistent Field Access
**In UI**: Checking both `completed_at` and `completedAt`
**Reality**: Neither exists in the data!

## 🎯 VERIFICATION STEPS NEEDED

### 1. Verify Database Schema
```sql
-- Check if actions table has completed_at column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'actions';
```

### 2. Check Raw Database Data
```sql
-- Check if ANY actions have completed_at values
SELECT id, title, completed, completed_at
FROM actions
WHERE user_id = 'bcd3d06b-b74d-4b6b-8b53-5e4249828a2a'
LIMIT 10;
```

### 3. Verify SELECT Query
Need to check if `completed_at` is being selected:
- Line 249-255 in supabase.service.ts
- Uses `select('*')` so should include all fields

### 4. Check Supabase RLS Policies
```sql
-- Check if RLS is blocking completed_at field
SELECT * FROM pg_policies WHERE tablename = 'actions';
```

## 📋 ACTION PLAN

1. **IMMEDIATE**: Add logging to see raw DB response
```typescript
// In getDailyActions, after line 260
console.log('RAW DB RESPONSE:', JSON.stringify(data, null, 2));
```

2. **CHECK**: Verify completed_at exists in database
- Use Supabase dashboard SQL editor
- Run queries above

3. **FIX OPTIONS**:

**Option A**: Stop overriding `completed` field
```typescript
// Don't modify completed field for Progress page
return {
    ...action,
    completed: action.completed,  // Keep original
    completedToday: completedToday,  // New field for Daily page
    completedAt: action.completed_at
}
```

**Option B**: Create separate fetch for Progress page
```typescript
// New function: getActionsWithHistory()
// Doesn't modify completed field
```

**Option C**: Fix data population
- If completed_at is NULL for all records
- Need to populate historical data
- Fix button needs to work

## 🔴 CURRENT STATUS

**User**: JHJH (display_name: "jhjh")
**Email**: gnbhg@uhjkg.com
**User ID**: bcd3d06b-b74d-4b6b-8b53-5e4249828a2a

**Actions**: 6 total
- Strength Training (Goal: Spotify)
- Yoga/Stretching (Goal: Jing)
- Journaling (Goal: Jing)
- Sitting Meditation (Goal: Jing)
- Standing Meditation (Goal: Jing)
- Breathwork (Goal: Jing)

**Problem**: ALL show `completed_at: undefined`

**Theory**: Either:
1. Database has no completed_at values (never saved)
2. Field not being returned from Supabase
3. Field name mismatch in transformation