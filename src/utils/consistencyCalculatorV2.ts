import { DayProgress } from '../types/progress';
import { getWeeklyOccurrences } from './actionScheduling';

interface ConsistencyResult {
  percentage: number;
  completedTasks: number;
  totalTasks: number;
  currentStreak: number;
  bestStreak: number;
  expectedTasks?: number;
  actualCompletions?: number;
}

export interface ActionWithFrequency {
  id: string;
  title: string;
  frequency?: string;
  scheduled_days?: string[];
  completed: boolean;
}

/**
 * Calculate weighted consistency based on action frequencies
 * Each action is weighted by how often it should appear per week:
 * - Daily = 7 points per week
 * - 3x/week = 3 points per week
 * - Weekly = 1 point per week
 *
 * Score = (completed scheduled actions / total scheduled actions) × 100
 */
export const calculateWeightedConsistency = (
  actions: ActionWithFrequency[],
  dateRange: { start: Date; end: Date }
): ConsistencyResult => {
  if (!actions || actions.length === 0) {
    return {
      percentage: 0,
      completedTasks: 0,
      totalTasks: 0,
      currentStreak: 0,
      bestStreak: 0,
      expectedTasks: 0,
      actualCompletions: 0
    };
  }

  const daysInRange = Math.ceil(
    (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  const weeksInRange = daysInRange / 7;

  let expectedPoints = 0;
  let earnedPoints = 0;
  let completedTasks = 0;
  let totalTasks = 0;

  actions.forEach(action => {
    const frequency = action.frequency || 'daily';
    const weeklyOccurrences = getWeeklyOccurrences(frequency);

    // Calculate expected points for this action over the date range
    const expectedForAction = weeklyOccurrences * weeksInRange;
    expectedPoints += expectedForAction;

    // For now, we track single-day completions
    // In a real system, we'd need to track completion history
    if (action.completed) {
      completedTasks++;
      // Award points based on frequency weight
      earnedPoints += weeklyOccurrences / 7; // Normalize to daily value
    }
    totalTasks++;
  });

  // Calculate percentage based on expected vs earned points
  const percentage = expectedPoints > 0
    ? Math.round((earnedPoints / expectedPoints) * 100)
    : 0;

  return {
    percentage,
    completedTasks,
    totalTasks,
    currentStreak: 0, // Would need completion history to calculate
    bestStreak: 0,    // Would need completion history to calculate
    expectedTasks: Math.round(expectedPoints),
    actualCompletions: Math.round(earnedPoints)
  };
};

/**
 * Calculate daily consistency for actions scheduled today only
 * This is simpler - just completed scheduled actions / total scheduled actions
 */
export const calculateDailyConsistency = (
  todaysActions: ActionWithFrequency[]
): ConsistencyResult => {
  if (!todaysActions || todaysActions.length === 0) {
    return {
      percentage: 0,
      completedTasks: 0,
      totalTasks: 0,
      currentStreak: 0,
      bestStreak: 0
    };
  }

  const completedTasks = todaysActions.filter(a => a.completed).length;
  const totalTasks = todaysActions.length;
  const percentage = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  return {
    percentage,
    completedTasks,
    totalTasks,
    currentStreak: 0,
    bestStreak: 0
  };
};

/**
 * Calculate consistency with frequency weighting over a period
 * This version accounts for different action frequencies properly
 */
export const calculateFrequencyAdjustedConsistency = (
  dayProgresses: DayProgress[]
): ConsistencyResult => {
  if (!dayProgresses || dayProgresses.length === 0) {
    return {
      percentage: 0,
      completedTasks: 0,
      totalTasks: 0,
      currentStreak: 0,
      bestStreak: 0
    };
  }

  let totalExpectedCompletions = 0;
  let actualCompletions = 0;
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  // Sort by date for streak calculation
  const sortedProgress = [...dayProgresses].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  sortedProgress.forEach(day => {
    // Each day should only count the actions that were actually scheduled
    const dayTotalTasks = day.tasks?.length || 0;
    const dayCompletedTasks = day.tasks?.filter(t => t.completed).length || 0;

    // These are already filtered for the day, so they all count equally
    totalExpectedCompletions += dayTotalTasks;
    actualCompletions += dayCompletedTasks;

    // Streak calculation based on perfect days
    if (dayTotalTasks > 0 && dayCompletedTasks === dayTotalTasks) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else if (dayTotalTasks > 0) {
      tempStreak = 0;
    }
  });

  currentStreak = tempStreak;

  // Percentage is based on actual scheduled actions, not theoretical daily max
  const percentage = totalExpectedCompletions > 0
    ? Math.round((actualCompletions / totalExpectedCompletions) * 100)
    : 0;

  return {
    percentage,
    completedTasks: actualCompletions,
    totalTasks: totalExpectedCompletions,
    currentStreak,
    bestStreak,
    expectedTasks: totalExpectedCompletions,
    actualCompletions
  };
};