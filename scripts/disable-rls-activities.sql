-- Disable RLS entirely for challenge_activities table
-- Activities are public information, no need for row-level security
ALTER TABLE challenge_activities DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'challenge_activities';

-- Test that we can now read activities
SELECT 
  id,
  title,
  icon,
  order_index
FROM challenge_activities 
WHERE challenge_id = 'b26052e8-1893-44cf-8507-7fcd52d122d6'
ORDER BY order_index;

-- If the above still doesn't work, grant explicit permissions
GRANT SELECT ON challenge_activities TO anon;
GRANT SELECT ON challenge_activities TO authenticated;

-- Verify the activities exist
SELECT COUNT(*) as activity_count
FROM challenge_activities 
WHERE challenge_id = 'b26052e8-1893-44cf-8507-7fcd52d122d6';