import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ojusijzhshvviqjeyhyn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdXNpanpoc2h2dmlxamV5aHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NjU3MjQsImV4cCI6MjA3MTE0MTcyNH0.rlQ9lIGzoaLTOW-5-W0G1J1A0WwvqZMnhGHW-FwV8GQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createMeditationChallenge() {
  console.log('🧘 Creating 30-Day Meditation Master challenge...');

  const { data, error} = await supabase
    .from('challenges')
    .insert({
      name: '30-Day Meditation Master',
      description: 'Build a daily meditation practice and find inner peace. Transform your mind, one breath at a time.',
      emoji: '🧘',
      type: 'streak',
      scope: 'global',
      duration_days: 30,
      success_threshold: 75,
      badge_emoji: '☮️',
      badge_name: 'Zen Master',
      has_forum: true,
      status: 'active',
      predetermined_activities: [
        { id: 'med1', title: 'Morning Meditation', emoji: '🌅', frequency: 'daily' },
        { id: 'med2', title: 'Evening Reflection', emoji: '🌙', frequency: 'daily' },
        { id: 'med3', title: 'Breathing Exercise', emoji: '💨', frequency: 'daily' }
      ]
    })
    .select()
    .single();

  if (error) {
    console.error('🔴 Error creating challenge:', error);
    process.exit(1);
  }

  console.log('🟢 Challenge created successfully!');
  console.log('📋 Details:', {
    id: data.id,
    name: data.name,
    duration: `${data.duration_days} days`,
    success: `${data.success_threshold}%`,
    badge: `${data.badge_emoji} ${data.badge_name}`
  });

  process.exit(0);
}

createMeditationChallenge();
