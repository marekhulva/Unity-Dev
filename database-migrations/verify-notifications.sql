-- Quick verification and fix for notifications table

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'notifications'
) as table_exists;

-- If it doesn't exist, create it with all policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
    -- Create the table
    CREATE TABLE notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      data JSONB DEFAULT '{}',
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      read_at TIMESTAMP WITH TIME ZONE,
      action_url TEXT,
      
      CONSTRAINT notifications_type_check CHECK (type IN (
        'challenge_invite',
        'challenge_start',
        'activity_reminder',
        'streak_milestone',
        'challenge_complete',
        'badge_earned',
        'circle_challenge_created'
      ))
    );

    -- Indexes
    CREATE INDEX idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
    CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

    -- Enable RLS
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

    -- Policies
    CREATE POLICY "Users can view own notifications"
      ON notifications FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can update own notifications"
      ON notifications FOR UPDATE
      USING (auth.uid() = user_id);

    CREATE POLICY "Service role can insert notifications"
      ON notifications FOR INSERT
      WITH CHECK (true);

    RAISE NOTICE '✅ Notifications table created with policies';
  ELSE
    RAISE NOTICE '✅ Notifications table already exists';
  END IF;
END $$;
