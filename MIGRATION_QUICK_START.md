# 🚀 Quick Start: Production → Staging Migration

You have **3 options** to migrate your production database to staging.

## Option 1: Automated Script (EASIEST) ⭐

Run the automated script that does everything for you:

```bash
cd /home/marek/Unity-vision
./full-migration.sh
```

**What it does**:
1. ✅ Checks prerequisites (Supabase CLI, psql, Node.js)
2. ✅ Backs up production database (3 files: roles, schema, data)
3. ✅ Restores to staging database
4. ✅ Migrates all storage files (photos, avatars, audio)
5. ✅ Shows you a summary

**You just need**:
- Production database connection string
- Staging database connection string (after creating project)
- Production API credentials (URL + service key)
- Staging API credentials (URL + service key)

**Time**: 10-20 minutes (mostly waiting)

---

## Option 2: Manual Steps (Step-by-Step)

Follow the detailed guide:

📖 **Read**: `OFFICIAL_BACKUP_RESTORE_GUIDE.md`

**Steps**:
1. Backup production: `supabase db dump` (3 commands)
2. Create staging project
3. Restore to staging: `psql` command
4. Update `migrate-storage.js` with credentials
5. Run storage migration: `node migrate-storage.js`

**Time**: 15-25 minutes

---

## Option 3: Using Supabase Dashboard (No CLI)

If you don't want to use the terminal:

1. **Export schema**: Already have it (the SQL dump you pasted earlier)
2. **Export data**: Table Editor → Each table → Export CSV
3. **Import to staging**: Table Editor → Each table → Import CSV
4. **Storage**: Can't easily migrate via dashboard (use Option 1 or 2)

**Time**: 1-2 hours (manual work)

---

## 📋 Prerequisites

Before starting, make sure you have:

### Installed
- [ ] Supabase CLI: `npm install -g supabase`
- [ ] PostgreSQL client: `sudo apt-get install postgresql-client`
- [ ] Node.js: Already installed ✓
- [ ] Docker Desktop: https://www.docker.com/products/docker-desktop/

### Created
- [ ] Staging Supabase project (can create during migration)

### Ready
- [ ] Production database connection string
- [ ] Production database password
- [ ] Production API credentials (URL + service key)

---

## 🎯 Recommended: Option 1 (Automated Script)

Just run:

```bash
cd /home/marek/Unity-vision
./full-migration.sh
```

The script will guide you through everything step-by-step!

---

## 📁 Files Created During Migration

After migration, you'll have:

```
/home/marek/Unity-vision/
├── roles.sql                    ← Database roles backup
├── schema.sql                   ← Database schema backup
├── data.sql                     ← Database data backup (KEEP THIS!)
├── migrate-storage.js           ← Storage migration script
├── .env.staging                 ← Staging credentials
└── node_modules/                ← Dependencies for storage migration
```

**IMPORTANT**: Keep `data.sql` - it's your complete production data backup!

---

## ✅ Verification After Migration

Check these to verify everything copied correctly:

### Database
1. Staging Supabase → Table Editor
2. Compare row counts with production:
   - `profiles` - Same number?
   - `posts` - Same number?
   - `challenge_participants` - Same number?

### Storage
1. Staging Supabase → Storage
2. Check buckets have files:
   - `avatars` - Has images?
   - `post-photos` - Has images?
   - Click random file - Opens?

### App
1. Update `.env.staging` with staging credentials
2. Switch to staging: `cp .env.staging .env`
3. Start app: `npm start`
4. Login with production user
5. Check:
   - Profile picture shows?
   - Posts show with photos?
   - Challenges load correctly?

---

## 🔧 Troubleshooting

**"supabase: command not found"**
```bash
npm install -g supabase
```

**"psql: command not found"**
```bash
sudo apt-get update
sudo apt-get install postgresql-client
```

**"Docker is not running"**
- Start Docker Desktop application
- Wait for it to fully start
- Try again

**Migration fails with "permission denied"**
- Check you're using database **password** (not API key)
- Verify connection string is correct
- Make sure you replaced `[YOUR-PASSWORD]` with actual password

**Storage migration stuck**
- Verify you're using **service_role** key (NOT anon key)
- Check network connection
- Look at console for specific error messages

---

## 💡 Pro Tips

1. **Keep backups**: Don't delete `roles.sql`, `schema.sql`, `data.sql` until you've verified staging works
2. **Test first**: Always test fixes in staging before applying to production
3. **Visual indicator**: Add a banner in your app that says "STAGING" so you know which environment you're in
4. **Switch easily**: Use `cp .env.staging .env` to switch to staging, `cp .env.production .env` to switch back

---

## 🆘 Need Help?

If you get stuck:

1. Check the error message carefully
2. Read the detailed guide: `OFFICIAL_BACKUP_RESTORE_GUIDE.md`
3. Verify prerequisites are installed
4. Check connection strings are correct
5. Ensure passwords don't have special characters that need escaping

---

**Ready? Run the automated script:**

```bash
cd /home/marek/Unity-vision
./full-migration.sh
```

🎉 You'll have a complete production copy in staging in ~15 minutes!
