-- Create test users for development
-- Run this in Supabase Auth section or SQL editor

-- Note: You'll need to create these users through Supabase Auth UI
-- or use the auth.users table directly (requires service_role key)

-- After creating users, add them to the test circle:
DO $$
DECLARE
  v_circle_id UUID;
  v_user_email TEXT;
  v_user_id UUID;
BEGIN
  -- Get the test circle
  SELECT id INTO v_circle_id FROM circles WHERE invite_code = 'TEST123';
  
  IF v_circle_id IS NOT NULL THEN
    -- Add specific users to circle (replace emails with your test users)
    FOR v_user_email IN 
      SELECT unnest(ARRAY['test2@example.com', 'test3@example.com'])
    LOOP
      -- Get user ID by email
      SELECT id INTO v_user_id 
      FROM auth.users 
      WHERE email = v_user_email;
      
      IF v_user_id IS NOT NULL THEN
        -- Add to circle
        INSERT INTO circle_members (circle_id, user_id, role)
        VALUES (v_circle_id, v_user_id, 'member')
        ON CONFLICT DO NOTHING;
        
        -- Update profile
        UPDATE profiles 
        SET circle_id = v_circle_id
        WHERE id = v_user_id;
        
        RAISE NOTICE 'Added user % to test circle', v_user_email;
      END IF;
    END LOOP;
    
    -- Update member count
    UPDATE circles
    SET member_count = (
      SELECT COUNT(*) FROM circle_members WHERE circle_id = v_circle_id
    )
    WHERE id = v_circle_id;
  END IF;
END $$;

-- Create some test posts for the circle
INSERT INTO posts (user_id, type, visibility, content, circle_id)
SELECT 
  cm.user_id,
  'status',
  'circle',
  'Test post in circle from user ' || ROW_NUMBER() OVER(),
  cm.circle_id
FROM circle_members cm
WHERE cm.circle_id = (SELECT id FROM circles WHERE invite_code = 'TEST123')
LIMIT 3;