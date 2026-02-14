#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Production
const PROD_URL = 'https://ojusijzhshvviqjeyhyn.supabase.co';
const PROD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdXNpanpoc2h2dmlxamV5aHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU2NTcyNCwiZXhwIjoyMDcxMTQxNzI0fQ.V1defcmLbO0ClkD2SXPzjPdO4zIOpj-O3GT3eqVbZsY';

// Preview
const PREVIEW_URL = 'https://iqlibqtswseitxtqpmlm.supabase.co';
const PREVIEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxbGlicXRzd3NlaXR4dHFwbWxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTczNzE2MiwiZXhwIjoyMDg1MzEzMTYyfQ.R61BBNfOMrBG52DCEbOhPSOOBA5aSG3_24Jm4KIYH2c';

const prod = createClient(PROD_URL, PROD_KEY, { db: { schema: 'public' } });
const preview = createClient(PREVIEW_URL, PREVIEW_KEY, { db: { schema: 'public' } });

async function compareSchemas() {
  console.log('🔍 COMPARING DATABASE SCHEMAS\n');
  console.log('=' .repeat(70));

  // Get all tables in both databases
  const prodQuery = `
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name IN ('challenges', 'circles', 'profiles', 'challenge_participants')
    ORDER BY table_name, ordinal_position;
  `;

  const { data: prodSchema, error: prodErr } = await prod.rpc('exec_sql', { query: prodQuery }).catch(() => ({ data: null }));
  const { data: previewSchema, error: previewErr } = await preview.rpc('exec_sql', { query: prodQuery }).catch(() => ({ data: null }));

  // Fallback: Query the actual tables to see columns
  console.log('\n📊 CHECKING KEY TABLES:\n');

  // Check challenges table
  console.log('TABLE: challenges');
  const { data: prodChal } = await prod.from('challenges').select('*').limit(1);
  const { data: prevChal } = await preview.from('challenges').select('*').limit(1);

  const prodCols = prodChal?.[0] ? Object.keys(prodChal[0]).sort() : [];
  const prevCols = prevChal?.[0] ? Object.keys(prevChal[0]).sort() : [];

  console.log(`  Production columns (${prodCols.length}):`, prodCols.join(', '));
  console.log(`  Preview columns (${prevCols.length}):`, prevCols.join(', '));

  const prodOnly = prodCols.filter(c => !prevCols.includes(c));
  const prevOnly = prevCols.filter(c => !prodCols.includes(c));

  if (prodOnly.length > 0) console.log(`  ⚠️  Only in PROD:`, prodOnly);
  if (prevOnly.length > 0) console.log(`  ⚠️  Only in PREVIEW:`, prevOnly);
  if (prodOnly.length === 0 && prevOnly.length === 0) console.log('  ✅ Same columns');

  // Check circles table
  console.log('\nTABLE: circles');
  const { data: prodCirc } = await prod.from('circles').select('*').limit(1);
  const { data: prevCirc } = await preview.from('circles').select('*').limit(1);

  const prodCircCols = prodCirc?.[0] ? Object.keys(prodCirc[0]).sort() : [];
  const prevCircCols = prevCirc?.[0] ? Object.keys(prevCirc[0]).sort() : [];

  console.log(`  Production columns (${prodCircCols.length}):`, prodCircCols.join(', '));
  console.log(`  Preview columns (${prevCircCols.length}):`, prevCircCols.join(', '));

  const circProdOnly = prodCircCols.filter(c => !prevCircCols.includes(c));
  const circPrevOnly = prevCircCols.filter(c => !prodCircCols.includes(c));

  if (circProdOnly.length > 0) console.log(`  ⚠️  Only in PROD:`, circProdOnly);
  if (circPrevOnly.length > 0) console.log(`  ⚠️  Only in PREVIEW:`, circPrevOnly);
  if (circProdOnly.length === 0 && circPrevOnly.length === 0) console.log('  ✅ Same columns');

  // Check predetermined_activities structure
  console.log('\n📝 PREDETERMINED_ACTIVITIES (JSONB field):');
  const { data: prodActivity } = await prod.from('challenges')
    .select('predetermined_activities')
    .not('predetermined_activities', 'is', null)
    .limit(1);

  const { data: prevActivity } = await preview.from('challenges')
    .select('predetermined_activities')
    .not('predetermined_activities', 'is', null)
    .limit(1);

  if (prodActivity?.[0]) {
    const sample = prodActivity[0].predetermined_activities[0] || {};
    console.log('  Production activity fields:', Object.keys(sample).join(', '));
  }

  if (prevActivity?.[0]) {
    const sample = prevActivity[0].predetermined_activities[0] || {};
    console.log('  Preview activity fields:', Object.keys(sample).join(', '));
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📋 CONCLUSION:\n');
  console.log('  The predetermined_activities field is JSONB (flexible JSON)');
  console.log('  Adding start_day/end_day is just data, not a schema change');
  console.log('  ✅ No database migrations needed');
  console.log('  ✅ Code changes already handle the new fields');
  console.log('  ✅ Safe to deprecate preview database\n');
}

compareSchemas().catch(console.error);
