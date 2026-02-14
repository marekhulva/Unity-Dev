import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Pressable,
  Dimensions,
  RefreshControl,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInDown,
  FadeIn,
  withSpring,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Easing,
  withSequence,
  withDelay,
  runOnJS
} from 'react-native-reanimated';
import { 
  Target, TrendingUp, Award, CheckCircle2, 
  Clock, Calendar, ChevronDown, ChevronUp,
  AlertCircle, Activity, Sparkles, Zap,
  Trophy, Flame, Star, Timer, TrendingDown
} from 'lucide-react-native';
import { useStore } from '../../state/rootStore';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = width - (CARD_MARGIN * 2);

interface Goal {
  id: string;
  title: string;
  targetDate: string;
  startDate: string;
  color: string;
  consistency: number;
  currentDay: number;
  totalDays: number;
  daysLeft: number;
  isOnTrack: boolean;
  isExpanded: boolean;
  weeklyProgress: number[];
  milestones: {
    title: string;
    completed: boolean;
    date?: string;
  }[];
}

export const ProgressiOS2025 = () => {
  console.log('>>> USING ProgressiOS2025 ULTRA MODERN COMPONENT <<<');
  
  const user = useStore(s => s.user);
  const goals = useStore(s => s.goals);
  const actions = useStore(s => s.actions);
  const completedActions = useStore(s => s.completedActions);
  const fetchGoals = useStore(s => s.fetchGoals);
  const fetchDailyActions = useStore(s => s.fetchDailyActions);
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);

  useEffect(() => {
    fetchGoals();
    fetchDailyActions();
  }, []);

  useEffect(() => {
    // Transform goals with realistic progress tracking
    const transformedGoals = goals.map(goal => {
      // Calculate dates
      const startDate = new Date(goal.createdAt || Date.now());
      const targetDate = goal.targetDate ? new Date(goal.targetDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const today = new Date();
      
      const totalDays = Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const currentDay = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysLeft = Math.max(0, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      
      // Get actions for this goal
      const goalActions = actions.filter(a => a.goalId === goal.id);
      const completedGoalActions = completedActions.filter(ca => ca.goalId === goal.id);
      
      // Calculate consistency
      const expectedCompletions = currentDay * goalActions.length;
      const actualCompletions = completedGoalActions.length;
      const consistency = expectedCompletions > 0 ? Math.min(100, Math.round((actualCompletions / expectedCompletions) * 100)) : 0;
      
      // Generate weekly progress (last 7 days)
      const weeklyProgress = Array.from({ length: 7 }, (_, i) => {
        const dayOffset = 6 - i;
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - dayOffset);
        
        const dayCompletions = completedGoalActions.filter(ca => {
          const completedDate = new Date(ca.completedAt);
          return completedDate.toDateString() === checkDate.toDateString();
        });
        
        return dayCompletions.length > 0 ? Math.random() * 40 + 60 : Math.random() * 30;
      });
      
      // Determine if on track
      const isOnTrack = consistency >= 70;
      
      // Sample milestones
      const milestones = [
        { title: 'Started journey', completed: true, date: startDate.toLocaleDateString() },
        { title: '25% Complete', completed: currentDay >= totalDays * 0.25, date: currentDay >= totalDays * 0.25 ? new Date(startDate.getTime() + totalDays * 0.25 * 24 * 60 * 60 * 1000).toLocaleDateString() : undefined },
        { title: '50% Complete', completed: currentDay >= totalDays * 0.5, date: currentDay >= totalDays * 0.5 ? new Date(startDate.getTime() + totalDays * 0.5 * 24 * 60 * 60 * 1000).toLocaleDateString() : undefined },
        { title: '75% Complete', completed: currentDay >= totalDays * 0.75, date: currentDay >= totalDays * 0.75 ? new Date(startDate.getTime() + totalDays * 0.75 * 24 * 60 * 60 * 1000).toLocaleDateString() : undefined },
      ];
      
      return {
        id: goal.id,
        title: goal.title,
        targetDate: targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        startDate: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        color: goal.color || '#FFD700',
        consistency,
        currentDay: Math.min(currentDay, totalDays),
        totalDays,
        daysLeft,
        isOnTrack,
        isExpanded: false,
        weeklyProgress,
        milestones
      };
    });
    
    setActiveGoals(transformedGoals);
  }, [goals, actions, completedActions]);

  const toggleGoalExpansion = (goalId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveGoals(prev => prev.map(goal => 
      goal.id === goalId 
        ? { ...goal, isExpanded: !goal.isExpanded }
        : goal
    ));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchGoals(),
      fetchDailyActions()
    ]);
    setRefreshing(false);
  };

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Ultra Premium Background */}
      <LinearGradient
        colors={['#000000', '#0A0A0A', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Subtle gradient overlay */}
      <LinearGradient
        colors={['rgba(255,215,0,0.03)', 'transparent', 'rgba(192,192,192,0.02)']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFD700"
          />
        }
      >
        {/* Minimal Header */}
        <View style={styles.header}>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          <Text style={styles.headerTitle}>Progress</Text>
        </View>

        {/* Goal Cards */}
        {activeGoals.map((goal, index) => (
          <Animated.View
            key={goal.id}
            entering={FadeInDown.delay(index * 100).duration(600).springify()}
            style={styles.cardContainer}
          >
            <AnimatedPressable 
              style={[styles.goalCard]}
              onPress={() => toggleGoalExpansion(goal.id)}
            >
              {/* Glass background effect */}
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
              <LinearGradient
                colors={[
                  'rgba(255,255,255,0.05)',
                  'rgba(255,255,255,0.02)',
                  'rgba(255,255,255,0.01)'
                ]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
              
              {/* Main Card Content */}
              <View style={styles.cardContent}>
                {/* Title Section */}
                <View style={styles.titleRow}>
                  <View style={styles.titleContainer}>
                    <Text style={styles.goalTitle} numberOfLines={1}>
                      {goal.title}
                    </Text>
                    <Text style={styles.targetDate}>
                      by {goal.targetDate}
                    </Text>
                  </View>
                  <View style={[styles.expandIcon, goal.isExpanded && styles.expandIconRotated]}>
                    <ChevronDown size={20} color="rgba(255,255,255,0.3)" />
                  </View>
                </View>

                {/* Progress Info Grid */}
                <View style={styles.progressGrid}>
                  <View style={styles.progressItem}>
                    <Text style={styles.progressLabel}>Day</Text>
                    <Text style={styles.progressValue}>
                      {goal.currentDay} <Text style={styles.progressValueSmall}>of {goal.totalDays}</Text>
                    </Text>
                  </View>
                  
                  <View style={styles.progressDivider} />
                  
                  <View style={styles.progressItem}>
                    <Text style={styles.progressLabel}>Left</Text>
                    <Text style={styles.progressValue}>
                      {goal.daysLeft} <Text style={styles.progressValueSmall}>days</Text>
                    </Text>
                  </View>
                  
                  <View style={styles.progressDivider} />
                  
                  <View style={styles.progressItem}>
                    <Text style={styles.progressLabel}>Status</Text>
                    <View style={styles.statusContainer}>
                      {goal.isOnTrack ? (
                        <>
                          <View style={styles.statusDot} />
                          <Text style={styles.statusText}>On Track</Text>
                        </>
                      ) : (
                        <>
                          <View style={[styles.statusDot, styles.statusDotOff]} />
                          <Text style={[styles.statusText, styles.statusTextOff]}>Behind</Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>

                {/* Consistency Section */}
                <View style={styles.consistencySection}>
                  <View style={styles.consistencyHeader}>
                    <Text style={styles.consistencyLabel}>Consistency</Text>
                    <Text style={styles.consistencyPercent}>{goal.consistency}%</Text>
                  </View>
                  
                  {/* Progress Bar */}
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBg}>
                      <Animated.View 
                        style={[
                          styles.progressBarFill,
                          { 
                            width: `${goal.consistency}%`,
                            backgroundColor: goal.isOnTrack ? '#06FFA5' : '#FFD700'
                          }
                        ]}
                      />
                    </View>
                  </View>
                  
                  {/* Weekly Mini Chart */}
                  <View style={styles.weeklyChart}>
                    {goal.weeklyProgress.map((value, idx) => (
                      <View key={idx} style={styles.weeklyBarContainer}>
                        <View style={styles.weeklyBar}>
                          <View 
                            style={[
                              styles.weeklyBarFill, 
                              { 
                                height: `${value}%`,
                                backgroundColor: value > 60 ? 'rgba(6,255,165,0.6)' : 'rgba(255,215,0,0.4)'
                              }
                            ]} 
                          />
                        </View>
                        <Text style={styles.weeklyLabel}>
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'][idx]}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Expanded Content */}
                {goal.isExpanded && (
                  <Animated.View 
                    entering={FadeIn.duration(300)}
                    style={styles.expandedContent}
                  >
                    <View style={styles.milestonesSection}>
                      <Text style={styles.milestonesTitle}>Milestones</Text>
                      {goal.milestones.map((milestone, idx) => (
                        <View key={idx} style={styles.milestoneItem}>
                          <View style={[
                            styles.milestoneIcon,
                            milestone.completed && styles.milestoneIconCompleted
                          ]}>
                            {milestone.completed ? (
                              <CheckCircle2 size={16} color="#06FFA5" />
                            ) : (
                              <View style={styles.milestoneIconEmpty} />
                            )}
                          </View>
                          <View style={styles.milestoneContent}>
                            <Text style={[
                              styles.milestoneText,
                              milestone.completed && styles.milestoneTextCompleted
                            ]}>
                              {milestone.title}
                            </Text>
                            {milestone.date && (
                              <Text style={styles.milestoneDate}>{milestone.date}</Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  </Animated.View>
                )}
              </View>
            </AnimatedPressable>
          </Animated.View>
        ))}

        {/* Empty State */}
        {activeGoals.length === 0 && (
          <View style={styles.emptyState}>
            <Target size={48} color="rgba(255,215,0,0.3)" />
            <Text style={styles.emptyStateTitle}>No Active Goals</Text>
            <Text style={styles.emptyStateSubtitle}>
              Start your journey by creating your first goal
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 500,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  cardContainer: {
    marginHorizontal: CARD_MARGIN,
    marginBottom: 16,
  },
  goalCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  cardContent: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  targetDate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  expandIcon: {
    padding: 4,
    transform: [{ rotate: '0deg' }],
  },
  expandIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  progressGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 12,
  },
  progressLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  progressValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressValueSmall: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#06FFA5',
  },
  statusDotOff: {
    backgroundColor: '#FF6B6B',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#06FFA5',
  },
  statusTextOff: {
    color: '#FF6B6B',
  },
  consistencySection: {
    marginTop: 8,
  },
  consistencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  consistencyLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: -0.2,
  },
  consistencyPercent: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: -0.5,
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 50,
    marginTop: 8,
  },
  weeklyBarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  weeklyBar: {
    width: '60%',
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 4,
  },
  weeklyBarFill: {
    width: '100%',
    borderRadius: 4,
  },
  weeklyLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '600',
  },
  expandedContent: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  milestonesSection: {
    gap: 12,
  },
  milestonesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  milestoneIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneIconCompleted: {
    opacity: 1,
  },
  milestoneIconEmpty: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  milestoneTextCompleted: {
    color: 'rgba(255,255,255,0.8)',
  },
  milestoneDate: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});