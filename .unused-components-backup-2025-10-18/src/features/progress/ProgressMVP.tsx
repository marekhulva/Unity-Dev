import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  FadeInDown,
  FadeIn,
  Easing,
} from 'react-native-reanimated';
import { 
  Target, Trophy, Flame, Calendar, CheckCircle, 
  Circle, ChevronDown, ChevronUp, AlertCircle, Clock
} from 'lucide-react-native';
import { useStore } from '../../state/rootStore';
import { LuxuryTheme } from '../../design/luxuryTheme';
import Svg, { Circle as SvgCircle } from 'react-native-svg';

const { width } = Dimensions.get('window');

export const ProgressMVP = () => {
  const goals = useStore(s => s.goals);
  const actions = useStore(s => s.actions);
  const completedActions = useStore(s => s.completedActions);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  
  // SECTION 1: Calculate overall metrics
  const totalActionsThisWeek = actions.length * 7; // Assuming 7 days
  const completedThisWeek = actions.filter(a => a.done).length;
  const overallConsistency = totalActionsThisWeek > 0 
    ? Math.round((completedThisWeek / totalActionsThisWeek) * 100) 
    : 0;
  
  // Calculate total score (checked actions + streaks + milestones)
  const streakBonus = actions.reduce((sum, a) => sum + (a.streak || 0), 0) * 5;
  const milestoneBonus = goals.length * 100; // Each goal represents milestones
  const actionPoints = completedThisWeek * 10;
  const totalScore = actionPoints + streakBonus + milestoneBonus;
  
  // Animation values for dual ring
  const outerRingAnim = useSharedValue(0);
  const innerRingAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.9);
  
  React.useEffect(() => {
    // Animate the rings on mount
    outerRingAnim.value = withTiming(overallConsistency / 100, { 
      duration: 1500,
      easing: Easing.out(Easing.cubic)
    });
    innerRingAnim.value = withTiming(Math.min(totalScore / 1000, 1), { 
      duration: 1800,
      easing: Easing.out(Easing.cubic)
    });
    scaleAnim.value = withSpring(1, { damping: 12 });
  }, [overallConsistency, totalScore]);
  
  const dualRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));
  
  // Calculate the animated values directly
  const [outerProgress, setOuterProgress] = useState(0);
  const [innerProgress, setInnerProgress] = useState(0);
  
  React.useEffect(() => {
    // Animate the progress values
    const timer1 = setTimeout(() => {
      setOuterProgress(overallConsistency);
    }, 100);
    
    const timer2 = setTimeout(() => {
      setInnerProgress(Math.min((totalScore / 1000) * 100, 100));
    }, 300);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [overallConsistency, totalScore]);
  
  const toggleGoalExpansion = (goalId: string) => {
    setExpandedGoal(expandedGoal === goalId ? null : goalId);
  };
  
  // Helper functions for goal-specific data
  const getGoalConsistency = (goalId: string) => {
    // In real app, would calculate based on goal-specific actions
    return 75 + Math.floor(Math.random() * 20); // Mock 75-95%
  };
  
  const getGoalStreak = (goalId: string) => {
    return Math.floor(Math.random() * 15) + 1; // Mock 1-15 days
  };
  
  const getMilestoneProgress = (goalId: string) => {
    return {
      current: 2,
      total: 5,
      next: "Complete 14 consecutive days",
      progress: 40,
    };
  };
  
  const getScheduledActions = (goalTitle: string) => {
    // Mock scheduled actions based on goal
    const schedules: Record<string, any[]> = {
      default: [
        { day: 'Mon', action: 'Morning Routine', time: '7:00 AM', completed: true },
        { day: 'Wed', action: 'Skill Practice', time: '6:00 PM', completed: true },
        { day: 'Fri', action: 'Intensive Session', time: '5:00 PM', completed: false },
        { day: 'Sun', action: 'Review & Plan', time: '10:00 AM', completed: false },
      ]
    };
    
    return schedules.default;
  };
  
  const getCommitments = (goalTitle: string) => {
    return [
      { title: 'Training Sessions', frequency: '3x/week', current: 2, total: 3 },
      { title: 'Weekend Practice', frequency: 'Every Saturday', completed: true },
      { title: 'Monthly Assessment', frequency: '1st Sunday', completed: false },
    ];
  };
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#0A0A0A', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION 1: Dual Ring Widget - At-a-glance Performance */}
        <Animated.View 
          style={[styles.topSection, dualRingStyle]}
          entering={FadeInDown.duration(600).springify()}
        >
          <BlurView intensity={20} tint="dark" style={styles.topSectionInner}>
            <LinearGradient
              colors={['rgba(255,215,0,0.03)', 'rgba(255,255,255,0.01)']}
              style={StyleSheet.absoluteFillObject}
            />
            
            {/* Dual Ring Visual */}
            <View style={styles.dualRingContainer}>
              <Svg width={200} height={200} style={styles.svgContainer}>
                {/* Background rings */}
                <SvgCircle
                  cx="100"
                  cy="100"
                  r="70"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="12"
                  fill="none"
                />
                <SvgCircle
                  cx="100"
                  cy="100"
                  r="55"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="8"
                  fill="none"
                />
                
                {/* Outer Ring - Consistency % */}
                <SvgCircle
                  cx="100"
                  cy="100"
                  r="70"
                  stroke="#FFD700"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray="440"
                  strokeDashoffset={440 - (440 * outerProgress) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 100 100)"
                  style={{
                    transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
                
                {/* Inner Ring - Total Score */}
                <SvgCircle
                  cx="100"
                  cy="100"
                  r="55"
                  stroke="#C0C0C0"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray="345"
                  strokeDashoffset={345 - (345 * innerProgress) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 100 100)"
                  style={{
                    transition: 'stroke-dashoffset 1.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </Svg>
              
              {/* Center Metrics Display */}
              <View style={styles.centerMetrics}>
                <Text style={styles.consistencyValue}>{overallConsistency}%</Text>
                <Text style={styles.consistencyLabel}>CONSISTENCY</Text>
                <View style={styles.metricDivider} />
                <Text style={styles.scoreValue}>{totalScore}</Text>
                <Text style={styles.scoreLabel}>TOTAL SCORE</Text>
              </View>
            </View>
            
            {/* Design Philosophy Labels */}
            <View style={styles.philosophyRow}>
              <View style={styles.philosophyItem}>
                <Text style={styles.philosophyEmoji}>🎯</Text>
                <Text style={styles.philosophyText}>Pride Metric</Text>
              </View>
              <View style={styles.philosophyDivider} />
              <View style={styles.philosophyItem}>
                <Text style={styles.philosophyEmoji}>🎮</Text>
                <Text style={styles.philosophyText}>Gamified Score</Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>
        
        {/* SECTION 2: Active Goal Cards */}
        <View style={styles.goalsSection}>
          <Text style={styles.sectionTitle}>ACTIVE GOALS</Text>
          
          {goals.map((goal, index) => {
            const isExpanded = expandedGoal === goal.id;
            const goalConsistency = getGoalConsistency(goal.id);
            const goalStreak = getGoalStreak(goal.id);
            const milestones = getMilestoneProgress(goal.id);
            const scheduledActions = getScheduledActions(goal.title);
            const commitments = getCommitments(goal.title);
            
            return (
              <Animated.View
                key={goal.id}
                entering={FadeInDown.delay(100 + index * 50).springify()}
                style={styles.goalCard}
              >
                <BlurView intensity={15} tint="dark" style={styles.goalCardInner}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.02)', 'transparent']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  
                  {/* Goal Header */}
                  <Pressable 
                    onPress={() => toggleGoalExpansion(goal.id)}
                    style={styles.goalHeader}
                  >
                    <View style={styles.goalTitleRow}>
                      <View style={[styles.goalColorDot, { backgroundColor: goal.color }]} />
                      <Text style={styles.goalName}>{goal.title}</Text>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={20} color="rgba(255,255,255,0.5)" />
                    ) : (
                      <ChevronDown size={20} color="rgba(255,255,255,0.5)" />
                    )}
                  </Pressable>
                  
                  {/* Milestone Tracker */}
                  <View style={styles.milestoneSection}>
                    <View style={styles.milestoneHeader}>
                      <Text style={styles.milestoneLabel}>
                        Milestones: {milestones.current}/{milestones.total} achieved
                      </Text>
                      <Trophy size={14} color="#FFD700" />
                    </View>
                    <View style={styles.milestoneBar}>
                      <LinearGradient
                        colors={[goal.color, goal.color + '80']}
                        style={[styles.milestoneFill, { width: `${milestones.progress}%` }]}
                      />
                    </View>
                    <Text style={styles.nextMilestone}>Next: {milestones.next}</Text>
                  </View>
                  
                  {/* Goal Metrics Row */}
                  <View style={styles.goalMetricsRow}>
                    <View style={styles.goalMetric}>
                      <Text style={styles.goalMetricValue}>{goalConsistency}%</Text>
                      <Text style={styles.goalMetricLabel}>Consistency</Text>
                    </View>
                    <View style={styles.goalMetricDivider} />
                    <View style={styles.goalMetric}>
                      <Flame size={16} color="#FFD700" />
                      <Text style={styles.goalMetricValue}>{goalStreak}</Text>
                      <Text style={styles.goalMetricLabel}>Streak</Text>
                    </View>
                  </View>
                  
                  {/* Weekly Calendar Strip */}
                  <View style={styles.weekCalendar}>
                    <Text style={styles.weekLabel}>THIS WEEK</Text>
                    <View style={styles.weekDays}>
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                        const hasAction = i === 0 || i === 2 || i === 4 || i === 6;
                        const isCompleted = i < 3;
                        const isMissed = i === 3 && hasAction;
                        
                        return (
                          <View key={i} style={styles.dayContainer}>
                            <Text style={styles.dayText}>{day}</Text>
                            <View style={[
                              styles.dayIndicator,
                              hasAction && styles.dayScheduled,
                              isCompleted && styles.dayCompleted,
                              isMissed && styles.dayMissed,
                            ]}>
                              {isCompleted && hasAction && (
                                <CheckCircle size={12} color="#06FFA5" />
                              )}
                              {isMissed && (
                                <AlertCircle size={12} color="#FF6B6B" />
                              )}
                              {hasAction && !isCompleted && !isMissed && (
                                <Circle size={12} color="rgba(255,255,255,0.3)" />
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                  
                  {/* SECTION 3: Expandable Commitments & Actions */}
                  {isExpanded && (
                    <Animated.View 
                      entering={FadeIn.duration(200)}
                      style={styles.expandedSection}
                    >
                      <View style={styles.expandedDivider} />
                      
                      {/* Scheduled Actions */}
                      <View style={styles.scheduledSection}>
                        <Text style={styles.expandedTitle}>📅 Scheduled Actions</Text>
                        {scheduledActions.map((item, idx) => (
                          <View key={idx} style={styles.scheduledItem}>
                            <View style={styles.scheduledLeft}>
                              <Text style={styles.scheduledDay}>{item.day}</Text>
                              <Text style={styles.scheduledTime}>{item.time}</Text>
                            </View>
                            <Text style={styles.scheduledAction}>{item.action}</Text>
                            {item.completed ? (
                              <CheckCircle size={16} color="#06FFA5" />
                            ) : (
                              <Circle size={16} color="rgba(255,255,255,0.3)" />
                            )}
                          </View>
                        ))}
                      </View>
                      
                      {/* Commitments */}
                      <View style={styles.commitmentsSection}>
                        <Text style={styles.expandedTitle}>🎯 Commitments</Text>
                        {commitments.map((commitment, idx) => (
                          <View key={idx} style={styles.commitmentItem}>
                            <View style={styles.commitmentLeft}>
                              <Text style={styles.commitmentTitle}>{commitment.title}</Text>
                              <Text style={styles.commitmentFrequency}>{commitment.frequency}</Text>
                            </View>
                            {commitment.current !== undefined ? (
                              <View style={styles.commitmentProgress}>
                                <Text style={styles.commitmentProgressText}>
                                  {commitment.current}/{commitment.total}
                                </Text>
                              </View>
                            ) : (
                              commitment.completed ? (
                                <CheckCircle size={16} color="#06FFA5" />
                              ) : (
                                <Clock size={16} color="#FFD700" />
                              )
                            )}
                          </View>
                        ))}
                      </View>
                      
                      {/* Narrative Metric */}
                      <View style={styles.narrativeSection}>
                        <Text style={styles.narrativeText}>
                          📈 You're building momentum - {goalStreak} days strong!
                        </Text>
                      </View>
                    </Animated.View>
                  )}
                </BlurView>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
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
    padding: 16,
    paddingBottom: 100,
  },
  
  // SECTION 1: Top Section - Dual Ring
  topSection: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  topSectionInner: {
    padding: 24,
    alignItems: 'center',
  },
  dualRingContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  svgContainer: {
    position: 'absolute',
  },
  centerMetrics: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  consistencyValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: -1,
  },
  consistencyLabel: {
    fontSize: 10,
    color: 'rgba(255,215,0,0.7)',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  metricDivider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 8,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#C0C0C0',
  },
  scoreLabel: {
    fontSize: 10,
    color: 'rgba(192,192,192,0.7)',
    fontWeight: '700',
    letterSpacing: 1,
  },
  philosophyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  philosophyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  philosophyEmoji: {
    fontSize: 16,
  },
  philosophyText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  philosophyDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  
  // SECTION 2: Goals Section
  goalsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  goalCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  goalCardInner: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  goalColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Milestone Section
  milestoneSection: {
    marginBottom: 16,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  milestoneLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  milestoneBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  milestoneFill: {
    height: '100%',
    borderRadius: 3,
  },
  nextMilestone: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
  },
  
  // Goal Metrics
  goalMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  goalMetric: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  goalMetricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
  },
  goalMetricLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
  },
  goalMetricDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  
  // Weekly Calendar
  weekCalendar: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 10,
    padding: 10,
  },
  weekLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayContainer: {
    alignItems: 'center',
    gap: 6,
  },
  dayText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  dayIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayScheduled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dayCompleted: {
    backgroundColor: 'rgba(6,255,165,0.1)',
  },
  dayMissed: {
    backgroundColor: 'rgba(255,107,107,0.1)',
  },
  
  // SECTION 3: Expanded Content
  expandedSection: {
    marginTop: 16,
  },
  expandedDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 16,
  },
  expandedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  
  // Scheduled Actions
  scheduledSection: {
    marginBottom: 16,
  },
  scheduledItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
    marginBottom: 6,
  },
  scheduledLeft: {
    width: 60,
  },
  scheduledDay: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
  },
  scheduledTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },
  scheduledAction: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 12,
  },
  
  // Commitments
  commitmentsSection: {
    marginBottom: 16,
  },
  commitmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
    marginBottom: 6,
  },
  commitmentLeft: {
    flex: 1,
  },
  commitmentTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  commitmentFrequency: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  commitmentProgress: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  commitmentProgressText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  
  // Narrative Section
  narrativeSection: {
    backgroundColor: 'rgba(255,215,0,0.05)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
  },
  narrativeText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    textAlign: 'center',
  },
});