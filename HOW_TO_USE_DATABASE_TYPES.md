# 🎯 Your Database Cheat Sheet is Ready!

## ✅ What we just created:
A file at `src/types/database.types.ts` that lists EVERY table and column in your database.

## 📖 How to Read It:

Open `src/types/database.types.ts` and you'll see something like:
```typescript
circles: {
  Row: {
    invite_code: string    // <-- This is the actual column name!
    name: string
    // ... etc
  }
}
```

This tells you:
- Table name: `circles`
- Column name: `invite_code` (NOT `code`)
- Type: `string`

## 🔍 How to Use It:

### 1. Quick Check - What columns does a table have?
Open the file and search for the table name, like `circles:` or `challenge_participants:`

### 2. In Your Code (Optional):
```typescript
import { Database } from '../types/database.types';

// Now you get autocomplete!
type Circle = Database['public']['Tables']['circles']['Row'];
// TypeScript will tell you if you use wrong column names
```

### 3. When Writing SQL:
Before writing SQL, check the file to see exact column names:
- ✅ Use: `invite_code`
- ❌ Not: `code`

## 🔄 Keep It Updated:
Whenever you change the database, run this again:
```bash
npx supabase gen types typescript --project-id "ojusijzhshvviqjeyhyn" > src/types/database.types.ts
```

## 📌 Quick Reference From Your Cheat Sheet:

**circles table has:**
- invite_code (not code!)
- name
- description
- created_by

**challenge_participants table has:**
- linked_action_ids (UUID array)
- activity_times (JSON)
- selected_activity_ids (string array)

**users table is actually called:**
- profiles (not users!)

---

This file is your "truth" - if you're ever unsure about a column name, check here first!