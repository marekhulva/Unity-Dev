# BUG AUDIT ROUND 3 - Security & Database
**Generated**: 2026-02-14
**Focus**: Database security, RLS policies, token storage, production logging

---

## CRITICAL SECURITY ISSUES FOUND

### 1. **INSECURE TOKEN STORAGE - AsyncStorage Instead of SecureStore**
**Severity**: CRITICAL - Credentials Exposed

**Evidence**:
```typescript
// src/services/api.service.ts
await AsyncStorage.setItem('authToken', token);

// src/state/slices/authSlice.ts
await AsyncStorage.setItem('token', token);
await AsyncStorage.setItem('user', JSON.stringify(user));
```

**Problem**:
- AsyncStorage is NOT encrypted on iOS/Android
- Auth tokens stored in plain text
- User data (potentially including email, name, etc.) stored unencrypted
- Anyone with device access can read tokens
- Malware can extract tokens easily

**Should Use**: `expo-secure-store` instead
```typescript
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('authToken', token);
```

**Files Affected**:
- `/home/marek/Unity-vision/src/services/api.service.ts` (lines 18-19, 26)
- `/home/marek/Unity-vision/src/state/slices/authSlice.ts` (lines 114, 115, 132, 133, 144-146)
- `/home/marek/Unity-vision/src/services/supabase.service.ts` (lines 20, 1295-1297)

---

### 2. **134 PRODUCTION CONSOLE LOGS**
**Severity**: HIGH - Information Disclosure

**Found**: 134 `console.log/error/warn` statements WITHOUT `__DEV__` guard

**Problem**:
- Logs run in production builds
- May expose sensitive data (user IDs, tokens, internal state)
- Performance impact (console operations are slow)
- Can't be disabled without rebuild

**Examples**:
```typescript
// Exposed in production:
console.log('User data:', user);  // Exposes PII
console.error('Auth error:', error);  // Exposes internal errors
console.warn('Invalid state:', state);  // Debug info in production
```

**Recommendation**: Wrap ALL console statements with `if (__DEV__)` or use logging service

---

### 3. **MISSING RLS POLICIES ON NEW TABLES**
**Severity**: HIGH - Authorization Bypass

**Tables With RLS Missing/Incomplete**:

#### Missing Policies:
1. **`notifications` table** - RLS enabled but NO policies found
   - Created in `/home/marek/Unity-vision/supabase/migrations/20251030_create_notifications_table.sql`
   - `ENABLE ROW LEVEL SECURITY` on line 13
   - NO `CREATE POLICY` statements
   - **Impact**: All users can see ALL notifications!

2. **`post_circles` junction table** - RLS enabled but policy incomplete
   - Created in `/home/marek/Unity-vision/supabase/migrations/20250118_multi_circle_posts.sql`
   - Only SELECT policy exists
   - **Missing**: INSERT, UPDATE, DELETE policies
   - **Impact**: Users might be able to modify post circle associations

3. **`push_tokens` table** - RLS enabled but NO policies
   - Created in `/home/marek/Unity-vision/supabase/migrations/20260212_create_push_tokens.sql`
   - `ENABLE ROW LEVEL SECURITY` on line 11
   - NO policies defined
   - **Impact**: Users can see each other's device tokens!

4. **`daily_reviews` table** - No RLS at all
   - Created in `/home/marek/Unity-vision/supabase/migrations/create_daily_reviews_tables.sql`
   - NO `ENABLE ROW LEVEL SECURITY` statement
   - **Impact**: All users can see ALL daily reviews!

#### Incomplete Policies:
5. **`challenge_participants` table** - Missing DELETE policy
   - Users can join (INSERT) ✓
   - Users can update own participation (UPDATE) ✓
   - **Missing**: Users can't leave challenges (no DELETE policy)

---

### 4. **OVERLY PERMISSIVE RLS POLICY - Profiles Viewable by Everyone**
**Severity**: MEDIUM - Privacy Issue

**Policy**:
```sql
-- 002_rls_policies.sql line 14-15
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);
```

