import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChallengeDebugV2 from '../utils/challengeDebugV2';

// Supabase project configuration
// Fallback to hardcoded values if env vars not set (for EAS builds)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ojusijzhshvviqjeyhyn.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdXNpanpoc2h2dmlxamV5aHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NjU3MjQsImV4cCI6MjA3MTE0MTcyNH0.rlQ9lIGzoaLTOW-5-W0G1J1A0WwvqZMnhGHW-FwV8GQ';

// Log which database we're using
if (__DEV__) {
  console.log('🔵 [SUPABASE] Connecting to database:');
  console.log('  URL:', SUPABASE_URL);
  console.log('  Using env var:', !!process.env.EXPO_PUBLIC_SUPABASE_URL);
}

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

class SupabaseService {
  // Helper to verify session
  async verifySession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (__DEV__) console.log('🔐 [AUTH] Session check:');
      if (__DEV__) console.log('  - Session exists:', !!session);
      if (__DEV__) console.log('  - User exists:', !!user);
      if (__DEV__) console.log('  - User ID:', user?.id || 'none');
      if (__DEV__) console.log('  - User email:', user?.email || 'none');
      
      // CRITICAL: Also check what the app thinks the user is
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (__DEV__) console.log('  - App cached user ID:', parsedUser.id);
          if (user && parsedUser.id !== user.id) {
            if (__DEV__) console.error('🔴 [AUTH] USER ID MISMATCH!');
            if (__DEV__) console.error('  - Supabase user:', user.id);
            if (__DEV__) console.error('  - Cached user:', parsedUser.id);
          }
        } catch (error) {
          if (__DEV__) {
            console.error('Failed to parse stored user:', error);
          }
          await AsyncStorage.removeItem('user');
        }
      }
      
      return { session, user };
    } catch (error) {
      if (__DEV__) console.error('🔴 [AUTH] Session verification failed:', error);
      return { session: null, user: null };
    }
  }

  // Auth methods
  async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });
    
    if (error) throw error;
    
    // CRITICAL: Create profile for new user
    if (data.user) {
      if (__DEV__) console.log('🟦 [AUTH] Creating profile for new user:', data.user.id);
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          name: name,
          email: email
        });
      
      if (profileError && !profileError.message.includes('duplicate')) {
        if (__DEV__) console.error('🔴 [AUTH] Failed to create profile:', profileError);
      } else {
        if (__DEV__) console.log('🟢 [AUTH] Profile created successfully');
      }
    }
    
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    // Get profile from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    return { ...user, ...profile };
  }

  // Goals methods
  async getGoals() {
    try {
      // Verify session first
      const { user } = await this.verifySession();
      if (!user) {
        if (__DEV__) console.log('🔴 [SUPABASE] No user found in getGoals - not authenticated');
        return [];  // Return empty array instead of throwing
      }
      
      if (__DEV__) console.log('🔵 [SUPABASE] Fetching goals for user:', user.id);

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const seenIds = new Set<string>();
      const uniqueData = (data || []).filter(goal => {
        if (seenIds.has(goal.id)) {
          if (__DEV__) console.warn('🟡 [SUPABASE] Duplicate goal ID detected:', goal.id, goal.title);
          return false;
        }
        seenIds.add(goal.id);
        return true;
      });

      if (error) {
        if (__DEV__) console.error('🔴 [SUPABASE] Error fetching goals:', error);
        throw error;
      }

      if (__DEV__) console.log('🟢 [SUPABASE] Retrieved', uniqueData?.length || 0, 'unique goals from database');

      // Calculate consistency for ALL goals in one batch (2 queries total)
      const consistencyResults = await this.getBulkGoalConsistency(user.id);

      // Map consistency results to goals
      const goalsWithConsistency = uniqueData.map((goal) => {
        const result = consistencyResults[goal.id] || { consistency: 0, status: 'On Track' as const };

        return {
          ...goal,
          consistency: result.consistency,
          status: result.status
        };
      });

      return goalsWithConsistency;
    } catch (error) {
      if (__DEV__) console.error('🔴 [SUPABASE] getGoals exception:', error);
      return [];  // Return empty array on error
    }
  }


  async updateGoal(id: string, updates: any) {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Get current user to calculate consistency
    const { user } = await this.verifySession();
    if (!user) {
      return {
        ...data,
        consistency: 0,
        status: 'On Track' as const
      };
    }

    // Calculate consistency for updated goal
    const consistency = await this.getGoalConsistency(id, user.id);

    // Determine status based on consistency
    let status: 'On Track' | 'Needs Attention' | 'Critical';
    if (consistency >= 70) {
      status = 'On Track';
    } else if (consistency >= 40) {
      status = 'Needs Attention';
    } else {
      status = 'Critical';
    }

    return {
      ...data,
      consistency,
      status
    };
  }

  async deleteGoal(id: string) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Actions methods
  async getDailyActions() {
    try {
      // Verify session first
      const { user } = await this.verifySession();
      if (!user) {
        if (__DEV__) console.log('🔴 [SUPABASE] No user found in getDailyActions - not authenticated');
        return [];  // Return empty array instead of throwing
      }
      if (__DEV__) console.log('🔵 [SUPABASE] Fetching daily actions for user:', user.id);

      // Don't filter by date - get ALL user's actions (they're recurring commitments)
      // The 'date' field should track when it was created, not when it's shown
      const { data, error } = await supabase
        .from('actions')
        .select(`
          *,
          goal:goals(id, title, color)
        `)
        .eq('user_id', user.id)
        .order('time', { ascending: true });

      if (error) {
        if (__DEV__) console.error('Error fetching daily actions:', error);
        throw error;
      }

      // Check if completed_at is TODAY for each action
      // Use LOCAL midnight so user's timezone is respected
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Log raw data to debug
      if (__DEV__) console.log('🔵 [SUPABASE] Raw actions from DB:', data?.map(a => ({
        id: a.id,
        title: a.title,
        completed: a.completed,
        completed_at: a.completed_at,
        completed_today: a.completed_at && new Date(a.completed_at) >= today
      })));

      // Transform to camelCase and include goal data
      // IMPORTANT: Override 'completed' field to only be true if completed TODAY (in user's local timezone)
      const transformed = data?.map(action => {
        const completedAt = action.completed_at ? new Date(action.completed_at) : null;
        const completedToday = completedAt && completedAt >= today;
        const result = {
          ...action,
          completed: completedToday, // Only mark as completed if it was done today
          completed_at: action.completed_at,  // KEEP ORIGINAL FIELD!
          created_at: action.created_at,  // PRESERVE CREATED_AT!
          createdAt: action.created_at,  // Add camelCase version too
          goalId: action.goal_id,
          userId: action.user_id,
          completedAt: action.completed_at,
          isAbstinence: action.is_abstinence || false,
          goal: action.goal
        };

        // Debug log for first action
        if (action.title === "Yoga/Stretching") {
          if (__DEV__) console.log('🔥 [TRANSFORM] Yoga action after transform:', {
            original_completed_at: action.completed_at,
            result_completed_at: result.completed_at,
            result_completedAt: result.completedAt
          });
        }

        return result;
      }) || [];

      if (__DEV__) console.log('🔥 [TRANSFORM] First transformed action:', transformed[0]?.completed_at, transformed[0]?.completedAt);
      return transformed;
    } catch (error) {
      if (__DEV__) console.error('getDailyActions error:', error);
      return [];  // Return empty array on error
    }
  }

  async createAction(action: {
    title: string;
    time?: string;
    goalId?: string;
    frequency?: string;
    scheduled_days?: string[];
    isAbstinence?: boolean;
  }) {
    if (__DEV__) console.log('🔵 [SUPABASE] createAction called:', action.title, 'isAbstinence:', action.isAbstinence);

    // Verify session first
    const { user } = await this.verifySession();
    if (!user) {
      if (__DEV__) console.error('🔴 [SUPABASE] Not authenticated - cannot create action!');
      throw new Error('Not authenticated');
    }
    if (__DEV__) console.log('🔵 [SUPABASE] Creating action for user ID:', user.id);

    // Remove goalId from action to avoid conflict
    const { goalId, ...actionData } = action;
    if (__DEV__) console.log('🔵 [SUPABASE] Creating action with goalId:', goalId, 'frequency:', action.frequency, 'scheduled_days:', action.scheduled_days);

    const { data, error } = await supabase
      .from('actions')
      .insert({
        ...actionData,
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],  // Creation date for tracking
        completed: false,
        goal_id: goalId,  // Map goalId to goal_id
        frequency: action.frequency || 'daily',
        scheduled_days: action.scheduled_days || null,
        is_abstinence: action.isAbstinence || false
      })
      .select()
      .single();

    if (error) {
      if (__DEV__) console.error('🔴 [SUPABASE] createAction error:', error.message);
      throw error;
    }
    if (__DEV__) console.log('🟢 [SUPABASE] Action created successfully, ID:', data.id);
    
    // Verify the action was actually saved
    if (__DEV__) console.log('🔵 [SUPABASE] Verifying action was saved...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('actions')
      .select('*')
      .eq('id', data.id)
      .single();
    
    if (verifyError || !verifyData) {
      if (__DEV__) console.error('🔴 [SUPABASE] Action verification failed!', verifyError);
      throw new Error('Action creation verification failed');
    }
    
    if (__DEV__) console.log('🟢 [SUPABASE] Action verified in database:', verifyData.title);
    return data;
  }

  async completeAction(id: string) {
    if (__DEV__) console.log('🔵 [SUPABASE] Completing action:', id);

    // Get current user
    const { user } = await this.verifySession();
    if (!user) throw new Error('User not authenticated');

    // First, insert into action_completions to track this completion
    const { error: completionError } = await supabase
      .from('action_completions')
      .insert({
        action_id: id,
        user_id: user.id,
        completed_at: new Date().toISOString(),
      });

    if (completionError) {
      if (__DEV__) console.error('❌ [SUPABASE] Error logging completion:', completionError);
      // Continue even if logging fails - don't break the user experience
    } else {
      if (__DEV__) console.log('✅ [SUPABASE] Completion logged in action_completions table');
    }

    // Update the actions table with completion status
    const { data, error } = await supabase
      .from('actions')
      .update({
        completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (__DEV__) console.error('🔴 [SUPABASE] Error updating action:', error);
      throw error;
    }

    if (__DEV__) console.log('🟢 [SUPABASE] Action completed successfully:', data);
    return data;
  }

  async uncompleteAction(id: string) {
    if (__DEV__) console.log('🔵 [SUPABASE] Uncompleting action:', id);

    // Get current user
    const { user } = await this.verifySession();
    if (!user) throw new Error('User not authenticated');

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Delete today's completion from action_completions
    const { error: deleteError } = await supabase
      .from('action_completions')
      .delete()
      .eq('action_id', id)
      .eq('user_id', user.id)
      .gte('completed_at', today.toISOString())
      .lt('completed_at', tomorrow.toISOString());

    if (deleteError) {
      if (__DEV__) console.error('❌ [SUPABASE] Error deleting completion:', deleteError);
    } else {
      if (__DEV__) console.log('✅ [SUPABASE] Completion removed from action_completions table');
    }

    // Update the actions table to mark as incomplete
    const { data, error } = await supabase
      .from('actions')
      .update({
        completed: false,
        completed_at: null,
        failed: false
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (__DEV__) console.error('🔴 [SUPABASE] Error updating action:', error);
      throw error;
    }

    if (__DEV__) console.log('🟢 [SUPABASE] Action uncompleted successfully:', data);
    return data;
  }

  async updateAction(id: string, updates: any) {
    const { data, error } = await supabase
      .from('actions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteAction(id: string) {
    const { error } = await supabase
      .from('actions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ⚠️ IMPORTANT: This calculates HISTORICAL consistency (all-time), not today's completion
  // Formula: (total completions) / (number of actions × days since oldest action)
  // This gives the overall consistency percentage since the user started tracking
  async getGoalCompletionStats(userId: string) {
    if (__DEV__) console.log('📊 [SUPABASE] Fetching HISTORICAL goal completion stats for user:', userId);

    // Get all goals with their creation dates
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, title, created_at')
      .eq('user_id', userId);

    if (goalsError) {
      if (__DEV__) console.error('Error fetching goals:', goalsError);
      return {};
    }

    const stats: Record<string, { expected: number; completed: number; percentage: number }> = {};

    for (const goal of goals || []) {
      // Get actions linked to this goal
      const { data: actions, error: actionsError } = await supabase
        .from('actions')
        .select('id, created_at')
        .eq('goal_id', goal.id)
        .eq('user_id', userId);

      if (actionsError) {
        if (__DEV__) console.error(`Error fetching actions for goal ${goal.id}:`, actionsError);
        continue;
      }

      if (!actions || actions.length === 0) {
        stats[goal.title] = { expected: 0, completed: 0, percentage: 0 };
        continue;
      }

      // Find the oldest action to calculate the historical period
      const oldestAction = actions.reduce((oldest, action) => {
        const actionDate = new Date(action.created_at);
        return actionDate < oldest ? actionDate : oldest;
      }, new Date(actions[0].created_at));

      const today = new Date();
      today.setHours(23, 59, 59, 999);

      // Calculate days since the oldest action was created
      const daysSinceStart = Math.floor((today.getTime() - oldestAction.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Expected completions = number of actions * days since start
      const expectedCompletions = actions.length * daysSinceStart;

      // Get actual completion count from action_completions table
      // Count ALL historical completions for this goal's actions
      let completedCount = 0;

      const actionIds = actions.map(a => a.id);
      const { count, error: countError } = await supabase
        .from('action_completions')
        .select('*', { count: 'exact', head: true })
        .in('action_id', actionIds);

      if (!countError) {
        completedCount = count || 0;
      } else {
        if (__DEV__) console.warn('⚠️ [SUPABASE] Error counting completions:', countError);
      }

      const percentage = expectedCompletions > 0
        ? Math.round((completedCount / expectedCompletions) * 100)
        : 0;

      stats[goal.id] = {
        expected: expectedCompletions,
        completed: completedCount,
        percentage
      };

      if (__DEV__) console.log(`📊 Goal "${goal.title}": ${completedCount}/${expectedCompletions} = ${percentage}% (${actions.length} actions × ${daysSinceStart} days)`);
    }

    return stats;
  }

  private countWeekdaysInRange(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  private countWeekendsInRange(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  private countScheduledDaysInRange(startDate: Date, endDate: Date, scheduledDays: string[]): number {
    let count = 0;
    const current = new Date(startDate);

    const dayMap: { [key: string]: number } = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    };

    const scheduledDayNumbers = scheduledDays.map(day => dayMap[day.toLowerCase()]).filter(d => d !== undefined);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (scheduledDayNumbers.includes(dayOfWeek)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  async getBulkGoalConsistency(userId: string): Promise<Record<string, { consistency: number; status: 'On Track' | 'Needs Attention' | 'Critical' }>> {
    if (__DEV__) console.log('📊 [SUPABASE] Calculating bulk goal consistency');

    const results: Record<string, { consistency: number; status: 'On Track' | 'Needs Attention' | 'Critical' }> = {};

    try {
      // Get ALL actions for user in ONE query
      const { data: allActions, error: actionsError } = await supabase
        .from('actions')
        .select('id, created_at, goal_id, frequency, scheduled_days')
        .eq('user_id', userId);

      if (actionsError || !allActions || allActions.length === 0) {
        if (__DEV__) console.log('No actions found for user');
        return {};
      }

      const today = new Date();
      today.setHours(23, 59, 59, 999);

      // Get ALL completions in ONE query
      const actionIds = allActions.map(a => a.id);
      const { data: allCompletions, error: completionError } = await supabase
        .from('action_completions')
        .select('action_id')
        .in('action_id', actionIds);

      if (completionError) {
        if (__DEV__) console.error('Error fetching completions:', completionError);
        return {};
      }

      // Group actions by goal_id
      const actionsByGoal = allActions.reduce((acc, action) => {
        if (!action.goal_id) return acc;
        if (!acc[action.goal_id]) acc[action.goal_id] = [];
        acc[action.goal_id].push(action);
        return acc;
      }, {} as Record<string, typeof allActions>);

      // Count completions by action_id for fast lookup
      const completionCountByAction: Record<string, number> = {};
      (allCompletions || []).forEach(completion => {
        completionCountByAction[completion.action_id] = (completionCountByAction[completion.action_id] || 0) + 1;
      });

      // Calculate consistency for each goal
      for (const [goalId, actions] of Object.entries(actionsByGoal)) {
        let totalExpected = 0;
        let totalCompleted = 0;

        for (const action of actions) {
          const actionCreatedAt = new Date(action.created_at);
          actionCreatedAt.setHours(0, 0, 0, 0);
          const daysForThisAction = Math.floor((today.getTime() - actionCreatedAt.getTime()) / (1000 * 60 * 60 * 24)) + 1;

          const frequency = action.frequency || 'daily';
          const scheduledDays = action.scheduled_days;

          let expectedForAction = 0;

          switch (frequency) {
            case 'daily':
              expectedForAction = daysForThisAction;
              break;
            case 'weekly':
              expectedForAction = Math.floor(daysForThisAction / 7);
              break;
            case 'weekdays':
              expectedForAction = this.countWeekdaysInRange(actionCreatedAt, today);
              break;
            case 'weekends':
              expectedForAction = this.countWeekendsInRange(actionCreatedAt, today);
              break;
            case 'every_other_day':
              expectedForAction = Math.floor(daysForThisAction / 2);
              break;
            case 'three_per_week':
              expectedForAction = Math.floor((daysForThisAction / 7) * 3);
              break;
            case 'custom':
              if (scheduledDays && Array.isArray(scheduledDays)) {
                expectedForAction = this.countScheduledDaysInRange(actionCreatedAt, today, scheduledDays);
              } else {
                expectedForAction = daysForThisAction;
              }
              break;
            default:
              expectedForAction = daysForThisAction;
          }

          totalExpected += expectedForAction;
          totalCompleted += completionCountByAction[action.id] || 0;
        }

        const percentage = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;

        let status: 'On Track' | 'Needs Attention' | 'Critical';
        if (percentage >= 70) {
          status = 'On Track';
        } else if (percentage >= 40) {
          status = 'Needs Attention';
        } else {
          status = 'Critical';
        }

        results[goalId] = { consistency: percentage, status };

        if (__DEV__) console.log(`📊 Goal ${goalId}: ${totalCompleted}/${totalExpected} = ${percentage}%`);
      }

      return results;
    } catch (error) {
      if (__DEV__) console.error('Error calculating bulk goal consistency:', error);
      return {};
    }
  }

  async getGoalConsistency(goalId: string, userId: string) {
    if (__DEV__) console.log('📊 [SUPABASE] Calculating consistency for goal:', goalId);

    // Get all actions linked to this goal
    const { data: actions, error: actionsError } = await supabase
      .from('actions')
      .select('id, created_at, title, frequency, scheduled_days')
      .eq('user_id', userId)
      .eq('goal_id', goalId);

    if (actionsError || !actions || actions.length === 0) {
      if (__DEV__) console.log('No actions found for goal or error:', actionsError);
      return 0;
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Calculate total expected based on each action's frequency
    let totalExpected = 0;

    for (const action of actions) {
      const actionCreatedAt = new Date(action.created_at);
      actionCreatedAt.setHours(0, 0, 0, 0);
      const daysForThisAction = Math.floor((today.getTime() - actionCreatedAt.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const frequency = action.frequency || 'daily';
      const scheduledDays = action.scheduled_days;

      let expectedForAction = 0;

      switch (frequency) {
        case 'daily':
          expectedForAction = daysForThisAction;
          break;
        case 'weekly':
          expectedForAction = Math.floor(daysForThisAction / 7);
          break;
        case 'weekdays':
          expectedForAction = this.countWeekdaysInRange(actionCreatedAt, today);
          break;
        case 'weekends':
          expectedForAction = this.countWeekendsInRange(actionCreatedAt, today);
          break;
        case 'every_other_day':
          expectedForAction = Math.floor(daysForThisAction / 2);
          break;
        case 'three_per_week':
          expectedForAction = Math.floor((daysForThisAction / 7) * 3);
          break;
        case 'custom':
          if (scheduledDays && Array.isArray(scheduledDays)) {
            expectedForAction = this.countScheduledDaysInRange(actionCreatedAt, today, scheduledDays);
          } else {
            expectedForAction = daysForThisAction;
          }
          break;
        default:
          expectedForAction = daysForThisAction;
      }

      totalExpected += expectedForAction;
    }

    if (totalExpected === 0) {
      return 0;
    }

    // Get actual completions from action_completions table
    const actionIds = actions.map(a => a.id);

    const { count: totalCompleted, error: completionError } = await supabase
      .from('action_completions')
      .select('*', { count: 'exact', head: true })
      .in('action_id', actionIds);

    if (completionError) {
      if (__DEV__) console.error('Error fetching completions for goal:', completionError);
      return 0;
    }

    const percentage = Math.round(((totalCompleted || 0) / totalExpected) * 100);

    if (__DEV__) console.log(`📊 Goal consistency: ${totalCompleted || 0}/${totalExpected} = ${percentage}%`);

    return percentage;
  }

  async getWeeklyCompletionStats(userId: string): Promise<number> {
    if (__DEV__) console.log('📅 [SUPABASE] Calculating weekly completion stats');

    try {
      // Get all user actions
      const { data: actions, error: actionsError } = await supabase
        .from('actions')
        .select('id, created_at, frequency, scheduled_days')
        .eq('user_id', userId);

      if (actionsError || !actions || actions.length === 0) {
        if (__DEV__) console.log('No actions found for user or error:', actionsError);
        return 0;
      }

      // Get start of current week (Monday at 00:00:00)
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Monday start
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - diff);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date();
      weekEnd.setHours(23, 59, 59, 999);

      if (__DEV__) console.log(`📅 Week range: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);

      // Calculate expected completions for THIS WEEK
      let totalExpected = 0;

      for (const action of actions) {
        const actionCreatedAt = new Date(action.created_at);
        actionCreatedAt.setHours(0, 0, 0, 0);

        // If action was created after week started, use action start date
        const effectiveStart = actionCreatedAt > weekStart ? actionCreatedAt : weekStart;

        // If action was created after this week, skip it
        if (actionCreatedAt > weekEnd) {
          continue;
        }

        const daysInWeek = Math.floor((weekEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const frequency = action.frequency || 'daily';
        const scheduledDays = action.scheduled_days;

        let expectedForAction = 0;

        switch (frequency) {
          case 'daily':
            expectedForAction = daysInWeek;
            break;
          case 'weekly':
            expectedForAction = daysInWeek >= 7 ? 1 : 0;
            break;
          case 'weekdays':
            expectedForAction = this.countWeekdaysInRange(effectiveStart, weekEnd);
            break;
          case 'weekends':
            expectedForAction = this.countWeekendsInRange(effectiveStart, weekEnd);
            break;
          case 'every_other_day':
            expectedForAction = Math.ceil(daysInWeek / 2);
            break;
          case 'three_per_week':
            expectedForAction = Math.min(3, daysInWeek); // Up to 3 per week
            break;
          case 'custom':
            if (scheduledDays && Array.isArray(scheduledDays)) {
              expectedForAction = this.countScheduledDaysInRange(effectiveStart, weekEnd, scheduledDays);
            } else {
              expectedForAction = daysInWeek;
            }
            break;
          default:
            expectedForAction = daysInWeek;
        }

        totalExpected += expectedForAction;
      }

      if (totalExpected === 0) {
        return 0;
      }

      // Get actual completions from THIS WEEK
      const actionIds = actions.map(a => a.id);

      const { count: totalCompleted, error: completionError } = await supabase
        .from('action_completions')
        .select('*', { count: 'exact', head: true })
        .in('action_id', actionIds)
        .gte('completed_at', weekStart.toISOString())
        .lte('completed_at', weekEnd.toISOString());

      if (completionError) {
        if (__DEV__) console.error('Error fetching weekly completions:', completionError);
        return 0;
      }

      const percentage = Math.round(((totalCompleted || 0) / totalExpected) * 100);

      if (__DEV__) console.log(`📅 Weekly progress: ${totalCompleted || 0}/${totalExpected} = ${percentage}%`);

      return percentage;
    } catch (error) {
      if (__DEV__) console.error('Error calculating weekly stats:', error);
      return 0;
    }
  }

  async getBulkOverallCompletionStats(userIds: string[]) {
    if (__DEV__) console.log(`📊 [SUPABASE] Fetching bulk completion stats for ${userIds.length} users`);

    const results: Record<string, { expected: number; completed: number; percentage: number }> = {};

    try {
      // Fetch all actions for all users in one query
      const { data: allActions, error: actionsError } = await supabase
        .from('actions')
        .select('id, created_at, user_id, frequency, scheduled_days')
        .in('user_id', userIds);

      if (actionsError || !allActions) {
        if (__DEV__) console.error('Error fetching bulk actions:', actionsError);
        userIds.forEach(id => {
          results[id] = { expected: 0, completed: 0, percentage: 0 };
        });
        return results;
      }

      // Get all action IDs
      const allActionIds = allActions.map(a => a.id);

      // Fetch all completions in one query
      const { data: allCompletions, error: completionError } = await supabase
        .from('action_completions')
        .select('action_id, user_id')
        .in('action_id', allActionIds);

      // Fetch challenge participations with stored completion percentages
      const { data: allParticipants, error: participantsError } = await supabase
        .from('challenge_participants')
        .select('user_id, completion_percentage, completed_days, days_taken, challenges(duration_days, predetermined_activities), selected_activity_ids, joined_at')
        .in('user_id', userIds)
        .neq('status', 'left');  // Include active AND completed challenges

      console.log('🔍 [DEBUG] Query userIds:', userIds);
      console.log('🔍 [DEBUG] Challenge participants found:', allParticipants?.length || 0);
      console.log('🔍 [DEBUG] Participants data:', JSON.stringify(allParticipants, null, 2));
      if (participantsError) {
        console.error('🔴 [ERROR] Error fetching participants:', participantsError);
        console.error('🔴 [ERROR] Error details:', JSON.stringify(participantsError, null, 2));
      }

      // Calculate stats for each user
      for (const userId of userIds) {
        const userActions = allActions.filter(a => a.user_id === userId);

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        let totalExpected = 0;
        let totalCompleted = 0;

        // Calculate regular action stats (if user has any)
        if (userActions.length > 0) {
          for (const action of userActions) {
            const actionCreatedAt = new Date(action.created_at);
            actionCreatedAt.setHours(0, 0, 0, 0);
            const daysForThisAction = Math.floor((today.getTime() - actionCreatedAt.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            const frequency = action.frequency || 'daily';
            let expectedForAction = daysForThisAction;

            switch (frequency) {
              case 'weekly':
                expectedForAction = Math.floor(daysForThisAction / 7);
                break;
              case 'weekdays':
                expectedForAction = this.countWeekdaysInRange(actionCreatedAt, today);
                break;
              case 'weekends':
                expectedForAction = this.countWeekendsInRange(actionCreatedAt, today);
                break;
              case 'every_other_day':
                expectedForAction = Math.floor(daysForThisAction / 2);
                break;
              case 'three_per_week':
                expectedForAction = Math.floor((daysForThisAction / 7) * 3);
                break;
            }

            totalExpected += expectedForAction;
          }

          const userActionIds = userActions.map(a => a.id);
          totalCompleted = allCompletions?.filter(c => userActionIds.includes(c.action_id)).length || 0;
        }

        // Calculate weighted average with stored challenge percentages
        const userParticipants = allParticipants?.filter(p => p.user_id === userId) || [];

        // Calculate regular action stats
        const regularExpected = totalExpected;
        const regularCompleted = totalCompleted;
        const regularPercentage = regularExpected > 0 ? Math.round((regularCompleted / regularExpected) * 100) : 0;

        // Get challenge stats from stored database values
        let challengeTotalExpected = 0;
        let challengeWeightedCompleted = 0;

        for (const participant of userParticipants) {
          const challenge = participant.challenges as any;
          const durationDays = challenge?.duration_days || 0;

          // Calculate days since participant joined
          const joinedDate = new Date(participant.joined_at);
          const today = new Date();
          const daysSinceJoin = Math.floor((today.getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const daysToCount = Math.min(daysSinceJoin, durationDays);

          let activitiesPerDay = 0;
          if (participant.selected_activity_ids && participant.selected_activity_ids.length > 0) {
            activitiesPerDay = participant.selected_activity_ids.length;
          } else if (challenge?.predetermined_activities) {
            activitiesPerDay = challenge.predetermined_activities.length;
          }

          const challengeExpected = activitiesPerDay * daysToCount;
          challengeTotalExpected += challengeExpected;

          // Use STORED completion_percentage from database
          const storedPercentage = participant.completion_percentage || 0;
          const challengeCompleted = Math.round((challengeExpected * storedPercentage) / 100);
          challengeWeightedCompleted += challengeCompleted;

          if (__DEV__) {
            console.log(`📊 [Circle] Challenge: ${storedPercentage}% (DB stored) = ${challengeCompleted}/${challengeExpected} weighted`);
          }
        }

        // Weighted average of regular + challenge
        totalExpected = regularExpected + challengeTotalExpected;
        totalCompleted = regularCompleted + challengeWeightedCompleted;
        const percentage = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;

        if (__DEV__ && (regularExpected > 0 || challengeTotalExpected > 0)) {
          console.log(`📊 [Circle] User overall: Regular ${regularCompleted}/${regularExpected} (${regularPercentage}%) + Challenge ${challengeWeightedCompleted}/${challengeTotalExpected} = ${totalCompleted}/${totalExpected} (${percentage}%)`);
        }

        results[userId] = {
          expected: totalExpected,
          completed: totalCompleted,
          percentage
        };
      }

      if (__DEV__) console.log(`✅ [SUPABASE] Bulk stats calculated for ${userIds.length} users`);
      return results;
    } catch (error) {
      if (__DEV__) console.error('Error in bulk stats:', error);
      userIds.forEach(id => {
        results[id] = { expected: 0, completed: 0, percentage: 0 };
      });
      return results;
    }
  }

  async getOverallCompletionStats(userId: string) {
    if (__DEV__) console.log('📊 [SUPABASE] Fetching overall completion stats for user:', userId);

    // Get all unique action templates (not daily instances) with frequency data
    const { data: actions, error: actionsError } = await supabase
      .from('actions')
      .select('id, created_at, title, goal_id, frequency, scheduled_days')
      .eq('user_id', userId);

    if (actionsError || !actions || actions.length === 0) {
      if (__DEV__) console.error('Error fetching actions or no actions found:', actionsError);
      return { expected: 0, completed: 0, percentage: 0 };
    }

    // Calculate the oldest action creation date to determine tracking period
    const oldestActionDate = actions.reduce((oldest, action) => {
      const actionDate = new Date(action.created_at);
      return actionDate < oldest ? actionDate : oldest;
    }, new Date());

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const daysSinceStart = Math.floor((today.getTime() - oldestActionDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Calculate total expected based on each action's frequency
    let totalExpected = 0;

    if (__DEV__) console.log('🔍 [DEBUG] Processing actions with frequencies:');
    for (const action of actions) {
      const actionCreatedAt = new Date(action.created_at);
      actionCreatedAt.setHours(0, 0, 0, 0);
      const daysForThisAction = Math.floor((today.getTime() - actionCreatedAt.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const frequency = action.frequency || 'daily';
      const scheduledDays = action.scheduled_days;

      let expectedForAction = 0;

      switch (frequency) {
        case 'daily':
          expectedForAction = daysForThisAction;
          break;
        case 'weekly':
          expectedForAction = Math.floor(daysForThisAction / 7);
          break;
        case 'weekdays':
          // Count weekdays in the period
          expectedForAction = this.countWeekdaysInRange(actionCreatedAt, today);
          break;
        case 'weekends':
          // Count weekend days in the period
          expectedForAction = this.countWeekendsInRange(actionCreatedAt, today);
          break;
        case 'every_other_day':
          expectedForAction = Math.floor(daysForThisAction / 2);
          break;
        case 'three_per_week':
          expectedForAction = Math.floor((daysForThisAction / 7) * 3);
          break;
        case 'custom':
          // For custom schedules, count how many scheduled days occurred
          if (scheduledDays && Array.isArray(scheduledDays)) {
            expectedForAction = this.countScheduledDaysInRange(actionCreatedAt, today, scheduledDays);
          } else {
            expectedForAction = daysForThisAction; // Fallback to daily
          }
          break;
        default:
          expectedForAction = daysForThisAction; // Default to daily
      }

      if (__DEV__) console.log(`   - "${action.title}": frequency=${frequency}, days=${daysForThisAction}, expected=${expectedForAction}`);
      totalExpected += expectedForAction;
    }
    if (__DEV__) console.log(`🔍 [DEBUG] Total expected: ${totalExpected}`);

    // Get actual completions from action_completions table
    const actionIds = actions.map(a => a.id);
    if (__DEV__) console.log(`🔍 [DEBUG] Querying action_completions for ${actionIds.length} action IDs`);

    const { count: totalCompleted, error: completionError } = await supabase
      .from('action_completions')
      .select('*', { count: 'exact', head: true })
      .in('action_id', actionIds);

    if (__DEV__) console.log(`🔍 [DEBUG] Completions query result: count=${totalCompleted}, error=${completionError ? 'YES' : 'NO'}`);

    if (completionError) {
      if (__DEV__) console.error('Error fetching completions:', completionError);

      // Fallback: If action_completions fails, check how many actions have completed_at
      // This gives us at least TODAY's completion status
      const { data: completedActions } = await supabase
        .from('actions')
        .select('id')
        .eq('user_id', userId)
        .not('completed_at', 'is', null);

      const fallbackCompleted = completedActions?.length || 0;
      const fallbackPercentage = totalExpected > 0
        ? Math.round((fallbackCompleted / totalExpected) * 100)
        : 0;

      if (__DEV__) console.log(`📊 Overall stats for ${userId} (using fallback):`);
      if (__DEV__) console.log(`   - Unique actions: ${actions.length}`);
      if (__DEV__) console.log(`   - Days tracking: ${daysSinceStart}`);
      if (__DEV__) console.log(`   - Expected: ${totalExpected}`);
      if (__DEV__) console.log(`   - Completed today: ${fallbackCompleted}`);
      if (__DEV__) console.log(`   - Percentage (TODAY ONLY): ${fallbackPercentage}%`);

      return {
        expected: totalExpected,
        completed: fallbackCompleted,
        percentage: fallbackPercentage
      };
    }

    const percentage = totalExpected > 0
      ? Math.round((totalCompleted / totalExpected) * 100)
      : 0;

    if (__DEV__) console.log(`📊 Overall stats for ${userId}:`);
    if (__DEV__) console.log(`   - Unique actions: ${actions.length}`);
    if (__DEV__) console.log(`   - Days tracking: ${daysSinceStart}`);
    if (__DEV__) console.log(`   - Expected (based on frequencies): ${totalExpected}`);
    if (__DEV__) console.log(`   - Completed (from action_completions): ${totalCompleted}`);
    if (__DEV__) console.log(`   - Percentage: ${percentage}%`);

    return {
      expected: totalExpected,
      completed: totalCompleted || 0,
      percentage
    };
  }
  
  async getTodaysCompletedActions() {
    try {
      const { user } = await this.verifySession();
      if (!user) {
        if (__DEV__) console.log('🔴 [SUPABASE] No user found - not authenticated');
        return [];
      }
      
      if (__DEV__) console.log('🔵 [SUPABASE] Fetching today\'s completed actions for user:', user.id);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get completed actions from the actions table
      const { data: actions, error: actionsError } = await supabase
        .from('actions')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('completed_at', today.toISOString())
        .order('completed_at', { ascending: false });
      
      if (actionsError) {
        if (__DEV__) console.error('🔴 [SUPABASE] Error fetching completed actions:', actionsError);
        return [];
      }
      
      if (__DEV__) console.log('🟢 [SUPABASE] Found', actions?.length || 0, 'completed actions today');
      
      // Convert to CompletedAction format
      return (actions || []).map(a => ({
        id: `${a.id}-completed`,
        actionId: a.id,
        title: a.title,
        goalId: a.goal?.id || a.goal_id,
        goalTitle: a.goal?.title,
        completedAt: a.completed_at || new Date().toISOString(),
        isPrivate: false,
        streak: 1,
        type: 'check',
        category: a.category
      }));
    } catch (error) {
      if (__DEV__) console.error('🔴 [SUPABASE] getTodaysCompletedActions error:', error);
      return [];
    }
  }

  // Profile methods
  async updateProfile(updates: { avatar?: string; name?: string; bio?: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    if (__DEV__) console.log('🔵 [SUPABASE] Updating profile for user:', user.id, 'with updates:', JSON.stringify(updates));

    // Handle avatar - upload to Storage if base64 or file URI
    let avatarUrl = updates.avatar;
    if (avatarUrl && (avatarUrl.startsWith('data:image') || avatarUrl.startsWith('file://'))) {
      if (__DEV__) console.log('🔵 [STORAGE] Uploading avatar to Supabase Storage...');
      try {
        avatarUrl = await this.uploadImage(avatarUrl, user.id);
        if (__DEV__) console.log('✅ [STORAGE] Avatar uploaded:', avatarUrl);
      } catch (uploadError) {
        if (__DEV__) console.error('⚠️ [STORAGE] Avatar upload failed, storing base64 as fallback:', uploadError);
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.bio !== undefined) updateData.bio = updates.bio;

    if (__DEV__) console.log('🔵 [SUPABASE] Update data being sent to DB:', JSON.stringify(updateData));

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      if (__DEV__) console.error('🔴 [SUPABASE] Error updating profile:', error);
      throw error;
    }

    if (__DEV__) console.log('🟢 [SUPABASE] Profile updated successfully. Returned data:', JSON.stringify(data));
    return data;
  }

  // Posts methods
  async getFeed(type: 'circle' | 'follow' = 'circle', limit: number = 5, offset: number = 0, circleId?: string | null) {
    const { data: { user } } = await supabase.auth.getUser();

    if (__DEV__) console.log('🟦 [FEED] getFeed called:', { type, userId: user?.id, limit, offset, circleId });

    // Must be authenticated to see feeds
    if (!user) {
      if (__DEV__) console.log('🔴 [FEED] No authenticated user for feed');
      return { posts: [], hasMore: false };
    }

    if (type === 'circle') {
      let targetCircleId = circleId;

      // If no specific circle provided and not "All Circles" mode, use profile circle
      if (targetCircleId === undefined) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('circle_id')
          .eq('id', user.id)
          .single();

        if (!profile?.circle_id) {
          if (__DEV__) console.log('🟡 [FEED] User', user.id, 'has no circle_id - returning empty circle feed');
          return { posts: [], hasMore: false };
        }
        targetCircleId = profile.circle_id;
      }

      // If circleId is null, it means "All Circles" - get posts from all user's circles
      let memberIds: string[] = [];
      let userCircleIds: string[] = []; // Define at top level for use in query

      if (targetCircleId === null) {
        if (__DEV__) console.log('🟦 [FEED] Fetching posts from ALL user circles');

        // Get all circles the user belongs to
        const { data: userMemberships } = await supabase
          .from('circle_members')
          .select('circle_id')
          .eq('user_id', user.id);

        if (!userMemberships || userMemberships.length === 0) {
          if (__DEV__) console.log('🟡 [FEED] User is not in any circles');
          return { posts: [], hasMore: false };
        }

        userCircleIds = userMemberships.map(m => m.circle_id);

        // Get all members from all user's circles
        const { data: allMembers } = await supabase
          .from('circle_members')
          .select('user_id')
          .in('circle_id', userCircleIds);

        memberIds = allMembers?.map(m => m.user_id).filter(id => id !== null) || [];
        if (__DEV__) console.log('🟦 [FEED] Total members across all circles:', memberIds.length);
      } else {
        if (__DEV__) console.log('🟦 [FEED] Fetching posts from specific circle:', targetCircleId);

        // For specific circle, userCircleIds contains just this circle
        userCircleIds = [targetCircleId];

        // Get members from specific circle
        const { data: members } = await supabase
          .from('circle_members')
          .select('user_id')
          .eq('circle_id', targetCircleId);

        memberIds = members?.map(m => m.user_id).filter(id => id !== null) || [];
        if (__DEV__) console.log('🟦 [FEED] Circle members found:', memberIds.length);
      }

      if (__DEV__) console.log('🟦 [FEED] Valid member IDs:', memberIds);
      
      // CRITICAL FIX #2: If no members in circle, return empty (don't fetch ALL posts)
      if (memberIds.length === 0) {
        if (__DEV__) console.log('🔴 [FEED] User has no circle members - returning empty feed');
        return { posts: [], hasMore: false };
      }
      
      // Get posts from circle members with profile info (with pagination)
      // Add the current user to memberIds to see their own posts
      const idsToQuery = [...new Set([...memberIds, user.id])];
      
      // Build the query based on whether we're filtering for a specific circle
      let query = supabase
        .from('posts')
        .select(`
          id,
          user_id,
          type,
          content,
          media_url,
          action_title,
          goal_title,
          goal_color,
          streak,
          created_at,
          visibility,
          circle_id,
          is_challenge,
          challenge_name,
          challenge_id,
          challenge_progress,
          leaderboard_position,
          total_participants,
          is_celebration,
          celebration_type,
          metadata,
          post_reactions!left(user_id),
          post_comments!left(id, content, user_id, created_at),
          post_circles!left(circle_id)
        `, { count: 'exact' })
        .in('user_id', idsToQuery);  // Only posts from circle members + self

      // CRITICAL FIX: Filter using post_circles junction table for multi-circle support
      if (targetCircleId !== null) {
        // For specific circle: Get posts that are in post_circles for this circle
        // OR posts with old circle_id field (backward compatibility)
        // OR public posts
        if (__DEV__) console.log('🔒 [FEED] Filtering posts for specific circle:', targetCircleId);

        // We can't filter on joined table directly in Supabase, so we'll fetch and filter in JS
        // Alternative: fetch all and filter client-side
      } else {
        // For "All Circles": show posts from any of user's circles OR public posts
        if (__DEV__) console.log('🔓 [FEED] Showing posts from all user circles:', userCircleIds.length);
      }

      const { data: posts, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        if (__DEV__) console.error('❌ [FEED] Error fetching circle posts:', error);
        throw error;
      }

      // DEBUG: Log what we actually got from database
      if (posts && posts.length > 0) {
        if (__DEV__) console.log('🔍 [DEBUG] First post from DB - all fields:', Object.keys(posts[0]));
        if (__DEV__) console.log('🔍 [DEBUG] First post challenge fields:', {
          is_challenge: posts[0].is_challenge,
          challenge_name: posts[0].challenge_name,
          challenge_id: posts[0].challenge_id
        });
        if (__DEV__) console.log('🔍 [DEBUG] First post circles:', posts[0].post_circles);
      }

      if (__DEV__) console.log('📬 [FEED] Raw posts fetched from DB:', posts?.length || 0, 'posts');

      // CRITICAL: Filter posts based on post_circles junction table
      let filteredPosts = posts || [];

      if (targetCircleId !== null) {
        // Filter for specific circle
        filteredPosts = (posts || []).filter(post => {
          // Check if post is in the target circle via post_circles
          const inCircleViaJunction = post.post_circles?.some((pc: any) => pc.circle_id === targetCircleId);

          // Check backward compatibility with old circle_id field
          const inCircleViaOldField = post.circle_id === targetCircleId;

          // Public posts are visible everywhere
          const isPublic = post.visibility === 'public';

          const shouldShow = inCircleViaJunction || inCircleViaOldField || isPublic;

          if (shouldShow) {
            if (__DEV__) console.log('✅ [FILTER] Post', post.id, 'included:', {
              viaJunction: inCircleViaJunction,
              viaOldField: inCircleViaOldField,
              isPublic,
              post_circles: post.post_circles
            });
          }

          return shouldShow;
        });

        if (__DEV__) console.log('🔒 [FEED] After circle filter:', filteredPosts.length, 'posts (was', posts?.length || 0, ')');
      } else {
        // Filter for all user's circles
        filteredPosts = (posts || []).filter(post => {
          // Check if post is in any of user's circles via post_circles
          const inUserCirclesViaJunction = post.post_circles?.some((pc: any) =>
            userCircleIds.includes(pc.circle_id)
          );

          // Check backward compatibility with old circle_id field
          const inUserCirclesViaOldField = userCircleIds.includes(post.circle_id);

          // Public posts are visible everywhere
          const isPublic = post.visibility === 'public';

          return inUserCirclesViaJunction || inUserCirclesViaOldField || isPublic;
        });

        if (__DEV__) console.log('🔓 [FEED] After all-circles filter:', filteredPosts.length, 'posts (was', posts?.length || 0, ')');
      }

      if (filteredPosts.length > 0) {
        if (__DEV__) console.log('📋 [FEED] Filtered post details:', filteredPosts.map(p => ({
          id: p.id,
          type: p.type,
          visibility: p.visibility,
          content: p.content?.substring(0, 30),
          action_title: p.action_title,
          user_id: p.user_id,
          created_at: p.created_at,
          post_circles_count: p.post_circles?.length || 0
        })));
      }
      
      // Get profiles for all post authors (use filteredPosts, not original posts)
      const userIds = [...new Set(filteredPosts.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds);

      // Attach profile info to posts and process reactions/comments
      const postsWithProfiles = filteredPosts.map(post => {
        // Count reactions and check if current user reacted
        const reactionCount = post.post_reactions?.length || 0;
        const userReacted = post.post_reactions?.some((r: any) => r.user_id === user.id) || false;

// Count comments and transform them
        const commentCount = post.post_comments?.length || 0;
        const comments = post.post_comments?.map((c: any) => ({
          id: c.id,
          content: c.content,
          user: profiles?.find(p => p.id === c.user_id)?.name || 'Anonymous',
          userAvatar: profiles?.find(p => p.id === c.user_id)?.avatar_url || '💬',
          userId: c.user_id,
          createdAt: c.created_at
        })) || [];

        return {
          ...post,
          profiles: profiles?.find(p => p.id === post.user_id) || null,
          reactionCount,  // Fire reactions 🔥
          userReacted,
          commentCount,
          comments,  // Include transformed comments
          // Clean up the raw data
          post_reactions: undefined,
          post_comments: undefined,
          post_circles: undefined,  // Clean up the junction table data
          // Keep old reactions format for backward compatibility
          reactions: userReacted ? { '🔥': reactionCount } : {}
        };
      });

      // Check if there are more posts to load
      const hasMore = postsWithProfiles.length === limit;

      if (__DEV__) console.log(`📊 Circle feed loaded: ${postsWithProfiles.length} posts (page: ${offset/limit + 1}, hasMore: ${hasMore})`);
      return { posts: postsWithProfiles, hasMore };
    } else {
      // Get posts from people you follow
      if (__DEV__) console.log('🔍 Fetching Following feed for user:', user?.id);
      
      const { data: following, error: followError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user?.id);
      
      if (followError) {
        if (__DEV__) console.error('❌ Error fetching follows:', followError);
        return { posts: [], hasMore: false };
      }
      
      if (__DEV__) console.log('👥 Following data:', following);
      
      // CRITICAL FIX: Filter out null following_ids that break the query (same as circle fix)
      const followingIds = following?.map(f => f.following_id).filter(id => id !== null) || [];
      
      if (__DEV__) console.log('✅ Valid following IDs:', followingIds);
      
      // CRITICAL FIX #2: If not following anyone, return empty (don't fetch ALL posts)
      if (!followingIds || followingIds.length === 0) {
        if (__DEV__) console.log('📭 [FEED] Not following anyone - returning empty feed');
        return { posts: [], hasMore: false };
      }

      // Add current user to see their own posts in following feed
      const idsToQuery = [...new Set([...followingIds, user.id])];
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          type,
          content,
          media_url,
          action_title,
          goal_title,
          goal_color,
          streak,
          created_at,
          visibility,
          circle_id,
          is_challenge,
          challenge_name,
          challenge_id,
          challenge_progress,
          leaderboard_position,
          total_participants,
          is_celebration,
          celebration_type,
          metadata,
          profiles(name, avatar_url),
          post_reactions!left(user_id),
          post_comments!left(id, content, user_id, created_at)
        `)
        .in('user_id', idsToQuery)  // Only posts from people you follow + self
        .in('visibility', ['public', 'followers'])  // Following feed shows only public and followers posts, NOT circle
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        if (__DEV__) console.error('❌ Error fetching following posts:', error);
        throw error;
      }

      // Process reactions, likes, and comments
      const postsWithMetrics = data?.map(post => {
        const reactionCount = post.post_reactions?.length || 0;
        const userReacted = post.post_reactions?.some((r: any) => r.user_id === user.id) || false;
        const likeCount = post.post_likes?.length || 0;
        const userLiked = post.post_likes?.some((l: any) => l.user_id === user.id) || false;
        const commentCount = post.post_comments?.length || 0;
        const comments = post.post_comments?.map((c: any) => ({
          id: c.id,
          content: c.content,
          user: post.profiles?.name || 'Anonymous',  // For now, use post author name as we don't have comment author profiles
          userAvatar: post.profiles?.avatar_url || '💬',
          userId: c.user_id,
          createdAt: c.created_at
        })) || [];

        return {
          ...post,
          reactionCount,  // Fire reactions 🔥
          userReacted,
          commentCount,
          comments,  // Include comments
          post_reactions: undefined,
          post_likes: undefined,
          post_comments: undefined,
          reactions: userReacted ? { '🔥': reactionCount } : {}
        };
      }) || [];

      const hasMore = postsWithMetrics.length === limit;
      if (__DEV__) console.log(`📊 Following feed loaded: ${postsWithMetrics.length} posts (page: ${offset/limit + 1}, hasMore: ${hasMore})`);
      return { posts: postsWithMetrics, hasMore };
    }
  }

  // NEW: Unified feed combining circle members + following in fewer queries
  // filter can be: '__ALL__' (default), '__FOLLOWING__' (only followed users), or a specific circleId
  async getUnifiedFeed(limit: number = 10, offset: number = 0, circleId?: string | null, filter?: string) {
    const { data: { user } } = await supabase.auth.getUser();

    if (__DEV__) console.log('🔵 [UNIFIED FEED] getUnifiedFeed called:', { userId: user?.id, limit, offset, circleId, filter });

    if (!user) {
      if (__DEV__) console.log('🔴 [UNIFIED FEED] No authenticated user');
      return { posts: [], hasMore: false };
    }

    try {
      // Handle special filter types
      const isFollowingOnly = filter === '__FOLLOWING__';
      const isAllFeed = filter === '__ALL__' || (!filter && !circleId);
      const isSpecificCircle = circleId && circleId !== '__ALL__' && circleId !== '__FOLLOWING__';

      let circleMemberIds: string[] = [];
      let followingIds: string[] = [];

      // QUERY 1: Get following IDs (needed for Following feed or All feed)
      if (isFollowingOnly || isAllFeed) {
        const { data: following } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);
        followingIds = following?.map(f => f.following_id).filter(Boolean) || [];
        if (__DEV__) console.log('🔵 [UNIFIED FEED] Following:', followingIds.length);
      }

      // If Following-only feed, just use followingIds
      if (isFollowingOnly) {
        if (followingIds.length === 0) {
          if (__DEV__) console.log('🔵 [UNIFIED FEED] Not following anyone - empty feed');
          return { posts: [], hasMore: false };
        }
        // For following feed, only include self + followed users
        const followingUserIds = [...new Set([...followingIds, user.id])];
        if (__DEV__) console.log('🔵 [UNIFIED FEED] Following-only feed user IDs:', followingUserIds.length);

        // Fetch posts from followed users only
        const { data: posts, error } = await supabase
          .from('posts')
          .select(`
            id, user_id, type, content, media_url, action_title, goal_title, goal_color,
            streak, created_at, visibility, circle_id,
            is_challenge, challenge_name, challenge_id, challenge_progress,
            leaderboard_position, total_participants,
            is_celebration, celebration_type, metadata,
            is_daily_progress, progress_date, completed_actions, total_actions, actions_today, updated_at,
            post_reactions!left(user_id),
              post_comments!left(id, content, user_id, created_at)
          `)
          .in('user_id', followingUserIds)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) {
          if (__DEV__) console.error('🔴 [UNIFIED FEED] Error fetching following posts:', error);
          throw error;
        }

        if (__DEV__) console.log('🔵 [UNIFIED FEED] Following feed posts:', posts?.length || 0);

        // Get profiles for all post authors
        const postUserIds = [...new Set(posts?.map(p => p.user_id) || [])];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', postUserIds);

        // Transform posts
        const postsWithProfiles = posts?.map(post => {
          const reactionCount = post.post_reactions?.length || 0;
          const userReacted = post.post_reactions?.some((r: any) => r.user_id === user.id) || false;
          const likeCount = post.post_likes?.length || 0;
          const userLiked = post.post_likes?.some((l: any) => l.user_id === user.id) || false;
          const commentCount = post.post_comments?.length || 0;
          const comments = post.post_comments?.map((c: any) => ({
            id: c.id,
            content: c.content,
            user: profiles?.find(p => p.id === c.user_id)?.name || 'Anonymous',
            userAvatar: profiles?.find(p => p.id === c.user_id)?.avatar_url || '',
            userId: c.user_id,
            createdAt: c.created_at
          })) || [];

          return {
            ...post,
            profiles: profiles?.find(p => p.id === post.user_id) || null,
            reactionCount,
            userReacted,
            commentCount,
            comments,
            post_reactions: undefined,
            post_comments: undefined
          };
        }) || [];

        const hasMore = postsWithProfiles.length === limit;
        if (__DEV__) console.log(`📊 [UNIFIED FEED] Following feed loaded: ${postsWithProfiles.length} posts, hasMore: ${hasMore}`);

        return { posts: postsWithProfiles, hasMore };
      }

      // QUERY 2: Get circle member IDs (for specific circle or All feed)
      if (isSpecificCircle) {
        // Specific circle
        const { data: members } = await supabase
          .from('circle_members')
          .select('user_id')
          .eq('circle_id', circleId);
        circleMemberIds = members?.map(m => m.user_id).filter(Boolean) || [];
        if (__DEV__) console.log('🔵 [UNIFIED FEED] Circle members for', circleId, ':', circleMemberIds.length);
      } else if (isAllFeed) {
        // All circles user belongs to
        const { data: userMemberships } = await supabase
          .from('circle_members')
          .select('circle_id')
          .eq('user_id', user.id);

        if (userMemberships?.length) {
          const circleIds = userMemberships.map(m => m.circle_id);
          const { data: allMembers } = await supabase
            .from('circle_members')
            .select('user_id')
            .in('circle_id', circleIds);
          circleMemberIds = allMembers?.map(m => m.user_id).filter(Boolean) || [];
          if (__DEV__) console.log('🔵 [UNIFIED FEED] All circle members:', circleMemberIds.length);
        }
      }

      // Combine into Set (auto-dedupes) + add self
      const combinedUserIds = [...new Set([...circleMemberIds, ...followingIds, user.id])];
      if (__DEV__) console.log('🔵 [UNIFIED FEED] Combined unique user IDs:', combinedUserIds.length);

      if (combinedUserIds.length === 0) {
        return { posts: [], hasMore: false };
      }

      // QUERY 3: Single posts query
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          id, user_id, type, content, media_url, action_title, goal_title, goal_color,
          streak, created_at, visibility, circle_id,
          is_challenge, challenge_name, challenge_id, challenge_progress,
          leaderboard_position, total_participants,
          is_celebration, celebration_type, metadata,
          is_daily_progress, progress_date, completed_actions, total_actions, actions_today, updated_at,
          post_reactions!left(user_id),
          post_comments!left(id, content, user_id, created_at)
        `)
        .in('user_id', combinedUserIds)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        if (__DEV__) console.error('🔴 [UNIFIED FEED] Error fetching posts:', error);
        throw error;
      }

      if (__DEV__) console.log('🔵 [UNIFIED FEED] Fetched posts:', posts?.length || 0);

      // Get profiles for all post authors
      const userIds = [...new Set(posts?.map(p => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds);

      // Transform posts with profiles, reactions, likes, comments
      const postsWithProfiles = posts?.map(post => {
        const reactionCount = post.post_reactions?.length || 0;
        const userReacted = post.post_reactions?.some((r: any) => r.user_id === user.id) || false;
        const likeCount = post.post_likes?.length || 0;
        const userLiked = post.post_likes?.some((l: any) => l.user_id === user.id) || false;
        const commentCount = post.post_comments?.length || 0;
        const comments = post.post_comments?.map((c: any) => ({
          id: c.id,
          content: c.content,
          user: profiles?.find(p => p.id === c.user_id)?.name || 'Anonymous',
          userAvatar: profiles?.find(p => p.id === c.user_id)?.avatar_url || '',
          userId: c.user_id,
          createdAt: c.created_at
        })) || [];

        return {
          ...post,
          profiles: profiles?.find(p => p.id === post.user_id) || null,
          reactionCount,
          userReacted,
          likeCount,
          userLiked,
          commentCount,
          comments,
          post_reactions: undefined,
          post_likes: undefined,
          post_comments: undefined
        };
      }) || [];

      const hasMore = postsWithProfiles.length === limit;
      if (__DEV__) console.log(`📊 [UNIFIED FEED] Loaded: ${postsWithProfiles.length} posts, hasMore: ${hasMore}`);

      return { posts: postsWithProfiles, hasMore };
    } catch (error) {
      if (__DEV__) console.error('🔴 [UNIFIED FEED] Error:', error);
      throw error;
    }
  }

  /**
   * Retry a function with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    initialDelay: number = 500
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        if (attempt < maxAttempts) {
          const delay = initialDelay * Math.pow(2, attempt - 1);
          console.log(`🔄 Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  // Image upload function for Phase 4 optimization
  async uploadImage(imageData: string, userId: string): Promise<string> {
    try {
      let base64Data: string;

      // Handle file:// URIs (from iOS image picker with base64: false)
      if (imageData.startsWith('file://')) {
        console.log('📱 Reading iOS file URI...');
        const FileSystem = require('expo-file-system').default;

        try {
          // Read file as base64 directly from disk (memory efficient)
          const base64 = await FileSystem.readAsStringAsync(imageData, {
            encoding: FileSystem.EncodingType.Base64,
          });

          base64Data = `data:image/jpeg;base64,${base64}`;
          console.log('✅ File read successfully, length:', base64.length);
        } catch (readError: any) {
          console.error('❌ Failed to read file URI:', readError);
          throw new Error(`Failed to read photo file: ${readError.message}. The photo may have been deleted by iOS.`);
        }
      }
      // Handle base64 data URIs
      else if (imageData.startsWith('data:image')) {
        base64Data = imageData;
      }
      // Fallback - assume it's already base64
      else {
        base64Data = `data:image/jpeg;base64,${imageData}`;
      }

      // Check size (base64 is ~33% larger than binary)
      const sizeInMB = base64Data.length / 1_048_576;
      if (sizeInMB > 5) {
        console.log(`⚠️ Image too large (${sizeInMB.toFixed(1)}MB), keeping as base64`);
        throw new Error('Image too large for upload');
      }

      // Extract the actual base64 data (remove data:image/jpeg;base64, prefix)
      const base64 = base64Data.includes(',')
        ? base64Data.split(',')[1]
        : base64Data;

      // Convert base64 to Uint8Array
      const decoded = atob(base64);
      const bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
      }

      // Generate unique filename
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

      console.log(`📤 Uploading image to Supabase Storage: ${fileName}`);

      // Upload to Supabase Storage with retry logic
      const { data, error } = await this.retryWithBackoff(async () => {
        const result = await supabase.storage
          .from('post-images')
          .upload(fileName, bytes.buffer, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false
          });

        if (result.error) throw result.error;
        return result;
      });

      if (error) {
        console.error('❌ Image upload failed:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      console.log(`✅ Image uploaded successfully: ${publicUrl}`);
      return publicUrl;

    } catch (error: any) {
      console.error('❌ Error uploading image:', error);
      console.error('❌ Image data length:', imageData?.length || 0);
      console.error('❌ Image type:', imageData?.substring(0, 30));
      throw error;
    }
  }

  async createPost(post: {
    type: string;
    visibility: string;
    content: string;
    mediaUrl?: string;
    actionTitle?: string;
    goalTitle?: string;
    goalColor?: string;
    streak?: number;
    circleId?: string | null;
    // Challenge fields
    isChallenge?: boolean;
    challengeName?: string;
    challengeId?: string;
    challengeProgress?: string;
    leaderboardPosition?: number;
    totalParticipants?: number;
    // Celebration fields
    is_celebration?: boolean;
    celebration_type?: string;
    metadata?: any;
    // NEW: Multi-circle visibility model
    isPrivate?: boolean;
    isExplore?: boolean;
    isNetwork?: boolean;
    circleIds?: string[];
  }) {
    // CHECKPOINT 5: Data received in supabaseService
    ChallengeDebugV2.checkpoint('CP5-SUPABASE-RECEIVED', 'Data received in supabaseService.createPost', post);
    
    if (__DEV__) console.log('🔵 [SUPABASE] createPost called with:', {
      type: post.type,
      visibility: post.visibility,
      content: post.content?.substring(0, 50),
      actionTitle: post.actionTitle,
      circleId: post.circleId,
      // Log challenge fields
      isChallenge: post.isChallenge,
      challengeName: post.challengeName,
      challengeId: post.challengeId,
      challengeProgress: post.challengeProgress
    });
    
    const { data: { user } } = await supabase.auth.getUser();
    
    // User must be authenticated to post
    if (!user) {
      throw new Error('You must be logged in to create posts');
    }
    
    const userId = user.id;
    if (__DEV__) console.log('👤 [SUPABASE] User ID:', userId);

    // Map camelCase to snake_case for database
    const {
      mediaUrl, actionTitle, goalTitle, goalColor, circleId,
      isChallenge, challengeName, challengeId, challengeProgress,
      leaderboardPosition, totalParticipants,
      is_celebration, celebration_type, metadata,
      isPrivate, isExplore, isNetwork, circleIds,
      ...postData
    } = post;
    
    // Phase 4: Upload image to Storage if it's base64 OR file:// URI
    let finalMediaUrl = mediaUrl;
    if (mediaUrl && (mediaUrl.startsWith('data:image') || mediaUrl.startsWith('file://'))) {
      if (__DEV__) console.log('🖼️ Detected image for upload (base64 or file URI), uploading to Storage...');
      try {
        finalMediaUrl = await this.uploadImage(mediaUrl, userId);
        if (__DEV__) console.log('✨ Image optimized and uploaded!');
      } catch (uploadError) {
        if (__DEV__) console.error('⚠️ Image upload failed:', uploadError);

        // CRITICAL: If it's a file:// URI and upload fails, we CANNOT fall back
        // because the file will be deleted by iOS later
        if (mediaUrl.startsWith('file://')) {
          if (__DEV__) console.error('🚨 CRITICAL: file:// URI upload failed - photo will NOT persist!');
          throw new Error('Image upload failed. Photo cannot be saved.');
        }

        // For base64, we can fall back to storing it directly (not ideal but works)
        if (__DEV__) console.log('⚠️ Falling back to base64 storage...');
        finalMediaUrl = mediaUrl;
      }
    }
    
    const insertData = {
      ...postData,
      user_id: userId,
      media_url: finalMediaUrl,  // Use optimized URL or fallback to base64
      action_title: actionTitle,  // Map actionTitle to action_title
      goal_title: goalTitle,  // Map goalTitle to goal_title
      goal_color: goalColor,  // Map goalColor to goal_color
      circle_id: circleId,  // Map circleId to circle_id (for backward compatibility)
      // Map challenge fields to snake_case
      is_challenge: isChallenge || false,
      challenge_name: challengeName,
      challenge_id: challengeId,
      challenge_progress: challengeProgress,
      leaderboard_position: leaderboardPosition,
      total_participants: totalParticipants,
      // Map celebration fields
      is_celebration: is_celebration || false,
      celebration_type: celebration_type,
      metadata: metadata ? JSON.stringify(metadata) : null,
      // NEW: Multi-circle visibility model
      ...(isPrivate !== undefined && {
        is_private: isPrivate,
        is_explore: isExplore || false,
        is_network: isNetwork || false,
      })
    };
    
    // CHECKPOINT 6: Data being inserted to database
    ChallengeDebugV2.checkpoint('CP6-DB-INSERT', 'Data being inserted to posts table', insertData);
    
    if (__DEV__) console.log('📤 [SUPABASE] Inserting post with data:', {
      user_id: insertData.user_id,
      type: insertData.type,
      visibility: insertData.visibility,
      content: insertData.content?.substring(0, 50),
      action_title: insertData.action_title,
      circle_id: insertData.circle_id,
      // Log challenge fields being saved
      is_challenge: insertData.is_challenge,
      challenge_name: insertData.challenge_name,
      challenge_id: insertData.challenge_id
    });
    
    const { data, error } = await supabase
      .from('posts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      if (__DEV__) console.error('❌ [SUPABASE] Error creating post:', error);
      throw error;
    }

    // CHECKPOINT 7: Data returned from database
    ChallengeDebugV2.checkpoint('CP7-DB-RESPONSE', 'Data returned from database after insert', data);

    if (__DEV__) console.log('✅ [SUPABASE] Post created successfully, ID:', data?.id);

    // NEW: Insert circle relationships if circleIds are provided
    // OR if visibility is 'circle' but no circleId/circleIds provided, add to ALL user circles
    let finalCircleIds = circleIds;

    // Check if we need to fetch all user circles
    // This happens when: visibility is circle, no circleId provided, and either no circleIds or empty circleIds
    const needsAllCircles = post.visibility === 'circle' &&
                            !circleId &&
                            (!finalCircleIds || finalCircleIds.length === 0);

    if (needsAllCircles) {
      if (__DEV__) console.log('🔵 [SUPABASE] No circleIds provided for circle post, fetching all user circles');
      const { data: userMemberships } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', userId);

      if (userMemberships && userMemberships.length > 0) {
        finalCircleIds = userMemberships.map(m => m.circle_id);
        if (__DEV__) console.log('🔵 [SUPABASE] Adding post to all user circles:', finalCircleIds.length);
      } else {
        if (__DEV__) console.log('⚠️ [SUPABASE] User is not a member of any circles');
      }
    }

    if (finalCircleIds && finalCircleIds.length > 0 && data?.id) {
      if (__DEV__) console.log('🔵 [SUPABASE] Inserting post_circles relationships for', finalCircleIds.length, 'circles');
      const postCircleRelationships = finalCircleIds.map(cid => ({
        post_id: data.id,
        circle_id: cid
      }));

      const { error: circleError } = await supabase
        .from('post_circles')
        .insert(postCircleRelationships);

      if (circleError) {
        if (__DEV__) console.warn('⚠️ [SUPABASE] post_circles insert failed (non-fatal, post already has circle_id):', circleError.message);
      } else {
        if (__DEV__) console.log('✅ [SUPABASE] Post_circles relationships created for', finalCircleIds.length, 'circles');
      }
    }
    
    // Return the created post with proper field mapping back to camelCase
    return {
      ...data,
      mediaUrl: data.media_url,
      actionTitle: data.action_title,
      goalTitle: data.goal_title,
      goalColor: data.goal_color,
      // Map challenge fields back to camelCase
      isChallenge: data.is_challenge,
      challengeName: data.challenge_name,
      challengeId: data.challenge_id,
      challengeProgress: data.challenge_progress,
      leaderboardPosition: data.leaderboard_position,
      totalParticipants: data.total_participants
    };
  }

  async findOrCreateDailyProgressPost(
    userId: string,
    challengeId: string | null = null,
    challengeName?: string,
    challengeMetadata?: {
      currentDay?: number;
      totalDays?: number;
    }
  ) {
    if (__DEV__) console.log(`📊 [SUPABASE] Finding or creating daily progress post for user: ${userId}`, challengeId ? `(Challenge: ${challengeId})` : '(Regular)');

    // Use local date instead of UTC date to avoid timezone issues
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (__DEV__) console.log(`📅 [SUPABASE] Today's date (local): ${today}`);

    if (__DEV__) console.log(`🔍 [SUPABASE] Searching for existing daily progress post...`);
    const { data: existingRows, error: findError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .eq('progress_date', today)
      .eq('is_daily_progress', true)
      .eq('challenge_id', challengeId || null)
      .order('updated_at', { ascending: false })
      .limit(1);

    const existing = existingRows?.[0] || null;

    if (__DEV__) console.log(`🔍 [SUPABASE] Search result - data:`, existing ? 'FOUND' : 'NOT FOUND', 'error:', findError);

    if (existing && !findError) {
      if (__DEV__) console.log(`✅ [SUPABASE] Found existing daily progress post:`, existing.id);
      return existing;
    }

    if (__DEV__) console.log(`📝 [SUPABASE] Creating new daily progress post for ${today}`);

    const insertData = {
      user_id: userId,
      type: 'daily_progress',
      is_daily_progress: true,
      progress_date: today,
      completed_actions: [],
      total_actions: 0,
      actions_today: 0,
      content: '',
      visibility: 'circle',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_challenge: challengeId !== null,
      challenge_id: challengeId,
      challenge_name: challengeName || null,
      ...(challengeMetadata && {
        challenge_progress: {
          current_day: challengeMetadata.currentDay,
          total_days: challengeMetadata.totalDays,
        }
      }),
    };
    if (__DEV__) console.log(`📤 [SUPABASE] Insert payload:`, JSON.stringify(insertData, null, 2));

    const { data: newPost, error: createError } = await supabase
      .from('posts')
      .insert(insertData)
      .select()
      .single();

    if (__DEV__) console.log(`📥 [SUPABASE] Insert response - data:`, newPost ? 'SUCCESS' : 'NULL', 'error:', createError);

    if (createError) {
      if (__DEV__) console.error('❌ [SUPABASE] Error creating daily progress post:', createError);
      if (__DEV__) console.error('❌ [SUPABASE] Error details:', JSON.stringify(createError, null, 2));
      throw createError;
    }

    if (__DEV__) console.log(`✅ [SUPABASE] Created new daily progress post:`, newPost.id);
    if (__DEV__) console.log(`✅ [SUPABASE] New post data:`, JSON.stringify(newPost, null, 2));
    return newPost;
  }

  async updateDailyProgressPost(
    postId: string,
    actionData: {
      actionId: string;
      title: string;
      goalTitle?: string;
      goalColor?: string;
      completedAt: string;
      streak: number;
      challengeActivityId?: string;
      failed?: boolean;
      comment?: string;
      photoUri?: string;
    },
    totalActions: number
  ) {
    if (__DEV__) console.log(`🔄 [SUPABASE] Updating daily progress post ${postId} with action:`, actionData.title);
    if (__DEV__) console.log(`🔄 [SUPABASE] Action data:`, JSON.stringify(actionData, null, 2));
    if (__DEV__) console.log(`🔄 [SUPABASE] Total actions: ${totalActions}`);

    if (__DEV__) console.log(`🔍 [SUPABASE] Fetching current post data...`);
    const { data: currentPost, error: fetchError } = await supabase
      .from('posts')
      .select('completed_actions')
      .eq('id', postId)
      .single();

    if (fetchError) {
      if (__DEV__) console.error('❌ [SUPABASE] Error fetching current post:', fetchError);
    }

    const completedActions = currentPost?.completed_actions || [];
    if (__DEV__) console.log(`📊 [SUPABASE] Current completed actions count: ${completedActions.length}`);

    const existingIndex = completedActions.findIndex(
      (a: any) => a.actionId === actionData.actionId
    );

    let updatedActions;
    if (existingIndex >= 0) {
      if (__DEV__) console.log(`🔄 [SUPABASE] Action already exists at index ${existingIndex}, updating...`);
      updatedActions = [...completedActions];
      updatedActions[existingIndex] = {
        ...actionData,
        order: Date.now()
      };
    } else {
      if (__DEV__) console.log(`➕ [SUPABASE] Adding new action to list`);
      updatedActions = [
        ...completedActions,
        {
          ...actionData,
          order: Date.now()
        }
      ];
    }

    if (__DEV__) console.log(`📊 [SUPABASE] Updated actions count: ${updatedActions.length}`);
    if (__DEV__) console.log(`📤 [SUPABASE] Updating post with new data...`);

    // Count only successful actions (not failed)
    const successfulActionsCount = updatedActions.filter((a: any) => !a.failed).length;
    if (__DEV__) console.log(`✅ [SUPABASE] Successful actions: ${successfulActionsCount}, Failed: ${updatedActions.length - successfulActionsCount}`);

    const now = new Date().toISOString();
    const updatePayload = {
      completed_actions: updatedActions,
      actions_today: successfulActionsCount,
      total_actions: totalActions,
      created_at: now,
      updated_at: now
    };
    if (__DEV__) console.log(`📤 [SUPABASE] Update payload:`, JSON.stringify(updatePayload, null, 2));

    const { data, error } = await supabase
      .from('posts')
      .update(updatePayload)
      .eq('id', postId)
      .select()
      .single();

    if (__DEV__) console.log(`📥 [SUPABASE] Update response - data:`, data ? 'SUCCESS' : 'NULL', 'error:', error);

    if (error) {
      if (__DEV__) console.error('❌ [SUPABASE] Error updating daily progress post:', error);
      if (__DEV__) console.error('❌ [SUPABASE] Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    if (__DEV__) console.log(`✅ [SUPABASE] Updated daily progress post. Actions: ${updatedActions.length}/${totalActions}`);
    if (__DEV__) console.log(`✅ [SUPABASE] Updated post data:`, JSON.stringify(data, null, 2));
    return data;
  }

  async removeActionFromDailyProgress(postId: string, actionId: string) {
    if (__DEV__) console.log(`🗑️ [SUPABASE] Removing action ${actionId} from daily progress post ${postId}`);

    const { data: currentPost } = await supabase
      .from('posts')
      .select('completed_actions, total_actions')
      .eq('id', postId)
      .single();

    const completedActions = currentPost?.completed_actions || [];
    const updatedActions = completedActions.filter(
      (a: any) => a.actionId !== actionId
    );

    if (updatedActions.length === 0) {
      if (__DEV__) console.log(`🗑️ [SUPABASE] No actions left, deleting daily progress post`);

      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (deleteError) {
        if (__DEV__) console.error('❌ [SUPABASE] Error deleting daily progress post:', deleteError);
        throw deleteError;
      }

      if (__DEV__) console.log(`✅ [SUPABASE] Deleted empty daily progress post`);
      return null;
    }

    const { data, error } = await supabase
      .from('posts')
      .update({
        completed_actions: updatedActions,
        actions_today: updatedActions.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      if (__DEV__) console.error('❌ [SUPABASE] Error removing action from daily progress:', error);
      throw error;
    }

    if (__DEV__) console.log(`✅ [SUPABASE] Removed action. Remaining: ${updatedActions.length}`);
    return data;
  }

  async getUserPosts(userId: string, limit: number = 5) {
    if (__DEV__) console.log(`📬 [SUPABASE] Fetching posts for user: ${userId}, limit: ${limit}`);

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (__DEV__) console.error('❌ [SUPABASE] Error fetching user posts:', error);
      throw error;
    }

    if (__DEV__) console.log(`✅ [SUPABASE] Found ${posts?.length || 0} posts for user`);

    // Debug: Log posts with media_url
    posts?.forEach(post => {
      if (post.media_url) {
        if (__DEV__) console.log('📸 [SUPABASE] getUserPosts - Found post with media:', {
          id: post.id,
          type: post.type,
          media_url: post.media_url?.substring(0, 50)
        });
      }
    });

    // Get reactions and comments for these posts
    const postIds = posts?.map(p => p.id) || [];

    const [reactionsData, commentsData] = await Promise.all([
      supabase
        .from('post_reactions')
        .select('*')
        .in('post_id', postIds),
      supabase
        .from('post_comments')
        .select(`
          *,
          profiles!post_comments_user_id_fkey (
            id,
            name,
            avatar_url
          )
        `)
        .in('post_id', postIds)
        .order('created_at', { ascending: true })
    ]);

    // Map reactions and comments to posts
    const postsWithEngagement = posts?.map(post => ({
      ...post,
      reactions: reactionsData.data?.filter(r => r.post_id === post.id) || [],
      comments: commentsData.data?.filter(c => c.post_id === post.id) || [],
      user: post.profiles?.name || 'Unknown User',
      userId: post.user_id,
      avatarUrl: post.profiles?.avatar_url
    })) || [];

    return postsWithEngagement;
  }

  async reactToPost(postId: string, emoji: string = '🔥') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get post author info for notifications
    const { data: post } = await supabase
      .from('posts')
      .select('user_id, content, profiles!user_id(username)')
      .eq('id', postId)
      .single();

    // Check if user already reacted
    const { data: existing } = await supabase
      .from('post_reactions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Remove reaction if already exists (toggle off)
      const { error } = await supabase
        .from('post_reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { removed: true };
    } else {
      // Add new reaction
      const { data, error } = await supabase
        .from('post_reactions')
        .insert({
          post_id: postId,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification to post author (if not reacting to own post)
      if (post && post.user_id !== user.id) {
        const { supabaseNotificationService } = await import('./supabase.notifications.service');
        const { data: actorProfile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        await supabaseNotificationService.createSocialNotification({
          userId: post.user_id,
          type: 'like',
          actorUserId: user.id,
          actorName: actorProfile?.username || 'Someone',
          postId,
          postTitle: post.content?.substring(0, 50) || 'your post'
        });
      }

      return data;
    }
  }

  async toggleLike(postId: string) {
    console.log('🔥 [LIKE] toggleLike called for post:', postId);

    const { data: { user } } = await supabase.auth.getUser();
    console.log('🔥 [LIKE] User authenticated:', {
      userId: user?.id,
      email: user?.email,
      isAuthenticated: !!user
    });

    if (!user) throw new Error('Not authenticated');

    // Get post author info for notifications
    const { data: post } = await supabase
      .from('posts')
      .select('user_id, content, profiles!user_id(username)')
      .eq('id', postId)
      .single();

    console.log('🔥 [LIKE] Post author:', post?.user_id);

    // Check if user already liked
    const { data: existing, error: checkError } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    console.log('🔥 [LIKE] Existing like check:', { existing, checkError });

    if (existing) {
      // Remove like if already exists (toggle off)
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Get updated like count
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      return { liked: false, like_count: count || 0 };
    } else {
      // Add new like
      console.log('🔥 [LIKE-INSERT] Attempting to insert like:');
      console.log('  Post ID:', postId);
      console.log('  User ID:', user.id);
      console.log('  User email:', user.email);

      const { error, data } = await supabase
        .from('likes')
        .insert({
          post_id: postId,
          user_id: user.id
        })
        .select();

      console.log('🔥 [LIKE-INSERT] Result:', { data, error });

      if (error) throw error;

      // Get updated like count
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      // Send notification to post author (if not liking own post)
      if (post && post.user_id !== user.id) {
        const { supabaseNotificationService } = await import('./supabase.notifications.service');
        const { data: actorProfile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        await supabaseNotificationService.createSocialNotification({
          userId: post.user_id,
          type: 'like',
          actorUserId: user.id,
          actorName: actorProfile?.username || 'Someone',
          postId,
          postTitle: post.content?.substring(0, 50) || 'your post'
        });
      }

      return { liked: true, like_count: count || 0 };
    }
  }

  async getLikes(postId: string) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: likes, error, count } = await supabase
      .from('likes')
      .select('*, profiles!user_id(username, avatar_url)', { count: 'exact' })
      .eq('post_id', postId);

    if (error) throw error;

    const userLiked = user ? likes?.some(like => like.user_id === user.id) : false;

    return {
      likes: likes || [],
      like_count: count || 0,
      user_liked: userLiked
    };
  }

  async getBatchLikes(postIds: string[]) {
    if (!postIds || postIds.length === 0) return {};

    const { data: { user } } = await supabase.auth.getUser();

    const { data: likes, error } = await supabase
      .from('likes')
      .select('post_id, user_id')
      .in('post_id', postIds);

    if (error) throw error;

    // Group likes by post_id
    const likesByPost: Record<string, { like_count: number; user_liked: boolean }> = {};

    postIds.forEach(postId => {
      const postLikes = likes?.filter(like => like.post_id === postId) || [];
      likesByPost[postId] = {
        like_count: postLikes.length,
        user_liked: user ? postLikes.some(like => like.user_id === user.id) : false
      };
    });

    return likesByPost;
  }

  async addComment(postId: string, content: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get post author info for notifications
    const { data: post } = await supabase
      .from('posts')
      .select('user_id, content')
      .eq('id', postId)
      .single();

    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content
      })
      .select()
      .single();

    if (error) throw error;

    // Send notification to post author (if not commenting on own post)
    if (post && post.user_id !== user.id) {
      const { supabaseNotificationService } = await import('./supabase.notifications.service');
      const { data: actorProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      await supabaseNotificationService.createSocialNotification({
        userId: post.user_id,
        type: 'comment',
        actorUserId: user.id,
        actorName: actorProfile?.username || 'Someone',
        postId,
        commentText: content.substring(0, 100)
      });
    }

    return data;
  }

  async getComments(postId: string, limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        profiles!user_id (
          username,
          display_name,
          avatar_emoji
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  async deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const { data: comment, error: fetchError } = await supabase
        .from('post_comments')
        .select('user_id')
        .eq('id', commentId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching comment:', fetchError);
        return { success: false, error: 'Comment not found' };
      }

      if (comment.user_id !== user.id) {
        return { success: false, error: 'Not authorized to delete this comment' };
      }

      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('❌ Error deleting comment:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Comment deleted successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error in deleteComment:', error);
      return { success: false, error: error.message };
    }
  }

  // Real-time subscriptions
  subscribeToFeed(callback: (payload: any) => void) {
    return supabase
      .channel('feed')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts' },
        callback
      )
      .subscribe();
  }


  async createGoal(goal: {
    title: string;
    metric?: string;
    deadline?: string;
    category?: string;
    color?: string;
    why?: string;
    type?: 'goal' | 'routine';
  }) {
    if (__DEV__) console.log('🔵 [SUPABASE] Creating goal:', goal.title);
    const { user } = await this.verifySession();
    if (!user) {
      if (__DEV__) console.error('🔴 [SUPABASE] Not authenticated - cannot create goal!');
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('goals')
      .insert({
        ...goal,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      if (__DEV__) console.error('🔴 [SUPABASE] Error creating goal:', error);
      throw error;
    }

    if (__DEV__) console.log('🟢 [SUPABASE] Goal created with ID:', data.id);
    return data;
  }

  async updateGoal(id: string, updates: any) {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Get current user to calculate consistency
    const { user } = await this.verifySession();
    if (!user) {
      return {
        ...data,
        consistency: 0,
        status: 'On Track' as const
      };
    }

    // Calculate consistency for updated goal
    const consistency = await this.getGoalConsistency(id, user.id);

    // Determine status based on consistency
    let status: 'On Track' | 'Needs Attention' | 'Critical';
    if (consistency >= 70) {
      status = 'On Track';
    } else if (consistency >= 40) {
      status = 'Needs Attention';
    } else {
      status = 'Critical';
    }

    return {
      ...data,
      consistency,
      status
    };
  }

  async deleteGoal(id: string) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Helper function to generate unique circle join code
  private generateJoinCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Circle methods
  async createCircle(name: string, emoji?: string, description?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Generate a unique join code
    let joinCode = this.generateJoinCode();
    let isUnique = false;
    let attempts = 0;

    // Ensure join code is unique (retry up to 10 times if collision)
    while (!isUnique && attempts < 10) {
      const { data: existing } = await supabase
        .from('circles')
        .select('id')
        .eq('join_code', joinCode)
        .single();

      if (!existing) {
        isUnique = true;
      } else {
        joinCode = this.generateJoinCode();
        attempts++;
      }
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique join code');
    }

    const { data, error } = await supabase
      .from('circles')
      .insert({
        name,
        emoji: emoji || null,  // No default emoji - will show gold Users icon
        description,
        created_by: user.id,
        join_code: joinCode
      })
      .select()
      .single();

    if (error) throw error;

    if (__DEV__) console.log(`🟢 [CIRCLE] Created circle "${name}" with join code: ${joinCode}`);

    // Auto-join creator to circle
    await this.joinCircle(data.id);

    return data;
  }

  async joinCircleWithCode(inviteCode: string) {
    if (__DEV__) console.log('🟦 [CIRCLE] Attempting to join circle with code:', inviteCode);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (__DEV__) console.error('🔴 [CIRCLE] Not authenticated');
      return { success: false, error: 'Not authenticated', data: null };
    }

    if (__DEV__) console.log('🟦 [CIRCLE] User authenticated:', user.id);

    // Find circle by join code - fetch ALL circle data
    const { data: circles, error: circleError } = await supabase
      .from('circles')
      .select('id, name, join_code, emoji, description, created_by, created_at')
      .ilike('join_code', inviteCode)
      .limit(1);

    if (circleError) {
      if (__DEV__) console.error('🔴 [CIRCLE] Error searching for circle:', circleError);
      return { success: false, error: circleError.message, data: null };
    }

    if (!circles || circles.length === 0) {
      if (__DEV__) console.log('🔴 [CIRCLE] No circle found with code:', inviteCode);
      return { success: false, error: 'Invalid circle code', data: null };
    }

    const circle = circles[0];
    if (__DEV__) console.log('🟢 [CIRCLE] Found circle:', circle.name, circle.id);

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('circle_members')
      .select('id')
      .eq('circle_id', circle.id)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      if (__DEV__) console.log('🟡 [CIRCLE] User already a member of this circle');
      return { success: false, error: 'Already a member of this circle', data: circle };
    }

    // Add to circle_members
    const { error: memberError } = await supabase
      .from('circle_members')
      .insert({
        circle_id: circle.id,
        user_id: user.id
      });

    if (memberError) {
      if (__DEV__) console.error('🔴 [CIRCLE] Error adding to circle_members:', memberError);
      return { success: false, error: memberError.message, data: null };
    }

    if (__DEV__) console.log('🟢 [CIRCLE] Added to circle_members');

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ circle_id: circle.id })
      .eq('id', user.id);

    if (profileError) {
      if (__DEV__) console.error('🔴 [CIRCLE] Error updating profile:', profileError);
      return { success: false, error: profileError.message, data: null };
    }

    if (__DEV__) console.log('🟢 [CIRCLE] Successfully joined circle!');

    // Get the member count for the circle
    const { count: memberCount } = await supabase
      .from('circle_members')
      .select('*', { count: 'exact', head: true })
      .eq('circle_id', circle.id);

    // Return circle with member count
    return {
      success: true,
      error: null,
      data: {
        ...circle,
        member_count: memberCount || 0
      }
    };
  }

  async joinCircle(circleId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (__DEV__) console.log('🟦 [CIRCLE] Adding user', user.id, 'to circle', circleId);

    // Add user to circle_members table
    const { error: memberError } = await supabase
      .from('circle_members')
      .insert({
        circle_id: circleId,
        user_id: user.id
      });

    if (memberError && !memberError.message.includes('duplicate')) {
      if (__DEV__) console.error('🔴 [CIRCLE] Failed to add to circle_members:', memberError);
      throw memberError;
    }

    // Update user's current circle in profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ circle_id: circleId })
      .eq('id', user.id);
    
    if (profileError) {
      if (__DEV__) console.error('🔴 [CIRCLE] Failed to update profile circle_id:', profileError);
      throw profileError;
    }
    
    if (__DEV__) console.log('🟢 [CIRCLE] Successfully joined circle and updated profile');
  }

  async getMyCircle() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get user's current circle
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('circle_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      if (__DEV__) console.error('Error fetching user profile:', profileError);
      return null;
    }

    if (!profile?.circle_id) {
      if (__DEV__) console.log('User has no circle_id set in profile');
      return null;
    }

    // Get circle details (simplified query without nested joins)
    const { data: circle, error: circleError } = await supabase
      .from('circles')
      .select('*')
      .eq('id', profile.circle_id)
      .single();

    if (circleError) {
      if (__DEV__) console.error('Error fetching circle:', circleError);
      return null;
    }

    return circle;
  }

  async getCircleMembers(circleId: string) {
    if (__DEV__) console.log('Fetching members for circle:', circleId);
    
    // First get the member records
    const { data: members, error: membersError } = await supabase
      .from('circle_members')
      .select('user_id, role, joined_at')
      .eq('circle_id', circleId);

    if (membersError) {
      if (__DEV__) console.error('Error fetching circle members:', membersError);
      if (__DEV__) console.error('Failed query: SELECT user_id, role, joined_at FROM circle_members WHERE circle_id =', circleId);
      throw membersError;
    }

    if (!members || members.length === 0) {
      if (__DEV__) console.log('No members found for circle:', circleId);
      return [];
    }

    // Filter out null user_ids and get profiles for valid members
    const validMembers = members.filter(m => m.user_id !== null);
    const userIds = validMembers.map(m => m.user_id);
    
    if (__DEV__) console.log('Valid user IDs:', userIds);
    
    if (userIds.length === 0) {
      if (__DEV__) console.log('No valid user IDs found');
      return [];
    }
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url')
      .in('id', userIds);

    if (profilesError) {
      if (__DEV__) console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    // Combine the data
    const membersWithProfiles = validMembers.map(member => {
      const profile = profiles?.find(p => p.id === member.user_id);
      return {
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
        profiles: profile || { name: 'Unknown', username: 'unknown', avatar_url: null }
      };
    });
    
    if (__DEV__) console.log('Fetched circle members with profiles:', membersWithProfiles);
    return membersWithProfiles;
  }

  // NEW: Get all circles the user belongs to (for multiple circles support)
  async getUserCircles() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (__DEV__) {
      console.log('🔵 [CIRCLES] Fetching all circles for user:', user.id);
      console.log('🔵 [CIRCLES] Database URL:', SUPABASE_URL);
      console.log('🔵 [CIRCLES] Querying circle_members table...');
    }

    // OPTIMIZED: Single query with member count using aggregate function
    // Get all circle memberships with circle data and member counts in one query
    const { data: memberships, error: membershipError } = await supabase
      .from('circle_members')
      .select(`
        circle_id,
        joined_at,
        circles:circle_id (
          id,
          name,
          emoji,
          description,
          category,
          is_private,
          created_by,
          created_at,
          join_code,
          circle_members!circle_id(count)
        )
      `)
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false });

    if (membershipError) {
      if (__DEV__) console.error('🔴 [CIRCLES] Error fetching user circles:', membershipError);
      throw membershipError;
    }

    if (__DEV__) {
      console.log('🔵 [CIRCLES] Raw memberships from DB:', memberships?.length || 0);
      if (memberships && memberships.length > 0) {
        memberships.forEach((m, i) => {
          console.log(`🔵 [CIRCLES] Membership ${i + 1}:`, {
            circle_id: m.circle_id,
            circle_name: m.circles?.name,
            joined_at: m.joined_at
          });
        });
      }
    }

    // Transform the data to match our Circle interface
    const circles = (memberships || []).map(membership => {
      const circle = membership.circles;

      // Extract member count from the aggregate result
      const memberCount = circle.circle_members?.[0]?.count || 0;

      return {
        id: circle.id,
        name: circle.name,
        emoji: circle.emoji || '🔵',  // Default to blue circle if no emoji
        description: circle.description,
        category: circle.category,
        is_private: circle.is_private || false,
        member_count: memberCount,
        created_by: circle.created_by,
        created_at: circle.created_at,
        joined_at: membership.joined_at,
        join_code: circle.join_code
      };
    });

    if (__DEV__) {
      console.log('✅ [CIRCLES] Found', circles.length, 'circles for user (OPTIMIZED: single query)');
      circles.forEach((c, i) => {
        console.log(`✅ [CIRCLES] Circle ${i + 1}:`, {
          id: c.id,
          name: c.name,
          emoji: c.emoji,
          member_count: c.member_count,
          join_code: c.join_code
        });
      });
    }
    return circles;
  }

  // NEW: Leave a circle
  async leaveCircle(circleId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (__DEV__) console.log('🔵 [CIRCLES] User', user.id, 'leaving circle:', circleId);

    // Remove from circle_members table
    const { error: memberError } = await supabase
      .from('circle_members')
      .delete()
      .eq('circle_id', circleId)
      .eq('user_id', user.id);

    if (memberError) {
      if (__DEV__) console.error('🔴 [CIRCLES] Error leaving circle:', memberError);
      throw memberError;
    }

    // If this was the user's current circle, clear it from their profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('circle_id')
      .eq('id', user.id)
      .single();

    if (profile?.circle_id === circleId) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ circle_id: null })
        .eq('id', user.id);

      if (profileError) {
        if (__DEV__) console.error('🔴 [CIRCLES] Error updating profile:', profileError);
        throw profileError;
      }
    }

    if (__DEV__) console.log('✅ [CIRCLES] Successfully left circle');
  }

  // Following methods
  async followUser(userId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: userId
      });

    if (error) throw error;

    // Update counts
    await supabase.rpc('increment', { 
      table_name: 'profiles', 
      column_name: 'following_count',
      row_id: user.id 
    });
    
    await supabase.rpc('increment', { 
      table_name: 'profiles', 
      column_name: 'follower_count',
      row_id: userId 
    });
  }

  async unfollowUser(userId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', userId);

    if (error) throw error;
  }

  async getFollowing() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('follows')
      .select(`
        following_id,
        profiles!follows_following_id_fkey (
          id, name, username, avatar_url
        )
      `)
      .eq('follower_id', user.id);

    if (error) throw error;
    return data || [];
  }

  async getFollowers() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower_id,
        profiles!follows_follower_id_fkey (
          id, name, username, avatar_url
        )
      `)
      .eq('following_id', user.id);

    if (error) throw error;
    return data || [];
  }

  async getAllUsers(limit: number = 15) {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        username,
        avatar_url,
        circle_id,
        circles (
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(user => ({
      id: user.id,
      name: user.name,
      username: user.username,
      avatar_url: user.avatar_url,
      circle_name: user.circles?.name || null
    }));
  }

  async searchUsers(query: string, limit: number = 20) {
    const searchTerm = `%${query}%`;

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        username,
        avatar_url,
        circle_id,
        circles (
          name
        )
      `)
      .or(`name.ilike.${searchTerm},username.ilike.${searchTerm}`)
      .limit(limit);

    if (error) throw error;

    return (data || []).map(user => ({
      id: user.id,
      name: user.name,
      username: user.username,
      avatar_url: user.avatar_url,
      circle_name: user.circles?.name || null
    }));
  }

  async getUserProfile(userId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get target user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        username,
        avatar_url,
        bio,
        circle_id,
        created_at
      `)
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Check if users are in same circle
    let isInSameCircle = false;
    if (profile.circle_id && user.id !== userId) {
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('circle_id')
        .eq('id', user.id)
        .single();
      
      isInSameCircle = currentUserProfile?.circle_id === profile.circle_id;
    }

    // Track profile view (if not viewing own profile)
    if (user.id !== userId) {
      await supabase
        .from('profile_views')
        .insert({
          viewer_id: user.id,
          viewed_id: userId
        })
        .select();
    }

    // Get goals based on privacy settings
    const goalsQuery = supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId);

    if (user.id !== userId) {
      if (isInSameCircle) {
        goalsQuery.in('visibility', ['public', 'circle']);
      } else {
        goalsQuery.eq('visibility', 'public');
      }
    }

    const { data: goals } = await goalsQuery;

    // Get actions based on privacy settings
    const actionsQuery = supabase
      .from('actions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (user.id !== userId) {
      if (isInSameCircle) {
        actionsQuery.in('visibility', ['public', 'circle']);
      } else {
        actionsQuery.eq('visibility', 'public');
      }
    }

    const { data: actions } = await actionsQuery;

    // Get posts
    const postsQuery = supabase
      .from('posts')
      .select(`
        *,
        reactions(emoji, user_id)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (user.id !== userId) {
      if (isInSameCircle) {
        postsQuery.in('visibility', ['public', 'circle']);
      } else {
        postsQuery.eq('visibility', 'public');
      }
    }

    const { data: posts } = await postsQuery;

    // Get stats
    const stats = {
      goalsCount: goals?.length || 0,
      actionsCount: actions?.length || 0,
      postsCount: posts?.length || 0,
      streakDays: 0
    };

    // Calculate current streak from actions
    if (actions && actions.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let streak = 0;
      let checkDate = new Date(today);
      
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const hasAction = actions.some(a => {
          const actionDate = new Date(a.completed_at || a.created_at);
          return actionDate.toISOString().split('T')[0] === dateStr;
        });
        
        if (hasAction) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
        
        if (streak > 365) break; // Safety limit
      }
      
      stats.streakDays = streak;
    }

    return {
      profile,
      goals: goals || [],
      actions: actions || [],
      posts: posts || [],
      stats,
      isInSameCircle,
      isOwnProfile: user.id === userId
    };
  }

  async getCirclesForUser(targetUserId: string) {
    const { data: memberships, error } = await supabase
      .from('circle_members')
      .select(`
        circle_id,
        circles:circle_id (
          id,
          name,
          emoji,
          circle_members!circle_id(count)
        )
      `)
      .eq('user_id', targetUserId);

    if (error) {
      if (__DEV__) console.error('[CIRCLES] Error fetching circles for user:', error);
      return [];
    }

    return (memberships || []).map((m: any) => ({
      id: m.circles.id,
      name: m.circles.name,
      emoji: m.circles.emoji || '🔵',
      member_count: m.circles.circle_members?.[0]?.count || 0,
    }));
  }

}

export const supabaseService = new SupabaseService();// Refresh

