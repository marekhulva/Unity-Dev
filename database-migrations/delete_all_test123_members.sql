-- DELETE ALL MEMBERS FROM TEST123 CIRCLE

-- 1. First, see how many we're about to delete
SELECT COUNT(*) as total_members_to_delete
FROM circle_members cm
JOIN circles c ON c.id = cm.circle_id
WHERE c.code = 'TEST123';

-- 2. See the list of who will be deleted
SELECT 
    cm.user_id,
    p.email,
    p.name,
    cm.joined_at
FROM circle_members cm
JOIN profiles p ON p.id = cm.user_id
JOIN circles c ON c.id = cm.circle_id
WHERE c.code = 'TEST123'
ORDER BY cm.joined_at DESC;

-- 3. DELETE ALL MEMBERS FROM TEST123
DELETE FROM circle_members
WHERE circle_id = (SELECT id FROM circles WHERE code = 'TEST123');

-- 4. Also clean up their challenge participations in TEST123's challenges
DELETE FROM challenge_participants
WHERE challenge_id IN (
    SELECT id FROM challenges 
    WHERE circle_id = (SELECT id FROM circles WHERE code = 'TEST123')
);

-- 5. Verify it's empty now
SELECT COUNT(*) as remaining_members
FROM circle_members cm
JOIN circles c ON c.id = cm.circle_id
WHERE c.code = 'TEST123';

-- The circle TEST123 still exists but is now empty
-- You can join it again with your real account when needed