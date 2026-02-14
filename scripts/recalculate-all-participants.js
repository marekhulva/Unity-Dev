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

async function recalculateAll() {
  console.log('📊 Recalculating all challenge participants...\n');

  // Get all active participants
  const { data: participants, error: pErr } = await supabase
    .from('challenge_participants')
    .select('id, user_id, challenge_id, personal_start_date, selected_activity_ids, longest_streak, status')
    .neq('status', 'left');

  if (pErr) {
    console.error('❌ Failed to fetch participants:', pErr);
    return;
  }

  console.log(`Found ${participants.length} participants to recalculate\n`);

  // Cache challenges to avoid repeated lookups
  const challengeCache = {};

  for (const participant of participants) {
    const { user_id, challenge_id, personal_start_date, selected_activity_ids } = participant;

    // Get challenge data (cached)
    if (!challengeCache[challenge_id]) {
      const { data: challenge } = await supabase
        .from('challenges')
        .select('duration_days, success_threshold, predetermined_activities, name')
        .eq('id', challenge_id)
        .single();
      challengeCache[challenge_id] = challenge;
    }

    const challenge = challengeCache[challenge_id];
    if (!challenge) {
      console.log(`  ⚠️  No challenge found for ${challenge_id}, skipping`);
      continue;
    }

    const totalDays = challenge.duration_days;

    // Calculate current day (days since personal start)
    const currentDay = Math.floor(
      (new Date().getTime() - new Date(personal_start_date).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

    const daysSoFar = Math.min(currentDay, totalDays);

    // Count total completions
    const { data: allCompletions } = await supabase
      .from('challenge_completions')
      .select('completion_date, challenge_activity_id')
      .eq('user_id', user_id)
      .eq('challenge_id', challenge_id);

    const totalCompletions = allCompletions?.length || 0;

    // Calculate expected activities accounting for day-specific ones
    const predActivities = challenge.predetermined_activities || [];
    const selectedIds = new Set(selected_activity_ids || []);

    let expectedActivities = 0;
    for (let day = 1; day <= daysSoFar; day++) {
      for (const act of predActivities) {
        if (selectedIds.size > 0 && !selectedIds.has(act.id)) continue;
        const startDay = act.start_day || 1;
        const endDay = act.end_day || totalDays;
        if (day >= startDay && day <= endDay) expectedActivities++;
      }
    }

    const completionPercentage = expectedActivities > 0
      ? Math.min(100, Math.round((totalCompletions / expectedActivities) * 100))
      : 0;

    // Unique days with completions
    const completedDaysCount = allCompletions
      ? new Set(allCompletions.map(d => d.completion_date)).size
      : 0;

    // Calculate current streak
    const uniqueDates = allCompletions
      ? [...new Set(allCompletions.map(d => d.completion_date))].sort().reverse()
      : [];

    let currentStreak = 0;
    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().split('T')[0];
      if (uniqueDates[i] === expectedStr) {
        currentStreak++;
      } else {
        break;
      }
    }

    const daysTaken = currentDay > totalDays ? totalDays : currentDay;

    // Determine status
    let status = participant.status;
    let badgeEarned = null;

    if (currentDay > totalDays) {
      if (completionPercentage >= (challenge.success_threshold || 70)) {
        status = 'completed';
        if (completionPercentage >= 80) badgeEarned = 'gold';
        else if (completionPercentage >= 60) badgeEarned = 'silver';
        else badgeEarned = 'bronze';
      } else {
        status = 'failed';
        badgeEarned = 'failed';
      }
    }

    // Update
    const { error: updateErr } = await supabase
      .from('challenge_participants')
      .update({
        completed_days: completedDaysCount,
        current_day: currentDay,
        completion_percentage: completionPercentage,
        days_taken: daysTaken,
        current_streak: currentStreak,
        longest_streak: Math.max(currentStreak, participant.longest_streak || 0),
        status,
        badge_earned: badgeEarned,
      })
      .eq('id', participant.id);

    if (updateErr) {
      console.log(`  ❌ ${user_id.slice(0, 8)}... ERROR: ${updateErr.message}`);
    } else {
      console.log(`  ✅ ${user_id.slice(0, 8)}... | ${challenge.name} | ${totalCompletions}/${expectedActivities} = ${completionPercentage}% | streak: ${currentStreak} | day ${currentDay}/${totalDays} | ${status}`);
    }
  }

  // Now recalculate ranks per challenge
  console.log('\n📊 Recalculating ranks...\n');

  const challengeIds = [...new Set(participants.map(p => p.challenge_id))];

  for (const challengeId of challengeIds) {
    const { data: ranked } = await supabase
      .from('challenge_participants')
      .select('id, completion_percentage')
      .eq('challenge_id', challengeId)
      .neq('status', 'left')
      .order('completion_percentage', { ascending: false });

    if (!ranked) continue;

    for (let i = 0; i < ranked.length; i++) {
      await supabase
        .from('challenge_participants')
        .update({
          rank: i + 1,
          percentile: Math.round(((ranked.length - i) / ranked.length) * 100),
        })
        .eq('id', ranked[i].id);
    }

    console.log(`  ✅ ${challengeId.slice(0, 8)}... — ranked ${ranked.length} participants`);
  }

  console.log('\n✅ Done! All participants recalculated.');
}

recalculateAll().catch(console.error);
