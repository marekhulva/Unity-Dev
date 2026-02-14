#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

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

async function listUsers() {
  console.log('📋 Listing all users in database...\n');

  // Get profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, username, name, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Found ${profiles.length} users:\n`);

  profiles.forEach((profile, index) => {
    console.log(`${index + 1}. ${profile.email}`);
    console.log(`   Username: ${profile.username || 'N/A'}`);
    console.log(`   Name: ${profile.name || 'N/A'}`);
    console.log(`   ID: ${profile.id}`);
    console.log(`   Created: ${new Date(profile.created_at).toLocaleString()}`);
    console.log('');
  });
}

listUsers().catch(console.error);
