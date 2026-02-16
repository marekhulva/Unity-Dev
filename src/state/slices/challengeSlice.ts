import { StateCreator } from 'zustand';
import { supabaseChallengeService } from '../../services/supabase.challenges.service';
import type {
  Challenge,
  ChallengeWithDetails,
  ChallengeParticipant,
  UserBadge,
  LeaderboardEntry,
  ActivityTime,
} from '../../types/challenges.types';

export type ChallengeSlice = {
  globalChallenges: Challenge[];
  circleChallenges: Challenge[];
  activeChallenges: ChallengeWithDetails[];
  completedChallenges: ChallengeWithDetails[];
  currentChallenge: ChallengeWithDetails | null;
  newlyCompletedChallenge: ChallengeWithDetails | null;
  leaderboard: LeaderboardEntry[];
  myBadges: UserBadge[];
  challengesLoading: boolean;
  challengeError: string | null;

  fetchGlobalChallenges: () => Promise<void>;
  fetchCircleChallenges: (circleId: string) => Promise<void>;
  fetchAllUserCircleChallenges: () => Promise<void>;
  fetchMyActiveChallenges: () => Promise<void>;
  fetchMyCompletedChallenges: () => Promise<void>;
  fetchMyBadges: () => Promise<void>;
  loadChallenge: (challengeId: string) => Promise<void>;
  loadLeaderboard: (challengeId: string) => Promise<void>;
  joinChallenge: (
    challengeId: string,
    selectedActivityIds: string[],
    activityTimes: ActivityTime[],
    personalStartDate?: Date
  ) => Promise<boolean>;
  leaveChallenge: (participantId: string, keepActivities: boolean) => Promise<boolean>;
  recordCompletion: (participantId: string, activityId: string, linkedActionId?: string, photoUrl?: string) => Promise<boolean>;
  getTodayCompletions: (participantId: string) => Promise<any[]>;
  clearCompletionModal: () => void;
  clearChallengeData: () => void;
};

