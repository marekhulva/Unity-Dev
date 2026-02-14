import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Pressable, 
  Image,
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { 
  Trophy,
  Flame,
  Target,
  Award,
  Camera,
  Settings,
  LogOut,
  Grid3x3,
  Activity,
  Users,
  Crown,
  Star,
  CheckCircle2,
  TrendingUp,
  Heart
} from 'lucide-react-native';
import { useStore } from '../../state/rootStore';
import { ResetOnboardingButton } from '../onboarding/ResetButton';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export const ProfileV3 = () => {
  const insets = useSafeAreaInsets();
  const user = useStore(s => s.user);
  const goals = useStore(s => s.goals);
  const actions = useStore(s => s.actions);
  const circleFeed = useStore(s => s.circleFeed);
  const followFeed = useStore(s => s.followFeed);
  const completedActions = useStore(s => s.completedActions);
  const logout = useStore(s => s.logout);
  const updateAvatar = useStore(s => s.updateAvatar);
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'activity'>('stats');
  
  // Calculate stats
  const totalCheckIns = completedActions.length;
  const currentStreak = Math.max(0, ...actions.map(a => a.streak || 0));
  const totalGoals = goals.length;
  const activeGoals = goals.filter(g => g.status === 'active').length;
  
  // Get user's posts
  const allPosts = [...circleFeed, ...followFeed];
  const userPosts = allPosts.filter(post => 
    post.user === 'You' || 
    post.user === user?.name || 
    post.user === user?.email
  );
  
  const pickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please grant camera roll permissions to change your profile picture.');
          return;
        }
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });
      
      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const base64 = result.assets[0].base64;
        const avatarData = Platform.OS === 'web' ? imageUri : `data:image/jpeg;base64,${base64}`;
        
        const success = await updateAvatar(avatarData);
        if (success) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    }
  };
  
  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  };
  
  const StatCard = ({ icon, label, value, color = '#FFD700' }: any) => (
    <Animated.View 
      entering={FadeInDown.delay(200).springify()}
      style={styles.statCard}
    >
      <LinearGradient
        colors={[`${color}08`, 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.statIcon, { backgroundColor: `${color}10` }]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
  
  const AchievementBadge = ({ icon, title, subtitle, locked = false }: any) => (
    <Pressable style={[styles.achievementBadge, locked && styles.achievementLocked]}>
      <View style={[styles.achievementIcon, { opacity: locked ? 0.3 : 1 }]}>
        {icon}
      </View>
      <Text style={[styles.achievementTitle, locked && styles.textLocked]}>{title}</Text>
      <Text style={[styles.achievementSubtitle, locked && styles.textLocked]}>{subtitle}</Text>
    </Pressable>
  );
  
  return (
    <View style={styles.container}>
      {/* Pure black background */}
      <View style={styles.background} />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.settingsButton} onPress={() => {}}>
              <Settings size={20} color="rgba(255,255,255,0.6)" />
            </Pressable>
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>
          
          {/* Profile Section */}
          <Animated.View 
            entering={FadeIn.duration(600)}
            style={styles.profileSection}
          >
            <Pressable onPress={pickImage} style={styles.avatarContainer}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarEmoji}>👤</Text>
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Camera size={12} color="#000" />
              </View>
            </Pressable>
            
            <Text style={styles.userName}>{user?.name || 'Anonymous'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            
            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>{currentStreak}</Text>
                <Text style={styles.quickStatLabel}>Day Streak</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>{totalCheckIns}</Text>
                <Text style={styles.quickStatLabel}>Check-ins</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>{activeGoals}</Text>
                <Text style={styles.quickStatLabel}>Active Goals</Text>
              </View>
            </View>
          </Animated.View>
          
          {/* Tab Navigation */}
          <View style={styles.tabNav}>
            <Pressable 
              style={[styles.tabButton, activeTab === 'stats' && styles.tabActive]}
              onPress={() => setActiveTab('stats')}
            >
              <Activity size={16} color={activeTab === 'stats' ? '#FFD700' : 'rgba(255,255,255,0.4)'} />
              <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>Stats</Text>
            </Pressable>
            <Pressable 
              style={[styles.tabButton, activeTab === 'achievements' && styles.tabActive]}
              onPress={() => setActiveTab('achievements')}
            >
              <Trophy size={16} color={activeTab === 'achievements' ? '#FFD700' : 'rgba(255,255,255,0.4)'} />
              <Text style={[styles.tabText, activeTab === 'achievements' && styles.tabTextActive]}>Achievements</Text>
            </Pressable>
            <Pressable 
              style={[styles.tabButton, activeTab === 'activity' && styles.tabActive]}
              onPress={() => setActiveTab('activity')}
            >
              <Grid3x3 size={16} color={activeTab === 'activity' ? '#FFD700' : 'rgba(255,255,255,0.4)'} />
              <Text style={[styles.tabText, activeTab === 'activity' && styles.tabTextActive]}>Activity</Text>
            </Pressable>
          </View>
          
          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === 'stats' && (
              <View style={styles.statsGrid}>
                <StatCard 
                  icon={<Flame size={16} color="#FFD700" />}
                  label="Current Streak"
                  value={`${currentStreak}d`}
                  color="#FFD700"
                />
                <StatCard 
                  icon={<CheckCircle2 size={16} color="#4CAF50" />}
                  label="Total Check-ins"
                  value={totalCheckIns}
                  color="#4CAF50"
                />
                <StatCard 
                  icon={<Target size={16} color="#2196F3" />}
                  label="Active Goals"
                  value={`${activeGoals}/${totalGoals}`}
                  color="#2196F3"
                />
                <StatCard 
                  icon={<TrendingUp size={16} color="#FF6B6B" />}
                  label="Consistency"
                  value={`${Math.round((totalCheckIns / Math.max(1, actions.length)) * 100)}%`}
                  color="#FF6B6B"
                />
              </View>
            )}
            
            {activeTab === 'achievements' && (
              <View style={styles.achievementsGrid}>
                <AchievementBadge 
                  icon={<Flame size={18} color="#FFD700" />}
                  title="Week"
                  subtitle="7 days"
                  locked={currentStreak < 7}
                />
                <AchievementBadge 
                  icon={<Trophy size={18} color="#FFD700" />}
                  title="Month"
                  subtitle="30 days"
                  locked={currentStreak < 30}
                />
                <AchievementBadge 
                  icon={<Crown size={18} color="#FFD700" />}
                  title="Century"
                  subtitle="100 checks"
                  locked={totalCheckIns < 100}
                />
                <AchievementBadge 
                  icon={<Star size={18} color="#FFD700" />}
                  title="Goals"
                  subtitle="5 active"
                  locked={activeGoals < 5}
                />
                <AchievementBadge 
                  icon={<Award size={18} color="#FFD700" />}
                  title="Elite"
                  subtitle="90%"
                  locked={true}
                />
                <AchievementBadge 
                  icon={<Heart size={18} color="#FFD700" />}
                  title="Social"
                  subtitle="50 likes"
                  locked={true}
                />
              </View>
            )}
            
            {activeTab === 'activity' && (
              <View style={styles.activityGrid}>
                {completedActions.length === 0 ? (
                  <Text style={styles.emptyText}>No activities yet. Start checking in!</Text>
                ) : (
                  completedActions.slice(0, 15).map((action, index) => (
                    <Animated.View 
                      key={action.actionId}
                      entering={FadeInDown.delay(index * 30).springify()}
                      style={styles.activityItem}
                    >
                      <LinearGradient
                        colors={['rgba(255,215,0,0.08)', 'transparent']}
                        style={StyleSheet.absoluteFillObject}
                      />
                      <CheckCircle2 size={12} color="#FFD700" />
                      <Text style={styles.activityText} numberOfLines={1}>
                        {action.title}
                      </Text>
                    </Animated.View>
                  ))
                )}
              </View>
            )}
          </View>
          
          {/* Reset Button */}
          <View style={styles.resetSection}>
            <ResetOnboardingButton />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  settingsButton: {
    padding: 8,
  },
  logoutButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.3,
    marginBottom: 20,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  quickStatItem: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  quickStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabNav: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    maxWidth: 120,
  },
  tabActive: {
    borderBottomColor: '#FFD700',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: '#FFD700',
  },
  tabContent: {
    paddingHorizontal: 24,
    minHeight: 200,
    paddingBottom: 20,
  },
  // Stats tab styles
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 14,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    overflow: 'hidden',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.3,
  },
  // Achievements tab styles
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  achievementBadge: {
    width: '31%',
    aspectRatio: 1,
    padding: 8,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255,215,0,0.2)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementLocked: {
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  achievementIcon: {
    marginBottom: 6,
  },
  achievementTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 2,
  },
  achievementSubtitle: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
  textLocked: {
    opacity: 0.3,
  },
  // Activity tab styles
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  activityItem: {
    width: '31%',
    aspectRatio: 1.2,
    padding: 8,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,215,0,0.1)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  activityText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: 40,
  },
  resetSection: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
});