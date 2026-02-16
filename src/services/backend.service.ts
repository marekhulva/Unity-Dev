// Unified backend service that switches between Supabase and custom backend
import { AppConfig, isSupabaseBackend } from '../config/app.config';
import { supabaseService } from './supabase.service';
import { apiService } from './api.service';
import { supabaseChallengeService } from './supabase.challenges.service';

class BackendService {
  async signUp(email: string, password: string, name: string) {
    if (isSupabaseBackend()) {
      try {
        const result = await supabaseService.signUp(email, password, name);
        if (__DEV__) console.log('Supabase signup result:', result);
        
        // If user was created but no session (email confirmation might still be on)
        if (result.user && !result.session) {
          // Try to sign them in immediately since email confirmation is off
          try {
            const signInResult = await supabaseService.signIn(email, password);
            if (__DEV__) console.log('Auto sign-in after signup:', signInResult);
            
            if (signInResult.session) {
              return {
                success: true,
                data: {
                  user: {
                    id: signInResult.user?.id || result.user.id,
                    email: signInResult.user?.email || email,
                    name: name
                  },
                  token: signInResult.session.access_token
                }
              };
            }
          } catch (signInError) {
            if (__DEV__) console.log('Auto sign-in failed:', signInError);
          }
          
          return {
            success: false,
            error: 'Account created but could not sign in. Please try logging in.'
          };
        }
        
        // Normal flow if session exists
        if (result.session) {
          return {
            success: true,
            data: {
              user: {
                id: result.user?.id || '',
                email: result.user?.email || email,
                name: name
              },
              token: result.session.access_token
            }
          };
        }
        
        // No user and no session
        return {
          success: false,
          error: 'Sign up failed - no user created'
        };
      } catch (error: any) {
        if (__DEV__) console.error('Signup error:', error);
        return {
          success: false,
          error: error.message || 'Sign up failed'
        };
      }
    } else {
      return apiService.register(email, password, name);
    }
  }

  async signIn(email: string, password: string) {
    if (isSupabaseBackend()) {
      try {
        const result = await supabaseService.signIn(email, password);
        
        // Check if we actually got a session
        if (!result.session || !result.user) {
          return {
            success: false,
            error: 'Invalid email or password'
          };
        }
        
        return {
          success: true,
          data: {
            user: {
              id: result.user.id,
              email: result.user.email || email,
              name: result.user.user_metadata?.name || email.split('@')[0]
            },
            token: result.session.access_token
          }
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Sign in failed'
        };
      }
    } else {
      return apiService.login(email, password);
    }
  }

  async signOut() {
    if (isSupabaseBackend()) {
      await supabaseService.signOut();
    } else {
      await apiService.logout();
    }
  }

  async getProfile() {
    if (isSupabaseBackend()) {
      const user = await supabaseService.getProfile();
      return { success: true, data: user };
    } else {
      return apiService.getProfile();
    }
  }

  async getGoals() {
    if (isSupabaseBackend()) {
      try {
        if (__DEV__) console.log('🔵 [BACKEND] getGoals called');
        const goals = await supabaseService.getGoals();
        if (__DEV__) console.log('🟢 [BACKEND] getGoals returned', goals?.length || 0, 'goals');
        return { success: true, data: goals };
      } catch (error: any) {
        if (__DEV__) console.error('🔴 [BACKEND] getGoals error:', error.message);
        return { success: false, error: error.message, data: [] };
      }
    } else {
      return apiService.getGoals();
    }
  }

  async createGoal(goal: any) {
    if (isSupabaseBackend()) {
      try {
        if (__DEV__) console.log('🔵 [BACKEND] createGoal called with:', goal.title);
        const newGoal = await supabaseService.createGoal(goal);
        if (__DEV__) console.log('🟢 [BACKEND] createGoal succeeded, ID:', newGoal?.id);
        return { success: true, data: newGoal };
      } catch (error: any) {
        if (__DEV__) console.error('🔴 [BACKEND] createGoal error:', error.message);
        return { success: false, error: error.message };
      }
    } else {
      return apiService.createGoal(goal);
    }
  }

  async updateGoal(id: string, updates: any) {
    if (isSupabaseBackend()) {
      const updated = await supabaseService.updateGoal(id, updates);
      return { success: true, data: updated };
    } else {
      return apiService.updateGoal(id, updates);
    }
  }

  async deleteGoal(id: string) {
    if (isSupabaseBackend()) {
      await supabaseService.deleteGoal(id);
      return { success: true };
    } else {
      return apiService.deleteGoal(id);
    }
  }

