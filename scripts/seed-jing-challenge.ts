// Seed script for Jing Challenge
// Run this after database tables are created to insert the hardcoded challenge

import { createClient } from '@supabase/supabase-js';

// These would normally come from environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function seedJingChallenge() {
  console.log('🌱 Seeding Jing Challenge...');
  
  try {
    // 1. Get TEST123 circle ID (or use a specific circle ID)
    const { data: circles } = await supabase
      .from('circles')
      .select('id, name')
      .ilike('name', '%TEST123%')
      .single();
    
    const circleId = circles?.id;
    if (!circleId) {
      console.error('❌ TEST123 circle not found. Please create it first.');
      return;
    }
    
    console.log('✅ Found circle:', circles.name, circleId);
    
    // 2. Create the Jing Challenge
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() + 1); // Start tomorrow
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30); // 30 day challenge
    
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .insert({
        circle_id: circleId,
        title: 'Jing Challenge',
        description: 'Build your vital energy through 30 days of consistent wellness practices. Choose 3-5 activities and complete at least 3 daily to strengthen your foundation.',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'upcoming',
        min_activities: 3,
        max_activities: 5,
        required_daily: 3,
        scoring_type: 'consistency',
        icon: '⚡',
        color: '#FFD700'
      })
      .select()
      .single();
    
    if (challengeError) {
      console.error('❌ Error creating challenge:', challengeError);
      return;
    }
    
    console.log('✅ Created Jing Challenge:', challenge.id);
    
    // 3. Add challenge activities
    const activities = [
      {
        title: 'Meditation',
        description: 'Cultivate inner stillness and awareness',
        icon: '🧘',
        canonical_name: 'meditation',
        order_index: 1
      },
      {
        title: 'Lower Dantian Breathing',
        description: 'Breathe into your energy center below the navel',
        icon: '🫁',
        canonical_name: 'breathing_lower',
        order_index: 2
      },
      {
        title: 'Heart Meditation',
        description: 'Open your heart center with loving awareness',
        icon: '❤️',
        canonical_name: 'meditation_heart',
        order_index: 3
      },
      {
        title: 'Cold Showers',
        description: 'Build resilience with cold water therapy',
        icon: '🚿',
        canonical_name: 'cold_exposure',
        order_index: 4
      },
      {
        title: 'Time in Nature',
        description: 'Connect with the earth and natural rhythms',
        icon: '🌲',
        canonical_name: 'nature',
        order_index: 5
      },
      {
        title: 'Journaling',
        description: 'Reflect and integrate your experiences',
        icon: '📝',
        canonical_name: 'journaling',
        order_index: 6
      },
      {
        title: 'Standing Qi Gong',
        description: 'Cultivate energy through standing meditation',
        icon: '🧍',
        canonical_name: 'qigong',
        order_index: 7
      }
    ];
    
    const activityInserts = activities.map(activity => ({
      ...activity,
      challenge_id: challenge.id
    }));
    
    const { data: createdActivities, error: activitiesError } = await supabase
      .from('challenge_activities')
      .insert(activityInserts)
      .select();
    
    if (activitiesError) {
      console.error('❌ Error creating activities:', activitiesError);
      return;
    }
    
    console.log('✅ Created', createdActivities.length, 'activities');
    
    // 4. Optional: Auto-join some test users (if you have test user IDs)
    // Uncomment and modify if you want to pre-populate with participants
    /*
    const testUserIds = ['user-id-1', 'user-id-2'];
    for (const userId of testUserIds) {
      // Select random 3-5 activities
      const selectedCount = Math.floor(Math.random() * 3) + 3; // 3-5
      const selectedActivities = createdActivities
        .sort(() => Math.random() - 0.5)
        .slice(0, selectedCount)
        .map(a => a.id);
      
      await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challenge.id,
          user_id: userId,
          selected_activity_ids: selectedActivities
        });
    }
    */
    
    console.log('🎉 Jing Challenge seeded successfully!');
    console.log('📋 Summary:');
    console.log('  - Challenge:', challenge.title);
    console.log('  - Duration: 30 days');
    console.log('  - Activities:', activities.length);
    console.log('  - Start date:', startDate.toLocaleDateString());
    console.log('  - End date:', endDate.toLocaleDateString());
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Function to clean up (useful for testing)
async function cleanupChallenges() {
  console.log('🧹 Cleaning up existing challenges...');
  
  const { error } = await supabase
    .from('challenges')
    .delete()
    .eq('title', 'Jing Challenge');
  
  if (error) {
    console.error('❌ Error cleaning up:', error);
  } else {
    console.log('✅ Cleanup complete');
  }
}

// Run the seed function
// Uncomment the cleanup line if you want to remove existing Jing Challenges first
// await cleanupChallenges();
seedJingChallenge();