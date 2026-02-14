#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY  // Use anon key instead
);

async function createJingCircle() {
  // First, try to get current authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.log('Not authenticated. Using hardcoded user ID from logs.');
    // Fallback to the user ID we saw in the logs
    const userId = 'af929cbc-9a67-4c8c-91b1-71bbc982c429';

    // Try to create circle directly
    const { data: circle, error: circleError } = await supabase
      .from('circles')
      .insert({
        name: 'JING',
        created_by: userId,
        emoji: '⚡'
      })
      .select()
      .single();

    if (circleError) {
      console.error('Error creating circle:', circleError);
      return;
    }

    console.log('✅ Circle created:', circle);

    // Add as member
    const { error: memberError } = await supabase
      .from('circle_members')
      .insert({
        circle_id: circle.id,
        user_id: userId,
        role: 'admin'
      });

    if (memberError) {
      console.error('Error adding member:', memberError);
      return;
    }

    console.log('✅ Added as admin member');
    console.log('\nCircle Details:');
    console.log('ID:', circle.id);
    console.log('Name:', circle.name);
    console.log('Emoji:', circle.emoji);
  } else {
    console.log('Authenticated user:', user.id);
  }
}

createJingCircle().catch(console.error);
