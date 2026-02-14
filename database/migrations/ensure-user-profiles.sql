-- Check if profiles exist for all users
SELECT u.id, u.email, p.id as profile_id, p.name, p.username
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;

-- Create profiles for users who don't have them
INSERT INTO profiles (id, email, name, username)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)) as name,
  split_part(u.email, '@', 1) as username
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Also ensure the test user has a profile
INSERT INTO profiles (id, email, name, username)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'test@freestyle.app',
  'Test User',
  'testuser'
)
ON CONFLICT (id) DO NOTHING;

SELECT 'User profiles ensured!' as message;