const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

console.log('📦 Converting PostgreSQL backup to SQLite for easy browsing...\n');

// Create SQLite database
const db = new sqlite3.Database('backup_browser.db');

// Read the backup file
const backup = fs.readFileSync('db_cluster-29-08-2025@08-28-17.backup', 'utf8');

// Extract tables and data
const tables = {
    profiles: [],
    circles: [],
    circle_members: [],
    challenges: [],
    posts: [],
    actions: [],
    goals: []
};

// Parse COPY statements
Object.keys(tables).forEach(tableName => {
    const copyRegex = new RegExp(`COPY public.${tableName} \\(([^)]+)\\) FROM stdin;([\\s\\S]*?)\\\\\\\.`, 'g');
    const match = copyRegex.exec(backup);
    
    if (match) {
        const columns = match[1].split(', ').map(c => c.replace(/"/g, ''));
        const dataLines = match[2].trim().split('\n').filter(line => line.length > 0);
        
        console.log(`Found ${dataLines.length} rows in ${tableName}`);
        
        // Store for SQLite
        tables[tableName] = {
            columns: columns,
            data: dataLines.map(line => line.split('\t'))
        };
    }
});

// Create SQLite tables
db.serialize(() => {
    // Create circles table
    if (tables.circles.data.length > 0) {
        db.run(`CREATE TABLE circles (
            id TEXT PRIMARY KEY,
            name TEXT,
            description TEXT,
            invite_code TEXT,
            created_by TEXT,
            created_at TEXT,
            member_count INTEGER,
            is_active BOOLEAN
        )`);
        
        const stmt = db.prepare("INSERT INTO circles VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        tables.circles.data.forEach(row => {
            stmt.run(row);
        });
        stmt.finalize();
    }
    
    // Create profiles table
    if (tables.profiles.data.length > 0) {
        db.run(`CREATE TABLE profiles (
            id TEXT PRIMARY KEY,
            email TEXT,
            name TEXT,
            username TEXT,
            avatar_url TEXT,
            bio TEXT,
            created_at TEXT,
            updated_at TEXT,
            circle_id TEXT,
            following_count INTEGER,
            follower_count INTEGER,
            is_private BOOLEAN
        )`);
        
        const stmt = db.prepare("INSERT INTO profiles VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        tables.profiles.data.forEach(row => {
            stmt.run(row);
        });
        stmt.finalize();
    }
    
    // Create posts table
    if (tables.posts.data.length > 0) {
        db.run(`CREATE TABLE posts (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            type TEXT,
            content TEXT,
            media_url TEXT,
            created_at TEXT
        )`);
        
        const stmt = db.prepare("INSERT INTO posts VALUES (?, ?, ?, ?, ?, ?)");
        tables.posts.data.forEach(row => {
            stmt.run(row[0], row[1], row[2], row[3], row[4], row[9]); // Select key columns
        });
        stmt.finalize();
    }
    
    console.log('\n✅ SQLite database created: backup_browser.db');
    console.log('\nYou can now browse it with:');
    console.log('1. SQLite Browser (GUI): https://sqlitebrowser.org/');
    console.log('2. Or use: sqlite3 backup_browser.db');
});

db.close();