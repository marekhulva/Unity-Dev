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