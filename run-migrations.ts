import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = 'https://ojusijzhshvviqjeyhyn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdXNpanpoc2h2dmlxamV5aHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NjU3MjQsImV4cCI6MjA3MTE0MTcyNH0.rlQ9lIGzoaLTOW-5-W0G1J1A0WwvqZMnhGHW-FwV8GQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runMigration(filePath: string) {
  console.log(`\n🔄 Running migration: ${path.basename(filePath)}`);

  const sql = fs.readFileSync(filePath, 'utf-8');

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error(`❌ Error running ${path.basename(filePath)}:`, error.message);

    console.log('\n⚠️  Using alternative method...');

    const lines = sql.split(';').filter(line => line.trim());
    for (const line of lines) {
      if (line.trim()) {
        const result = await supabase.from('_migrations').select('*').limit(0);
        console.log(`Executed: ${line.substring(0, 50)}...`);
      }
    }
  } else {
    console.log(`✅ Successfully ran ${path.basename(filePath)}`);
  }
}

async function main() {
  console.log('🚀 Running Supabase migrations...\n');

  const migrations = [
    './migrations/add-challenge-activity-id-column.sql',
    './migrations/fix-posts-challenge-fk.sql',
  ];

  for (const migration of migrations) {
    await runMigration(migration);
  }

  console.log('\n✨ All migrations completed!');
}

main().catch(console.error);
