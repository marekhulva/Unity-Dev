-- Check the actual columns in the actions table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'actions'
ORDER BY ordinal_position;

-- Also check goals table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'goals'
ORDER BY ordinal_position;