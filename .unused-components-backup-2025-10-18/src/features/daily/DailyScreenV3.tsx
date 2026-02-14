import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
  FadeInDown,
  FadeIn,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useStore } from '../../state/rootStore';
import { RadialProgress } from '../../ui/RadialProgress';
import { HapticButton } from '../../ui/HapticButton';
import { DailyReviewModal } from './DailyReviewModalEnhanced';
import { ActionItem } from './ActionItem';
import { GoalCard } from './GoalCard';
import { PrivacySelectionModal } from './PrivacySelectionModal';
import { SocialSharePrompt } from '../social/SocialSharePrompt';
import { ShareComposer } from '../social/ShareComposer';
import { EmptyState } from '../../ui/EmptyState';
import { LuxuryTheme } from '../../design/luxuryTheme';
import { Sparkles, Zap, Trophy, TrendingUp, Clock, Calendar, Target, CheckCircle2, Circle, Crown, Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { HapticManager } from '../../utils/haptics';

const { width, height } = Dimensions.get('window');

export const DailyScreenV3 = () => {
  const insets = useSafeAreaInsets();
  const actions = useStore(s=>s.actions);
  const goals = useStore(s=>s.goals);
  const actionsLoading = useStore(s=>s.actionsLoading);
  const actionsError = useStore(s=>s.actionsError);
  const fetchDailyActions = useStore(s=>s.fetchDailyActions);
  const openOnboarding = useStore(s=>s.openOnboarding);
  const toggleAction = useStore(s=>s.toggleAction);
  const openShare = useStore(s=>s.openShare);
  const addCompletedAction = useStore(s=>s.addCompletedAction);
  const completed = actions.filter(a=>a.done).length;
  const progress = actions.length ? (completed/actions.length)*100 : 0;
  const openReview = useStore(s=>s.openDailyReview);
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [justCompleted, setJustCompleted] = useState(false);
  const allCompleted = actions.length > 0 && completed === actions.length;
  
  // Animations
  const progressAnimation = useSharedValue(0);
  const ringGlowAnimation = useSharedValue(0);
  const sparkleAnimation = useSharedValue(0);
  const crownAnimation = useSharedValue(0);
  const reviewButtonGlow = useSharedValue(0);
  const checkmarkAnimations = useRef<{ [key: string]: Animated.SharedValue<number> }>({});
  
  // Calculate streak
  const currentStreak = 7;
  
  // Animate progress smoothly
  useEffect(() => {
    progressAnimation.value = withTiming(progress, {
      duration: 1000,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    
    // If we just hit 100%, trigger celebrations
    if (progress === 100 && !justCompleted) {
      setJustCompleted(true);
      
      // Subtle ring glow pulse
      ringGlowAnimation.value = withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0, { duration: 800 })
      );
      
      // Sparkle animation around the ring
      sparkleAnimation.value = withSequence(
        withTiming(1, { duration: 400 }),
        withDelay(200, withTiming(0, { duration: 1000 }))
      );
      
      // Crown animation
      crownAnimation.value = withSpring(1, { damping: 8 });
      
      // Review button glow pulse (2 times then stop)
      reviewButtonGlow.value = withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 500 }),
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 500 })
      );
      
      HapticManager.context.actionCompleted();
    } else if (progress < 100) {
      setJustCompleted(false);
      crownAnimation.value = withTiming(0, { duration: 300 });
    }
  }, [progress]);

  // Progress ring glow style
  const ringGlowStyle = useAnimatedStyle(() => ({
    opacity: ringGlowAnimation.value,
  }));
  
  // Sparkle positions around the ring
  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleAnimation.value,
    transform: [
      { scale: interpolate(sparkleAnimation.value, [0, 1], [0.5, 1]) }
    ],
  }));
  
  // Crown animation style
  const crownStyle = useAnimatedStyle(() => ({
    opacity: crownAnimation.value,
    transform: [
      { scale: crownAnimation.value },
      { translateY: interpolate(crownAnimation.value, [0, 1], [10, 0]) }
    ],
  }));
  
  // Review button glow
  const reviewButtonGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(reviewButtonGlow.value, [0, 1], [0, 0.4]),
    shadowRadius: interpolate(reviewButtonGlow.value, [0, 1], [0, 20]),
  }));

  const formatTime = (time?: string) => {
    if (!time) return undefined;
    const parts = time.split(':');
    let hours = parseInt(parts[0]);
    const minutes = parts[1];
    if (isNaN(hours)) return time;
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${period}`;
  };

  const handleTaskToggle = (action: any) => {
    if (!action.done) {
      // Show privacy modal when completing an action
      setSelectedAction(action);
      setShowPrivacyModal(true);
      HapticManager.interaction.premiumPress();
      
      // Animate checkmark
      if (!checkmarkAnimations.current[action.id]) {
        checkmarkAnimations.current[action.id] = {
          value: withSequence(
            withSpring(1.2, { damping: 8 }),
            withSpring(1, { damping: 15 })
          )
        };
      }
    } else {
      // Allow unchecking
      toggleAction(action.id);
      HapticManager.interaction.tap();
    }
  };

  const handlePrivacySelect = (visibility: 'public' | 'private', contentType: 'photo' | 'audio' | 'text' | 'check') => {
    if (!selectedAction) return;
    
    // Mark action as complete
    toggleAction(selectedAction.id);
    HapticManager.context.actionCompleted();
    
    // Map content type to action type
    const actionType = contentType === 'photo' ? 'photo' : 
                      contentType === 'audio' ? 'audio' : 
                      contentType === 'text' ? 'milestone' :
                      'check';
    
    // Generate mock media URL for photos (in real app, would capture actual photo)
    const mediaUrl = contentType === 'photo' 
      ? `https://picsum.photos/400/400?random=${Date.now()}` 
      : undefined;
    
    // Store the completed action with privacy setting and content type
    addCompletedAction({
      id: `${selectedAction.id}-${Date.now()}`,
      actionId: selectedAction.id,
      title: selectedAction.title,
      goalTitle: selectedAction.goalTitle,
      completedAt: new Date(),
      isPrivate: visibility === 'private',
      streak: selectedAction.streak || 0,
      type: actionType,
      mediaUrl,
      category: 'fitness',
    });
    
    // If public and not just a check, trigger share modal
    if (visibility === 'public' && contentType !== 'check') {
      setTimeout(() => {
        openShare({
          type: 'checkin',
          visibility: 'circle',
          actionTitle: selectedAction.title,
          goal: selectedAction.goalTitle,
          streak: selectedAction.streak || 0,
          goalColor: selectedAction.goalColor || LuxuryTheme.colors.primary.gold,
          contentType,
        });
      }, 500);
    }
    
    setShowPrivacyModal(false);
    setSelectedAction(null);
  };

  const handleRetry = async () => {
    try {
      await fetchDailyActions();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh actions. Please try again.');
    }
  };

  // Show error state if there's an error
  if (actionsError && !actionsLoading) {
    return (
      <View style={styles.container}>
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000' }]} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorMessage}>{actionsError}</Text>
          <Pressable style={styles.retryButton} onPress={handleRetry}>
            <LinearGradient
              colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Pure Black Background */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000' }]} />
      
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
        {/* Date Display */}
        <Animated.View 
          entering={FadeInDown.duration(500).springify()}
          style={styles.greetingContainer}
        >
          <Text style={styles.todayLabel}>TODAY</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
        </Animated.View>

        {/* 1. HERO CARD - Daily Progress with Subtle Celebrations */}
        <Animated.View 
          entering={FadeInDown.delay(100).springify()}
          style={styles.heroCard}
        >
          {/* Dark glass background */}
          <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFillObject} />
          
          {/* Subtle radial glow when complete */}
          {progress === 100 && (
            <Animated.View style={[styles.radialGlow, ringGlowStyle]}>
              <LinearGradient
                colors={['rgba(34, 197, 94, 0.1)', 'transparent']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0.5, y: 0.5 }}
                end={{ x: 0, y: 0 }}
              />
            </Animated.View>
          )}
          
          {/* Progress Ring Container */}
          <View style={styles.progressContainer}>
            {/* Sparkles around the ring when complete */}
            {progress === 100 && (
              <>
                <Animated.View style={[styles.sparkle, styles.sparkleTop, sparkleStyle]}>
                  <Star size={16} color="#FFD700" />
                </Animated.View>
                <Animated.View style={[styles.sparkle, styles.sparkleRight, sparkleStyle]}>
                  <Sparkles size={14} color="#FFD700" />
                </Animated.View>
                <Animated.View style={[styles.sparkle, styles.sparkleLeft, sparkleStyle]}>
                  <Star size={12} color="#FFD700" />
                </Animated.View>
              </>
            )}
            
            {/* Main Progress Ring */}
            <RadialProgress 
              progress={progressAnimation.value} 
              size={120} 
              strokeWidth={6}
              color={progress === 100 ? '#22C55E' : '#FFFFFF'}
            />
            
            {/* Center Content */}
            <View style={styles.progressCenter}>
              {progress === 100 ? (
                <>
                  <LinearGradient
                    colors={['#22C55E', '#10B981']}
                    style={styles.percentageGradient}
                  >
                    <Text style={styles.percentageComplete}>100%</Text>
                  </LinearGradient>
                  <Animated.View style={[styles.crownContainer, crownStyle]}>
                    <Crown size={20} color="#FFD700" />
                  </Animated.View>
                </>
              ) : (
                <Text style={styles.percentageText}>{Math.round(progress)}%</Text>
              )}
            </View>
          </View>
          
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completed}</Text>
              <Text style={styles.statLabel}>Done</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.streakValue]}>{currentStreak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{actions.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </Animated.View>

        {/* 2. ACTIVE GOALS Section - Subtle Glow and Badges */}
        {goals.length > 0 && (
          <View style={styles.goalsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ACTIVE GOALS</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{goals.length}</Text>
              </View>
            </View>
            
            <View style={styles.goalsList}>
              {goals.slice(0, 3).map((goal, index) => {
                const goalActions = actions.filter(a => a.goalId === goal.id);
                const goalCompleted = goalActions.filter(a => a.done).length;
                const goalProgress = goalActions.length > 0 
                  ? (goalCompleted / goalActions.length) * 100 
                  : 0;
                const isComplete = goalProgress === 100;
                
                return (
                  <Animated.View
                    key={goal.id}
                    entering={FadeInDown.delay(200 + index * 50).springify()}
                    style={[
                      styles.goalCard,
                      isComplete && styles.goalCardComplete
                    ]}
                  >
                    <BlurView intensity={5} tint="dark" style={StyleSheet.absoluteFillObject} />
                    
                    <View style={styles.goalContent}>
                      <View style={styles.goalHeader}>
                        <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
                        {isComplete && (
                          <Animated.View 
                            entering={FadeIn.delay(200)}
                            style={styles.completeBadge}
                          >
                            <CheckCircle2 size={16} color="#FFD700" />
                          </Animated.View>
                        )}
                      </View>
                      
                      <Text style={styles.goalDays}>Day 1 of 30</Text>
                      
                      {/* Progress Bar with Shimmer */}
                      <View style={styles.goalProgressBar}>
                        <Animated.View 
                          style={[
                            styles.goalProgressFill,
                            { width: `${goalProgress}%` }
                          ]}
                        >
                          <LinearGradient
                            colors={isComplete ? ['#FFD700', '#FFA500'] : ['#FFD700', '#FFC04D']}
                            style={StyleSheet.absoluteFillObject}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                          />
                          {isComplete && (
                            <Animated.View 
                              entering={FadeIn.delay(400)}
                              style={styles.progressShimmer}
                            />
                          )}
                        </Animated.View>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        )}
        
        {/* 3. TODAY'S MISSION - Clean Checklist Style */}
        <View style={styles.tasksSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TODAY'S MISSION</Text>
            {actions.length > 0 && (
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{completed}/{actions.length}</Text>
              </View>
            )}
          </View>
          
          {actions.length > 0 ? (
            <View style={styles.tasksList}>
              {actions
                .sort((a, b) => {
                  if (!a.time && !b.time) return 0;
                  if (!a.time) return 1;
                  if (!b.time) return -1;
                  return a.time.localeCompare(b.time);
                })
                .map((action, index) => (
                <Animated.View
                  key={action.id}
                  entering={FadeInDown.delay(300 + index * 30).springify()}
                >
                  <Pressable
                    style={[styles.taskItem, action.done && styles.taskItemDone]}
                    onPress={() => handleTaskToggle(action)}
                  >
                    {/* Animated Checkbox */}
                    <View style={styles.taskCheckbox}>
                      {action.done ? (
                        <Animated.View
                          entering={FadeIn.duration(300)}
                          style={styles.checkmarkContainer}
                        >
                          <CheckCircle2 size={22} color="#22C55E" />
                        </Animated.View>
                      ) : (
                        <Circle size={22} color="rgba(255, 255, 255, 0.2)" strokeWidth={1.5} />
                      )}
                    </View>
                    
                    {/* Task Content */}
                    <View style={styles.taskContent}>
                      <Text style={[styles.taskTitle, action.done && styles.taskTitleDone]} numberOfLines={1}>
                        {action.title}
                      </Text>
                      {action.goalTitle && (
                        <Text style={[styles.taskGoalText, action.done && styles.taskGoalTextDone]}>
                          {action.goalTitle}
                        </Text>
                      )}
                    </View>
                    
                    {/* Time Pill */}
                    {action.time && (
                      <View style={[styles.taskTimePill, action.done && styles.taskTimePillDone]}>
                        <Clock size={11} color={action.done ? 'rgba(255, 255, 255, 0.3)' : '#FFD700'} />
                        <Text style={[styles.taskTimeText, action.done && styles.taskTimeTextDone]}>
                          {formatTime(action.time)}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          ) : (
            <EmptyState
              icon={Target}
              title="Ready to Start Your Day?"
              subtitle="Add your first daily action to begin building powerful habits"
              actionText="Start Onboarding"
              onAction={openOnboarding}
              illustration="glow"
              theme="gold"
            />
          )}
        </View>

        {/* 4. REVIEW DAY BUTTON - Elegant Glass with Subtle Glow */}
        <Animated.View 
          entering={FadeInDown.delay(400).springify()}
          style={styles.reviewContainer}
        >
          <Animated.View style={[styles.reviewButtonGlow, reviewButtonGlowStyle]} />
          <HapticButton 
            onPress={openReview} 
            style={styles.reviewButton}
            hapticType="medium"
          >
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
            <LinearGradient
              colors={['transparent', 'transparent']}
              style={[StyleSheet.absoluteFillObject, styles.reviewButtonBorder]}
            />
            <View style={styles.reviewButtonContent}>
              <Text style={styles.reviewText}>Review Your Day</Text>
              {allCompleted && (
                <Animated.Text 
                  entering={FadeIn.delay(500)}
                  style={styles.reviewSubtext}
                >
                  Reflect & Celebrate
                </Animated.Text>
              )}
            </View>
          </HapticButton>
        </Animated.View>
      </ScrollView>

      <DailyReviewModal />
      <SocialSharePrompt
        visible={showSharePrompt}
        onClose={() => setShowSharePrompt(false)}
        progress={progress}
        completedActions={completed}
        totalActions={actions.length}
        streak={currentStreak}
      />
      <ShareComposer />
      
      {/* Privacy Selection Modal */}
      <PrivacySelectionModal
        visible={showPrivacyModal}
        onClose={() => {
          setShowPrivacyModal(false);
          setSelectedAction(null);
        }}
        onSelect={handlePrivacySelect}
        actionTitle={selectedAction?.title || ''}
        streak={selectedAction?.streak || 0}
      />
      
      {/* Loading Overlay */}
      {actionsLoading && (
        <View style={styles.loadingOverlay}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={LuxuryTheme.colors.primary.gold} />
            <Text style={styles.loadingText}>Loading your actions...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  greetingContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  todayLabel: {
    fontSize: 11,
    color: 'rgba(255, 215, 0, 0.7)',
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  date: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  
  // Hero Card Styles
  heroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(10, 10, 12, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    alignItems: 'center',
  },
  radialGlow: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
  },
  progressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  progressCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  percentageComplete: {
    fontSize: 36,
    fontWeight: '700',
    color: 'transparent',
  },
  percentageGradient: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  crownContainer: {
    marginTop: 8,
  },
  sparkle: {
    position: 'absolute',
  },
  sparkleTop: {
    top: -10,
    left: '50%',
    marginLeft: -8,
  },
  sparkleRight: {
    right: -10,
    top: '50%',
    marginTop: -7,
  },
  sparkleLeft: {
    left: -10,
    top: '50%',
    marginTop: -6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  streakValue: {
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Goals Section
  goalsContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1.5,
  },
  sectionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  goalsList: {
    gap: 8,
  },
  goalCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(20, 20, 22, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  goalCardComplete: {
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  goalContent: {
    padding: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  completeBadge: {
    marginLeft: 8,
  },
  goalDays: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 215, 0, 0.7)',
    marginBottom: 8,
  },
  goalProgressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 3,
    position: 'relative',
  },
  progressShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  // Tasks Section
  tasksSection: {
    marginBottom: 24,
  },
  tasksList: {
    gap: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  taskItemDone: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    opacity: 0.7,
  },
  taskCheckbox: {
    marginRight: 12,
  },
  checkmarkContainer: {
    transform: [{ scale: 1 }],
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  taskTitleDone: {
    color: 'rgba(255, 255, 255, 0.5)',
    textDecorationLine: 'line-through',
  },
  taskGoalText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 215, 0, 0.6)',
  },
  taskGoalTextDone: {
    color: 'rgba(255, 215, 0, 0.3)',
  },
  taskTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  taskTimePillDone: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  taskTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFD700',
  },
  taskTimeTextDone: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  
  // Review Button
  reviewContainer: {
    marginTop: 8,
    marginBottom: 24,
    position: 'relative',
  },
  reviewButtonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFD700',
    borderRadius: 16,
    shadowColor: '#FFD700',
  },
  reviewButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    overflow: 'hidden',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  reviewButtonBorder: {
    borderRadius: 16,
  },
  reviewButtonContent: {
    alignItems: 'center',
  },
  reviewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  reviewSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 215, 0, 0.7)',
    marginTop: 2,
  },
  
  // Error & Loading
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    overflow: 'hidden',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
    fontWeight: '500',
  },
});