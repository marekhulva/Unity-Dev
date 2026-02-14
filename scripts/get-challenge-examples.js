#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ojusijzhshvviqjeyhyn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdXNpanpoc2h2dmlxamV5aHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU2NTcyNCwiZXhwIjoyMDcxMTQxNzI0fQ.V1defcmLbO0ClkD2SXPzjPdO4zIOpj-O3GT3eqVbZsY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function getExamples() {
  const { data, error } = await supabase
    .from('challenges')
    .select('name, description')
    .eq('status', 'active')
    .limit(3);

  if (error) {
    console.error('Error:', error);
    return;
  }

  data.forEach((challenge, i) => {
    console.log(`\n=== CHALLENGE ${i + 1}: ${challenge.name} ===`);
    console.log(challenge.description);
    console.log('\n' + '='.repeat(60));
  });
}

getExamples();
