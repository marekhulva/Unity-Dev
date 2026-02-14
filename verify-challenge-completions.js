// Verify if the 6 recovered completions exist in challenge_completions table
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to bypass RLS

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCompletions() {
  console.log('🔍 Checking if recovered completions are in challenge_completions table...\n');

  // The 6 recovered completions
  const recovered = [
    { user: 'ecdcd9c8-586a-4580-94f8-7b2e41a91986', action: 'Deep Work', date: '2026-02-10' },
    { user: '60341cc9-99b3-4b25-b26f-3a4a518d169f', action: 'Standing Meditation', date: '2026-02-10' },
    { user: '60341cc9-99b3-4b25-b26f-3a4a518d169f', action: 'Standing Meditation', date: '2026-02-11' },
    { user: '60341cc9-99b3-4b25-b26f-3a4a518d169f', action: 'Standing Meditation', date: '2026-02-12' },
    { user: '53e3fb35-df02-4cc8-877d-f6eac6c8f490', action: 'Breathwork', date: '2026-02-12' },
    { user: 'a203023e-c5a4-42cd-aed5-2781e14351cf', action: 'Deep Work', date: '2026-02-12' },
  ];

  for (const item of recovered) {
    console.log(`\n👤 ${item.action} on ${item.date} (${item.user.substring(0, 8)}...)`);

    // Check if completion exists in challenge_completions
    const { data: completions, error } = await supabase
      .from('challenge_completions')
      .select('id, challenge_id, completion_date, created_at')
      .eq('user_id', item.user)
      .eq('completion_date', item.date);

    if (error) {
      console.error('   ❌ Error:', error.message);
      continue;
    }

    if (completions && completions.length > 0) {
      console.log(`   ✅ Found ${completions.length} completion(s) in challenge_completions`);
      completions.forEach(c => {
        console.log(`      - ID: ${c.id.substring(0, 8)}... created: ${c.created_at}`);
      });
    } else {
      console.log('   ❌ NOT found in challenge_completions table');
    }
  }
}

verifyCompletions()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
