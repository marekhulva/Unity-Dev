#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUser() {
  // Check auth users
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('Auth error:', authError);
  } else {
    console.log('Auth users:', authData.users.map(u => ({ id: u.id, email: u.email })));
  }

  // Check profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, name')
    .limit(5);

  if (profileError) {
    console.error('Profile error:', profileError);
  } else {
    console.log('\nProfiles:', JSON.stringify(profiles, null, 2));
  }
}

checkUser();
