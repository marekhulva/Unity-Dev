// Check all action completion attempts from today (2026-02-12)
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Known user IDs
const KNOWN_USERS = {
  'a203023e-c5a4-42cd-aed5-2781e14351cf': 'Marek',
  '53e3fb35-df02-4cc8-877d-f6eac6c8f490': 'Zaine',
  '60341cc9-99b3-4b25-b26f-3a4a518d169f': 'Angel'
};

async function checkTodaysCompletions() {
  console.log('🔍 Checking ALL action completion attempts from today (2026-02-12)...\n');

  const today = '2026-02-12';

  // Get all posts created today with action_title (these are action completion posts)
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id, user_id, action_title, goal_title, created_at')
    .not('action_title', 'is', null)
    .gte('created_at', `${today}T00:00:00`)
    .lt('created_at', `${today}T23:59:59`)
    .order('created_at', { ascending: true });

  if (postsError) {
    console.error('❌ Error fetching posts:', postsError);
    return;
  }

  console.log(`📬 Found ${posts?.length || 0} action completion posts from today\n`);

  if (!posts || posts.length === 0) {
    console.log('✅ No action completions attempted today');
    return;
  }

  // Group by user
  const byUser = {};
  for (const post of posts) {
    const userId = post.user_id;
    if (!byUser[userId]) {
      byUser[userId] = [];
    }
    byUser[userId].push(post);
  }

  console.log(`👥 Users who completed actions today:\n`);

  const uniqueUsers = new Set();

  for (const [userId, userPosts] of Object.entries(byUser)) {
    const userName = KNOWN_USERS[userId] || 'Unknown';
    console.log(`\n👤 ${userName} (${userId.substring(0, 8)}...):`);
    console.log(`   ${userPosts.length} completion(s):`);
    uniqueUsers.add(userId);

    for (const post of userPosts) {
      const time = new Date(post.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      console.log(`   - ${time}: "${post.action_title}" (${post.goal_title || 'No goal'})`);

      // Check if corresponding action is marked complete
      const { data: actions } = await supabase
        .from('actions')
        .select('id, completed, completed_at')
        .eq('user_id', post.user_id)
        .eq('title', post.action_title)
        .gte('date', today)
        .lte('date', today);

      if (actions && actions.length > 0) {
        const action = actions[0];
        const isComplete = action.completed && action.completed_at;
        const completedDate = action.completed_at ? new Date(action.completed_at).toISOString().split('T')[0] : null;

        if (isComplete && completedDate === today) {
          console.log(`      ✅ Action marked complete`);
        } else {
          console.log(`      ⚠️  Action NOT marked complete (orphaned)`);
        }
      } else {
        console.log(`      ⚠️  No matching action found`);
      }
    }
  }

  console.log(`\n\n📊 Summary:`);
  console.log(`   Total unique users: ${uniqueUsers.size}`);
  console.log(`   Total completions: ${posts.length}`);
  console.log(`\n   Users:`);
  uniqueUsers.forEach(id => {
    const name = KNOWN_USERS[id] || 'Unknown';
    console.log(`   - ${name} (${id})`);
  });
}

checkTodaysCompletions()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
