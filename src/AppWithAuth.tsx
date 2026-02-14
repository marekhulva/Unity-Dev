import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { CheckCircle2, House, Trophy, User2, Users } from 'lucide-react-native';

import { useStore } from './state/rootStore';
import { inspector } from './utils/componentInspector';
import { rescheduleAll, addNotificationResponseListener } from './services/notification.local';
import { PushNotificationsService } from './services/pushNotifications.service';
import { LoginScreen } from './features/auth/LoginScreen';
import { DailyScreenOption2 as DailyScreen } from './features/daily/DailyScreenOption2';
import { SocialScreenUnified as SocialScreen } from './features/social/SocialScreenUnified';
import { ChallengesScreenVision as ChallengesScreen } from './features/challenges/ChallengesScreenVision';
import { ProfileScreen } from './features/profile/ProfileScreenVision';
import { CircleScreenVision as CircleScreen } from './features/circle/CircleScreenVision';
import { OnboardingFlow } from './features/onboarding/OnboardingFlow';
import { ProfileSetupScreen } from './features/onboarding/ProfileSetupScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DebugPanel } from './components/DebugPanel';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Wrapper component to handle navigation params for Profile
function ProfileScreenWrapper({ route, navigation }: any) {
  const [currentUserId, setCurrentUserId] = React.useState(route?.params?.userId);
  const source = route?.params?.source || 'Circle'; // Default to Circle if not specified
  
  // Listen for tab focus to reset to own profile when Profile tab is pressed
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      // When Profile tab is pressed directly, clear the userId to show own profile
      setCurrentUserId(undefined);
      // Also clear the params to prevent persistence
      navigation.setParams({ userId: undefined, source: undefined });
    });
    
    return unsubscribe;
  }, [navigation]);
  
  // Update userId when navigating from another screen (like Circle)
  React.useEffect(() => {
    if (route?.params?.userId !== undefined) {
      setCurrentUserId(route.params.userId);
    }
  }, [route?.params?.userId]);
  
  return <ProfileScreen key={currentUserId || 'own'} userId={currentUserId} source={source} navigation={navigation} />;
}

