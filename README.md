# Freestyle - Social Goal Tracking App

## 📖 NEW TO THIS PROJECT? 
**Start here → [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)**  
Complete guide to all documentation and quick debugging!

## 🎯 Overview
Freestyle is a social goal tracking app that combines personal productivity with social accountability through two distinct social layers: intimate "Circles" and broader "Following" networks.

### Latest Updates (Aug 2025)
- ✅ Challenge system with activity times
- ✅ Fixed race condition in challenge join flow
- ✅ Complete documentation overhaul
- ✅ Activity linking to existing habits
- ✅ Leaderboard and progress tracking

## 📱 Architecture Overview

### Tech Stack
- **Frontend**: React Native (Expo)
- **Backend**: Supabase (PostgreSQL + Auth)
- **Deployment**: TestFlight (iOS), Expo EAS
- **State Management**: Zustand
- **Styling**: React Native StyleSheet with luxury theme system

### Core Features
1. **Daily Actions**: Track daily habits and goals
2. **Goals**: Long-term goal setting with milestones
3. **Social Circles**: Small, intimate groups (teams, clubs)
4. **Following Network**: Broader social connections
5. **Progress Tracking**: Visual progress and streaks
6. **Profile**: Personal stats and achievements

## 🏗️ Project Structure

```
DeployTestFlight/
├── src/
│   ├── features/          # Feature-based modules
│   │   ├── daily/         # Daily actions screen
│   │   ├── social/        # Social feed (Circle/Following)
│   │   │   ├── SocialScreen.tsx
│   │   │   ├── CircleMembersModal.tsx
│   │   │   └── JoinCircleModal.tsx
│   │   ├── progress/      # Progress tracking
│   │   └── profile/       # User profile
│   ├── services/          
│   │   ├── supabase.service.ts  # Supabase API wrapper
│   │   └── backend.service.ts   # Unified backend interface
│   ├── state/            
│   │   ├── rootStore.ts  # Zustand root store
│   │   └── slices/        # State slices (auth, goals, social)
│   └── ui/                # Reusable UI components
├── database/              # Database migrations and test data
│   ├── migrations/        # SQL migration files
│   └── test_data/         # Test data scripts
├── docs/                  # Documentation
│   ├── CIRCLES_AND_FOLLOWING.md
│   └── archive/           # Historical docs
├── app.json               # Expo configuration
├── eas.json              # EAS Build configuration
└── package.json          # Dependencies
```

## 🗄️ Database Schema

### Core Tables
```sql
-- Users & Authentication
users (id, email, name, avatar, circle_id)
profiles (id, name, username, avatar_url)

-- Circles (Groups) - Phase 1: Single circle per user
circles (id, name, code, created_by)
circle_members (circle_id, user_id, joined_at)

-- Social Following
follows (follower_id, following_id, created_at)

-- Content
goals (id, user_id, title, metric, deadline, category)
actions (id, user_id, goal_id, title, date, completed)
posts (id, user_id, type, visibility, content, media_url)
reactions (post_id, user_id, emoji)
```

## 🔐 Social System Architecture

### Current Implementation (Phase 1)
- **Your Circle**: Single private group per user
- **Following**: Public follow system for broader network

### Visibility Logic
```javascript
// Post visibility types
visibility: 'circle' | 'follow' | 'public'

// Circle posts: Only visible to circle members
// Follow posts: Visible to followers
// Public posts: Visible to all (future)
```

### Future Architecture (Phase 2)
- Multiple circles per user
- Group roles and permissions
- Cross-circle discovery

## 🚀 Getting Started

### Prerequisites
```bash
node >= 18.0.0
npm >= 9.0.0
expo-cli
eas-cli (for deployment)
```

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm start
# or
npx expo start --port 8090

# Run on iOS simulator
npx expo run:ios

