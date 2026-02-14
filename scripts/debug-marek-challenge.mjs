import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env' });

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

async function debugMarekChallenge() {
  console.log('🔍 Checking Marek\'s Mental Detox challenge participation...\n');

  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error('❌ Error listing users:', usersError);
    return;
  }

  const marekUser = users.find(u => u.email?.includes('marek') || u.user_metadata?.name === 'Marek');

  if (!marekUser) {
    console.log('❌ Could not find Marek user. Available users:');
    users.forEach(u => console.log('  -', u.email, u.user_metadata?.name));
    return;
  }

  console.log('✅ Found user:', marekUser.email, '(ID:', marekUser.id, ')\n');

  const { data: participations, error: participationError } = await supabase
    .from('challenge_participants')
    .select(`
      id,
      personal_start_date,
      personal_end_date,
      current_day,
      status,
      selected_activity_ids,
      activity_times,
      joined_at,
      challenges!inner (
        id,
        name,
        duration_days,
        predetermined_activities
      )
    `)
    .eq('user_id', marekUser.id)
    .ilike('challenges.name', '%Mental Detox%')
    .order('joined_at', { ascending: false });

  if (profileError || !profile) {
    console.error('❌ Could not find user Marek:', profileError);
    return;
  }

  console.log('✅ Found user:', profile.name, '(ID:', profile.id, ')\n');

  const { data: participations, error: participationError } = await supabase
    .from('challenge_participants')
    .select(`
      id,
      personal_start_date,
      personal_end_date,
      current_day,
      status,
      selected_activity_ids,
      activity_times,
      joined_at,
      challenges!inner (
        id,
        name,
        duration_days,
        predetermined_activities
      )
    `)
    .eq('user_id', profile.id)
    .eq('challenges.name', '7 Day Mental Detox')
    .order('joined_at', { ascending: false });

  if (participationError) {
    console.error('❌ Error fetching participations:', participationError);
    return;
  }

  if (!participations || participations.length === 0) {
    console.log('❌ No Mental Detox challenge participation found for Marek');
    return;
  }

  console.log(`✅ Found ${participations.length} participation(s)\n`);

  for (const p of participations) {
    console.log('📋 Challenge:', p.challenges.name);
    console.log('  Challenge ID:', p.challenges.id);
    console.log('  Participant ID:', p.id);
    console.log('  Status:', p.status);
    console.log('  Joined at:', p.joined_at);
    console.log('  Personal start date:', p.personal_start_date);
    console.log('  Personal end date:', p.personal_end_date);
    console.log('  Current day (stored):', p.current_day);

    const now = new Date();
    const startDate = new Date(p.personal_start_date);
    const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const currentDay = daysSinceStart + 1;

    console.log('\n📊 Calculated values:');
    console.log('  Now:', now.toISOString());
    console.log('  Start date:', startDate.toISOString());
    console.log('  Days since start:', daysSinceStart);
    console.log('  Current day (calculated):', currentDay);
    console.log('  Should show activities?', currentDay >= 1 ? '✅ YES' : '❌ NO (pre-start guard will hide them)');

    console.log('\n🎯 Activities:');
    const activities = p.challenges.predetermined_activities || [];
    console.log('  Total activities in challenge:', activities.length);
    console.log('  Selected activity IDs:', p.selected_activity_ids?.length || 0, 'activities');

    if (currentDay >= 1 && currentDay <= p.challenges.duration_days) {
      console.log(`\n  Activities that SHOULD show on day ${currentDay}:`);
      for (const act of activities) {
        const startDay = act.start_day || 1;
        const endDay = act.end_day || p.challenges.duration_days;
        const shouldShow = currentDay >= startDay && currentDay <= endDay;
        console.log(`    ${shouldShow ? '✅' : '❌'} ${act.emoji || '📌'} ${act.title} (days ${startDay}-${endDay})`);
      }
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }

  const { data: completions } = await supabase
    .from('challenge_completions')
    .select('*')
    .eq('user_id', marekUser.id)
    .order('completed_at', { ascending: false })
    .limit(10);

  if (completions && completions.length > 0) {
    console.log('📝 Recent completions:', completions.length);
    completions.forEach(c => {
      console.log('  -', c.completion_date, ':', c.challenge_activity_id);
    });
  } else {
    console.log('📝 No completions recorded yet');
  }
}

debugMarekChallenge().catch(console.error);
