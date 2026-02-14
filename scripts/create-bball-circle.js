// Script to create the Bball circle
// Run this script to create a new circle called "Bball" in your app

import { createClient } from '@supabase/supabase-js';

// Use your Supabase credentials
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createBballCircle() {
  try {
    console.log('🏀 Creating Bball circle...');
    
    // First, sign in as a user (you need to be authenticated)
    // Replace with your actual credentials
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'your-email@example.com', // Replace with your email
      password: 'your-password'         // Replace with your password
    });
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }
    
    console.log('✅ Authenticated as:', authData.user.email);
    
    // Generate a unique invite code
    const inviteCode = 'BBALL' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    // Create the circle
    const { data: circle, error: circleError } = await supabase
      .from('circles')
      .insert({
        name: 'Bball',
        description: 'Basketball enthusiasts unite! Share your hoops journey, training sessions, and game highlights. Whether you\'re practicing free throws or running drills, this is your court. 🏀',
        invite_code: inviteCode,
        created_by: authData.user.id
      })
      .select()
      .single();
    
    if (circleError) {
      if (circleError.message.includes('duplicate')) {
        console.log('⚠️ Bball circle already exists');
        
        // Fetch existing circle
        const { data: existingCircle } = await supabase
          .from('circles')
          .select('*')
          .eq('name', 'Bball')
          .single();
        
        if (existingCircle) {
          console.log('📍 Existing Bball circle:');
          console.log('   Name:', existingCircle.name);
          console.log('   Invite Code:', existingCircle.invite_code);
          console.log('   Description:', existingCircle.description);
        }
      } else {
        console.error('❌ Error creating circle:', circleError);
      }
      return;
    }
    
    console.log('✅ Circle created successfully!');
    console.log('📍 Circle details:');
    console.log('   ID:', circle.id);
    console.log('   Name:', circle.name);
    console.log('   Invite Code:', circle.invite_code);
    console.log('   Description:', circle.description);
    
    // Auto-join the creator to the circle
    const { data: membership, error: memberError } = await supabase
      .from('circle_members')
      .insert({
        circle_id: circle.id,
        user_id: authData.user.id,
        role: 'admin',
        joined_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (memberError) {
      console.error('⚠️ Error adding creator as member:', memberError);
    } else {
      console.log('✅ Creator added as admin member');
    }
    
    // Create default challenges for the circle
    const challenges = [
      {
        circle_id: circle.id,
        name: '30-Day Shooting Challenge',
        description: 'Make 100 shots every day for 30 days. Track your makes and misses! 🎯',
        type: 'streak',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: authData.user.id
      },
      {
        circle_id: circle.id,
        name: 'Weekly Pickup Games',
        description: 'Play at least 2 pickup games per week. Share your highlights! 🏆',
        type: 'recurring',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: authData.user.id
      }
    ];
    
    for (const challenge of challenges) {
      const { error: challengeError } = await supabase
        .from('challenges')
        .insert(challenge);
      
      if (challengeError) {
        console.error(`⚠️ Error creating challenge "${challenge.name}":`, challengeError.message);
      } else {
        console.log(`✅ Created challenge: ${challenge.name}`);
      }
    }
    
    console.log('\n🏀 Bball circle is ready!');
    console.log('📱 Users can join with invite code:', circle.invite_code);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  } finally {
    // Sign out
    await supabase.auth.signOut();
  }
}

// Run the script
createBballCircle();