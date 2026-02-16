import { StateCreator } from 'zustand';
import { backendService } from '../../services/backend.service';
import { shouldActionAppearToday } from '../../utils/actionScheduling';

export type ActionItem = {
  id: string;
  title: string;
  goalId?: string;  // Link to specific goal
  goalTitle?: string;
  goalColor?: string;
  type:'commitment'|'performance'|'one-time';
  frequency?: string; // e.g., "daily", "three_per_week", "weekly"
  scheduled_days?: string[]; // For weekly and 3x/week: ['monday', 'wednesday', 'friday']
  created_at?: string; // For every_other_day calculation
  time?: string;
  streak: number;
  done?: boolean;
  failed?: boolean;            // True if action was attempted but user failed (abstinence violations)
  failure_reason?: string;     // Optional reason for failure
  // Abstinence flag
  isAbstinence?: boolean;      // True for "avoid" actions (No Social Media, No Alcohol)
  // Challenge-related fields
  challengeId?: string;        // If from a challenge
  challengeActivityId?: string; // The specific activity in challenge
  challengeParticipantId?: string; // To track completions
  challengeName?: string;      // For display (e.g., "Jing Challenge")
  isFromChallenge?: boolean;   // Quick flag for UI
  challengeIcon?: string;      // Activity icon from challenge
};

export type CompletedAction = {
  id: string;
  actionId: string;
  title: string;
  goalId?: string;  // Link to specific goal
  goalTitle?: string;
  completedAt: Date;
  isPrivate: boolean;
  streak: number;
  type: 'check' | 'photo' | 'audio' | 'milestone';
  mediaUrl?: string;
  category?: string;
};

export type DailySlice = {
  actions: ActionItem[];
  completedActions: CompletedAction[];
  actionsLoading: boolean;
  actionsError: string | null;
  fetchDailyActions: () => Promise<void>;
  toggleAction: (id: string, failed?: boolean, failureReason?: string) => Promise<void>;
  addAction: (a: Partial<ActionItem>) => Promise<void>;
  updateAction: (id: string, updates: Partial<ActionItem>) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
  addCompletedAction: (ca: CompletedAction) => void;
  clearCompletedActions: () => void;
  createCelebrationPost: () => Promise<void>;
  lastCompletionAt: number;
  clearDailyData: () => void;
};

