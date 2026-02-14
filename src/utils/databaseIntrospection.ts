import { supabase } from '../services/supabase.service';

/**
 * Database Introspection Utility
 * Fetches actual database schema and data for debugging
 */

export async function introspectDatabase() {
  if (__DEV__) console.log('🔍 ========== DATABASE INTROSPECTION ==========');

  try {
    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      if (__DEV__) console.error('❌ No authenticated user');
      return;
    }
    if (__DEV__) console.log('✅ Current User ID:', user.id);
    if (__DEV__) console.log('✅ Current User Email:', user.email);

    // 2. Check if actions table exists and get schema
    const { data: columns, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'actions' })
      .select('*');

    if (schemaError) {
      // Try alternative approach
      if (__DEV__) console.log('⚠️ Cannot fetch schema via RPC, trying direct query...');
    } else {
      if (__DEV__) console.log('📊 Actions table schema:', columns);
    }

    // 3. Fetch user's actions with ALL fields
    const { data: actions, error: actionsError } = await supabase
      .from('actions')
      .select('*')
      .eq('user_id', user.id);

    if (actionsError) {
      if (__DEV__) console.error('❌ Error fetching actions:', actionsError);
    } else {
      if (__DEV__) console.log('📋 Total actions for user:', actions?.length);

      // Analyze first action in detail
      if (actions && actions.length > 0) {
        if (__DEV__) console.log('🔍 First action - ALL FIELDS:');
        const firstAction = actions[0];
        for (const [key, value] of Object.entries(firstAction)) {
          if (__DEV__) console.log(`  ${key}:`, value);
        }

        // Count completion status
        const stats = {
          total: actions.length,
          completed_true: actions.filter(a => a.completed === true).length,
          has_completed_at: actions.filter(a => a.completed_at !== null && a.completed_at !== undefined).length,
          completed_but_no_timestamp: actions.filter(a => a.completed === true && !a.completed_at).length
        };

        if (__DEV__) console.log('📊 Completion Statistics:', stats);

        // Show sample of completed_at values
        const completedAtValues = actions
          .map(a => ({ title: a.title, completed_at: a.completed_at }))
          .filter(a => a.completed_at);

        if (__DEV__) console.log('🕐 Actions with completed_at timestamps:', completedAtValues);
      }
    }

    // 4. Check goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id);

    if (!goalsError) {
      if (__DEV__) console.log('🎯 Total goals:', goals?.length);
      goals?.forEach(g => {
        if (__DEV__) console.log(`  - ${g.title} (ID: ${g.id})`);
      });
    }

    // 5. Try to query non-existent daily_actions table
    if (__DEV__) console.log('🔍 Checking if daily_actions table exists...');
    const { error: dailyError } = await supabase
      .from('daily_actions')
      .select('count')
      .single();

    if (dailyError) {
      if (__DEV__) console.log('❌ daily_actions table does not exist:', dailyError.message);
    } else {
      if (__DEV__) console.log('✅ daily_actions table exists');
    }

    // 6. Get raw SQL query result (if RPC function exists)
    try {
      const { data: sqlResult, error: sqlError } = await supabase.rpc('execute_sql', {
        query: `
          SELECT COUNT(*) as total,
                 COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as with_timestamp
          FROM actions
          WHERE user_id = '${user.id}'
        `
      });

      if (!sqlError && sqlResult) {
        if (__DEV__) console.log('📊 SQL Query Result:', sqlResult);
      }
    } catch (e) {
      // RPC function might not exist
    }

    if (__DEV__) console.log('🔍 ========== END INTROSPECTION ==========');

  } catch (error) {
    if (__DEV__) console.error('❌ Introspection failed:', error);
  }
}

// Function to manually check a specific user's data
export async function checkUserData(userId: string) {
  if (__DEV__) console.log(`🔍 Checking data for user: ${userId}`);

  const { data: actions, error } = await supabase
    .from('actions')
    .select('id, title, completed, completed_at, created_at')
    .eq('user_id', userId);

  if (error) {
    if (__DEV__) console.error('❌ Error:', error);
    return;
  }

  console.table(actions);

  // Check for completion patterns
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayCompletions = actions?.filter(a => {
    if (!a.completed_at) return false;
    const completedDate = new Date(a.completed_at);
    return completedDate >= today;
  });

  if (__DEV__) console.log('✅ Completed today:', todayCompletions?.length || 0);
  if (__DEV__) console.log('📅 Actions with ANY completion date:', actions?.filter(a => a.completed_at).length || 0);
}