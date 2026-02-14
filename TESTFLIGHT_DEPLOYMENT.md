# TestFlight Deployment Guide for Freestyle App

## Current Status
✅ **Completed:**
- Created DeployTestFlight folder with all code
- Updated app.json with iOS configuration
  - Bundle ID: `com.freestyle.app`
  - App Name: Freestyle
- Created eas.json configuration file

## Next Steps to Deploy

### Step 1: Login to EAS
```bash
eas login
```
Enter your Expo account credentials.

### Step 2: Deploy Backend (Choose one option)

#### Option A: Railway (Recommended - Fastest)
1. Go to https://railway.app
2. Connect your GitHub account
3. New Project → Deploy from GitHub repo
4. Select your backend folder
5. Railway will auto-detect it's a Node.js + Prisma app
6. It will provide you with a URL like: `https://your-app.railway.app`

#### Option B: Render
1. Go to https://render.com
2. New → Web Service
3. Connect GitHub and select repo
4. Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
5. Start Command: `npm start`

#### Option C: Heroku
1. Install Heroku CLI
2. Run:
```bash
cd best-backend
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
heroku run npx prisma migrate deploy
```

### Step 3: Update API Endpoints
Once backend is deployed, update the API URL in your app:

1. Create a config file:
```bash
# In /home/marek/Projects/DeployTestFlight/src/config/api.js
```

2. Replace all instances of `localhost:3001` with your production URL

### Step 4: Build for iOS
```bash
# Make sure you're in DeployTestFlight folder
cd /home/marek/Projects/DeployTestFlight

# Build for iOS
eas build --platform ios --profile preview
```

This will:
- Prompt you to create an Expo project if needed
- Handle certificates automatically
- Create the iOS build in the cloud

### Step 5: Submit to TestFlight
```bash
eas submit -p ios --latest
```

You'll need:
- Apple ID
- App-specific password (create at https://appleid.apple.com)
- App Store Connect Team ID (if part of multiple teams)

## Quick Commands Summary
```bash
# 1. Login
eas login

# 2. Build
eas build --platform ios --profile preview

# 3. Submit
eas submit -p ios --latest
```

## Troubleshooting

### If you get certificate errors:
```bash
eas credentials
```
Select "iOS" → "production" → Let EAS manage everything

### If build fails:
1. Check node_modules:
```bash
rm -rf node_modules
npm install
```

2. Clear cache:
```bash
npx expo start -c
```

### Testing locally before building:
```bash
npx expo start --ios
```

## What You Need Ready:
1. **Expo Account** - Create at https://expo.dev
2. **Apple Developer Account** - $99/year at https://developer.apple.com
3. **Backend Deployed** - Choose Railway/Render/Heroku
4. **Updated API URLs** - Point to production backend

## Estimated Time:
- Backend deployment: 10-15 minutes
- iOS build: 20-30 minutes
- TestFlight submission: 5-10 minutes
- **Total: ~45-60 minutes**

## Notes:
- First build takes longer as EAS sets up certificates
- Subsequent builds are faster (~15 mins)
- TestFlight review is usually instant for internal testing
- App will be available on TestFlight within minutes after submission