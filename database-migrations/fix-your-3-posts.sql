-- Fix the 3 orphaned posts for user 4787d939-d053-4960-bd08-4c65f8ac2c2c
-- Run this in the Supabase SQL Editor

DO $$
DECLARE
  user_circles UUID[];
  circle_id_val UUID;
BEGIN
  -- Get all circles for the user
  SELECT ARRAY_AGG(cm.circle_id) INTO user_circles
  FROM circle_members cm
  WHERE cm.user_id = '4787d939-d053-4960-bd08-4c65f8ac2c2c';

  -- Add the 3 orphaned posts to all user circles
  FOREACH circle_id_val IN ARRAY user_circles
  LOOP
    INSERT INTO post_circles (post_id, circle_id)
    VALUES 
      ('5f17430c-14f2-4409-8926-2fca00a79a7a', circle_id_val),
      ('72e4f0b9-72b3-4480-a77c-f31354470bc0', circle_id_val),
      ('e73ecc99-8b33-4188-83c6-20a268262190', circle_id_val)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Fixed 3 orphaned posts';
END $$;

-- Verify the fix
SELECT 
  p.id,
  p.created_at,
  COUNT(pc.id) as circle_count
FROM posts p
LEFT JOIN post_circles pc ON p.id = pc.post_id
WHERE p.id IN (
  '5f17430c-14f2-4409-8926-2fca00a79a7a',
  '72e4f0b9-72b3-4480-a77c-f31354470bc0',
  'e73ecc99-8b33-4188-83c6-20a268262190'
)
GROUP BY p.id, p.created_at
ORDER BY p.created_at DESC;