**Problem**:
- All user profiles visible to unauthenticated users
- Includes emails, names, potentially phone numbers
- No opt-out for private profiles
- Can be scraped by bots

**Recommendation**: Require authentication
```sql
CREATE POLICY "Authenticated users can view profiles" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);
```

---

### 5. **RLS BYPASS IN CHALLENGE COMPLETIONS**
**Severity**: MEDIUM - Authorization Flaw

**Policy**:
```sql
-- 004_create_challenges_tables.sql lines 175-182
CREATE POLICY "View challenge completions" ON challenge_completions
  FOR SELECT USING (
    participant_id IN (
      SELECT id FROM challenge_participants WHERE challenge_id IN (
        SELECT challenge_id FROM challenge_participants WHERE user_id = auth.uid()
      )
    )
  );
```

**Problem**: Nested subqueries check if user is in ANY challenge with those participants
- User A in Challenge 1 can see User B's completions in Challenge 2 if they're both in Challenge 1
- Should only see completions from SAME challenge

**Should Be**:
```sql
CREATE POLICY "View challenge completions" ON challenge_completions
  FOR SELECT USING (
    participant_id IN (
      SELECT id FROM challenge_participants
      WHERE user_id = auth.uid()
        OR challenge_id IN (
          SELECT challenge_id FROM challenge_participants WHERE user_id = auth.uid()
        )
    )
  );
```

---

## DATABASE MIGRATION ISSUES

### 6. **MISSING INDEXES ON FOREIGN KEYS**
**Severity**: MEDIUM - Performance

**Tables Missing FK Indexes**:
```sql
-- notifications table (20251030_create_notifications_table.sql)
-- NO INDEX ON user_id foreign key
ALTER TABLE notifications ADD FOREIGN KEY (user_id) REFERENCES profiles(id);
-- Should have: CREATE INDEX idx_notifications_user ON notifications(user_id);

-- daily_reviews table (create_daily_reviews_tables.sql)
-- NO INDEX ON user_id
-- Should have: CREATE INDEX idx_daily_reviews_user ON daily_reviews(user_id);

-- post_circles table (20250118_multi_circle_posts.sql)
-- NO INDEX ON post_id or circle_id
-- Should have indexes on both FK columns
```

**Impact**: Slow queries when filtering by user_id, especially as data grows

---

### 7. **NO MIGRATION ROLLBACK SCRIPTS**
**Severity**: MEDIUM - Deployment Risk

**Issue**: ALL migration files are one-way (CREATE/ALTER only)
- No corresponding DOWN migrations
- Can't rollback if migration breaks production
- No way to revert schema changes

**Example**: `004_create_challenges_tables.sql` creates 5 tables with no DROP counterpart

---

### 8. **INCONSISTENT TIMESTAMP DEFAULTS**
**Severity**: LOW - Data Quality

**Different patterns across migrations**:
```sql
-- Some use NOW()
created_at TIMESTAMP DEFAULT NOW()

-- Some use CURRENT_TIMESTAMP
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

-- Some use CURRENT_TIMESTAMP explicitly
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
```

**Problem**: Inconsistent behavior across tables, potential timezone issues

---

### 9. **MISSING UNIQUE CONSTRAINTS**
**Severity**: MEDIUM - Data Integrity

**Missing Constraints**:
```sql
-- notifications table:
-- Multiple notifications with same type/data can be created
-- Should have: UNIQUE(user_id, type, data) to prevent duplicates

-- push_tokens table:
-- Same device token can be registered multiple times
-- Should have: UNIQUE(device_token)

-- challenge_completions:
-- Has UNIQUE(participant_id, activity_id, completion_date) ✓ Good!
```

---

### 10. **CHALLENGE SCHEMA VS APPLICATION MISMATCH**
**Severity**: HIGH - Runtime Errors

**Migration Schema** (`004_create_challenges_tables.sql`):
```sql
CREATE TABLE challenge_participants (
  total_completions INTEGER DEFAULT 0,
  days_participated INTEGER DEFAULT 0,
  consistency_percentage DECIMAL(5,2) DEFAULT 0.00,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  ...
);
```

