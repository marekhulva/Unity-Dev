import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions, Image, Alert, Platform, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSpring,
  interpolate,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { 
  Trophy, Flame, Target, TrendingUp, Star, 
  Award, Calendar, Users, Heart, MessageCircle,
  Lock, Camera, Mic, CheckCircle, Grid3x3,
  Bookmark, CheckCircle2, LogOut, Edit3, Check, X
} from 'lucide-react-native';
import { useStore } from '../../state/rootStore';
import { PostCardEnhanced } from '../social/components/PostCardEnhanced';
import { ResetOnboardingButton } from '../onboarding/ResetButton';
import { LuxuryTheme } from '../../design/luxuryTheme';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Define the action grid item type
interface GridAction {
  id: string;
  type: 'check' | 'photo' | 'audio' | 'milestone';
  title: string;
  completedAt: Date;
  mediaUrl?: string;
  isPrivate: boolean;
  category: string;
  streak?: number;
}

export const ProfileV4_1 = () => {
  console.log('>>> USING ProfileV4.1 COMPONENT <<<');
  const insets = useSafeAreaInsets();
  const user = useStore(s => s.user);
  const goals = useStore(s => s.goals);
  const circleFeed = useStore(s => s.circleFeed);
  const followFeed = useStore(s => s.followFeed);
  const completedActions = useStore(s => s.completedActions);
  const logout = useStore(s => s.logout);
  const updateAvatar = useStore(s => s.updateAvatar);
  const updateBio = useStore(s => s.updateBio);
  const [selectedAction, setSelectedAction] = useState<GridAction | null>(null);
  const [bio, setBio] = useState('Building my best self, one day at a time ✨');
  const [isEditingBio, setIsEditingBio] = useState(false);
  
  // Load bio from database on mount
  useEffect(() => {
    const loadBio = async () => {
      try {
        // Get bio from profiles table
        const { supabase } = await import('../../services/supabase.service');
        const { data: profile } = await supabase
          .from('profiles')
          .select('bio, avatar_url, name')
          .eq('id', user?.id)
          .single();
        
        if (profile && profile.bio) {
          setBio(profile.bio);
        }
      } catch (error) {
        console.log('🟡 [PROFILE] Could not load profile data:', error);
      }
    };
    
    if (user?.id) {
      loadBio();
    }
  }, [user?.id]);
  
  const pickImage = async () => {
    try {
      // Request permissions
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please grant camera roll permissions to change your profile picture.');
          return;
        }
      }
      
      // Launch image picker
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
        
        // For web, use the URI directly; for mobile, use base64
        const avatarData = Platform.OS === 'web' ? imageUri : `data:image/jpeg;base64,${base64}`;
        
        // Update avatar
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
  
  // Get user's own posts from both feeds
  const allPosts = [...circleFeed, ...followFeed];
  // Match posts by the current user (could be 'You', user.name, or user.email)
  const userPosts = allPosts.filter(post => 
    post.user === 'You' || 
    post.user === user?.name || 
    post.user === user?.email ||
    post.user === 'User'
  );
  const pinnedPosts = userPosts.slice(0, 2); // First 2 as pinned
  const recentPosts = userPosts.slice(2, 5); // Next 3 as recent
  
  // Convert completed actions to grid format
  const gridActionsFromCompleted: GridAction[] = completedActions.map((action) => ({
    id: action.id,
    type: action.type,
    title: action.title,
    completedAt: action.completedAt,
    mediaUrl: action.mediaUrl,
    isPrivate: action.isPrivate,
    category: action.category || 'fitness',
    streak: action.streak,
  }));
  
  // Convert user posts to grid format (for posts that represent completed actions)
  const gridActionsFromPosts: GridAction[] = userPosts
    .filter(post => post.type === 'checkin' || post.type === 'photo' || post.type === 'status')
    .map((post) => ({
      id: `post-${post.id}`,
      type: post.type === 'photo' && post.photoUri ? 'photo' : 
            post.type === 'checkin' ? 'milestone' : 'check',
      title: post.actionTitle || post.content.substring(0, 50),
      completedAt: new Date(), // Convert post.time to actual date if needed
      mediaUrl: post.photoUri,
      isPrivate: post.visibility === 'circle',
      category: post.goal || 'general',
      streak: post.streak,
    }));
  
  // Combine all sources and show most recent first
  const allGridActions = [...gridActionsFromCompleted, ...gridActionsFromPosts]
    .filter((action, index, self) => 
      index === self.findIndex((a) => a.id === action.id) // Remove duplicates
    )
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 12);
  
  const glowAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(0);
  const shimmerAnimation = useSharedValue(0);
  const heroCardScale = useSharedValue(0.95);
  
  // Helper function to get category gradient colors - luxury aesthetic
  const getCategoryGradient = (category: string): string[] => {
    switch (category) {
      case 'fitness':
        return ['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']; // Gold fade
      case 'mindfulness':
        return ['rgba(192, 192, 192, 0.15)', 'rgba(192, 192, 192, 0.05)']; // Silver fade
      case 'health':
        return ['rgba(231, 180, 58, 0.15)', 'rgba(231, 180, 58, 0.05)']; // Champagne fade
      case 'learning':
        return ['rgba(229, 228, 226, 0.15)', 'rgba(229, 228, 226, 0.05)']; // Platinum fade
      default:
        return ['rgba(18, 23, 28, 0.9)', 'rgba(18, 23, 28, 0.7)']; // Deep black
    }
  };

  React.useEffect(() => {
    glowAnim.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    pulseAnim.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    // New animations from Daily page
    heroCardScale.value = withSpring(1, { damping: 12 });
    
    // Shimmer animation for glass effect
    shimmerAnimation.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const profileGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(glowAnim.value, [0, 1], [0.3, 0.6]),
    shadowRadius: interpolate(glowAnim.value, [0, 1], [20, 35]),
  }));

  const badgeAnimation = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulseAnim.value, [0, 1], [1, 1.1]) }],
  }));
  
  const heroCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroCardScale.value }],
  }));
  
  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmerAnimation.value, [0, 0.5, 1], [0, 0.6, 0]),
    transform: [
      { translateX: interpolate(shimmerAnimation.value, [0, 1], [-200, 200]) }
    ],
  }));

  // Sample data for demonstration
  const achievements = [
    { icon: Flame, label: '30 Day Streak', color: LuxuryTheme.colors.primary.gold },
    { icon: Trophy, label: '10 Goals Completed', color: LuxuryTheme.colors.primary.silver },
    { icon: Star, label: 'Top Performer', color: LuxuryTheme.colors.primary.champagne },
  ];

  const activeGoals = goals.slice(0, 3).map(goal => ({
    ...goal,
    progress: Math.floor(Math.random() * 100),
  }));

  // Calculate real consistency based on today's completed actions
  // Removed placeholder stats - not meaningful without real data

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.backgroundContainer}>
        
        {/* STICKY HERO SECTION - Pinned at top */}
        <Animated.View style={[styles.heroCard, heroCardStyle]}>
          <View style={styles.heroCardInner}>
            {/* Avatar with luxury ring */}
            <View style={styles.avatarSection}>
              <Pressable onPress={pickImage}>
                {/* Gold gradient ring - like V6 underline */}
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
                  {user?.avatar && user.avatar.startsWith('data:') || user?.avatar?.startsWith('http') ? (
                    <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>
                      {user?.name?.charAt(0) || 'U'}
                    </Text>
                  )}
                </View>
                {/* Camera icon overlay */}
                <View style={styles.cameraButton}>
                  <Camera size={16} color="#FFFFFF" />
                </View>
              </Pressable>
              {/* Streak flame badge removed per user request */}
            </View>

            <Text style={styles.profileName}>{user?.name || 'Achiever'}</Text>
            
            {/* Editable Bio Section */}
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
                        // Save bio to backend
                        const success = await updateBio(bio);
                        if (success) {
                          console.log('🟢 [PROFILE] Bio saved successfully');
                          setIsEditingBio(false);
                        } else {
                          Alert.alert('Error', 'Failed to save bio. Please try again.');
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
                        setBio('Building my best self, one day at a time ✨');
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
                  onPress={() => setIsEditingBio(true)}
                >
                  <Text style={styles.profileBio}>{bio}</Text>
                  <Edit3 size={12} color="#B0B0B0" style={styles.editIcon} />
                </Pressable>
              )}
            </View>

            {/* Achievement Badges - COMMENTED OUT */}
            {/* <View style={styles.achievementRow}>
              {achievements.map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <Animated.View 
                    key={index} 
                    style={[styles.achievementBadge, index === 0 && badgeAnimation]}
                  >
                    <LinearGradient
                      colors={[`${achievement.color}20`, `${achievement.color}10`]}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Icon size={20} color={achievement.color} />
                    <Text style={styles.achievementLabel}>{achievement.label}</Text>
                  </Animated.View>
                );
              })}
            </View> */}

          </View>
          
          {/* Gold gradient underline like SocialScreenV6 */}
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
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerUnderline}
          />
        </Animated.View>
        
        <View style={styles.scrollViewWrapper}>
          {/* Fallback gradient background - always shows */}
          <LinearGradient 
            colors={[
              'rgba(10, 10, 10, 1)',      // Very dark gray at top
              'rgba(5, 5, 5, 1)',         // Almost black in middle
              'rgba(0, 0, 0, 1)'          // Pure black at bottom
            ]}
            locations={[0, 0.3, 1]}
            style={styles.backgroundGradient}
            pointerEvents="none"
          />
          {/* Background texture image - same as SocialScreenV6 */}
          <Image 
            source={require('../../../assets/images/background-texture.jpg')}
            style={styles.backgroundTexture}
            resizeMode="stretch"
            pointerEvents="none"
            defaultSource={require('../../../assets/images/background-texture.jpg')}
          />
          {/* Darker overlay for better contrast - same as SocialScreenV6 */}
          <LinearGradient 
            colors={[
              'rgba(0, 0, 0, 0.15)',        // Subtle darkness at top
              'rgba(0, 0, 0, 0.2)',         // Slightly darker in middle
              'rgba(0, 0, 0, 0.15)'         // Subtle darkness at bottom
            ]}
            locations={[0, 0.5, 1]}
            style={styles.darkOverlay}
            pointerEvents="none"
          />
          
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { 
                paddingTop: 210, // Adjusted for shorter pinned card
                paddingBottom: insets.bottom + 100 
              }
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Main Container with max-width */}
            <Animated.View 
              entering={FadeInDown.duration(600).springify()}
              style={styles.mainContainer}
            >
              {/* Two Column Grid Layout */}
              <View style={styles.gridContainer}>
                {/* LEFT COLUMN - Active Goals */}
                <View style={[styles.gridColumn, {marginRight: 8}]}>
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeaderNew}>
                      <Text style={styles.sectionTitleNew}>ACTIVE GOALS</Text>
                      <View style={styles.sectionTitleLine} />
                    </View>
                    
                    <View style={styles.goalsListNew}>
                      {goals.length > 0 ? goals.map((goal, index) => {
                        const progress = Math.floor(Math.random() * 100);
                        const currentDay = Math.floor(Math.random() * 30) + 1;
                        const totalDays = 30;
                        
                        return (
                          <Pressable key={goal.id} style={styles.goalItemNew}>
                            <View style={styles.goalLeftContent}>
                              <Text style={styles.goalNameNew}>{goal.title}</Text>
                              <Text style={styles.goalProgressText}>
                                Day {currentDay} of {totalDays} • {progress > 70 ? 'On track' : 'Keep going'}
                              </Text>
                            </View>
                            <View style={styles.goalPercentageBadge}>
                              <Text style={styles.goalPercentageText}>{progress}%</Text>
                            </View>
                          </Pressable>
                        );
                      }) : (
                        <Text style={styles.emptyText}>No active goals yet</Text>
                      )}
                    </View>
                  </View>
                </View>
                
                {/* RIGHT COLUMN - Today's Wins */}
                <View style={[styles.gridColumn, {marginLeft: 8}]}>
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeaderNew}>
                      <Text style={styles.sectionTitleNew}>TODAY'S WINS</Text>
                      <View style={styles.sectionTitleLine} />
                    </View>
                    
                    <View style={styles.winsListNew}>
                      {completedActions.slice(0, 5).map((action, index) => (
                        <View 
                          key={action.id} 
                          style={[
                            styles.winItem,
                            index === 0 && styles.winItemGold
                          ]}
                        >
                          <View style={styles.winCheckmark}>
                            <Check size={12} color="#000" />
                          </View>
                          <View style={styles.winInfo}>
                            <Text style={styles.winTitle}>{action.title}</Text>
                            <Text style={styles.winTime}>
                              {new Date(action.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </Text>
                          </View>
                          <Text style={styles.winPoints}>+{(index + 1) * 5}</Text>
                        </View>
                      ))}
                      {completedActions.length === 0 && (
                        <Text style={styles.emptyText}>Complete actions to see wins</Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
              
              {/* HIGHLIGHTS SECTION - 6 Metric Cards */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderNew}>
                  <Text style={styles.sectionTitleNew}>HIGHLIGHTS</Text>
                  <View style={styles.sectionTitleLine} />
                </View>
                
                <View style={styles.highlightsGrid}>
                  <Pressable style={styles.highlightCard}>
                    <Text style={styles.highlightEmoji}>🔥</Text>
                    <Text style={styles.highlightValue}>{completedActions.length}</Text>
                    <Text style={styles.highlightLabel}>CURRENT STREAK</Text>
                  </Pressable>
                  
                  <Pressable style={styles.highlightCard}>
                    <Text style={styles.highlightEmoji}>⚡</Text>
                    <Text style={styles.highlightValue}>5</Text>
                    <Text style={styles.highlightLabel}>PERFECT DAYS</Text>
                  </Pressable>
                  
                  <Pressable style={styles.highlightCard}>
                    <Text style={styles.highlightEmoji}>🏆</Text>
                    <Text style={styles.highlightValue}>{goals.length}</Text>
                    <Text style={styles.highlightLabel}>GOALS COMPLETE</Text>
                  </Pressable>
                  
                  <Pressable style={styles.highlightCard}>
                    <Text style={styles.highlightEmoji}>💪</Text>
                    <Text style={styles.highlightValue}>89%</Text>
                    <Text style={styles.highlightLabel}>THIS WEEK</Text>
                  </Pressable>
                  
                  <Pressable style={styles.highlightCard}>
                    <Text style={styles.highlightEmoji}>📈</Text>
                    <Text style={styles.highlightValue}>+12%</Text>
                    <Text style={styles.highlightLabel}>VS LAST MONTH</Text>
                  </Pressable>
                  
                  <Pressable style={styles.highlightCard}>
                    <Text style={styles.highlightEmoji}>⭐</Text>
                    <Text style={styles.highlightValue}>Elite</Text>
                    <Text style={styles.highlightLabel}>STATUS</Text>
                  </Pressable>
                </View>
              </View>
              
              {/* RECENT ACTIVITY TIMELINE */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderNew}>
                  <Text style={styles.sectionTitleNew}>RECENT ACTIVITY</Text>
                  <View style={styles.sectionTitleLine} />
                </View>
                
                <View style={styles.timeline}>
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <Text style={styles.timelineText}>Completed 5K morning run - New personal best!</Text>
                    <Text style={styles.timelineTime}>2 hours ago</Text>
                  </View>
                  
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <Text style={styles.timelineText}>Reached 127 day Spanish streak</Text>
                    <Text style={styles.timelineTime}>5 hours ago</Text>
                  </View>
                  
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <Text style={styles.timelineText}>Logged healthy breakfast</Text>
                    <Text style={styles.timelineTime}>8 hours ago</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </View>
      </View>
      {/* Floating Action Button */}
      <Pressable 
        style={({ pressed }) => [
          styles.fab,
          pressed && styles.fabPressed
        ]}
        onPress={() => {
          // Add action here
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        }}
      >
        <LinearGradient
          colors={['#FFD700', '#FFAA00']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Text style={styles.fabText}>+</Text>
      </Pressable>
      
      <ResetOnboardingButton />
      
      {/* Logout Icon Button */}
      <Pressable 
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && styles.logoutButtonPressed
        ]}
        onPress={() => {
          // Add haptic feedback
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          // Call logout
          logout();
        }}
      >
        <LogOut size={20} color="rgba(255, 255, 255, 0.6)" strokeWidth={2} />
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Pure black background like Social page
  },
  backgroundContainer: {
    flex: 1,
    backgroundColor: '#000000', // Pure black background like Social page
  },
  scrollViewWrapper: {
    flex: 1,
    position: 'relative',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    // No z-index, will be naturally behind due to order
  },
  backgroundTexture: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.03,  // Very subtle - barely visible, same as SocialScreenV6
    // No z-index, will layer on top of gradient
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    // No z-index, will layer on top of texture
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 8, // Reduced from 16 to 8 for wider cards
    // paddingTop and paddingBottom are now dynamic
  },

  // Hero Section - Sticky/Pinned at Top
  heroCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderRadius: 0, // No rounded corners for edge-to-edge
    paddingVertical: 10, // Even more reduced for shorter card
    paddingHorizontal: 20,
    paddingTop: 30, // Reduced more for shorter card
    backgroundColor: '#000000', // Pure black like SocialScreenV6
    overflow: 'hidden',
    alignItems: 'center',
    // Removed all shadow/glow effects
  },
  headerUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  heroShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 150,
    zIndex: 10,
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
  // Streak badge styles removed per user request
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
  bioTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileBio: {
    fontSize: 14,  // Smaller font
    color: '#CFCFCF',  // Subtle silver/gray for premium look
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,  // Slight spacing for engraved look
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
  bioEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  bioEditButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  bioButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  editIcon: {
    opacity: 0.5,  // More subtle
  },
  achievementRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  achievementBadge: {
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    overflow: 'hidden',
  },
  achievementLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  signatureStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(192,192,192,0.2)',
  },

  // Section Styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    alignItems: 'center',  // Center align
    justifyContent: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#B8860B',  // Dark goldenrod - the middle color from the gradient
    textShadowColor: '#D4AF37',  // Lighter gold for glow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 1,
  },

  // Journey Card
  journeyCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
    overflow: 'hidden',
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  goalItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,215,0,0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  goalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  goalTitle: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
  },
  progressRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: 'rgba(255,215,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 8,
  },
  progressArc: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#FFD700',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
  },
  goalCategory: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  focusCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    overflow: 'hidden',
  },
  focusLabel: {
    fontSize: 12,
    color: '#FFD700',
    marginBottom: 4,
  },
  focusText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },

  // Timeline Section
  pinnedSection: {
    marginBottom: 16,
  },
  pinnedLabel: {
    fontSize: 14,
    color: '#FFD700',
    marginBottom: 8,
    fontWeight: '600',
  },
  pinnedPost: {
    marginBottom: 8,
  },
  recentSection: {
    marginTop: 8,
  },
  recentLabel: {
    fontSize: 14,
    color: '#C0C0C0',
    marginBottom: 8,
    fontWeight: '600',
  },
  recentPost: {
    marginBottom: 8,
  },

  // Impact Section
  impactCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(192,192,192,0.1)',
    overflow: 'hidden',
  },
  impactGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  impactItem: {
    alignItems: 'center',
  },
  impactNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  impactLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  testimonialCard: {
    backgroundColor: 'rgba(255,215,0,0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
  },
  testimonialText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  testimonialAuthor: {
    fontSize: 12,
    color: '#FFD700',
    textAlign: 'right',
  },

  // Timeline
  timelineCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
    overflow: 'hidden',
  },
  timeline: {
    // gap replaced with marginBottom on child items
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD700',
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineDate: {
    fontSize: 12,
    color: '#C0C0C0',
    marginBottom: 2,
  },
  timelineEvent: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },

  // Achievement Grid Styles (Instagram-like)
  gridStats: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  gridStatsText: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: '600',
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  gridItem: {
    width: 110,
    height: 110,
    backgroundColor: '#000000',
    margin: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridImageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
    borderRadius: 8,
  },
  gridIconGlow: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  gridIconContainer: {
    padding: 4,
  },
  gridActionTitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 6,
    letterSpacing: 0.2,
  },
  gridAudioDuration: {
    fontSize: 12,
    color: LuxuryTheme.colors.primary.silver,
    marginTop: 4,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gridMilestoneText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  privateLock: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 10,
    padding: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  streakBadgeSmall: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  streakBadgeText: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: '700',
  },
  viewAllButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  viewAllText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  
  // Empty gallery styles
  emptyGallery: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyGalleryText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  
  // Logout button styles
  logoutButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 10,  // Adjusted for mobile visibility
    right: 20,
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 1000,  // Ensure it's above other elements
  },
  logoutButtonPressed: {
    opacity: 0.5,
  },
  pinnedPostsContainer: {
    marginBottom: 16,
  },
  pinnedPost: {
    marginBottom: 12,
    width: '100%',
  },
  pinnedPostCard: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  postTypeIcon: {
    marginRight: 8,
  },
  postDate: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  postContent: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginLeft: 8,
  },
  emptyPinnedPosts: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    textAlign: 'center',
  },
  recentPostsPreview: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
  },
  recentPostsLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  recentPostsList: {
    gap: 8,
  },
  recentPostItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recentPostDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFD700',
  },
  recentPostText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    flex: 1,
  },
  // Goals styles - Sexy Cards
  goalsContainer: {
    gap: 12,
  },
  goalCount: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  goalCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
  },
  goalCard: {
    marginHorizontal: 0,  // EXACTLY like inlineComposer
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',  // White border like Share Your Victory
    backgroundColor: 'rgba(255,255,255,0.03)',  // Same subtle background
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FFFFFF',  // White shadow
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  goalGlow: {
    position: 'absolute',
    top: -30,
    left: -30,
    right: -30,
    bottom: -30,
    opacity: 0.6,  // EXACTLY like composerGlow
  },
  goalCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,  // EXACTLY like composerCollapsed
    paddingVertical: 16,
  },
  goalAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 16,  // EXACTLY like composerAvatar
  },
  goalIcons: {
    flexDirection: 'row',
    gap: 16,  // EXACTLY like composerIcons
  },
  goalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6, // Reduced margin
  },
  goalProgressRing: {
    position: 'relative',
    width: 45, // Smaller ring
    height: 45,
  },
  progressRingOuter: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Pure black like inside Share Your Victory
  },
  progressPercentage: {
    fontSize: 13, // Smaller text
    fontWeight: '700',
    color: '#FFD700', // Always gold
  },
  progressArc: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',  // EXACTLY like composerPlaceholder
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  goalStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalStatText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)', // Brighter white like Share Your Victory
  },
  goalStatDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255, 215, 0, 0.2)', // Gold divider
  },
  goalAccentLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.5,
  },
  emptyGoals: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },
  
  // New scrollable area styles
  mainContainer: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  
  // Grid Layout
  gridContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  gridColumn: {
    flex: 1,
  },
  
  // Section Card Base
  sectionCard: {
    backgroundColor: 'rgba(10,10,10,0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionHeaderNew: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleNew: {
    fontSize: 11,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
  },
  sectionTitleLine: {
    flex: 1,
    height: 1,
    marginLeft: 16,
    backgroundColor: 'rgba(255,215,0,0.1)',
  },
  
  // Goals List
  goalsListNew: {
    // gap replaced with marginBottom on items
  },
  goalItemNew: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  goalLeftContent: {
    flex: 1,
  },
  goalNameNew: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 3,
    fontWeight: '500',
  },
  goalProgressText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  goalPercentageBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalPercentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
  },
  
  // Wins List
  winsListNew: {
    // gap replaced with marginBottom on child items
  },
  winItem: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  winItemGold: {
    backgroundColor: 'rgba(255,215,0,0.08)',
  },
  winCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  winInfo: {
    flex: 1,
  },
  winTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  winTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  winPoints: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
  },
  
  // Highlights Grid
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  highlightCard: {
    width: '31%',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    marginHorizontal: '1%',
  },
  highlightEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  highlightValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    marginBottom: 4,
  },
  highlightLabel: {
    fontSize: 10,
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.5)',
  },
  
  // Timeline
  timeline: {
    // gap replaced with marginBottom on child items
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    marginRight: 16,
  },
  timelineText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  timelineTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  
  emptyText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    padding: 20,
  },
  
  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
  },
  fabPressed: {
    transform: [{ scale: 1.1 }, { rotate: '90deg' }],
  },
  fabText: {
    fontSize: 24,
    fontWeight: '300',
    color: '#000',
  },
});