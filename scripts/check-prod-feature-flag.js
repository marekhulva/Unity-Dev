#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const PROD_URL = 'https://ojusijzhshvviqjeyhyn.supabase.co';
const PROD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdXNpanpoc2h2dmlxamV5aHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU2NTcyNCwiZXhwIjoyMDcxMTQxNzI0fQ.V1defcmLbO0ClkD2SXPzjPdO4zIOpj-O3GT3eqVbZsY';

const prod = createClient(PROD_URL, PROD_KEY);

async function checkFlag() {
  const { data } = await prod.from('feature_flags').select('*');
  console.log('Feature flags in PRODUCTION database:\n');
  console.log(JSON.stringify(data, null, 2));
}

checkFlag();
