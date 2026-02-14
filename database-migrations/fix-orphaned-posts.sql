-- Fix posts that have visibility='circle' but no post_circles relationships
-- This will add them to all of the user's circles

DO $$
DECLARE
  post_record RECORD;
  user_circles TEXT[];
  circle_id_val UUID;
  inserted_count INT := 0;
BEGIN
  FOR post_record IN 
    SELECT p.id, p.user_id, p.created_at
    FROM posts p
    WHERE p.visibility = 'circle' 
      AND p.circle_id IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM post_circles pc WHERE pc.post_id = p.id
      )
    ORDER BY p.created_at DESC
  LOOP
    -- Get all circles the user is a member of
    SELECT ARRAY_AGG(cm.circle_id) INTO user_circles
    FROM circle_members cm
    WHERE cm.user_id = post_record.user_id;

    -- If user has circles, add the post to all of them
    IF user_circles IS NOT NULL THEN
      FOREACH circle_id_val IN ARRAY user_circles
      LOOP
        INSERT INTO post_circles (post_id, circle_id)
        VALUES (post_record.id, circle_id_val)
        ON CONFLICT DO NOTHING;
        inserted_count := inserted_count + 1;
      END LOOP;
      
      RAISE NOTICE 'Fixed post % (created at %)', post_record.id, post_record.created_at;
    ELSE
      RAISE NOTICE 'Skipped post % - user % is not in any circles', post_record.id, post_record.user_id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Total post_circles relationships created: %', inserted_count;
END $$;

-- Verify the fix
SELECT 
  COUNT(DISTINCT p.id) as total_circle_posts,
  COUNT(DISTINCT pc.post_id) as posts_with_circles,
  COUNT(DISTINCT p.id) - COUNT(DISTINCT pc.post_id) as orphaned_posts
FROM posts p
LEFT JOIN post_circles pc ON p.id = pc.post_id
WHERE p.visibility = 'circle' AND p.circle_id IS NULL;
