#!/usr/bin/env node

/**
 * Clean up corrupted comments with base64/binary content
 * Run: node scripts/clean-corrupted-comments.mjs
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

// Function to detect corrupted content (same logic as frontend)
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

async function cleanCorruptedComments() {
  console.log('🔍 Searching for corrupted comments...\n');

  // Fetch all comments
  const { data: comments, error } = await supabase
    .from('post_comments')
    .select('id, post_id, user_id, content, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching comments:', error.message);
    return;
  }

  console.log(`📊 Total comments in database: ${comments.length}`);

  // Find corrupted comments
  const corruptedComments = comments.filter(c => isCorruptedContent(c.content));

  console.log(`\n🚨 Found ${corruptedComments.length} corrupted comments:\n`);

  if (corruptedComments.length === 0) {
    console.log('✅ No corrupted comments found! Database is clean.');
    return;
  }

  // Display corrupted comments
  corruptedComments.forEach((comment, index) => {
    console.log(`${index + 1}. Comment ID: ${comment.id}`);
    console.log(`   Post ID: ${comment.post_id}`);
    console.log(`   User ID: ${comment.user_id}`);
    console.log(`   Created: ${comment.created_at}`);
    console.log(`   Content length: ${comment.content?.length || 0} chars`);
    console.log(`   Preview: ${comment.content?.substring(0, 100)}...`);
    console.log('');
  });

  console.log('\n🔧 Options:');
  console.log('1. Delete these corrupted comments');
  console.log('2. Clear content but keep comment records');
  console.log('\nTo proceed, modify the script and uncomment the desired action.\n');

  // OPTION 1: Delete corrupted comments (UNCOMMENT TO USE)
  /*
  console.log('🗑️  Deleting corrupted comments...');
  const deleteIds = corruptedComments.map(c => c.id);
  const { error: deleteError } = await supabase
    .from('post_comments')
    .delete()
    .in('id', deleteIds);

  if (deleteError) {
    console.error('❌ Error deleting comments:', deleteError.message);
  } else {
    console.log(`✅ Deleted ${deleteIds.length} corrupted comments`);
  }
  */

  // OPTION 2: Clear content but keep comment records (UNCOMMENT TO USE)
  /*
  console.log('🧹 Clearing corrupted comment content...');
  for (const comment of corruptedComments) {
    const { error: updateError } = await supabase
      .from('post_comments')
      .update({ content: '[content removed]' })
      .eq('id', comment.id);

    if (updateError) {
      console.error(`❌ Error updating comment ${comment.id}:`, updateError.message);
    }
  }
  console.log(`✅ Cleared content from ${corruptedComments.length} comments`);
  */
}

// Run the script
cleanCorruptedComments()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
