# Unity Dev - Development/Staging Environment

🚧 **This is the DEVELOPMENT environment** - NOT production!

## 🎯 Purpose

Safe testing environment for Unity Vision app:
- **Isolated database**: Separate from production users
- **No risk**: Test fixes without affecting live users
- **Fresh start**: Clean slate for bug fixes and features

## 📂 Project Structure

```
Unity-Dev/           ← You are here (Development/Staging)
Unity-vision/        ← Production (Live users - DON'T touch!)
```

## 🔧 Environment

### Backend: Supabase "Unity Dev" Project
- **Project URL**: `https://fkzfnxumxnnlidfyztef.supabase.co`
- **Database**: Copy of production (as of Feb 14, 2026)
- **Storage**: Separate buckets (initially empty)
- **Dashboard**: https://supabase.com/dashboard/project/fkzfnxumxnnlidfyztef

### Frontend: React Native (Expo)
- **Port**: 8081
- **Environment**: Connected to Unity Dev backend
- **GitHub**: https://github.com/marekhulva/Unity-Dev

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd /home/marek/Unity-Dev
npm install
```

### 2. Start Development Server
```bash
npm start
```

App runs on `http://localhost:8081` connected to Unity Dev backend.

### 3. Verify Environment
Check console output - should see:
```
✅ Supabase URL: https://fkzfnxumxnnlidfyztef.supabase.co
```

**NOT** the production URL: `https://ojusijzhshvviqjeyhyn.supabase.co`

## ⚠️ CRITICAL - Don't Mix Environments!

| Environment | Folder | Backend | Users |
|-------------|--------|---------|-------|
| **Development** | `/home/marek/Unity-Dev` | Unity Dev Supabase | Test/Copy data |
| **Production** | `/home/marek/Unity-vision` | Production Supabase | LIVE USERS |

### Safety Rules:
- ❌ **NEVER** test with production backend
- ❌ **NEVER** commit Unity Dev changes directly to production
- ❌ **NEVER** run fixes in production first
- ✅ **ALWAYS** test in Unity Dev first
- ✅ **ALWAYS** verify which environment you're in
- ✅ **ALWAYS** copy tested fixes to production

## 🧪 Testing Workflow

1. **Make changes** in `/home/marek/Unity-Dev`
2. **Test locally** (npm start in Unity-Dev)
3. **Verify** database changes in Unity Dev Supabase dashboard
4. **Confirm** fixes work (no errors, correct behavior)
5. **Copy to production**:
   ```bash
   # Copy specific file
   cp /home/marek/Unity-Dev/src/path/file.tsx /home/marek/Unity-vision/src/path/file.tsx

   # Or copy entire directory
   rsync -av /home/marek/Unity-Dev/src/features/daily/ /home/marek/Unity-vision/src/features/daily/
   ```
6. **Test in production** (quick smoke test)
7. **Deploy** if needed

## 📊 Database

### Unity Dev Supabase Dashboard
https://supabase.com/dashboard/project/fkzfnxumxnnlidfyztef

**Contents** (as of Feb 14, 2026):
- ✅ Full schema (all tables, functions, RLS)
- ✅ Production data copy (all users, posts, challenges)
- ⚠️ Storage buckets empty (copy files if needed)

### Making Database Changes

If you need to run SQL migrations:

1. **Test in Unity Dev first**:
   - Unity Dev Supabase → SQL Editor
   - Run migration
   - Verify it works

2. **Then apply to production**:
   - Production Supabase → SQL Editor
   - Run same migration
   - Verify it works

## 🔐 Environment Variables

`.env` file contains Unity Dev credentials (already configured):

```bash
SUPABASE_URL=https://fkzfnxumxnnlidfyztef.supabase.co
EXPO_PUBLIC_SUPABASE_URL=https://fkzfnxumxnnlidfyztef.supabase.co

SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

DATABASE_URL=postgresql://postgres:Inoshatan1994!@db.fkzfnxumxnnlidfyztef...
```

✅ `.env` is in `.gitignore` (won't be committed)
❌ **NEVER commit .env to git!**

## 🐛 Bug Fixing Priority

Start with the audit reports in this folder:

1. **MASTER_BUG_AUDIT_COMPLETE.md** - Overview of 244+ bugs
2. **BUG_AUDIT_ROUND_3_SUMMARY.md** - Security/database issues
3. **COMPLETE_BUG_AUDIT_ROUNDS_1-2.md** - Detailed findings

### Top Priority Fixes (Start Here):
1. Fix `current_day` calculation inconsistency
2. Add missing RLS policies (notifications, push_tokens, daily_reviews)
3. Fix timezone handling (use local timezone only)
4. Wrap console.log with `__DEV__` (134 instances)
5. Fix database schema mismatch

## 🔍 Debugging

### Check Which Environment You're In

```bash
# Look at console output when app starts
# Unity Dev: https://fkzfnxumxnnlidfyztef.supabase.co
# Production: https://ojusijzhshvviqjeyhyn.supabase.co
```

Or add to your code:
```javascript
console.log('ENV:', process.env.EXPO_PUBLIC_SUPABASE_URL);
```

### Common Issues

**"Can't connect to database"**
- Check `.env` file exists
- Verify Supabase URL is Unity Dev (fkzfnxumxnnlidfyztef)
- Restart Expo: `npm start`

**"Seeing wrong data"**
- Check Supabase URL in console
- Make sure you're in `/home/marek/Unity-Dev` folder
- Not `/home/marek/Unity-vision`

**"Changes not appearing"**
- Clear cache: `npx expo start -c`
- Restart Metro bundler
- Hard refresh browser

## 📱 GitHub Repository

**Repo**: https://github.com/marekhulva/Unity-Dev

- Separate from production repo
- Push development work here
- Keep in sync with fixes

### Git Workflow

```bash
cd /home/marek/Unity-Dev

# Make changes, test them

# Commit and push
git add .
git commit -m "Fix: description of fix

🤖 Generated with Claude Code

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git push origin master
```

## 🎯 Next Steps

1. ✅ Install dependencies: `cd /home/marek/Unity-Dev && npm install`
2. ✅ Start dev server: `npm start`
3. ✅ Verify Unity Dev backend connection (check console)
4. ✅ Read bug audit reports
5. ✅ Start fixing bugs!

## 📋 Important Files

- `.env` - Unity Dev credentials (DON'T commit!)
- `MASTER_BUG_AUDIT_COMPLETE.md` - Bug overview
- `BUG_AUDIT_ROUND_3_SUMMARY.md` - Security issues
- `CLAUDE.md` - Development guidelines

---

## 🆘 Need Help?

**Remember:**
- This is Unity **Dev** (development)
- Production is in `/home/marek/Unity-vision`
- Always test here first!
- Then copy fixes to production

**Happy bug fixing!** 🐛🔧

---

**Production project**: `/home/marek/Unity-vision`
**This project**: `/home/marek/Unity-Dev` ← You are here
