import React, { useState, useEffect } from 'react';
import { shouldActionAppearToday } from '../../utils/actionScheduling';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  FadeInDown,
  FadeIn,
  Easing,
} from 'react-native-reanimated';
import { 
  Target, Trophy, Flame, Calendar, CheckCircle, 
  Circle, ChevronDown, ChevronUp, AlertCircle, Clock,
  Gamepad2, TrendingUp, X, Check, Minus, Edit3, MoreVertical, Plus
} from 'lucide-react-native';
import { useStore } from '../../state/rootStore';
import { getLocalDateString } from '../../utils/dateUtils';
import { LuxuryTheme } from '../../design/luxuryTheme';
import Svg, { Circle as SvgCircle, Defs, LinearGradient as SvgGradient, Stop, G, Line, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { GoalEditModal } from './GoalEditModal';
import { Goal } from '../../state/slices/goalsSlice';
import { EmptyState } from '../../ui/EmptyState';
import { calculateConsistency } from '../../utils/consistencyCalculator';

// CircleSelector removed - only needed in Social feed

const { width } = Dimensions.get('window');

const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);

export const ProgressScreen = ({ navigation }: any) => {
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
  const [allGoalActions, setAllGoalActions] = useState<Record<string, any[]>>({}); // For activity display only, NOT for consistency calculation

  // Multiple circles support
  const userCircles = useStore(s => s.userCircles);
  const activeCircleId = useStore(s => s.activeCircleId);
  const setActiveCircle = useStore(s => s.setActiveCircle);
  const fetchUserCircles = useStore(s => s.fetchUserCircles);
  const circlesLoading = useStore(s => s.circlesLoading);
  const circlesError = useStore(s => s.circlesError);
  
  
  // Calculate overall metrics
  // Consistency = completion rate over last 7 days

  const completedToday = actions.filter(a => a.done).length;
  const totalToday = actions.length;

  // Calculate consistency based on last 7 days
  let overallConsistency = 0;
  const [weeklyStats, setWeeklyStats] = useState({ completed: 0, total: 0, percentage: 0 });

  // Only refresh stats when tab comes into focus (not goals/actions - they're managed globally)
  useEffect(() => {
    if (navigation) {
      const unsubscribe = navigation.addListener('focus', async () => {
        if (__DEV__) console.log('🔄 [PROGRESS] Tab focused, refreshing stats only...');
        // Only refresh completion stats - goals and actions are already up to date from global state
        await fetchCompletionStats();
      });

      return unsubscribe;
    }
  }, [navigation]);

  // Fetch weekly consistency from database
  useEffect(() => {
    const fetchWeeklyConsistency = async () => {
      if (!user?.id) return;

      try {
        const { supabase } = await import('../../services/supabase.service');
        const today = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        // Get all actions for this user
        const { data: userActions } = await supabase
          .from('actions')
          .select('*')
          .eq('user_id', user.id);

        if (!userActions || userActions.length === 0) {
          // No actions yet, use today's rate
          setWeeklyStats({
            completed: completedToday,
            total: totalToday,
            percentage: totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0
          });
          return;
        }

        // Calculate for last 7 days
        let totalTasks = 0;
        let completedTasks = 0;

        for (let i = 0; i < 7; i++) {
          const checkDate = new Date();
          checkDate.setDate(checkDate.getDate() - i);
          checkDate.setHours(0, 0, 0, 0);
          const checkDateStr = getLocalDateString(checkDate);

          // Count actions that existed on this day
          const dayActions = userActions.filter(action => {
            const createdDate = new Date(action.created_at);
            return createdDate <= checkDate;
          });

          totalTasks += dayActions.length;

          // Count completions for this specific day
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

        if (__DEV__) console.log('📊 [Progress] Weekly Consistency Calculated:', {
          userId: user.id,
          userEmail: user.email,
          totalTasks,
          completedTasks,
          percentage,
          actionsCount: userActions.length,
          sample: userActions.slice(0, 3).map(a => ({
            title: a.title,
            completed: a.completed,
            completed_at: a.completed_at,
            created_at: a.created_at
          }))
        });

        setWeeklyStats({
          completed: completedTasks,
          total: totalTasks,
          percentage
        });
      } catch (error) {
        if (__DEV__) console.error('Error fetching weekly consistency:', error);
        // Fallback to today's data
        setWeeklyStats({
          completed: completedToday,
          total: totalToday,
          percentage: totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0
        });
      }
    };

    fetchWeeklyConsistency();
  }, [user?.id, actions, completedToday, totalToday]);

  // Use the fetched overall stats (includes both regular actions + challenge activities)
  // Use ?? instead of || so that 0% is treated as a valid value, not falsy
  overallConsistency = overallStats.expected > 0 ? overallStats.percentage : weeklyStats.percentage;
  
  const completedThisWeek = actions.filter(a => a.done).length;
  
  // Calculate top streak (highest streak among all actions)
  const topStreak = Math.max(0, ...actions.map(a => a.streak || 0));
  
  // Calculate total score
  const streakBonus = actions.reduce((sum, a) => sum + (a.streak || 0), 0) * 5;
  const milestoneBonus = goals.length * 100;
  const actionPoints = completedThisWeek * 10;
  const totalScore = actionPoints + streakBonus + milestoneBonus;

  // Helper function to format frequency labels
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
  
  // Animation values for enhanced dual ring
  const outerRingAnim = useSharedValue(0);
  const innerRingAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.9);
  const glowAnim = useSharedValue(0);
  
  // Fetch goals and circle data on mount (only if not already loaded)
  useEffect(() => {
    // Only fetch if we don't have goals yet
    if (!goals || goals.length === 0) {
      fetchGoals();
    }
    fetchCompletionStats();
    // Load all user's circles for the selector
    fetchUserCircles();
  }, []);

  // Handle circle selection changes
  useEffect(() => {
    if (activeCircleId !== undefined) {
      // Fetch goals for the selected circle (or all circles if null)
      fetchGoals();
      fetchCompletionStats();
    }
  }, [activeCircleId]);

  // Fetch all actions when goals are loaded (only once)
  useEffect(() => {
    if (goals && goals.length > 0) {
      fetchAllGoalActions(); // Fetch all at once
    }
  }, [goals.length]); // Only re-run if number of goals changes

  // Refetch goal actions when actions are toggled (debounced)
  useEffect(() => {
    if (goals && goals.length > 0) {
      const timeoutId = setTimeout(() => {
        fetchAllGoalActions(); // Refetch to get updated completion status
      }, 300); // Debounce 300ms

      return () => clearTimeout(timeoutId);
    }
  }, [actions.length, completedActions.length]); // Only length changes
  
  useEffect(() => {
    // Animate rings with improved timing
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
    
    // Glow pulse animation
    glowAnim.value = withSequence(
      withTiming(1, { duration: 400 }),
      withTiming(0.3, { duration: 600 })
    );
    
    // Haptic feedback when ring settles
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 650);
  }, [overallConsistency, totalScore]);
  
  const dualRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));
  
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
  
  // Fetch completion history for all goals
  const fetchCompletionStats = async () => {
    if (!user?.id) return;

    try {
      const { backendService } = await import('../../services/backend.service');

      // Fetch goal-specific stats
      const goalStatsResponse = await backendService.getGoalCompletionStats(user.id);
      if (goalStatsResponse.success && goalStatsResponse.data) {
        setGoalCompletionStats(goalStatsResponse.data);
        if (__DEV__) console.log('📊 Goal completion stats loaded:', goalStatsResponse.data);
      }

      // Fetch overall stats
      const overallStatsResponse = await backendService.getOverallCompletionStats(user.id);
      if (overallStatsResponse.success && overallStatsResponse.data) {
        setOverallStats(overallStatsResponse.data);
        if (__DEV__) console.log('📊 Overall completion stats loaded:', overallStatsResponse.data);
      }
    } catch (error) {
      if (__DEV__) console.log('Could not fetch completion stats:', error);
    }
  };

  // Fetch ALL actions for goals (not just today's) - OPTIMIZED
  const fetchAllGoalActions = async (goalId?: string) => {
    if (!user?.id) return;

    try {
      const { supabase } = await import('../../services/supabase.service');
      const today = getLocalDateString();
      const tomorrow = getLocalDateString(new Date(Date.now() + 86400000));

      if (goalId) {
        // Fetch for specific goal
        const { data, error } = await supabase
          .from('actions')
          .select('*')
          .eq('goal_id', goalId)
          .eq('user_id', user.id);

        if (!error && data) {
          // Fetch today's completions for these actions
          const actionIds = data.map(a => a.id);
          const { data: completionsData } = await supabase
            .from('action_completions')
            .select('action_id, completed_at')
            .in('action_id', actionIds)
            .gte('completed_at', today)
            .lt('completed_at', tomorrow);

          // Mark actions as completed if they have today's completion
          const completedActionIds = new Set(completionsData?.map(c => c.action_id) || []);
          const actionsWithCompletion = data.map(action => ({
            ...action,
            completed_today: completedActionIds.has(action.id)
          }));

          setAllGoalActions(prev => ({
            ...prev,
            [goalId]: actionsWithCompletion
          }));
          if (__DEV__) console.log('📚 Fetched actions for goal:', goalId, actionsWithCompletion);
        }
      } else if (goals.length) {
        // OPTIMIZED: Fetch ALL actions and completions in 2 queries instead of 2*N
        const goalIds = goals.map(g => g.id);

        // Single query for all actions
        const { data: allActionsData, error: actionsError } = await supabase
          .from('actions')
          .select('*')
          .in('goal_id', goalIds)
          .eq('user_id', user.id);

        if (actionsError || !allActionsData) {
          if (__DEV__) console.error('Error fetching actions:', actionsError);
          return;
        }

        // Single query for all today's completions
        const actionIds = allActionsData.map(a => a.id);
        const { data: completionsData } = await supabase
          .from('action_completions')
          .select('action_id, completed_at')
          .in('action_id', actionIds)
          .gte('completed_at', today)
          .lt('completed_at', tomorrow);

        // Build completed set
        const completedActionIds = new Set(completionsData?.map(c => c.action_id) || []);

        // Group actions by goal
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
        if (__DEV__) console.log('📚 Fetched all actions for goals (optimized):', allActions);
      }
    } catch (error) {
      if (__DEV__) console.log('Could not fetch all goal actions:', error);
    }
  };

  // Helper functions for goal data
  const getGoalConsistency = (goalId: string) => {
    // SIMPLIFIED: Only use historical stats from backend - no confusing fallbacks
    // This shows all-time consistency: (total completions) / (actions × days)
    const stats = goalCompletionStats[goalId];

    if (stats && stats.percentage !== undefined) {
      return stats.percentage;
    }

    // If backend stats aren't loaded yet, return 0
    // This is temporary and will update once stats load
    return 0;
  };
  
  const getGoalStreak = (goalId: string) => {
    // Get actions linked to this goal that have streak data
    const goalActions = actions.filter(a => a.goalId === goalId);
    
    // Return the highest streak among this goal's actions
    // (or could sum/average them depending on desired behavior)
    const maxStreak = goalActions.reduce((max, action) => {
      return Math.max(max, action.streak || 0);
    }, 0);
    
    return maxStreak;
  };
  
  const getMilestoneProgress = (goal: any) => {
    // Use actual milestones from the goal if available
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
    
    // Fallback to default milestones if none exist
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
    const adjustedToday = today === 0 ? 6 : today - 1; // Adjust for Monday start
    
    return days.map((day, i) => ({
      day,
      isToday: i === adjustedToday,
      hasAction: i === 0 || i === 2 || i === 4 || i === 6,
      isCompleted: i < adjustedToday && (i === 0 || i === 2),
      isMissed: i === 3 && i < adjustedToday,
      isOptional: i === 5,
    }));
  };
  
  const getSparklineData = () => {
    // Mock 7-day consistency data
    return [65, 70, 68, 75, 80, 85, overallConsistency];
  };
  
  // Show error state if there's an error
  if (goalsError && !goalsLoading) {
    return (
      <View style={styles.container}>
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Refresh Indicator Overlay */}
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
      {/* Hero Card - Pinned at top EXACTLY like ProfileClaude */}
      <Animated.View 
        style={[styles.heroCard, { paddingTop: insets.top + 10 }]}
        entering={FadeInDown.duration(600).springify()}
      >
        <View style={styles.heroCardInner}>
          {/* New Highlights & Milestones Layout */}
          <View style={styles.highlightsHeader}>
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
            
            <Text style={styles.highlightsTitle}>Highlights & Milestones</Text>
          </View>

          {/* DEBUG BUTTONS */}
          <View style={{ marginTop: 15, alignItems: 'center' }}>
            {/* Database Introspection Button */}
          </View>

          {/* Highlights Grid - COMMENTED OUT FOR NOW */}
          {/* <View style={styles.highlightsGrid}>
            <View style={styles.highlightCard}>
              <Text style={styles.highlightEmoji}>🔥</Text>
              <Text style={styles.highlightValue}>{topStreak}</Text>
              <Text style={styles.highlightLabel}>Current Streak</Text>
            </View>
            
            <View style={styles.highlightCard}>
              <Text style={styles.highlightEmoji}>⚡</Text>
              <Text style={styles.highlightValue}>{completedToday}</Text>
              <Text style={styles.highlightLabel}>Today's Wins</Text>
            </View>
            
            <View style={styles.highlightCard}>
              <Text style={styles.highlightEmoji}>🏆</Text>
              <Text style={styles.highlightValue}>{goals.length}</Text>
              <Text style={styles.highlightLabel}>Active Goals</Text>
            </View>
            
            <View style={styles.highlightCard}>
              <Text style={styles.highlightEmoji}>💪</Text>
              <Text style={styles.highlightValue}>{totalToday > 0 ? Math.round((completedToday/totalToday) * 100) : 0}%</Text>
              <Text style={styles.highlightLabel}>Today's Rate</Text>
            </View>
            
            <View style={styles.highlightCard}>
              <Text style={styles.highlightEmoji}>📈</Text>
              <Text style={styles.highlightValue}>+{Math.max(0, overallConsistency - 70)}%</Text>
              <Text style={styles.highlightLabel}>vs Average</Text>
            </View>
            
            <View style={styles.highlightCard}>
              <Text style={styles.highlightEmoji}>⭐</Text>
              <Text style={styles.highlightValue}>{totalScore}</Text>
              <Text style={styles.highlightLabel}>Total Score</Text>
            </View>
          </View> */}
        </View>
        
        {/* Gold gradient underline */}
        <LinearGradient
          colors={[
            '#D4AF37',
            '#C9A050',
            '#B8860B',
            '#A0790A',
            '#B8860B',
            '#C9A050',
            '#D4AF37'
          ]}
          locations={[0, 0.2, 0.35, 0.5, 0.65, 0.8, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerUnderline}
        />
      </Animated.View>

      <View style={styles.scrollViewWrapper}>
        {/* Fallback gradient background */}
        <LinearGradient 
          colors={[
            'rgba(10, 10, 10, 1)',
            'rgba(5, 5, 5, 1)',
            'rgba(0, 0, 0, 1)'
          ]}
          locations={[0, 0.3, 1]}
          style={styles.backgroundGradient}
          pointerEvents="none"
        />
      
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { 
              paddingTop: 160 + insets.top,  // Reduced because hero card is smaller now
              paddingBottom: 100  // Standard bottom padding
            }
          ]}
          showsVerticalScrollIndicator={false}
        >
        
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
              const sparklineData = getSparklineData();
              const goalColor = goal.color || '#FFD700';
              
              // Use actual consistency percentage for this goal
              const progressPercentage = goalConsistency; // Using the actual consistency calculated above
              
              // Calculate actual days from goal data
              const today = new Date();
              today.setHours(0, 0, 0, 0); // Reset to start of day for accurate day counting

              const createdAt = goal.created_at ? new Date(goal.created_at) : today;
              createdAt.setHours(0, 0, 0, 0); // Reset to start of day

              // Create a normalized "today at start of day" for consistent calculations
              const todayStart = new Date(today);
              todayStart.setHours(0, 0, 0, 0);

              // Calculate current day (Day 1, Day 2, etc.)
              // If created yesterday and today is the next day, we're on Day 2
              const daysSinceStart = Math.floor((todayStart.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) + 1;

              // Determine if this is a routine or a goal
              const isRoutine = goal.type === 'routine' || (!goal.deadline || goal.deadline === '' || goal.deadline === 'null');

              let totalDays = 0;
              let daysLeft = 0;

              // Only calculate deadline-related values if it's not a routine
              if (!isRoutine) {
                const deadline = new Date(goal.deadline);
                deadline.setHours(23, 59, 59, 999); // Set to end of deadline day

                // Calculate total days for the goal
                totalDays = Math.floor((deadline.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                // Calculate days remaining (including today)
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
                    {/* Black shiny gradient background like Profile cards */}
                    <LinearGradient
                      colors={['rgba(0,0,0,0.95)', 'rgba(18,23,28,0.9)']}
                      style={StyleSheet.absoluteFillObject}
                    />
                    
                    {/* Consistency Label in top right */}
                    <Text style={styles.consistencyLabel}>CONSISTENCY</Text>
                    
                    {/* Progress Ring - positioned absolutely in right side */}
                    <View style={styles.progressRingContainer}>
                      <Svg width={70} height={70}>
                        {/* Background circle */}
                        <SvgCircle
                          cx="35"
                          cy="35"
                          r="30"
                          stroke="rgba(192,192,192,0.1)"
                          strokeWidth="6"
                          fill="none"
                        />
                        {/* Progress arc */}
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
                    
                    {/* Left content */}
                    <View style={styles.goalContentLeft}>
                      {/* Header with title and chevron */}
                      <View style={styles.goalHeaderNew}>
                        <Text style={styles.goalTitleNew}>{goal.title}</Text>
                        <ChevronDown size={18} color="rgba(255,255,255,0.5)" />
                      </View>
                      
                      {/* Time Status */}
                      <View style={styles.timeStatusContainer}>
                        <Text style={styles.timeStatusPrimary}>
                          {isRoutine ? `Day ${currentDay}` : `Day ${currentDay} of ${totalDays}`}
                        </Text>
                        {!isRoutine && (
                          <Text style={styles.timeStatusSecondary}>{daysLeft} days left</Text>
                        )}
                      </View>
                      
                      {/* Linear Progress Bar */}
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
                      
                      {/* Bottom Section */}
                      <View style={styles.bottomSection}>
                        {/* Removed overdue/behind/on track badge */}
                        <Text style={styles.tapDetailsText}>Tap to see details</Text>
                      </View>
                    </View>
                    
                    {/* Expanded Content - Daily Activities */}
                    {isExpanded && (
                      <Animated.View 
                        entering={FadeIn.duration(220)}
                        style={styles.expandedContent}
                      >
                        {/* All Activities Section */}
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
                          
                          {/* Get activities for this goal */}
                          {(() => {
                            const goalActions = allGoalActions[goal.id] || [];
                            
                            // Use the same daysSinceStart calculation from above
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
                              // Get completed actions for this specific action
                              const actionCompletions = completedActions.filter(ca => 
                                ca.actionId === action.id || ca.title === action.title
                              );
                              
                              // Calculate consistency based on actual data
                              const actualStreak = action.streak || 0;
                              
                              // Calculate days since action was created (use goal created_at as proxy)
                              const actionDaysSinceStart = Math.max(1, daysSinceGoalStart);
                              
                              // For individual actions, show today's completion status as percentage
                              // Check if this action should appear today based on frequency
                              const shouldAppearToday = shouldActionAppearToday({
                                frequency: action.frequency || 'daily',
                                scheduledDays: action.scheduled_days,
                                created_at: action.created_at
                              });

                              // Only show completion percentage if action is scheduled for today
                              let actionConsistency = 0;
                              if (shouldAppearToday) {
                                // If scheduled for today, show 100% if completed, 0% if not
                                actionConsistency = action.completed_today ? 100 : 0;
                              } else {
                                // If not scheduled for today, show 0% (grayed out, not relevant today)
                                actionConsistency = 0;
                              }
                              
                              const circumference = 138.2;
                              const strokeDashoffset = circumference * (1 - actionConsistency / 100);
                              
                              // Display streak as current streak, starting at 1 if done today
                              const displayStreak = actualStreak > 0 ? actualStreak : (action.completed_today ? 1 : 0);

                              return (
                                <View
                                  key={action.id}
                                  style={styles.activityItem}
                                >
                                  <View style={styles.activityLeft}>
                                    {/* Activity Icon Box */}
                                    <View style={[
                                      styles.activityIconBox,
                                      action.completed_today && styles.activityIconBoxDone
                                    ]}>
                                      <Text style={styles.activityEmoji}>
                                        {action.completed_today ? '✓' : '○'}
                                      </Text>
                                    </View>
                                    
                                    {/* Activity Info */}
                                    <View style={styles.activityInfo}>
                                      <Text style={styles.activityName}>
                                        {action.title}
                                      </Text>
                                      <Text style={styles.activityStats}>
                                        {displayStreak > 0 ? `Day ${displayStreak}` : 'Not started'} • {formatFrequencyLabel(action.frequency || 'daily', action.scheduled_days)} • {action.time || 'Anytime'}
                                      </Text>
                                    </View>
                                  </View>
                                  
                                  {/* Right Section - Consistency Circle */}
                                  <View style={styles.consistencyCircleContainer}>
                                    <Svg width={50} height={50} viewBox="0 0 50 50">
                                      {/* Background circle */}
                                      <SvgCircle
                                        cx="25"
                                        cy="25"
                                        r="22"
                                        stroke="rgba(255,255,255,0.05)"
                                        strokeWidth="4"
                                        fill="none"
                                      />
                                      {/* Progress circle */}
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
          
          {/* Removed Add Goals button from here - moved to fixed position */}
        </View>
        </ScrollView>
      </View>
      
      {/* Add Goals Button - Fixed at bottom */}
      {goals.length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={[styles.fixedAddGoalButton, { bottom: insets.bottom + 100 }]}  // Above tab bar
        >
          <Pressable 
            style={styles.addGoalButton}
            onPress={openOnboarding}
          >
            <LinearGradient
              colors={['#E7B43A', '#F7E7CE']}  // Same as Make Commitment button
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <Plus size={20} color="#000" />
            <Text style={styles.addGoalButtonText}>Add Goals</Text>
          </Pressable>
        </Animated.View>
      )}
      
      {/* Goal Edit Modal */}
      <GoalEditModal
        visible={editingGoal !== null}
        goal={editingGoal}
        onClose={() => setEditingGoal(null)}
      />


      {/* Loading Overlay */}
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
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // Hero Card Styles - Highlights & Milestones (MADE SMALLER)
  heroCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 12, // Reduced from 20
  },
  
  heroCardInner: {
    paddingHorizontal: 16,
    paddingTop: 8, // Reduced from 15
  },
  
  // Highlights Header
  highlightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8, // Reduced from 16
  },
  
  consistencyBadgeWrapper: {
    alignItems: 'center',
    gap: 4,
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
  
  highlightsTitle: {
    fontSize: 11,
    color: 'rgba(255, 215, 0, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  
  // Highlights Grid
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  
  highlightCard: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  
  highlightEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  
  highlightValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  
  highlightLabel: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  
  consistencyLabelBelow: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 2,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 4,
    color: '#FFFFFF',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  
  scoreContainerHero: {
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 12,
  },
  
  scoreLabelHero: {
    fontSize: 14,
    color: '#CFCFCF',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  
  scoreSubtext: {
    fontSize: 12,
    color: 'rgba(207, 207, 207, 0.7)',
    marginTop: 4,
  },
  
  headerUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  
  // ScrollView Wrapper Styles
  scrollViewWrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000000', // Ensure black background fills the space
  },
  
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 8, // Reduced from 16 to 8 for wider cards
    // paddingTop and paddingBottom are now dynamic
  },
  
  // Enhanced Header Widget
  headerWidget: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  glassCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    overflow: 'hidden',
    // Enhanced shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  dualRingContainer: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  svgContainer: {
    position: 'absolute',
  },
  centerGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
  },
  centerMetrics: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  consistencyValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(255,215,0,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  consistencyLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  scoreLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.56)',
    fontWeight: '500',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  
  // Legend Pills
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  legendEmoji: {
    fontSize: 12,
  },
  legendText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  
  // Goals Section
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
  
  // Goal Cards
  goalCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    // Card shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
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
    gap: 12,
    flex: 1,
  },
  goalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressBadgeText: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 12,
  },
  
  // Enhanced Milestone Rail
  milestoneRail: {
    marginBottom: 16,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  milestoneTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 0.8,
  },
  milestoneProgress: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  milestoneProgressText: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: '600',
  },
  milestoneScroll: {
    marginBottom: 12,
  },
  milestoneTimeline: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  milestoneItem: {
    width: 120,
    marginRight: 16,
  },
  milestoneNodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    height: 32,
  },
  achievedNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  nextNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,215,0,0.05)',
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  futureNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  futureNodeNumber: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '600',
  },
  milestoneConnector: {
    position: 'absolute',
    left: -16,
    width: 16,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  milestoneConnectorRight: {
    position: 'absolute',
    right: -16,
    width: 16,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  milestoneDetails: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  milestoneDetailsNext: {
    backgroundColor: 'rgba(255,215,0,0.05)',
    borderColor: 'rgba(255,215,0,0.2)',
  },
  milestoneName: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  milestoneNameAchieved: {
    color: 'rgba(255,255,255,0.9)',
  },
  milestoneNameNext: {
    color: '#FFD700',
  },
  milestoneRequirement: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 6,
  },
  achievedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  achievedText: {
    fontSize: 10,
    color: '#06FFA5',
    fontWeight: '600',
  },
  nextBadge: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  nextBadgeText: {
    fontSize: 9,
    color: '#FFD700',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  currentFocusCard: {
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    marginTop: 8,
  },
  currentFocusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  currentFocusLabel: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  currentFocusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  currentFocusRequirement: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statTile: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.56)',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  graceText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
    marginTop: 4,
  },
  sparkline: {
    flexDirection: 'row',
    gap: 2,
    height: 20,
    alignItems: 'flex-end',
    marginTop: 8,
  },
  sparklineBar: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  
  // Week Schedule
  weekSchedule: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
  },
  weekLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.56)',
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  weekPills: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayPill: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dayCompleted: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderColor: 'rgba(255,215,0,0.3)',
  },
  dayScheduled: {
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dayMissed: {
    backgroundColor: 'rgba(255,107,107,0.1)',
    borderColor: 'rgba(255,107,107,0.3)',
  },
  dayOptional: {
    borderStyle: 'dotted',
  },
  dayToday: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  dayText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  dayTextActive: {
    color: 'rgba(255,255,255,0.9)',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  hollowRing: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  startButtonText: {
    color: '#FFD700',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Expanded Content
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
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
  
  // Weekly History Styles
  weekOverview: {
    marginBottom: 20,
  },
  weekTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weekDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 6,
  },
  dayLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  todayLabel: {
    color: '#FFD700',
    fontWeight: '700',
  },
  dayDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  // Daily Breakdown Styles
  dailyBreakdown: {
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noActionsText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  daySection: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dayDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  actionCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCheckboxDone: {
    borderColor: '#00FF88',
    backgroundColor: 'rgba(0,255,136,0.1)',
  },
  actionTitle: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  actionTitleDone: {
    color: '#FFFFFF',
    textDecorationLine: 'line-through',
    textDecorationColor: 'rgba(255,255,255,0.3)',
  },
  actionTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  
  // Insights Styles
  insightsSection: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  insightCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 10,
  },
  insightText: {
    flex: 1,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },

  // Linked Actions Section Styles
  linkedActionsSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  linkedActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  linkedActionsList: {
    gap: 8,
  },
  linkedActionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  linkedActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  actionBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actionBulletDone: {
    backgroundColor: '#00FF88',
  },
  linkedActionTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  actionInfo: {
    flex: 1,
    gap: 2,
  },
  actionFrequency: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  linkedActionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkedActionTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  emptyActions: {
    padding: 20,
    alignItems: 'center',
  },
  emptyActionsText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    lineHeight: 18,
  },
  
  // Add Goals Button
  addGoalButtonContainer: {
    marginTop: 16,
    marginBottom: 8,
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
  
  // Fixed Add Goals Button
  fixedAddGoalButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 50,
  },
  
  // New goal card styles - matching Profile's black shiny cards
  newGoalCard: {
    backgroundColor: '#000000',  // Pure black like Profile cards
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 4,
    position: 'relative',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',  // Subtle border like Profile
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
    marginRight: 100, // Space for the smaller progress ring
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
  onTrackBadge: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  onTrackText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  overdueTrackBadge: {
    backgroundColor: 'rgba(255,0,0,0.1)',
    borderColor: 'rgba(255,0,0,0.2)',
  },
  overdueTrackText: {
    color: '#FF4444',
  },
  behindTrackBadge: {
    backgroundColor: 'rgba(255,165,0,0.1)',
    borderColor: 'rgba(255,165,0,0.2)',
  },
  behindTrackText: {
    color: '#FFA500',
  },
  tapDetailsText: {
    fontSize: 13,
    color: 'rgba(192,192,192,0.5)',
  },
  
  // Expanded content styles
  expandedContent: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  
  // Daily Activities Section
  dailyActivitiesSection: {
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 2,
    color: 'rgba(255,215,0,0.7)',
    fontWeight: '600',
  },
  sectionTitleLine: {
    flex: 1,
    height: 1,
    marginLeft: 16,
    backgroundColor: 'transparent',
    // Gradient effect will be simulated with opacity
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,215,0,0.1)',
  },
  
  // Activity items
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
  activityItemPressed: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    transform: [{ translateX: 4 }],
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
  
  // Consistency circle
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
  
  // No activities
  noActivitiesContainer: {
    padding: 24,
    alignItems: 'center',
  },
  noActivitiesText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
  
});