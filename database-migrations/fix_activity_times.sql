-- Add activity_times column to challenge_participants table
-- This stores the scheduled times for each activity
-- Format: [{"activity_id": "uuid", "scheduled_time": "9:00 AM"}]
ALTER TABLE challenge_participants
ADD COLUMN IF NOT EXISTS activity_times JSONB DEFAULT '[]'::jsonb;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'challenge_participants' 
AND column_name = 'activity_times';

-- Also ensure selected_activity_ids exists and is the correct type
DO $$ 
BEGIN
    -- Check if column exists and alter if needed
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'challenge_participants' 
        AND column_name = 'selected_activity_ids'
    ) THEN
        ALTER TABLE challenge_participants
        ALTER COLUMN selected_activity_ids TYPE text[] USING selected_activity_ids::text[];
    END IF;
END $$;