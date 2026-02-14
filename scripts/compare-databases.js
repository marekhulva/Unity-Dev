#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Production database
const PROD_URL = 'https://ojusijzhshvviqjeyhyn.supabase.co';
const PROD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdXNpanpoc2h2dmlxamV5aHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU2NTcyNCwiZXhwIjoyMDcxMTQxNzI0fQ.V1defcmLbO0ClkD2SXPzjPdO4zIOpj-O3GT3eqVbZsY';

// Preview database
const PREVIEW_URL = 'https://iqlibqtswseitxtqpmlm.supabase.co';
const PREVIEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxbGlicXRzd3NlaXR4dHFwbWxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTczNzE2MiwiZXhwIjoyMDg1MzEzMTYyfQ.R61BBNfOMrBG52DCEbOhPSOOBA5aSG3_24Jm4KIYH2c';

const prod = createClient(PROD_URL, PROD_KEY);
const preview = createClient(PREVIEW_URL, PREVIEW_KEY);

async function compareData() {
  console.log('🔍 COMPARING PRODUCTION vs PREVIEW DATABASES\n');
  console.log('=' .repeat(60));

  // 1. Compare challenges
  console.log('\n📊 CHALLENGES:');
  const { data: prodChallenges, error: prodErr } = await prod.from('challenges').select('id, name, scope, circle_id');
  const { data: previewChallenges, error: previewErr } = await preview.from('challenges').select('id, name, scope, circle_id');

  if (prodErr) console.log('  Production error:', prodErr.message);
  if (previewErr) console.log('  Preview error:', previewErr.message);

  console.log(`  Production: ${prodChallenges?.length || 0} challenges`);
  console.log(`  Preview: ${previewChallenges?.length || 0} challenges`);

  // Find challenges only in preview
  const previewOnly = (previewChallenges || []).filter(p =>
    !(prodChallenges || []).some(c => c.name === p.name)
  );
  if (previewOnly.length > 0) {
    console.log(`\n  ⚠️  Challenges ONLY in preview:`);
    previewOnly.forEach(c => console.log(`     - ${c.name} (${c.scope})`));
  }

  // 2. Compare circles
  console.log('\n👥 CIRCLES:');
  const { data: prodCircles } = await prod.from('circles').select('id, name, join_code, member_count');
  const { data: previewCircles } = await preview.from('circles').select('id, name, join_code, member_count');

  console.log(`  Production: ${prodCircles?.length || 0} circles`);
  console.log(`  Preview: ${previewCircles?.length || 0} circles`);

  const circlesPreviewOnly = (previewCircles || []).filter(p =>
    !(prodCircles || []).some(c => c.name === p.name)
  );
  if (circlesPreviewOnly.length > 0) {
    console.log(`\n  ⚠️  Circles ONLY in preview:`);
    circlesPreviewOnly.forEach(c => console.log(`     - ${c.name} (code: ${c.join_code}, members: ${c.member_count || 0})`));
  }

  // 3. Compare profiles/users
  console.log('\n👤 USERS:');
  const { data: prodUsers } = await prod.from('profiles').select('id, username, email', { count: 'exact' });
  const { data: previewUsers } = await preview.from('profiles').select('id, username, email', { count: 'exact' });

  console.log(`  Production: ${prodUsers?.length || 0} users`);
  console.log(`  Preview: ${previewUsers?.length || 0} users`);

  // 4. Schema comparison (check for new columns/tables)
  console.log('\n🗂️  SCHEMA:');
  console.log('  Checking for schema differences...');

  // Check challenges table columns
  const { data: prodCols } = await prod.rpc('get_table_columns', { table_name: 'challenges' }).catch(() => ({ data: [] }));
  const { data: previewCols } = await preview.rpc('get_table_columns', { table_name: 'challenges' }).catch(() => ({ data: [] }));

  console.log(`  challenges table - Production: ${prodChallenges[0] ? Object.keys(prodChallenges[0]).length : 'N/A'} fields`);
  console.log(`  challenges table - Preview: ${previewChallenges[0] ? Object.keys(previewChallenges[0]).length : 'N/A'} fields`);

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 SUMMARY:\n');

  if (previewOnly.length === 0 && circlesPreviewOnly.length === 0) {
    console.log('✅ No important data found ONLY in preview');
    console.log('✅ Safe to redirect everything to production\n');
  } else {
    console.log('⚠️  Items found only in preview:');
    if (previewOnly.length > 0) console.log(`   - ${previewOnly.length} challenges`);
    if (circlesPreviewOnly.length > 0) console.log(`   - ${circlesPreviewOnly.length} circles`);
    console.log('\n   Consider migrating these before switching to production only\n');
  }
}

compareData().catch(console.error);
