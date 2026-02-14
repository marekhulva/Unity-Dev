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

async function diagnoseVisibility() {
  console.log('🔍 Checking Mental Detox Challenge Visibility\n');
  console.log('=' .repeat(80) + '\n');

  try {
    // Get all auth users first
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    // Create a map of user IDs to emails
    const userMap = {};
    users.forEach(u => {
      userMap[u.id] = u.email || u.user_metadata?.name || u.id.substring(0, 8);
    });

    // Get the Mental Detox challenge ID using REST API
    const challengeResponse = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/challenges?name=ilike.*Mental*Detox*&select=id,name`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!challengeResponse.ok) {
      console.error('❌ Error fetching challenge:', challengeResponse.statusText);
      return;
    }

    const challenges = await challengeResponse.json();

    if (!challenges || challenges.length === 0) {
      console.log('❌ Could not find Mental Detox challenge');
      return;
    }

    const challengeId = challenges[0].id;
    console.log(`✅ Found challenge: ${challenges[0].name}`);
    console.log(`   ID: ${challengeId}\n`);

    // Get all participations using REST API to bypass RLS
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/challenge_participants?challenge_id=eq.${challengeId}&select=*`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('❌ Error fetching participations:', response.statusText);
      return;
    }

    const participations = await response.json();

    if (!participations || participations.length === 0) {
      console.log('❌ No participations found for this challenge');
      return;
    }

    console.log(`📊 Found ${participations.length} participants\n`);
    console.log('=' .repeat(80) + '\n');

    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let canSeeCount = 0;
    let cantSeeCount = 0;

    participations.forEach((p, index) => {
      const userIdentifier = userMap[p.user_id] || p.user_id.substring(0, 8);
      const startDate = new Date(p.personal_start_date);
      const startDateLocal = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

      const daysSinceStart = Math.floor((todayLocal.getTime() - startDateLocal.getTime()) / (1000 * 60 * 60 * 24));
      const currentDay = daysSinceStart + 1;

      const canSeeActivities = currentDay >= 1;

      if (canSeeActivities) {
        canSeeCount++;
      } else {
        cantSeeCount++;
      }

      console.log(`${index + 1}. ${canSeeActivities ? '✅' : '❌'} ${userIdentifier}`);
      console.log(`   Status: ${p.status}`);
      console.log(`   Start Date: ${p.personal_start_date}`);
      console.log(`   Start Date (Local): ${startDateLocal.toISOString()}`);
      console.log(`   Today (Local): ${todayLocal.toISOString()}`);
      console.log(`   Days Since Start: ${daysSinceStart}`);
      console.log(`   Current Day: ${currentDay}`);
      console.log(`   Can See Activities: ${canSeeActivities ? '✅ YES' : '❌ NO (starts in ' + (Math.abs(currentDay) + 1) + ' days)'}`);
      console.log('');
    });

    console.log('=' .repeat(80));
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Can see activities: ${canSeeCount} users`);
    console.log(`   ❌ Cannot see activities (future start): ${cantSeeCount} users`);

    if (cantSeeCount > 0) {
      console.log(`\n🔧 Run the SQL fix to update ${cantSeeCount} user(s) so they can see activities today.`);
    } else {
      console.log(`\n✅ All users can already see their activities!`);
    }

  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

diagnoseVisibility().catch(console.error);
