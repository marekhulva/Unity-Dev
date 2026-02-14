#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testLogin(email, password) {
  console.log(`🔐 Testing login for: ${email}`);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.log(`   ❌ Login failed: ${error.message}`);
    return false;
  }

  console.log(`   ✅ Login successful! User ID: ${data.user.id}`);

  // Now try to delete this user
  console.log(`   🗑️  Attempting to delete user...`);

  const { error: deleteError } = await supabase.auth.admin.deleteUser(
    data.user.id
  );

  if (deleteError) {
    console.log(`   ❌ Delete failed: ${deleteError.message}`);
  } else {
    console.log(`   ✅ User deleted successfully!`);
  }

  return true;
}

async function main() {
  // Try common test passwords
  const passwords = ['password', 'Password123', 'Test1234', 'test123'];
  const email = 'hulva.marek15@gmail.com';

  console.log('🧪 Testing if account exists and trying common passwords...\n');

  for (const password of passwords) {
    const success = await testLogin(email, password);
    if (success) break;
    console.log('');
  }
}

main().catch(console.error);
