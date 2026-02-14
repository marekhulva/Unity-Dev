-- Check what challenge-related tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%challenge%'
ORDER BY table_name;

-- Check the columns of the challenges table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'challenges'
ORDER BY ordinal_position;

-- Check if challenge_activities exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'challenge_activities'
) AS challenge_activities_exists;

-- Check if challenge_activity_types exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'challenge_activity_types'
) AS challenge_activity_types_exists;