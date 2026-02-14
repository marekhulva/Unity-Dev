-- Fix posts table foreign key constraint to reference new challenges table
-- instead of the old _archived_challenges_v1 table

-- Drop the old foreign key constraint
ALTER TABLE posts
DROP CONSTRAINT IF EXISTS posts_challenge_id_fkey;

-- Add new foreign key constraint referencing the new challenges table
ALTER TABLE posts
ADD CONSTRAINT posts_challenge_id_fkey
FOREIGN KEY (challenge_id)
REFERENCES challenges(id)
ON DELETE SET NULL;

-- Verify the constraint
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'posts'
  AND tc.constraint_name = 'posts_challenge_id_fkey';
