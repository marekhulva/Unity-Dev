# 🚀 Supabase Migration Guide

## Overview
We're migrating from a custom Node.js/Express backend to Supabase Backend-as-a-Service (BaaS) for simpler architecture and better scalability.

## Migration Status

### ✅ Completed
1. **Supabase client library installed** (`@supabase/supabase-js`)
2. **Service configuration created** (`src/services/supabase.ts`)
3. **Database schema prepared** (`supabase/migrations/`)
4. **RLS policies defined** (Row Level Security)
5. **Auth slice for Supabase** (`src/state/slices/authSliceSupabase.ts`)

### 🔄 In Progress
- Setting up Supabase project configuration
- Running database migrations

### ⏳ Pending
- Replace all API calls with Supabase SDK
- Update state management
- Test all features
- Remove old backend code

## Setup Instructions

### 1. Get Your Supabase Keys
1. Go to https://supabase.com/dashboard/project/ojusijzhshvviqjeyhyn/settings/api
2. Copy the `anon public` key
3. Copy the project URL

### 2. Update Configuration
Edit `src/services/supabase.ts`:
```typescript
const supabaseUrl = 'https://ojusijzhshvviqjeyhyn.supabase.co';
const supabaseAnonKey = 'YOUR_ANON_KEY_HERE';
```

### 3. Run Database Migrations
Go to Supabase SQL Editor and run these scripts in order:
1. `supabase/migrations/001_initial_schema.sql` - Creates all tables
2. `supabase/migrations/002_rls_policies.sql` - Sets up security

### 4. Enable Authentication
In Supabase Dashboard:
1. Go to Authentication → Providers
2. Enable Email/Password authentication
3. Configure email templates if needed

### 5. Update Frontend Code
Replace imports in your components:
```typescript
// Old
import { apiService } from './services/api.service';
import { createAuthSlice } from './state/slices/authSlice';

// New
import { supabase, supabaseHelpers } from './services/supabase';
import { createAuthSlice } from './state/slices/authSliceSupabase';
```

## Architecture Comparison

### Before (Custom Backend)
```
Frontend → API Service → Express Server → Prisma → PostgreSQL
         ↓
    AsyncStorage (token)
```

### After (Supabase BaaS)
```
Frontend → Supabase Client SDK → Supabase (Auth + DB + RLS)
         ↓
    AsyncStorage (session)
```

## Benefits of Migration

1. **Less Code to Maintain**
   - Remove 800+ lines of backend code
   - No server deployment needed
   - Built-in authentication

2. **Better Features**
   - Real-time subscriptions out of the box
   - File storage included
   - Row Level Security for data protection
   - OAuth providers ready to use

3. **Cost Effective**
   - Free tier: 500MB database, 50K auth users, 5GB bandwidth
   - Auto-scaling included
   - No server hosting costs

4. **Developer Experience**
   - Type-safe database queries
   - Auto-generated TypeScript types
   - Built-in admin panel
   - Better error handling

## Migration Checklist

- [ ] Update Supabase configuration with actual keys
- [ ] Run database migrations in Supabase
- [ ] Test user registration
- [ ] Test user login
- [ ] Test goals CRUD operations
- [ ] Test actions/daily features
- [ ] Test social posts
- [ ] Test reactions
- [ ] Verify RLS policies work correctly
- [ ] Remove old backend folder
- [ ] Update deployment documentation

## Testing the Migration

### Quick Test
```bash
# 1. Make sure backend is NOT running
# 2. Start the app
npm start

# 3. Try to register a new user
# 4. Create a goal
# 5. Add an action
# 6. Create a post
```

### Rollback Plan
If something goes wrong:
```bash
# 1. Revert to previous commit
git checkout f8691bd

# 2. Start the backend server
cd best-backend
node src/server-db.js

# 3. Frontend will work with old API
```

## Common Issues & Solutions

### Issue: "Invalid API key"
**Solution:** Update the anon key in `src/services/supabase.ts`

### Issue: "User not found after registration"
**Solution:** Check if the trigger `on_auth_user_created` is enabled

### Issue: "Permission denied" errors
**Solution:** Verify RLS policies are correctly applied

### Issue: "Cannot read posts"
**Solution:** Check visibility rules in RLS policies

## Next Steps After Migration

1. **Add Real-time Features**
   ```typescript
   // Subscribe to new posts
   supabase
     .channel('posts')
     .on('postgres_changes', { 
       event: 'INSERT', 
       schema: 'public', 
       table: 'posts' 
     }, handleNewPost)
     .subscribe()
   ```

2. **Add File Storage**
   ```typescript
   // Upload profile pictures
   const { data, error } = await supabase.storage
     .from('avatars')
     .upload(`${userId}/avatar.png`, file)
   ```

3. **Add OAuth Providers**
   - Google Sign-in
   - Apple Sign-in
   - GitHub OAuth

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [JavaScript Client Library](https://supabase.com/docs/reference/javascript/introduction)
- [Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)