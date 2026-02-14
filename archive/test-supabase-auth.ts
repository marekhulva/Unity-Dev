import { supabase } from './src/services/supabase.service.js';

async function testSupabaseAuth() {
  console.log('\n🧪 ===== TESTING SUPABASE AUTH & CHALLENGES ===== 🧪\n');

  try {
    console.log('📋 TEST 1: Check Current User Authentication');
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.log('❌ Auth Error:', authError.message);
      console.log('⚠️  You need to be logged in! Go to your app and sign in first.\n');
      return;
    }

    if (!user) {
      console.log('❌ No user found');
      console.log('⚠️  You need to be logged in! Go to your app and sign in first.\n');
      return;
    }

    console.log('✅ User authenticated:', user.email);
    console.log('   User ID:', user.id);
    console.log('   Role:', user.role || 'authenticated');

    console.log('\n📋 TEST 2: Check Supabase Client Configuration');
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    console.log('✅ Supabase URL configured:', supabaseUrl ? 'Yes' : 'No');
    if (supabaseUrl) {
      console.log('   URL:', supabaseUrl.substring(0, 30) + '...');
    }

    console.log('\n📋 TEST 3: Try to Query Challenges Table (Direct)');
    const { data: challenges, error: challengesError } = await supabase
      .from('challenges')
      .select('*')
      .limit(5);

    if (challengesError) {
      console.log('❌ Query Error:', challengesError.message);
      console.log('   Error Code:', challengesError.code);
      console.log('   Error Details:', challengesError.details);
      console.log('   Error Hint:', challengesError.hint);

      if (challengesError.code === '42501') {
        console.log('\n🔴 CONFIRMED: RLS Permission Denied Error');
        console.log('   This means the RLS policies are blocking access');
        console.log('   Even though you\'re authenticated as:', user.email);
        console.log('\n💡 SOLUTION: The previous RLS fixes didn\'t work.');
        console.log('   Try running: migrations/comprehensive-rls-fix.sql');
        console.log('   OR temporarily disable RLS for testing:');
        console.log('   ALTER TABLE challenges DISABLE ROW LEVEL SECURITY;\n');
      }

      if (challengesError.code === '42P01') {
        console.log('\n🔴 Table doesn\'t exist!');
        console.log('   You need to run the migration: migrations/phase2-challenges-schema.sql\n');
      }

      return;
    }

    console.log('✅ Successfully queried challenges table!');
    console.log('   Found', challenges?.length || 0, 'challenges');

    if (challenges && challenges.length > 0) {
      challenges.forEach(c => {
        console.log(`   - ${c.emoji} ${c.name}`);
      });
    }

    console.log('\n📋 TEST 4: Try to Query Challenge Participants Table');
    const { data: participants, error: participantsError } = await supabase
      .from('challenge_participants')
      .select('*')
      .limit(5);

    if (participantsError) {
      console.log('❌ Query Error:', participantsError.message);
      console.log('   Error Code:', participantsError.code);
    } else {
      console.log('✅ Successfully queried challenge_participants table!');
      console.log('   Found', participants?.length || 0, 'participations');
    }

    console.log('\n📋 TEST 5: Check Current Session');
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      console.log('✅ Active session found');
      console.log('   Access token length:', session.access_token?.length || 0);
      console.log('   Token expires at:', new Date(session.expires_at! * 1000).toLocaleString());
    } else {
      console.log('⚠️  No active session (but user exists)');
    }

    console.log('\n📋 TEST 6: Test with Service Layer');
    const { supabaseChallengeService } = await import('./src/services/supabase.challenges.service.js');

    try {
      const serviceChallenges = await supabaseChallengeService.getGlobalChallenges();
      console.log('✅ Service layer query succeeded!');
      console.log('   Found', serviceChallenges.length, 'challenges via service');
    } catch (serviceError: any) {
      console.log('❌ Service layer error:', serviceError.message);
    }

    console.log('\n🎉 ===== DIAGNOSTIC COMPLETE ===== 🎉\n');

    if (!challengesError && !participantsError) {
      console.log('✅ ALL TESTS PASSED!');
      console.log('✅ Supabase is working correctly');
      console.log('✅ The RLS policies are allowing access');
      console.log('✅ Your issue might be in the frontend code\n');
    }

  } catch (error: any) {
    console.error('\n❌ ===== UNEXPECTED ERROR ===== ❌\n');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSupabaseAuth();
