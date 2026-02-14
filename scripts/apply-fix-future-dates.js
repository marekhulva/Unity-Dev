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

async function fixFutureDates() {
  console.log('🔧 Fixing future challenge start dates in database...\n');

  try {
    // Use Supabase RPC to run SQL with proper permissions
    const { data, error } = await supabase.rpc('fix_future_challenge_dates');

    if (error) {
      if (error.code === 'PGRST202' || error.message.includes('Could not find')) {
        console.log('⚠️  RPC function does not exist. Creating and running update...\n');

        // First, create the function
        const createFunctionSQL = `
          CREATE OR REPLACE FUNCTION fix_future_challenge_dates()
          RETURNS TABLE (
            fixed_count INTEGER
          ) AS $$
          DECLARE
            affected_rows INTEGER;
          BEGIN
            -- Update future start dates to today
            UPDATE challenge_participants
            SET
              personal_start_date = DATE_TRUNC('day', NOW()),
              current_day = 1,
              updated_at = NOW()
            WHERE status = 'active'
              AND personal_start_date > NOW();

            GET DIAGNOSTICS affected_rows = ROW_COUNT;

            RETURN QUERY SELECT affected_rows;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `;

        console.log('📝 Creating fix function in database...');
        const { error: createError } = await supabase.rpc('exec_sql', {
          query: createFunctionSQL
        });

        if (createError) {
          console.error('❌ Could not create function:', createError.message);
          console.log('\n📋 Manual fix required. Run this in Supabase SQL Editor:\n');
          console.log('UPDATE challenge_participants');
          console.log('SET personal_start_date = DATE_TRUNC(\'day\', NOW()),');
          console.log('    current_day = 1,');
          console.log('    updated_at = NOW()');
          console.log('WHERE status = \'active\'');
          console.log('  AND personal_start_date > NOW();\n');
          return;
        }

        // Now run the function
        const { data: fixData, error: fixError } = await supabase.rpc('fix_future_challenge_dates');

        if (fixError) {
          console.error('❌ Error running fix:', fixError);
          return;
        }

        console.log('✅ Fixed', fixData, 'challenge participations');
      } else {
        console.error('❌ Error:', error);
      }
    } else {
      console.log('✅ Fixed', data, 'challenge participations');
    }

    console.log('\n🔄 Users should refresh their app to see activities.');
  } catch (err) {
    console.error('❌ Exception:', err);
    console.log('\n📋 Manual fix required. Go to Supabase SQL Editor and run:\n');
    console.log('UPDATE challenge_participants');
    console.log('SET personal_start_date = DATE_TRUNC(\'day\', NOW()),');
    console.log('    current_day = 1,');
    console.log('    updated_at = NOW()');
    console.log('WHERE status = \'active\'');
    console.log('  AND personal_start_date > NOW();\n');
  }
}

fixFutureDates().catch(console.error);
