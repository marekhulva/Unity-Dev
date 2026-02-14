export type JourneyType = 'custom' | 'program';

export interface PurchasedProgram {
  id: string;
  name: string;
  author: string;
  authorImage: string;
  coverImage: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'extreme';
  category: 'fitness' | 'mindfulness' | 'productivity' | 'health' | 'skills' | 'mindset';
  gradient: string[];
  price: number;
  purchasedAt: Date;
  features?: string[];
}

export interface OnboardingGoal {
  title: string;
  category: 'fitness' | 'mindfulness' | 'productivity' | 'health' | 'skills' | 'other';
  targetDate: Date;
  targetValue?: number;
  unit?: string;
  why: string;
  currentValue?: number;
  type?: 'goal' | 'routine'; // NEW: Support routines
}

export interface Milestone {
  id: string;
  title: string;
  targetDate: Date;
  targetValue?: number;
  unit?: string;
  completed: boolean;
  order: number;
}

export interface Action {
  id: string;
  type: 'one-time' | 'commitment';
  title: string;
  description?: string;
  category: 'fitness' | 'mindfulness' | 'productivity' | 'health' | 'skills' | 'other';
  icon: string;
  
  // For commitments
  frequency?: 'daily' | 'every_other_day' | 'three_per_week' | 'weekly' | 'weekdays' | 'weekends' | 'monthly';
  daysPerWeek?: number;
  specificDays?: number[]; // 0-6 for Sunday-Saturday
  scheduledDays?: string[]; // For weekly and three_per_week: ['monday', 'wednesday', 'friday']
  timeOfDay?: string; // HH:MM format - undefined for all-day activities
  duration?: number; // in minutes
  
  // For one-time actions
  dueDate?: Date;
  
  reminder?: boolean;
  reminderTime?: string; // HH:MM format

  // New fields for 75 Hard and similar programs
  requiresTime?: boolean; // Whether this activity needs a specific time
  periodicReminders?: boolean; // For activities like water that need multiple reminders

  isAbstinence?: boolean; // TRUE for "avoid" actions (No Social Media, No Alcohol)
}

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  journeyType: JourneyType | null;
  selectedProgram?: PurchasedProgram;
  routine?: OnboardingGoal; // NEW: Store the routine separately
  goal?: OnboardingGoal;
  milestones: Milestone[];
  actions: Action[];
  routineActions: Action[]; // NEW: Actions for the routine
  isCompleted: boolean;
}