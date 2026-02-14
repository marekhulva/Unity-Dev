#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const PREVIEW_URL = 'https://iqlibqtswseitxtqpmlm.supabase.co';
const PREVIEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxbGlicXRzd3NlaXR4dHFwbWxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTczNzE2MiwiZXhwIjoyMDg1MzEzMTYyfQ.R61BBNfOMrBG52DCEbOhPSOOBA5aSG3_24Jm4KIYH2c';

const preview = createClient(PREVIEW_URL, PREVIEW_KEY);

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../database-backups');
  const backupFile = path.join(backupDir, `preview-backup-${timestamp}.json`);

  // Create backup directory
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log('🗄️  Backing up Preview Database to JSON\n');
  console.log('=' .repeat(60));

  const backup = {
    exported_at: new Date().toISOString(),
    database: 'preview (iqlibqtswseitxtqpmlm)',
    tables: {}
  };

  // Export key tables
  const tables = ['challenges', 'circles', 'circle_members', 'profiles', 'posts', 'challenge_participants', 'feature_flags', 'goals', 'daily_reviews', 'notifications', 'post_comments'];

  for (const table of tables) {
    console.log(`\n📦 Exporting ${table}...`);
    const { data, error } = await preview.from(table).select('*');

    if (error) {
      console.log(`   ⚠️  Error: ${error.message}`);
      backup.tables[table] = { error: error.message };
    } else {
      console.log(`   ✅ Exported ${data?.length || 0} rows`);
      backup.tables[table] = data || [];
    }
  }

  // Write to file
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Backup complete!\n');
  console.log(`📁 Location: ${backupFile}`);

  // File size
  const stats = fs.statSync(backupFile);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`📊 Size: ${sizeMB} MB`);

  console.log('\n🎯 You can now safely delete the preview branch!');
  console.log('\nTo restore (if needed):');
  console.log(`   node scripts/restore-from-backup.js ${backupFile}\n`);
}

backup().catch(console.error);
