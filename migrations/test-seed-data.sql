-- ============================================
-- TEST SEED DATA - Sample Challenges
-- ============================================
-- Run this to create test challenges for development

-- Insert a sample Global Challenge
INSERT INTO challenges (
  name,
  description,
  emoji,
  type,
  scope,
  duration_days,
  success_threshold,
  predetermined_activities,
  badge_emoji,
  badge_name,
  has_forum,
  status
) VALUES (
  '30 Day Cold Shower Challenge',
  'Take a cold shower every day for 30 days to build mental toughness and improve your health. Studies show cold showers can boost immunity, improve circulation, and increase willpower.',
  '❄️',
  'streak',
  'global',
  30,
  80,
  '[
    {
      "id": "cold-shower-1",
      "title": "Cold Shower",
      "emoji": "❄️",
      "frequency": "daily",
      "min_duration_minutes": 2,
      "description": "Take a cold shower for at least 2 minutes"
    }
  ]'::jsonb,
  '❄️',
  'Ice Warrior',
  true,
  'active'
),
(
  '75 Hard Challenge',
  'The ultimate mental toughness challenge. Complete all 5 tasks every day for 75 days straight. One miss = start over from Day 1.',
  '💪',
  'streak',
  'global',
  75,
  100,
  '[
    {
      "id": "workout-outdoor",
      "title": "Outdoor Workout",
      "emoji": "🏃",
      "frequency": "daily",
      "min_duration_minutes": 45,
      "description": "45-minute outdoor workout"
    },
    {
      "id": "workout-indoor",
      "title": "Indoor Workout",
      "emoji": "💪",
      "frequency": "daily",
      "min_duration_minutes": 45,
      "description": "45-minute indoor workout"
    },
    {
      "id": "read-10-pages",
      "title": "Read 10 Pages",
      "emoji": "📚",
      "frequency": "daily",
      "min_duration_minutes": 15,
      "description": "Read 10 pages of non-fiction"
    },
    {
      "id": "gallon-water",
      "title": "Drink 1 Gallon Water",
      "emoji": "💧",
      "frequency": "daily",
      "description": "Drink 1 gallon (128oz) of water"
    },
    {
      "id": "progress-photo",
      "title": "Progress Photo",
      "emoji": "📸",
      "frequency": "daily",
      "description": "Take a daily progress photo"
    }
  ]'::jsonb,
  '💪',
  '75 Hard Finisher',
  true,
  'active'
),
(
  'Morning Routine Challenge',
  'Build a powerful morning routine. Wake up early, exercise, and set your day up for success for 21 days.',
  '🌅',
  'streak',
  'global',
  21,
  80,
  '[
    {
      "id": "wake-early",
      "title": "Wake Up at 6 AM",
      "emoji": "⏰",
      "frequency": "daily",
      "description": "Wake up at 6:00 AM or earlier"
    },
    {
      "id": "morning-workout",
      "title": "Morning Workout",
      "emoji": "🏋️",
      "frequency": "daily",
      "min_duration_minutes": 20,
      "description": "20-minute morning workout"
    },
    {
      "id": "morning-meditation",
      "title": "Meditation",
      "emoji": "🧘",
      "frequency": "daily",
      "min_duration_minutes": 10,
      "description": "10 minutes of meditation"
    },
    {
      "id": "healthy-breakfast",
      "title": "Healthy Breakfast",
      "emoji": "🥗",
      "frequency": "daily",
      "description": "Eat a nutritious breakfast"
    }
  ]'::jsonb,
  '🌅',
  'Morning Warrior',
  true,
  'active'
);

-- Verify challenges were created
SELECT
  '✅ CHALLENGES CREATED' as status,
  COUNT(*) as total_challenges
FROM challenges
WHERE scope = 'global';

-- Show created challenges
SELECT
  name,
  emoji,
  duration_days,
  success_threshold,
  badge_name,
  jsonb_array_length(predetermined_activities) as activity_count
FROM challenges
WHERE scope = 'global'
ORDER BY created_at DESC;
