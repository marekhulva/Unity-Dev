const { Client } = require('pg');

const connectionString = 'postgresql://postgres.ojusijzhshvviqjeyhyn:Youcanthaveit@aws-1-us-west-1.pooler.supabase.com:5432/postgres';

const client = new Client({
  connectionString: connectionString,
});

async function testConnection() {
  try {
    console.log('Attempting to connect to Supabase...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    const result = await client.query('SELECT NOW()');
    console.log('Current time from database:', result.rows[0].now);
    
    await client.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
  }
}

testConnection();