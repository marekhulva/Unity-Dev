INSERT INTO challenges (
  name,
  description,
  emoji,
  type,
  scope,
  circle_id,
  duration_days,
  success_threshold,
  badge_emoji,
  badge_name,
  has_forum,
  status,
  predetermined_activities
) VALUES (
  '7 Day Mental Detox',
  '7 days to reset your mind and reclaim mental clarity.

WHAT YOU''LL TRACK:

DAY 1:
🧠 Brain Dump (60 min) - Write everything on your mind
💪 Exercise (20+ min)
😴 Sleep Goal (8+ hours)
🚫 No Social Media
🚫 No Long-Form Content
🧘 Detox Compliance

DAYS 2-7:
✍️ Freewriting (20 min on pen & paper)
💪 Exercise (20+ min)
😴 Sleep Goal (8+ hours)
🚫 No Social Media
🚫 No Long-Form Content
🧘 Detox Compliance

REPLACEMENT ACTIVITIES (encouraged):
Use the freed-up time for:
• 📺 Light TV (comedy, feel-good shows)
• 📚 High-quality books
• 💼 Deep work blocks
• 👥 In-person social interaction
• 🎨 Creative hobbies

BONUS RECOMMENDATIONS:
• Avoid alcohol, weed, other vices
• Get sunlight and movement daily
• Eat whole, real foods
• Journal your observations

WHY THIS WORKS:
Your brain is overstimulated. This detox creates space for clarity, focus, and genuine rest. The first 2-3 days are hardest - boredom is the goal. Let yourself be bored. That''s when the reset happens.

Remember: You need 32/42 checkmarks to succeed (75%). That''s 6 per day on average. Missing a few is OK - this is about progress, not perfection.',
  '🧠',
  'streak',
  'circle',
  'd73be526-5cef-45bb-8121-065bb810ac2f',
  7,
  75,
  '🧠',
  'Mental Detox Master',
  true,
  'active',
  '[
    {
      "id": "detox-brain-dump",
      "title": "Brain Dump",
      "emoji": "🧠",
      "frequency": "once",
      "min_duration_minutes": 60,
      "start_day": 1,
      "end_day": 1,
      "description": "Write everything on your mind for 60 minutes. Thoughts, worries, ideas, everything. Write without stopping, no structure needed."
    },
    {
      "id": "detox-freewrite",
      "title": "Freewriting",
      "emoji": "✍️",
      "frequency": "daily",
      "min_duration_minutes": 20,
      "start_day": 2,
      "end_day": 7,
      "description": "Freewrite for 20 minutes on pen and paper. No structure, no editing, just flow."
    },
    {
      "id": "detox-exercise",
      "title": "Exercise",
      "emoji": "💪",
      "frequency": "daily",
      "min_duration_minutes": 20,
      "description": "At least 20 minutes of physical movement. Walking, gym, yoga, sports - anything that gets you moving."
    },
    {
      "id": "detox-sleep",
      "title": "Sleep Goal",
      "emoji": "😴",
      "frequency": "daily",
      "description": "Get 8+ hours of quality sleep. Mark complete in the morning if you slept well."
    },
    {
      "id": "detox-no-social",
      "title": "No Social Media",
      "emoji": "🚫",
      "frequency": "daily",
      "description": "Stay off Instagram, TikTok, Twitter, Facebook, and other social media platforms today. (Checking messages/DMs is OK if necessary, but no scrolling feeds)"
    },
    {
      "id": "detox-no-content",
      "title": "No Long-Form Content",
      "emoji": "📵",
      "frequency": "daily",
      "description": "Avoid YouTube, podcasts, movies, TV shows, and news today. (Exception: Light comedy TV is OK as replacement activity)"
    },
    {
      "id": "detox-compliance",
      "title": "Detox Compliance",
      "emoji": "🧘",
      "frequency": "daily",
      "description": "Avoid other dopamine-heavy digital inputs today: doom-scrolling, gaming binges, rabbit-hole browsing, etc. Keep digital consumption intentional."
    }
  ]'::jsonb
);
