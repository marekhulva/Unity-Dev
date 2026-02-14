#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

async function fixFutureStartDates() {
  console.log('🔧 Fixing future start dates for challenges...\n');

  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    console.log('📅 Today (midnight local):', today.toISOString());
    console.log('📅 Now (current time):', now.toISOString());
    console.log('');

    const { data: participations, error: fetchError } = await supabase
      .from('challenge_participants')
      .select('id, user_id, personal_start_date, status')
      .eq('status', 'active');

    if (fetchError) {
      console.error('❌ Error fetching participations:', fetchError);
      return;
    }

    if (!participations || participations.length === 0) {
      console.log('❌ No active challenge participations found');
      return;
    }

    console.log(`✅ Found ${participations.length} active challenge participations\n`);

    let fixedCount = 0;
    const futureParticipations = participations.filter(p => {
      const startDate = new Date(p.personal_start_date);
      return startDate > today;
    });

    if (futureParticipations.length === 0) {
      console.log('✅ No future start dates found - all challenges are showing activities correctly!');
      return;
    }

    console.log(`Found ${futureParticipations.length} challenges with future start dates:\n`);

    for (const p of futureParticipations) {
      console.log(`  📌 Participation ${p.id}`);
      console.log(`     User ID: ${p.user_id}`);
      console.log(`     Current start date: ${p.personal_start_date}`);
      console.log(`     Updating to: ${today.toISOString()}`);

      const { error: updateError } = await supabase
        .from('challenge_participants')
        .update({
          personal_start_date: today.toISOString(),
          current_day: 1
        })
        .eq('id', p.id);

      if (updateError) {
        console.log(`     ❌ Error: ${updateError.message}`);
      } else {
        console.log(`     ✅ Updated!`);
        fixedCount++;
      }
      console.log('');
    }

    console.log(`\n✅ Fixed ${fixedCount} of ${futureParticipations.length} future start dates!`);
    console.log('🔄 Refresh your app to see the activities.');
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

fixFutureStartDates().catch(console.error);
