const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ojusijzhshvviqjeyhyn.supabase.co';
// Service role key needed for DDL operations
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function applyMigration() {
  if (!SUPABASE_SERVICE_KEY) {
    console.log('❌ SUPABASE_SERVICE_KEY not found in environment');
    console.log('\n📋 Please run the following SQL in Supabase Dashboard SQL Editor:');
    console.log('==================================================================\n');
    
    const sql = `-- Add challenge-specific columns to posts table
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
CREATE INDEX IF NOT EXISTS idx_posts_challenge ON posts(challenge_id) WHERE is_challenge = true;`;
    
    console.log(sql);
    console.log('\n==================================================================');
    console.log('Go to: https://supabase.com/dashboard/project/ojusijzhshvviqjeyhyn/sql/new');
    console.log('And paste the SQL above to run it.');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    console.log('🚀 Applying migration...');
    
    // Supabase doesn't support DDL through the client API
    // We need to use the management API or dashboard
    
    console.log('❌ Cannot apply DDL changes through client API');
    console.log('Please use Supabase Dashboard SQL Editor instead');
  } catch (error) {
    console.error('Error:', error);
  }
}

applyMigration();