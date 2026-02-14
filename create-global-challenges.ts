import { supabase } from './src/services/supabase.service';

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
    description: 'Build a consistent meditation practice. Start with just 5 minutes a day.',
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
    description: 'Join the 5 AM club and reclaim your mornings. Wake up at 5 AM every day for 30 days.',
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
    description: 'Read one book per week for an entire year. Transform your knowledge.',
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
    description: 'Reset your nutrition with 30 days of whole, unprocessed foods.',
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
    description: 'Build upper body strength with 100 push-ups daily.',
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
    description: 'Write three things you\'re grateful for every day.',
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
    description: 'Disconnect every Sunday for 12 weeks. Reclaim your mental space.',
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
    description: 'Walk 10,000 steps every single day for 30 days.',
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
    description: 'End every shower with 2 minutes of cold water for 21 days.',
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

async function createGlobalChallenges() {
  console.log('🎯 Creating global challenges...\n');

  for (const challenge of globalChallenges) {
    console.log(`Creating: ${challenge.name}...`);
    try {
      const { data, error } = await supabase
        .from('challenges')
        .insert([challenge])
        .select();

      if (error) {
        console.log(`❌ Failed: ${challenge.name} - ${error.message}`);
      } else {
        console.log(`✅ Created: ${challenge.name}`);
      }
    } catch (error: any) {
      console.error(`❌ Error creating ${challenge.name}:`, error.message);
    }
  }

  console.log('\n✨ Done! Refresh the Challenges page to see them.');
}

createGlobalChallenges();
