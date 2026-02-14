-- Test what's in the actions table
SELECT * FROM actions 
ORDER BY created_at DESC 
LIMIT 10;

-- Check today's actions specifically
SELECT * FROM actions 
WHERE date = CURRENT_DATE
ORDER BY created_at DESC;