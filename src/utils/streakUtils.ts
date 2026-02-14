/**
 * Streak Utilities - Compassionate streak tracking that rewards consistency over perfection
 */

type Day = 0 | 1; // 0 = missed, 1 = completed

export interface StreakMetrics {
  graceStreak: {
    done: number;
    window: number;
    percentage: number;
    label: string;
  };
  recovery: {
    run: number;
    isComeback: boolean;
    label?: string;
  };
  momentum: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    delta: number;
  };
  monthProgress: {
    completed: number;
    total: number;
    onPace: number;
    percentage: number;
  };
  flexDays: {
    available: number;
    earned: number;
    used: number;
  };
  intensity?: 'Low' | 'Medium' | 'High';
}

/**
 * Grace Streak - Count as intact if k out of n days completed
 * Default: 13 out of 14 days keeps streak alive
 */
export const calculateGraceStreak = (days: Day[], window = 14, threshold = 0.85): StreakMetrics['graceStreak'] => {
  const recentDays = days.slice(-window);
  const done = recentDays.reduce((sum, day) => sum + day, 0);
  const percentage = done / window;
  
  let label = '';
  if (percentage >= 1) {
    label = `Perfect ${window} days! 🔥`;
  } else if (percentage >= threshold) {
    label = `${done}/${window} Grace Streak ✨`;
  } else if (percentage >= 0.7) {
    label = `${done}/${window} days - Keep pushing!`;
  } else {
    label = `${done}/${window} days - Building momentum`;
  }
  
  return { done, window, percentage: Math.round(percentage * 100), label };
};

/**
 * Recovery/Comeback Tracking - Celebrate bouncing back
 */
export const calculateRecovery = (days: Day[]): StreakMetrics['recovery'] => {
  let run = 0;
  
  // Count consecutive days from most recent
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i] === 1) run++;
    else break;
  }
  
  // Check if yesterday was missed but today is done
  const missedYesterday = days.length >= 2 && days[days.length - 2] === 0;
  const isComeback = missedYesterday && run > 0;
  
  let label;
  if (isComeback) {
    label = run === 1 ? '🔄 Back on track!' : `🔄 ${run}-day comeback!`;
  } else if (run > 0) {
    label = `${run} day${run > 1 ? 's' : ''} strong`;
  }
  
  return { run, isComeback, label };
};

/**
 * Momentum Score - Recent weighted average (0-100)
 * More recent days have higher weight
 */
export const calculateMomentum = (days: Day[], lookback = 7): StreakMetrics['momentum'] => {
  const recentDays = days.slice(-lookback);
  const olderDays = days.slice(-(lookback * 2), -lookback);
  
  // Exponential moving average
  let currentScore = 0;
  let weight = 1;
  let totalWeight = 0;
  
  for (let i = recentDays.length - 1; i >= 0; i--) {
    currentScore += recentDays[i] * weight;
    totalWeight += weight;
    weight *= 0.85; // Decay factor
  }
  
  const score = Math.round((currentScore / totalWeight) * 100);
  
  // Calculate trend
  const oldScore = olderDays.length > 0 
    ? Math.round((olderDays.reduce((a, b) => a + b, 0) / olderDays.length) * 100)
    : score;
  
  const delta = score - oldScore;
  const trend = delta > 5 ? 'up' : delta < -5 ? 'down' : 'stable';
  
  return { score, trend, delta };
};

/**
 * Month Progress - Track monthly completion
 */
export const calculateMonthProgress = (
  completedDates: Date[], 
  targetDaysPerMonth = 20,
  today = new Date()
): StreakMetrics['monthProgress'] => {
  const year = today.getFullYear();
  const month = today.getMonth();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Count completions this month
  const completed = completedDates.filter(d => 
    d.getFullYear() === year && 
    d.getMonth() === month && 
    d.getDate() <= dayOfMonth
  ).length;
  
  // Calculate if on pace
  const expectedRate = targetDaysPerMonth / daysInMonth;
  const onPace = Math.round(expectedRate * daysInMonth);
  const percentage = Math.round((completed / targetDaysPerMonth) * 100);
  
  return {
    completed,
    total: targetDaysPerMonth,
    onPace,
    percentage: Math.min(percentage, 100)
  };
};

/**
 * Flex Days - Earned freezes for perfect weeks
 */
