// Recovery script to find and fix orphaned action completions
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findOrphanedCompletions() {
  console.log('🔍 Looking for orphaned action completions...\n');

  // Find all posts with action_title (these are action completion posts)
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id, user_id, action_title, goal_title, created_at')
    .not('action_title', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100);

  if (postsError) {
    console.error('❌ Error fetching posts:', postsError);
    return;
  }

  console.log(`📬 Found ${posts.length} action completion posts\n`);

  const orphaned = [];

  for (const post of posts) {
    const postDate = new Date(post.created_at).toISOString().split('T')[0];

    // Check if there's a matching action completion
    const { data: actions, error: actionsError } = await supabase
      .from('actions')
      .select('id, title, completed, completed_at')
      .eq('user_id', post.user_id)
      .eq('title', post.action_title)
      .gte('date', postDate)
      .lte('date', postDate);

    if (actionsError) {
      console.error(`❌ Error checking action for "${post.action_title}":`, actionsError);
      continue;
    }

    if (actions && actions.length > 0) {
      const action = actions[0];
      const actionCompletedDate = action.completed_at ? new Date(action.completed_at).toISOString().split('T')[0] : null;

      // Check if action is NOT completed on the same date as the post
      if (!action.completed || actionCompletedDate !== postDate) {
        orphaned.push({
          post,
          action,
          postDate,
          actionCompletedDate
        });
      }
    }
  }

  console.log(`\n🔴 Found ${orphaned.length} orphaned completions:\n`);

  orphaned.forEach((item, idx) => {
    console.log(`${idx + 1}. "${item.post.action_title}" (${item.post.goal_title || 'No goal'})`);
    console.log(`   Post created: ${item.postDate}`);
    console.log(`   Action completed: ${item.actionCompletedDate || 'NOT COMPLETED'}`);
    console.log(`   User: ${item.post.user_id}`);
    console.log(`   Action ID: ${item.action.id}`);
    console.log('');
  });

  return orphaned;
}

async function fixOrphanedCompletions(orphaned) {
  if (orphaned.length === 0) {
    console.log('✨ No orphaned completions to fix!');
    return;
  }

  console.log(`\n🔧 Fixing ${orphaned.length} orphaned completions...\n`);

  for (const item of orphaned) {
    const postDate = item.postDate;
    const completedAt = item.post.created_at;

    // Update the action to mark it as completed
    const { error: updateError } = await supabase
      .from('actions')
      .update({
        completed: true,
        completed_at: completedAt
      })
      .eq('id', item.action.id);

    if (updateError) {
      console.error(`❌ Failed to update action "${item.post.action_title}":`, updateError);
      continue;
    }

    // Insert into action_completions table
    const { error: completionError } = await supabase
      .from('action_completions')
      .insert({
        action_id: item.action.id,
        user_id: item.post.user_id,
        completed_at: completedAt
      });

    if (completionError && completionError.code !== '23505') { // Ignore duplicate errors
      console.error(`⚠️  Warning: Could not insert completion for "${item.post.action_title}":`, completionError);
    }

    console.log(`✅ Fixed: "${item.post.action_title}" (${postDate})`);
  }

  console.log('\n✨ Recovery complete!');
}

// Run the recovery
findOrphanedCompletions()
  .then(orphaned => fixOrphanedCompletions(orphaned))
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
