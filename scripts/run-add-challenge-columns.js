const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ojusijzhshvviqjeyhyn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdXNpanpoc2h2dmlxamV5aHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NjU3MjQsImV4cCI6MjA3MTE0MTcyNH0.rlQ9lIGzoaLTOW-5-W0G1J1A0WwvqZMnhGHW-FwV8GQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runMigration() {
  console.log('🚀 Adding challenge columns to posts table...');
  
  // Note: Using Supabase's RPC to run raw SQL requires a database function
  // Since we can't run ALTER TABLE directly through the client,
  // we'll need to use the Supabase dashboard or CLI
  
  console.log('\n📋 SQL to run in Supabase SQL Editor:');
  console.log('=====================================');
  console.log(`
-- Add challenge-specific columns to posts table
-- These columns store challenge metadata for challenge-related posts

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS is_challenge BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS challenge_name TEXT,
ADD COLUMN IF NOT EXISTS challenge_id UUID REFERENCES challenges(id),
ADD COLUMN IF NOT EXISTS challenge_progress TEXT,
ADD COLUMN IF NOT EXISTS leaderboard_position INTEGER,
ADD COLUMN IF NOT EXISTS total_participants INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN posts.is_challenge IS 'Flag indicating if this post is from a challenge activity';
COMMENT ON COLUMN posts.challenge_name IS 'Name of the challenge (e.g., Jing Challenge)';
COMMENT ON COLUMN posts.challenge_id IS 'Reference to the challenge';
COMMENT ON COLUMN posts.challenge_progress IS 'Progress text (e.g., 3/3 daily complete)';
COMMENT ON COLUMN posts.leaderboard_position IS 'User position in challenge leaderboard at time of post';
COMMENT ON COLUMN posts.total_participants IS 'Total number of participants in the challenge';

-- Create index for faster challenge post queries
CREATE INDEX IF NOT EXISTS idx_posts_challenge ON posts(challenge_id) WHERE is_challenge = true;
  `);
  console.log('=====================================');
  
  console.log('\n⚠️  Please copy the SQL above and run it in:');
  console.log('   1. Supabase Dashboard > SQL Editor');
  console.log('   2. Or use Supabase CLI: npx supabase db push');
  
  // Let's check if the columns already exist
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .limit(1);
    
  if (error && error.message.includes('challengeId')) {
    console.log('\n❌ Columns not yet added - please run the SQL above');
  } else if (data) {
    console.log('\n✅ Checking if columns exist...');
    const samplePost = data[0];
    if (samplePost && 'is_challenge' in samplePost) {
      console.log('✅ Columns appear to already exist!');
    } else {
      console.log('⚠️  Columns may not exist yet - please run the SQL above');
    }
  }
}

runMigration().catch(console.error);