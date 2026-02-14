#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function findCircles() {
  const { data, error } = await supabase
    .from('circles')
    .select('id, name, join_code, created_at')
    .ilike('name', '%Jing%')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Circles matching "Jing":');
    data.forEach(c => {
      console.log(`- ${c.name} (ID: ${c.id}, Code: ${c.join_code})`);
    });
  }
}

findCircles();
