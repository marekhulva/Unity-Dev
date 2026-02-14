-- Create policy to allow inserting global challenges (temporary for seeding)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'challenges' AND policyname = 'Allow insert global challenges'
  ) THEN
    CREATE POLICY "Allow insert global challenges" ON challenges
      FOR INSERT WITH CHECK (scope = 'global');
  END IF;
END $$;

-- Insert global challenges
INSERT INTO challenges (name, description, emoji, type, scope, duration_days, success_threshold, predetermined_activities, badge_emoji, badge_name, has_forum, status)
VALUES
('75 HARD Challenge', 'The ultimate mental toughness program. Two 45-minute workouts daily, gallon of water, clean diet, 10 pages of reading, and progress photo.', '💪', 'streak', 'global', 75, 100, '[{"title": "Morning Workout", "emoji": "🏃", "frequency": "daily"}, {"title": "Evening Workout", "emoji": "🏋️", "frequency": "daily"}, {"title": "Drink 1 Gallon Water", "emoji": "💧", "frequency": "daily"}, {"title": "Read 10 Pages", "emoji": "📖", "frequency": "daily"}]'::jsonb, '🏆', '75 HARD Finisher', true, 'active'),

('Daily Meditation Streak', 'Build a consistent meditation practice. Start with just 5 minutes a day and transform your mindfulness journey.', '🧘', 'streak', 'global', 30, 80, '[{"title": "Morning Meditation", "emoji": "🌅", "frequency": "daily"}]'::jsonb, '🧘', 'Zen Master', true, 'active'),

('5 AM Club - 30 Days', 'Join the 5 AM club and reclaim your mornings. Wake up at 5 AM every day for 30 days and build unstoppable momentum.', '⏰', 'streak', 'global', 30, 90, '[{"title": "Wake up at 5 AM", "emoji": "🌅", "frequency": "daily"}]'::jsonb, '🌟', 'Early Bird', true, 'active'),

('52 Books in a Year', 'Read one book per week for an entire year. Transform your knowledge and expand your perspective.', '📚', 'cumulative', 'global', 365, 80, '[{"title": "Read 30 Minutes", "emoji": "📖", "frequency": "daily"}]'::jsonb, '📚', 'Bookworm', true, 'active'),

('30-Day Clean Eating', 'Reset your nutrition with 30 days of whole, unprocessed foods. No sugar, no alcohol, just real food.', '🥗', 'streak', 'global', 30, 85, '[{"title": "Meal Prep", "emoji": "🍱", "frequency": "daily"}]'::jsonb, '🥗', 'Clean Eater', true, 'active'),

('100 Push-ups a Day', 'Build upper body strength with 100 push-ups daily. Break them into sets throughout the day.', '💪', 'streak', 'global', 30, 90, '[{"title": "100 Push-ups", "emoji": "💪", "frequency": "daily"}]'::jsonb, '💪', 'Push-up Master', true, 'active'),

('Gratitude Journal - 21 Days', 'Write three things you''re grateful for every day. Build a positive mindset in just 21 days.', '📝', 'streak', 'global', 21, 85, '[{"title": "Gratitude Journaling", "emoji": "✍️", "frequency": "daily"}]'::jsonb, '🙏', 'Grateful Heart', true, 'active'),

('No Social Media Sundays', 'Disconnect every Sunday for 12 weeks. Reclaim your time and mental space from social media.', '📵', 'streak', 'global', 84, 80, '[{"title": "Stay Off Social Media", "emoji": "🚫", "frequency": "weekly"}]'::jsonb, '🧘', 'Digital Detoxer', true, 'active'),

('10,000 Steps Daily', 'Walk 10,000 steps every single day for 30 days. Simple but transformative for your health.', '🚶', 'streak', 'global', 30, 85, '[{"title": "10K Steps", "emoji": "👟", "frequency": "daily"}]'::jsonb, '🏃', 'Step Champion', true, 'active'),

('Cold Shower Challenge', 'End every shower with 2 minutes of cold water for 21 days. Build mental resilience and boost recovery.', '🚿', 'streak', 'global', 21, 90, '[{"title": "Cold Shower", "emoji": "❄️", "frequency": "daily"}]'::jsonb, '❄️', 'Ice Cold', true, 'active');
