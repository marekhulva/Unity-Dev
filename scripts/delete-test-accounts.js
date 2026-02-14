#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

// Service role key bypasses RLS
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

async function deleteTestAccounts() {
  const emails = [
    'hulva.marek15@gmail.com',
    'hmarek1144@gmail.com'
  ];

  console.log('🗑️  Deleting test accounts...\n');

  for (const email of emails) {
    console.log(`Deleting: ${email}`);

    // Get user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      continue;
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
      console.log(`  ⚠️  User not found`);
      continue;
    }

    console.log(`  Found user ID: ${user.id}`);

    // Delete the user (this will cascade delete profiles, posts, etc. due to foreign keys)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error(`  ❌ Error deleting user:`, deleteError.message);
    } else {
      console.log(`  ✅ Deleted successfully`);
    }
  }

  console.log('\n✨ Done!');
}

deleteTestAccounts().catch(console.error);
