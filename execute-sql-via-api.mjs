import fs from 'fs';

const PROJECT_REF = 'ojusijzhshvviqjeyhyn';
const ACCESS_TOKEN = fs.readFileSync('/home/marek/.supabase/access-token', 'utf8').trim();

// Read the SQL files
const policySQL = fs.readFileSync('./supabase/migrations/20251119185650_add_global_challenge_insert_policy.sql', 'utf8');
const insertSQL = fs.readFileSync('./insert-challenges.sql', 'utf8');

async function executeSQLViaAPI(sql) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  return await response.json();
}

async function main() {
  try {
    console.log('📝 Step 1: Adding RLS policies for global challenges...');
    await executeSQLViaAPI(policySQL);
    console.log('✅ Policies added successfully!\n');

    console.log('📝 Step 2: Inserting 10 global challenges...');
    await executeSQLViaAPI(insertSQL);
    console.log('✅ Challenges inserted successfully!\n');

    console.log('🎉 All done! Refresh your Challenges page to see the new challenges.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
