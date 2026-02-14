-- Circle Challenges Implementation
-- Migration: 004_create_challenges_tables.sql
-- Description: Creates tables for circle-based challenges with activities and participation tracking

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Challenges table: Core challenge information
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  
  -- Activity selection rules
  min_activities INTEGER DEFAULT 3,
  max_activities INTEGER DEFAULT 5,
  required_daily INTEGER DEFAULT 3, -- How many activities to complete daily for 100%
  
  -- Scoring configuration
  scoring_type VARCHAR(50) DEFAULT 'consistency' CHECK (scoring_type IN ('consistency', 'volume', 'streak', 'hybrid')),
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Visual
  banner_url TEXT,
  color VARCHAR(7), -- Hex color for UI
  icon VARCHAR(50), -- Emoji or icon identifier
  
  CONSTRAINT valid_activity_range CHECK (min_activities <= max_activities),
  CONSTRAINT valid_dates CHECK (start_date < end_date)
);

-- 2. Challenge activities: Available activities for each challenge
CREATE TABLE challenge_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- Emoji for display
  
  -- For matching with existing habits
  canonical_name VARCHAR(255), -- Standardized name for matching (e.g., 'meditation')
  
  -- Optional configuration
  points_per_completion INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0, -- Display order
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(challenge_id, title)
);

-- 3. Challenge participants: User enrollment and progress
CREATE TABLE challenge_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Selected activities (user picks min to max from available)
  selected_activity_ids UUID[], -- Array of challenge_activity IDs
  
  -- Linked daily actions (when user connects to existing habits)
  linked_action_ids UUID[], -- Array of action IDs from actions table
  
  -- Progress tracking
  total_completions INTEGER DEFAULT 0,
  days_participated INTEGER DEFAULT 0,
  consistency_percentage DECIMAL(5,2) DEFAULT 0.00,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completion_date DATE,
  
  -- Metadata
  joined_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure user can't join same challenge twice
  UNIQUE(challenge_id, user_id)
);

-- 4. Challenge completions: Daily activity tracking
CREATE TABLE challenge_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES challenge_participants(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES challenge_activities(id) ON DELETE CASCADE,
  
  -- Link to daily action if connected
  linked_action_completion_id UUID, -- References completed_actions if linked
  
  -- Completion details
  completed_at TIMESTAMP DEFAULT NOW(),
  completion_date DATE DEFAULT CURRENT_DATE,
  
  -- Optional data
  notes TEXT,
  media_url TEXT,
  
  -- Prevent duplicate completions on same day
  UNIQUE(participant_id, activity_id, completion_date)
);

-- 5. Activity mappings: For smart matching between challenge activities and user habits
CREATE TABLE activity_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canonical_name VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  aliases TEXT[], -- Array of alternative names
  category VARCHAR(100),
  description TEXT,
  default_icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_challenges_circle ON challenges(circle_id);
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_challenges_dates ON challenges(start_date, end_date);
CREATE INDEX idx_activities_challenge ON challenge_activities(challenge_id);
CREATE INDEX idx_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX idx_participants_user ON challenge_participants(user_id);
CREATE INDEX idx_completions_participant ON challenge_completions(participant_id);
CREATE INDEX idx_completions_date ON challenge_completions(completion_date);

-- Enable Row Level Security
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Challenges: Visible to circle members
CREATE POLICY "Circle members can view challenges" ON challenges
  FOR SELECT USING (
    circle_id IN (
      SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
    )
  );

-- Challenge activities: Visible to circle members
CREATE POLICY "Circle members can view activities" ON challenge_activities
  FOR SELECT USING (
    challenge_id IN (
      SELECT id FROM challenges WHERE circle_id IN (
        SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
      )
    )
  );

-- Participants: Users can view all participants in their challenges
CREATE POLICY "View challenge participants" ON challenge_participants
  FOR SELECT USING (
    challenge_id IN (
      SELECT challenge_id FROM challenge_participants WHERE user_id = auth.uid()
    )
  );

-- Participants: Users can join challenges
CREATE POLICY "Users can join challenges" ON challenge_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Participants: Users can update their own participation
CREATE POLICY "Users can update own participation" ON challenge_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Completions: Users can view completions in their challenges
CREATE POLICY "View challenge completions" ON challenge_completions
  FOR SELECT USING (
    participant_id IN (
      SELECT id FROM challenge_participants WHERE challenge_id IN (
        SELECT challenge_id FROM challenge_participants WHERE user_id = auth.uid()
      )
    )
  );

-- Completions: Users can record their own completions
CREATE POLICY "Users can record completions" ON challenge_completions
  FOR INSERT WITH CHECK (
    participant_id IN (
      SELECT id FROM challenge_participants WHERE user_id = auth.uid()
    )
  );

-- Activity mappings: Public read
CREATE POLICY "Public can view activity mappings" ON activity_mappings
  FOR SELECT USING (true);

-- Seed initial activity mappings
INSERT INTO activity_mappings (canonical_name, display_name, aliases, category, default_icon) VALUES
  ('meditation', 'Meditation', ARRAY['sitting practice', 'mindfulness', 'zen meditation', 'vipassana'], 'mindfulness', '🧘'),
  ('breathing_lower', 'Lower Dantian Breathing', ARRAY['belly breathing', 'abdominal breathing', 'dan tien'], 'breathwork', '🫁'),
  ('meditation_heart', 'Heart Meditation', ARRAY['heart coherence', 'loving kindness', 'metta'], 'mindfulness', '❤️'),
  ('cold_exposure', 'Cold Showers', ARRAY['cold plunge', 'ice bath', 'cold therapy', 'wim hof'], 'wellness', '🚿'),
  ('nature', 'Time in Nature', ARRAY['forest bathing', 'earthing', 'grounding', 'outdoor time'], 'wellness', '🌲'),
  ('journaling', 'Journaling', ARRAY['morning pages', 'diary', 'reflection', 'writing'], 'mindfulness', '📝'),
  ('qigong', 'Standing Qi Gong', ARRAY['standing meditation', 'zhan zhuang', 'energy work'], 'movement', '🧍');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON challenge_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate and update participant consistency
CREATE OR REPLACE FUNCTION update_participant_consistency()
RETURNS TRIGGER AS $$
DECLARE
  participant_record RECORD;
  total_days INTEGER;
  completed_days INTEGER;
BEGIN
  -- Get participant info
  SELECT * INTO participant_record FROM challenge_participants WHERE id = NEW.participant_id;
  
  -- Calculate total days since joining
  SELECT GREATEST(1, DATE_PART('day', NOW() - participant_record.joined_at) + 1) INTO total_days;
  
  -- Count days with completions
  SELECT COUNT(DISTINCT completion_date) INTO completed_days
  FROM challenge_completions
  WHERE participant_id = NEW.participant_id;
  
  -- Update participant stats
  UPDATE challenge_participants
  SET 
    total_completions = total_completions + 1,
    days_participated = completed_days,
    consistency_percentage = (completed_days::DECIMAL / total_days * 100),
    last_completion_date = NEW.completion_date,
    updated_at = NOW()
  WHERE id = NEW.participant_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_consistency_on_completion
  AFTER INSERT ON challenge_completions
  FOR EACH ROW EXECUTE FUNCTION update_participant_consistency();

-- Hardcoded Jing Challenge data (to be inserted after tables are created)
-- This will be done in the application layer for now