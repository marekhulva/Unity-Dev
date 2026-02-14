import { StateCreator } from 'zustand';
import { backendService } from '../../services/backend.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../services/supabase.service';

export type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  circleId?: string;
  circleName?: string;
  followingCount?: number;
  followerCount?: number;
};

export type AuthSlice = {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isNewUser: boolean;
  hasCompletedProfileSetup: boolean;
  hasCompletedOnboarding: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  updateAvatar: (avatarUri: string) => Promise<boolean>;
  updateBio: (bio: string) => Promise<boolean>;
  completeProfileSetup: () => Promise<void>;
  completeFullOnboarding: () => Promise<void>;
};

export const createAuthSlice: StateCreator<AuthSlice> = (set, get) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
  isNewUser: false,
  hasCompletedProfileSetup: false,
  hasCompletedOnboarding: false,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await backendService.signIn(email, password);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Save to storage (only if we have valid values)
        if (token) {
          await AsyncStorage.setItem('token', token);
        }
        if (user) {
          await AsyncStorage.setItem('user', JSON.stringify(user));
        }
        
        // Check onboarding status for existing users
        const isNewUserFlag = await AsyncStorage.getItem('isNewUser');
        const hasProfileSetup = await AsyncStorage.getItem('hasCompletedProfileSetup');
        const hasOnboarding = await AsyncStorage.getItem('hasCompletedOnboarding');
        
        // Check if user has goals (indicates completed onboarding)
        let actuallyCompletedOnboarding = hasOnboarding === 'true';
        if (!actuallyCompletedOnboarding) {
          const { data: goals } = await supabase
            .from('goals')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);
          
          if (goals && goals.length > 0) {
            actuallyCompletedOnboarding = true;
            await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
          }
        }
        
        if (__DEV__) console.log('🔐 [LOGIN] User onboarding status:', { 
          isNewUser: isNewUserFlag === 'true',
          hasCompletedProfileSetup: hasProfileSetup === 'true',
          hasCompletedOnboarding: actuallyCompletedOnboarding
        });
        
        set({
          isAuthenticated: true,
          user,
          token,
          loading: false,
          error: null,
          isNewUser: isNewUserFlag === 'true',
          hasCompletedProfileSetup: hasProfileSetup === 'true',
          hasCompletedOnboarding: actuallyCompletedOnboarding
        });
        
        return true;
      } else {
        set({
          loading: false,
          error: response.error || 'Login failed'
        });
        return false;
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Login failed'
      });
      return false;
    }
  },

  register: async (email: string, password: string, name: string) => {
    if (__DEV__) console.log('🚀 [REGISTER] Starting registration for:', email);
    set({ loading: true, error: null });
    try {
      const response = await backendService.signUp(email, password, name);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        if (__DEV__) console.log('✅ [REGISTER] Registration successful for user:', user.id);
        
        // Save to storage (only if we have valid values)
        if (token) {
          await AsyncStorage.setItem('token', token);
        }
        if (user) {
          await AsyncStorage.setItem('user', JSON.stringify(user));
        }
        
        // Mark as new user who needs onboarding
        if (__DEV__) console.log('🎯 [REGISTER] Setting new user flags for onboarding');
        await AsyncStorage.setItem('isNewUser', 'true');
        await AsyncStorage.setItem('hasCompletedProfileSetup', 'false');
        await AsyncStorage.setItem('hasCompletedOnboarding', 'true'); // MVP: Skip 8-step onboarding
        
        if (__DEV__) console.log('🟢 [REGISTER] Updating store with new user state');
        set({
          isAuthenticated: true,
          user,
          token,
          loading: false,
          error: null,
          isNewUser: true,
          hasCompletedProfileSetup: false,
          hasCompletedOnboarding: true // MVP: Skip onboarding
        });
        
        if (__DEV__) console.log('🎉 [REGISTER] Registration complete - user should see profile setup');
        return true;
      } else {
        set({
          loading: false,
          error: response.error || 'Registration failed'
        });
        return false;
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Registration failed'
      });
      return false;
    }
  },

  logout: async () => {
    if (__DEV__) console.log('🚪 [LOGOUT] Starting logout process');

    await backendService.signOut();

    // CRITICAL: Clear the persisted Zustand store from AsyncStorage
    // This prevents the persistence layer from restoring user data
    await AsyncStorage.removeItem('unity-store');

    // Clear all AsyncStorage items (auth + onboarding state)
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('isNewUser');
    await AsyncStorage.removeItem('hasCompletedProfileSetup');
    await AsyncStorage.removeItem('hasCompletedOnboarding');

    // Get full state to access all clear functions
    const state = get() as any;

    // Clear ALL user-specific state from ALL slices
    // This is critical to prevent User A's data from leaking to User B
    if (__DEV__) console.log('🧹 [LOGOUT] Clearing all user-specific data');

    // Clear challenge data
    if (typeof state.clearChallengeData === 'function') {
      state.clearChallengeData();
    }

    // Clear social/feed data
    if (typeof state.clearSocialData === 'function') {
      state.clearSocialData();
    }

    // Clear goals data
    if (typeof state.clearGoalsData === 'function') {
      state.clearGoalsData();
    }

    // Clear daily actions data
    if (typeof state.clearDailyData === 'function') {
      state.clearDailyData();
    }

    // Clear circles data
    if (typeof state.clearCirclesData === 'function') {
      state.clearCirclesData();
    }

    // Clear daily review data
    if (typeof state.clearDailyReviewData === 'function') {
      state.clearDailyReviewData();
    }

    // Clear notifications data
    if (typeof state.clearNotificationsData === 'function') {
      state.clearNotificationsData();
    }

    // Clear profile data
    if (typeof state.clearProfileData === 'function') {
      state.clearProfileData();
    }

    // Finally, clear auth state
    set({
      isAuthenticated: false,
      user: null,
      token: null,
      error: null,
      isNewUser: false,
      hasCompletedProfileSetup: false,
      hasCompletedOnboarding: false
    });

    if (__DEV__) console.log('✅ [LOGOUT] Logout complete - all user data cleared');
  },

  checkAuth: async () => {
    try {
      // CRITICAL: Always use Supabase as source of truth
      // OPTIMIZATION: Parallel auth calls (save ~100ms)
      const [sessionResult, userResult] = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.getUser()
      ]);

      const { data: { session } } = sessionResult;
      const { data: { user: supabaseUser } } = userResult;
      
      if (__DEV__) console.log('🔐 [AUTH-CHECK] Checking authentication state');
      if (__DEV__) console.log('  - Supabase session exists:', !!session);
      if (__DEV__) console.log('  - Supabase user ID:', supabaseUser?.id || 'none');
      
      if (session && supabaseUser) {
        // Check if we have cached user profile
        const cachedUser = get().user;
        const hasCachedProfile = cachedUser && cachedUser.id === supabaseUser.id;

        let avatarUrl = null;
        let displayName = null;

        if (hasCachedProfile) {
          // Use cached profile - no DB query needed
          if (__DEV__) console.log('🟢 [AUTH] Using cached profile for:', supabaseUser.id);
          avatarUrl = cachedUser.avatar || null;
          displayName = cachedUser.name;
        } else {
          // Fetch profile from database
          try {
            if (__DEV__) console.log('🔵 [AUTH] Fetching profile from database for user:', supabaseUser.id);
            const { data: profile } = await supabase
              .from('profiles')
              .select('avatar_url, name')
              .eq('id', supabaseUser.id)
              .single();

            if (profile) {
              avatarUrl = profile.avatar_url;
              displayName = profile.name;
              if (__DEV__) console.log('🔵 [AUTH] Profile found:', {
                hasAvatar: !!avatarUrl,
                avatarType: avatarUrl?.startsWith('http') ? 'HTTP URL' : avatarUrl?.startsWith('data:') ? 'BASE64' : 'NONE',
                displayName: profile.name
              });
            } else {
              if (__DEV__) console.log('🟡 [AUTH] No profile found in database');
            }
          } catch (error) {
            if (__DEV__) console.log('🔴 [AUTH] Error loading profile:', error);
          }
        }
        
        // Build user object from Supabase data
        const user = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: displayName || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
          avatar: avatarUrl || undefined
        };
        
        // Update AsyncStorage to match Supabase
        await AsyncStorage.setItem('token', session.access_token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        
        // Check onboarding status
        const isNewUser = await AsyncStorage.getItem('isNewUser');
        const hasCompletedProfileSetup = await AsyncStorage.getItem('hasCompletedProfileSetup');
        const hasCompletedOnboarding = await AsyncStorage.getItem('hasCompletedOnboarding');
        
        // Check if user has goals to determine if they completed onboarding
        let actuallyCompletedOnboarding = hasCompletedOnboarding === 'true';
        if (!actuallyCompletedOnboarding) {
          const { data: goals } = await supabase
            .from('goals')
            .select('id')
            .eq('user_id', supabaseUser.id)
            .limit(1);
          
          if (goals && goals.length > 0) {
            actuallyCompletedOnboarding = true;
            await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
          }
        }
        
        if (__DEV__) console.log('  - Setting app user to Supabase user:', user.id, 'with avatar:', user.avatar ? 'yes' : 'no');
        if (__DEV__) console.log('  - Onboarding status:', { isNewUser, hasCompletedProfileSetup, hasCompletedOnboarding: actuallyCompletedOnboarding });
        
        set({
          isAuthenticated: true,
          user,
          token: session.access_token,
          isNewUser: isNewUser === 'true',
          hasCompletedProfileSetup: hasCompletedProfileSetup === 'true' || !!avatarUrl,
          hasCompletedOnboarding: actuallyCompletedOnboarding
        });
      } else {
        // No valid Supabase session - clear any stale cached data
        if (__DEV__) console.log('  - No valid Supabase session, clearing cached credentials');

        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');

        set({
          isAuthenticated: false,
          user: null,
          token: null
        });
      }
    } catch (error) {
      if (__DEV__) console.error('Auth check failed:', error);
    }
  },

  clearError: () => set({ error: null }),
  
  updateAvatar: async (avatarUri: string) => {
    try {
      const currentUser = get().user;
      if (!currentUser) return false;
      
      if (__DEV__) console.log('🔵 [AUTH] Updating avatar for user:', currentUser.id);
      
      // Update backend first
      const response = await backendService.updateProfile({ avatar: avatarUri });
      
      if (response.success && response.data) {
        // Use the avatar_url from backend response
        const avatarUrl = response.data.avatar_url || avatarUri;
        
        // Update local state with the URL from backend
        const updatedUser = { ...currentUser, avatar: avatarUrl };
        set({ user: updatedUser });
        
        // Save to AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        
        if (__DEV__) console.log('🟢 [AUTH] Avatar updated successfully');
        return true;
      } else {
        if (__DEV__) console.error('🔴 [AUTH] Failed to update avatar:', response.error || 'No response data');
        return false;
      }
    } catch (error) {
      if (__DEV__) console.error('🔴 [AUTH] Exception updating avatar:', error);
      return false;
    }
  },

  updateBio: async (bio: string) => {
    try {
      const currentUser = get().user;
      if (!currentUser) return false;
      
      if (__DEV__) console.log('🔵 [AUTH] Updating bio for user:', currentUser.id);
      
      // Update backend
      const response = await backendService.updateProfile({ bio });
      
      if (response.success) {
        if (__DEV__) console.log('🟢 [AUTH] Bio updated successfully');
        // No need to update local state for bio as it's managed by ProfileV2
        return true;
      } else {
        if (__DEV__) console.error('🔴 [AUTH] Failed to update bio:', response.error);
        return false;
      }
    } catch (error) {
      if (__DEV__) console.error('🔴 [AUTH] Exception updating bio:', error);
      return false;
    }
  },

  completeProfileSetup: async () => {
    try {
      await AsyncStorage.setItem('hasCompletedProfileSetup', 'true');
      set({ hasCompletedProfileSetup: true });
      if (__DEV__) console.log('✅ [AUTH] Profile setup marked as complete');
    } catch (error) {
      if (__DEV__) console.error('🔴 [AUTH] Error marking profile setup complete:', error);
    }
  },

  completeFullOnboarding: async () => {
    try {
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      await AsyncStorage.setItem('isNewUser', 'false');
      set({ 
        hasCompletedOnboarding: true,
        isNewUser: false 
      });
      if (__DEV__) console.log('✅ [AUTH] Full onboarding marked as complete');
    } catch (error) {
      if (__DEV__) console.error('🔴 [AUTH] Error marking onboarding complete:', error);
    }
  }
});