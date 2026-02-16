import { supabase } from './supabase.service';
import { getLocalDateString, parseLocalDateString } from '../utils/dateUtils';

export interface DailyReview {
  id?: string;
  user_id: string;
  review_date: string;
  total_actions: number;
  completed_actions: number;
  completion_percentage: number;
  biggest_win?: string;
  key_insight?: string;
  gratitude?: string;
  tomorrow_focus?: string;
  tomorrow_intention?: string;
  points_earned: number;
  streak_day?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MissedAction {
  id?: string;
  review_id: string;
  action_id?: string;
  action_title: string;
  goal_title?: string;
  marked_complete: boolean;
  miss_reason?: string;
  obstacles?: string;
  created_at?: string;
}

class DailyReviewService {
  /**
   * Get or create today's review for a user
   */
  async getOrCreateTodayReview(userId: string): Promise<DailyReview | null> {
    try {
      const today = getLocalDateString();
      
      if (__DEV__) console.log('📝 [REVIEW] Getting review for user:', userId, 'date:', today);
      
      // First try to get existing review
      const { data: existing, error: fetchError } = await supabase
        .from('daily_reviews')
        .select('*')
        .eq('user_id', userId)
        .eq('review_date', today)
        .single();
      
      if (existing) {
        if (__DEV__) console.log('✅ [REVIEW] Found existing review:', existing.id);
        return existing;
      }
      
      // If no review exists, create one
      if (__DEV__) console.log('📝 [REVIEW] Creating new review for today');
      const { data: newReview, error: createError } = await supabase
        .from('daily_reviews')
        .insert({
          user_id: userId,
          review_date: today,
          total_actions: 0,
          completed_actions: 0,
          completion_percentage: 0,
          points_earned: 0,
        })
        .select()
        .single();
      
      if (createError) {
        if (__DEV__) console.error('❌ [REVIEW] Error creating review:', createError);
        return null;
      }
      
      if (__DEV__) console.log('✅ [REVIEW] Created new review:', newReview?.id);
      return newReview;
    } catch (error) {
      if (__DEV__) console.error('❌ [REVIEW] Error in getOrCreateTodayReview:', error);
      return null;
    }
  }

  /**
   * Update a daily review with answers
   */
  async updateReview(reviewId: string, updates: Partial<DailyReview>): Promise<boolean> {
    try {
      if (__DEV__) console.log('📝 [REVIEW] Updating review:', reviewId, updates);
      
      const { error } = await supabase
        .from('daily_reviews')
        .update(updates)
        .eq('id', reviewId);
      
      if (error) {
        if (__DEV__) console.error('❌ [REVIEW] Error updating review:', error);
        return false;
      }
      
      if (__DEV__) console.log('✅ [REVIEW] Review updated successfully');
      return true;
    } catch (error) {
      if (__DEV__) console.error('❌ [REVIEW] Error in updateReview:', error);
      return false;
    }
  }

  /**
   * Save missed action data
   */
  async saveMissedAction(reviewId: string, missedAction: Omit<MissedAction, 'id' | 'review_id' | 'created_at'>): Promise<boolean> {
    try {
      if (__DEV__) console.log('📝 [REVIEW] Saving missed action for review:', reviewId);
      
      // Check if this action already exists for this review
      const { data: existing } = await supabase
        .from('daily_review_missed_actions')
        .select('id')
        .eq('review_id', reviewId)
        .eq('action_id', missedAction.action_id || '')
        .eq('action_title', missedAction.action_title)
        .single();
      
      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('daily_review_missed_actions')
          .update({
            marked_complete: missedAction.marked_complete,
            miss_reason: missedAction.miss_reason,
            obstacles: missedAction.obstacles,
          })
          .eq('id', existing.id);
        
        if (error) {
          if (__DEV__) console.error('❌ [REVIEW] Error updating missed action:', error);
          return false;
        }
      } else {
        // Insert new record
        const { error } = await supabase
          .from('daily_review_missed_actions')
          .insert({
            review_id: reviewId,
            ...missedAction
          });
        
        if (error) {
          if (__DEV__) console.error('❌ [REVIEW] Error inserting missed action:', error);
          return false;
        }
      }
      
      if (__DEV__) console.log('✅ [REVIEW] Missed action saved successfully');
      return true;
    } catch (error) {
      if (__DEV__) console.error('❌ [REVIEW] Error in saveMissedAction:', error);
      return false;
    }
  }

