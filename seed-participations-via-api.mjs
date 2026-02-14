import fs from 'fs';

const PROJECT_REF = 'ojusijzhshvviqjeyhyn';
const ACCESS_TOKEN = fs.readFileSync('/home/marek/.supabase/access-token', 'utf8').trim();

// Use hmarek as the test user
const USER_ID = '6e05f191-db62-4d12-82ed-e84483d0d275';

// Challenge IDs from the database
const CHALLENGES = [
  { id: '65259266-2f49-44d3-9d4b-f14ce4be9121', name: '75 HARD Challenge', duration: 75 },
  { id: 'e59c92e0-7d56-47ce-8d39-6fa2c242bf95', name: 'Daily Meditation Streak', duration: 30 },
  { id: 'bd1dded7-0277-4a78-94b3-aa12bc958917', name: '5 AM Club - 30 Days', duration: 30 },
];

async function executeSQLViaAPI(sql) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  return await response.json();
}

async function seedParticipations() {
  console.log('🌱 Seeding test participations...\n');

  // First check if participations already exist
  const checkSQL = `
    SELECT challenge_id, id FROM challenge_participants
    WHERE user_id = '${USER_ID}'
    AND challenge_id IN ('${CHALLENGES.map(c => c.id).join("','")}');
  `;

  const existing = await executeSQLViaAPI(checkSQL);
  console.log('Existing participations:', existing);

  // If already joined, delete them first for clean slate
  if (existing && existing.length > 0) {
    console.log('🧹 Cleaning up existing participations...');
    const deleteSQL = `
      DELETE FROM challenge_participants
      WHERE user_id = '${USER_ID}'
      AND challenge_id IN ('${CHALLENGES.map(c => c.id).join("','")}');
    `;
    await executeSQLViaAPI(deleteSQL);
    console.log('✅ Cleaned up\n');
  }

  // Create participations with different progress levels
  const participations = [
    {
      challenge: CHALLENGES[0], // 75 HARD
      currentDay: 25,
      completedDays: 23,
      currentStreak: 5,
      longestStreak: 12,
      completionPercentage: 92.0,
    },
    {
      challenge: CHALLENGES[1], // Meditation
      currentDay: 15,
      completedDays: 14,
      currentStreak: 14,
      longestStreak: 14,
      completionPercentage: 93.3,
    },
    {
      challenge: CHALLENGES[2], // 5 AM Club
      currentDay: 7,
      completedDays: 5,
      currentStreak: 2,
      longestStreak: 3,
      completionPercentage: 71.4,
    },
  ];

  for (const p of participations) {
    const challenge = p.challenge;

    // Calculate dates
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - p.currentDay + 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + challenge.duration);

    const sql = `
      INSERT INTO challenge_participants (
        challenge_id,
        user_id,
        personal_start_date,
        personal_end_date,
        current_day,
        completed_days,
        current_streak,
        longest_streak,
        completion_percentage,
        selected_activity_ids,
        activity_times,
        status
      ) VALUES (
        '${challenge.id}',
        '${USER_ID}',
        '${startDate.toISOString()}',
        '${endDate.toISOString()}',
        ${p.currentDay},
        ${p.completedDays},
        ${p.currentStreak},
        ${p.longestStreak},
        ${p.completionPercentage},
        ARRAY['activity-0','activity-1'],
        '[{"activity_id":"activity-0","scheduled_time":"06:00"},{"activity_id":"activity-1","scheduled_time":"18:00"}]'::jsonb,
        'active'
      ) RETURNING id;
    `;

    try {
      const result = await executeSQLViaAPI(sql);
      console.log(`✅ Joined ${challenge.name}`);
      console.log(`   Day ${p.currentDay}/${challenge.duration} • ${p.completionPercentage}% complete • ${p.currentStreak} day streak`);
      console.log(`   Participation ID: ${result[0]?.id}\n`);
    } catch (error) {
      console.log(`❌ Failed to join ${challenge.name}:`, error.message, '\n');
    }
  }

  console.log('✨ Seed complete!\n');
  console.log('📱 Refresh your app to see the active challenges\n');
}

seedParticipations().catch(console.error);