**Application Code** (`challenges.types.ts`):
```typescript
interface ChallengeParticipant {
  completion_percentage: number;  // ← Different name!
  completed_days: number;         // ← Different name!
  current_day: number;            // ← Missing in DB!
  personal_start_date: string;   // ← Missing in DB!
  status: ParticipantStatus;     // ← Missing in DB!
  ...
}
```

**Impact**: Application expects fields that don't exist in database!

**Root Cause**: Database schema is stale (from initial migration), but application evolved

---

## AUTHENTICATION SECURITY ISSUES

### 11. **NO RATE LIMITING ON AUTH ENDPOINTS**
**Severity**: MEDIUM - Brute Force Risk

**Missing Protection**:
- No rate limiting on login attempts
- No rate limiting on registration
- No CAPTCHA on sensitive operations
- Can brute force passwords

**Recommendation**: Implement Supabase rate limiting or add backend middleware

---

### 12. **SESSION NOT REVOKED ON LOGOUT**
**Severity**: MEDIUM - Session Fixation

**Current Flow**:
```typescript
// authSlice.ts logout()
await AsyncStorage.removeItem('token');
await supabase.auth.signOut();
```

**Problem**:
- Token removed from device but still valid on server
- If token is intercepted before logout, it remains valid
- No server-side session invalidation

**Should**: Implement token blacklist or short-lived tokens with refresh

---

## PRODUCTION HARDCODED VALUES

### 13. **PRODUCTION CONSOLE OUTPUT WITHOUT DEV GUARD**

**Found 134 instances**, examples:

```typescript
// src/features/social/SocialScreenUnified.tsx
console.log('[Social] selectedTab:', selectedTab);  // Line 176
console.log('[Social] feedView:', feedView);  // Line 183

// src/features/circle/CircleScreenVision.tsx
console.log('[Circle] Loading circle data for:', activeCircleId);  // Line 175
console.error('[Circle] Error loading:', error);  // Line 192

// src/services/supabase.challenges.service.ts
console.log('[CHALLENGES] Recording completion:', activityId);  // Line 352
```

**Should All Be**:
```typescript
if (__DEV__) console.log('[Social] selectedTab:', selectedTab);
```

---

## SUMMARY TABLE

| Issue | Severity | Type | Impact |
|-------|----------|------|--------|
| AsyncStorage for tokens | CRITICAL | Security | Plain text credentials |
| Missing RLS on notifications | HIGH | Authorization | All users see all notifications |
| Missing RLS on push_tokens | HIGH | Authorization | Device tokens exposed |
| Missing RLS on daily_reviews | HIGH | Authorization | Cross-user data access |
| Production console logs (134) | HIGH | Information Leak | Debug info in production |
| Database schema mismatch | HIGH | Runtime Error | App expects missing fields |
| Profiles viewable by all | MEDIUM | Privacy | No private profiles |
| RLS bypass in completions | MEDIUM | Authorization | Cross-challenge data leak |
| Missing FK indexes | MEDIUM | Performance | Slow queries |
| No migration rollbacks | MEDIUM | DevOps | Can't revert bad migrations |
| No rate limiting | MEDIUM | Security | Brute force possible |
| Session not revoked | MEDIUM | Security | Tokens stay valid |
| Missing unique constraints | MEDIUM | Data Integrity | Duplicate data allowed |
| Inconsistent timestamps | LOW | Data Quality | Minor inconsistency |

---

## IMMEDIATE ACTIONS REQUIRED

1. **TODAY**: Replace AsyncStorage with SecureStore for all auth tokens
2. **TODAY**: Add RLS policies to notifications, push_tokens, daily_reviews tables
3. **THIS WEEK**: Wrap all 134 console.log statements with `__DEV__` guards
4. **THIS WEEK**: Run database migration to add missing indexes
5. **THIS WEEK**: Fix database schema mismatch (add missing columns or update types)
6. **NEXT SPRINT**: Implement rate limiting on auth endpoints
7. **NEXT SPRINT**: Create rollback migrations for all tables

---

**End of Round 3**
**New Issues Found**: 13 critical security/database bugs
**Total Issues (Rounds 1-3)**: 244+
