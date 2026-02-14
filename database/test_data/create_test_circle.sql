-- Create a test circle for development
-- Run this in Supabase SQL editor after the main migration

-- Create a test circle
INSERT INTO circles (name, description, invite_code, created_by)
VALUES (
  'Test Circle',
  'A test circle for development',
  'TEST123',
  (SELECT id FROM auth.users LIMIT 1)  -- Use first user as creator
)
ON CONFLICT (invite_code) DO NOTHING;

-- Get the circle ID
DO $$
DECLARE
  v_circle_id UUID;
  v_user_id UUID;
BEGIN
  -- Get the test circle ID
  SELECT id INTO v_circle_id FROM circles WHERE invite_code = 'TEST123';
  
  -- Get first user ID
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  IF v_circle_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    -- Add the user to the circle as admin
    INSERT INTO circle_members (circle_id, user_id, role)
    VALUES (v_circle_id, v_user_id, 'admin')
    ON CONFLICT (circle_id, user_id) DO NOTHING;
    
    -- Update user's profile with circle_id
    UPDATE profiles 
    SET circle_id = v_circle_id
    WHERE id = v_user_id;
    
    -- Update circle member count
    UPDATE circles
    SET member_count = (
      SELECT COUNT(*) FROM circle_members WHERE circle_id = v_circle_id
    )
    WHERE id = v_circle_id;
    
    RAISE NOTICE 'Test circle created with invite code: TEST123';
  END IF;
END $$;

-- Verify the circle was created
SELECT 
  c.name,
  c.invite_code,
  c.member_count,
  COUNT(cm.user_id) as actual_members
FROM circles c
LEFT JOIN circle_members cm ON c.id = cm.circle_id
WHERE c.invite_code = 'TEST123'
GROUP BY c.id, c.name, c.invite_code, c.member_count;