function MainTabs() {
  const { fetchGoals, fetchDailyActions, fetchFeeds } = useStore();
  
  // Fetch data when tabs mount - but check if we already have data
  useEffect(() => {
    const loadAllData = async () => {
      if (__DEV__) console.time('⚡ Data loaded in');
      if (__DEV__) console.log('🟦 [MAIN] MainTabs mounted, checking if data needs loading...');

      // Check if we already have data (from AppWithAuth initial load)
      const currentGoals = useStore.getState().goals;
      const currentActions = useStore.getState().actions;

      if (currentGoals.length > 0 || currentActions.length > 0) {
        if (__DEV__) console.log('🟢 [MAIN] Data already loaded - Goals:', currentGoals.length, 'Actions:', currentActions.length);
      } else {
        if (__DEV__) console.log('🟦 [MAIN] No data found, fetching now...');
        if (__DEV__) console.log('🚀 Starting optimized data load...');

        // Load critical data first (goals and actions), then feeds in background
        await Promise.all([
          fetchGoals(),
          fetchDailyActions()
        ]);

        // Load feeds in background (non-blocking)
        fetchFeeds().catch(err => {
          if (__DEV__) {
            console.error('Feed load error:', err);
          }
        });
      }

      if (__DEV__) console.timeEnd('⚡ Data loaded in');
      if (__DEV__) console.log('✅ Initial load complete!');
    };

    loadAllData();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        detachInactiveScreens: false, // Keep all tabs mounted for instant switching
        tabBarBackground: () => (
          <BlurView intensity={80} tint="dark" style={{ flex: 1 }}>
            <LinearGradient
              colors={['rgba(255,215,0,0.1)', 'rgba(192,192,192,0.05)', 'rgba(255,215,0,0.1)']}
              style={{ flex: 1 }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </BlurView>
        ),
        tabBarStyle: { 
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 85, // Increased for better spacing
          paddingBottom: 10, // More padding
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen name="Social" component={SocialScreen}
        options={{ 
          tabBarIcon: ({color,size,focused}) => (
            <View style={{
              padding: 8,
              borderRadius: 16,
              backgroundColor: focused ? 'rgba(192,192,192,0.15)' : 'transparent',
            }}>
              <House color={focused ? '#C0C0C0' : color} size={size}/>
            </View>
          )
        }} />
      <Tab.Screen name="Daily" component={DailyScreen}
        options={{ 
          tabBarIcon: ({color,size,focused}) => (
            <View style={{
              padding: 8,
              borderRadius: 16,
              backgroundColor: focused ? 'rgba(255,215,0,0.15)' : 'transparent',
            }}>
              <CheckCircle2 color={focused ? '#FFD700' : color} size={size}/>
            </View>
          )
        }} />
      <Tab.Screen name="Circle" component={CircleScreen}
        options={{ 
          tabBarIcon: ({color,size,focused}) => (
            <View style={{
              padding: 8,
              borderRadius: 16,
              backgroundColor: focused ? 'rgba(255,215,0,0.15)' : 'transparent',
            }}>
              <Users color={focused ? '#FFD700' : color} size={size}/>
            </View>
          )
        }} />
      <Tab.Screen name="Challenges" component={ChallengesScreen}
        options={{
          tabBarIcon: ({color,size,focused}) => (
            <View style={{
              padding: 8,
              borderRadius: 16,
              backgroundColor: focused ? 'rgba(255,215,0,0.15)' : 'transparent',
            }}>
              <Trophy color={focused ? '#FFD700' : color} size={size}/>
            </View>
          )
        }} />
      <Tab.Screen name="Profile" component={ProfileScreenWrapper}
        options={{ 
          tabBarIcon: ({color,size,focused}) => (
            <View style={{
              padding: 8,
              borderRadius: 16,
              backgroundColor: focused ? 'rgba(255,215,0,0.15)' : 'transparent',
            }}>
              <User2 color={focused ? '#FFD700' : color} size={size}/>
            </View>
          )
        }} />
    </Tab.Navigator>
  );
}

// Main Stack with Tabs and User Profile Screen
function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="UserProfile"
        component={ProfileScreen}
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
}

export function AppWithAuth() {
  const { 
    isAuthenticated, 
    checkAuth, 
    isOnboardingOpen, 
    closeOnboarding, 
    fetchGoals, 
    fetchDailyActions, 
    user,
    isNewUser,
    hasCompletedProfileSetup,
    hasCompletedOnboarding,
    completeProfileSetup,
    completeFullOnboarding
  } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const notifListenerRef = useRef<ReturnType<typeof addNotificationResponseListener> | null>(null);
  
  // Watch for new user registration
  useEffect(() => {
    if (__DEV__) console.log('🎯 [ONBOARDING-WATCHER] Auth state changed:', {
      isAuthenticated,
      isNewUser,
      hasCompletedProfileSetup,
      hasCompletedOnboarding,
      userId: user?.id
    });
    
    if (isAuthenticated && isNewUser && !hasCompletedProfileSetup) {
      if (__DEV__) console.log('🟢 [ONBOARDING-WATCHER] New user detected! Showing profile setup');
      setShowProfileSetup(true);
    } else if (isAuthenticated && isNewUser && !hasCompletedOnboarding) {
      if (__DEV__) console.log('🟢 [ONBOARDING-WATCHER] New user needs onboarding');
      setShowOnboarding(true);
    }
  }, [isAuthenticated, isNewUser, hasCompletedProfileSetup, hasCompletedOnboarding, user]);

  useEffect(() => {
    const initAuth = async () => {
      if (__DEV__) console.log('🔐 [INIT] Checking authentication on app start...');
      await checkAuth()
      const currentUser = useStore.getState().user;
      const isNew = useStore.getState().isNewUser;
      const hasProfile = useStore.getState().hasCompletedProfileSetup;
      const hasOnboarded = useStore.getState().hasCompletedOnboarding;
      
      if (__DEV__) console.log('🔐 [INIT] User after auth check:', currentUser?.id, currentUser?.email);
      if (__DEV__) console.log('🔐 [INIT] User status:', { isNew, hasProfile, hasOnboarded });
      
      // CRITICAL: If user is authenticated, fetch their data immediately
      if (currentUser && currentUser.id) {
        if (__DEV__) console.log('🎯 [ONBOARDING-CHECK] User status check:', {
          userId: currentUser.id,
          isNewUser: isNew,
          hasCompletedProfileSetup: hasProfile,
          hasCompletedOnboarding: hasOnboarded
        });

        PushNotificationsService.registerForPushNotifications().then(result => {
          if (result.success) {
            if (__DEV__) console.log('✅ [PUSH] Device registered for push notifications');
          } else {
            if (__DEV__) console.log('⚠️  [PUSH] Failed to register:', result.error);
          }
        });
        
        // Determine what screens to show based on user status
        if (isNew && !hasProfile) {
          if (__DEV__) console.log('🟡 [INIT] New user needs profile setup');
          setShowProfileSetup(true);
        } else if (isNew && !hasOnboarded) {
          if (__DEV__) console.log('🟡 [INIT] New user needs onboarding');
          setShowOnboarding(true);
        } else {
          // Check if we have cached data
          const cachedGoals = useStore.getState().goals;
          const cachedActions = useStore.getState().actions;
          const hasCachedData = cachedGoals.length > 0 || cachedActions.length > 0;

          if (hasCachedData) {
            // Show UI immediately with cached data
            if (__DEV__) console.log('🟢 [INIT] Using cached data - Goals:', cachedGoals.length, 'Actions:', cachedActions.length);
            setIsLoading(false);

            // Fetch fresh data in background
            if (__DEV__) console.log('🔄 [INIT] Refreshing data in background...');
            Promise.all([
              fetchGoals(),
              fetchDailyActions()
            ]).then(() => {
              if (__DEV__) console.log('✅ [INIT] Background refresh complete');
            });
          } else {
            // OPTIMIZATION: Show UI immediately even without cache
            if (__DEV__) console.log('🔐 [INIT] No cached data, showing UI and fetching in background...');
            setIsLoading(false); // ← MOVED UP - Show UI immediately

            // Fetch data in background (non-blocking)
            Promise.all([
              fetchGoals(),
              fetchDailyActions()
            ]).then(() => {
              const goals = useStore.getState().goals;
              const actions = useStore.getState().actions;
              if (__DEV__) console.log('✅ [INIT] Background fetch complete - Goals:', goals.length, 'Actions:', actions.length);
            }).catch(err => {
              if (__DEV__) console.error('🔴 [INIT] Background fetch error:', err);
            });
          }
        }
      } else {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    const setupNotifications = async () => {
      const actions = useStore.getState().actions;
      if (__DEV__) console.log(`🔔 [NOTIF] Scheduling notifications for ${actions.length} actions`);
      await rescheduleAll(actions);
    };

    setupNotifications();

    notifListenerRef.current = addNotificationResponseListener(() => {
      if (__DEV__) console.log('🔔 [NOTIF] User tapped notification');
    });

    return () => {
      notifListenerRef.current?.remove();
    };
  }, [isAuthenticated, isLoading]);

  const actionCount = useStore(s => s.actions.length);
  useEffect(() => {
    if (!isAuthenticated || actionCount === 0) return;
    const actions = useStore.getState().actions;
    if (__DEV__) console.log(`🔔 [NOTIF] Actions changed (${actionCount}), rescheduling notifications`);
    rescheduleAll(actions);
  }, [isAuthenticated, actionCount]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            <Stack.Screen name="Main" component={MainStack} />
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
      
      {/* Profile Setup Overlay for new users */}
      {showProfileSetup && isAuthenticated && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#000',
          zIndex: 9998,
        }}>
          <ErrorBoundary>
            <ProfileSetupScreen onComplete={async () => {
              if (__DEV__) console.log('🎉 [MAIN] Profile setup completed!');
              await completeProfileSetup();
              setShowProfileSetup(false);
              
              // Now show onboarding
              if (!hasCompletedOnboarding) {
                if (__DEV__) console.log('🟦 [MAIN] Moving to onboarding...');
                setShowOnboarding(true);
              }
            }} />
          </ErrorBoundary>
        </View>
      )}
      
      {/* Onboarding Overlay - using absolute positioning instead of Modal */}
      {(isOnboardingOpen || showOnboarding) && !showProfileSetup && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#000',
          zIndex: 9999,
        }}>
          <ErrorBoundary>
            <OnboardingFlow onComplete={async () => {
              if (__DEV__) console.log('🎉 [MAIN] Onboarding completed! Refreshing data...');
              closeOnboarding();
              setShowOnboarding(false);
              
              // Mark onboarding as complete for new users
              if (isNewUser) {
                await completeFullOnboarding();
              }
              // Refresh data after onboarding completes
              setTimeout(async () => {
                if (__DEV__) console.log('🟦 [MAIN] Fetching updated goals and actions...');
                
                // CRITICAL: Re-check auth to ensure we have the right user
                if (__DEV__) console.log('🔐 [MAIN] Re-checking authentication before data fetch...');
                await checkAuth();
                
                // Log current user
                const currentUser = useStore.getState().user;
                if (__DEV__) console.log('🔐 [MAIN] Current user after auth check:', currentUser?.id, currentUser?.email);
                
                // Log current state before fetching
                const currentGoals = useStore.getState().goals;
                const currentActions = useStore.getState().actions;
                if (__DEV__) console.log('🟦 [MAIN] Current goals before refresh:', currentGoals.map(g => g.title));
                if (__DEV__) console.log('🟦 [MAIN] Current actions before refresh:', currentActions.map(a => a.title));
                
                // Fetch updated data
                await Promise.all([
                  fetchGoals(),
                  fetchDailyActions()
                ]);
                
                // Log state after fetching
                const newGoals = useStore.getState().goals;
                const newActions = useStore.getState().actions;
                if (__DEV__) console.log('🟢 [MAIN] Goals after refresh:', newGoals.map(g => g.title));
                if (__DEV__) console.log('🟢 [MAIN] Actions after refresh:', newActions.map(a => a.title));
              }, 500);
            }} />
          </ErrorBoundary>
        </View>
      )}
      
      {/* Debug Panel - Shows in development */}
      {__DEV__ && <DebugPanel />}
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
  },
});