# Backend Deployment Guide - Railway

## Quick Deploy to Railway (5 minutes)

### Step 1: Push Backend to GitHub
```bash
cd /home/marek/Projects/DeployTestFlight/best-backend
git init
git add .
git commit -m "Initial backend for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/freestyle-backend.git
git push -u origin main
```

### Step 2: Deploy on Railway

1. Go to https://railway.app
2. Click "Start a New Project"
3. Choose "Deploy from GitHub repo"
4. Select your `freestyle-backend` repository
5. Railway will auto-detect it's a Node.js + Prisma app

### Step 3: Configure Environment Variables

In Railway dashboard, go to Variables tab and add:

```
JWT_SECRET=your-super-secret-key-change-this-123456
JWT_EXPIRES_IN=7d
NODE_ENV=production
CLIENT_URL=*
```

Railway automatically provides:
- `DATABASE_URL` (PostgreSQL)
- `PORT`

### Step 4: Deploy Commands

Railway will automatically run:
1. `npm install`
2. `npm run build` (prisma generate)
3. `npx prisma migrate deploy`
4. `npm start`

### Step 5: Get Your Backend URL

After deployment, Railway provides a URL like:
```
https://freestyle-backend-production.up.railway.app
```

## Update Your App

Once deployed, update your React Native app:

1. Open `/home/marek/Projects/DeployTestFlight/src/config/api.js`
2. Change:
```javascript
API_URL: 'https://freestyle-backend-production.up.railway.app'
```

## Alternative: Deploy Without GitHub

If you don't want to use GitHub:

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login:
```bash
railway login
```

3. Deploy directly:
```bash
cd /home/marek/Projects/DeployTestFlight/best-backend
railway init
railway up
railway domain
```

## Monitoring

- View logs: `railway logs`
- Open dashboard: `railway open`
- Run commands: `railway run npm run prisma:studio`

## Database Access

To access your production database:
```bash
railway run npx prisma studio
```

## Troubleshooting

If deployment fails:

1. Check logs in Railway dashboard
2. Ensure all dependencies are in package.json
3. Make sure prisma schema is valid:
```bash
npx prisma validate
```

## Cost

Railway offers:
- $5 free credits per month
- ~500 hours of runtime
- Perfect for testing and small apps

## Next Steps

After backend is deployed:
1. ✅ Update API URL in your app
2. ✅ Rebuild iOS app
3. ✅ Submit to TestFlight