  async getDailyActions() {
    if (isSupabaseBackend()) {
      try {
        if (__DEV__) console.log('🔵 [BACKEND] getDailyActions called');
        const actions = await supabaseService.getDailyActions();
        if (__DEV__) console.log('🟢 [BACKEND] getDailyActions returned', actions?.length || 0, 'actions');
        return { success: true, data: actions };
      } catch (error: any) {
        if (__DEV__) console.error('🔴 [BACKEND] getDailyActions error:', error.message);
        return { success: false, error: error.message, data: [] };
      }
    } else {
      return apiService.getDailyActions();
    }
  }

  async createAction(action: any) {
    if (isSupabaseBackend()) {
      try {
        if (__DEV__) console.log('🔵 [BACKEND] createAction called with:', action.title, 'frequency:', action.frequency, 'scheduled_days:', action.scheduled_days, 'goalId:', action.goalId);
        const newAction = await supabaseService.createAction(action);
        if (__DEV__) console.log('🟢 [BACKEND] createAction succeeded, ID:', newAction?.id);
        return { success: true, data: newAction };
      } catch (error: any) {
        if (__DEV__) console.error('🔴 [BACKEND] createAction error:', error.message);
        return { success: false, error: error.message };
      }
    } else {
      return apiService.createAction(action);
    }
  }

  async completeAction(id: string) {
    if (isSupabaseBackend()) {
      const completed = await supabaseService.completeAction(id);
      return { success: true, data: completed };
    } else {
      return apiService.completeAction(id);
    }
  }

  async uncompleteAction(id: string) {
    if (isSupabaseBackend()) {
      const uncompleted = await supabaseService.uncompleteAction(id);
      return { success: true, data: uncompleted };
    } else {
      throw new Error('uncompleteAction not implemented for API backend');
    }
  }

  async updateAction(id: string, updates: any) {
    if (isSupabaseBackend()) {
      const updated = await supabaseService.updateAction(id, updates);
      return { success: true, data: updated };
    } else {
      return apiService.updateAction(id, updates);
    }
  }

  async deleteAction(id: string) {
    if (isSupabaseBackend()) {
      await supabaseService.deleteAction(id);
      return { success: true };
    } else {
      return apiService.deleteAction(id);
    }
  }
  
  async getTodaysCompletedActions() {
    if (isSupabaseBackend()) {
      try {
        if (__DEV__) console.log('🔵 [BACKEND] getTodaysCompletedActions called');
        const actions = await supabaseService.getTodaysCompletedActions();
        if (__DEV__) console.log('🟢 [BACKEND] getTodaysCompletedActions returned', actions?.length || 0, 'actions');
        return { success: true, data: actions };
      } catch (error: any) {
        if (__DEV__) console.error('🔴 [BACKEND] getTodaysCompletedActions error:', error.message);
        return { success: false, error: error.message, data: [] };
      }
    } else {
      // Fallback for non-Supabase backend
      return { success: true, data: [] };
    }
  }

  async getGoalCompletionStats(userId: string) {
    if (isSupabaseBackend()) {
      try {
        const stats = await supabaseService.getGoalCompletionStats(userId);
        return { success: true, data: stats };
      } catch (error: any) {
        if (__DEV__) console.error('Error fetching goal stats:', error);
        return { success: false, error: error.message, data: {} };
      }
    } else {
      return { success: true, data: {} };
    }
  }

  async getOverallCompletionStats(userId: string) {
    if (isSupabaseBackend()) {
      try {
        const stats = await supabaseService.getOverallCompletionStats(userId);
        return { success: true, data: stats };
      } catch (error: any) {
        if (__DEV__) console.error('Error fetching overall stats:', error);
        return { success: false, error: error.message, data: { expected: 0, completed: 0, percentage: 0 } };
      }
    } else {
      return { success: true, data: { expected: 0, completed: 0, percentage: 0 } };
    }
  }

  async updateProfile(updates: { avatar?: string; name?: string; bio?: string }) {
    if (isSupabaseBackend()) {
      try {
        const result = await supabaseService.updateProfile(updates);
        return { success: true, data: result };
      } catch (error) {
        if (__DEV__) console.error('🔴 [BACKEND] Profile update error:', error);
        return { success: false, error: error.message };
      }
    } else {
      // API service implementation would go here
      return { success: false, error: 'Not implemented for API backend' };
    }
  }

