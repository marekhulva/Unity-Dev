import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = 'https://ojusijzhshvviqjeyhyn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdXNpanpoc2h2dmlxamV5aHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NjU3MjQsImV4cCI6MjA3MTE0MTcyNH0.rlQ9lIGzoaLTOW-5-W0G1J1A0WwvqZMnhGHW-FwV8GQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('🔧 Fixing orphaned posts...\n');

  const sql = fs.readFileSync('./fix-orphaned-posts.sql', 'utf-8');

  // Try running with RPC if available
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  You may need to run this SQL directly in the Supabase SQL editor.');
    console.log('   The SQL has been saved to: fix-orphaned-posts.sql');
  } else {
    console.log('✅ Successfully fixed orphaned posts!');
    console.log('   Result:', data);
  }
}

main().catch(console.error);
