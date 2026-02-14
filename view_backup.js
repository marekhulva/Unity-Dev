const fs = require('fs');

// Read the backup file
const backup = fs.readFileSync('db_cluster-29-08-2025@08-28-17.backup', 'utf8');

console.log('=================================');
console.log('YOUR DATABASE TABLES AND DATA:');
console.log('=================================\n');

// Extract and display each table's data
const tables = ['circles', 'profiles', 'challenges', 'posts', 'actions'];

tables.forEach(table => {
    // Find the COPY statement for this table
    const copyRegex = new RegExp(`COPY public.${table} \\(([^)]+)\\) FROM stdin;([\\s\\S]*?)\\\\\\\.`, 'g');
    const match = copyRegex.exec(backup);
    
    if (match) {
        const columns = match[1].split(', ');
        const dataLines = match[2].trim().split('\n').filter(line => line.length > 0);
        
        console.log(`\n📊 TABLE: ${table.toUpperCase()}`);
        console.log('─'.repeat(80));
        
        if (dataLines.length > 0) {
            // Show first few rows
            console.log('Columns:', columns.join(' | '));
            console.log('─'.repeat(80));
            
            dataLines.slice(0, 3).forEach(line => {
                const values = line.split('\t');
                if (table === 'circles') {
                    console.log(`Name: ${values[1]}`);
                    console.log(`Invite Code: ${values[3]}`);
                    console.log(`Members: ${values[6]}`);
                    console.log('---');
                } else if (table === 'profiles') {
                    console.log(`Email: ${values[1] || 'N/A'}`);
                    console.log(`Name: ${values[2] || 'N/A'}`);
                    console.log('---');
                } else {
                    console.log(values.slice(0, 3).join(' | '));
                }
            });
            
            if (dataLines.length > 3) {
                console.log(`... and ${dataLines.length - 3} more rows`);
            }
        } else {
            console.log('(No data in this table)');
        }
    }
});

// Count total records
console.log('\n📈 SUMMARY:');
console.log('─'.repeat(80));

const counts = {};
tables.forEach(table => {
    const copyRegex = new RegExp(`COPY public.${table} \\([^)]+\\) FROM stdin;([\\s\\S]*?)\\\\\\\.`, 'g');
    const match = copyRegex.exec(backup);
    if (match) {
        const dataLines = match[2].trim().split('\n').filter(line => line.length > 0);
        counts[table] = dataLines.length;
    }
});

Object.entries(counts).forEach(([table, count]) => {
    console.log(`${table}: ${count} records`);
});