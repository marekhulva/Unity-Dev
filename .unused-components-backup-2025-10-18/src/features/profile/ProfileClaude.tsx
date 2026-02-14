import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStore } from '../../state/rootStore';
import * as Haptics from 'expo-haptics';
import {
  LogOut, Check, X, Edit3, Camera, ChevronLeft
} from 'lucide-react-native';
import { supabaseService } from '../../services/supabase.service';
// import { ResetOnboardingButton } from '../../components/ResetOnboardingButton';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

// Goal Item Component with hover states
const GoalItem = ({ name, progress, percentage }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Pressable
      style={[styles.goalItem, isHovered && styles.goalItemHover]}
      onHoverIn={() => Platform.OS === 'web' && setIsHovered(true)}
      onHoverOut={() => Platform.OS === 'web' && setIsHovered(false)}
      onPress={() => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }}
    >
      <View style={styles.goalInfo}>
        <Text style={styles.goalName}>{name}</Text>
        <Text style={styles.goalProgress}>{progress}</Text>
      </View>
      <View style={styles.goalBadge}>
        <LinearGradient
          colors={['rgba(255,215,0,0.1)', 'rgba(255,215,0,0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.goalBadgeText}>{percentage}%</Text>
      </View>
    </Pressable>
  );
};

// Highlight Card Component for Milestones section
const HighlightCard = ({ icon, value, label }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Pressable
      style={[
        styles.highlightCard,
        isHovered && styles.highlightCardHover
      ]}
      onHoverIn={() => Platform.OS === 'web' && setIsHovered(true)}
      onHoverOut={() => Platform.OS === 'web' && setIsHovered(false)}
      onPress={() => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }}
    >
      <Text style={styles.highlightIcon}>{icon}</Text>
      <Text style={styles.highlightValue}>{value}</Text>
      <Text style={styles.highlightLabel}>{label}</Text>
    </Pressable>
  );
};

// Timeline Item Component for Recent Activity
const TimelineItem = ({ text, time, isLast = false }) => {
  return (
    <View style={[
      styles.timelineItem,
      isLast && styles.timelineItemLast
    ]}>
      <View style={styles.timelineDot} />
      <View style={styles.timelineContent}>
        <Text style={styles.timelineText}>{text}</Text>
        <Text style={styles.timelineTime}>{time}</Text>
      </View>
    </View>
  );
};

