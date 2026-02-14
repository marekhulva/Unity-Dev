-- Create Bball circle
-- This migration creates a new circle called "Bball" for basketball enthusiasts

-- First, let's check if the circle already exists to avoid duplicates
DO $$
DECLARE
    v_circle_id UUID;
    v_invite_code TEXT;
BEGIN
    -- Check if Bball circle already exists
    SELECT id INTO v_circle_id
    FROM circles
    WHERE name = 'Bball';
    
    IF v_circle_id IS NULL THEN
        -- Generate a unique invite code
        v_invite_code := 'BBALL' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
        
        -- Create the Bball circle
        INSERT INTO circles (
            id,
            name,
            description,
            invite_code,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            uuid_generate_v4(),
            'Bball',
            'Basketball enthusiasts unite! Share your hoops journey, training sessions, and game highlights. Whether you''re practicing free throws or running drills, this is your court.',
            v_invite_code,
            (SELECT id FROM auth.users LIMIT 1), -- Use first user as creator, or you can specify a specific user ID
            NOW(),
            NOW()
        ) RETURNING id INTO v_circle_id;
        
        RAISE NOTICE 'Created Bball circle with ID: % and invite code: %', v_circle_id, v_invite_code;
        
        -- Optionally, add the creator as the first member
        INSERT INTO circle_members (
            id,
            circle_id,
            user_id,
            role,
            joined_at
        ) VALUES (
            uuid_generate_v4(),
            v_circle_id,
            (SELECT created_by FROM circles WHERE id = v_circle_id),
            'admin',
            NOW()
        );
        
        RAISE NOTICE 'Added creator as admin member of Bball circle';
    ELSE
        RAISE NOTICE 'Bball circle already exists with ID: %', v_circle_id;
    END IF;
END $$;

-- Create some default challenges for the Bball circle (optional)
DO $$
DECLARE
    v_circle_id UUID;
BEGIN
    -- Get the Bball circle ID
    SELECT id INTO v_circle_id
    FROM circles
    WHERE name = 'Bball';
    
    IF v_circle_id IS NOT NULL THEN
        -- Create a daily practice challenge
        INSERT INTO challenges (
            id,
            circle_id,
            name,
            description,
            type,
            status,
            start_date,
            end_date,
            created_by,
            created_at
        ) VALUES (
            uuid_generate_v4(),
            v_circle_id,
            '30-Day Shooting Challenge',
            'Make 100 shots every day for 30 days. Track your makes and misses!',
            'streak',
            'active',
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '30 days',
            (SELECT created_by FROM circles WHERE id = v_circle_id),
            NOW()
        ) ON CONFLICT DO NOTHING;
        
        -- Create a weekly game challenge
        INSERT INTO challenges (
            id,
            circle_id,
            name,
            description,
            type,
            status,
            start_date,
            end_date,
            created_by,
            created_at
        ) VALUES (
            uuid_generate_v4(),
            v_circle_id,
            'Weekly Pickup Games',
            'Play at least 2 pickup games per week. Share your highlights!',
            'recurring',
            'active',
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '90 days',
            (SELECT created_by FROM circles WHERE id = v_circle_id),
            NOW()
        ) ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Created default challenges for Bball circle';
    END IF;
END $$;

-- Output the invite code for users to join
SELECT 
    name AS circle_name,
    invite_code,
    description,
    created_at
FROM circles
WHERE name = 'Bball';