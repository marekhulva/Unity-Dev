#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createJingPathCircle() {
  console.log('🎯 Creating JING PATH circle...');
  console.log('📍 Database:', process.env.SUPABASE_URL);
  console.log('');

  // First, we need a user to own this circle. Let's create a test user or find an existing one.
  // For simplicity, I'll create a test user with a known email
  const testEmail = 'jingpath-test@example.com';
  const testPassword = 'test-password-123';

  console.log('👤 Creating test user account...');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true
  });

  if (authError) {
    console.error('❌ Error creating user:', authError.message);
    // If user already exists, try to find them
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      process.exit(1);
    }
    const existingUser = users.users.find(u => u.email === testEmail);
    if (!existingUser) {
      console.error('❌ Could not create or find test user');
      process.exit(1);
    }
    console.log('✅ Found existing test user:', existingUser.id);
    var userId = existingUser.id;
  } else {
    console.log('✅ Test user created:', authData.user.id);
    var userId = authData.user.id;
  }

  console.log('');
  console.log('🔵 Creating JING PATH circle...');

  const circleData = {
    name: 'JING PATH',
    join_code: 'JACKSON',
    created_by: userId,
    description: 'Mental optimization and clarity path'
  };

  const { data: circle, error: circleError } = await supabase
    .from('circles')
    .insert(circleData)
    .select()
    .single();

  if (circleError) {
    console.error('❌ Error creating circle:', circleError.message);
    console.error('Full error:', circleError);
    process.exit(1);
  }

  console.log('✅ Circle created!');
  console.log('');
  console.log('📋 Circle Details:');
  console.log('   ID:', circle.id);
  console.log('   Name:', circle.name);
  console.log('   Join Code:', circle.join_code);
  console.log('   Created By:', circle.created_by);
  console.log('');

  // Add the creator as a member of the circle
  console.log('👥 Adding creator as circle member...');
  const { error: memberError } = await supabase
    .from('circle_members')
    .insert({
      circle_id: circle.id,
      user_id: userId,
      role: 'admin'
    });

  if (memberError) {
    console.error('❌ Error adding member:', memberError.message);
  } else {
    console.log('✅ Creator added as admin');
  }

  console.log('');
  console.log('🧠 Now creating Mental Detox challenge in this circle...');

  const challengeData = {
    name: '7 Day Mental Detox',
    description: `7 days to reset your mind and reclaim mental clarity.

WHAT YOU'LL TRACK:

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
Your brain is overstimulated. This detox creates space for clarity, focus, and genuine rest. The first 2-3 days are hardest - boredom is the goal. Let yourself be bored. That's when the reset happens.

Remember: You need 32/42 checkmarks to succeed (75%). That's 6 per day on average. Missing a few is OK - this is about progress, not perfection.`,
    emoji: '🧠',
    type: 'streak',
    scope: 'circle',
    circle_id: circle.id,
    duration_days: 7,
    success_threshold: 75,
    badge_emoji: '🧠',
    badge_name: 'Mental Detox Master',
    has_forum: true,
    status: 'active',
    predetermined_activities: [
      {
        id: 'detox-brain-dump',
        title: 'Brain Dump',
        emoji: '🧠',
        frequency: 'once',
        min_duration_minutes: 60,
        start_day: 1,
        end_day: 1,
        description: 'Write everything on your mind for 60 minutes. Thoughts, worries, ideas, everything. Write without stopping, no structure needed.'
      },
      {
        id: 'detox-freewrite',
        title: 'Freewriting',
        emoji: '✍️',
        frequency: 'daily',
        min_duration_minutes: 20,
        start_day: 2,
        end_day: 7,
        description: 'Freewrite for 20 minutes on pen and paper. No structure, no editing, just flow.'
      },
      {
        id: 'detox-exercise',
        title: 'Exercise',
        emoji: '💪',
        frequency: 'daily',
        min_duration_minutes: 20,
        description: 'At least 20 minutes of physical movement. Walking, gym, yoga, sports - anything that gets you moving.'
      },
      {
        id: 'detox-sleep',
        title: 'Sleep Goal',
        emoji: '😴',
        frequency: 'daily',
        description: 'Get 8+ hours of quality sleep. Mark complete in the morning if you slept well.'
      },
      {
        id: 'detox-no-social',
        title: 'No Social Media',
        emoji: '🚫',
        frequency: 'daily',
        description: 'Stay off Instagram, TikTok, Twitter, Facebook, and other social media platforms today. (Checking messages/DMs is OK if necessary, but no scrolling feeds)'
      },
      {
        id: 'detox-no-content',
        title: 'No Long-Form Content',
        emoji: '📵',
        frequency: 'daily',
        description: 'Avoid YouTube, podcasts, movies, TV shows, and news today. (Exception: Light comedy TV is OK as replacement activity)'
      },
      {
        id: 'detox-compliance',
        title: 'Detox Compliance',
        emoji: '🧘',
        frequency: 'daily',
        description: 'Avoid other dopamine-heavy digital inputs today: doom-scrolling, gaming binges, rabbit-hole browsing, etc. Keep digital consumption intentional.'
      }
    ]
  };

  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .insert(challengeData)
    .select()
    .single();

  if (challengeError) {
    console.error('❌ Error creating challenge:', challengeError.message);
    console.error('Full error:', challengeError);
    process.exit(1);
  }

  console.log('✅ Challenge created in JING PATH circle!');
  console.log('');
  console.log('📋 Challenge Details:');
  console.log('   ID:', challenge.id);
  console.log('   Name:', challenge.name);
  console.log('   Scope:', challenge.scope);
  console.log('   Circle ID:', challenge.circle_id);
  console.log('');
  console.log('✨ Done!');
  console.log('');
  console.log('🎯 TO JOIN THIS CIRCLE:');
  console.log('   1. Open the app on http://localhost:8081');
  console.log('   2. Go to Circles tab');
  console.log('   3. Tap "Join Circle"');
  console.log('   4. Enter join code: JACKSON');
  console.log('');
  console.log('Test account credentials (if needed):');
  console.log('   Email:', testEmail);
  console.log('   Password:', testPassword);
}

createJingPathCircle();
