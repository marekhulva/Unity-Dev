# Database Schema Management - Best Practices

## 🎯 Best Practices for Startups

### 1. Single Source of Truth
**Use Migrations as Documentation**
- Your `/supabase/migrations/` folder should be the source of truth
- Each migration file is timestamped and shows schema evolution
- Never modify production database manually - always use migrations

### 2. Auto-Generate Documentation
Instead of manually maintaining schema docs, generate them from the database:

```sql
-- Run this query in Supabase to get current schema
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

### 3. Version Control Everything
```
/supabase/
  /migrations/      # All schema changes
  /seed.sql        # Test data
  config.toml      # Supabase configuration
```

### 4. Use Database Comments
```sql
COMMENT ON TABLE circles IS 'User groups for social features';
COMMENT ON COLUMN circles.invite_code IS 'Unique code for joining circle';
```

## 🔧 Tools & Automation

### Option 1: Supabase CLI (Recommended)
```bash
# Install Supabase CLI
npm install -g supabase

# Pull current schema from your project
supabase db remote commit --project-id your-project-id

# Generate TypeScript types from schema
supabase gen types typescript --project-id your-project-id > types/database.types.ts

# Create new migration
supabase migration new add_feature_name
```

### Option 2: dbdocs.io (Visual Documentation)
```sql
-- Export your schema and paste into dbdocs.io
-- It creates beautiful, shareable documentation
```

### Option 3: Auto-sync Script
Create a GitHub Action that:
1. Pulls schema weekly
2. Updates documentation
3. Creates PR if changes detected

## 📝 What to Document

### Essential Documentation
1. **Table Purpose** - What data it stores
2. **Relationships** - How tables connect
3. **Constraints** - Business rules enforced
4. **Indexes** - Performance optimizations
5. **RLS Policies** - Security rules

### Example Template
```markdown
## Table: circles

**Purpose:** Stores user groups/communities
**Key Columns:**
- `id` (UUID) - Primary key
- `name` (TEXT) - Display name
- `invite_code` (VARCHAR) - Unique join code
- `created_by` (UUID) - User who created it

**Relationships:**
- Has many `circle_members`
- Has many `challenges`

**Business Rules:**
- Invite codes must be unique
- Creator automatically becomes admin
```

## 🚀 For Your Project

### Immediate Actions
1. **Run the schema query** (`generate_schema_docs.sql`) to see actual current state
2. **Update your README** with the real column names
3. **Add comments to tables** in Supabase for future reference

### Going Forward
1. **Before each deploy:** Generate fresh schema docs
2. **After schema changes:** Run the doc generator
3. **In code reviews:** Check if schema docs need updating

### Simple Weekly Routine
Every Monday morning:
```bash
# 1. Generate current schema
psql $DATABASE_URL < generate_schema_docs.sql > docs/current_schema.md

# 2. Compare with last week
diff docs/current_schema.md docs/last_week_schema.md

# 3. Update if changed
git add docs/current_schema.md
git commit -m "docs: Update schema documentation"
```

## 🎯 Why This Matters

1. **Onboarding** - New devs understand database instantly
2. **Debugging** - Know exactly what columns exist
3. **API Design** - Match endpoints to data structure
4. **Scaling** - Identify optimization opportunities

## 📚 Resources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [dbdocs.io](https://dbdocs.io) - Visual database documentation
- [dbdiagram.io](https://dbdiagram.io) - Create ER diagrams
- [PostgreSQL Schema Docs](https://www.postgresql.org/docs/current/information-schema.html)

---

**Remember:** Documentation that's auto-generated is documentation that stays accurate!