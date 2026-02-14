# BACKUP - Custom Node.js Backend

## ⚠️ STATUS: NOT CURRENTLY USED

**Current Backend:** Supabase (since Jan 21, 2025)

This is our custom Express + Prisma backend that was used until Build #3.
Kept as a fallback option in case we need to switch back.

**Last Working:** January 20, 2025 (TestFlight Build #3)

## To Reactivate This Backend:

1. Move this folder back to 'best-backend/'
2. Update src/config/app.config.ts:
   backend: 'custom' // instead of 'supabase'
3. Deploy to Railway/Render/Heroku
4. Update environment variables

## Why We Switched:
- Railway was crashing frequently
- Needed more stable solution for testing
- Supabase provides built-in auth and real-time features
