import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ojusijzhshvviqjeyhyn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdXNpanpoc2h2dmlxamV5aHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NjU3MjQsImV4cCI6MjA3MTE0MTcyNH0.rlQ9lIGzoaLTOW-5-W0G1J1A0WwvqZMnhGHW-FwV8GQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('🔧 Fixing orphaned posts...\n');

  // Find all circle posts without post_circles relationships
  const { data: orphanedPosts, error: fetchError } = await supabase
    .from('posts')
    .select('id, user_id, created_at')
    .eq('visibility', 'circle')
    .is('circle_id', null);

  if (fetchError) {
    console.error('❌ Error fetching posts:', fetchError);
    return;
  }

  console.log(`📊 Found ${orphanedPosts.length} circle posts with null circle_id`);

  if (!orphanedPosts || orphanedPosts.length === 0) {
    console.log('✅ No orphaned posts found!');
    return;
  }

  let fixedCount = 0;
  let skippedCount = 0;

  for (const post of orphanedPosts) {
    // Check if this post already has circle relationships
    const { data: existingRelationships } = await supabase
      .from('post_circles')
      .select('id')
      .eq('post_id', post.id);

    if (existingRelationships && existingRelationships.length > 0) {
      console.log(`⏭️  Post ${post.id} already has ${existingRelationships.length} circle relationships`);
      skippedCount++;
      continue;
    }

    // Get all circles the user is a member of
    const { data: userCircles } = await supabase
      .from('circle_members')
      .select('circle_id')
      .eq('user_id', post.user_id);

    if (!userCircles || userCircles.length === 0) {
      console.log(`⚠️  Post ${post.id} - user ${post.user_id} is not in any circles`);
      skippedCount++;
      continue;
    }

    // Create post_circles relationships
    const relationships = userCircles.map(uc => ({
      post_id: post.id,
      circle_id: uc.circle_id
    }));

    const { error: insertError } = await supabase
      .from('post_circles')
      .insert(relationships);

    if (insertError) {
      console.error(`❌ Error fixing post ${post.id}:`, insertError.message);
    } else {
      console.log(`✅ Fixed post ${post.id} (created ${post.created_at}) - added to ${userCircles.length} circles`);
      fixedCount++;
    }
  }

  console.log(`\n📈 Summary:`);
  console.log(`   Fixed: ${fixedCount} posts`);
  console.log(`   Skipped: ${skippedCount} posts`);
  console.log(`   Total: ${orphanedPosts.length} posts`);

  // Verify the fix
  const { data: verification } = await supabase
    .from('posts')
    .select(`
      id,
      visibility,
      circle_id,
      post_circles(id)
    `)
    .eq('visibility', 'circle')
    .is('circle_id', null);

  if (verification) {
    const orphanedCount = verification.filter(p => !p.post_circles || p.post_circles.length === 0).length;
    console.log(`\n🔍 Verification:`);
    console.log(`   Total circle posts with null circle_id: ${verification.length}`);
    console.log(`   Posts without circles: ${orphanedCount}`);

    if (orphanedCount === 0) {
      console.log(`   ✅ All circle posts now have relationships!`);
    }
  }
}

main().catch(console.error);
