# Official Supabase Backup & Restore Guide

Using Supabase's official CLI method to create a complete copy of production → staging.

## Prerequisites

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Install Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop/
   - Required for Supabase CLI to work

3. **Install psql (PostgreSQL client)**
   ```bash
   # Ubuntu/WSL
   sudo apt-get install postgresql-client

   # macOS
   brew install postgresql
   ```

---

## PART 1: Backup Production Database

### Step 1: Get Production Connection String

1. Go to **Production Supabase** → Dashboard
2. Click **"Connect"** button (top right)
3. Choose **"Session pooler"** tab
4. Copy the connection string:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```

### Step 2: Get Database Password

1. Production Supabase → Settings → Database
2. Click **"Reset database password"**
3. Copy the new password
4. Replace `[YOUR-PASSWORD]` in the connection string with this password

### Step 3: Run Backup Commands

```bash
cd /home/marek/Unity-vision

# Save your connection string for easy copy-paste
PROD_DB="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Backup roles
supabase db dump --db-url "$PROD_DB" -f roles.sql --role-only

# Backup schema (tables, functions, policies)
supabase db dump --db-url "$PROD_DB" -f schema.sql

# Backup data (all rows)
supabase db dump --db-url "$PROD_DB" -f data.sql --use-copy --data-only
```

**Result**: You'll have 3 files:
- `roles.sql` - User roles and permissions
- `schema.sql` - Tables, functions, RLS policies
- `data.sql` - All the actual data (rows)

**How long**: 2-5 minutes depending on database size

---

## PART 2: Restore to Staging Database

### Step 1: Create New Staging Project

1. Go to https://supabase.com/dashboard
2. Click **"New project"**
3. Fill in:
   - **Name**: Unity-Vision-Staging
   - **Database Password**: (save this!)
   - **Region**: Same as production
4. Wait for provisioning (~2 minutes)

### Step 2: Configure Staging Project

**IMPORTANT**: Before restoring, enable any features you used in production:

1. If you used **Database Webhooks**: Settings → Database → Enable Database Webhooks
2. If you used **Realtime**: Database → Replication → Enable for necessary tables
3. If you used any **Extensions**: Database → Extensions → Enable them

### Step 3: Get Staging Connection String

1. Staging Supabase → Click **"Connect"**
2. Choose **"Session pooler"** tab
3. Copy connection string
4. Replace `[YOUR-PASSWORD]` with the database password you set when creating the project

### Step 4: Restore Database

```bash
cd /home/marek/Unity-vision

# Save staging connection string
STAGING_DB="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Restore everything in one command
psql \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file roles.sql \
  --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql \
  --dbname "$STAGING_DB"
```

**What this does**:
- Restores all roles (users, permissions)
- Restores all schema (tables, functions, RLS)
- Restores all data (rows)
- All in one transaction (if anything fails, it rolls back)

**How long**: 2-5 minutes

---

## PART 3: Migrate Storage Files (Photos, Audio)

### Step 1: Create Migration Script

Create `/home/marek/Unity-vision/migrate-storage.js`:

```javascript
// npm install @supabase/supabase-js@2
const { createClient } = require('@supabase/supabase-js')

const OLD_PROJECT_URL = 'https://xxx.supabase.co' // REPLACE
const OLD_PROJECT_SERVICE_KEY = 'old-project-service-key-xxx' // REPLACE
const NEW_PROJECT_URL = 'https://yyy.supabase.co' // REPLACE
const NEW_PROJECT_SERVICE_KEY = 'new-project-service-key-yyy' // REPLACE

;(async () => {
  const oldSupabaseRestClient = createClient(OLD_PROJECT_URL, OLD_PROJECT_SERVICE_KEY, {
    db: {
      schema: 'storage',
    },
  })
  const oldSupabaseClient = createClient(OLD_PROJECT_URL, OLD_PROJECT_SERVICE_KEY)
  const newSupabaseClient = createClient(NEW_PROJECT_URL, NEW_PROJECT_SERVICE_KEY)

  // Get all objects from old storage
  const { data: oldObjects, error } = await oldSupabaseRestClient.from('objects').select()
  if (error) {
    console.log('Error getting objects from old storage:', error)
    throw error
  }

  console.log(`Found ${oldObjects.length} files to migrate`)

  // Move each object
  for (const objectData of oldObjects) {
    console.log(`Moving ${objectData.bucket_id}/${objectData.name}`)
    try {
      // Download from old project
      const { data, error: downloadError } = await oldSupabaseClient.storage
        .from(objectData.bucket_id)
        .download(objectData.name)
      if (downloadError) throw downloadError

      // Upload to new project
      const { error: uploadError } = await newSupabaseClient.storage
        .from(objectData.bucket_id)
        .upload(objectData.name, data, {
          upsert: true,
          contentType: objectData.metadata.mimetype,
          cacheControl: objectData.metadata.cacheControl,
        })
      if (uploadError) throw uploadError

      console.log(`✓ Migrated ${objectData.name}`)
    } catch (err) {
      console.log(`✗ Error migrating ${objectData.name}:`, err.message)
    }
  }

  console.log('\nMigration complete!')
})()
```

### Step 2: Install Dependencies

```bash
cd /home/marek/Unity-vision
npm install @supabase/supabase-js@2
```

### Step 3: Update Script with Your Credentials

1. **Production**:
   - Production Supabase → Settings → API
   - Copy **Project URL** (`https://xxx.supabase.co`)
   - Copy **service_role key** (click "Reveal")

