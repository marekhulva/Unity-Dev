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

async function checkMyChallenge() {
  console.log('🔍 Checking your challenge...\n');

  // List all users to find yours
  const { data: { users } } = await supabase.auth.admin.listUsers();
  console.log('👥 Users in database:');
  users.forEach((u, i) => {
    console.log(`  ${i + 1}. Email: ${u.email || 'N/A'}, ID: ${u.id}`);
  });

  console.log('\n📋 Now checking challenge participations for all users...\n');

  for (const user of users) {
    const { data: participations, error } = await supabase
      .from('challenge_participants')
      .select(`
        id,
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
      .eq('user_id', user.id);

    if (participations && participations.length > 0) {
      console.log(`\n✅ User ${user.email} (ID: ${user.id}) has ${participations.length} challenge(s):`);

      for (const p of participations) {
        console.log(`\n  📌 ${p.challenges.name}`);
        console.log(`     Participation ID: ${p.id}`);
        console.log(`     Status: ${p.status}`);
        console.log(`     Joined: ${p.joined_at}`);
        console.log(`     Start date: ${p.personal_start_date}`);
        console.log(`     End date: ${p.personal_end_date}`);
        console.log(`     Current day (stored): ${p.current_day}`);

        const now = new Date();
        const startDate = new Date(p.personal_start_date);
        const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const currentDay = daysSinceStart + 1;

        console.log(`\n     📊 Calculated:`);
        console.log(`       Now: ${now.toISOString()}`);
        console.log(`       Start: ${startDate.toISOString()}`);
        console.log(`       Days since start: ${daysSinceStart}`);
        console.log(`       Calculated current day: ${currentDay}`);
        console.log(`       Should show activities? ${currentDay >= 1 ? '✅ YES' : '❌ NO'}`);

        if (currentDay >= 1 && currentDay <= p.challenges.duration_days) {
          console.log(`\n       🎯 Activities for day ${currentDay}:`);
          const activities = p.challenges.predetermined_activities || [];
          for (const act of activities) {
            const startDay = act.start_day || 1;
            const endDay = act.end_day || p.challenges.duration_days;
            const shouldShow = currentDay >= startDay && currentDay <= endDay;
            console.log(`         ${shouldShow ? '✅' : '⏭️'} ${act.emoji || '📌'} ${act.title} (days ${startDay}-${endDay})`);
          }
        } else if (currentDay < 1) {
          console.log(`\n       ⚠️ Challenge hasn't started yet! It starts in ${Math.abs(currentDay) + 1} days`);
        } else {
          console.log(`\n       ⏰ Challenge has ended (day ${currentDay} > ${p.challenges.duration_days})`);
        }
      }
    }
  }
}

checkMyChallenge().catch(console.error);