  async getFeed(type: 'circle' | 'follow' = 'circle', limit: number = 5, offset: number = 0, circleId?: string | null) {
    if (isSupabaseBackend()) {
      const result = await supabaseService.getFeed(type, limit, offset, circleId);
      return { success: true, data: result.posts, hasMore: result.hasMore };
    } else {
      return apiService.getFeed(type);
    }
  }

  async getUnifiedFeed(limit: number = 10, offset: number = 0, filter?: string | null) {
    if (isSupabaseBackend()) {
      // filter can be: '__ALL__', '__FOLLOWING__', or a specific circleId
      const isSpecialFilter = filter === '__ALL__' || filter === '__FOLLOWING__';
      const circleId = isSpecialFilter ? null : filter;
      const filterParam = isSpecialFilter ? filter : undefined;
      const result = await supabaseService.getUnifiedFeed(limit, offset, circleId, filterParam);
      return { success: true, data: result.posts, hasMore: result.hasMore };
    } else {
      // Fallback to circle feed for non-Supabase backends
      return apiService.getFeed('circle');
    }
  }

  async createPost(post: any) {
    if (isSupabaseBackend()) {
      try {
        const newPost = await supabaseService.createPost(post);
        return { success: true, data: newPost };
      } catch (error: any) {
        if (__DEV__) console.error('[BACKEND] createPost error:', error);
        return {
          success: false,
          error: error.message || 'Failed to create post'
        };
      }
    } else {
      return apiService.createPost(post);
    }
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
    if (isSupabaseBackend()) {
      try {
        const post = await supabaseService.findOrCreateDailyProgressPost(
          userId,
          challengeId,
          challengeName,
          challengeMetadata
        );
        return { success: true, data: post };
      } catch (error: any) {
        if (__DEV__) console.error('🔴 [BACKEND] findOrCreateDailyProgressPost error:', error.message);
        return { success: false, error: error.message };
      }
    } else {
      return { success: false, error: 'Living Progress Cards not implemented in custom backend' };
    }
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
    if (isSupabaseBackend()) {
      try {
        const updatedPost = await supabaseService.updateDailyProgressPost(postId, actionData, totalActions);
        return { success: true, data: updatedPost };
      } catch (error: any) {
        if (__DEV__) console.error('🔴 [BACKEND] updateDailyProgressPost error:', error.message);
        return { success: false, error: error.message };
      }
    } else {
      return { success: false, error: 'Living Progress Cards not implemented in custom backend' };
    }
  }

  async removeActionFromDailyProgress(postId: string, actionId: string) {
    if (isSupabaseBackend()) {
      try {
        const result = await supabaseService.removeActionFromDailyProgress(postId, actionId);
        return { success: true, data: result };
      } catch (error: any) {
        if (__DEV__) console.error('🔴 [BACKEND] removeActionFromDailyProgress error:', error.message);
        return { success: false, error: error.message };
      }
    } else {
      return { success: false, error: 'Living Progress Cards not implemented in custom backend' };
    }
  }

  async reactToPost(postId: string, emoji: string) {
    if (isSupabaseBackend()) {
      const reaction = await supabaseService.reactToPost(postId, emoji);
      return { success: true, data: reaction };
    } else {
      return apiService.reactToPost(postId, emoji);
    }
  }

  async addComment(postId: string, content: string) {
    if (isSupabaseBackend()) {
      try {
        const comment = await supabaseService.addComment(postId, content);
        return { success: true, data: comment };
      } catch (error) {
        if (__DEV__) console.error('Failed to add comment:', error);
        return { success: false, error: (error as Error).message };
      }
    } else {
      // Fallback for non-Supabase backend
      return { success: false, error: 'Comments not supported in this backend' };
    }
  }

  async getComments(postId: string, limit = 50, offset = 0) {
    if (isSupabaseBackend()) {
      try {
        const comments = await supabaseService.getComments(postId, limit, offset);
        return { success: true, data: comments };
      } catch (error) {
        if (__DEV__) console.error('Failed to get comments:', error);
        return { success: false, error: (error as Error).message, data: [] };
      }
    } else {
      return { success: true, data: [] };
    }
  }

  async deleteComment(commentId: string) {
    if (isSupabaseBackend()) {
      try {
        await supabaseService.deleteComment(commentId);
        return { success: true };
      } catch (error) {
        if (__DEV__) console.error('Failed to delete comment:', error);
        return { success: false, error: (error as Error).message };
      }
    } else {
      return { success: false, error: 'Comments not supported in this backend' };
    }
  }

