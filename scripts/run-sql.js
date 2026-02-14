#!/usr/bin/env node

/**
 * Helper script to display SQL that needs to be run in Supabase Dashboard
 * Usage: node scripts/run-sql.js <sql-file>
 * Example: node scripts/run-sql.js scripts/add-challenge-columns-to-posts.sql
 */

const fs = require('fs');
const path = require('path');

const sqlFile = process.argv[2];

if (!sqlFile) {
  console.log('❌ Please provide a SQL file path');
  console.log('Usage: node scripts/run-sql.js <sql-file>');
  process.exit(1);
}

const filePath = path.resolve(sqlFile);

if (!fs.existsSync(filePath)) {
  console.log(`❌ File not found: ${filePath}`);
  process.exit(1);
}

const sql = fs.readFileSync(filePath, 'utf8');

console.log('\n📋 SQL to run in Supabase Dashboard:');
console.log('=====================================\n');
console.log(sql);
console.log('\n=====================================');
console.log('\n🔗 Go to: https://supabase.com/dashboard/project/ojusijzhshvviqjeyhyn/sql/new');
console.log('   Paste the SQL above and click "Run"\n');

// Also save to clipboard if xclip is available (Linux)
const { exec } = require('child_process');
exec('which xclip', (error) => {
  if (!error) {
    exec(`echo "${sql.replace(/"/g, '\\"')}" | xclip -selection clipboard`, (err) => {
      if (!err) {
        console.log('✅ SQL copied to clipboard!');
      }
    });
  }
});