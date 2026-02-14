# Staging Environment Setup Guide

## ✅ Step 1: Create New Supabase Project (DO THIS FIRST)

1. Go to https://supabase.com/dashboard
2. Click **"New project"**
3. Fill in:
   - **Name**: Unity-Vision-Staging
   - **Database Password**: (save this somewhere safe!)
   - **Region**: Same as production (for consistency)
4. Click **"Create new project"**
5. Wait ~2 minutes for provisioning

---

## ✅ Step 2: Apply Database Schema to Staging

Once your new project is ready:

1. Click **SQL Editor** in left sidebar
2. Click **"New query"**
3. **Paste the ENTIRE SQL dump** (the one from your migration export)
4. Click **"Run"** (or Ctrl+Enter)
5. Wait for completion (should take ~10 seconds)
6. Verify: Check **Table Editor** - you should see all tables created

**What this does**:
- Creates all tables (profiles, posts, challenges, etc.)
- Adds all RLS policies
- Creates all database functions
- Sets up all indexes

---

## ✅ Step 3: Get Your Staging Credentials

In your NEW staging project:

1. Click **⚙️ Settings** (bottom left)
2. Click **API** in left menu
3. Find these values:

   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Long string starting with `eyJ...`
   - **service_role key**: Click "Reveal" - another long string starting with `eyJ...`

4. Copy these values

---

## ✅ Step 4: Update .env.staging File

Open `/home/marek/Unity-vision/.env.staging` and replace:

```bash
SUPABASE_URL=https://YOUR-STAGING-PROJECT-REF.supabase.co
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-STAGING-PROJECT-REF.supabase.co

SUPABASE_ANON_KEY=YOUR_STAGING_ANON_KEY
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_STAGING_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY=YOUR_STAGING_SERVICE_ROLE_KEY

DATABASE_URL=postgresql://postgres:[YOUR-STAGING-PASSWORD]@db.YOUR-STAGING-PROJECT-REF.supabase.co:5432/postgres
```

**Replace**:
- `YOUR-STAGING-PROJECT-REF` → The part of your Project URL (e.g., `abcdef1234567890`)
- `YOUR_STAGING_ANON_KEY` → The anon/public key you copied
- `YOUR_STAGING_SERVICE_ROLE_KEY` → The service role key you copied
- `[YOUR-STAGING-PASSWORD]` → The database password you set when creating the project

---

## ✅ Step 5: (Optional) Copy Production Data to Staging

### Why do this?
- Test fixes with real data
- See actual user scenarios
- Verify calculations with real numbers

### How to do it:

#### Option A: Manual CSV Export/Import (Easiest)

In **Production** Supabase:
1. Table Editor → Select table → Click "..." → Export CSV
2. Repeat for key tables: `profiles`, `challenge_participants`, `challenge_completions`, `circles`, `posts`

In **Staging** Supabase:
1. Table Editor → Select table → Click "..." → Import CSV
2. Upload the CSVs you downloaded

#### Option B: Using pg_dump (More Complete)

```bash
# 1. Export data from production
pg_dump -h db.YOUR-PROD-REF.supabase.co \
  -U postgres \
  -d postgres \
  --data-only \
  --inserts \
  -f production_data.sql

# 2. Import to staging
psql -h db.YOUR-STAGING-REF.supabase.co \
  -U postgres \
  -d postgres \
  -f production_data.sql
```

**Note**: You'll be prompted for passwords (use the ones from Settings → Database)

---

## ✅ Step 6: Switch Between Production and Staging

### Option A: Environment Variable (Recommended)

Add to your `package.json`:

```json
"scripts": {
  "start": "expo start",
  "start:staging": "cp .env.staging .env && expo start",
  "start:prod": "cp .env.production .env && expo start"
}
```

Then run:
```bash
npm run start:staging  # Use staging
npm run start:prod     # Use production
```

### Option B: Manual Swap

```bash
# To use STAGING:
cp .env.staging .env
npm start

# To use PRODUCTION:
cp .env.production .env
npm start
```

**CRITICAL**: Always verify which environment you're in!
- Check the console output for Supabase URL
- Add a visual indicator in the app (e.g., banner that says "STAGING")

---

## 🔒 Safety Checklist

Before making changes in staging:

- [ ] Verified .env.staging file has correct staging credentials
- [ ] App is connected to staging (check console for Supabase URL)
- [ ] Database has the current production schema
- [ ] (Optional) Database has production data copy for testing
- [ ] .env.staging is in .gitignore (it is!)

---

## 🧪 Testing Workflow

1. **Make code changes in staging**
   ```bash
   cp .env.staging .env
   npm start
   ```

2. **Test the fix**
   - Create test user
   - Reproduce the bug
   - Verify it's fixed

3. **Apply to production**
   - Commit code changes to git
   - If needed: Run SQL migrations in production database
   - Deploy

---

## 📋 What You Can Test in Staging

✅ Safe to test:
- All code changes
- Database query fixes
- RLS policy updates
- Schema changes (new columns, tables)
- Bulk data updates

❌ Don't test in staging:
- Email notifications (they'll go to real users)
- Push notifications (if using production tokens)
- Payment processing
- Third-party API integrations

---

## 🎯 Next Steps

1. Create staging Supabase project
2. Get credentials (URL, keys)
3. Update .env.staging
4. Paste SQL schema into SQL Editor
5. (Optional) Import production data
6. Run app with staging: `cp .env.staging .env && npm start`
7. Start fixing bugs!

---

## ❓ Troubleshooting

**App shows "Network Error"**
- Check .env file has correct SUPABASE_URL
- Verify EXPO_PUBLIC_SUPABASE_URL matches SUPABASE_URL
- Restart Expo dev server

**Tables not showing in Table Editor**
- SQL migration may have failed
- Check SQL Editor for error messages
- Try running schema SQL again

**RLS policies blocking queries**
- Staging has same RLS as production
- Create a test user account in staging
- Use auth.uid() in queries

**Which database am I connected to?**
- Check console output on app start
- Look for Supabase URL in logs
- Add visual indicator: `__DEV__ && console.log('ENV:', process.env.SUPABASE_URL)`