# Run on Android
npx expo run:android
```

### Environment Setup
```javascript
// src/services/supabase.service.ts
const SUPABASE_URL = 'your-project-url'
const SUPABASE_ANON_KEY = 'your-anon-key'
```

## 📲 Deployment

### TestFlight Deployment
```bash
# Increment build number in app.json
# Build and submit to TestFlight
eas build --platform ios --auto-submit
```

See [TESTFLIGHT_DEPLOYMENT.md](./TESTFLIGHT_DEPLOYMENT.md) for detailed instructions.

## 🔑 Key Implementation Details

### State Management (Zustand)
```typescript
// Root store combines all slices
const useStore = create<RootState>()(
  devtools((...a) => ({
    ...createAuthSlice(...a),
    ...createGoalsSlice(...a),
    ...createSocialSlice(...a),
    ...createDailySlice(...a),
  }))
)
```

### API Service Pattern
```typescript
// Unified backend service switches between Supabase and custom backend
const backendService = {
  // Switches based on USE_SUPABASE flag
  signIn: () => USE_SUPABASE ? supabaseService.signIn() : apiService.signIn()
}
```

### Field Mapping Strategy
```typescript
// Frontend uses camelCase, Supabase uses snake_case
// Mapping happens in service layer
const { mediaUrl, actionTitle, ...data } = post;
return {
  media_url: mediaUrl,
  action_title: actionTitle,
  ...data
}
```

## 🎨 Design System

### Theme Structure
- **Luxury Theme**: Gold accents, dark backgrounds
- **Color System**: Primary (Gold), Secondary (Platinum), Tertiary (Rose Gold)
- **Safe Areas**: Dynamic iOS safe area handling with SafeAreaView

### Component Patterns
- Glass morphism effects
- Particle animations
- Haptic feedback
- Spring animations

## 🐛 Recent Fixes (Last 48 Hours)

### Complete Supabase Migration (Jan 2025)
- **Problem**: Railway backend crashing, needed stable solution
- **Solution**: Migrated entire backend to Supabase
- **Files Changed**: 
  - Created `src/services/supabase.service.ts` - Complete Supabase wrapper
  - Created `src/services/backend.service.ts` - Unified backend interface
  - Updated all state slices to use new backend service

### Database Permission Fixes
- **Problem**: "permission denied for table actions/goals"
- **Solution**: Grant ALL privileges to anon/authenticated roles
- **SQL Scripts Created**:
  - `grant-permissions.sql` - Fixed role permissions
  - `ensure-user-profiles.sql` - Create missing profiles
  - `add-missing-columns.sql` - Added frequency, duration fields

### Field Name Mapping Issues
- **Problem**: Frontend uses camelCase, Supabase uses snake_case
- **Specific Fixes**:
  - `goalId` → `goal_id` in actions table
  - `mediaUrl` → `media_url` in posts table
  - `actionTitle` → `action_title` in posts
  - `createdAt` → `created_at` throughout
- **Solution**: Added mapping layer in supabase.service.ts

### Photo Posts Disappearing
- **Problem**: Photos would post then immediately disappear
- **Root Cause**: Field names not mapped back from snake_case after creation
- **Fix**: Return proper camelCase fields from createPost method

### iOS Safe Area Issues (Jan 22, 2025)
- **Problem**: Components cut off by notch/Dynamic Island
- **Solution**: 
  - Added SafeAreaProvider to root App.tsx
  - Wrapped all screens in SafeAreaView with edges={['top']}
  - Used `useSafeAreaInsets()` for dynamic spacing
  - Fixed Social tab selector positioning with `top: insets.top`

### Daily Actions Date Filtering
- **Problem**: Daily actions not loading for current day
- **Original Code**: Complex date range with timezone
- **Fix**: Simple date equality check
```javascript
// Before: Complex range query
.gte('date', startOfDay).lt('date', endOfDay)
// After: Simple equality
.eq('date', today) // YYYY-MM-DD format
```

### Authentication Session Issues
- **Problem**: Users couldn't sign up or sign in
- **Solutions Applied**:
  1. Disabled email verification in Supabase dashboard
  2. Added fallback test user for local development
  3. Fixed AsyncStorage null value handling
  4. Proper session persistence configuration

## 📚 Documentation

### Essential Docs
- **[Complete Documentation](./COMPLETE_DOCUMENTATION.md)** - START HERE! Simple guide to everything
- **[TestFlight Deployment](./TESTFLIGHT_DEPLOYMENT.md)** - How to deploy to TestFlight

### Reference Docs
- [Backend Progress](./BACKEND_PROGRESS.md) - Feature completion status
- [Future Features](./FUTURE_FEATURES.md) - Planned features
- [Visual Design Specs](./docs/SOCIAL_V2_VISUALS.md) - UI enhancement details

### Outdated (For Historical Reference Only)
- ~~[Migration Status](./MIGRATION_STATUS.md)~~ - Migration complete, now fully on Supabase
- ~~[Backend Deployment](./BACKEND_DEPLOYMENT.md)~~ - Old Railway deployment (deprecated)

## 🤝 Contributing

### Code Style
- TypeScript with relaxed strict mode
- Functional components with hooks
- Feature-based file organization

### Git Workflow
```bash
git add .
git commit -m "feat: description"
git push origin master
```

## 📈 Current Status

**Latest Build**: #5 (Live on TestFlight - Jan 22, 2025)
**Backend**: Supabase (Production)
**Features**: 71% complete (see BACKEND_PROGRESS.md)

### Recent Deployment History
- **Build #5** (Jan 22, 2025): All Supabase fixes, iOS safe areas, field mappings
- **Build #4** (Jan 21, 2025): Initial Supabase migration attempt
- **Build #3** (Jan 20, 2025): Last Railway backend version
- **Previous**: Railway backend (deprecated - was crashing)

## 🔮 Roadmap

### Phase 1 (Current)
- [x] Core authentication
- [x] Goals and actions
- [x] Single circle system
- [x] Following system
- [x] Basic social feed

### Phase 2 (Next)
- [ ] Multiple circles
- [ ] Circle discovery
- [ ] Advanced analytics
- [ ] Push notifications
- [ ] Media uploads

## 📞 Support

For issues or questions, check:
1. This README
2. Documentation folder
3. GitHub Issues
4. TestFlight feedback

---

Built with ❤️ using React Native and Supabase