2. **Staging**:
   - Staging Supabase → Settings → API
   - Copy **Project URL** (`https://yyy.supabase.co`)
   - Copy **service_role key** (click "Reveal")

3. Replace in `migrate-storage.js`:
   - `OLD_PROJECT_URL` → Production URL
   - `OLD_PROJECT_SERVICE_KEY` → Production service key
   - `NEW_PROJECT_URL` → Staging URL
   - `NEW_PROJECT_SERVICE_KEY` → Staging service key

### Step 4: Run Migration

```bash
node migrate-storage.js
```

**What it does**:
- Finds all files in production storage
- Downloads each file
- Uploads to staging storage
- Preserves bucket names, file names, metadata

**How long**: Depends on file count
- 100 files: ~1 minute
- 1000 files: ~10 minutes
- 10000 files: ~1+ hour

---

## PART 4: Update Your App Config

### Update .env.staging

Edit `/home/marek/Unity-vision/.env.staging`:

```bash
# Get these from: Staging Supabase → Settings → API

SUPABASE_URL=https://YOUR-STAGING-PROJECT-REF.supabase.co
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-STAGING-PROJECT-REF.supabase.co

SUPABASE_ANON_KEY=YOUR_STAGING_ANON_KEY
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_STAGING_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY=YOUR_STAGING_SERVICE_ROLE_KEY

# Get from: Settings → Database → Connection string
DATABASE_URL=postgresql://postgres:[YOUR-STAGING-PASSWORD]@db.YOUR-STAGING-PROJECT-REF.supabase.com:5432/postgres
```

### Switch to Staging

```bash
cp .env.staging .env
npm start
```

---

## Verification Checklist

### Database
1. Staging Supabase → Table Editor
2. Check row counts match production:
   - [ ] `profiles` - Same count?
   - [ ] `posts` - Same count?
   - [ ] `challenge_participants` - Same count?
   - [ ] `circles` - Same count?

### Storage
1. Staging Supabase → Storage
2. Check buckets exist:
   - [ ] `avatars` - Has files?
   - [ ] `post-photos` - Has files?
   - [ ] Click a random file - Opens correctly?

### App
1. Connect to staging: `cp .env.staging .env && npm start`
2. Login with production credentials
3. Verify:
   - [ ] Profile picture loads
   - [ ] Posts show with photos
   - [ ] Challenge data appears
   - [ ] Everything looks normal

---

## Troubleshooting

### "supabase: command not found"
```bash
npm install -g supabase
```

### "psql: command not found"
```bash
sudo apt-get install postgresql-client
```

### "permission denied for schema auth"
1. Edit `schema.sql`
2. Find lines with `ALTER ... OWNER TO "supabase_admin"`
3. Comment them out (add `--` at start of line)
4. Re-run restore command

### "duplicate key value violates unique constraint"
- Staging already has data
- Drop and recreate staging database, then restore again

### Storage migration stuck
- Check you're using **service_role** key (NOT anon key)
- Verify bucket names are correct
- Check network connection

---

## Quick Command Reference

**Backup production**:
```bash
PROD_DB="postgresql://postgres.[REF]:[PASS]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
supabase db dump --db-url "$PROD_DB" -f roles.sql --role-only
supabase db dump --db-url "$PROD_DB" -f schema.sql
supabase db dump --db-url "$PROD_DB" -f data.sql --use-copy --data-only
```

**Restore to staging**:
```bash
STAGING_DB="postgresql://postgres.[REF]:[PASS]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
psql --single-transaction --variable ON_ERROR_STOP=1 \
  --file roles.sql --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql --dbname "$STAGING_DB"
```

**Migrate storage**:
```bash
node migrate-storage.js
```

**Switch to staging**:
```bash
cp .env.staging .env
npm start
```

---

**You now have a complete production copy in staging!** 🎉
