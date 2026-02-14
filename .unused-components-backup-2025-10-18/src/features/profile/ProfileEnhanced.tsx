import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions, Image, Alert, Platform, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  interpolate,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import {
  Trophy, Flame, Target, TrendingUp, Star,
  Award, Calendar, Users, Heart, MessageCircle,
  Lock, Camera, Mic, CheckCircle, Grid3x3,
  Bookmark, CheckCircle2, Check, X, Activity
} from 'lucide-react-native';
import { LuxuryGradientBackground } from '../../ui/LuxuryGradientBackground';
import { GoldParticles } from '../../ui/GoldParticles';
import { useStore } from '../../state/rootStore';
import { UnifiedActivityCard } from '../social/UnifiedActivityCard';
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

export const ProfileEnhanced = () => {
  console.log('>>> USING ProfileEnhanced COMPONENT <<<');
  const insets = useSafeAreaInsets();
  const user = useStore(s => s.user);
  const goals = useStore(s => s.goals);
  const circleFeed = useStore(s => s.circleFeed);
  const followFeed = useStore(s => s.followFeed);
  const completedActions = useStore(s => s.completedActions);
  const logout = useStore(s => s.logout);
  const updateAvatar = useStore(s => s.updateAvatar);
  const react = useStore(s => s.react);
  const addComment = useStore(s => s.addComment);
  const [selectedAction, setSelectedAction] = useState<GridAction | null>(null);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('Building my best self, one day at a time ✨');
  const [tempBioText, setTempBioText] = useState('');
  
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
  }, []);

  const profileGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(glowAnim.value, [0, 1], [0.3, 0.6]),
    shadowRadius: interpolate(glowAnim.value, [0, 1], [20, 35]),
  }));

  const badgeAnimation = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulseAnim.value, [0, 1], [1, 1.1]) }],
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
      <LuxuryGradientBackground variant="mixed">
        <GoldParticles variant="mixed" particleCount={15} />
        
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { 
              paddingTop: 20,
              paddingBottom: insets.bottom + 100 
            }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO SECTION - Personal Brand */}
          <Animated.View style={[styles.heroCard, profileGlowStyle, { shadowColor: LuxuryTheme.colors.primary.gold }]}>
            <BlurView intensity={40} tint="dark" style={styles.heroCardInner}>
              <LinearGradient
                colors={['rgba(255,215,0,0.1)', 'rgba(192,192,192,0.05)']}
                style={StyleSheet.absoluteFillObject}
              />
              
              {/* Avatar with luxury ring */}
              <View style={styles.avatarSection}>
                <Pressable onPress={pickImage}>
                  <LinearGradient
                    colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.silver, LuxuryTheme.colors.primary.champagne]}
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
                {/* Streak flame badge */}
                <View style={styles.streakBadge}>
                  <Flame size={16} color="#FFD700" />
                  <Text style={styles.streakNumber}>30</Text>
                </View>
              </View>

              <Text style={styles.profileName}>{user?.name || 'Achiever'}</Text>
              
              {/* Editable Bio Section */}
              <View style={styles.bioContainer}>
                {isEditingBio ? (
                  <View style={styles.bioEditContainer}>
                    <TextInput
                      style={styles.bioInput}
                      value={tempBioText}
                      onChangeText={setTempBioText}
                      placeholder="Enter your bio..."
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      multiline
                      autoFocus
                      maxLength={100}
                    />
                    <View style={styles.bioEditActions}>
                      <Pressable
                        style={styles.bioActionButton}
                        onPress={() => {
                          setIsEditingBio(false);
                          setTempBioText('');
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                      >
                        <X size={20} color="rgba(255,255,255,0.5)" />
                      </Pressable>
                      <Pressable
                        style={[styles.bioActionButton, styles.bioConfirmButton]}
                        onPress={() => {
                          setBioText(tempBioText || bioText);
                          setIsEditingBio(false);
                          setTempBioText('');
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Success);
                        }}
                      >
                        <Check size={20} color="#FFD700" />
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => {
                      setIsEditingBio(true);
                      setTempBioText(bioText);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={styles.profileBio}>{bioText}</Text>
                    <Text style={styles.bioHint}>Tap to edit</Text>
                  </Pressable>
                )}
              </View>

              {/* Achievement Badges */}
              <View style={styles.achievementRow}>
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
              </View>

            </BlurView>
          </Animated.View>

          {/* MY GOALS - User's Personal Goals */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Target size={20} color="#FFD700" />
              <Text style={styles.sectionTitle}>My Goals</Text>
            </View>

            {/* Goals List */}
            <View style={styles.goalsContainer}>
              {goals.length > 0 ? (
                goals.map((goal, index) => (
                  <Animated.View
                    key={goal.id}
                    entering={FadeInDown.delay(index * 100).springify()}
                    style={styles.goalCard}
                  >
                    <BlurView intensity={20} tint="dark" style={styles.goalCardInner}>
                      <LinearGradient
                        colors={['rgba(255,215,0,0.08)', 'rgba(18,23,28,0.95)']}
                        style={StyleSheet.absoluteFillObject}
                      />
                      
                      {/* Goal Header */}
                      <View style={styles.goalHeader}>
                        <View style={[styles.goalColorIndicator, { backgroundColor: goal.color || '#FFD700' }]} />
                        <Text style={styles.goalTitle}>{goal.title}</Text>
                      </View>

                      {/* Goal Details */}
                      <View style={styles.goalDetails}>
                        {goal.metric && (
                          <View style={styles.goalMetric}>
                            <TrendingUp size={14} color="rgba(255,255,255,0.6)" />
                            <Text style={styles.goalMetricText}>{goal.metric}</Text>
                          </View>
                        )}
                        {goal.deadline && (
                          <View style={styles.goalDeadline}>
                            <Calendar size={14} color="rgba(255,255,255,0.6)" />
                            <Text style={styles.goalDeadlineText}>
                              {new Date(goal.deadline).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Goal Progress */}
                      {goal.consistency !== undefined && (
                        <View style={styles.goalProgress}>
                          <View style={styles.goalProgressBar}>
                            <View 
                              style={[
                                styles.goalProgressFill,
                                { 
                                  width: `${goal.consistency}%`,
                                  backgroundColor: goal.color || '#FFD700'
                                }
                              ]} 
                            />
                          </View>
                          <Text style={styles.goalProgressText}>{goal.consistency}% Complete</Text>
                        </View>
                      )}
                    </BlurView>
                  </Animated.View>
                ))
              ) : (
                <View style={styles.emptyGoals}>
                  <Target size={40} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.emptyText}>No goals set yet</Text>
                  <Text style={styles.emptySubtext}>Head to Daily to set your first goal</Text>
                </View>
              )}
            </View>
          </View>

          {/* ACHIEVEMENT GRID - Instagram Style */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Grid3x3 size={20} color="#FFD700" />
              <Text style={styles.sectionTitle}>Achievement Gallery</Text>
              <View style={styles.gridStats}>
                <Text style={styles.gridStatsText}>
                  {allGridActions.length > 0 ? `${allGridActions.length} achievements` : 'No achievements yet'}
                </Text>
              </View>
            </View>

            {allGridActions.length === 0 ? (
              <View style={styles.emptyGallery}>
                <Camera size={48} color="rgba(255,215,0,0.3)" />
                <Text style={styles.emptyGalleryText}>
                  Complete actions and share your progress{'\n'}to build your achievement gallery
                </Text>
              </View>
            ) : (
              <View style={styles.achievementGrid}>
                {allGridActions.map((action, index) => (
                <Animated.View
                  key={action.id}
                  entering={FadeInDown.delay(index * 50).springify()}
                >
                  <Pressable
                    style={styles.gridItem}
                    onPress={() => setSelectedAction(action)}
                  >
                    {/* Background based on type */}
                    {action.type === 'photo' && action.mediaUrl ? (
                      <>
                        <Image source={{ uri: action.mediaUrl }} style={styles.gridImage} />
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.3)']}
                          style={styles.gridImageOverlay}
                        />
                      </>
                    ) : action.type === 'audio' ? (
                      <>
                        <LinearGradient
                          colors={['rgba(0,0,0,0.95)', 'rgba(18,23,28,0.9)']}
                          style={styles.gridGradient}
                        />
                        <View style={styles.gridBorder} />
                        <View style={styles.gridIconGlow}>
                          <Mic size={28} color={LuxuryTheme.colors.primary.silver} />
                        </View>
                        <Text style={styles.gridAudioDuration}>2:45</Text>
                      </>
                    ) : action.type === 'milestone' ? (
                      <>
                        <LinearGradient
                          colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
                          style={styles.gridGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        />
                        <View style={styles.gridIconContainer}>
                          <Trophy size={30} color="#000000" />
                        </View>
                        <Text style={styles.gridMilestoneText}>Day {action.streak}</Text>
                      </>
                    ) : (
                      <>
                        <LinearGradient
                          colors={['rgba(0,0,0,0.95)', 'rgba(18,23,28,0.9)']}
                          style={styles.gridGradient}
                        />
                        <View style={styles.gridBorder} />
                        <View style={styles.gridIconGlow}>
                          <CheckCircle size={28} color={LuxuryTheme.colors.primary.gold} />
                        </View>
                        <Text style={styles.gridActionTitle} numberOfLines={2}>
                          {action.title}
                        </Text>
                      </>
                    )}
                    
                    {/* Private lock icon */}
                    {action.isPrivate && (
                      <View style={styles.privateLock}>
                        <Lock size={12} color={LuxuryTheme.colors.primary.gold} />
                      </View>
                    )}
                    
                    {/* Streak badge for high streaks */}
                    {action.streak && action.streak >= 7 && (
                      <View style={styles.streakBadgeSmall}>
                        <Flame size={10} color="#FFD700" />
                        <Text style={styles.streakBadgeText}>{action.streak}</Text>
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              ))}
            </View>
            )}

            {/* View All Button */}
            <Pressable style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All Actions</Text>
            </Pressable>
          </View>

          {/* SOCIAL PROOF - Community Impact */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Users size={20} color="#E5E4E2" />
              <Text style={styles.sectionTitle}>Community Impact</Text>
            </View>

            <BlurView intensity={25} tint="dark" style={styles.impactCard}>
              <LinearGradient
                colors={['rgba(192,192,192,0.08)', 'rgba(255,215,0,0.03)']}
                style={StyleSheet.absoluteFillObject}
              />

              <View style={styles.impactGrid}>
                <View style={styles.impactItem}>
                  <Heart size={24} color="#FFD700" />
                  <Text style={styles.impactNumber}>
                    {userPosts.reduce((sum, post) => sum + Object.values(post.reactions || {}).reduce((a, b) => a + b, 0), 0)}
                  </Text>
                  <Text style={styles.impactLabel}>Inspiration Given</Text>
                </View>
                
                <View style={styles.impactItem}>
                  <MessageCircle size={24} color="#C0C0C0" />
                  <Text style={styles.impactNumber}>
                    {userPosts.reduce((sum, post) => sum + (post.commentCount || (post.comments?.length || 0)), 0)}
                  </Text>
                  <Text style={styles.impactLabel}>Supportive Comments</Text>
                </View>
                
                <View style={styles.impactItem}>
                  <Award size={24} color="#F7E7CE" />
                  <Text style={styles.impactNumber}>
                    {userPosts.filter(post => post.type === 'checkin' && post.streak && post.streak > 0).length}
                  </Text>
                  <Text style={styles.impactLabel}>Milestones Celebrated</Text>
                </View>
              </View>
            </BlurView>
          </View>

          {/* Recent Activity Section */}
          {userPosts.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Activity size={20} color="#FFD700" />
                <Text style={styles.sectionTitle}>Recent Activity</Text>
              </View>

              {userPosts.slice(0, 5).map((post) => (
                <View key={post.id} style={styles.postWrapper}>
                  <UnifiedActivityCard
                    post={post}
                    onReact={(emoji) => {
                      // Determine which feed this post belongs to
                      const which = post.visibility || 'circle';
                      react(post.id, emoji, which);
                    }}
                    onComment={(content) => {
                      // Determine which feed this post belongs to
                      const which = post.visibility || 'circle';
                      addComment(post.id, content, which);
                    }}
                    onProfilePress={(userId) => {
                      // No need to navigate since we're already on profile
                      console.log('Profile press on own post');
                    }}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Growth Visualization */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={20} color="#FFD700" />
              <Text style={styles.sectionTitle}>Growth Timeline</Text>
            </View>

            <BlurView intensity={20} tint="dark" style={styles.timelineCard}>
              <LinearGradient
                colors={['rgba(255,215,0,0.05)', 'rgba(192,192,192,0.05)']}
                style={StyleSheet.absoluteFillObject}
              />
              
              {/* Milestone Timeline */}
              <View style={styles.timeline}>
                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineDate}>Today</Text>
                    <Text style={styles.timelineEvent}>30-day meditation streak! 🧘</Text>
                  </View>
                </View>
                
                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineDate}>1 week ago</Text>
                    <Text style={styles.timelineEvent}>Completed first 5K run 🏃</Text>
                  </View>
                </View>
                
                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineDate}>1 month ago</Text>
                    <Text style={styles.timelineEvent}>Started morning routine ☀️</Text>
                  </View>
                </View>
              </View>
            </BlurView>
          </View>
        </ScrollView>
      </LuxuryGradientBackground>
      <ResetOnboardingButton />
      
      {/* Logout Button - Moved to header for better visibility */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    // paddingTop and paddingBottom are now dynamic
  },

  // Hero Section
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  heroCardInner: {
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
  },
  avatarSection: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3,
  },
  avatar: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
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
  streakBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  streakNumber: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  bioContainer: {
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  bioEditContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  bioInput: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    minHeight: 60,
  },
  bioEditActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  bioActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  bioConfirmButton: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderColor: 'rgba(255,215,0,0.3)',
  },
  bioHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
    textAlign: 'center',
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
  postWrapper: {
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
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
    gap: 4,
  },
  impactNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
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
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD700',
    marginTop: 4,
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
    gap: 2,
    marginBottom: 16,
  },
  gridItem: {
    width: 110,
    height: 110,
    backgroundColor: '#000000',
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
    top: 60,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  logoutText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
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
  // Goals styles
  goalsContainer: {
    marginBottom: 16,
  },
  goalCard: {
    marginBottom: 12,
  },
  goalCardInner: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  goalColorIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    flex: 1,
  },
  goalDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  goalMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalMetricText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  goalDeadline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalDeadlineText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  goalProgress: {
    marginTop: 8,
  },
  goalProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  goalProgressText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
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
});