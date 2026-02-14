const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://ojusijzhshvviqjeyhyn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'NEED_SERVICE_KEY';

async function applyMigration() {
  console.log('🔄 Applying notifications migration...');

  if (SUPABASE_SERVICE_KEY === 'NEED_SERVICE_KEY') {
    console.log('\n⚠️  SERVICE KEY REQUIRED');
    console.log('\nTo apply this migration, you have two options:\n');
    console.log('Option 1: Use the Supabase Dashboard');
    console.log('  1. Go to https://supabase.com/dashboard/project/ojusijzhshvviqjeyhyn/editor');
    console.log('  2. Copy the contents of supabase/migrations/20251030_create_notifications_table.sql');
    console.log('  3. Paste and run it in the SQL Editor\n');
    console.log('Option 2: Run this script with your service role key:');
    console.log('  SUPABASE_SERVICE_KEY=your_key node apply-notifications-migration.js\n');
    console.log('  Find your service key at:');
    console.log('  https://supabase.com/dashboard/project/ojusijzhshvviqjeyhyn/settings/api\n');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const migrationPath = path.join(__dirname, 'supabase/migrations/20251030_create_notifications_table.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('❌ Error applying migration:', error);
  } else {
    console.log('✅ Migration applied successfully!');
  }
}

applyMigration();
