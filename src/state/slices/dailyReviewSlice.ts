import { StateCreator } from 'zustand';
import { dailyReviewService, DailyReview, MissedAction } from '../../services/supabase.dailyReviews.service';

export interface DailyReviewState {
  currentReview: DailyReview | null;
  reviewHistory: DailyReview[];
  isLoading: boolean;
  error: string | null;
}

export interface DailyReviewActions {
  // Initialize today's review
  initializeTodayReview: () => Promise<DailyReview | null>;
  
  // Save review progress
  saveReviewProgress: (
    answers: {
      biggestWin?: string;
      keyInsight?: string;
      gratitude?: string;
      tomorrowFocus?: string;
      tomorrowIntention?: string;
    },
    missedActions: Array<{
      actionId?: string;
      actionTitle: string;
      goalTitle?: string;
      markedComplete: boolean;
      missReason?: string;
    }>,
    metrics: {
      totalActions: number;
      completedActions: number;
      completionPercentage: number;
      pointsEarned: number;
    }
  ) => Promise<boolean>;
  
  // Load review history
  loadReviewHistory: () => Promise<void>;
  
  // Get a specific review
  getReview: (reviewId: string) => Promise<void>;
  
  // Calculate streak
  calculateStreak: () => Promise<number>;

  // Clear daily review data
  clearDailyReviewData: () => void;
}

export type DailyReviewSlice = DailyReviewState & DailyReviewActions;

export const createDailyReviewSlice: StateCreator<DailyReviewSlice> = (set, get) => ({
  currentReview: null,
  reviewHistory: [],
  isLoading: false,
  error: null,

  initializeTodayReview: async () => {
    if (__DEV__) console.log('📝 [REVIEW] Initializing today\'s review');
    set({ isLoading: true, error: null });
    
    try {
      // Get current user from auth state
      const { user } = (get() as any);
      if (!user?.id) {
        if (__DEV__) console.error('❌ [REVIEW] No user found');
        set({ isLoading: false, error: 'User not authenticated' });
        return null;
      }
      
      // Get or create today's review
      const review = await dailyReviewService.getOrCreateTodayReview(user.id);
      
      if (!review) {
        set({ isLoading: false, error: 'Failed to create review' });
        return null;
      }
      
      set({ currentReview: review, isLoading: false });
      return review;
    } catch (error: any) {
      if (__DEV__) console.error('❌ [REVIEW] Error initializing review:', error);
      set({ isLoading: false, error: error.message });
      return null;
    }
  },

  saveReviewProgress: async (answers, missedActions, metrics) => {
    if (__DEV__) console.log('💾 [REVIEW] Saving review progress');
    const { currentReview } = get();
    
    if (!currentReview?.id) {
      if (__DEV__) console.error('❌ [REVIEW] No current review to save');
      return false;
    }
    
    try {
      // Update the review with answers and metrics
      const updateSuccess = await dailyReviewService.updateReview(currentReview.id, {
        ...answers,
        ...metrics,
        updated_at: new Date().toISOString()
      });
      
      if (!updateSuccess) {
        if (__DEV__) console.error('❌ [REVIEW] Failed to update review');
        return false;
      }
      
      // Save missed actions
      if (missedActions.length > 0) {
        const missedActionsData = missedActions.map(action => ({
          action_id: action.actionId,
          action_title: action.actionTitle,
          goal_title: action.goalTitle,
          marked_complete: action.markedComplete,
          miss_reason: action.missReason,
          obstacles: undefined
        }));
        
        const actionsSuccess = await dailyReviewService.saveMissedActions(
          currentReview.id,
          missedActionsData
        );
        
        if (!actionsSuccess) {
          if (__DEV__) console.error('❌ [REVIEW] Failed to save missed actions');
          return false;
        }
      }
      
      // Update streak
      const { user } = (get() as any);
      if (user?.id) {
        await dailyReviewService.updateStreak(user.id);
      }
      
      // Update local state
      set({
        currentReview: {
          ...currentReview,
          ...answers,
          ...metrics
        }
      });
      
      if (__DEV__) console.log('✅ [REVIEW] Review saved successfully');
      return true;
    } catch (error: any) {
      if (__DEV__) console.error('❌ [REVIEW] Error saving review:', error);
      return false;
    }
  },

  loadReviewHistory: async () => {
    if (__DEV__) console.log('📚 [REVIEW] Loading review history');
    set({ isLoading: true, error: null });
    
    try {
      const { user } = (get() as any);
      if (!user?.id) {
        set({ isLoading: false, error: 'User not authenticated' });
        return;
      }
      
      const history = await dailyReviewService.getReviewHistory(user.id, 30);
      set({ reviewHistory: history, isLoading: false });
      if (__DEV__) console.log('✅ [REVIEW] Loaded', history.length, 'reviews');
    } catch (error: any) {
      if (__DEV__) console.error('❌ [REVIEW] Error loading history:', error);
      set({ isLoading: false, error: error.message });
    }
  },

  getReview: async (reviewId: string) => {
    if (__DEV__) console.log('📖 [REVIEW] Getting review:', reviewId);
    set({ isLoading: true, error: null });
    
    try {
      const result = await dailyReviewService.getReviewWithMissedActions(reviewId);
      
      if (result.review) {
        set({ currentReview: result.review, isLoading: false });
      } else {
        set({ isLoading: false, error: 'Review not found' });
      }
    } catch (error: any) {
      if (__DEV__) console.error('❌ [REVIEW] Error getting review:', error);
      set({ isLoading: false, error: error.message });
    }
  },

  calculateStreak: async () => {
    if (__DEV__) console.log('🔥 [REVIEW] Calculating streak');

    try {
      const { user } = (get() as any);
      if (!user?.id) {
        if (__DEV__) console.error('❌ [REVIEW] No user found');
        return 0;
      }

      const streak = await dailyReviewService.updateStreak(user.id);
      if (__DEV__) console.log('✅ [REVIEW] Streak calculated:', streak);
      return streak;
    } catch (error: any) {
      if (__DEV__) console.error('❌ [REVIEW] Error calculating streak:', error);
      return 0;
    }
  },

  clearDailyReviewData: () => {
    if (__DEV__) console.log('🧹 Clearing all daily review data');
    set({
      currentReview: null,
      reviewHistory: [],
      isLoading: false,
      error: null
    });
  }
});