  async toggleLike(postId: string) {
    if (isSupabaseBackend()) {
      try {
        const result = await supabaseService.toggleLike(postId);
        return { success: true, data: result };
      } catch (error) {
        if (__DEV__) console.error('Failed to toggle like:', error);
        return { success: false, error: (error as Error).message };
      }
    } else {
      // Fallback for non-Supabase backend
      return { success: false, error: 'Likes not supported in this backend' };
    }
  }

  async getLikes(postId: string) {
    if (isSupabaseBackend()) {
      try {
        const likesData = await supabaseService.getLikes(postId);
        return { success: true, data: likesData };
      } catch (error) {
        if (__DEV__) console.error('Failed to get likes:', error);
        return { success: false, error: (error as Error).message, data: { likes: [], count: 0, userLiked: false } };
      }
    } else {
      return { success: true, data: { likes: [], count: 0, userLiked: false } };
    }
  }

  async getBatchLikes(postIds: string[]) {
    if (isSupabaseBackend()) {
      try {
        const likesMap = await supabaseService.getBatchLikes(postIds);
        return { success: true, data: likesMap };
      } catch (error) {
        if (__DEV__) console.error('Failed to get batch likes:', error);
        return { success: false, error: (error as Error).message, data: {} };
      }
    } else {
      return { success: true, data: {} };
    }
  }

  async getStreaks() {
    if (isSupabaseBackend()) {
      // Implement streaks in supabase if needed
      return { success: true, data: [] };
    } else {
      return apiService.getStreaks();
    }
  }

  // Circle methods - Updated for multiple circles support
  async createCircle(data: { name: string; emoji?: string; description?: string }) {
    if (isSupabaseBackend()) {
      const circle = await supabaseService.createCircle(data.name, data.emoji, data.description);
      return { success: true, data: circle };
    } else {
      // Custom backend doesn't have circles yet
      throw new Error('Circles not implemented in custom backend');
    }
  }

  async joinCircleWithCode(inviteCode: string) {
    if (isSupabaseBackend()) {
      const result = await supabaseService.joinCircleWithCode(inviteCode);
      return result; // Returns {success, error, data: circle}
    } else {
      throw new Error('Circles not implemented in custom backend');
    }
  }

  async joinCircleByCode(inviteCode: string) {
    // Alias for joinCircleWithCode
    return this.joinCircleWithCode(inviteCode);
  }

  async getMyCircle() {
    if (isSupabaseBackend()) {
      const circle = await supabaseService.getMyCircle();
      return { success: true, data: circle };
    } else {
      throw new Error('Circles not implemented in custom backend');
    }
  }

  // NEW: Get all circles the user belongs to (for multiple circles)
  async getUserCircles() {
    if (isSupabaseBackend()) {
      try {
        const circles = await supabaseService.getUserCircles();
        return { success: true, data: circles };
      } catch (error: any) {
        return { success: false, error: error.message, data: [] };
      }
    } else {
      throw new Error('Multiple circles not implemented in custom backend');
    }
  }

