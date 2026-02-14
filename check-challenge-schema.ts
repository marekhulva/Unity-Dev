import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ojusijzhshvviqjeyhyn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdXNpanpoc2h2dmlxamV5aHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NjU3MjQsImV4cCI6MjA3MTE0MTcyNH0.rlQ9lIGzoaLTOW-5-W0G1J1A0WwvqZMnhGHW-FwV8GQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSchema() {
  console.log('📋 Fetching existing challenge to see schema...');

  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('🔴 Error:', error);
    process.exit(1);
  }

  console.log('🟢 Existing challenge structure:');
  console.log(JSON.stringify(data, null, 2));
  console.log('\n📊 Fields present:');
  console.log(Object.keys(data).sort().join(', '));

  process.exit(0);
}

checkSchema();
