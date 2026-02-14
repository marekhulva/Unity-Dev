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
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useStore } from '../../state/rootStore';
import { HapticButton } from '../../ui/HapticButton';
// import { ConfettiView } from '../../ui/ConfettiView';  // Removed for subtlety
import { DailyReviewModal } from './DailyReviewModalEnhanced';
import { ActionItem } from './ActionItem';
import { GoalCard } from './GoalCard';
// Using the standard PrivacySelectionModal (now contains two-option version)
import { PrivacySelectionModal } from './PrivacySelectionModal';
import { SocialSharePrompt } from '../social/SocialSharePrompt';
import { ShareComposer } from '../social/ShareComposer';
import { EmptyState } from '../../ui/EmptyState';
import { LuxuryTheme } from '../../design/luxuryTheme';
import { Sparkles, Zap, Trophy, TrendingUp, Clock, Calendar, Target, CheckCircle2, Circle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { HapticManager } from '../../utils/haptics';

const { width, height } = Dimensions.get('window');

export const DailyScreenV2 = () => {
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
  const allCompleted = actions.length > 0 && completed === actions.length;
  
  // Animations
  const pulseAnimation = useSharedValue(0);
  const progressAnimation = useSharedValue(0);
  
  // Calculate streak (mock data for now)
  const currentStreak = 7;
  const bestStreak = 21;
  
  // Initialize animations
  useEffect(() => {
    progressAnimation.value = withSpring(progress, { damping: 15 });
  }, [progress]);
  
  // Continuous pulse for review button
  useEffect(() => {
    pulseAnimation.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressAnimation.value}%`,
  }));

  const handleRetry = async () => {
    try {
      await fetchDailyActions();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh actions. Please try again.');
    }
  };
  
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
      category: 'fitness', // Could be dynamic based on goal
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
    <View style={styles.container}>
      {/* Pure Black Background */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000' }]} />
      
      {/* Top Pinned Card - Similar to SocialScreenV6 */}
      <View style={styles.pinnedHeader}>
        {/* Black background with subtle border */}
        <View style={styles.headerContent}>
          {/* Date Display on the left */}
          <View style={styles.dateSection}>
            <Text style={styles.todayLabel}>TODAY</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </View>
          
          {/* Progress Section on the right */}
          <View style={styles.progressSection}>
            {/* Task count */}
            <View style={styles.taskCount}>
              <Text style={styles.taskCountText}>
                <Text style={styles.taskCountCompleted}>{completed}</Text>
                <Text style={styles.taskCountDivider}> / </Text>
                <Text style={styles.taskCountTotal}>{actions.length}</Text>
              </Text>
              <Text style={styles.taskCountLabel}>TASKS</Text>
            </View>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarTrack}>
                <Animated.View 
                  style={[
                    styles.progressBarFill,
                    progressBarStyle,
                    progress === 100 && styles.progressBarFillComplete
                  ]}
                >
                  <LinearGradient
                    colors={progress === 100 
                      ? ['#22C55E', '#10B981'] 
                      : ['#FFD700', '#FFA500']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </Animated.View>
              </View>
              <Text style={[
                styles.progressPercentage,
                progress === 100 && styles.progressPercentageComplete
              ]}>
                {Math.round(progress)}%
              </Text>
            </View>
          </View>
        </View>
        
        {/* Gold underline like in SocialScreenV6 */}
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
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[
          styles.scrollContent,
          { 
            paddingTop: 120, // Space for pinned header
            paddingBottom: insets.bottom + 180 // Dynamic bottom padding for review button
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Goals Section - Only show if user has goals - DISABLED */}
        {false && goals.length > 0 && (
          <View style={styles.goalsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ACTIVE GOALS</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{goals.length}</Text>
              </View>
            </View>
            
            <View style={styles.goalsList}>
              {/* Real goals */}
              {goals.slice(0, 3).map((goal, index) => {
                // Calculate progress for each goal
                const goalActions = actions.filter(a => a.goalId === goal.id);
                const goalCompleted = goalActions.filter(a => a.done).length;
                const goalProgress = goalActions.length > 0 
                  ? (goalCompleted / goalActions.length) * 100 
                  : 0;
                
                // Calculate days (example: using deadline)
                const startDate = new Date(goal.deadline);
                startDate.setDate(startDate.getDate() - 30); // Assume 30-day goals
                const currentDate = new Date();
                const totalDays = 30;
                const daysPassed = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                const currentDay = Math.min(Math.max(daysPassed, 1), totalDays);
                
                return (
                  <Animated.View
                    key={goal.id}
                    entering={FadeInDown.delay(100 + index * 50).springify()}
                    style={{ marginBottom: 12 }}
                  >
                    <GoalCard
                      title={goal.title}
                      currentDay={currentDay}
                      totalDays={totalDays}
                      progressPercent={goalProgress}
                      onPress={() => {
                        // Navigate to goal details or progress screen
                        HapticManager.interaction.tap();
                      }}
                    />
                  </Animated.View>
                );
              })}
            </View>
          </View>
        )}
        
        {/* Tasks Section */}
        <View style={styles.actionsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TODAY'S MISSION</Text>
            {actions.length > 0 && (
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{completed}/{actions.length}</Text>
              </View>
            )}
          </View>
          
          {actions.length > 0 ? (
            <View style={styles.actionsList}>
              {actions
                .sort((a, b) => {
                  // Sort by time (earliest first)
                  if (!a.time && !b.time) return 0;
                  if (!a.time) return 1; // Actions without time go to the end
                  if (!b.time) return -1;
                  
                  // Convert time strings (HH:MM) to comparable numbers
                  const timeA = a.time.split(':').map(Number);
                  const timeB = b.time.split(':').map(Number);
                  const minutesA = timeA[0] * 60 + timeA[1];
                  const minutesB = timeB[0] * 60 + timeB[1];
                  
                  return minutesA - minutesB;
                })
                .map((action, index) => (
                <Animated.View
                  key={action.id}
                  entering={FadeInDown.delay(250 + index * 30).springify()}
                >
                  <Pressable
                    style={[styles.taskPill, action.done && styles.taskPillDone]}
                    onPress={() => handleTaskToggle(action)}
                  >
                    {/* Checkbox with ripple animation */}
                    <View style={styles.taskCheckbox}>
                      {action.done ? (
                        <CheckCircle2 size={22} color="#FFD700" />
                      ) : (
                        <Circle size={22} color="rgba(255, 255, 255, 0.3)" />
                      )}
                    </View>
                    
                    {/* Task content */}
                    <View style={styles.taskContent}>
                      <Text style={[styles.taskTitle, action.done && styles.taskTitleDone]} numberOfLines={1}>
                        {action.title}
                      </Text>
                      {action.goalTitle && (
                        <View style={styles.taskGoalPill}>
                          <Text style={styles.taskGoalText}>{action.goalTitle}</Text>
                        </View>
                      )}
                    </View>
                    
                    {/* Time pill */}
                    {action.time && (
                      <View style={styles.taskTimePill}>
                        <Clock size={12} color="#FFD700" />
                        <Text style={styles.taskTimeText}>{formatTime(action.time)}</Text>
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

      </ScrollView>

      {/* Review CTA - Pinned to Bottom */}
      <Animated.View 
        entering={FadeInDown.delay(400).springify()}
        style={styles.reviewContainerPinned}
      >
        <HapticButton 
          onPress={openReview} 
          style={styles.reviewButton}
          hapticType="medium"
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500', '#FFD700']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.reviewButtonContent}>
            <Text style={styles.reviewText}>Review Your Day</Text>
            <Text style={styles.reviewSubtext}>Reflect & Celebrate</Text>
          </View>
          {/* Pulse animation overlay */}
          <Animated.View style={[styles.reviewPulse, useAnimatedStyle(() => ({
            opacity: interpolate(
              pulseAnimation.value,
              [0, 1],
              [0.3, 0]
            ),
            transform: [{
              scale: interpolate(
                pulseAnimation.value,
                [0, 1],
                [1, 1.05]
              )
            }]
          }))]} />
        </HapticButton>
      </Animated.View>

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
      {/* Removed confetti for more subtle completion */}
      
      {/* Privacy Selection Modal for task completion */}
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
    </View>
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
    paddingHorizontal: 8, // Reduced from 16 to 8 for wider cards
  },
  
  // Pinned Header Styles - Similar to SocialScreenV6
  pinnedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#000000',
    paddingTop: 50, // Safe area for status bar
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 60,
  },
  dateSection: {
    flex: 1,
  },
  todayLabel: {
    fontSize: 11,
    color: 'rgba(255, 215, 0, 0.7)',
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  progressSection: {
    alignItems: 'flex-end',
    gap: 8,
  },
  taskCount: {
    alignItems: 'flex-end',
  },
  taskCountText: {
    fontSize: 18,
    fontWeight: '700',
  },
  taskCountCompleted: {
    color: '#FFD700',
  },
  taskCountDivider: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  taskCountTotal: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  taskCountLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 2,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarTrack: {
    width: 100,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFillComplete: {
    // Green color applied via LinearGradient
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  progressPercentageComplete: {
    color: '#22C55E',
  },
  headerUnderline: {
    height: 1,
    width: '100%',
  },
  
  // Goals Section
  goalsContainer: {
    marginBottom: 8,
  },
  goalsList: {
    marginTop: 8,
  },
  
  // Actions Section
  actionsContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  actionsList: {
    gap: 8,
  },
  
  // Task Pills
  taskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  taskPillDone: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  taskCheckbox: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
    gap: 6,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  taskTitleDone: {
    color: 'rgba(255, 255, 255, 0.5)',
    textDecorationLine: 'line-through',
  },
  taskGoalPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  taskGoalText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFD700',
  },
  taskTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  taskTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
  },
  
  // Review Button
  reviewContainerPinned: {
    position: 'absolute',
    bottom: 85, // Height of tab bar
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#000000',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 215, 0, 0.1)',
  },
  reviewButton: {
    height: 64,
    borderRadius: 16,
    backgroundColor: '#FFD700',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  reviewButtonContent: {
    alignItems: 'center',
    zIndex: 2,
  },
  reviewText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  reviewSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.7)',
    letterSpacing: 0.3,
  },
  reviewPulse: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFD700',
    borderRadius: 16,
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