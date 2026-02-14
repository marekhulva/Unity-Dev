const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Your Supabase credentials
const supabaseUrl = 'https://ojusijzhshvviqjeyhyn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdXNpanpoc2h2dmlxamV5aHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwMjg1MjQsImV4cCI6MjAzOTYwNDUyNH0.vWFFmDcA-4evv4BN3YvOnAE1ufOcXOlcXPAJJ-LZxkY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportAllTables() {
  console.log('📦 Starting CSV Export of all tables...');
  
  // Create export directory
  const exportDir = path.join(__dirname, 'backups', `csv_export_${Date.now()}`);
  fs.mkdirSync(exportDir, { recursive: true });
  
  // List of tables to export
  const tables = [
    'profiles',
    'circles', 
    'circle_members',
    'challenges',
    'challenge_participants',
    'challenge_activities',
    'actions',
    'goals',
    'posts',
    'completed_actions'
  ];
  
  for (const table of tables) {
    console.log(`📊 Exporting ${table}...`);
    
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Convert to CSV
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => 
          Object.values(row).map(val => 
            typeof val === 'object' ? JSON.stringify(val) : String(val || '')
          ).join(',')
        );
        
        const csv = [headers, ...rows].join('\n');
        const filePath = path.join(exportDir, `${table}.csv`);
        
        fs.writeFileSync(filePath, csv);
        console.log(`✅ Exported ${data.length} rows from ${table}`);
      } else {
        console.log(`⚠️ No data in ${table}`);
      }
    } catch (error) {
      console.error(`❌ Error exporting ${table}:`, error.message);
    }
  }
  
  console.log(`\n✅ Export complete! Files saved to: ${exportDir}`);
}

exportAllTables().catch(console.error);