export const createChallengeSlice: StateCreator<ChallengeSlice> = (set, get) => ({
  globalChallenges: [],
  circleChallenges: [],
  activeChallenges: [],
  completedChallenges: [],
  currentChallenge: null,
  newlyCompletedChallenge: null,
  leaderboard: [],
  myBadges: [],
  challengesLoading: false,
  challengeError: null,

  fetchGlobalChallenges: async () => {
    if (__DEV__) console.log('🌍 [STORE] Fetching global challenges');

    // Only show loading state if we don't have cached data
    const hasCachedData = get().globalChallenges.length > 0;
    if (!hasCachedData) {
      set({ challengesLoading: true, challengeError: null });
    }

    try {
      const challenges = await supabaseChallengeService.getGlobalChallenges();
      set({
        globalChallenges: challenges,
        challengesLoading: false
      });
      if (__DEV__) console.log('🟢 [STORE] Loaded global challenges:', challenges.length);
    } catch (error: any) {
      if (__DEV__) console.error('🔴 [STORE] Error fetching global challenges:', error);
      set({
        challengeError: error.message || 'Failed to load challenges',
        challengesLoading: false
      });
    }
  },

  fetchCircleChallenges: async (circleId: string) => {
    if (__DEV__) console.log('👥 [STORE] Fetching circle challenges for:', circleId);

    const hasCachedData = get().circleChallenges.length > 0;
    if (!hasCachedData) {
      set({ challengesLoading: true, challengeError: null });
    }

    try {
      const challenges = await supabaseChallengeService.getCircleChallenges(circleId);
      set({
        circleChallenges: challenges,
        challengesLoading: false
      });
      if (__DEV__) console.log('🟢 [STORE] Loaded circle challenges:', challenges.length);
    } catch (error: any) {
      if (__DEV__) console.error('🔴 [STORE] Error fetching circle challenges:', error);
      set({
        challengeError: error.message || 'Failed to load challenges',
        challengesLoading: false
      });
    }
  },

  fetchAllUserCircleChallenges: async () => {
    if (__DEV__) console.log('👥 [STORE] Fetching all user circle challenges');

    const hasCachedData = get().circleChallenges.length > 0;
    if (!hasCachedData) {
      set({ challengesLoading: true, challengeError: null });
    }

    try {
      const challenges = await supabaseChallengeService.getAllUserCircleChallenges();
      set({
        circleChallenges: challenges,
        challengesLoading: false
      });
      if (__DEV__) console.log('🟢 [STORE] Loaded all user circle challenges:', challenges.length);
    } catch (error: any) {
      if (__DEV__) console.error('🔴 [STORE] Error fetching all user circle challenges:', error);
      set({
        challengeError: error.message || 'Failed to load challenges',
        challengesLoading: false
      });
    }
  },

  fetchMyActiveChallenges: async () => {
    if (__DEV__) console.log('📋 [STORE] Fetching my active challenges');

    const hasCachedData = get().activeChallenges.length > 0;
    if (!hasCachedData) {
      set({ challengesLoading: true });
    }

    try {
      const challenges = await supabaseChallengeService.getMyActiveChallenges();
      set({
        activeChallenges: challenges,
        challengesLoading: false
      });
      if (__DEV__) console.log('🟢 [STORE] Loaded active challenges:', challenges.length);
    } catch (error: any) {
      if (__DEV__) console.error('🔴 [STORE] Error fetching active challenges:', error);
      set({ challengesLoading: false });
    }
  },

  fetchMyCompletedChallenges: async () => {
    if (__DEV__) console.log('✅ [STORE] Fetching my completed challenges');
    set({ challengesLoading: true });

    try {
      const challenges = await supabaseChallengeService.getMyCompletedChallenges();
      set({
        completedChallenges: challenges,
        challengesLoading: false
      });
      if (__DEV__) console.log('🟢 [STORE] Loaded completed challenges:', challenges.length);
    } catch (error: any) {
      if (__DEV__) console.error('🔴 [STORE] Error fetching completed challenges:', error);
      set({ challengesLoading: false });
    }
  },

  fetchMyBadges: async () => {
    if (__DEV__) console.log('🏆 [STORE] Fetching my badges');

    try {
      const badges = await supabaseChallengeService.getMyBadges();
      set({ myBadges: badges });
      if (__DEV__) console.log('🟢 [STORE] Loaded badges:', badges.length);
    } catch (error: any) {
      if (__DEV__) console.error('🔴 [STORE] Error fetching badges:', error);
    }
  },

  loadChallenge: async (challengeId: string) => {
    if (__DEV__) console.log('🔍 [STORE] Loading challenge:', challengeId);
    set({ challengesLoading: true });

    try {
      const challenge = await supabaseChallengeService.getChallenge(challengeId);
      set({
        currentChallenge: challenge,
        challengesLoading: false
      });
      if (__DEV__) console.log('🟢 [STORE] Loaded challenge:', challenge?.name);
    } catch (error: any) {
      if (__DEV__) console.error('🔴 [STORE] Error loading challenge:', error);
      set({ challengesLoading: false });
    }
  },

  loadLeaderboard: async (challengeId: string) => {
    if (__DEV__) console.log('🏆 [STORE] Loading leaderboard for:', challengeId);

    try {
      const leaderboard = await supabaseChallengeService.getLeaderboard(challengeId);
      set({ leaderboard });
      if (__DEV__) console.log('🟢 [STORE] Loaded leaderboard:', leaderboard.length, 'participants');
    } catch (error: any) {
      if (__DEV__) console.error('🔴 [STORE] Error loading leaderboard:', error);
    }
  },

  joinChallenge: async (
    challengeId: string,
    selectedActivityIds: string[],
    activityTimes: ActivityTime[],
    personalStartDate?: Date
  ) => {
    if (__DEV__) console.log('🏆 [STORE] Joining challenge:', challengeId);
    set({ challengesLoading: true });

    try {
      const result = await supabaseChallengeService.joinChallenge(
        challengeId,
        selectedActivityIds,
        activityTimes,
        personalStartDate
      );

      if (result.success) {
        await get().loadChallenge(challengeId);
        await get().fetchMyActiveChallenges();
        set({ challengesLoading: false });
        if (__DEV__) console.log('🟢 [STORE] Successfully joined challenge');
        return true;
      } else {
        set({
          challengeError: result.error || 'Failed to join challenge',
          challengesLoading: false
        });
        return false;
      }
    } catch (error: any) {
      if (__DEV__) console.error('🔴 [STORE] Error joining challenge:', error);
      set({
        challengeError: error.message || 'Failed to join challenge',
        challengesLoading: false
      });
      return false;
    }
  },

  leaveChallenge: async (participantId: string, keepActivities: boolean) => {
    if (__DEV__) console.log('🚪 [STORE] Leaving challenge:', participantId);
    set({ challengesLoading: true });

    try {
      const result = await supabaseChallengeService.leaveChallenge(participantId, keepActivities);

      if (result.success) {
        await get().fetchMyActiveChallenges();
        set({ challengesLoading: false });
        if (__DEV__) console.log('🟢 [STORE] Successfully left challenge');
        return true;
      } else {
        set({
          challengeError: result.error || 'Failed to leave challenge',
          challengesLoading: false
        });
        return false;
      }
    } catch (error: any) {
      if (__DEV__) console.error('🔴 [STORE] Error leaving challenge:', error);
      set({ challengesLoading: false });
      return false;
    }
  },

  _recordingCompletions: new Set<string>(),

  recordCompletion: async (participantId: string, activityId: string, linkedActionId?: string, photoUrl?: string) => {
    // Prevent double-tap: skip if this activity is already being recorded
    const key = `${participantId}-${activityId}`;
    const recording = get()._recordingCompletions;
    if (recording.has(key)) {
      if (__DEV__) console.log('⏳ [STORE] Already recording, skipping:', key);
      return false;
    }
    recording.add(key);

    if (__DEV__) console.log('✅ [STORE] Recording completion:', {
      participantId,
      activityId,
      linkedActionId,
    });

    try {
      const result = await supabaseChallengeService.recordCompletion(
        participantId,
        activityId,
        linkedActionId,
        photoUrl
      );

      if (result.success) {
        await get().fetchMyActiveChallenges();
        const { activeChallenges } = get();

        const updatedParticipation = activeChallenges.find(
          c => c.my_participation?.id === participantId
        );

        if (updatedParticipation) {
          const challengeId = updatedParticipation.id;
          const { currentChallenge } = get();

          if (currentChallenge && currentChallenge.id === challengeId) {
            await get().loadChallenge(challengeId);
            await get().loadLeaderboard(challengeId);
          }

          if (updatedParticipation.my_participation?.status === 'completed') {
            if (__DEV__) console.log('🎉 [STORE] Challenge just completed! Showing completion modal');
            set({ newlyCompletedChallenge: updatedParticipation });
          }
        }

        if (__DEV__) console.log('🟢 [STORE] Completion recorded successfully');
        set({ lastCompletionAt: Date.now() } as any);
        return true;
      } else {
        if (__DEV__) console.log('⚠️ [STORE]', result.error);
        return false;
      }
    } catch (error: any) {
      if (__DEV__) console.error('🔴 [STORE] Error recording completion:', error);
      return false;
    } finally {
      get()._recordingCompletions.delete(key);
    }
  },

  getTodayCompletions: async (participantId: string) => {
    try {
      const completions = await supabaseChallengeService.getTodayUserCompletions();
      return completions.filter((c: any) => c.participant_id === participantId);
    } catch (error) {
      if (__DEV__) console.error('🔴 [STORE] Error fetching today completions:', error);
      return [];
    }
  },

  clearCompletionModal: () => {
    set({ newlyCompletedChallenge: null });
  },

  clearChallengeData: () => {
    set({
      globalChallenges: [],
      circleChallenges: [],
      activeChallenges: [],
      completedChallenges: [],
      currentChallenge: null,
      leaderboard: [],
      myBadges: [],
      challengeError: null,
    });
  },
});
