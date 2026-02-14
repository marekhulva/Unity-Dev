-- Disable email verification for testing
-- Run this in Supabase dashboard under Settings > Auth > Email

-- NOTE: This is done in the Supabase Dashboard, not SQL Editor!
-- Go to: Authentication > Settings > Email Auth
-- Toggle OFF "Enable email confirmations"

-- For now, let's update the signUp to auto-confirm users
-- This SQL creates a trigger to auto-confirm new users
CREATE OR REPLACE FUNCTION auto_confirm_users()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_confirm_trigger ON auth.users;
CREATE TRIGGER auto_confirm_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION auto_confirm_users();

SELECT 'Auto-confirm enabled for testing' as message;