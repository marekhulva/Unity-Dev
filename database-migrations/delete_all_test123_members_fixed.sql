-- DELETE ALL MEMBERS FROM TEST123 CIRCLE (FIXED VERSION)

-- First, check what columns the circles table has
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'circles'
ORDER BY ordinal_position;

-- 1. Find the TEST123 circle (try both possible column names)
SELECT id, name 
FROM circles 
WHERE name = 'TEST123' 
   OR invite_code = 'TEST123'
LIMIT 1;

-- 2. Count members to delete (using circle name)
SELECT COUNT(*) as total_members_to_delete
FROM circle_members cm
JOIN circles c ON c.id = cm.circle_id
WHERE c.name = 'TEST123' OR c.invite_code = 'TEST123';

-- 3. See who will be deleted
SELECT 
    cm.user_id,
    p.email,
    p.name as user_name,
    c.name as circle_name,
    cm.joined_at
FROM circle_members cm
JOIN profiles p ON p.id = cm.user_id
JOIN circles c ON c.id = cm.circle_id
WHERE c.name = 'TEST123' OR c.invite_code = 'TEST123'
ORDER BY cm.joined_at DESC;

-- 4. DELETE ALL MEMBERS FROM TEST123
DELETE FROM circle_members
WHERE circle_id IN (
    SELECT id FROM circles 
    WHERE name = 'TEST123' OR invite_code = 'TEST123'
);

-- 5. Clean up their challenge participations
DELETE FROM challenge_participants
WHERE challenge_id IN (
    SELECT id FROM challenges 
    WHERE circle_id IN (
        SELECT id FROM circles 
        WHERE name = 'TEST123' OR invite_code = 'TEST123'
    )
);

-- 6. Verify it's empty
SELECT COUNT(*) as remaining_members
FROM circle_members cm
JOIN circles c ON c.id = cm.circle_id
WHERE c.name = 'TEST123' OR c.invite_code = 'TEST123';