// Achievement Item Component with gold variants
const AchievementItem = ({ title, time, points, isGold = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Pressable
      style={[
        styles.achievementItem,
        isHovered && styles.achievementItemHover
      ]}
      onHoverIn={() => Platform.OS === 'web' && setIsHovered(true)}
      onHoverOut={() => Platform.OS === 'web' && setIsHovered(false)}
      onPress={() => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }}
    >
      {/* Gold background gradient for special items */}
      {isGold && (
        <LinearGradient
          colors={['rgba(255,215,0,0.08)', 'rgba(255,215,0,0.02)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 10 }]}
        />
      )}
      <View style={[styles.achievementCheck, isGold && { borderColor: 'rgba(255, 215, 0, 0.3)' }]}>
        <LinearGradient
          colors={['#ffd700', '#ffaa00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.achievementCheckText}>✓</Text>
      </View>
      <View style={styles.achievementContent}>
        <Text style={styles.achievementTitle}>{title}</Text>
        <Text style={styles.achievementTime}>{time}</Text>
      </View>
      <Text style={styles.achievementPoints}>+{points}</Text>
    </Pressable>
  );
};

interface ProfileClaudeProps {
  userId?: string; // Optional userId to view another user's profile
  source?: string; // Where we navigated from
  navigation?: any; // Navigation prop passed from wrapper
  isInModal?: boolean; // Whether profile is displayed in a modal (modal has its own close button)
}

export const ProfileClaude: React.FC<ProfileClaudeProps> = ({ userId, source = 'Circle', navigation: navProp, isInModal = false }) => {
  console.log('>>> USING ProfileClaude COMPONENT <<<', userId ? `Viewing user: ${userId}` : 'Viewing own profile');
  const insets = useSafeAreaInsets();
  const navigation = navProp || useNavigation();
  const route = useRoute();
  
  // Check if we're being used as UserProfile screen (from stack) or Profile tab
  const routeParams = route?.params as any;
  const actualUserId = routeParams?.userId || userId;
  const actualSource = routeParams?.source || source;
  const currentUser = useStore(s => s.user);
  const storeGoals = useStore(s => s.goals);
  const actions = useStore(s => s.actions);  // Added this line
  const completedActions = useStore(s => s.completedActions);
  const fetchDailyActions = useStore(s => s.fetchDailyActions);
  const logout = useStore(s => s.logout);
  const updateBio = useStore(s => s.updateBio);
  const updateAvatar = useStore(s => s.updateAvatar);
  
  // Determine if viewing own profile or someone else's
  const isOwnProfile = !actualUserId || actualUserId === currentUser?.id;
  const profileUserId = actualUserId || currentUser?.id;
  
  console.log('🔵 [ProfileClaude] Profile detection:', {
    actualUserId,
    'currentUser?.id': currentUser?.id,
    isOwnProfile,
    'actualUserId === currentUser?.id': actualUserId === currentUser?.id,
    '!actualUserId': !actualUserId
  });
  
  // State for profile data
  const [profileData, setProfileData] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>(isOwnProfile ? storeGoals : []);
  
  console.log('🏁 [DEBUG] Initial goals state:', {
    isOwnProfile,
    storeGoalsCount: storeGoals?.length || 0,
    initialGoalsCount: (isOwnProfile ? storeGoals : []).length,
    storeGoals: storeGoals?.map(g => ({
      id: g.id,
      title: g.title,
      active: g.active,
      completed: g.completed
    }))
  });
  const [bio, setBio] = useState('Building my best self, one day at a time ✨');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!isOwnProfile);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [goalCompletionStats, setGoalCompletionStats] = useState<Record<string, any>>({});
  const [profileActions, setProfileActions] = useState<any[]>(isOwnProfile ? actions : []); // Actions for the viewed profile
  const [profileCompletedActions, setProfileCompletedActions] = useState<any[]>(isOwnProfile ? completedActions : []); // Completed actions for the viewed profile
  
  // State for Highlights & Milestones
  const [currentStreak, setCurrentStreak] = useState(0);
  const [perfectDays, setPerfectDays] = useState(0);
  const [goalsCompleted, setGoalsCompleted] = useState(0);
  const [thisWeekPercentage, setThisWeekPercentage] = useState(0);
  const [monthlyChange, setMonthlyChange] = useState('+0%');
  const [userStatus, setUserStatus] = useState('Starter');

  // Load profile data from database on mount
  useEffect(() => {
    const loadProfileData = async () => {
      if (!profileUserId) return;
      
      try {
        setIsLoading(true);
        const { supabase } = await import('../../services/supabase.service');
        
        // Get profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('bio, avatar_url, name, email')
          .eq('id', profileUserId)
          .single();
        
        if (profile) {
          setProfileData(profile);
          setBio(profile.bio || 'Building my best self, one day at a time ✨');
          setProfileImage(profile.avatar_url || null);
        }
        
        // If viewing someone else's profile, fetch their goals and actions
        if (!isOwnProfile) {
          const { data: userGoals } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', profileUserId)
            .in('visibility', ['public', 'circle']); // Respect privacy settings
          
          console.log('📚 [DEBUG] Setting goals for other user:', {
            userId: profileUserId,
            goalsCount: userGoals?.length || 0,
            goals: userGoals?.map(g => ({
              id: g.id,
              title: g.title,
              active: g.active,
              completed: g.completed
            }))
          });
          setGoals(userGoals || []);
          
          // Fetch user's actions
          const { data: userActions } = await supabase
            .from('actions')
            .select('*')
            .eq('user_id', profileUserId);
          
          console.log('🔥 [DEBUG] Fetched actions for user:', {
            userId: profileUserId,
            actionsCount: userActions?.length || 0,
            actions: userActions?.map(a => ({
              id: a.id,
              title: a.title,
              goalId: a.goal_id,
              completed_at: a.completed_at,
              created_at: a.created_at
            }))
          });
          
          setProfileActions(userActions || []);
          
          // Fetch today's completed actions for this user
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const completedToday = (userActions || []).filter(action => {
            if (action.completed_at) {
              const completedDate = new Date(action.completed_at);
              return completedDate >= today && completedDate < tomorrow;
            }
            return false;
          });
          
          setProfileCompletedActions(completedToday);
        }
      } catch (error) {
        console.log('🟡 [PROFILE] Could not load profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isOwnProfile) {
      // Use current user data
      setBio(currentUser?.bio || 'Building my best self, one day at a time ✨');
      setProfileImage(currentUser?.avatar || null);
      
      // IMPORTANT: Fetch actions from database even for own profile to get all fields
      const fetchOwnActions = async () => {
        try {
          const { supabase } = await import('../../services/supabase.service');
          const { data: dbActions } = await supabase
            .from('actions')
            .select('*')
            .eq('user_id', profileUserId);
          
          console.log('🏠 [DEBUG] Own profile - fetched actions from DB:', {
            actionsCount: dbActions?.length || 0,
            firstAction: dbActions?.[0],
            actions: dbActions?.slice(0, 2).map(a => ({
              id: a.id,
              title: a.title,
              goal_id: a.goal_id,
              completed_at: a.completed_at,
              created_at: a.created_at
            }))
          });
          
          if (dbActions) {
            setProfileActions(dbActions);
            
            // Get today's completed actions
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const completedToday = dbActions.filter(action => {
              if (action.completed_at) {
                const completedDate = new Date(action.completed_at);
                return completedDate >= today && completedDate < tomorrow;
              }
              return false;
            });
            
            setProfileCompletedActions(completedToday);
          }
        } catch (error) {
          console.error('Error fetching own actions:', error);
          // Fallback to store actions if DB fetch fails
          setProfileActions(actions);
          setProfileCompletedActions(completedActions);
        }
      };
      
      fetchOwnActions();
      fetchDailyActions(); // Still fetch daily actions for other parts of the UI
    } else {
      // Load other user's data
      loadProfileData();
    }
  }, [profileUserId, isOwnProfile, currentUser]);

  // Update profile actions when store actions change (for own profile)
  // DISABLED: Now we fetch from DB directly to get all fields
  // useEffect(() => {
  //   if (isOwnProfile) {
  //     setProfileActions(actions);
  //     setProfileCompletedActions(completedActions);
  //   }
  // }, [actions, completedActions, isOwnProfile]);

  // Fetch recent activities
  useEffect(() => {
    const fetchRecentActivities = async () => {
      if (!profileUserId) return;
      
      try {
        const { supabase } = await import('../../services/supabase.service');
        const activities = [];
        
        // Get recent completed actions (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const { data: completedActions } = await supabase
          .from('completed_actions')
          .select('*, actions(title)')
          .eq('user_id', profileUserId)
          .gte('completed_at', weekAgo.toISOString())
          .order('completed_at', { ascending: false })
          .limit(10);
        
        if (completedActions) {
          completedActions.forEach(action => {
            activities.push({
              type: 'action',
              text: `✅ Completed ${action.actions?.title || 'daily action'}`,
              timestamp: action.completed_at,
              icon: '✅'
            });
          });
        }
        
        // Get recent posts (celebrations, milestones)
        const { data: posts } = await supabase
          .from('posts')
          .select('type, content, created_at')
          .eq('user_id', profileUserId)
          .in('type', ['celebration', 'milestone', 'activity'])
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (posts) {
          posts.forEach(post => {
            if (post.type === 'celebration') {
              activities.push({
                type: 'celebration',
                text: '🎉 100% daily completion!',
                timestamp: post.created_at,
                icon: '🎉'
              });
            } else if (post.type === 'milestone') {
              activities.push({
                type: 'milestone',
                text: post.content || '🏆 Reached a milestone',
                timestamp: post.created_at,
                icon: '🏆'
              });
            }
          });
        }
        
        // Get challenge completions
        const { data: challengeCompletions } = await supabase
          .from('challenge_completions')
          .select('*, challenge_activities(display_name), challenges(name)')
          .eq('user_id', profileUserId)
          .gte('completed_at', weekAgo.toISOString())
          .order('completed_at', { ascending: false })
          .limit(5);
        
        if (challengeCompletions) {
          challengeCompletions.forEach(completion => {
            activities.push({
              type: 'challenge',
              text: `🏆 ${completion.challenge_activities?.display_name || 'Challenge activity'} - ${completion.challenges?.name || ''}`,
              timestamp: completion.completed_at,
              icon: '🏆'
            });
          });
        }
        
        // Sort all activities by timestamp and take top 5
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const topActivities = activities.slice(0, 5);
        
        // Format timestamps
        const formattedActivities = topActivities.map(activity => {
          const time = formatRelativeTime(activity.timestamp);
          return {
            text: activity.text,
            time: time
          };
        });
        
        setRecentActivities(formattedActivities);
      } catch (error) {
        console.log('Could not fetch recent activities:', error);
        // Fall back to mock data on error
        setRecentActivities([
          { text: "Completed morning routine", time: "2 hours ago" },
          { text: "Reached weekly goal", time: "Yesterday" },
          { text: "7-day streak milestone", time: "2 days ago" },
        ]);
      }
    };
    
    fetchRecentActivities();
  }, [profileUserId]);
  
  // Calculate Highlights & Milestones statistics
  useEffect(() => {
    const calculateMilestones = async () => {
      if (!profileUserId) return;
      
      try {
        const { supabase } = await import('../../services/supabase.service');
        
        // 1. Calculate Current Streak
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get all actions for this user
        const { data: userActions } = await supabase
          .from('actions')
          .select('*')
          .eq('user_id', profileUserId);
        
        if (userActions && userActions.length > 0) {
          // Check consecutive days backwards from today
          for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            
            // Check if all actions were completed on this day
            const dayCompleted = userActions.every(action => {
              if (!action.completed_at) return false;
              const completedDate = new Date(action.completed_at);
              return completedDate.getDate() === checkDate.getDate() &&
                     completedDate.getMonth() === checkDate.getMonth() &&
                     completedDate.getFullYear() === checkDate.getFullYear();
            });
            
            if (dayCompleted) {
              streak++;
            } else if (i > 0) { // Don't break on today if not completed yet
              break;
            }
          }
        }
        setCurrentStreak(streak);
        
        // 2. Calculate Perfect Days (100% completion in last 30 days)
        let perfectDaysCount = 0;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        if (userActions && userActions.length > 0) {
          for (let i = 0; i < 30; i++) {
            const checkDate = new Date();
            checkDate.setDate(checkDate.getDate() - i);
            
            const allCompleted = userActions.every(action => {
              if (!action.completed_at) return false;
              const completedDate = new Date(action.completed_at);
              return completedDate.getDate() === checkDate.getDate() &&
                     completedDate.getMonth() === checkDate.getMonth() &&
                     completedDate.getFullYear() === checkDate.getFullYear();
            });
            
            if (allCompleted) perfectDaysCount++;
          }
        }
        setPerfectDays(perfectDaysCount);
        
        // 3. Count completed goals
        const { data: completedGoals } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', profileUserId)
          .eq('completed', true);
        
        setGoalsCompleted(completedGoals?.length || 0);
        
        // 4. Calculate this week's percentage
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        let weekDaysCompleted = 0;
        let weekDaysTotal = 0;
        
        if (userActions && userActions.length > 0) {
          for (let i = 0; i < 7; i++) {
            const checkDate = new Date(weekStart);
            checkDate.setDate(checkDate.getDate() + i);
            
            // Only count days up to today
            if (checkDate <= today) {
              weekDaysTotal++;
              
              const dayCompleted = userActions.every(action => {
                if (!action.completed_at) return false;
                const completedDate = new Date(action.completed_at);
                return completedDate.getDate() === checkDate.getDate() &&
                       completedDate.getMonth() === checkDate.getMonth() &&
                       completedDate.getFullYear() === checkDate.getFullYear();
              });
              
              if (dayCompleted) weekDaysCompleted++;
            }
          }
        }
        
        const weekPercentage = weekDaysTotal > 0 
          ? Math.round((weekDaysCompleted / weekDaysTotal) * 100)
          : 0;
        setThisWeekPercentage(weekPercentage);
        
        // 5. Calculate vs last month
        const lastMonthStart = new Date();
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        lastMonthStart.setDate(1);
        const lastMonthEnd = new Date(lastMonthStart);
        lastMonthEnd.setMonth(lastMonthEnd.getMonth() + 1);
        lastMonthEnd.setDate(0);
        
        let lastMonthCompleted = 0;
        let thisMonthCompleted = 0;
        
        if (userActions && userActions.length > 0) {
          // Count this month
          for (let i = 1; i <= today.getDate(); i++) {
            const checkDate = new Date(today.getFullYear(), today.getMonth(), i);
            
            const dayCompleted = userActions.every(action => {
              if (!action.completed_at) return false;
              const completedDate = new Date(action.completed_at);
              return completedDate.getDate() === checkDate.getDate() &&
                     completedDate.getMonth() === checkDate.getMonth() &&
                     completedDate.getFullYear() === checkDate.getFullYear();
            });
            
            if (dayCompleted) thisMonthCompleted++;
          }
          
          // Count last month (same number of days as elapsed this month)
          const daysToCheck = Math.min(today.getDate(), lastMonthEnd.getDate());
          for (let i = 1; i <= daysToCheck; i++) {
            const checkDate = new Date(lastMonthStart.getFullYear(), lastMonthStart.getMonth(), i);
            
            const dayCompleted = userActions.every(action => {
              if (!action.completed_at) return false;
              const completedDate = new Date(action.completed_at);
              return completedDate.getDate() === checkDate.getDate() &&
                     completedDate.getMonth() === checkDate.getMonth() &&
                     completedDate.getFullYear() === checkDate.getFullYear();
            });
            
            if (dayCompleted) lastMonthCompleted++;
          }
        }
        
        const monthlyDiff = lastMonthCompleted > 0 
          ? Math.round(((thisMonthCompleted - lastMonthCompleted) / lastMonthCompleted) * 100)
          : thisMonthCompleted > 0 ? 100 : 0;
        setMonthlyChange(monthlyDiff >= 0 ? `+${monthlyDiff}%` : `${monthlyDiff}%`);
        
        // 6. Determine user status based on streak
        let status = 'Starter';
        if (streak >= 100) status = 'Elite';
        else if (streak >= 50) status = 'Champion';
        else if (streak >= 30) status = 'Dedicated';
        else if (streak >= 7) status = 'Active';
        setUserStatus(status);
        
      } catch (error) {
        console.error('Error calculating milestones:', error);
      }
    };
    
    calculateMilestones();
  }, [profileUserId, profileActions]); // Re-calculate when profileActions change
  
  // Helper function to format relative time
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return then.toLocaleDateString();
    }
  };

  // Handle profile photo
  const handleProfilePhoto = async () => {
    if (!isOwnProfile) return; // Only allow on own profile
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true, // Request base64 on mobile
    });

    if (!result.canceled && result.assets[0]) {
      // On mobile, convert to base64 data URI for persistence
      // On web, use the URI directly
      let photoUrl = result.assets[0].uri;
      
      if (Platform.OS !== 'web' && result.assets[0].base64) {
        // Convert to data URI for mobile
        photoUrl = `data:image/jpeg;base64,${result.assets[0].base64}`;
      }
      
      setProfileImage(photoUrl);
      
      const success = await updateAvatar(photoUrl);
      if (!success) {
        Alert.alert('Error', 'Failed to update profile photo');
        setProfileImage(currentUser?.avatar || null);
      } else {
        console.log('🟢 [PROFILE] Profile photo updated successfully');
      }
    }
  };

  useEffect(() => {
    if (isOwnProfile) {
      setProfileImage(currentUser?.avatar || null);
    }
  }, [currentUser?.avatar, isOwnProfile]);

  // Fetch goal completion stats for consistency calculation
  useEffect(() => {
    const fetchStats = async () => {
      if (profileUserId) {
        try {
          const stats = await supabaseService.getGoalCompletionStats(profileUserId);
          console.log('📊 [ProfileClaude] Goal completion stats fetched:', stats);
          setGoalCompletionStats(stats);
        } catch (error) {
          console.error('Error fetching goal completion stats:', error);
        }
      }
    };
    fetchStats();
  }, [profileUserId]);

  return (
    <View style={styles.outerContainer}>
      <View style={styles.innerContainer}>
        <View style={styles.container}>
        {/* Hero Card - Pinned at top EXACTLY like ProfileV2 */}
        <Animated.View 
          style={[styles.heroCard, { paddingTop: insets.top + 10 }]}
          entering={FadeInDown.duration(600).springify()}
        >
          
          <View style={styles.heroCardInner}>
            {/* Avatar with luxury ring - EXACTLY like ProfileV2 */}
            <View style={styles.avatarSection}>
              <Pressable onPress={handleProfilePhoto} disabled={!isOwnProfile}>
                {/* Gold gradient ring */}
                <LinearGradient
                  colors={[
                    '#D4AF37',  // Antique gold highlight
                    '#C9A050',  // Rich gold
                    '#B8860B',  // Dark goldenrod
                    '#A0790A',  // Deep gold
                    '#B8860B',  // Dark goldenrod again
                    '#C9A050',  // Rich gold again
                    '#D4AF37'   // Antique gold edge
                  ]}
                  locations={[0, 0.2, 0.35, 0.5, 0.65, 0.8, 1]}
                  style={styles.avatarRing}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={styles.avatar}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>
                      {(isOwnProfile ? currentUser?.name : profileData?.name)?.charAt(0) || 'U'}
                    </Text>
                  )}
                </View>
                {/* Camera icon overlay - only show for own profile */}
                {isOwnProfile && (
                  <View style={styles.cameraButton}>
                    <Camera size={16} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            </View>
            
            <Text style={styles.profileName}>
              {isOwnProfile ? (currentUser?.name || 'Achiever') : (profileData?.name || 'User')}
            </Text>
            
            <View style={styles.bioContainer}>
              {isEditingBio ? (
                <View style={styles.bioEditContainer}>
                  <TextInput
                    style={styles.bioInput}
                    value={bio}
                    onChangeText={setBio}
                    autoFocus
                    multiline
                    maxLength={60}
                  />
                  <View style={styles.bioEditButtons}>
                    <Pressable
                      style={styles.bioButton}
                      onPress={async () => {
                        const success = await updateBio(bio);
                        if (success) {
                          setIsEditingBio(false);
                        } else {
                          Alert.alert('Error', 'Failed to save bio');
                        }
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                    >
                      <Check size={20} color="#D4AF37" />
                    </Pressable>
                    <Pressable
                      style={styles.bioButton}
                      onPress={() => {
                        setBio(user?.bio || 'Building my best self, one day at a time ✨');
                        setIsEditingBio(false);
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                    >
                      <X size={20} color="#FFFFFF" />
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable 
                  style={styles.bioTouchable}
                  onPress={() => isOwnProfile && setIsEditingBio(true)}
                  disabled={!isOwnProfile}
                >
                  <Text style={styles.profileBio}>{bio}</Text>
                  {isOwnProfile && (
                    <Edit3 size={12} color="#B0B0B0" style={styles.editIcon} />
                  )}
                </Pressable>
              )}
            </View>
          </View>
          
          {/* Gold gradient underline */}
          <LinearGradient
            colors={[
              '#D4AF37',
              '#C9A050',
              '#B8860B',
              '#A0790A',
              '#B8860B',
              '#C9A050',
              '#D4AF37'
            ]}
            locations={[0, 0.2, 0.35, 0.5, 0.65, 0.8, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerUnderline}
          />
        </Animated.View>
        
        <View style={styles.scrollViewWrapper}>
          {/* Fallback gradient background */}
          <LinearGradient 
            colors={[
              'rgba(10, 10, 10, 1)',
              'rgba(5, 5, 5, 1)',
              'rgba(0, 0, 0, 1)'
            ]}
            locations={[0, 0.3, 1]}
            style={styles.backgroundGradient}
            pointerEvents="none"
          />
          
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { 
                paddingTop: 200 + insets.top,
                paddingBottom: insets.bottom + 100 
              }
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Active Goals Section */}
            <View style={styles.sectionCard}>
              {/* Background gradient for card */}
              <LinearGradient
                colors={['rgba(0,0,0,0.9)', 'rgba(15,15,15,0.95)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.sectionTitle}>Active Goals</Text>
                <LinearGradient
                  colors={['rgba(255,215,0,0.2)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sectionTitleLine}
                />
              </View>
              <View style={styles.goalsList}>
                {console.log('🔥 [DEBUG] About to render goals:', {
                  goalsCount: goals.length,
                  goals: goals.map(g => ({
                    id: g.id,
                    title: g.title,
                    active: g.active,
                    completed: g.completed
                  })),
                  profileActionsForDisplay: profileActions.length,
                  isOwnProfile,
                  profileUserId
                })}
                {goals.length > 0 ? (
                  goals.map((goal, index) => {
                    console.log('🎯 [DEBUG] Processing goal:', {
                      goalTitle: goal.title,
                      goalId: goal.id,
                      goalActive: goal.active,
                      goalCompleted: goal.completed,
                      profileActionsCount: profileActions.length,
                      profileActions: profileActions.map(a => ({
                        id: a.id,
                        title: a.title,
                        goal_id: a.goal_id,
                        completed_at: a.completed_at,
                        created_at: a.created_at
                      }))
                    });
                    
                    // Check if this is a challenge goal (75 HARD, etc)
                    const isChallenge = goal.title?.includes('Challenge') || goal.title?.includes('75 HARD');
                    
                    // For challenge goals, use ALL actions; for regular goals, use goalId-linked actions
                    const relevantActions = isChallenge 
                      ? profileActions // Use all actions for challenges
                      : profileActions.filter(a => a.goal_id === goal.id);
                    
                    // If no specific goal actions, fall back to all actions
                    const goalActions = relevantActions.length > 0 ? relevantActions : profileActions;
                    
                    console.log('🔍 [DEBUG] Goal actions selected:', {
                      isChallenge,
                      relevantActionsCount: relevantActions.length,
                      goalActionsCount: goalActions.length,
                      usingFallback: relevantActions.length === 0,
                      firstAction: goalActions[0] ? Object.keys(goalActions[0]) : 'no actions',
                      actionSample: goalActions[0]
                    });
                    
                    // Use cumulative consistency from action_completions table
                    // This matches the Progress page calculation
                    const goalStats = goalCompletionStats[goal.id] || {
                      expected: 0,
                      completed: 0,
                      percentage: 0
                    };

                    const consistencyPercent = goalStats.percentage || 0;
                    const completedCount = goalStats.completed || 0;
                    const expectedCount = goalStats.expected || 0;
                    
                    console.log('📊 [DEBUG] Consistency calculation result:', {
                      goalTitle: goal.title,
                      completedCount,
                      expectedCount,
                      consistencyPercent,
                      goalStats
                    });

                    // Create progress text showing cumulative consistency
                    const progressText = `${completedCount}/${expectedCount} completed • ${consistencyPercent > 70 ? 'Consistent' : consistencyPercent > 40 ? 'Building habit' : 'Get started'}`;
                    
                    return (
                      <GoalItem
                        key={goal.id}
                        name={goal.title}
                        progress={progressText}
                        percentage={consistencyPercent}
                      />
                    );
                  })
                ) : (
                  <Text style={styles.emptyText}>No active goals yet</Text>
                )}
              </View>
            </View>
            
            {/* Today's Wins Section */}
            <View style={styles.sectionCard}>
              {/* Background gradient for card */}
              <LinearGradient
                colors={['rgba(0,0,0,0.9)', 'rgba(15,15,15,0.95)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.sectionTitle}>Today's Wins</Text>
                <LinearGradient
                  colors={['rgba(255,215,0,0.2)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sectionTitleLine}
                />
              </View>
              <View style={styles.achievementsGrid}>
                {profileCompletedActions.length > 0 ? (
                  profileCompletedActions.slice(0, 5).map((action, index) => {
                    const time = new Date(action.completedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    });
                    const points = (5 - index) * 5; // First item gets 25 points, second gets 20, etc.
                    
                    return (
                      <AchievementItem
                        key={action.id}
                        title={action.title}
                        time={`Completed at ${time}`}
                        points={points}
                        isGold={index < 2} // First two items are gold
                      />
                    );
                  })
                ) : (
                  <Text style={styles.emptyText}>Complete actions to see your wins!</Text>
                )}
              </View>
            </View>
            
            {/* ===== HIGHLIGHTS & MILESTONES SECTION - START ===== */}
            {/* Uncomment this entire block to enable Highlights & Milestones */}
            
            <View style={styles.sectionCard}>
              <LinearGradient
                colors={['rgba(0,0,0,0.9)', 'rgba(15,15,15,0.95)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.sectionTitle}>Highlights & Milestones</Text>
                <LinearGradient
                  colors={['rgba(255,215,0,0.2)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sectionTitleLine}
                />
              </View>
              <View style={styles.highlightsGrid}>
                <HighlightCard icon="🔥" value={currentStreak.toString()} label="Current Streak" />
                <HighlightCard icon="⚡" value={perfectDays.toString()} label="Perfect Days" />
                <HighlightCard icon="🏆" value={goalsCompleted.toString()} label="Goals Complete" />
                <HighlightCard icon="💪" value={`${thisWeekPercentage}%`} label="This Week" />
                <HighlightCard icon="📈" value={monthlyChange} label="vs Last Month" />
                <HighlightCard icon="⭐" value={userStatus} label="Status" />
              </View>
            </View>
            
            {/* ===== HIGHLIGHTS & MILESTONES SECTION - END ===== */}
            
            {/* ===== RECENT ACTIVITY SECTION - START ===== */}
            {/* Uncomment this entire block to enable Recent Activity */}
            
            <View style={styles.sectionCard}>
              <LinearGradient
                colors={['rgba(0,0,0,0.9)', 'rgba(15,15,15,0.95)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <LinearGradient
                  colors={['rgba(255,215,0,0.2)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sectionTitleLine}
                />
              </View>
              <View style={styles.timeline}>
                {/* REVERSIBLE: To go back to mock data, uncomment the block below and comment out the dynamic mapping */}
                {/* Mock Data (Original):
                <TimelineItem 
                  text="Completed 5K morning run - New personal best!" 
                  time="2 hours ago" 
                  isLast={false}
                />
                <TimelineItem 
                  text="Reached 127 day Spanish streak" 
                  time="5 hours ago" 
                  isLast={false}
                />
                <TimelineItem 
                  text="Weight milestone: -4 lbs achieved" 
                  time="Yesterday" 
                  isLast={false}
                />
                <TimelineItem 
                  text="Finished reading 'Atomic Habits'" 
                  time="2 days ago" 
                  isLast={true}
                />
                */}
                
                {/* Dynamic Real Data */}
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <TimelineItem 
                      key={index}
                      text={activity.text}
                      time={activity.time}
                      isLast={index === recentActivities.length - 1}
                    />
                  ))
                ) : (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                      No recent activity
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* ===== RECENT ACTIVITY SECTION - END ===== */}
            
          </ScrollView>
        </View>
      </View>
      
      {/* <ResetOnboardingButton /> */}
      
      {/* Back Button - Show when viewing another user's profile AND not in modal (modal has its own close) */}
      {!isOwnProfile && !isInModal && (
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Go back to previous screen (Circle)
            navigation.goBack();
          }}
        >
          <ChevronLeft size={24} color="rgba(255, 255, 255, 0.8)" strokeWidth={2} />
        </Pressable>
      )}
      
      {/* Logout Icon Button - Only for own profile */}
      {isOwnProfile ? (
        <Pressable 
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutButtonPressed
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            logout();
          }}
        >
          <LogOut size={20} color="rgba(255, 255, 255, 0.6)" strokeWidth={2} />
        </Pressable>
      ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 414 : '100%', // iPhone 14 Pro Max width
    backgroundColor: '#000000',
    position: 'relative',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollViewWrapper: {
    flex: 1,
    position: 'relative',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  
  // Hero Card Styles - EXACTLY from ProfileV2
  heroCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderRadius: 0, // No rounded corners for edge-to-edge
    paddingVertical: 10, // Even more reduced for shorter card
    paddingHorizontal: 20,
    // paddingTop is now dynamic based on safe area insets
    backgroundColor: '#000000', // Pure black like SocialScreenV6
    overflow: 'hidden',
    alignItems: 'center',
    // No shadow/glow effects
  },
  heroCardInner: {
    alignItems: 'center',
    zIndex: 20,
  },
  avatarSection: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 2,  // Thinner ring
  },
  avatar: {
    position: 'absolute',
    top: 2,  // Adjusted for thinner ring
    left: 2,
    right: 2,
    bottom: 2,
    backgroundColor: '#0A0A0A',
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFD700',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 43,
    resizeMode: 'cover',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  profileName: {
    fontSize: 18,  // Same as UNITY
    fontWeight: '700',  // Same as UNITY
    letterSpacing: 4,  // Same as UNITY
    color: '#FFFFFF',
    textShadowColor: '#FFD700',  // Gold glow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,  // Same glow as UNITY
    marginBottom: 8,
    textTransform: 'uppercase',  // Make it uppercase like UNITY
  },
  bioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginBottom: 12,  // Reduced to bring underline closer
  },
  bioEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  bioInput: {
    fontSize: 14,
    color: '#CFCFCF',  // Same silver for consistency
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#B0B0B0',  // Darker silver for underline
    paddingVertical: 2,
    minWidth: 200,
    flex: 1,
  },
  bioEditButtons: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  bioButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 8,
  },
  bioTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileBio: {
    fontSize: 14,  // Smaller font
    color: '#CFCFCF',  // Subtle silver/gray for premium look
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,  // Slight spacing for engraved look
  },
  editIcon: {
    marginLeft: 6,
    opacity: 0.5,  // More subtle
  },
  headerUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  
  // Logout Button
  logoutButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 101,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  logoutButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  
  // Back Button
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 101,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  
  // Active Goals Section Styles
  sectionCard: {
    backgroundColor: '#000000', // Will use LinearGradient as child
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 20,
  },
  
  sectionTitle: {
    fontSize: 11,
    color: 'rgba(255, 215, 0, 0.7)', // Gold color with 70% opacity
    textTransform: 'uppercase',
    letterSpacing: 11 * 0.15, // 0.15em converted (multiply by fontSize)
    fontWeight: '600',
  },
  
  sectionTitleLine: {
    flex: 1,
    height: 1,
    marginLeft: 8,
    // Will use LinearGradient for gradient effect
  },
  
  goalsList: {
    flexDirection: 'column',
  },
  
  goalItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  goalItemHover: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    transform: [{ translateX: 4 }],
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  
  goalInfo: {
    flex: 1,
  },
  
  goalName: {
    fontSize: 13,
    color: '#ffffff',
    marginBottom: 4,
    fontWeight: '500',
  },
  
  goalProgress: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  
  goalBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  
  goalBadgeText: {
    fontSize: 12,
    color: '#ffd700',
    fontWeight: '700',
  },
  
  emptyText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    paddingVertical: 20,
  },
  
  // Today's Wins Section Styles
  achievementsGrid: {
    flexDirection: 'column',
  },
  
  achievementItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 12,
  },
  
  achievementItemHover: {
    transform: [{ translateX: 4 }],
  },
  
  achievementCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  
  achievementCheckText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  achievementContent: {
    flex: 1,
  },
  
  achievementTitle: {
    fontSize: 12,
    color: '#ffffff',
    marginBottom: 2,
  },
  
  achievementTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  
  achievementPoints: {
    fontSize: 11,
    color: '#ffd700',
    fontWeight: '600',
  },
  
  // Highlights & Milestones Section Styles
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  highlightCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    width: '31%', // For 3 columns with gaps
    minWidth: 100,
    marginBottom: 8,
  },
  
  highlightCardHover: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderColor: 'rgba(255, 215, 0, 0.2)',
    transform: [{ translateY: -4 }],
  },
  
  highlightIcon: {
    fontSize: 24,
    marginBottom: 6,
    textShadowColor: 'rgba(255, 215, 0, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  
  highlightValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffd700',
    textShadowColor: 'rgba(255, 215, 0, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 2,
  },
  
  highlightLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 9 * 0.05,
    textAlign: 'center',
  },
  
  // Recent Activity Section Styles
  timeline: {
    flexDirection: 'column',
  },
  
  timelineItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  
  timelineItemLast: {
    borderBottomWidth: 0,
  },
  
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffd700',
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.6,
    marginRight: 12,
  },
  
  timelineContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  timelineText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
    paddingRight: 8,
  },
  
  timelineTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});