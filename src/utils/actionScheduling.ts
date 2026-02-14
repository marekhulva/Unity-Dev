/**
 * Utility functions for determining if actions should appear based on their frequency
 */

export interface ScheduledAction {
  frequency?: string;
  scheduledDays?: string[];
  created_at?: string;
}

/**
 * Check if an action should appear today based on its frequency
 */
export function shouldActionAppearToday(action: ScheduledAction): boolean {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const dayName = getDayName(dayOfWeek).toLowerCase();

  // Default to daily if no frequency specified
  const frequency = action.frequency || 'daily';

  switch (frequency) {
    case 'daily':
      return true;

    case 'weekdays':
      // Monday (1) through Friday (5)
      return dayOfWeek >= 1 && dayOfWeek <= 5;

    case 'weekends':
      // Saturday (6) or Sunday (0)
      return dayOfWeek === 0 || dayOfWeek === 6;

    case 'weekly':
      // Check if today matches the scheduled day
      if (!action.scheduledDays || action.scheduledDays.length === 0) {
        return dayName === 'monday'; // Default to Monday
      }
      return action.scheduledDays.includes(dayName);

    case 'three_per_week':
    case 'threePerWeek':
      // Check if today is one of the scheduled days
      if (!action.scheduledDays || action.scheduledDays.length === 0) {
        // Default to Mon/Wed/Fri
        return dayName === 'monday' || dayName === 'wednesday' || dayName === 'friday';
      }
      return action.scheduledDays.includes(dayName);

    case 'every_other_day':
    case 'everyOtherDay':
      // Calculate days since creation
      if (!action.created_at) return true; // Show if no creation date

      const createdDate = new Date(action.created_at);
      const daysSinceCreation = Math.floor(
        (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Show on even days since creation (0, 2, 4, 6, etc.)
      return daysSinceCreation % 2 === 0;

    case 'monthly':
      // For now, just show on the 1st of each month
      // Could be enhanced to remember the original date
      return today.getDate() === 1;

    default:
      // Unknown frequency, show by default
      return true;
  }
}

/**
 * Get day name from day number (0 = Sunday)
 */
function getDayName(dayNumber: number): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[dayNumber];
}

/**
 * Get the next scheduled date for an action
 */
export function getNextScheduledDate(action: ScheduledAction): Date | null {
  const today = new Date();
  const frequency = action.frequency || 'daily';

  switch (frequency) {
    case 'daily':
    case 'weekdays':
    case 'weekends':
      // These appear on specific days, find the next occurrence
      for (let i = 1; i <= 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);

        // Temporarily create an action with this date to check
        const tempAction = { ...action };
        if (shouldActionAppearToday(tempAction)) {
          return checkDate;
        }
      }
      return null;

    case 'weekly':
    case 'three_per_week':
    case 'threePerWeek':
      // Find next scheduled day
      if (!action.scheduledDays || action.scheduledDays.length === 0) {
        return null;
      }

      for (let i = 1; i <= 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        const dayName = getDayName(checkDate.getDay()).toLowerCase();

        if (action.scheduledDays.includes(dayName)) {
          return checkDate;
        }
      }
      return null;

    case 'every_other_day':
    case 'everyOtherDay':
      // Next occurrence is 2 days from last appearance
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + 2);
      return nextDate;

    case 'monthly':
      // Next month on the 1st
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      nextMonth.setDate(1);
      return nextMonth;

    default:
      return null;
  }
}

/**
 * Calculate how many times per week an action should appear
 */
export function getWeeklyOccurrences(frequency: string): number {
  switch (frequency) {
    case 'daily':
      return 7;
    case 'weekdays':
      return 5;
    case 'weekends':
      return 2;
    case 'weekly':
      return 1;
    case 'three_per_week':
    case 'threePerWeek':
      return 3;
    case 'every_other_day':
    case 'everyOtherDay':
      return 3.5; // Average
    case 'monthly':
      return 0.25; // Roughly 1 per 4 weeks
    default:
      return 7; // Default to daily
  }
}