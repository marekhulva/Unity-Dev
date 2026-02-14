// Check if recovered completions are reflected in challenge scores
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkChallengeScores() {
  console.log('🔍 Checking challenge scores for recovered completions...\n');

  // Get the 6 recovered users and their actions
  const recoveredUsers = [
    'ecdcd9c8-586a-4580-94f8-7b2e41a91986',
    '60341cc9-99b3-4b25-b26f-3a4a518d169f',
    '53e3fb35-df02-4cc8-877d-f6eac6c8f490',
    'a203023e-c5a4-42cd-aed5-2781e14351cf'
  ];

  for (const userId of recoveredUsers) {
    console.log(`\n👤 User: ${userId.substring(0, 8)}...`);

    // Find their challenge participations
    const { data: participations, error: partError } = await supabase
      .from('challenge_participants')
      .select('id, challenge_id, completion_percentage, completed_days, current_streak, status')
      .eq('user_id', userId)
      .neq('status', 'left');

    if (partError) {
      console.error('❌ Error:', partError);
      continue;
    }

    if (!participations || participations.length === 0) {
      console.log('   No active challenge participations');
      continue;
    }

    for (const participation of participations) {
      console.log(`\n   📊 Challenge: ${participation.challenge_id.substring(0, 8)}...`);
      console.log(`   Status: ${participation.status}`);
      console.log(`   Completion: ${participation.completion_percentage}%`);
      console.log(`   Completed days: ${participation.completed_days}`);
      console.log(`   Current streak: ${participation.current_streak}`);

      // Get all completed actions for this user in this challenge
      const { data: actions, error: actionsError } = await supabase
        .from('actions')
        .select('id, title, completed, completed_at, challenge_id')
        .eq('user_id', userId)
        .eq('challenge_id', participation.challenge_id)
        .eq('completed', true)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      if (actionsError) {
        console.error('   ❌ Error fetching actions:', actionsError);
        continue;
      }

      console.log(`   ✅ Total completed actions in DB: ${actions?.length || 0}`);

      if (actions && actions.length > 0) {
        console.log(`   Latest completions:`);
        actions.slice(0, 5).forEach(action => {
          const date = new Date(action.completed_at).toISOString().split('T')[0];
          console.log(`     - ${action.title} (${date})`);
        });
      }
    }
  }
}

checkChallengeScores()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
