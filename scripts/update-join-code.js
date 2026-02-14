#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

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

async function updateJoinCode() {
  const circleId = 'bb426edb-a3de-41c3-bdff-3cdcda403088';
  const newJoinCode = 'JINGJING';

  console.log('🔄 Updating join code for Jing Optimizers...\n');

  const { data, error } = await supabase
    .from('circles')
    .update({ join_code: newJoinCode })
    .eq('id', circleId)
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log('✅ Join code updated successfully!');
  console.log('\nCircle:', data[0].name);
  console.log('New Join Code:', newJoinCode);
}

updateJoinCode().catch(console.error);
