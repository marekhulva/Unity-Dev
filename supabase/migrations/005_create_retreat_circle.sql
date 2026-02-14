-- Add join_code column to circles table if it doesn't exist
ALTER TABLE circles ADD COLUMN IF NOT EXISTS join_code VARCHAR(20) UNIQUE;

-- Drop existing function if it exists (to handle return type change)
DROP FUNCTION IF EXISTS join_circle_with_code(text);

-- Create function to join circle with code
CREATE OR REPLACE FUNCTION join_circle_with_code(code TEXT)
RETURNS TABLE(success BOOLEAN, error TEXT, circle_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_circle_id UUID;
  v_user_id UUID;
  v_already_member BOOLEAN;
BEGIN
  -- Get the authenticated user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated', NULL::UUID;
    RETURN;
  END IF;

  -- Find circle by join code
  SELECT id INTO v_circle_id
  FROM circles
  WHERE UPPER(join_code) = UPPER(code);

  IF v_circle_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Invalid circle code', NULL::UUID;
    RETURN;
  END IF;

  -- Check if user is already a member
  SELECT EXISTS(
    SELECT 1 FROM circle_members 
    WHERE circle_id = v_circle_id AND user_id = v_user_id
  ) INTO v_already_member;

  IF v_already_member THEN
    RETURN QUERY SELECT FALSE, 'Already a member of this circle', v_circle_id;
    RETURN;
  END IF;

  -- Add user to circle
  INSERT INTO circle_members (circle_id, user_id)
  VALUES (v_circle_id, v_user_id);

  -- Update user's profile with the circle
  UPDATE profiles
  SET current_circle_id = v_circle_id
  WHERE id = v_user_id;

  RETURN QUERY SELECT TRUE, NULL::TEXT, v_circle_id;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, SQLERRM, NULL::UUID;
END;
$$;

-- Create the Retreat circle with code JING
DO $$
DECLARE
  v_circle_id UUID;
  v_admin_user_id UUID;
BEGIN
  -- Check if Retreat circle already exists
  SELECT id INTO v_circle_id FROM circles WHERE name = 'Retreat';
  
  IF v_circle_id IS NULL THEN
    -- Get the first admin user or create with a system user ID
    -- You may want to replace this with a specific user ID
    SELECT id INTO v_admin_user_id FROM profiles LIMIT 1;
    
    IF v_admin_user_id IS NOT NULL THEN
      -- Create the Retreat circle
      INSERT INTO circles (name, created_by, join_code)
      VALUES ('Retreat', v_admin_user_id, 'JING')
      RETURNING id INTO v_circle_id;
      
      -- Add the creator as the first member
      INSERT INTO circle_members (circle_id, user_id)
      VALUES (v_circle_id, v_admin_user_id);
      
      RAISE NOTICE 'Created Retreat circle with code JING';
    ELSE
      RAISE NOTICE 'No users found, skipping Retreat circle creation';
    END IF;
  ELSE
    -- Update existing Retreat circle with join code
    UPDATE circles 
    SET join_code = 'JING' 
    WHERE id = v_circle_id AND join_code IS NULL;
    
    RAISE NOTICE 'Retreat circle already exists, updated with code JING if needed';
  END IF;
END $$;