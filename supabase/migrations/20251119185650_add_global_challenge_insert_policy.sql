-- Add policy to allow inserting global challenges
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'challenges' AND policyname = 'Allow insert global challenges'
  ) THEN
    CREATE POLICY "Allow insert global challenges" ON challenges
      FOR INSERT WITH CHECK (scope = 'global');
  END IF;
END $$;

-- Also add a SELECT policy for global challenges so anyone can view them
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'challenges' AND policyname = 'Public can view global challenges'
  ) THEN
    CREATE POLICY "Public can view global challenges" ON challenges
      FOR SELECT USING (scope = 'global');
  END IF;
END $$;
