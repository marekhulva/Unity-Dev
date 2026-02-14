#!/usr/bin/env node

/**
 * Clean up corrupted posts with base64/binary content
 * Run: node scripts/clean-corrupted-posts.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.development') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.development');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to detect corrupted content
function isCorruptedContent(content) {
  if (!content || typeof content !== 'string') return false;

  // Check if content looks like base64 or binary data
  const base64Pattern = /^[A-Za-z0-9+/=]{100,}$/;
  const binaryPattern = /[\x00-\x08\x0B-\x0C\x0E-\x1F]/;

  // If content is suspiciously long and alphanumeric only
  if (content.length > 500 && base64Pattern.test(content.replace(/\s/g, ''))) {
    return true;
  }

  // If content contains binary characters
  if (binaryPattern.test(content)) {
    return true;
  }

  return false;
}

async function cleanCorruptedPosts() {
  console.log('🔍 Searching for corrupted posts...\n');

  // Fetch all posts with all text fields
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, user_id, type, content, action_title, goal_title, challenge_name, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching posts:', error.message);
    return;
  }

  console.log(`📊 Total posts in database: ${posts.length}`);

  // Find corrupted posts (check ALL text fields)
  const corruptedPosts = posts.filter(post =>
    isCorruptedContent(post.content) ||
    isCorruptedContent(post.action_title) ||
    isCorruptedContent(post.goal_title) ||
    isCorruptedContent(post.challenge_name)
  );

  console.log(`\n🚨 Found ${corruptedPosts.length} corrupted posts:\n`);

  if (corruptedPosts.length === 0) {
    console.log('✅ No corrupted posts found! Database is clean.');
    return;
  }

  // Display corrupted posts with all corrupted fields
  corruptedPosts.forEach((post, index) => {
    console.log(`${index + 1}. Post ID: ${post.id}`);
    console.log(`   Type: ${post.type}`);
    console.log(`   Created: ${post.created_at}`);

    if (isCorruptedContent(post.content)) {
      console.log(`   ❌ content: ${post.content?.length || 0} chars (corrupted)`);
    }
    if (isCorruptedContent(post.action_title)) {
      console.log(`   ❌ action_title: ${post.action_title?.length || 0} chars (corrupted)`);
    }
    if (isCorruptedContent(post.goal_title)) {
      console.log(`   ❌ goal_title: ${post.goal_title?.length || 0} chars (corrupted)`);
    }
    if (isCorruptedContent(post.challenge_name)) {
      console.log(`   ❌ challenge_name: ${post.challenge_name?.length || 0} chars (corrupted)`);
    }
    console.log('');
  });

  // Ask for confirmation (in production, you'd use readline)
  console.log('\n🔧 Options:');
  console.log('1. Delete these corrupted posts');
  console.log('2. Clear content but keep posts');
  console.log('\nTo proceed, modify the script and uncomment the desired action.\n');

  // OPTION 1: Delete corrupted posts (UNCOMMENT TO USE)
  /*
  console.log('🗑️  Deleting corrupted posts...');
  const deleteIds = corruptedPosts.map(p => p.id);
  const { error: deleteError } = await supabase
    .from('posts')
    .delete()
    .in('id', deleteIds);

  if (deleteError) {
    console.error('❌ Error deleting posts:', deleteError.message);
  } else {
    console.log(`✅ Deleted ${deleteIds.length} corrupted posts`);
  }
  */

  // OPTION 2: Clear corrupted fields but keep posts (UNCOMMENT TO USE)
  /*
  console.log('🧹 Clearing corrupted fields...');
  for (const post of corruptedPosts) {
    const updates = {};
    if (isCorruptedContent(post.content)) updates.content = '';
    if (isCorruptedContent(post.action_title)) updates.action_title = '';
    if (isCorruptedContent(post.goal_title)) updates.goal_title = '';
    if (isCorruptedContent(post.challenge_name)) updates.challenge_name = '';

    const { error: updateError } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', post.id);

    if (updateError) {
      console.error(`❌ Error updating post ${post.id}:`, updateError.message);
    } else {
      console.log(`✅ Cleared ${Object.keys(updates).join(', ')} from post ${post.id}`);
    }
  }
  console.log(`✅ Cleared corrupted fields from ${corruptedPosts.length} posts`);
  */
}

// Run the script
cleanCorruptedPosts()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
