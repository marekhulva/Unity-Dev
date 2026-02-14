#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY  // Use anon key for password reset
);

async function sendPasswordReset(email) {
  console.log(`📧 Sending password reset email to: ${email}`);

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'http://localhost:8099/reset-password'
  });

  if (error) {
    console.error(`   ❌ Error:`, error.message);
    return false;
  }

  console.log(`   ✅ Reset email sent!`);
  return true;
}

async function main() {
  const emails = [
    'hulva.marek15@gmail.com',
    'hmarek1144@gmail.com'
  ];

  console.log('🔐 Sending password reset emails...\n');

  for (const email of emails) {
    await sendPasswordReset(email);
  }

  console.log('\n✨ Check your email inbox for reset links!');
}

main().catch(console.error);
