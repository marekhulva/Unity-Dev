import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  runOnJS,
} from 'react-native-reanimated';
import {
  Trophy,
  Star,
  Heart,
  Target,
  Sparkles,
  ChevronRight,
  X,
  CheckCircle,
  Circle,
} from 'lucide-react-native';
import { useStore } from '../../state/rootStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface MissedAction {
  id: string;
  title: string;
  goalTitle?: string;
  completed?: boolean;
  missReason?: string;
}

interface ReviewAnswers {
  biggestWin: string;
  keyInsight: string;
  gratitude: string;
}

export const DailyReviewModal: React.FC = () => {
  const insets = useSafeAreaInsets();
  const isOpen = useStore(s => s.isDailyReviewOpen);
  const close = useStore(s => s.closeDailyReview);
  const actions = useStore(s => s.actions);
  const toggleAction = useStore(s => s.toggleAction);

  // Ref for cleanup
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debug logging
  useEffect(() => {
    if (__DEV__) console.log('🔴 [DAILY REVIEW MODAL] isOpen changed:', isOpen);
  }, [isOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Daily review backend integration
  const initializeReview = useStore(s => s.initializeTodayReview);
  const saveReviewProgress = useStore(s => s.saveReviewProgress);
  const currentReview = useStore(s => s.currentReview);

  const [currentStep, setCurrentStep] = useState(0);
  const [missedActionIndex, setMissedActionIndex] = useState(0);
  const [missedActions, setMissedActions] = useState<MissedAction[]>([]);
  const [reviewAnswers, setReviewAnswers] = useState<ReviewAnswers>({
    biggestWin: '',
    keyInsight: '',
    gratitude: '',
  });
  const [totalPoints, setTotalPoints] = useState(0);

  const slideAnimation = useSharedValue(0);
  const progressAnimation = useSharedValue(0);
  
  // Calculate progress
  const completedCount = actions.filter(a => a.done).length;
  const totalCount = actions.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  
  // Initialize missed actions and review when modal opens
  useEffect(() => {
    if (isOpen) {
      const missed = actions.filter(a => !a.done).map(a => ({
        id: a.id,
        title: a.title,
        goalTitle: a.goalTitle,
        completed: false,
        missReason: '',
      }));
      setMissedActions(missed);
      setCurrentStep(missed.length > 0 ? 0 : 1);
      setMissedActionIndex(0);
      setTotalPoints(0);
      setReviewAnswers({
        biggestWin: '',
        keyInsight: '',
        gratitude: '',
      });
      slideAnimation.value = withSpring(1);
      progressAnimation.value = withTiming(0);
      
      // Initialize today's review in the backend
      initializeReview();
    } else {
      slideAnimation.value = withSpring(0);
    }
  }, [isOpen]);
  
  // Update progress bar
  useEffect(() => {
    const totalSteps = missedActions.length > 0 ? 4 : 3;
    const progress = currentStep / totalSteps;
    progressAnimation.value = withTiming(progress);
  }, [currentStep, missedActions.length]);
  
  const handleMissedActionResponse = (completed: boolean) => {
    const updatedActions = [...missedActions];
    updatedActions[missedActionIndex] = {
      ...updatedActions[missedActionIndex],
      completed,
    };
    setMissedActions(updatedActions);
    
    if (completed) {
      setTotalPoints(prev => prev + 10);
      toggleAction(updatedActions[missedActionIndex].id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };
  
  const handleNextMissedAction = () => {
    if (missedActionIndex < missedActions.length - 1) {
      setMissedActionIndex(missedActionIndex + 1);
    } else {
      setCurrentStep(1);
      setTotalPoints(prev => prev + 20);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      setTotalPoints(prev => prev + 15);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      handleComplete();
    }
  };
  
  const handleComplete = async () => {
    setTotalPoints(prev => prev + 50);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Save to backend
    const finalPoints = totalPoints + 50;
    const success = await saveReviewProgress(
      {
        biggestWin: reviewAnswers.biggestWin,
        keyInsight: reviewAnswers.keyInsight,
        gratitude: reviewAnswers.gratitude,
      },
      missedActions.map(action => ({
        actionId: action.id,
        actionTitle: action.title,
        goalTitle: action.goalTitle,
        markedComplete: action.completed || false,
        missReason: action.missReason,
      })),
      {
        totalActions: totalCount,
        completedActions: completedCount,
        completionPercentage,
        pointsEarned: finalPoints,
      }
    );
    
    if (success) {
      if (__DEV__) console.log('✅ [REVIEW] Review saved successfully!');

      // Only schedule close if save succeeded
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = setTimeout(() => {
        close();
      }, 1500);
    } else {
      if (__DEV__) console.error('❌ [REVIEW] Failed to save review');
      // Don't auto-close on failure - let user retry
    }
  };
  
  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: slideAnimation.value,
    transform: [
      {
        scale: interpolate(
          slideAnimation.value,
          [0, 1],
          [0.95, 1]
        ),
      },
    ],
  }));
  
  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressAnimation.value * 100}%`,
  }));
  
  const getStepTitle = () => {
    if (currentStep === 0 && missedActions.length > 0) {
      return `Review Missed Actions (${missedActionIndex + 1}/${missedActions.length})`;
    }
    const titles = [
      'Review Missed',
      'Biggest Win Today 🏆',
      'Key Insight 💡',
      'Gratitude 💖',
    ];
    return titles[currentStep];
  };
  
  const getStepColor = () => {
    const colors = ['#FF6B6B', '#FFD700', '#4ECDC4', '#FF6B9D', '#95E1D3', '#A8E6CF'];
    return colors[currentStep % colors.length];
  };
  
  // Test with simple content first
  if (isOpen) {
    if (__DEV__) console.log('🔴 [DAILY REVIEW MODAL] Modal should be visible now');
  }

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={close}
      onShow={() => { if (__DEV__) console.log('🔴 [DAILY REVIEW MODAL] Modal onShow fired'); }}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContainer, modalAnimatedStyle]}>
          <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardView}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
              {/* Background gradient */}
              <LinearGradient
                colors={['#000', '#1A1A1A', '#000']}
                style={StyleSheet.absoluteFillObject}
              />
              
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Text style={styles.headerTitle}>Daily Review</Text>
                  <Text style={styles.headerSubtitle}>{getStepTitle()}</Text>
                </View>
                <Pressable
                  style={styles.closeButton}
                  onPress={close}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <X size={24} color="rgba(255,255,255,0.6)" />
                </Pressable>
              </View>
              
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                  <Animated.View 
                    style={[
                      styles.progressBarFill,
                      progressBarStyle,
                      { backgroundColor: getStepColor() }
                    ]}
                  />
                </View>
                <View style={styles.progressStats}>
                  <Text style={styles.progressText}>
                    {completedCount}/{totalCount} Actions Complete
                  </Text>
                  <Text style={styles.pointsText}>
                    {totalPoints} pts earned
                  </Text>
                </View>
              </View>
              
              {/* Content Area */}
              <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Step 0: Missed Actions */}
                {currentStep === 0 && missedActions.length > 0 && (
                  <Animated.View entering={FadeIn} style={styles.cardContainer}>
                    <View style={styles.glassCard}>
                      <BlurView intensity={20} style={StyleSheet.absoluteFillObject} />
                      <LinearGradient
                        colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                        style={StyleSheet.absoluteFillObject}
                      />
                      
                      <View style={styles.cardContent}>
                        <View style={styles.actionHeader}>
                          <Circle size={20} color={getStepColor()} />
                          <Text style={styles.actionTitle}>
                            {missedActions[missedActionIndex].title}
                          </Text>
                        </View>
                        
                        {missedActions[missedActionIndex].goalTitle && (
                          <Text style={styles.actionGoal}>
                            Goal: {missedActions[missedActionIndex].goalTitle}
                          </Text>
                        )}
                        
                        <Text style={styles.questionText}>Did you actually complete this?</Text>
                        
                        <View style={styles.buttonRow}>
                          <Pressable
                            style={[
                              styles.optionButton,
                              missedActions[missedActionIndex].completed && styles.optionButtonActive
                            ]}
                            onPress={() => handleMissedActionResponse(true)}
                          >
                            <CheckCircle size={20} color={missedActions[missedActionIndex].completed ? '#4ECDC4' : 'rgba(255,255,255,0.4)'} />
                            <Text style={styles.optionButtonText}>Yes, I did it!</Text>
                          </Pressable>
                          
                          <Pressable
                            style={[
                              styles.optionButton,
                              missedActions[missedActionIndex].completed === false && styles.optionButtonActive
                            ]}
                            onPress={() => handleMissedActionResponse(false)}
                          >
                            <Circle size={20} color={missedActions[missedActionIndex].completed === false ? '#FF6B6B' : 'rgba(255,255,255,0.4)'} />
                            <Text style={styles.optionButtonText}>Missed it</Text>
                          </Pressable>
                        </View>
                        
                        {missedActions[missedActionIndex].completed === false && (
                          <TextInput
                            style={styles.textInput}
                            placeholder="What got in the way? (optional)"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={missedActions[missedActionIndex].missReason}
                            onChangeText={(text) => {
                              const updated = [...missedActions];
                              updated[missedActionIndex].missReason = text;
                              setMissedActions(updated);
                            }}
                            multiline
                            numberOfLines={3}
                          />
                        )}
                      </View>
                    </View>
                  </Animated.View>
                )}
                
                {/* Step 1: Biggest Win */}
                {currentStep === 1 && (
                  <Animated.View entering={FadeIn} style={styles.cardContainer}>
                    <View style={styles.glassCard}>
                      <BlurView intensity={20} style={StyleSheet.absoluteFillObject} />
                      <LinearGradient
                        colors={['rgba(255,215,0,0.08)', 'rgba(255,215,0,0.02)']}
                        style={StyleSheet.absoluteFillObject}
                      />
                      
                      <View style={styles.cardContent}>
                        <Trophy size={32} color="#FFD700" style={styles.stepIcon} />
                        <Text style={styles.promptText}>What was your biggest win today?</Text>
                        <TextInput
                          style={styles.largeTextInput}
                          placeholder="Celebrate your victory..."
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          value={reviewAnswers.biggestWin}
                          onChangeText={(text) => setReviewAnswers(prev => ({ ...prev, biggestWin: text }))}
                          multiline
                          numberOfLines={4}
                          autoFocus
                        />
                      </View>
                    </View>
                  </Animated.View>
                )}
                
                {/* Step 2: Key Insight */}
                {currentStep === 2 && (
                  <Animated.View entering={FadeIn} style={styles.cardContainer}>
                    <View style={styles.glassCard}>
                      <BlurView intensity={20} style={StyleSheet.absoluteFillObject} />
                      <LinearGradient
                        colors={['rgba(78,205,196,0.08)', 'rgba(78,205,196,0.02)']}
                        style={StyleSheet.absoluteFillObject}
                      />
                      
                      <View style={styles.cardContent}>
                        <Sparkles size={32} color="#4ECDC4" style={styles.stepIcon} />
                        <Text style={styles.promptText}>What key insight did you gain?</Text>
                        <TextInput
                          style={styles.largeTextInput}
                          placeholder="What did you learn..."
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          value={reviewAnswers.keyInsight}
                          onChangeText={(text) => setReviewAnswers(prev => ({ ...prev, keyInsight: text }))}
                          multiline
                          numberOfLines={4}
                          autoFocus
                        />
                      </View>
                    </View>
                  </Animated.View>
                )}
                
                {/* Step 3: Gratitude */}
                {currentStep === 3 && (
                  <Animated.View entering={FadeIn} style={styles.cardContainer}>
                    <View style={styles.glassCard}>
                      <BlurView intensity={20} style={StyleSheet.absoluteFillObject} />
                      <LinearGradient
                        colors={['rgba(255,107,157,0.08)', 'rgba(255,107,157,0.02)']}
                        style={StyleSheet.absoluteFillObject}
                      />
                      
                      <View style={styles.cardContent}>
                        <Heart size={32} color="#FF6B9D" style={styles.stepIcon} />
                        <Text style={styles.promptText}>What are you grateful for?</Text>
                        <TextInput
                          style={styles.largeTextInput}
                          placeholder="Express your gratitude..."
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          value={reviewAnswers.gratitude}
                          onChangeText={(text) => setReviewAnswers(prev => ({ ...prev, gratitude: text }))}
                          multiline
                          numberOfLines={4}
                          autoFocus
                        />
                        
                        {/* Summary Card - moved here from step 5 */}
                        <View style={styles.summaryCard}>
                          <Text style={styles.summaryTitle}>Today's Summary</Text>
                          <View style={styles.summaryStats}>
                            <View style={styles.statItem}>
                              <Text style={styles.statValue}>{completionPercentage.toFixed(0)}%</Text>
                              <Text style={styles.statLabel}>Complete</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                              <Text style={styles.statValue}>{totalPoints}</Text>
                              <Text style={styles.statLabel}>Points</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                )}
                
                {/* Removed Step 4: Tomorrow's Focus */}
                {false && currentStep === 4 && (
                  <Animated.View entering={FadeIn} style={styles.cardContainer}>
                    <View style={styles.glassCard}>
                      <BlurView intensity={20} style={StyleSheet.absoluteFillObject} />
                      <LinearGradient
                        colors={['rgba(149,225,211,0.08)', 'rgba(149,225,211,0.02)']}
                        style={StyleSheet.absoluteFillObject}
                      />
                      
                      <View style={styles.cardContent}>
                        <Target size={32} color="#95E1D3" style={styles.stepIcon} />
                        <Text style={styles.promptText}>What will you focus on tomorrow?</Text>
                        <TextInput
                          style={styles.largeTextInput}
                          placeholder="Tomorrow's priorities..."
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          value={reviewAnswers.tomorrowFocus}
                          onChangeText={(text) => setReviewAnswers(prev => ({ ...prev, tomorrowFocus: text }))}
                          multiline
                          numberOfLines={4}
                          autoFocus
                        />
                      </View>
                    </View>
                  </Animated.View>
                )}
                
                {/* Removed Step 5: Intention */}
                {false && currentStep === 5 && (
                  <Animated.View entering={FadeIn} style={styles.cardContainer}>
                    <View style={styles.glassCard}>
                      <BlurView intensity={20} style={StyleSheet.absoluteFillObject} />
                      <LinearGradient
                        colors={['rgba(168,230,207,0.08)', 'rgba(168,230,207,0.02)']}
                        style={StyleSheet.absoluteFillObject}
                      />
                      
                      <View style={styles.cardContent}>
                        <Star size={32} color="#A8E6CF" style={styles.stepIcon} />
                        <Text style={styles.promptText}>Set your intention for tomorrow</Text>
                        <TextInput
                          style={styles.largeTextInput}
                          placeholder="I will..."
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          value={reviewAnswers.intention}
                          onChangeText={(text) => setReviewAnswers(prev => ({ ...prev, intention: text }))}
                          multiline
                          numberOfLines={4}
                          autoFocus
                        />
                        
                        {/* Summary Card */}
                        <View style={styles.summaryCard}>
                          <Text style={styles.summaryTitle}>Today's Summary</Text>
                          <View style={styles.summaryStats}>
                            <View style={styles.statItem}>
                              <Text style={styles.statValue}>{completionPercentage.toFixed(0)}%</Text>
                              <Text style={styles.statLabel}>Complete</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                              <Text style={styles.statValue}>{totalPoints}</Text>
                              <Text style={styles.statLabel}>Points</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                )}
              </ScrollView>
              
              {/* Bottom Action Button */}
              <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
                {currentStep === 0 && missedActions.length > 0 ? (
                  <Pressable
                    style={[styles.primaryButton, { backgroundColor: getStepColor() }]}
                    onPress={handleNextMissedAction}
                    disabled={missedActions[missedActionIndex].completed === undefined}
                  >
                    <Text style={styles.primaryButtonText}>
                      {missedActionIndex < missedActions.length - 1 ? 'Next Action' : 'Continue'}
                    </Text>
                    <ChevronRight size={20} color="#FFFFFF" />
                  </Pressable>
                ) : (
                  <Pressable
                    style={[styles.primaryButton, { backgroundColor: getStepColor() }]}
                    onPress={currentStep === 5 ? handleComplete : handleNextStep}
                  >
                    <Text style={styles.primaryButtonText}>
                      {currentStep === 5 ? 'Complete Review' : 'Continue'}
                    </Text>
                    <ChevronRight size={20} color="#FFFFFF" />
                  </Pressable>
                )}
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: Math.min(width - 40, 380),  // Max width 380px for iPhone
    maxHeight: height * 0.75,  // Max 75% of screen height
    backgroundColor: '#000',
    borderRadius: 24,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  pointsText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cardContainer: {
    marginTop: 12,
  },
  glassCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  cardContent: {
    padding: 16,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
    flex: 1,
  },
  actionGoal: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 20,
    marginLeft: 32,
  },
  questionText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  optionButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  textInput: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#FFFFFF',
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  stepIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  promptText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  largeTextInput: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 60,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  summaryCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,215,0,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});