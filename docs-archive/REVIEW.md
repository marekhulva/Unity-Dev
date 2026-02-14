# Review Your Day Feature - Documentation

## Status: DISABLED

The "Review Your Day" button and modal have been **temporarily disabled** as of October 10, 2025.

## Why It Was Disabled

The feature requires database tables that haven't been created in the production Supabase database yet. Without these tables, the button causes errors when clicked.

---

## What Was Disabled

### 1. Review Button
**Location:** `src/features/daily/DailyScreen.tsx` (lines 571-621)

The pinned button at the bottom of the Daily screen that says "Review Your Day - Reflect & Celebrate"

### 2. Daily Review Modal
**Location:** `src/features/daily/DailyScreen.tsx` (line 624)

The modal component that opens when the Review button is clicked: `<DailyReviewModal />`

---

## How to Re-Enable

### Step 1: Create Database Tables

Run the following SQL in your Supabase SQL Editor:
- URL: https://supabase.com/dashboard/project/ojusijzhshvviqjeyhyn/sql

```sql
-- Create daily reviews table
CREATE TABLE IF NOT EXISTS daily_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    review_date DATE NOT NULL,

    -- Progress metrics
    total_actions INTEGER DEFAULT 0,
    completed_actions INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,

    -- Reflection answers
    biggest_win TEXT,
    key_insight TEXT,
    gratitude TEXT,
    tomorrow_focus TEXT,
    tomorrow_intention TEXT,

    -- Points & gamification
    points_earned INTEGER DEFAULT 0,
    streak_day INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure one review per day per user
    UNIQUE(user_id, review_date)
);

-- Create missed actions tracking table
CREATE TABLE IF NOT EXISTS daily_review_missed_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID REFERENCES daily_reviews(id) ON DELETE CASCADE NOT NULL,
    action_id UUID, -- Reference to the action
    action_title TEXT NOT NULL,
    goal_title TEXT,

    -- Status and reasoning
    marked_complete BOOLEAN DEFAULT FALSE,
    miss_reason TEXT,
    obstacles TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_reviews_user_date ON daily_reviews(user_id, review_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_reviews_user ON daily_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_missed_actions_review ON daily_review_missed_actions(review_id);

-- Enable RLS (Row Level Security)
ALTER TABLE daily_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_review_missed_actions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for daily_reviews
CREATE POLICY "Users can view their own reviews" ON daily_reviews
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reviews" ON daily_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON daily_reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON daily_reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for daily_review_missed_actions
CREATE POLICY "Users can view their own missed actions" ON daily_review_missed_actions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM daily_reviews
            WHERE daily_reviews.id = daily_review_missed_actions.review_id
            AND daily_reviews.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own missed actions" ON daily_review_missed_actions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM daily_reviews
            WHERE daily_reviews.id = daily_review_missed_actions.review_id
            AND daily_reviews.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own missed actions" ON daily_review_missed_actions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM daily_reviews
            WHERE daily_reviews.id = daily_review_missed_actions.review_id
            AND daily_reviews.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own missed actions" ON daily_review_missed_actions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM daily_reviews
            WHERE daily_reviews.id = daily_review_missed_actions.review_id
            AND daily_reviews.user_id = auth.uid()
        )
    );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_daily_reviews_updated_at BEFORE UPDATE
    ON daily_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CRITICAL: Grant permissions to authenticated users
GRANT ALL ON daily_reviews TO authenticated;
GRANT ALL ON daily_review_missed_actions TO authenticated;
```

### Step 2: Uncomment the Code

In `src/features/daily/DailyScreen.tsx`:

1. **Uncomment the Review Button** (lines 571-621):
   - Remove the `{/*` on line 572
   - Remove the `*/}` on line 621

2. **Uncomment the DailyReviewModal** (line 624):
   - Change `{/* <DailyReviewModal /> */}` to `<DailyReviewModal />`

### Step 3: Test Locally

1. Start the dev server: `PORT=8054 npx expo start --web --port 8054`
2. Click the "Review Your Day" button
3. Complete a review to ensure everything works

### Step 4: Deploy to TestFlight

1. Increment build number in `app.json`
2. Run: `EXPO_NO_PROMPT_FOR_CI=1 eas build --platform ios --profile production --auto-submit --non-interactive`
3. Wait for Apple's email confirming the build is ready
4. Test on your iPhone

---

## Feature Description

The "Review Your Day" feature allows users to:

1. **Review missed actions** - For any actions not completed, users can:
   - Mark them as complete retroactively
   - Explain why they missed it
   - Note obstacles faced

2. **Reflect on the day** - Answer prompts like:
   - What was your biggest win today?
   - What key insight did you gain?
   - What are you grateful for?
   - What will you focus on tomorrow?

3. **Celebrate progress** - See completion percentage and streak

4. **Build accountability** - Regular reflection helps maintain momentum

---

## Files Involved

### Frontend
- `src/features/daily/DailyScreen.tsx` - Review button
- `src/features/daily/DailyReviewModalV2.tsx` - Review modal UI
- `src/state/slices/dailySlice.ts` - State management
- `src/services/dailyReviews.service.ts` - Backend service layer

### Database
- `daily_reviews` - Stores review data
- `daily_review_missed_actions` - Tracks missed actions

### Migration
- `apply_daily_reviews_migration.sql` - Full SQL migration file (also in this directory)

---

## Notes

- The feature was working locally because we created the tables in the local development environment
- The production Supabase database doesn't have these tables yet
- Once tables are created, the feature should work immediately
- No code changes are needed - just database setup and uncommenting

---

## History

- **Created:** During initial MVP development
- **Disabled:** October 10, 2025 (Build #27)
- **Reason:** Incomplete database setup in production
- **Status:** Ready to re-enable after running SQL migration
