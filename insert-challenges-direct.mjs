import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ojusijzhshvviqjeyhyn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdXNpanpoc2h2dmlxamV5aHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NjU3MjQsImV4cCI6MjA3MTE0MTcyNH0.rlQ9lIGzoaLTOW-5-W0G1J1A0WwvqZMnhGHW-FwV8GQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const globalChallenges = [
  {
    name: '75 HARD Challenge',
    description: 'The ultimate mental toughness program. Two 45-minute workouts daily, gallon of water, clean diet, 10 pages of reading, and progress photo.',
    emoji: '💪',
    type: 'streak',
    scope: 'global',
    duration_days: 75,
    success_threshold: 100,
    predetermined_activities: [
      { title: 'Morning Workout', emoji: '🏃', frequency: 'daily' },
      { title: 'Evening Workout', emoji: '🏋️', frequency: 'daily' },
      { title: 'Drink 1 Gallon Water', emoji: '💧', frequency: 'daily' },
      { title: 'Read 10 Pages', emoji: '📖', frequency: 'daily' },
    ],
    badge_emoji: '🏆',
    badge_name: '75 HARD Finisher',
    has_forum: true,
    status: 'active',
  },
  {
    name: 'Daily Meditation Streak',
    description: 'Build a consistent meditation practice. Start with just 5 minutes a day and transform your mindfulness journey.',
    emoji: '🧘',
    type: 'streak',
    scope: 'global',
    duration_days: 30,
    success_threshold: 80,
    predetermined_activities: [
      { title: 'Morning Meditation', emoji: '🌅', frequency: 'daily' },
    ],
    badge_emoji: '🧘',
    badge_name: 'Zen Master',
    has_forum: true,
    status: 'active',
  },
  {
    name: '5 AM Club - 30 Days',
    description: 'Join the 5 AM club and reclaim your mornings. Wake up at 5 AM every day for 30 days and build unstoppable momentum.',
    emoji: '⏰',
    type: 'streak',
    scope: 'global',
    duration_days: 30,
    success_threshold: 90,
    predetermined_activities: [
      { title: 'Wake up at 5 AM', emoji: '🌅', frequency: 'daily' },
    ],
    badge_emoji: '🌟',
    badge_name: 'Early Bird',
    has_forum: true,
    status: 'active',
  },
  {
    name: '52 Books in a Year',
    description: 'Read one book per week for an entire year. Transform your knowledge and expand your perspective.',
    emoji: '📚',
    type: 'cumulative',
    scope: 'global',
    duration_days: 365,
    success_threshold: 80,
    predetermined_activities: [
      { title: 'Read 30 Minutes', emoji: '📖', frequency: 'daily' },
    ],
    badge_emoji: '📚',
    badge_name: 'Bookworm',
    has_forum: true,
    status: 'active',
  },
  {
    name: '30-Day Clean Eating',
    description: 'Reset your nutrition with 30 days of whole, unprocessed foods. No sugar, no alcohol, just real food.',
    emoji: '🥗',
    type: 'streak',
    scope: 'global',
    duration_days: 30,
    success_threshold: 85,
    predetermined_activities: [
      { title: 'Meal Prep', emoji: '🍱', frequency: 'daily' },
    ],
    badge_emoji: '🥗',
    badge_name: 'Clean Eater',
    has_forum: true,
    status: 'active',
  },
  {
    name: '100 Push-ups a Day',
    description: 'Build upper body strength with 100 push-ups daily. Break them into sets throughout the day.',
    emoji: '💪',
    type: 'streak',
    scope: 'global',
    duration_days: 30,
    success_threshold: 90,
    predetermined_activities: [
      { title: '100 Push-ups', emoji: '💪', frequency: 'daily' },
    ],
    badge_emoji: '💪',
    badge_name: 'Push-up Master',
    has_forum: true,
    status: 'active',
  },
  {
    name: 'Gratitude Journal - 21 Days',
    description: 'Write three things you\'re grateful for every day. Build a positive mindset in just 21 days.',
    emoji: '📝',
    type: 'streak',
    scope: 'global',
    duration_days: 21,
    success_threshold: 85,
    predetermined_activities: [
      { title: 'Gratitude Journaling', emoji: '✍️', frequency: 'daily' },
    ],
    badge_emoji: '🙏',
    badge_name: 'Grateful Heart',
    has_forum: true,
    status: 'active',
  },
  {
    name: 'No Social Media Sundays',
    description: 'Disconnect every Sunday for 12 weeks. Reclaim your time and mental space from social media.',
    emoji: '📵',
    type: 'streak',
    scope: 'global',
    duration_days: 84,
    success_threshold: 80,
    predetermined_activities: [
      { title: 'Stay Off Social Media', emoji: '🚫', frequency: 'weekly' },
    ],
    badge_emoji: '🧘',
    badge_name: 'Digital Detoxer',
    has_forum: true,
    status: 'active',
  },
  {
    name: '10,000 Steps Daily',
    description: 'Walk 10,000 steps every single day for 30 days. Simple but transformative for your health.',
    emoji: '🚶',
    type: 'streak',
    scope: 'global',
    duration_days: 30,
    success_threshold: 85,
    predetermined_activities: [
      { title: '10K Steps', emoji: '👟', frequency: 'daily' },
    ],
    badge_emoji: '🏃',
    badge_name: 'Step Champion',
    has_forum: true,
    status: 'active',
  },
  {
    name: 'Cold Shower Challenge',
    description: 'End every shower with 2 minutes of cold water for 21 days. Build mental resilience and boost recovery.',
    emoji: '🚿',
    type: 'streak',
    scope: 'global',
    duration_days: 21,
    success_threshold: 90,
    predetermined_activities: [
      { title: 'Cold Shower', emoji: '❄️', frequency: 'daily' },
    ],
    badge_emoji: '❄️',
    badge_name: 'Ice Cold',
    has_forum: true,
    status: 'active',
  },
];

async function insertChallenges() {
  console.log('🎯 Inserting global challenges...\n');

  for (const challenge of globalChallenges) {
    console.log(`Inserting: ${challenge.name}...`);
    try {
      const { data, error } = await supabase
        .from('challenges')
        .insert([challenge])
        .select();

      if (error) {
        console.log(`❌ Failed: ${challenge.name} - ${error.message}`);
      } else {
        console.log(`✅ Inserted: ${challenge.name}`);
      }
    } catch (error) {
      console.error(`❌ Error inserting ${challenge.name}:`, error.message);
    }
  }

  console.log('\n✨ Done! Refresh the Challenges page to see them.');
}

insertChallenges();
