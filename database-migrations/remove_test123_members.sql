-- Remove all members from TEST123 circle in Unity project

-- 1. First check who will be removed
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

-- 2. Delete all members from TEST123
DELETE FROM circle_members
WHERE circle_id IN (
    SELECT id FROM circles 
    WHERE name = 'TEST123' OR invite_code = 'TEST123'
);

-- 3. Also clean up their challenge participations
DELETE FROM challenge_participants
WHERE challenge_id IN (
    SELECT id FROM challenges 
    WHERE circle_id IN (
        SELECT id FROM circles 
        WHERE name = 'TEST123' OR invite_code = 'TEST123'
    )
);

-- 4. Verify it's empty
SELECT COUNT(*) as remaining_members
FROM circle_members cm
JOIN circles c ON c.id = cm.circle_id
WHERE c.name = 'TEST123' OR c.invite_code = 'TEST123';