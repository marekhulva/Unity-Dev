import React, { useState, useEffect } from 'react';
import { shouldActionAppearToday } from '../../../utils/actionScheduling';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  FadeInDown,
  FadeIn,
  Easing,
} from 'react-native-reanimated';
import {
  ChevronDown, Edit3, Plus
} from 'lucide-react-native';
import { useStore } from '../../../state/rootStore';
import { getLocalDateString } from '../../../utils/dateUtils';
import { LuxuryTheme } from '../../../design/luxuryTheme';
import Svg, { Circle as SvgCircle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { GoalEditModal } from '../../progress/GoalEditModal';
import { Goal } from '../../../state/slices/goalsSlice';
import { EmptyState } from '../../../ui/EmptyState';
import { Trophy } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);

export const ProgressTab = () => {
  const insets = useSafeAreaInsets();
  const goals = useStore(s => s.goals);
  const goalsLoading = useStore(s => s.goalsLoading);
  const goalsError = useStore(s => s.goalsError);
  const fetchGoals = useStore(s => s.fetchGoals);
  const fetchDailyActions = useStore(s => s.fetchDailyActions);
  const openOnboarding = useStore(s => s.openOnboarding);
  const actions = useStore(s => s.actions);
  const completedActions = useStore(s => s.completedActions);
  const toggleMilestoneComplete = useStore(s => s.toggleMilestoneComplete);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const user = useStore(s => s.user);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [goalCompletionStats, setGoalCompletionStats] = useState<Record<string, any>>({});
  const [overallStats, setOverallStats] = useState({ expected: 0, completed: 0, percentage: 0 });
  const [allGoalActions, setAllGoalActions] = useState<Record<string, any[]>>({});

  // Circle-related state
  const userCircles = useStore(s => s.userCircles);
  const activeCircleId = useStore(s => s.activeCircleId);
  const fetchUserCircles = useStore(s => s.fetchUserCircles);

  // Challenge-related state
  const activeChallenges = useStore(s => s.activeChallenges);
  const fetchMyActiveChallenges = useStore(s => s.fetchMyActiveChallenges);

  // Calculate overall metrics
  const completedToday = actions.filter(a => a.done).length;
  const totalToday = actions.length;

  // Calculate consistency based on last 7 days
  let overallConsistency = 0;
  const [weeklyStats, setWeeklyStats] = useState({ completed: 0, total: 0, percentage: 0 });

  // Fetch weekly consistency from database
  useEffect(() => {
    const fetchWeeklyConsistency = async () => {
      if (!user?.id) return;

      try {
        const { supabase } = await import('../../../services/supabase.service');
        const today = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const { data: userActions } = await supabase
          .from('actions')
          .select('*')
          .eq('user_id', user.id);

        if (!userActions || userActions.length === 0) {
          setWeeklyStats({
            completed: completedToday,
            total: totalToday,
            percentage: totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0
          });
          return;
        }

        let totalTasks = 0;
        let completedTasks = 0;

        for (let i = 0; i < 7; i++) {
          const checkDate = new Date();
          checkDate.setDate(checkDate.getDate() - i);
          checkDate.setHours(0, 0, 0, 0);
          const checkDateStr = getLocalDateString(checkDate);

          const dayActions = userActions.filter(action => {
            const createdDate = new Date(action.created_at);
            return createdDate <= checkDate;
          });

          totalTasks += dayActions.length;

          dayActions.forEach(action => {
            if (action.completed_at) {
              const completedDate = new Date(action.completed_at);
              const completedDateStr = getLocalDateString(completedDate);
              if (completedDateStr === checkDateStr) {
                completedTasks++;
              }
            }
          });
        }

        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        setWeeklyStats({
          completed: completedTasks,
          total: totalTasks,
          percentage
        });
      } catch (error) {
        if (__DEV__) console.error('Error fetching weekly consistency:', error);
        setWeeklyStats({
          completed: completedToday,
          total: totalToday,
          percentage: totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0
        });
      }
    };

    fetchWeeklyConsistency();
  }, [user?.id, actions, completedToday, totalToday]);

  overallConsistency = overallStats.expected > 0 ? overallStats.percentage : weeklyStats.percentage;

  const completedThisWeek = actions.filter(a => a.done).length;
  const topStreak = Math.max(0, ...actions.map(a => a.streak || 0));
  const streakBonus = actions.reduce((sum, a) => sum + (a.streak || 0), 0) * 5;
  const milestoneBonus = goals.length * 100;
  const actionPoints = completedThisWeek * 10;
  const totalScore = actionPoints + streakBonus + milestoneBonus;

  const formatFrequencyLabel = (frequency: string, scheduledDays?: string[]) => {
    switch (frequency) {
      case 'daily':
        return 'Daily';
      case 'every_other_day':
        return 'Every Other Day';
      case 'three_per_week':
        if (scheduledDays?.length > 0) {
          const days3x = scheduledDays.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ');
          return `3x/week (${days3x})`;
        }
        return '3x per week';
      case 'weekly':
        if (scheduledDays?.length > 0) {
          const dayWeekly = scheduledDays[0].charAt(0).toUpperCase() + scheduledDays[0].slice(1);
          return `Weekly (${dayWeekly})`;
        }
        return 'Weekly';
      case 'weekdays':
        return 'Weekdays';
      case 'weekends':
        return 'Weekends';
      default:
        return frequency ? frequency.charAt(0).toUpperCase() + frequency.slice(1).replace(/_/g, ' ') : 'Daily';
    }
  };

  // Animation values
  const outerRingAnim = useSharedValue(0);
  const innerRingAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.9);
  const glowAnim = useSharedValue(0);

  useEffect(() => {
    if (!goals || goals.length === 0) {
      fetchGoals();
    }
    fetchCompletionStats();
    fetchUserCircles();
    fetchMyActiveChallenges();
  }, []);

  useEffect(() => {
    if (activeCircleId !== undefined) {
      fetchGoals();
      fetchCompletionStats();
    }
  }, [activeCircleId]);

  useEffect(() => {
    if (goals && goals.length > 0) {
      fetchAllGoalActions();
    }
  }, [goals.length]);

  useEffect(() => {
    if (goals && goals.length > 0) {
      const timeoutId = setTimeout(() => {
        fetchAllGoalActions();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [actions.length, completedActions.length]);

  useEffect(() => {
    outerRingAnim.value = withTiming(overallConsistency / 100, {
      duration: 650,
      easing: Easing.out(Easing.cubic)
    });

    innerRingAnim.value = withDelay(100, withTiming(Math.min(totalScore / 1000, 1), {
      duration: 650,
      easing: Easing.out(Easing.cubic)
    }));

    scaleAnim.value = withSpring(1, {
      damping: 22,
      stiffness: 180
    });

    glowAnim.value = withSequence(
      withTiming(1, { duration: 400 }),
      withTiming(0.3, { duration: 600 })
    );

    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 650);
  }, [overallConsistency, totalScore]);

  const toggleGoalExpansion = (goalId: string) => {
    Haptics.selectionAsync();
    setExpandedGoal(expandedGoal === goalId ? null : goalId);
  };

  const handleEditGoal = (goal: Goal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingGoal(goal);
  };

  const handleRetryGoals = async () => {
    try {
      await fetchGoals();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh goals. Please try again.');
    }
  };

  const fetchCompletionStats = async () => {
    if (!user?.id) return;

    try {
      const { backendService } = await import('../../../services/backend.service');

      const goalStatsResponse = await backendService.getGoalCompletionStats(user.id);
      if (goalStatsResponse.success && goalStatsResponse.data) {
        setGoalCompletionStats(goalStatsResponse.data);
      }

      const overallStatsResponse = await backendService.getOverallCompletionStats(user.id);
      if (overallStatsResponse.success && overallStatsResponse.data) {
        setOverallStats(overallStatsResponse.data);
      }
    } catch (error) {
      if (__DEV__) console.log('Could not fetch completion stats:', error);
    }
  };

  const fetchAllGoalActions = async (goalId?: string) => {
    if (!user?.id) return;

    try {
      const { supabase } = await import('../../../services/supabase.service');
      const today = getLocalDateString();
      const tomorrow = getLocalDateString(new Date(Date.now() + 86400000));

      if (goalId) {
        const { data, error } = await supabase
          .from('actions')
          .select('*')
          .eq('goal_id', goalId)
          .eq('user_id', user.id);

        if (!error && data) {
          const actionIds = data.map(a => a.id);
          const { data: completionsData } = await supabase
            .from('action_completions')
            .select('action_id, completed_at')
            .in('action_id', actionIds)
            .gte('completed_at', today)
            .lt('completed_at', tomorrow);

          const completedActionIds = new Set(completionsData?.map(c => c.action_id) || []);
          const actionsWithCompletion = data.map(action => ({
            ...action,
            completed_today: completedActionIds.has(action.id)
          }));

          setAllGoalActions(prev => ({
            ...prev,
            [goalId]: actionsWithCompletion
          }));
        }
      } else if (goals.length) {
        const goalIds = goals.map(g => g.id);

        const { data: allActionsData, error: actionsError } = await supabase
          .from('actions')
          .select('*')
          .in('goal_id', goalIds)
          .eq('user_id', user.id);

        if (actionsError || !allActionsData) {
          if (__DEV__) console.error('Error fetching actions:', actionsError);
          return;
        }

        const actionIds = allActionsData.map(a => a.id);
        const { data: completionsData } = await supabase
          .from('action_completions')
          .select('action_id, completed_at')
          .in('action_id', actionIds)
          .gte('completed_at', today)
          .lt('completed_at', tomorrow);

        const completedActionIds = new Set(completionsData?.map(c => c.action_id) || []);

        const allActions: Record<string, any[]> = {};
        for (const goal of goals) {
          const goalActions = allActionsData
            .filter(a => a.goal_id === goal.id)
            .map(action => ({
              ...action,
              completed_today: completedActionIds.has(action.id)
            }));
          allActions[goal.id] = goalActions;
        }

        setAllGoalActions(allActions);
      }
    } catch (error) {
      if (__DEV__) console.log('Could not fetch all goal actions:', error);
    }
  };

  const getGoalConsistency = (goalId: string) => {
    const stats = goalCompletionStats[goalId];

    if (stats && stats.percentage !== undefined) {
      return stats.percentage;
    }

    return 0;
  };

  const getGoalStreak = (goalId: string) => {
    const goalActions = actions.filter(a => a.goalId === goalId);

    const maxStreak = goalActions.reduce((max, action) => {
      return Math.max(max, action.streak || 0);
    }, 0);

    return maxStreak;
  };

  const getMilestoneProgress = (goal: any) => {
    if (goal.milestones && goal.milestones.length > 0) {
      const milestones = goal.milestones.map((m: any, index: number) => {
        const targetDate = new Date(m.targetDate);
        const daysUntil = Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const isNext = !m.completed && goal.milestones.slice(0, index).every((prev: any) => prev.completed);

        return {
          id: m.id,
          name: m.title,
          description: m.targetValue ? `${m.targetValue} ${m.unit || ''}` : `By ${targetDate.toLocaleDateString()}`,
          requirement: daysUntil > 0 ? `${daysUntil} days remaining` : 'Due',
          achieved: m.completed,
          isNext,
          order: m.order
        };
      });

      const current = milestones.filter((m: any) => m.achieved).length;
      const next = milestones.find((m: any) => m.isNext);

      return {
        current,
        total: milestones.length,
        milestones,
        next: next ? next.name : "All milestones achieved!",
        nextRequirement: next ? next.requirement : "",
        progress: (current / milestones.length) * 100,
      };
    }

    const defaultMilestones = [
      {
        id: 'default-1',
        name: "First Week",
        description: "Complete 7 days",
        requirement: "7-day streak",
        achieved: false,
        isNext: true
      },
      {
        id: 'default-2',
        name: "Two Weeks Strong",
        description: "14 consecutive days",
        requirement: "14-day streak",
        achieved: false
      },
      {
        id: 'default-3',
        name: "Habit Formed",
        description: "21 days completed",
        requirement: "21-day streak",
        achieved: false
      },
    ];

    return {
      current: 0,
      total: defaultMilestones.length,
      milestones: defaultMilestones,
      next: defaultMilestones[0].name,
      nextRequirement: defaultMilestones[0].requirement,
      progress: 0,
    };
  };

  const getWeekSchedule = () => {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const today = new Date().getDay();
    const adjustedToday = today === 0 ? 6 : today - 1;

    return days.map((day, i) => ({
      day,
      isToday: i === adjustedToday,
      hasAction: i === 0 || i === 2 || i === 4 || i === 6,
      isCompleted: i < adjustedToday && (i === 0 || i === 2),
      isMissed: i === 3 && i < adjustedToday,
      isOptional: i === 5,
    }));
  };

  if (goalsError && !goalsLoading) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Unable to Load Goals</Text>
        <Text style={styles.errorMessage}>{goalsError}</Text>
        <Pressable style={styles.retryButton} onPress={handleRetryGoals}>
          <LinearGradient
            colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isRefreshing && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          flexDirection: 'row',
        }}>
          <ActivityIndicator size="small" color="#FFD700" />
          <Text style={{ color: '#FFD700', marginLeft: 10, fontSize: 14 }}>Refreshing...</Text>
        </View>
      )}

      {/* Consistency Badge */}
      <View style={styles.consistencyBadgeWrapper}>
        <View style={styles.consistencyBadge}>
          <Svg width={60} height={60} style={{ position: 'absolute' }}>
            <Defs>
              <SvgGradient id="goldProgress" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FFD700" />
                <Stop offset="100%" stopColor="#FFA500" />
              </SvgGradient>
            </Defs>
            <SvgCircle cx="30" cy="30" r="26" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
            <AnimatedSvgCircle
              cx="30"
              cy="30"
              r="26"
              stroke="url(#goldProgress)"
              strokeWidth="4"
              fill="none"
              strokeDasharray={2 * Math.PI * 26}
              strokeLinecap="round"
              transform="rotate(-90 30 30)"
              animatedProps={useAnimatedStyle(() => ({
                strokeDashoffset: (2 * Math.PI * 26) * (1 - outerRingAnim.value),
              }))}
            />
          </Svg>
          <View style={styles.consistencyBadgeContent}>
            <Text style={styles.consistencyBadgeValue}>{overallConsistency}%</Text>
          </View>
        </View>
        <Text style={styles.consistencyBadgeLabel}>CONSISTENCY</Text>
      </View>

      <View style={styles.goalsSection}>
        <Text style={styles.sectionTitle}>ACTIVE GOALS & ROUTINES</Text>

        {goals.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="Set Your First Goal"
            subtitle="Create meaningful goals to track your progress and celebrate achievements"
            actionText="Start Goal Setup"
            onAction={openOnboarding}
            illustration="glow"
            theme="gold"
          />
        ) : (
          goals.map((goal, index) => {
            const isExpanded = expandedGoal === goal.id;
            const goalConsistency = getGoalConsistency(goal.id);
            const goalStreak = getGoalStreak(goal.id);
            const milestones = getMilestoneProgress(goal);
            const weekSchedule = getWeekSchedule();
            const goalColor = goal.color || '#FFD700';

            const progressPercentage = goalConsistency;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const createdAt = goal.created_at ? new Date(goal.created_at) : today;
            createdAt.setHours(0, 0, 0, 0);

            const todayStart = new Date(today);
            todayStart.setHours(0, 0, 0, 0);

            const daysSinceStart = Math.floor((todayStart.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            const isRoutine = goal.type === 'routine' || (!goal.deadline || goal.deadline === '' || goal.deadline === 'null');

            let totalDays = 0;
            let daysLeft = 0;

            if (!isRoutine) {
              const deadline = new Date(goal.deadline);
              deadline.setHours(23, 59, 59, 999);

              totalDays = Math.floor((deadline.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) + 1;

              daysLeft = Math.max(0, totalDays - daysSinceStart + 1);
            }
            const currentDay = isRoutine ? daysSinceStart : Math.min(daysSinceStart, totalDays);


            return (
              <Animated.View
                key={goal.id}
                entering={FadeInDown.delay(120 + index * 60).springify()}
                style={styles.goalCard}
              >
                <Pressable
                  onPress={() => toggleGoalExpansion(goal.id)}
                  style={styles.newGoalCard}
                >
                  <LinearGradient
                    colors={['rgba(0,0,0,0.95)', 'rgba(18,23,28,0.9)']}
                    style={StyleSheet.absoluteFillObject}
                  />

                  <Text style={styles.consistencyLabel}>CONSISTENCY</Text>

                  <View style={styles.progressRingContainer}>
                    <Svg width={70} height={70}>
                      <SvgCircle
                        cx="35"
                        cy="35"
                        r="30"
                        stroke="rgba(192,192,192,0.1)"
                        strokeWidth="6"
                        fill="none"
                      />
                      <SvgCircle
                        cx="35"
                        cy="35"
                        r="30"
                        stroke="#FFD700"
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={`${(progressPercentage / 100) * 188.4} 188.4`}
                        strokeLinecap="round"
                        transform="rotate(-90 35 35)"
                      />
                    </Svg>
                    <View style={styles.progressTextContainer}>
                      <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
                    </View>
                  </View>

                  <View style={styles.goalContentLeft}>
                    <View style={styles.goalHeaderNew}>
                      <Text style={styles.goalTitleNew}>{goal.title}</Text>
                      <ChevronDown size={18} color="rgba(255,255,255,0.5)" />
                    </View>

                    <View style={styles.timeStatusContainer}>
                      <Text style={styles.timeStatusPrimary}>
                        {isRoutine ? `Day ${currentDay}` : `Day ${currentDay} of ${totalDays}`}
                      </Text>
                      {!isRoutine && (
                        <Text style={styles.timeStatusSecondary}>{daysLeft} days left</Text>
                      )}
                    </View>

                    <View style={styles.linearProgressContainer}>
                      <View style={styles.linearProgressBackground}>
                        <View
                          style={[
                            styles.linearProgressFill,
                            { width: `${progressPercentage}%` }
                          ]}
                        />
                      </View>
                    </View>

                    <View style={styles.bottomSection}>
                      <Text style={styles.tapDetailsText}>Tap to see details</Text>
                    </View>
                  </View>

                  {isExpanded && (
                    <Animated.View
                      entering={FadeIn.duration(220)}
                      style={styles.expandedContent}
                    >
                      <View style={styles.dailyActivitiesSection}>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>ALL ACTIVITIES</Text>
                          <View style={styles.sectionTitleLine} />
                          <Pressable
                            style={styles.editButton}
                            onPress={() => handleEditGoal(goal)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Edit3 size={18} color="rgba(255,215,0,0.7)" />
                          </Pressable>
                        </View>

                        {(() => {
                          const goalActions = allGoalActions[goal.id] || [];

                          const goalCreatedAt = goal.created_at ? new Date(goal.created_at) : new Date();
                          const todayForActions = new Date();
                          const daysSinceGoalStart = Math.max(1, Math.ceil((todayForActions.getTime() - goalCreatedAt.getTime()) / (1000 * 60 * 60 * 24)));

                          if (goalActions.length === 0) {
                            return (
                              <View style={styles.noActivitiesContainer}>
                                <Text style={styles.noActivitiesText}>
                                  No activities linked to this goal yet
                                </Text>
                              </View>
                            );
                          }

                          return goalActions.map((action, index) => {
                            const actionCompletions = completedActions.filter(ca =>
                              ca.actionId === action.id || ca.title === action.title
                            );

                            const actualStreak = action.streak || 0;

                            const actionDaysSinceStart = Math.max(1, daysSinceGoalStart);

                            const shouldAppearToday = shouldActionAppearToday({
                              frequency: action.frequency || 'daily',
                              scheduledDays: action.scheduled_days,
                              created_at: action.created_at
                            });

                            let actionConsistency = 0;
                            if (shouldAppearToday) {
                              actionConsistency = action.completed_today ? 100 : 0;
                            } else {
                              actionConsistency = 0;
                            }

                            const circumference = 138.2;
                            const strokeDashoffset = circumference * (1 - actionConsistency / 100);

                            const displayStreak = actualStreak > 0 ? actualStreak : (action.completed_today ? 1 : 0);

                            return (
                              <View
                                key={action.id}
                                style={styles.activityItem}
                              >
                                <View style={styles.activityLeft}>
                                  <View style={[
                                    styles.activityIconBox,
                                    action.completed_today && styles.activityIconBoxDone
                                  ]}>
                                    <Text style={styles.activityEmoji}>
                                      {action.completed_today ? '✓' : '○'}
                                    </Text>
                                  </View>

                                  <View style={styles.activityInfo}>
                                    <Text style={styles.activityName}>
                                      {action.title}
                                    </Text>
                                    <Text style={styles.activityStats}>
                                      {displayStreak > 0 ? `Day ${displayStreak}` : 'Not started'} • {formatFrequencyLabel(action.frequency || 'daily', action.scheduled_days)} • {action.time || 'Anytime'}
                                    </Text>
                                  </View>
                                </View>

                                <View style={styles.consistencyCircleContainer}>
                                  <Svg width={50} height={50} viewBox="0 0 50 50">
                                    <SvgCircle
                                      cx="25"
                                      cy="25"
                                      r="22"
                                      stroke="rgba(255,255,255,0.05)"
                                      strokeWidth="4"
                                      fill="none"
                                    />
                                    <SvgCircle
                                      cx="25"
                                      cy="25"
                                      r="22"
                                      stroke={action.done ? "#FFD700" : "rgba(255,215,0,0.3)"}
                                      strokeWidth="4"
                                      fill="none"
                                      strokeDasharray={`${circumference} ${circumference}`}
                                      strokeDashoffset={strokeDashoffset}
                                      strokeLinecap="round"
                                      transform="rotate(-90 25 25)"
                                    />
                                  </Svg>
                                  <Text style={[
                                    styles.consistencyPercentageText,
                                    action.completed_today && styles.consistencyPercentageTextActive
                                  ]}>
                                    {shouldAppearToday ? `${Math.round(actionConsistency)}%` : '—'}
                                  </Text>
                                </View>
                              </View>
                            );
                          });
                        })()}
                      </View>
                    </Animated.View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })
        )}
      </View>

      {/* Global Challenges Section */}
      {activeChallenges && activeChallenges.filter((c: any) => c.scope === 'global').length > 0 && (
        <View style={[styles.goalsSection, { marginTop: 32 }]}>
          <Text style={styles.sectionTitle}>GLOBAL CHALLENGES</Text>

          {activeChallenges.filter((c: any) => c.scope === 'global').map((challenge: any, index: number) => {
            const participation = challenge.my_participation;
            const completionPercentage = participation?.completion_percentage || 0;
            const currentDay = participation?.current_day || 1;
            const totalDays = challenge.duration_days || 30;
            const daysLeft = Math.max(0, totalDays - currentDay);

            return (
              <Animated.View
                key={challenge.id}
                entering={FadeInDown.delay(120 + index * 60).springify()}
                style={styles.goalCard}
              >
                <Pressable style={styles.newGoalCard}>
                  <LinearGradient
                    colors={['rgba(0,0,0,0.95)', 'rgba(18,23,28,0.9)']}
                    style={StyleSheet.absoluteFillObject}
                  />

                  <Text style={styles.consistencyLabel}>COMPLETION</Text>

                  <View style={styles.progressRingContainer}>
                    <Svg width={70} height={70}>
                      <SvgCircle
                        cx="35"
                        cy="35"
                        r="30"
                        stroke="rgba(192,192,192,0.1)"
                        strokeWidth="6"
                        fill="none"
                      />
                      <SvgCircle
                        cx="35"
                        cy="35"
                        r="30"
                        stroke="#FFD700"
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={`${(completionPercentage / 100) * 188.4} 188.4`}
                        strokeLinecap="round"
                        transform="rotate(-90 35 35)"
                      />
                    </Svg>
                    <View style={styles.progressTextContainer}>
                      <Text style={styles.progressPercentage}>{Math.round(completionPercentage)}%</Text>
                    </View>
                  </View>

                  <View style={styles.goalContentLeft}>
                    <View style={styles.goalHeaderNew}>
                      <Text style={styles.challengeEmoji}>{challenge.emoji || '🏆'}</Text>
                      <Text style={styles.goalTitleNew}>{challenge.name}</Text>
                    </View>

                    <View style={styles.timeStatusContainer}>
                      <Text style={styles.timeStatusPrimary}>
                        Day {currentDay} of {totalDays}
                      </Text>
                      <Text style={styles.timeStatusSecondary}>{daysLeft} days remaining</Text>
                    </View>

                    <View style={styles.linearProgressContainer}>
                      <View style={styles.linearProgressBackground}>
                        <View
                          style={[
                            styles.linearProgressFill,
                            { width: `${completionPercentage}%` }
                          ]}
                        />
                      </View>
                    </View>

                    <View style={styles.bottomSection}>
                      <Text style={styles.tapDetailsText}>
                        {participation?.completed_days || 0} / {totalDays} days completed
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* Circle Challenges Section */}
      {activeChallenges && activeChallenges.filter((c: any) => c.scope === 'circle').length > 0 && (
        <View style={[styles.goalsSection, { marginTop: 32 }]}>
          <Text style={styles.sectionTitle}>CIRCLE CHALLENGES</Text>

          {activeChallenges.filter((c: any) => c.scope === 'circle').map((challenge: any, index: number) => {
            const participation = challenge.my_participation;
            const completionPercentage = participation?.completion_percentage || 0;
            const currentDay = participation?.current_day || 1;
            const totalDays = challenge.duration_days || 30;
            const daysLeft = Math.max(0, totalDays - currentDay);

            // Find the circle for this challenge
            const circle = userCircles?.find((c: any) => c.id === challenge.circle_id);
            const circleName = circle ? `${circle.emoji || '⭕'} ${circle.name}` : 'Circle';

            return (
              <Animated.View
                key={challenge.id}
                entering={FadeInDown.delay(120 + index * 60).springify()}
                style={styles.goalCard}
              >
                <Pressable style={styles.newGoalCard}>
                  <LinearGradient
                    colors={['rgba(0,0,0,0.95)', 'rgba(18,23,28,0.9)']}
                    style={StyleSheet.absoluteFillObject}
                  />

                  <Text style={styles.consistencyLabel}>COMPLETION</Text>

                  <View style={styles.progressRingContainer}>
                    <Svg width={70} height={70}>
                      <SvgCircle
                        cx="35"
                        cy="35"
                        r="30"
                        stroke="rgba(192,192,192,0.1)"
                        strokeWidth="6"
                        fill="none"
                      />
                      <SvgCircle
                        cx="35"
                        cy="35"
                        r="30"
                        stroke="#FFD700"
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={`${(completionPercentage / 100) * 188.4} 188.4`}
                        strokeLinecap="round"
                        transform="rotate(-90 35 35)"
                      />
                    </Svg>
                    <View style={styles.progressTextContainer}>
                      <Text style={styles.progressPercentage}>{Math.round(completionPercentage)}%</Text>
                    </View>
                  </View>

                  <View style={styles.goalContentLeft}>
                    <View style={styles.goalHeaderNew}>
                      <Text style={styles.challengeEmoji}>{challenge.emoji || '🏆'}</Text>
                      <Text style={styles.goalTitleNew}>{challenge.name}</Text>
                    </View>

                    {/* Circle Name */}
                    <Text style={styles.circleNameText}>{circleName}</Text>

                    <View style={styles.timeStatusContainer}>
                      <Text style={styles.timeStatusPrimary}>
                        Day {currentDay} of {totalDays}
                      </Text>
                      <Text style={styles.timeStatusSecondary}>{daysLeft} days remaining</Text>
                    </View>

                    <View style={styles.linearProgressContainer}>
                      <View style={styles.linearProgressBackground}>
                        <View
                          style={[
                            styles.linearProgressFill,
                            { width: `${completionPercentage}%` }
                          ]}
                        />
                      </View>
                    </View>

                    <View style={styles.bottomSection}>
                      <Text style={styles.tapDetailsText}>
                        {participation?.completed_days || 0} / {totalDays} days completed
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      )}

      {goals.length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={styles.addGoalButtonContainer}
        >
          <Pressable
            style={styles.addGoalButton}
            onPress={openOnboarding}
          >
            <LinearGradient
              colors={['#E7B43A', '#F7E7CE']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <Plus size={20} color="#000" />
            <Text style={styles.addGoalButtonText}>Add Goals</Text>
          </Pressable>
        </Animated.View>
      )}

      <GoalEditModal
        visible={editingGoal !== null}
        goal={editingGoal}
        onClose={() => setEditingGoal(null)}
      />

      {goalsLoading && (
        <View style={styles.loadingOverlay}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={LuxuryTheme.colors.primary.gold} />
            <Text style={styles.loadingText}>Loading your goals...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },

  consistencyBadgeWrapper: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 24,
  },

  consistencyBadge: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  consistencyBadgeContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },

  consistencyBadgeValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFD700',
  },

  consistencyBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 215, 0, 0.8)',
    letterSpacing: 1.5,
    marginTop: 2,
  },

  goalsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 1,
    marginBottom: 12,
  },

  goalCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },

  newGoalCard: {
    backgroundColor: '#000000',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 4,
    position: 'relative',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  consistencyLabel: {
    position: 'absolute',
    top: 24,
    right: 24,
    fontSize: 11,
    letterSpacing: 1,
    color: 'rgba(192,192,192,0.5)',
    fontWeight: '600',
  },
  progressRingContainer: {
    position: 'absolute',
    right: 24,
    top: 60,
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTextContainer: {
    position: 'absolute',
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  goalContentLeft: {
    flex: 1,
    marginRight: 100,
  },
  goalHeaderNew: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  goalTitleNew: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  challengeEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  circleNameText: {
    fontSize: 13,
    color: 'rgba(255,215,0,0.8)',
    marginBottom: 12,
    fontWeight: '500',
  },
  timeStatusContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  timeStatusPrimary: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  timeStatusSecondary: {
    fontSize: 14,
    color: 'rgba(192,192,192,0.7)',
  },
  linearProgressContainer: {
    marginBottom: 20,
  },
  linearProgressBackground: {
    height: 8,
    backgroundColor: 'rgba(192,192,192,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  linearProgressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tapDetailsText: {
    fontSize: 13,
    color: 'rgba(192,192,192,0.5)',
  },

  expandedContent: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },

  dailyActivitiesSection: {
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleLine: {
    flex: 1,
    height: 1,
    marginLeft: 16,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,215,0,0.1)',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 12,
  },

  activityItem: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityIconBoxDone: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderColor: '#FFD700',
  },
  activityEmoji: {
    fontSize: 18,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  activityStats: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },

  consistencyCircleContainer: {
    width: 50,
    height: 50,
    position: 'relative',
  },
  consistencyPercentageText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -10 }],
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,215,0,0.5)',
  },
  consistencyPercentageTextActive: {
    color: '#FFD700',
  },

  noActivitiesContainer: {
    padding: 24,
    alignItems: 'center',
  },
  noActivitiesText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },

  addGoalButtonContainer: {
    marginTop: 24,
    marginBottom: 40,
    marginHorizontal: 4,
  },
  addGoalButton: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  addGoalButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },

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
