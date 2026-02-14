#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const PROD_URL = 'https://ojusijzhshvviqjeyhyn.supabase.co';
const PROD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdXNpanpoc2h2dmlxamV5aHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU2NTcyNCwiZXhwIjoyMDcxMTQxNzI0fQ.V1defcmLbO0ClkD2SXPzjPdO4zIOpj-O3GT3eqVbZsY';

const prod = createClient(PROD_URL, PROD_KEY);

async function checkLivingProgress() {
  console.log('🔍 Checking if Living Progress Cards schema exists in PRODUCTION\n');

  // Try to query posts table with living progress fields
  const { data, error } = await prod
    .from('posts')
    .select('id, is_daily_progress, progress_date, completed_actions, total_actions, actions_today')
    .limit(1);

  if (error) {
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      console.log('❌ Living Progress Cards columns DO NOT exist in production');
      console.log('   Error:', error.message);
      console.log('\n⚠️  YOU NEED TO RUN THE MIGRATION!\n');
      return false;
    }
    console.log('Error:', error.message);
    return false;
  }

  console.log('✅ Living Progress Cards columns exist in production!');
  console.log('   Columns found: is_daily_progress, progress_date, completed_actions, etc.');

  // Check if feature flag exists
  const { data: flagData } = await prod
    .from('feature_flags')
    .select('*')
    .eq('name', 'use_living_progress_cards')
    .single();

  if (flagData) {
    console.log(`\n🚩 Feature flag: use_living_progress_cards = ${flagData.enabled}`);
  }

  console.log('\n✅ Production database has Living Progress Cards schema');
  console.log('✅ Safe to delete preview branch\n');
  return true;
}

checkLivingProgress();
