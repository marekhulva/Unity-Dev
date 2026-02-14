import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const PROJECT_REF = 'ojusijzhshvviqjeyhyn';
const ACCESS_TOKEN = fs.readFileSync('/home/marek/.supabase/access-token', 'utf8').trim();

async function getUserInfo() {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

  const queries = [
    // Get first user from profiles
    "SELECT id, email, name FROM profiles LIMIT 5;",
    // Get challenge IDs
    "SELECT id, name, emoji FROM challenges WHERE scope = 'global' AND status = 'active' LIMIT 5;",
  ];

  for (const query of queries) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    const result = await response.json();
    console.log('Query:', query);
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('---\n');
  }
}

getUserInfo().catch(console.error);
