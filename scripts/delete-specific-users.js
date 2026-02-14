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

async function deleteSpecificUsers() {
  const emailsToDelete = [
    'hulva.marek15@gmail.com',
    'hmarek1144@gmail.com'
  ];

  console.log('🔍 Searching for users to delete...\n');

  // Get ALL users from auth
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000 // Get up to 1000 users
  });

  if (error) {
    console.error('❌ Error listing users:', error);
    return;
  }

  console.log(`📋 Total users in database: ${data.users.length}\n`);

  // Find users matching our emails
  const usersToDelete = data.users.filter(u =>
    emailsToDelete.includes(u.email)
  );

  if (usersToDelete.length === 0) {
    console.log('⚠️  No matching users found!');
    console.log('\nShowing all users in the system:');
    data.users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.email} (ID: ${u.id})`);
    });
    return;
  }

  console.log(`Found ${usersToDelete.length} user(s) to delete:\n`);

  // Delete each user
  for (const user of usersToDelete) {
    console.log(`🗑️  Deleting: ${user.email}`);
    console.log(`   User ID: ${user.id}`);

    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      user.id
    );

    if (deleteError) {
      console.error(`   ❌ Error:`, deleteError.message);
    } else {
      console.log(`   ✅ Deleted successfully!`);
    }
    console.log('');
  }

  console.log('✨ Done!');
}

deleteSpecificUsers().catch(console.error);