export const createDailySlice: StateCreator<DailySlice> = (set, get) => ({
  actions: [],
  completedActions: [],
  actionsLoading: false,
  actionsError: null,
  lastCompletionAt: 0,
  
  fetchDailyActions: async () => {
    if (__DEV__) console.log('🟦 [ACTIONS] fetchDailyActions called');
    set({ actionsLoading: true, actionsError: null });
    try {
      // Clear any stale cache to ensure fresh data
      if (__DEV__) console.log('🟦 [ACTIONS] Fetching fresh data from backend');

      // PARALLEL FETCH: Run all independent queries at once
      // OPTIMIZATION: Removed redundant getUserChallengeParticipations (save ~400ms)
      const [
        response,
        challengeResponse,  // Already includes activity_times with scheduledTime
        linkedResponse,
        todayCompletions,
        completedResponse
      ] = await Promise.all([
        backendService.getDailyActions(),
        backendService.getUserChallengeActivities(),
        backendService.getLinkedChallengeActivities(),
        backendService.getTodayChallengeCompletions(),
        backendService.getTodaysCompletedActions()
      ]);

      const regularActions: ActionItem[] = [];

      if (response.success) {
        if (__DEV__) console.log('🟦 [ACTIONS] Response received:', response.data?.length || 0, 'regular actions');

        // Map actions and filter based on frequency
        const mappedActions = (response.data || [])
          .map((a: any) => {
            return {
              id: a.id,
              title: a.title,
              goalId: a.goalId || a.goal?.id,  // Include goalId
              goalTitle: a.goal?.title,
              goalColor: a.goal?.color,
              type: 'commitment' as const,
              frequency: a.frequency || 'daily',
              scheduled_days: a.scheduled_days || a.scheduledDays,
              created_at: a.created_at,
              time: a.time,
              streak: 0,
              done: a.completed || false,  // Map from 'completed' field in database
              // PRESERVE COMPLETION TIMESTAMPS FOR PROGRESS PAGE!
              completed_at: a.completed_at,
              completedAt: a.completedAt,
              completed: a.completed,  // Keep original completed status too
              isAbstinence: a.isAbstinence || false
            };
          })
          .filter((action: any) => {
            // Filter actions based on their frequency
            const shouldAppear = shouldActionAppearToday({
              frequency: action.frequency,
              scheduledDays: action.scheduled_days,
              created_at: action.created_at
            });

            if (!shouldAppear) {
              if (__DEV__) console.log(`🔽 [ACTIONS] Filtering out "${action.title}" - not scheduled for today (${action.frequency})`);
            }

            return shouldAppear;
          });

        if (__DEV__) console.log(`🟦 [ACTIONS] After frequency filtering: ${mappedActions.length} actions for today`);
        regularActions.push(...mappedActions);
      }

      // Process challenge activities
      if (__DEV__) console.log('🏆 [ACTIONS] Challenge response:', challengeResponse);
      if (__DEV__) console.log('🏆 [ACTIONS] Raw challenge data:', JSON.stringify(challengeResponse.data, null, 2));
      const challengeActions: ActionItem[] = [];

      // Process linked activities
      if (__DEV__) console.log('🔗 [ACTIONS] Linked activities:', linkedResponse);
      
      // Process linked activities - merge challenge info into regular actions
      if (linkedResponse.success && linkedResponse.data) {
        linkedResponse.data.forEach((link: any) => {
          const regularActionIndex = regularActions.findIndex(a => a.id === link.linkedActionId);
          if (regularActionIndex !== -1) {
            if (__DEV__) console.log(`🔗 [ACTIONS] Merging challenge info into action ${link.linkedActionId}`);
            regularActions[regularActionIndex] = {
              ...regularActions[regularActionIndex],
              // Add challenge fields to the existing action
              isFromChallenge: true,
              challengeId: link.challengeId,
              challengeActivityId: link.challengeActivityId,
              challengeParticipantId: link.participantId,
              challengeName: link.challengeName
            };
          }
        });
      }

      if (challengeResponse.success && challengeResponse.data) {
        if (__DEV__) console.log('🏆 [ACTIONS] Found', challengeResponse.data.length, 'non-linked challenge activities');
        challengeResponse.data.forEach((activity: any, index: number) => {
          if (__DEV__) console.log(`📍 [ACTIONS] Activity ${index}:`, {
            id: activity.id,
            title: activity.title || activity.display_name,
            scheduledTime: activity.scheduledTime,
            allFields: Object.keys(activity)
          });
        });

        // Use already-fetched completion data
        const completionMap = new Map(
          (todayCompletions.data || []).map((c: any) => [String(c.challenge_activity_id), c.completed_at])
        );
        if (__DEV__) console.log('✅ [ACTIONS] Already completed today:', [...completionMap.keys()]);

        // OPTIMIZATION: Extract scheduled times directly from challengeResponse
        // (getUserChallengeActivities already includes scheduledTime for each activity)
        const activityTimeMappings: Map<string, string> = new Map();

        if (challengeResponse.success && challengeResponse.data) {
          challengeResponse.data.forEach((activity: any) => {
            // Each activity already has scheduledTime extracted from activity_times
            if (activity.scheduledTime && activity.id) {
              activityTimeMappings.set(activity.id, activity.scheduledTime);
              if (__DEV__) console.log(`⏰ [ACTIONS] Mapped time for activity ${activity.id}: ${activity.scheduledTime}`);
            }
          });
        }
        if (__DEV__) console.log('⏰ [ACTIONS] Activity time mappings:', activityTimeMappings);
        
        const mappedChallengeActions = challengeResponse.data.map((activity: any) => {
          if (__DEV__) console.log('🔍 [ACTIONS] Processing challenge activity:', {
            title: activity.display_name || activity.title,
            scheduledTime: activity.scheduledTime,
            id: activity.id
          });
          
          // All activities here are already non-linked (filtered by the service)
          if (__DEV__) console.log('🎯 [ACTIONS] Creating challenge action from activity:', activity);
          
          // Get the scheduled time from our mappings
          const scheduledTime = activityTimeMappings.get(activity.id);
          if (__DEV__) console.log('⏰ [ACTIONS] Scheduled time for this activity:', scheduledTime);
          
          const actionItem = {
            id: `challenge-${activity.challengeId}-${activity.id}`, // Make unique per challenge
            title: activity.display_name || activity.title || 'Unknown Activity', // Use display_name field
            type: 'commitment' as const,
            frequency: 'Daily',
            time: scheduledTime, // Use the time from activity_times mapping
            streak: 0,
            done: completionMap.has(String(activity.id)), // Check if already done today
            completed_at: completionMap.get(String(activity.id)) || null,
            // Challenge-specific fields
            isFromChallenge: true,
            challengeId: activity.challengeId,
            challengeActivityId: activity.id,
            challengeParticipantId: activity.participantId,
            challengeName: activity.challengeName,
            challengeIcon: activity.emoji || activity.icon, // Use emoji field
            isAbstinence: activity.is_abstinence || false
          };
          
          if (__DEV__) console.log('📦 [ACTIONS] Final action item:', actionItem);
          return actionItem;
        }).filter(Boolean); // Remove null entries (linked activities)
        
        challengeActions.push(...mappedChallengeActions);
      }
      
      // Merge all actions (linked activities are already merged into regular actions)
      const allActions = [...regularActions, ...challengeActions];
      if (__DEV__) console.log('🟢 [ACTIONS] Total actions:', allActions.length, '(', regularActions.length, 'regular +', challengeActions.length, 'challenge)');
      
      set({ actions: allActions, actionsLoading: false });
      if (__DEV__) console.log('🟢 [ACTIONS] Daily actions loaded successfully');

      // Use already-fetched completed actions data
      if (completedResponse.success) {
        if (__DEV__) console.log('🟢 [ACTIONS] Found', completedResponse.data?.length || 0, 'completed actions today');
        set({ completedActions: completedResponse.data || [] });
      }
    } catch (error: any) {
      if (__DEV__) console.error('🔴 [ACTIONS] Error in fetchDailyActions:', error);
      set({ actionsError: error.message, actionsLoading: false });
    }
  },
  
  _togglingActions: new Set<string>(),

  toggleAction: async (id, failed?: boolean, failureReason?: string) => {
    if (__DEV__) console.log('🟦 [ACTIONS] toggleAction called for ID:', id, { failed, failureReason });

    // Prevent double-tap: skip if this action is already being toggled
    const toggling = get()._togglingActions;
    if (toggling.has(id)) {
      if (__DEV__) console.log('⏳ [ACTIONS] Already toggling, skipping:', id);
      return;
    }
    toggling.add(id);

    // Find the action to check if it's from a challenge
    const action = get().actions.find(a => a.id === id);
    if (!action) {
      if (__DEV__) console.error('🔴 [ACTIONS] Action not found:', id);
      toggling.delete(id);
      return;
    }

    const isCurrentlyDone = action.done;
    if (__DEV__) console.log(`🟦 [ACTIONS] Action "${action.title}" is currently ${isCurrentlyDone ? 'DONE' : 'NOT DONE'}`);

    try {
      // Handle unchecking (completing -> incomplete)
      if (isCurrentlyDone) {
        if (__DEV__) console.log('🔄 [ACTIONS] Uncompleting action:', action.title);
        const response = await backendService.uncompleteAction(id);

        if (response.success) {
          set((s) => ({
            actions: s.actions.map(a =>
              a.id === id
                ? { ...a, done: false, failed: false, failure_reason: undefined }
                : a
            )
          }));
          if (__DEV__) console.log('🟢 [ACTIONS] Action uncompleted successfully');
        } else {
          if (__DEV__) console.error('🔴 [ACTIONS] Failed to uncomplete action:', response);
        }
        return;
      }

      // Handle checking (incomplete -> completing)
      // Handle challenge activities differently
      if (action.isFromChallenge && action.challengeParticipantId && action.challengeActivityId) {
        if (__DEV__) console.log('🏆 [ACTIONS] Completing challenge activity:', action.title);

        // Record challenge completion
        const response = await backendService.recordChallengeActivity(
          action.challengeParticipantId,
          action.challengeActivityId
        );

        if (response.success) {
          // Update local state
          set((s) => ({
            actions: s.actions.map(a =>
              a.id === id
                ? { ...a, done: true /* TODO: Fix and re-enable streaks - See mvpfix.md Issue #1 */, streak: 0 }
                : a
            )
          }));
          if (__DEV__) console.log('🟢 [ACTIONS] Challenge activity completed successfully');
          set({ lastCompletionAt: Date.now() });

          // Refetch goals to update consistency in Profile
          if (__DEV__) console.log('🔄 [ACTIONS] Refetching goals to update consistency...');
          (get() as any).fetchGoals().catch(err => {
            if (__DEV__) console.error('🔴 [ACTIONS] Failed to refetch goals:', err);
          });

          // Refetch challenges to update consistency in Profile
          if (__DEV__) console.log('🔄 [ACTIONS] Refetching challenges to update consistency...');
          (get() as any).fetchMyActiveChallenges().catch(err => {
            if (__DEV__) console.error('🔴 [ACTIONS] Failed to refetch challenges:', err);
          });

          // Refetch leaderboard so challenge dashboard shows updated rankings
          if (action.challengeId) {
            if (__DEV__) console.log('🔄 [ACTIONS] Refetching leaderboard after challenge completion...');
            (get() as any).loadLeaderboard(action.challengeId).catch(err => {
              if (__DEV__) console.error('🔴 [ACTIONS] Failed to refetch leaderboard:', err);
            });
          }

          // Refetch Social feed to show updated Living Progress Card
          if (__DEV__) console.log('🔄 [ACTIONS] Refetching Social feed to update Living Progress Card...');
          const socialSlice = (get() as any);
          if (socialSlice.fetchFeeds) {
            socialSlice.fetchFeeds().catch(err => {
              if (__DEV__) console.error('🔴 [ACTIONS] Failed to refetch Social feed:', err);
            });
          }
        } else {
          if (__DEV__) console.error('🔴 [ACTIONS] Challenge completion failed:', response.error);
        }
      } else {
        // Regular action completion
        const response = await backendService.completeAction(id);
        if (__DEV__) console.log('🟦 [ACTIONS] Complete action response:', response);

        if (response.success) {
          set((s) => {
            const updatedActions = s.actions.map(a =>
              a.id === id
                ? { ...a, done: true, failed: failed || false, failure_reason: failureReason /* TODO: Fix and re-enable streaks - See mvpfix.md Issue #1 */, streak: 0 }
                : a
            );

            // Check if all actions are now complete
            const allComplete = updatedActions.every(a => a.done);
            if (allComplete && updatedActions.length > 0) {
              if (__DEV__) console.log('🎉 [ACTIONS] ALL DAILY ACTIONS COMPLETE! Triggering celebration!');
              // Trigger celebration post
              get().createCelebrationPost();
            }

            return { actions: updatedActions };
          });
          if (__DEV__) console.log('🟢 [ACTIONS] Action marked as done locally');
          set({ lastCompletionAt: Date.now() });

          // If this regular action is linked to a challenge activity, complete that too
          if (action.challengeParticipantId && action.challengeActivityId) {
            if (__DEV__) console.log('🔗 [ACTIONS] This action is linked to challenge, completing challenge activity too');
            await backendService.recordChallengeActivity(
              action.challengeParticipantId,
              action.challengeActivityId
            );

            // Refetch challenges since we just completed a challenge activity
            if (__DEV__) console.log('🔄 [ACTIONS] Refetching challenges after linked action completion...');
            (get() as any).fetchMyActiveChallenges().catch(err => {
              if (__DEV__) console.error('🔴 [ACTIONS] Failed to refetch challenges:', err);
            });

            // Refetch leaderboard so challenge dashboard shows updated rankings
            if (action.challengeId) {
              if (__DEV__) console.log('🔄 [ACTIONS] Refetching leaderboard after linked action completion...');
              (get() as any).loadLeaderboard(action.challengeId).catch(err => {
                if (__DEV__) console.error('🔴 [ACTIONS] Failed to refetch leaderboard:', err);
              });
            }
          }

          // Refetch goals to update consistency in Profile
          if (__DEV__) console.log('🔄 [ACTIONS] Refetching goals to update consistency...');
          (get() as any).fetchGoals().catch(err => {
            if (__DEV__) console.error('🔴 [ACTIONS] Failed to refetch goals:', err);
          });
        } else {
          if (__DEV__) console.error('🔴 [ACTIONS] Failed to complete action:', response);
        }
      }
    } catch (error) {
      if (__DEV__) console.error('🔴 [ACTIONS] Failed to toggle action:', error);
    } finally {
      get()._togglingActions.delete(id);
    }
  },

  addAction: async (actionData) => {
    if (__DEV__) console.log('🟦 [ACTIONS] addAction called:', actionData.title);
    try {
      const response = await backendService.createAction({
        title: actionData.title || '',
        time: actionData.time,
        goalId: actionData.goalId,  // Pass goalId from action data
        frequency: actionData.frequency || 'daily',
        scheduled_days: actionData.scheduled_days
      });
      
      if (response.success && response.data) {
        const newAction: ActionItem = {
          id: response.data.id,
          title: response.data.title,
          goalId: response.data.goalId || response.data.goal?.id,  // Include goalId
          goalTitle: response.data.goal?.title,
          goalColor: response.data.goal?.color,
          type: 'commitment',
          frequency: response.data.frequency || 'daily',
          scheduled_days: response.data.scheduled_days,
          time: response.data.time,
          streak: 0,
          done: false
        };
        if (__DEV__) console.log('🟢 [ACTIONS] Action added to store:', newAction.title, 'with goalId:', newAction.goalId);
        
        // Prevent duplicates - check if action already exists
        set((s) => {
          const existingAction = s.actions.find(a => a.id === newAction.id);
          if (existingAction) {
            if (__DEV__) console.log('🟡 [ACTIONS] Action already exists, not adding duplicate');
            return { actions: s.actions };
          }
          return { actions: [...s.actions, newAction] };
        });
      } else {
        if (__DEV__) console.error('🔴 [ACTIONS] Failed to add action:', response.error);
      }
    } catch (error) {
      if (__DEV__) console.error('🔴 [ACTIONS] Exception adding action:', error);
    }
  },

  updateAction: async (id, updates) => {
    set({ actionsLoading: true, actionsError: null });
    try {
      const response = await backendService.updateAction(id, {
        title: updates.title,
        time: updates.time,
        goalId: updates.goalId  // Include goalId in updates
      });
      
      if (response.success && response.data) {
        set((state) => ({
          actions: state.actions.map(a => 
            a.id === id ? { 
              ...a, 
              title: response.data.title,
              time: response.data.time,
              goalTitle: response.data.goal?.title 
            } : a
          ),
          actionsLoading: false
        }));
      } else {
        set({ actionsError: response.error, actionsLoading: false });
      }
    } catch (error: any) {
      set({ actionsError: error.message, actionsLoading: false });
    }
  },

  deleteAction: async (id) => {
    set({ actionsLoading: true, actionsError: null });
    try {
      const response = await backendService.deleteAction(id);
      if (response.success) {
        set((state) => ({
          actions: state.actions.filter(a => a.id !== id),
          actionsLoading: false
        }));
      } else {
        set({ actionsError: response.error, actionsLoading: false });
      }
    } catch (error: any) {
      set({ actionsError: error.message, actionsLoading: false });
    }
  },
  
  addCompletedAction: (ca) => set((s) => ({ 
    completedActions: [...s.completedActions, ca] 
  })),
  
  clearCompletedActions: () => set({ completedActions: [] }),
  
  createCelebrationPost: async () => {
    if (__DEV__) console.log('🎊 [CELEBRATION] Creating celebration post for 100% completion!');
    try {
      // Get user info from auth slice
      const user = (get() as any).user;
      if (!user) return;

      // Get unique goals from completed actions
      const completedActions = get().actions.filter(a => a.done);
      const uniqueGoals = new Map();

      completedActions.forEach(action => {
        if (action.goalId && action.goalTitle && !uniqueGoals.has(action.goalId)) {
          uniqueGoals.set(action.goalId, {
            title: action.goalTitle,
            color: action.goalColor || '#FFD700'
          });
        }
      });

      // Create a special celebration post
      const celebrationPost = {
        type: 'celebration',
        content: `🎉 ${user.name || user.email} crushed today! 100% of daily actions complete! 🏆`,
        visibility: 'circle', // Share with circle
        is_celebration: true,
        celebration_type: 'daily_100',
        metadata: {
          userName: user.name || user.email,
          userAvatar: user.avatar,
          completionTime: new Date().toISOString(),
          actionCount: get().actions.length,
          goals: Array.from(uniqueGoals.values())
        }
      };

      // Post to social feed
      const response = await backendService.createPost(celebrationPost);

      if (response.success) {
        if (__DEV__) console.log('🎉 [CELEBRATION] Celebration post created successfully!');
        // Refresh the social feed to show the celebration
        const socialSlice = (get() as any);
        if (socialSlice.fetchFeeds) {
          await socialSlice.fetchFeeds();
        }
      }
    } catch (error) {
      if (__DEV__) console.error('🔴 [CELEBRATION] Failed to create celebration post:', error);
    }
  },

  clearDailyData: () => {
    if (__DEV__) console.log('🧹 Clearing all daily actions data');
    set({
      actions: [],
      completedActions: [],
      actionsLoading: false,
      actionsError: null
    });
  },
});