export const calculateFlexDays = (days: Day[]): StreakMetrics['flexDays'] => {
  let earned = 0;
  let consecutiveCount = 0;
  
  // Count how many flex days earned (1 per 10 consecutive)
  for (const day of days) {
    if (day === 1) {
      consecutiveCount++;
      if (consecutiveCount % 10 === 0) {
        earned++;
      }
    } else {
      consecutiveCount = 0;
    }
  }
  
  // For now, assume no flex days used (would need to track separately)
  const used = 0;
  const available = earned - used;
  
  return { available, earned, used };
};

/**
 * Convert date array to day array for a goal
 */
export const datesToDayArray = (
  completedDates: Date[], 
  startDate: Date,
  endDate = new Date()
): Day[] => {
  const days: Day[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const completed = completedDates.some(d => 
      d.toDateString() === current.toDateString()
    );
    days.push(completed ? 1 : 0);
    current.setDate(current.getDate() + 1);
  }
  
  return days;
};

/**
 * Get comprehensive streak metrics for a goal
 */
export const getStreakMetrics = (
  completedDates: Date[],
  startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default 30 days ago
  intensity?: 'Low' | 'Medium' | 'High'
): StreakMetrics => {
  const days = datesToDayArray(completedDates, startDate);
  
  return {
    graceStreak: calculateGraceStreak(days),
    recovery: calculateRecovery(days),
    momentum: calculateMomentum(days),
    monthProgress: calculateMonthProgress(completedDates),
    flexDays: calculateFlexDays(days),
    intensity
  };
};

/**
 * Generate encouraging copy based on metrics
 */
export const getEncouragingCopy = (metrics: StreakMetrics): string => {
  const { graceStreak, recovery, momentum, monthProgress } = metrics;
  
  // Comeback message takes priority
  if (recovery.isComeback) {
    const comebackMessages = [
      'Missed a day, bounced right back 👊',
      'Back in action! Recovery > perfection',
      'Plot twist: You came back stronger 💪',
      'Rest day taken, momentum restored ✨'
    ];
    return comebackMessages[Math.floor(Math.random() * comebackMessages.length)];
  }
  
  // Perfect streak
  if (graceStreak.percentage === 100) {
    return `${graceStreak.window} days straight! Unstoppable 🔥`;
  }
  
  // Near perfect
  if (graceStreak.percentage >= 85) {
    return `${graceStreak.done}/${graceStreak.window} days. Consistency > perfection 💫`;
  }
  
  // Momentum improving
  if (momentum.trend === 'up' && momentum.delta > 10) {
    return `+${momentum.delta} momentum this week. Keep stacking wins 📈`;
  }
  
  // On pace for month
  if (monthProgress.completed >= monthProgress.onPace) {
    return `On track for ${monthProgress.onPace}/${monthProgress.total} this month 🎯`;
  }
  
  // Building phase
  if (momentum.score < 50) {
    return 'Showing up beats perfect. Keep going 🌱';
  }
  
  // Default encouraging
  return `${momentum.score}% momentum. Every day counts 💪`;
};

/**
 * Calculate intensity based on effort/difficulty
 */
export const calculateIntensity = (
  duration?: number, // in minutes
  difficulty?: 1 | 2 | 3 | 4 | 5
): 'Low' | 'Medium' | 'High' => {
  const score = (duration || 0) / 10 + (difficulty || 3);
  
  if (score >= 7) return 'High';
  if (score >= 4) return 'Medium';
  return 'Low';
};

/**
 * Format streak display for UI
 */
export const formatStreakDisplay = (metrics: StreakMetrics): {
  primaryBadge: string;
  secondaryBadge?: string;
  chips: string[];
  encouragement: string;
} => {
  const chips: string[] = [];
  
  // Add grace streak chip
  if (metrics.graceStreak.percentage >= 70) {
    chips.push(`${metrics.graceStreak.done}/${metrics.graceStreak.window} Grace`);
  }
  
  // Add momentum chip
  chips.push(`Momentum ${metrics.momentum.score}`);
  
  // Add month progress
  if (metrics.monthProgress.completed > 0) {
    chips.push(`📅 ${metrics.monthProgress.completed}/${metrics.monthProgress.total} this month`);
  }
  
  // Add intensity if high
  if (metrics.intensity === 'High') {
    chips.push('Intensity: High');
  }
  
  // Primary badge logic
  let primaryBadge = '';
  if (metrics.recovery.isComeback) {
    primaryBadge = metrics.recovery.label || '';
  } else if (metrics.graceStreak.percentage >= 85) {
    primaryBadge = metrics.graceStreak.label;
  } else if (metrics.momentum.trend === 'up') {
    primaryBadge = `📈 Momentum +${metrics.momentum.delta}`;
  }
  
  return {
    primaryBadge,
    chips,
    encouragement: getEncouragingCopy(metrics)
  };
};