  /**
   * Save all missed actions at once
   */
  async saveMissedActions(reviewId: string, missedActions: Array<Omit<MissedAction, 'id' | 'review_id' | 'created_at'>>): Promise<boolean> {
    try {
      if (__DEV__) console.log('📝 [REVIEW] Saving', missedActions.length, 'missed actions');
      
      // Delete existing missed actions for this review
      await supabase
        .from('daily_review_missed_actions')
        .delete()
        .eq('review_id', reviewId);
      
      // Insert all new missed actions
      if (missedActions.length > 0) {
        const { error } = await supabase
          .from('daily_review_missed_actions')
          .insert(
            missedActions.map(action => ({
              review_id: reviewId,
              ...action
            }))
          );
        
        if (error) {
          if (__DEV__) console.error('❌ [REVIEW] Error saving missed actions:', error);
          return false;
        }
      }
      
      if (__DEV__) console.log('✅ [REVIEW] All missed actions saved');
      return true;
    } catch (error) {
      if (__DEV__) console.error('❌ [REVIEW] Error in saveMissedActions:', error);
      return false;
    }
  }

  /**
   * Get review history for a user
   */
  async getReviewHistory(userId: string, limit: number = 30): Promise<DailyReview[]> {
    try {
      if (__DEV__) console.log('📝 [REVIEW] Getting review history for user:', userId);
      
      const { data, error } = await supabase
        .from('daily_reviews')
        .select('*')
        .eq('user_id', userId)
        .order('review_date', { ascending: false })
        .limit(limit);
      
      if (error) {
        if (__DEV__) console.error('❌ [REVIEW] Error getting review history:', error);
        return [];
      }
      
      if (__DEV__) console.log('✅ [REVIEW] Found', data?.length || 0, 'reviews');
      return data || [];
    } catch (error) {
      if (__DEV__) console.error('❌ [REVIEW] Error in getReviewHistory:', error);
      return [];
    }
  }

  /**
   * Get a specific review with its missed actions
   */
  async getReviewWithMissedActions(reviewId: string): Promise<{ review: DailyReview | null; missedActions: MissedAction[] }> {
    try {
      if (__DEV__) console.log('📝 [REVIEW] Getting review with missed actions:', reviewId);
      
      // Get the review
      const { data: review, error: reviewError } = await supabase
        .from('daily_reviews')
        .select('*')
        .eq('id', reviewId)
        .single();
      
      if (reviewError || !review) {
        if (__DEV__) console.error('❌ [REVIEW] Error getting review:', reviewError);
        return { review: null, missedActions: [] };
      }
      
      // Get missed actions
      const { data: missedActions, error: actionsError } = await supabase
        .from('daily_review_missed_actions')
        .select('*')
        .eq('review_id', reviewId)
        .order('created_at', { ascending: true });
      
      if (actionsError) {
        if (__DEV__) console.error('❌ [REVIEW] Error getting missed actions:', actionsError);
        return { review, missedActions: [] };
      }
      
      if (__DEV__) console.log('✅ [REVIEW] Found review with', missedActions?.length || 0, 'missed actions');
      return { review, missedActions: missedActions || [] };
    } catch (error) {
      if (__DEV__) console.error('❌ [REVIEW] Error in getReviewWithMissedActions:', error);
      return { review: null, missedActions: [] };
    }
  }

  /**
   * Calculate and update streak
   */
  async updateStreak(userId: string): Promise<number> {
    try {
      if (__DEV__) console.log('📝 [REVIEW] Calculating streak for user:', userId);
      
      // Get all reviews ordered by date
      const { data: reviews } = await supabase
        .from('daily_reviews')
        .select('review_date, completion_percentage')
        .eq('user_id', userId)
        .order('review_date', { ascending: false });
      
      if (!reviews || reviews.length === 0) {
        return 0;
      }
      
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < reviews.length; i++) {
        const reviewDate = parseLocalDateString(reviews[i].review_date);
        
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);
        
        // Check if this review is for the expected date and has >50% completion
        if (reviewDate.getTime() === expectedDate.getTime() && reviews[i].completion_percentage >= 50) {
          streak++;
        } else {
          break; // Streak broken
        }
      }
      
      // Update today's review with the streak
      const todayStr = getLocalDateString(today);
      await supabase
        .from('daily_reviews')
        .update({ streak_day: streak })
        .eq('user_id', userId)
        .eq('review_date', todayStr);
      
      if (__DEV__) console.log('✅ [REVIEW] Streak calculated:', streak);
      return streak;
    } catch (error) {
      if (__DEV__) console.error('❌ [REVIEW] Error in updateStreak:', error);
      return 0;
    }
  }
}

export const dailyReviewService = new DailyReviewService();