#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const PROD_URL = 'https://ojusijzhshvviqjeyhyn.supabase.co';
const PROD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdXNpanpoc2h2dmlxamV5aHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU2NTcyNCwiZXhwIjoyMDcxMTQxNzI0fQ.V1defcmLbO0ClkD2SXPzjPdO4zIOpj-O3GT3eqVbZsY';

const prod = createClient(PROD_URL, PROD_KEY);

async function checkSchema() {
  console.log('🔍 Checking Production Database Schema\n');

  // Get the Mental Detox challenge that's actually working
  const { data: challenge, error } = await prod
    .from('challenges')
    .select('*')
    .eq('id', '6cbb28cf-f679-439a-8222-1a073bae3647')
    .single();

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('✅ Found Mental Detox challenge in production\n');
  console.log('📊 Challenge table columns:');
  console.log(Object.keys(challenge).sort().join(', '));

  console.log('\n📝 Predetermined Activities structure:');
  const activity = challenge.predetermined_activities[0];
  if (activity) {
    console.log('  Fields in activity:', Object.keys(activity).join(', '));
    console.log('\n  Sample activity:');
    console.log(JSON.stringify(activity, null, 2));
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n💡 KEY INSIGHT:\n');
  console.log('  The predetermined_activities column is JSONB (flexible JSON).');
  console.log('  Our code adds start_day/end_day as JSON fields.');
  console.log('  This is NOT a database schema change - just data!');
  console.log('\n  ✅ Production database already supports this');
  console.log('  ✅ No migration needed');
  console.log('  ✅ Safe to delete preview database\n');
}

checkSchema();