  // NEW: Leave a circle
  async leaveCircle(circleId: string) {
    if (isSupabaseBackend()) {
      try {
        await supabaseService.leaveCircle(circleId);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    } else {
      throw new Error('Leave circle not implemented in custom backend');
    }
  }

  async getCircleMembers(circleId: string) {
    if (isSupabaseBackend()) {
      const members = await supabaseService.getCircleMembers(circleId);
      return { success: true, data: members };
    } else {
      throw new Error('Circles not implemented in custom backend');
    }
  }

  // Following methods
  async followUser(userId: string) {
    if (isSupabaseBackend()) {
      await supabaseService.followUser(userId);
      return { success: true };
    } else {
      throw new Error('Following not implemented in custom backend');
    }
  }

  async unfollowUser(userId: string) {
    if (isSupabaseBackend()) {
      await supabaseService.unfollowUser(userId);
      return { success: true };
    } else {
      throw new Error('Following not implemented in custom backend');
    }
  }

  async getFollowing() {
    if (isSupabaseBackend()) {
      const following = await supabaseService.getFollowing();
      return { success: true, data: following };
    } else {
      throw new Error('Following not implemented in custom backend');
    }
  }

  async getFollowers() {
    if (isSupabaseBackend()) {
      const followers = await supabaseService.getFollowers();
      return { success: true, data: followers };
    } else {
      throw new Error('Following not implemented in custom backend');
    }
  }

  async getAllUsers(limit?: number) {
    if (isSupabaseBackend()) {
      const users = await supabaseService.getAllUsers(limit);
      return { success: true, data: users };
    } else {
      throw new Error('Get all users not implemented in custom backend');
    }
  }

  async searchUsers(query: string, limit?: number) {
    if (isSupabaseBackend()) {
      const users = await supabaseService.searchUsers(query, limit);
      return { success: true, data: users };
    } else {
      throw new Error('Search users not implemented in custom backend');
    }
  }

  // Challenge methods
  async getCircleChallenges(circleId: string) {
    if (isSupabaseBackend()) {
      const challenges = await supabaseChallengeService.getCircleChallenges(circleId);
      return { success: true, data: challenges };
    } else {
      throw new Error('Challenges not implemented in custom backend');
    }
  }
  
  async getChallenge(challengeId: string) {
    if (isSupabaseBackend()) {
      const challenge = await supabaseChallengeService.getChallenge(challengeId);
      return { success: true, data: challenge };
    } else {
      throw new Error('Challenges not implemented in custom backend');
    }
  }
  
  async joinChallenge(challengeId: string, selectedActivityIds: string[]) {
    if (isSupabaseBackend()) {
      return await supabaseChallengeService.joinChallenge(challengeId, selectedActivityIds);
    } else {
      throw new Error('Challenges not implemented in custom backend');
    }
  }
  
  async getMyParticipation(challengeId: string) {
    if (isSupabaseBackend()) {
      const participation = await supabaseChallengeService.getMyParticipation(challengeId);
      return { success: true, data: participation };
    } else {
      throw new Error('Challenges not implemented in custom backend');
    }
  }
  
  async getChallengeLeaderboard(challengeId: string) {
    if (isSupabaseBackend()) {
      const leaderboard = await supabaseChallengeService.getChallengeLeaderboard(challengeId);
      return { success: true, data: leaderboard };
    } else {
      throw new Error('Challenges not implemented in custom backend');
    }
  }
  
  async recordChallengeActivity(participantId: string, activityId: string, linkedActionId?: string) {
    if (isSupabaseBackend()) {
      return await supabaseChallengeService.recordChallengeActivity(participantId, activityId, linkedActionId);
    } else {
      throw new Error('Challenges not implemented in custom backend');
    }
  }
  
  async getTodayCompletions(participantId: string) {
    if (isSupabaseBackend()) {
      const completions = await supabaseChallengeService.getTodayUserCompletions();
      return { success: true, data: completions.filter((c: any) => c.participant_id === participantId) };
    } else {
      throw new Error('Challenges not implemented in custom backend');
    }
  }
  
  async findActivityMatches(activityTitle: string, userId: string) {
    if (isSupabaseBackend()) {
      const match = await supabaseChallengeService.findActivityMatches(activityTitle, userId);
      return { success: true, data: match };
    } else {
      throw new Error('Challenges not implemented in custom backend');
    }
  }
  
  async linkActivityToAction(participantId: string, actionId: string) {
    if (isSupabaseBackend()) {
      return await supabaseChallengeService.linkActivityToAction(participantId, actionId);
    } else {
      throw new Error('Challenges not implemented in custom backend');
    }
  }
  
  async getGroupStats(challengeId: string) {
    if (isSupabaseBackend()) {
      const stats = await supabaseChallengeService.getGroupStats(challengeId);
      return { success: true, data: stats };
    } else {
      throw new Error('Challenges not implemented in custom backend');
    }
  }
  
  async getUserChallengeActivities() {
    if (isSupabaseBackend()) {
      const activities = await supabaseChallengeService.getUserChallengeActivities();
      return { success: true, data: activities };
    } else {
      throw new Error('Challenges not implemented in custom backend');
    }
  }
  
  async getLinkedChallengeActivities() {
    if (isSupabaseBackend()) {
      const linkedActivities = await supabaseChallengeService.getLinkedChallengeActivities();
      return { success: true, data: linkedActivities };
    } else {
      throw new Error('Challenges not implemented in custom backend');
    }
  }
  
  async getTodayChallengeCompletions() {
    if (isSupabaseBackend()) {
      const completions = await supabaseChallengeService.getTodayUserCompletions();
      return { success: true, data: completions };
    } else {
      throw new Error('Challenges not implemented in custom backend');
    }
  }
  
  async getUserChallengeParticipations() {
    if (isSupabaseBackend()) {
      const participations = await supabaseChallengeService.getUserParticipations();
      return { success: true, data: participations };
    } else {
      throw new Error('Challenges not implemented in custom backend');
    }
  }
}

export const backendService = new BackendService();