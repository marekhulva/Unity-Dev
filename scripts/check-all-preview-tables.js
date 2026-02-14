#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const PREVIEW_URL = 'https://iqlibqtswseitxtqpmlm.supabase.co';
const PREVIEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxbGlicXRzd3NlaXR4dHFwbWxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTczNzE2MiwiZXhwIjoyMDg1MzEzMTYyfQ.R61BBNfOMrBG52DCEbOhPSOOBA5aSG3_24Jm4KIYH2c';

const preview = createClient(PREVIEW_URL, PREVIEW_KEY);

async function checkAllTables() {
  console.log('🔍 Checking ALL tables in Preview Database\n');
  
  // Get all table names
  const { data, error } = await preview
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .order('table_name');

  if (error) {
    console.log('Error querying schema:', error.message);
    console.log('\nTrying alternative method...\n');
    
    // List of common tables to check
    const possibleTables = [
      'challenges', 'circles', 'circle_members', 'profiles', 'posts',
      'challenge_participants', 'daily_actions', 'goals', 'daily_reviews',
      'feature_flags', 'notifications', 'user_settings', 'activities',
      'post_likes', 'post_comments', 'user_stats'
    ];
    
    console.log('Checking common tables:\n');
    for (const table of possibleTables) {
      const { data, error } = await preview.from(table).select('*').limit(1);
      if (!error) {
        const { count } = await preview.from(table).select('*', { count: 'exact', head: true });
        console.log(`✅ ${table.padEnd(25)} - ${count} rows`);
      }
    }
    return;
  }

  console.log('All tables in preview database:\n');
  for (const table of data || []) {
    const { count } = await preview
      .from(table.table_name)
      .select('*', { count: 'exact', head: true });
    console.log(`  ${table.table_name.padEnd(30)} - ${count} rows`);
  }
}

checkAllTables();
