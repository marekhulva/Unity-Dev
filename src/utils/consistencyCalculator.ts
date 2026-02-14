import { DayProgress } from '../types/progress';

interface ConsistencyResult {
  percentage: number;
  completedTasks: number;
  totalTasks: number;
  currentStreak: number;
  bestStreak: number;
}

/**
 * Calculate consistency based on individual task completion
 * Formula: (completed tasks / total tasks) × 100
 * NOT based on perfect days
 */
export const calculateConsistency = (dayProgresses: DayProgress[]): ConsistencyResult => {
  if (!dayProgresses || dayProgresses.length === 0) {
    return {
      percentage: 0,
      completedTasks: 0,
      totalTasks: 0,
      currentStreak: 0,
      bestStreak: 0
    };
  }

  let totalTasks = 0;
  let completedTasks = 0;
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  // Sort by date to calculate streaks properly
  const sortedProgress = [...dayProgresses].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  sortedProgress.forEach(day => {
    // Count total and completed tasks for each day
    const dayTotalTasks = day.tasks?.length || 0;
    const dayCompletedTasks = day.tasks?.filter(t => t.completed).length || 0;
    
    totalTasks += dayTotalTasks;
    completedTasks += dayCompletedTasks;

    // Calculate streaks based on perfect days (all tasks completed)
    if (dayTotalTasks > 0 && dayCompletedTasks === dayTotalTasks) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else if (dayTotalTasks > 0) {
      tempStreak = 0;
    }
  });

  // Current streak is the last continuous streak
  currentStreak = tempStreak;

  // Calculate percentage based on individual tasks, not perfect days
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    percentage,
    completedTasks,
    totalTasks,
    currentStreak,
    bestStreak
  };
};

/**
 * Calculate weekly consistency for a specific week
 */
export const calculateWeeklyConsistency = (
  dayProgresses: DayProgress[],
  weekStartDate: Date
): ConsistencyResult => {
  const weekEnd = new Date(weekStartDate);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const weekProgress = dayProgresses.filter(day => {
    const dayDate = new Date(day.date);
    return dayDate >= weekStartDate && dayDate <= weekEnd;
  });

  return calculateConsistency(weekProgress);
};

/**
 * Get consistency trend over time (for charts)
 */
export const getConsistencyTrend = (
  dayProgresses: DayProgress[],
  days: number = 30
): number[] => {
  const trend: number[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const dayProgress = dayProgresses.filter(p => {
      const pDate = new Date(p.date);
      return pDate >= date && pDate <= endDate;
    });
    
    if (dayProgress.length > 0) {
      const result = calculateConsistency(dayProgress);
      trend.push(result.percentage);
    } else {
      trend.push(0);
    }
  }
  
  return trend;
};