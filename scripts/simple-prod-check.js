#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const PROD_URL = 'https://ojusijzhshvviqjeyhyn.supabase.co';
const PROD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdXNpanpoc2h2dmlxamV5aHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU2NTcyNCwiZXhwIjoyMDcxMTQxNzI0fQ.V1defcmLbO0ClkD2SXPzjPdO4zIOpj-O3GT3eqVbZsY';

const prod = createClient(PROD_URL, PROD_KEY);

async function check() {
  console.log('Testing production connection...\n');
  
  // Try to get Mental Detox challenge
  const { data: challenge, error: chalError } = await prod
    .from('challenges')
    .select('id, name')
    .eq('id', '6cbb28cf-f679-439a-8222-1a073bae3647')
    .single();
  
  console.log('Challenges table:');
  if (chalError) {
    console.log('  ❌ Error:', chalError.message);
  } else {
    console.log('  ✅ Found:', challenge.name);
  }
  
  // Try feature_flags
  const { data: flags, error: flagError } = await prod
    .from('feature_flags')
    .select('*');
  
  console.log('\nFeature_flags table:');
  if (flagError) {
    console.log('  ❌ Error:', flagError.message);
  } else {
    console.log('  ✅ Exists, rows:', flags?.length || 0);
    if (flags && flags.length > 0) {
      console.log('  Flags:', JSON.stringify(flags, null, 2));
    }
  }
}

check();
