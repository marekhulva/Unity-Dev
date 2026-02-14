# Complete Production → Staging Migration Guide

This guide will help you create a **COMPLETE** copy of your production database in staging, including all data and files.

## What Gets Copied

✅ **Database Schema** (from SQL dump you already have)
- All tables, functions, indexes, RLS policies

✅ **Database Data** (using pg_dump)
- All user profiles
- All posts, comments, reactions
- All challenge data, completions, participants
- All circles, memberships
- All goals, actions, streaks
- All notifications

✅ **Storage Files** (using Supabase Storage API)
- Profile avatars
- Post photos
- Challenge completion photos
- Audio recordings

---

## Prerequisites

1. **Install PostgreSQL tools** (includes pg_dump)
   ```bash
   # On Ubuntu/WSL
   sudo apt-get update
   sudo apt-get install postgresql-client

   # On macOS
   brew install postgresql
   ```

2. **Install jq** (for parsing JSON in scripts)
   ```bash
   # On Ubuntu/WSL
   sudo apt-get install jq

   # On macOS
   brew install jq
   ```

3. **Have both projects ready**
   - Production Supabase project
   - Staging Supabase project (created already)

---

## Part 1: Copy Database Schema (Already Done!)

You already have the SQL dump. Just paste it into Staging's SQL Editor.

**If you haven't done this yet**:
1. Staging Supabase → SQL Editor → New query
2. Paste the entire SQL dump
3. Run it

✅ This creates all the empty tables, functions, policies.

---

## Part 2: Copy Database Data (All Rows)

This copies every row from every table in production to staging.

### Step 1: Get Connection Strings

**Production Database**:
1. Production Supabase → Settings → Database
2. Scroll to "Connection string"
3. **Use the "Connection string" (NOT Connection pooler)**
4. It looks like: `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres`
5. Copy it

**Staging Database**:
1. Staging Supabase → Settings → Database
2. Get the same "Connection string"
3. Copy it

### Step 2: Run the Migration Script

```bash
cd /home/marek/Unity-vision
./export-production-data.sh
```

**What it does**:
1. Asks for production connection string
2. Asks for staging connection string
3. Exports all data from production → `production_data_backup.sql` file
4. Imports that data into staging
5. Shows you a summary

**How long**: Depends on data size
- Small database (< 1000 users): ~30 seconds
- Medium (1000-10000 users): ~2-5 minutes
- Large (10000+ users): ~10+ minutes

**File size**: Check the output - it shows the backup file size

---

## Part 3: Copy Storage Files (Pictures, Audio)

This copies all files from Supabase Storage buckets.

### Step 1: Get API Credentials

**Production**:
1. Production Supabase → Settings → API
2. Copy **Project URL**: `https://xxx.supabase.co`
3. Copy **service_role key** (click "Reveal")

**Staging**:
1. Staging Supabase → Settings → API
2. Copy **Project URL**: `https://yyy.supabase.co`
3. Copy **service_role key** (click "Reveal")

### Step 2: Run the Storage Migration Script

```bash
cd /home/marek/Unity-vision
./copy-storage-files.sh
```

**What it does**:
1. Asks for production URL and service key
2. Asks for staging URL and service key
3. Lists all storage buckets (avatars, post-photos, etc.)
4. Downloads all files to `storage_backup/` folder
5. Uploads all files to staging
6. Shows you a summary

**How long**: Depends on number of files
- 100 files: ~1 minute
- 1000 files: ~5-10 minutes
- 10000 files: ~30+ minutes

**Storage buckets** (common ones):
- `avatars` - Profile pictures
- `post-photos` - Photos attached to posts
- `challenge-photos` - Challenge completion photos
- `audio` - Audio recordings

---

## What If Something Goes Wrong?

### Database Import Fails

**Error: "duplicate key value violates unique constraint"**
- Staging database already has data
- Solution: Either clear staging first, or skip rows that already exist
- To clear staging:
  ```bash
  # Connect to staging
  psql "YOUR_STAGING_CONNECTION_STRING"

  # Delete all data (keeps schema)
  TRUNCATE profiles, posts, challenges, circle_members CASCADE;
  ```

**Error: "relation does not exist"**
- You didn't apply the schema first (Part 1)
- Go back and paste the SQL dump into SQL Editor

### Storage Upload Fails

**Error: "bucket already exists"**
- That's OK! The script creates buckets if they don't exist
- If they already exist, it just uploads files to them

**Error: "unauthorized"**
- Check you used the **service_role** key (NOT the anon key)
- Verify you pasted the key correctly

---

## Verification Checklist

After migration, verify everything copied:

### Database Data
1. Staging Supabase → Table Editor
2. Check key tables:
   - [ ] `profiles` - Should have same number of rows as production
   - [ ] `posts` - Should match production count
   - [ ] `challenge_participants` - Should match
   - [ ] `circles` - Should match

### Storage Files
1. Staging Supabase → Storage
2. Check each bucket:
   - [ ] `avatars` - Should have files
   - [ ] `post-photos` - Should have files
   - [ ] Click a random file - should open/download

### App Connection
1. Update `.env` to use staging:
   ```bash
   cp .env.staging .env
   ```
2. Start app: `npm start`
3. Login with a production user's credentials
4. Verify:
   - [ ] Profile picture shows (from avatars bucket)
   - [ ] Posts show with photos (from post-photos bucket)
   - [ ] Challenge data appears correct

---

## File Locations

After migration:

```
/home/marek/Unity-vision/
├── production_data_backup.sql       ← Database backup (keep this!)
├── storage_backup/                  ← Files backup (can delete after verifying)
│   ├── avatars/
│   ├── post-photos/
│   ├── challenge-photos/
│   └── audio/
├── .env.staging                     ← Staging credentials
└── .env                             ← Current environment (production or staging)
```

---

## Safety Tips

✅ **DO**:
- Keep `production_data_backup.sql` - it's your safety net
- Test thoroughly in staging before applying fixes to production
- Verify row counts match between production and staging

❌ **DON'T**:
- Delete the backup files until you've verified staging works
- Run scripts against production by accident (check URLs carefully!)
- Commit `.env.staging` to git (it's already in .gitignore)

---

## Quick Reference

**Export database data**:
```bash
./export-production-data.sh
```

**Copy storage files**:
```bash
./copy-storage-files.sh
```

**Switch to staging**:
```bash
cp .env.staging .env
npm start
```

**Switch back to production**:
```bash
cp .env.production .env  # (if you have this)
# OR copy from your existing .env backup
npm start
```

---

## Troubleshooting

**"pg_dump: command not found"**
```bash
# Install PostgreSQL client tools
sudo apt-get install postgresql-client
```

**"jq: command not found"**
```bash
# Install jq for JSON parsing
sudo apt-get install jq
```

**"Connection timed out"**
- Check your internet connection
- Verify connection string is correct
- Some networks block PostgreSQL port (5432) - try different network

**"Too many files, taking forever"**
- The storage script downloads files one by one
- For very large storage, consider using Supabase CLI:
  ```bash
  supabase storage download --project-ref YOUR_PROD_REF
  supabase storage upload --project-ref YOUR_STAGING_REF
  ```

---

## Next Steps After Migration

1. ✅ Verify data in staging (check table row counts)
2. ✅ Verify files in staging (check storage buckets)
3. ✅ Connect app to staging (`cp .env.staging .env`)
4. ✅ Test the app with staging data
5. ✅ Start fixing bugs in staging!
6. ✅ Apply fixes to production once tested

---

**You're now ready to safely experiment with your staging environment!** 🚀
