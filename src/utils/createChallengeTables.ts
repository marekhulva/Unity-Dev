// Utility to create challenge tables directly in Supabase
// Run this once to set up the challenge system

import { supabase } from '../services/supabase.service';

export async function createChallengeTables() {
  if (__DEV__) console.log('🏗️ Creating challenge tables...');
  
  try {
    // Create challenges table
    const { error: challengesError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS challenges (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP NOT NULL,
          status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
          min_activities INTEGER DEFAULT 3,
          max_activities INTEGER DEFAULT 5,
          required_daily INTEGER DEFAULT 3,
          scoring_type VARCHAR(50) DEFAULT 'consistency',
          created_by UUID REFERENCES profiles(id),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          banner_url TEXT,
          color VARCHAR(7),
          icon VARCHAR(50)
        );
      `
    });
    
    if (challengesError) {
      if (__DEV__) console.log('Note: challenges table might already exist or needs manual creation');
    }
    
    // Create challenge_activities table
    const { error: activitiesError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS challenge_activities (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          icon VARCHAR(50),
          canonical_name VARCHAR(255),
          points_per_completion INTEGER DEFAULT 1,
          order_index INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });
    
    if (activitiesError) {
      if (__DEV__) console.log('Note: challenge_activities table might already exist');
    }
    
    // Create challenge_participants table
    const { error: participantsError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS challenge_participants (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
          user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
          selected_activity_ids UUID[],
          linked_action_ids UUID[],
          total_completions INTEGER DEFAULT 0,
          days_participated INTEGER DEFAULT 0,
          consistency_percentage DECIMAL(5,2) DEFAULT 0.00,
          current_streak INTEGER DEFAULT 0,
          longest_streak INTEGER DEFAULT 0,
          last_completion_date DATE,
          joined_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(challenge_id, user_id)
        );
      `
    });
    
    if (participantsError) {
      if (__DEV__) console.log('Note: challenge_participants table might already exist');
    }
    
    // Create challenge_completions table
    const { error: completionsError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS challenge_completions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          participant_id UUID REFERENCES challenge_participants(id) ON DELETE CASCADE,
          activity_id UUID REFERENCES challenge_activities(id) ON DELETE CASCADE,
          linked_action_completion_id UUID,
          completed_at TIMESTAMP DEFAULT NOW(),
          completion_date DATE DEFAULT CURRENT_DATE,
          notes TEXT,
          media_url TEXT,
          UNIQUE(participant_id, activity_id, completion_date)
        );
      `
    });
    
    if (completionsError) {
      if (__DEV__) console.log('Note: challenge_completions table might already exist');
    }
    
    // Create activity_mappings table
    const { error: mappingsError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS activity_mappings (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          canonical_name VARCHAR(255) UNIQUE NOT NULL,
          display_name VARCHAR(255) NOT NULL,
          aliases TEXT[],
          category VARCHAR(100),
          description TEXT,
          default_icon VARCHAR(50),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });
    
    if (mappingsError) {
      if (__DEV__) console.log('Note: activity_mappings table might already exist');
    }
    
    if (__DEV__) console.log('✅ Challenge tables creation attempted');
    if (__DEV__) console.log('Note: If tables don\'t exist, you may need to run the SQL migration directly in Supabase dashboard');
    
    return true;
  } catch (error) {
    if (__DEV__) console.error('❌ Error creating tables:', error);
    return false;
  }
}