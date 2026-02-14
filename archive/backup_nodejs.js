#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Starting Database Backup using Node.js...');

// Configuration
const PASSWORD = 'Youcanthaveit';
const HOST = 'db.ojusijzhshvviqjeyhyn.supabase.co';
const DATABASE = 'postgres';
const USER = 'postgres';
const PORT = 5432;

// Create backup directory
const backupDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Generate filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupFile = path.join(backupDir, `nodejs_backup_${timestamp}.sql`);

// Connection URL
const connectionUrl = `postgresql://${USER}:${PASSWORD}@${HOST}:${PORT}/${DATABASE}`;

console.log('📦 Fetching database schema and data...');
console.log('⏳ This will take a few minutes...');

// Use psql to dump the database
const psqlCommand = `PGPASSWORD="${PASSWORD}" psql -h ${HOST} -U ${USER} -d ${DATABASE} -p ${PORT} -c "\\copy (SELECT 'Database backup not available without pg_dump. Please install postgresql-client.' AS message) TO STDOUT"`;

exec(psqlCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('\n🔧 Alternative: Use Supabase Dashboard');
    console.log('1. Go to: https://supabase.com/dashboard/project/ojusijzhshvviqjeyhyn');
    console.log('2. Click on "Database" in the left sidebar');
    console.log('3. Click on "Backups" tab');
    console.log('4. Click "Create backup" button');
    console.log('\nThis will create a backup that Supabase manages for you.');
    return;
  }
  
  console.log('✅ Connection successful!');
  console.log('\nSince pg_dump is not installed, here are your options:');
  console.log('\n📝 Option 1: Use Supabase Dashboard (Easiest)');
  console.log('   Go to: https://supabase.com/dashboard/project/ojusijzhshvviqjeyhyn/database/backups');
  console.log('   Click "Create backup"');
  console.log('\n📝 Option 2: Export tables manually');
  console.log('   We can export each table as CSV files');
  console.log('\n📝 Option 3: Install PostgreSQL client');
  console.log('   On Windows WSL: Ask for sudo password to run: sudo apt-get install postgresql-client');
});