#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('📊 Running push_tokens migration...\n');

  const migrationPath = path.join(__dirname, '../supabase/migrations/20260212_create_push_tokens.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    // Execute using rpc
    const { error } = await supabase.rpc('exec_sql', { query: sql });

    if (error && error.message.includes('Could not find')) {
      console.log('⚠️  exec_sql function not available. Running in Supabase SQL Editor instead...\n');
      console.log('📋 Copy and paste this SQL into Supabase SQL Editor:');
      console.log('   https://supabase.com/dashboard/project/ojusijzhshvviqjeyhyn/sql\n');
      console.log('─'.repeat(80));
      console.log(sql);
      console.log('─'.repeat(80));
      console.log('\n✅ After running, the push_tokens table will be ready!');
    } else if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Migration completed successfully!');
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

runMigration().catch(console.error);
