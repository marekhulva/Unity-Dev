#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const PROD_URL = 'https://ojusijzhshvviqjeyhyn.supabase.co';
const PROD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdXNpanpoc2h2dmlxamV5aHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU2NTcyNCwiZXhwIjoyMDcxMTQxNzI0fQ.V1defcmLbO0ClkD2SXPzjPdO4zIOpj-O3GT3eqVbZsY';

const PREVIEW_URL = 'https://iqlibqtswseitxtqpmlm.supabase.co';
const PREVIEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxbGlicXRzd3NlaXR4dHFwbWxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTczNzE2MiwiZXhwIjoyMDg1MzEzMTYyfQ.R61BBNfOMrBG52DCEbOhPSOOBA5aSG3_24Jm4KIYH2c';

const prod = createClient(PROD_URL, PROD_KEY);
const preview = createClient(PREVIEW_URL, PREVIEW_KEY);

async function compareTables() {
  console.log('🔍 COMPARING ALL TABLES\n');
  console.log('='.repeat(70));
  
  const tables = [
    'challenges', 'circles', 'circle_members', 'profiles', 'posts',
    'challenge_participants', 'feature_flags', 'goals', 'daily_reviews',
    'notifications', 'post_comments', 'daily_actions', 'activities'
  ];
  
  console.log('\nTable'.padEnd(30) + 'Production'.padEnd(15) + 'Preview');
  console.log('-'.repeat(70));
  
  for (const table of tables) {
    const prodResult = await prod.from(table).select('*', { count: 'exact', head: true });
    const prevResult = await preview.from(table).select('*', { count: 'exact', head: true });
    
    const prodExists = !prodResult.error;
    const prevExists = !prevResult.error;
    
    const prodCount = prodExists ? prodResult.count : 'N/A';
    const prevCount = prevExists ? prevResult.count : 'N/A';
    
    const prodStr = prodExists ? `✅ ${prodCount} rows` : '❌ Missing';
    const prevStr = prevExists ? `✅ ${prevCount} rows` : '❌ Missing';
    
    console.log(table.padEnd(30) + prodStr.padEnd(15) + prevStr);
  }
  
  console.log('\n' + '='.repeat(70));
}

compareTables();
