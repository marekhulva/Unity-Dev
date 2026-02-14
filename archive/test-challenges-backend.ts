import { supabaseChallengeService } from './src/services/supabase.challenges.service.js';

async function testChallengesBackend() {
  console.log('\n🧪 ===== TESTING CHALLENGES BACKEND ===== 🧪\n');

  try {
    console.log('📋 TEST 1: Fetch Global Challenges');
    const globalChallenges = await supabaseChallengeService.getGlobalChallenges();
    console.log(`✅ Found ${globalChallenges.length} global challenges`);
    globalChallenges.forEach(c => {
      console.log(`   - ${c.emoji} ${c.name} (${c.duration_days} days)`);
    });

    if (globalChallenges.length === 0) {
      console.log('⚠️  No challenges found. Run the seed data SQL first!');
      console.log('   File: /home/marek/Unity 2.0/migrations/test-seed-data.sql\n');
      return;
    }

    const testChallenge = globalChallenges[0];
    console.log(`\n📋 TEST 2: Get Challenge Details for "${testChallenge.name}"`);
    const challengeDetails = await supabaseChallengeService.getChallenge(testChallenge.id);
    if (challengeDetails) {
      console.log(`✅ Challenge details retrieved`);
      console.log(`   Participant count: ${challengeDetails.participant_count || 0}`);
      console.log(`   Already joined: ${challengeDetails.my_participation ? 'YES' : 'NO'}`);
      console.log(`   Activities: ${challengeDetails.predetermined_activities.length}`);
    }

    console.log('\n📋 TEST 3: Get My Active Challenges');
    const activeChallenges = await supabaseChallengeService.getMyActiveChallenges();
    console.log(`✅ You have ${activeChallenges.length} active challenges`);
    activeChallenges.forEach(c => {
      console.log(`   - ${c.emoji} ${c.name}`);
      if (c.my_participation) {
        console.log(`     Day ${c.my_participation.current_day}, ${c.my_participation.completion_percentage.toFixed(1)}% complete`);
      }
    });

    console.log('\n📋 TEST 4: Get My Completed Challenges');
    const completedChallenges = await supabaseChallengeService.getMyCompletedChallenges();
    console.log(`✅ You have ${completedChallenges.length} completed challenges`);

    console.log('\n📋 TEST 5: Get My Badges');
    const badges = await supabaseChallengeService.getMyBadges();
    console.log(`✅ You have ${badges.length} badges`);
    badges.forEach(b => {
      console.log(`   ${b.badge_emoji} ${b.badge_name} (${b.badge_type})`);
    });

    if (activeChallenges.length > 0) {
      const activeChallenge = activeChallenges[0];
      console.log(`\n📋 TEST 6: Get Leaderboard for "${activeChallenge.name}"`);
      const leaderboard = await supabaseChallengeService.getLeaderboard(activeChallenge.id, 10);
      console.log(`✅ Leaderboard has ${leaderboard.length} participants`);
      leaderboard.slice(0, 3).forEach(entry => {
        console.log(`   #${entry.rank} ${entry.username} - ${entry.completion_percentage.toFixed(1)}%`);
      });
    }

    console.log('\n🎉 ===== ALL TESTS PASSED! ===== 🎉\n');
    console.log('✅ Backend is working correctly!');
    console.log('✅ Ready to proceed with Phase 3 (UI Implementation)\n');

  } catch (error: any) {
    console.error('\n❌ ===== TEST FAILED ===== ❌\n');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.log('\n🔧 Fix the error above before proceeding to Phase 3\n');
  }
}

testChallengesBackend();
