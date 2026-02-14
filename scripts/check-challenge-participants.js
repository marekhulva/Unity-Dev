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
    }
  }
);

async function checkChallengeParticipants() {
  console.log('🔍 Checking all challenge participations...\n');

  const { data: participations, error } = await supabase
    .from('challenge_participants')
    .select(`
      id,
      user_id,
      personal_start_date,
      personal_end_date,
      current_day,
      status,
      selected_activity_ids,
      joined_at,
      challenges (
        id,
        name,
        duration_days,
        predetermined_activities
      )
    `)
    .order('joined_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!participations || participations.length === 0) {
    console.log('❌ No challenge participations found');
    return;
  }

  console.log(`✅ Found ${participations.length} participations\n`);

  for (const p of participations) {
    console.log(`\n📌 ${p.challenges.name}`);
    console.log(`   Participation ID: ${p.id}`);
    console.log(`   User ID: ${p.user_id}`);
    console.log(`   Status: ${p.status}`);
    console.log(`   Joined: ${p.joined_at}`);
    console.log(`   Start date: ${p.personal_start_date}`);
    console.log(`   End date: ${p.personal_end_date}`);
    console.log(`   Current day (stored): ${p.current_day}`);

    const now = new Date();
    const startDate = new Date(p.personal_start_date);
    const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const currentDay = daysSinceStart + 1;

    console.log(`\n   📊 Calculated:`);
    console.log(`     Now: ${now.toISOString()}`);
    console.log(`     Start: ${startDate.toISOString()}`);
    console.log(`     Days since start: ${daysSinceStart}`);
    console.log(`     Calculated current day: ${currentDay}`);

    if (currentDay < 1) {
      const daysUntilStart = Math.abs(currentDay) + 1;
      console.log(`     ⚠️  BUG: Challenge starts in ${daysUntilStart} days - activities are HIDDEN`);
      console.log(`     🔧 FIX NEEDED: Update personal_start_date to today or earlier`);
    } else if (currentDay > p.challenges.duration_days) {
      console.log(`     ⏰ Challenge has ended (day ${currentDay} > ${p.challenges.duration_days})`);
    } else {
      console.log(`     ✅ Challenge is active - showing day ${currentDay} activities`);

      console.log(`\n     🎯 Activities for day ${currentDay}:`);
      const activities = p.challenges.predetermined_activities || [];
      for (const act of activities) {
        const startDay = act.start_day || 1;
        const endDay = act.end_day || p.challenges.duration_days;
        const shouldShow = currentDay >= startDay && currentDay <= endDay;
        console.log(`       ${shouldShow ? '✅' : '⏭️ '} ${act.emoji || '📌'} ${act.title} (days ${startDay}-${endDay})`);
      }
    }
  }
}

checkChallengeParticipants().catch(console.error);
