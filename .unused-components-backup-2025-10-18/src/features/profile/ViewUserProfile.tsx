import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  X, 
  Trophy, 
  Target, 
  Flame, 
  Calendar,
  Lock,
  Users,
  Globe
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { supabase } from '../../services/supabase.service';
import { useStore } from '../../state/rootStore';

const { width, height } = Dimensions.get('window');

interface ViewUserProfileProps {
  userId: string;
  visible: boolean;
  onClose: () => void;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

interface UserStats {
  totalGoals: number;
  publicGoals: number;
  circleGoals: number;
  privateGoals: number;
  completedActions: number;
  currentStreak: number;
  longestStreak: number;
  posts: number;
}

interface Goal {
  id: string;
  title: string;
  metric: string;
  deadline: string;
  category?: string;
  color?: string;
  visibility: 'public' | 'circle' | 'private';
  progress?: number;
}

export const ViewUserProfile: React.FC<ViewUserProfileProps> = ({
  userId,
  visible,
  onClose,
}) => {
  const currentUser = useStore(state => state.user);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInSameCircle, setIsInSameCircle] = useState(false);
  const [activeTab, setActiveTab] = useState<'goals' | 'activity' | 'posts'>('goals');
  
  const slideAnimation = useSharedValue(height);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnimation.value }],
  }));

  useEffect(() => {
    console.log('🔵 [ViewUserProfile] useEffect - visible:', visible, 'userId:', userId);
    if (visible) {
      slideAnimation.value = withSpring(0, {
        damping: 20,
        stiffness: 90,
      });
      fetchUserData();
    } else {
      slideAnimation.value = withTiming(height, { duration: 300 });
    }
  }, [visible, userId]);

  const fetchUserData = async () => {
    console.log('🔵 [ViewUserProfile] fetchUserData called with userId:', userId);
    if (!userId) {
      console.log('🔴 [ViewUserProfile] No userId provided, returning');
      return;
    }
    
    setIsLoading(true);
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.log('🔴 [ViewUserProfile] Error fetching profile:', profileError);
        throw profileError;
      }
      console.log('🟢 [ViewUserProfile] Profile data fetched:', profileData);
      setProfile(profileData);

      // Check if users are in same circle
      const { data: circleData } = await supabase
        .from('circle_members')
        .select(`
          circle_id,
          circles!inner(*)
        `)
        .eq('user_id', currentUser?.id);

      const { data: targetCircleData } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', userId);

      const currentUserCircles = circleData?.map(c => c.circle_id) || [];
      const targetUserCircles = targetCircleData?.map(c => c.circle_id) || [];
      const inSameCircle = currentUserCircles.some(c => targetUserCircles.includes(c));
      setIsInSameCircle(inSameCircle);

      // Fetch goals based on visibility
      let goalsQuery = supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId);

      // If not the same user, filter by visibility
      if (currentUser?.id !== userId) {
        if (inSameCircle) {
          goalsQuery = goalsQuery.in('visibility', ['public', 'circle']);
        } else {
          goalsQuery = goalsQuery.eq('visibility', 'public');
        }
      }

      const { data: goalsData, error: goalsError } = await goalsQuery;
      
      if (goalsError) {
        console.log('🔴 [ViewUserProfile] Error fetching goals:', goalsError);
        throw goalsError;
      }
      
      console.log('🟢 [ViewUserProfile] Goals fetched:', goalsData?.length || 0, 'goals');
      setGoals(goalsData || []);

      // Fetch stats
      const { data: actionsData } = await supabase
        .from('actions')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', true);

      const { data: postsData } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', userId);

      const { data: streaksData } = await supabase
        .from('streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', userId)
        .order('current_streak', { ascending: false })
        .limit(1)
        .single();

      // Count goals by visibility
      const publicGoals = goalsData?.filter(g => g.visibility === 'public').length || 0;
      const circleGoals = goalsData?.filter(g => g.visibility === 'circle').length || 0;
      const privateGoals = goalsData?.filter(g => g.visibility === 'private').length || 0;

      setStats({
        totalGoals: goalsData?.length || 0,
        publicGoals,
        circleGoals,
        privateGoals,
        completedActions: actionsData?.length || 0,
        currentStreak: streaksData?.current_streak || 0,
        longestStreak: streaksData?.longest_streak || 0,
        posts: postsData?.length || 0,
      });

      // Track profile view (not for own profile)
      if (currentUser?.id !== userId) {
        await supabase.from('profile_views').insert({
          viewer_id: currentUser?.id,
          viewed_id: userId,
        });
      }

    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'private':
        return <Lock size={12} color="#FFD700" />;
      case 'circle':
        return <Users size={12} color="#FFD700" />;
      case 'public':
        return <Globe size={12} color="#FFD700" />;
      default:
        return null;
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    slideAnimation.value = withTiming(height, { duration: 300 });
    setTimeout(onClose, 300);
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.profileContainer, animatedStyle]}>
          <SafeAreaView style={styles.safeArea}>
            {/* Header with close button */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>
                  {currentUser?.id === userId ? 'Your Profile' : 'Profile'}
                </Text>
              </View>
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <X size={24} color="#FFFFFF" />
              </Pressable>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
              </View>
            ) : (
              <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
              >
                {/* Profile Header */}
                <Animated.View 
                  entering={FadeInUp.delay(100).springify()}
                  style={styles.profileHeader}
                >
                  <LinearGradient
                    colors={['rgba(255,215,0,0.1)', 'rgba(0,0,0,0)']}
                    style={styles.headerGradient}
                  />
                  
                  <View style={styles.avatarSection}>
                    {profile?.avatar_url ? (
                      <Image 
                        source={{ uri: profile.avatar_url }} 
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                          {profile?.name?.charAt(0).toUpperCase() || '?'}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.userName}>{profile?.name}</Text>
                  {profile?.bio && (
                    <Text style={styles.userBio}>{profile.bio}</Text>
                  )}

                  {/* Stats Row */}
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{stats?.totalGoals || 0}</Text>
                      <Text style={styles.statLabel}>Goals</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{stats?.currentStreak || 0}</Text>
                      <Text style={styles.statLabel}>Streak</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{stats?.posts || 0}</Text>
                      <Text style={styles.statLabel}>Posts</Text>
                    </View>
                  </View>

                  {/* Privacy Info if not all content visible */}
                  {currentUser?.id !== userId && stats && stats.privateGoals > 0 && (
                    <View style={styles.privacyInfo}>
                      <Lock size={14} color="rgba(255,215,0,0.6)" />
                      <Text style={styles.privacyText}>
                        {stats.privateGoals} private goal{stats.privateGoals !== 1 ? 's' : ''} hidden
                      </Text>
                    </View>
                  )}
                </Animated.View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                  <Pressable 
                    style={[styles.tab, activeTab === 'goals' && styles.activeTab]}
                    onPress={() => setActiveTab('goals')}
                  >
                    <Text style={[styles.tabText, activeTab === 'goals' && styles.activeTabText]}>
                      Goals
                    </Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
                    onPress={() => setActiveTab('activity')}
                  >
                    <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>
                      Activity
                    </Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
                    onPress={() => setActiveTab('posts')}
                  >
                    <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
                      Posts
                    </Text>
                  </Pressable>
                </View>

                {/* Tab Content */}
                <View style={styles.tabContent}>
                  {activeTab === 'goals' && (
                    <View style={styles.goalsContainer}>
                      {goals.length === 0 ? (
                        <Text style={styles.emptyText}>No visible goals</Text>
                      ) : (
                        goals.map(goal => (
                          <Animated.View 
                            key={goal.id}
                            entering={FadeInUp.delay(100).springify()}
                            style={styles.goalCard}
                          >
                            <LinearGradient
                              colors={['rgba(255,215,0,0.05)', 'rgba(255,215,0,0.02)']}
                              style={StyleSheet.absoluteFillObject}
                            />
                            <View style={styles.goalHeader}>
                              <View style={[styles.goalColor, { backgroundColor: goal.color || '#FFD700' }]} />
                              <Text style={styles.goalTitle}>{goal.title}</Text>
                              {goal.visibility && getVisibilityIcon(goal.visibility)}
                            </View>
                            <Text style={styles.goalMetric}>{goal.metric}</Text>
                            <Text style={styles.goalDeadline}>
                              Deadline: {new Date(goal.deadline).toLocaleDateString()}
                            </Text>
                          </Animated.View>
                        ))
                      )}
                    </View>
                  )}

                  {activeTab === 'activity' && (
                    <View style={styles.activityContainer}>
                      <Text style={styles.comingSoon}>Activity Grid Coming Soon</Text>
                      <Text style={styles.comingSoonSub}>Instagram-style activity display</Text>
                    </View>
                  )}

                  {activeTab === 'posts' && (
                    <View style={styles.postsContainer}>
                      <Text style={styles.comingSoon}>Posts Feed Coming Soon</Text>
                      <Text style={styles.comingSoonSub}>User's recent posts and achievements</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)', // Made darker for better visibility
    justifyContent: 'flex-end', // Position at bottom like a bottom sheet
  },
  profileContainer: {
    height: height * 0.9, // Take up 90% of screen height
    backgroundColor: '#000000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,215,0,0.1)',
    backgroundColor: '#1a1a1a', // Added background to make header visible
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    position: 'relative',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  avatarSection: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,215,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFD700',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  userBio: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginHorizontal: 40,
    textAlign: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  privacyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 20,
  },
  privacyText: {
    fontSize: 12,
    color: 'rgba(255,215,0,0.8)',
    marginLeft: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  activeTabText: {
    color: '#FFD700',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  goalsContainer: {
    gap: 15,
  },
  goalCard: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
    marginBottom: 10,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  goalMetric: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 18,
    marginBottom: 5,
  },
  goalDeadline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 18,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 40,
  },
  activityContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  postsContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  comingSoon: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 5,
  },
  comingSoonSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
});