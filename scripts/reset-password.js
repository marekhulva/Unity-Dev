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

async function resetPassword(email, newPassword) {
  console.log(`🔑 Resetting password for: ${email}`);

  // Get all users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Error listing users:', listError.message);
    return false;
  }

  // Find the user by email
  const user = users.find(u => u.email === email);

  if (!user) {
    console.log(`  ⚠️  User not found with email: ${email}`);
    return false;
  }

  console.log(`  Found user ID: ${user.id}`);

  // Update the user's password
  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );

  if (error) {
    console.error(`  ❌ Error resetting password:`, error.message);
    return false;
  }

  console.log(`  ✅ Password reset successfully!`);
  return true;
}

async function main() {
  const emails = [
    'hulva.marek15@gmail.com',
    'hmarek1144@gmail.com'
  ];

  const newPassword = 'Test1234!'; // You can change this

  console.log('🔐 Resetting passwords for test accounts...\n');
  console.log(`New password will be: ${newPassword}\n`);

  for (const email of emails) {
    await resetPassword(email, newPassword);
    console.log('');
  }

  console.log('✨ Done!');
  console.log(`\nYou can now log in with any of these emails using password: ${newPassword}`);
}

main().catch(console.error);
