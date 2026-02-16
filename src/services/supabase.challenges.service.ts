import { supabase } from './supabase.service';
import { getLocalDateString, parseLocalDateString } from '../utils/dateUtils';
import type {
  Challenge,
  ChallengeWithDetails,
  ChallengeParticipant,
  ChallengeCompletion,
  UserBadge,
  LeaderboardEntry,
  ChallengeForumThread,
  ChallengeForumReply,
  ActivityTime,
  PredeterminedActivity,
} from '../types/challenges.types';

class SupabaseChallengeService {
  supabase = supabase;

  // Ensure activities have IDs (generate from title hash if missing)
  private ensureActivityIds(activities: any[]): any[] {
    if (!activities || !Array.isArray(activities)) return [];
    return activities.map((activity, index) => ({
      ...activity,
      id: String(activity.id || `activity-${index}-${activity.title?.replace(/\s+/g, '-').toLowerCase() || index}`),
    }));
  }

  // Add IDs to challenge activities
  private enrichChallengeWithActivityIds(challenge: any): any {
    return {
      ...challenge,
      predetermined_activities: this.ensureActivityIds(challenge.predetermined_activities),
    };
  }

  async getGlobalChallenges(): Promise<Challenge[]> {
    if (__DEV__) console.log('🌍 [CHALLENGES] Fetching global challenges');

    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('scope', 'global')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error fetching global challenges:', error);
      throw error;
    }

    const challengesWithCounts = await Promise.all(
      (data || []).map(async (challenge) => {
        const participantCount = await this.getParticipantCount(challenge.id);
        return this.enrichChallengeWithActivityIds({
          ...challenge,
          participant_count: participantCount,
        });
      })
    );

    if (__DEV__) console.log('🟢 [CHALLENGES] Found global challenges:', challengesWithCounts.length);
    return challengesWithCounts;
  }

  async getCircleChallenges(circleId: string): Promise<Challenge[]> {
    if (__DEV__) console.log('👥 [CHALLENGES] Fetching challenges for circle:', circleId);

    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('scope', 'circle')
      .eq('circle_id', circleId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error fetching circle challenges:', error);
      throw error;
    }

    const challengesWithCounts = await Promise.all(
      (data || []).map(async (challenge) => {
        const participantCount = await this.getParticipantCount(challenge.id);
        return this.enrichChallengeWithActivityIds({
          ...challenge,
          participant_count: participantCount,
        });
      })
    );

    if (__DEV__) console.log('🟢 [CHALLENGES] Found circle challenges:', challengesWithCounts.length);
    return challengesWithCounts;
  }

  async getAllUserCircleChallenges(): Promise<Challenge[]> {
    if (__DEV__) console.log('👥 [CHALLENGES] Fetching all challenges from user circles');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (__DEV__) console.log('🔴 [CHALLENGES] No user found');
      return [];
    }

    const { data: circleData, error: circleError } = await supabase
      .from('circle_members')
      .select('circle_id')
      .eq('user_id', user.id);

    if (circleError) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error fetching user circles:', circleError);
      return [];
    }

    if (!circleData || circleData.length === 0) {
      if (__DEV__) console.log('🟡 [CHALLENGES] User has no circles');
      return [];
    }

    const circleIds = circleData.map(c => c.circle_id);
    if (__DEV__) console.log('🟢 [CHALLENGES] User is in', circleIds.length, 'circles');

    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('scope', 'circle')
      .in('circle_id', circleIds)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error fetching all circle challenges:', error);
      throw error;
    }

    const challengesWithCounts = await Promise.all(
      (data || []).map(async (challenge) => {
        const participantCount = await this.getParticipantCount(challenge.id);
        return this.enrichChallengeWithActivityIds({
          ...challenge,
          participant_count: participantCount,
        });
      })
    );

    if (__DEV__) console.log('🟢 [CHALLENGES] Found total circle challenges:', challengesWithCounts.length);
    return challengesWithCounts;
  }

  async getChallenge(challengeId: string): Promise<ChallengeWithDetails | null> {
    if (__DEV__) console.log('🔍 [CHALLENGES] Fetching challenge:', challengeId);

    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (error) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error fetching challenge:', error);
      return null;
    }

    if (__DEV__) console.log('🟢 [CHALLENGES] Challenge data loaded:', data?.name);

    const participantCount = await this.getParticipantCount(challengeId);
    if (__DEV__) console.log('🟢 [CHALLENGES] Participant count:', participantCount);

    const myParticipation = await this.getMyParticipation(challengeId);
    if (__DEV__) console.log('🟢 [CHALLENGES] My participation:', myParticipation ? 'Found' : 'Not found', myParticipation);

    return this.enrichChallengeWithActivityIds({
      ...data,
      participant_count: participantCount,
      my_participation: myParticipation || undefined,
    });
  }

  async getParticipantCount(challengeId: string): Promise<number> {
    const { count, error } = await supabase
      .from('challenge_participants')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId);

    if (error) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error counting participants:', error);
      return 0;
    }

    return count || 0;
  }

  async getMyParticipation(challengeId: string): Promise<ChallengeParticipant | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('challenge_participants')
      .select('*, challenges!inner(duration_days)')
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error getting participation:', error);
    }

    if (data && data.personal_start_date) {
      const now = new Date();
      const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const start = parseLocalDateString(data.personal_start_date);
      const durationDays = data.challenges?.duration_days || 30;
      data.current_day = Math.min(
        Math.max(Math.floor((todayLocal.getTime() - start.getTime()) / 86400000) + 1, 0),
        durationDays
      );
    }

    return data;
  }

  async joinChallenge(
    challengeId: string,
    selectedActivityIds: string[],
    activityTimes: ActivityTime[],
    personalStartDate?: Date
  ): Promise<{ success: boolean; data?: ChallengeParticipant; error?: string }> {
    if (__DEV__) console.log('🏆 [CHALLENGES] Joining challenge:', challengeId);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const existing = await this.getMyParticipation(challengeId);
    if (existing) {
      return { success: false, error: 'Already joined this challenge' };
    }

    const { data: challenge } = await supabase
      .from('challenges')
      .select('duration_days')
      .eq('id', challengeId)
      .single();

    if (!challenge) {
      return { success: false, error: 'Challenge not found' };
    }

    const startDate = personalStartDate || new Date();

    // Normalize to local midnight BEFORE storing to avoid timezone issues
    // If user joins at 11 PM local time, we want that LOCAL date, not the next UTC date
    const startDateLocal = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

    const personalEndDate = new Date(startDateLocal);
    personalEndDate.setDate(personalEndDate.getDate() + challenge.duration_days);

    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Format as YYYY-MM-DD to avoid timezone conversion issues
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const { data, error } = await supabase
      .from('challenge_participants')
      .insert({
        challenge_id: challengeId,
        user_id: user.id,
        selected_activity_ids: selectedActivityIds,
        activity_times: activityTimes,
        personal_start_date: formatDate(startDateLocal),
        personal_end_date: formatDate(personalEndDate),
        current_day: startDateLocal <= todayLocal ? 1 : 0,
        completed_days: 0,
        current_streak: 0,
        longest_streak: 0,
        completion_percentage: 0,
      })
      .select()
      .single();

    if (error) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error joining challenge:', error);
      return { success: false, error: error.message };
    }

    if (__DEV__) console.log('🟢 [CHALLENGES] Successfully joined challenge with personal start date:', startDate.toISOString());
    return { success: true, data };
  }

  async leaveChallenge(
    participantId: string,
    keepActivities: boolean
  ): Promise<{ success: boolean; error?: string }> {
    if (__DEV__) console.log('🚪 [CHALLENGES] Leaving challenge:', participantId);

    const { error } = await supabase
      .from('challenge_participants')
      .update({
        status: 'left',
        left_at: new Date().toISOString(),
        kept_activities: keepActivities,
      })
      .eq('id', participantId);

    if (error) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error leaving challenge:', error);
      return { success: false, error: error.message };
    }

    if (__DEV__) console.log('🟢 [CHALLENGES] Successfully left challenge');
    return { success: true };
  }

  async recordCompletion(
    participantId: string,
    activityId: string,
    linkedActionId?: string,
    photoUrl?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (__DEV__) console.log('✅ [CHALLENGES] Recording completion:', {
      participantId,
      activityId,
      linkedActionId,
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: participant, error: participantError } = await supabase
      .from('challenge_participants')
      .select('user_id, challenge_id, personal_start_date')
      .eq('id', participantId)
      .single();

    if (participantError || !participant) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error fetching participant:', participantError);
      return { success: false, error: 'Participant not found' };
    }

    const { data: challengeCheck } = await supabase
      .from('challenges')
      .select('duration_days')
      .eq('id', participant.challenge_id)
      .single();

    if (challengeCheck && participant.personal_start_date) {
      const startDateLocal = parseLocalDateString(participant.personal_start_date);

      const now = new Date();
      const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const daysSinceStart = Math.floor((todayLocal.getTime() - startDateLocal.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceStart + 1 > challengeCheck.duration_days) {
        if (__DEV__) console.log('⏰ [CHALLENGES] Challenge expired');
        return { success: false, error: 'Challenge has ended' };
      }
    }

    const today = getLocalDateString();

    const { data: existing, count } = await supabase
      .from('challenge_completions')
      .select('id', { count: 'exact' })
      .eq('participant_id', participantId)
      .eq('challenge_activity_id', activityId)
      .eq('completion_date', today);

    if (count && count > 0) {
      if (__DEV__) console.log(`⚠️ [CHALLENGES] Activity already completed today (found ${count} record(s))`);
      return { success: false, error: 'Already completed today' };
    }

    const completionData: any = {
      user_id: participant.user_id,
      challenge_id: participant.challenge_id,
      participant_id: participantId,
      challenge_activity_id: activityId,
      completion_date: today,
      verification_type: photoUrl ? 'photo' : 'honor',
    };

    if (linkedActionId) {
      completionData.action_id = linkedActionId;
    }

    if (photoUrl) {
      completionData.photo_url = photoUrl;
    }

    const { error } = await supabase
      .from('challenge_completions')
      .insert(completionData);

    if (error) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error recording completion:', error);
      return { success: false, error: error.message };
    }

    await this.updateParticipantProgress(participant.challenge_id, participant.user_id);

    if (__DEV__) console.log('🟢 [CHALLENGES] Completion recorded successfully');
    return { success: true };
  }

  async updateParticipantProgress(challengeId: string, userId: string): Promise<void> {
    if (__DEV__) console.log('📊 [CHALLENGES] Updating participant progress');

    const { data: participant } = await supabase
      .from('challenge_participants')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('user_id', userId)
      .single();

    if (!participant) return;

    const { data: challenge } = await supabase
      .from('challenges')
      .select('duration_days, success_threshold, predetermined_activities')
      .eq('id', challengeId)
      .single();

    if (!challenge) return;

    const totalDays = challenge.duration_days;

    // Calculate current day (days since personal start)
    // Parse date string as local date (not UTC) to avoid timezone issues
    const startDateLocal = parseLocalDateString(participant.personal_start_date);

    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const currentDay = Math.floor(
      (todayLocal.getTime() - startDateLocal.getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

    // Include today in consistency score for real-time updates
    // Exception: if challenge is over (currentDay > totalDays), count all days
    const challengeOver = currentDay > totalDays;
    const completedDaysSoFar = challengeOver
      ? totalDays
      : currentDay;

    // Count total completions
    const { data: allCompletions } = await supabase
      .from('challenge_completions')
      .select('completion_date, challenge_activity_id')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId);

    // Count all completions including today for real-time updates
    const today = getLocalDateString(new Date());
    const pastCompletions = allCompletions || [];

    // Count UNIQUE (activity_id, date) pairs to handle any duplicates
    const uniqueCompletions = new Set(
      pastCompletions.map(c => `${c.challenge_activity_id}-${c.completion_date}`)
    );
    const totalCompletions = uniqueCompletions.size;

    if (__DEV__) {
      console.log(`🎯 [Challenge Leaderboard] User ${userId}:`);
      console.log(`   - Raw completion rows: ${pastCompletions.length}`);
      console.log(`   - After deduplication: ${totalCompletions}`);
    }

    // Calculate expected activities accounting for day-specific ones (including today)
    const predActivities = challenge.predetermined_activities || [];
    const selectedIds = new Set(participant.selected_activity_ids || []);

    let expectedActivities = 0;
    for (let day = 1; day <= currentDay; day++) {
      for (const act of predActivities) {
        if (selectedIds.size > 0 && !selectedIds.has(String(act.id))) continue;
        const startDay = act.start_day || 1;
        const endDay = act.end_day || totalDays;
        if (day >= startDay && day <= endDay) expectedActivities++;
      }
    }

    const completionPercentage = expectedActivities > 0
      ? Math.min(100, Math.round((totalCompletions / expectedActivities) * 100))
      : 0;

    if (__DEV__) {
      console.log(`   - Expected: ${expectedActivities}`);
      console.log(`   - Percentage: ${completionPercentage}%`);
    }

    if (__DEV__) console.log(`📊 Challenge consistency: ${totalCompletions}/${expectedActivities} activities (${currentDay} days including today) = ${completionPercentage}%`);

    const daysTaken = currentDay > totalDays ? totalDays : currentDay;

    let status = participant.status;
    let badgeEarned = participant.badge_earned;

    if (currentDay > totalDays) {
      if (completionPercentage >= challenge.success_threshold) {
        status = 'completed';
        if (completionPercentage >= 80) badgeEarned = 'gold';
        else if (completionPercentage >= 60) badgeEarned = 'silver';
        else badgeEarned = 'bronze';
      } else {
        status = 'failed';
        badgeEarned = 'failed';
      }
    }

    // Unique days with completions
    const completedDaysCount = allCompletions
      ? new Set(allCompletions.map(d => d.completion_date)).size
      : 0;

    // Calculate current streak (consecutive days with completions ending today)
    const uniqueDates = allCompletions
      ? [...new Set(allCompletions.map(d => d.completion_date))].sort().reverse()
      : [];

    let currentStreak = 0;
    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      const expectedStr = getLocalDateString(expected);
      if (uniqueDates[i] === expectedStr) {
        currentStreak++;
      } else {
        break;
      }
    }

    await supabase
      .from('challenge_participants')
      .update({
        completed_days: completedDaysCount,
        current_day: currentDay,
        completion_percentage: completionPercentage,
        days_taken: daysTaken,
        current_streak: currentStreak,
        longest_streak: Math.max(currentStreak, participant.longest_streak || 0),
        status,
        badge_earned: badgeEarned,
        completed_at: status === 'completed' ? new Date().toISOString() : participant.completed_at,
        last_completion_at: new Date().toISOString(),
      })
      .eq('id', participant.id);

    if (status === 'completed' && badgeEarned && badgeEarned !== 'failed') {
      await this.awardBadge(userId, challengeId, badgeEarned as any);
    }

    await this.recalculateLeaderboardRanks(challengeId);

    if (__DEV__) console.log('🟢 [CHALLENGES] Progress updated:', { completionPercentage, status, badgeEarned });
  }

  async awardBadge(
    userId: string,
    challengeId: string,
    badgeType: 'gold' | 'silver' | 'bronze'
  ): Promise<void> {
    if (__DEV__) console.log('🏆 [CHALLENGES] Awarding badge:', badgeType);

    const { data: challenge } = await supabase
      .from('challenges')
      .select('badge_emoji, badge_name')
      .eq('id', challengeId)
      .single();

    if (!challenge) return;

    const { data: participant } = await supabase
      .from('challenge_participants')
      .select('completion_percentage, days_taken')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .single();

    if (!participant) return;

    const { error } = await supabase.rpc('insert_badge', {
      p_user_id: userId,
      p_challenge_id: challengeId,
      p_badge_type: badgeType,
      p_badge_emoji: challenge.badge_emoji || '🏆',
      p_badge_name: challenge.badge_name || 'Champion',
      p_completion_percentage: participant.completion_percentage,
      p_days_taken: participant.days_taken,
    });

    if (error && !error.message.includes('duplicate')) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error awarding badge:', error);
    }
  }

  async getLeaderboard(
    challengeId: string,
    options?: {
      filter?: 'all' | 'friends' | 'circle';
      sort?: 'rank' | 'fastest' | 'perfect';
      limit?: number;
    }
  ): Promise<LeaderboardEntry[]> {
    if (__DEV__) console.log('🏆 [CHALLENGES] Fetching leaderboard for:', challengeId, options);

    const { filter = 'all', sort = 'rank', limit = 100 } = options || {};

    // Fetch challenge duration_days for capping current_day
    const { data: challengeData } = await supabase
      .from('challenges')
      .select('duration_days')
      .eq('id', challengeId)
      .single();
    const durationDays = challengeData?.duration_days || 30;

    let query = supabase
      .from('challenge_participants')
      .select(`
        user_id,
        completion_percentage,
        completed_days,
        current_day,
        personal_start_date,
        current_streak,
        days_taken,
        "rank",
        percentile,
        profiles!user_id (
          name,
          avatar_url
        )
      `)
      .eq('challenge_id', challengeId)
      .neq('status', 'left');

    if (filter === 'friends') {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: friendships } = await supabase
          .from('friendships')
          .select('friend_id')
          .eq('user_id', user.id)
          .eq('status', 'accepted');

        const friendIds = friendships?.map(f => f.friend_id) || [];
        if (friendIds.length > 0) {
          query = query.in('user_id', [...friendIds, user.id]);
        }
      }
    } else if (filter === 'circle') {
      const { data: challenge } = await supabase
        .from('challenges')
        .select('circle_id')
        .eq('id', challengeId)
        .single();

      if (challenge?.circle_id) {
        const { data: members } = await supabase
          .from('circle_members')
          .select('user_id')
          .eq('circle_id', challenge.circle_id);

        const memberIds = members?.map(m => m.user_id) || [];
        if (memberIds.length > 0) {
          query = query.in('user_id', memberIds);
        }
      }
    }

    switch (sort) {
      case 'fastest':
        query = query.order('days_taken', { ascending: true }).order('completion_percentage', { ascending: false });
        break;
      case 'perfect':
        query = query.order('completion_percentage', { ascending: false }).order('days_taken', { ascending: true });
        break;
      case 'rank':
      default:
        query = query.order('completion_percentage', { ascending: false }).order('days_taken', { ascending: true });
        break;
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error fetching leaderboard:', error);
      throw error;
    }

    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const leaderboard: LeaderboardEntry[] = (data || []).map((entry: any, index: number) => {
      // Calculate current_day from dates (stored value goes stale if user skips a day)
      let calculatedDay = entry.current_day || 0;
      if (entry.personal_start_date) {
        const start = parseLocalDateString(entry.personal_start_date);
        calculatedDay = Math.min(
          Math.max(Math.floor((todayLocal.getTime() - start.getTime()) / 86400000) + 1, 0),
          durationDays
        );
      }

      return {
        user_id: entry.user_id,
        username: entry.profiles?.name || 'Unknown',
        name: entry.profiles?.name,
        avatar_url: entry.profiles?.avatar_url,
        completion_percentage: entry.completion_percentage || 0,
        completed_days: entry.completed_days || 0,
        current_day: calculatedDay,
        current_streak: entry.current_streak || 0,
        days_taken: entry.days_taken,
        rank: index + 1,
        percentile: entry.percentile,
      };
    });

    return leaderboard;
  }

  async recalculateLeaderboardRanks(challengeId: string): Promise<void> {
    if (__DEV__) console.log('📊 [CHALLENGES] Recalculating leaderboard ranks for:', challengeId);

    const { data: participants, error } = await supabase
      .from('challenge_participants')
      .select('id, user_id, completed_days, days_taken, completion_percentage')
      .eq('challenge_id', challengeId)
      .neq('status', 'left');

    if (error || !participants || participants.length === 0) {
      if (__DEV__) console.log('❌ [CHALLENGES] No participants to rank');
      return;
    }

    const { data: challenge } = await supabase
      .from('challenges')
      .select('duration_days')
      .eq('id', challengeId)
      .single();

    if (!challenge) return;

    const ranked = participants
      .map(p => ({
        id: p.id,
        user_id: p.user_id,
        completion_percentage: p.completion_percentage || 0,
        days_taken: p.days_taken || 0,
      }))
      .sort((a, b) => b.completion_percentage - a.completion_percentage || (a.days_taken || 0) - (b.days_taken || 0));

    const totalParticipants = ranked.length;

    for (let i = 0; i < ranked.length; i++) {
      const rank = i + 1;
      const percentile = ((totalParticipants - rank) / totalParticipants) * 100;

      await supabase
        .from('challenge_participants')
        .update({
          rank,
          percentile: Math.round(percentile * 10) / 10,
        })
        .eq('id', ranked[i].id);
    }

    if (__DEV__) console.log('🟢 [CHALLENGES] Ranks updated for', ranked.length, 'participants');
  }

  async getMyActiveChallenges(): Promise<ChallengeWithDetails[]> {
    if (__DEV__) console.log('📋 [CHALLENGES] Fetching my active challenges');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: participations, error } = await supabase
      .from('challenge_participants')
      .select(`
        *,
        challenges!inner (*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (error) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error fetching active challenges:', error);
      return [];
    }

    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const challenges: ChallengeWithDetails[] = await Promise.all(
      (participations || []).map(async (p: any) => {
        const participantCount = await this.getParticipantCount(p.challenges.id);

        // Calculate current_day from dates (stored value goes stale if user skips a day)
        let calculatedDay = p.current_day || 0;
        if (p.personal_start_date) {
          const start = parseLocalDateString(p.personal_start_date);
          calculatedDay = Math.min(
            Math.max(Math.floor((todayLocal.getTime() - start.getTime()) / 86400000) + 1, 0),
            p.challenges.duration_days || 30
          );
        }

        return {
          ...p.challenges,
          participant_count: participantCount,
          my_participation: { ...p, current_day: calculatedDay },
        };
      })
    );

    return challenges;
  }

  async getActiveChallengesForUser(targetUserId: string): Promise<any[]> {
    const { data: participations, error } = await supabase
      .from('challenge_participants')
      .select(`
        current_day,
        personal_start_date,
        completion_percentage,
        challenges!inner (
          id,
          name,
          duration_days
        )
      `)
      .eq('user_id', targetUserId)
      .eq('status', 'active');

    if (error || !participations) return [];

    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return participations.map((p: any) => {
      let calculatedDay = p.current_day || 0;
      if (p.personal_start_date) {
        const start = parseLocalDateString(p.personal_start_date);
        calculatedDay = Math.min(
          Math.max(Math.floor((todayLocal.getTime() - start.getTime()) / 86400000) + 1, 0),
          p.challenges.duration_days || 30
        );
      }
      return {
        id: p.challenges.id,
        title: p.challenges.name,
        subtitle: `Day ${calculatedDay}/${p.challenges.duration_days}`,
        consistency: p.completion_percentage || 0,
      };
    });
  }

  async getMyCompletedChallenges(): Promise<ChallengeWithDetails[]> {
    if (__DEV__) console.log('✅ [CHALLENGES] Fetching my completed challenges');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: participations, error } = await supabase
      .from('challenge_participants')
      .select(`
        *,
        challenges!inner (*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed');

    if (error) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error fetching completed challenges:', error);
      return [];
    }

    const challenges: ChallengeWithDetails[] = await Promise.all(
      (participations || []).map(async (p: any) => {
        const participantCount = await this.getParticipantCount(p.challenges.id);
        return {
          ...p.challenges,
          participant_count: participantCount,
          my_participation: p,
        };
      })
    );

    return challenges;
  }

  async getMyBadges(): Promise<UserBadge[]> {
    if (__DEV__) console.log('🏆 [CHALLENGES] Fetching my badges');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false });

    if (error) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error fetching badges:', error);
      return [];
    }

    return data || [];
  }

  async getForumThreads(challengeId: string): Promise<ChallengeForumThread[]> {
    if (__DEV__) console.log('💬 [CHALLENGES] Fetching forum threads for:', challengeId);

    const { data, error } = await supabase
      .from('challenge_forum_threads')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error fetching forum threads:', error);
      throw error;
    }

    return data || [];
  }

  async createForumThread(
    challengeId: string,
    title: string,
    content: string,
    category?: string
  ): Promise<{ success: boolean; data?: ChallengeForumThread; error?: string }> {
    if (__DEV__) console.log('💬 [CHALLENGES] Creating forum thread');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('challenge_forum_threads')
      .insert({
        challenge_id: challengeId,
        author_id: user.id,
        title,
        content,
        category,
      })
      .select()
      .single();

    if (error) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error creating forum thread:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }

  async getForumReplies(threadId: string): Promise<ChallengeForumReply[]> {
    if (__DEV__) console.log('💬 [CHALLENGES] Fetching forum replies for:', threadId);

    const { data, error } = await supabase
      .from('challenge_forum_replies')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error fetching forum replies:', error);
      throw error;
    }

    return data || [];
  }

  async createForumReply(
    threadId: string,
    content: string,
    parentReplyId?: string
  ): Promise<{ success: boolean; data?: ChallengeForumReply; error?: string }> {
    if (__DEV__) console.log('💬 [CHALLENGES] Creating forum reply');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('challenge_forum_replies')
      .insert({
        thread_id: threadId,
        author_id: user.id,
        content,
        parent_reply_id: parentReplyId,
      })
      .select()
      .single();

    if (error) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error creating forum reply:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }

  async getUserChallengeActivities(): Promise<any[]> {
    if (__DEV__) console.log('🏆 [CHALLENGES] Fetching user challenge activities for Daily page');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (__DEV__) console.log('❌ [CHALLENGES] No user found');
      return [];
    }

    const { data: participations, error } = await supabase
      .from('challenge_participants')
      .select(`
        id,
        challenge_id,
        selected_activity_ids,
        linked_action_ids,
        activity_times,
        personal_start_date,
        challenges!inner (
          id,
          name,
          status,
          predetermined_activities,
          duration_days
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .eq('challenges.status', 'active');

    if (error) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error fetching participations:', error);
      return [];
    }

    if (!participations || participations.length === 0) {
      if (__DEV__) console.log('📊 [CHALLENGES] No active challenge participations');
      return [];
    }

    const activities = [];
    for (const participation of participations) {
      const challenge = participation.challenges;
      // Ensure activities have IDs using the same logic as when fetching challenges
      const predeterminedActivities = this.ensureActivityIds(challenge.predetermined_activities || []);
      const selectedIds = participation.selected_activity_ids || [];
      const linkedIds = participation.linked_action_ids || [];

      // Calculate current day of challenge for day-specific filtering
      // Parse date string as local date (not UTC) to avoid timezone issues
      const startDateLocal = parseLocalDateString(participation.personal_start_date);

      const now = new Date();
      const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const daysSinceStart = Math.floor((todayLocal.getTime() - startDateLocal.getTime()) / (1000 * 60 * 60 * 24));
      const currentDay = daysSinceStart + 1; // 1-based

      if (__DEV__) {
        console.log('📅 [CHALLENGES] Challenge', challenge.name);
        console.log('  Start date:', participation.personal_start_date);
        console.log('  Start date (local midnight):', startDateLocal.toISOString());
        console.log('  Today (local midnight):', todayLocal.toISOString());
        console.log('  Days since start:', daysSinceStart);
        console.log('  Current Day:', currentDay);
      }

      // Pre-start guard: if challenge hasn't started yet, skip its activities
      if (currentDay < 1) {
        if (__DEV__) console.log('⏳ [CHALLENGES] Challenge', challenge.name, 'starts in', Math.abs(currentDay) + 1, 'days — hiding activities');
        continue;
      }

      // Auto-expiry: if past duration, finalize the challenge and skip its activities
      if (currentDay > challenge.duration_days) {
        if (__DEV__) console.log('⏰ [CHALLENGES] Challenge', challenge.name, 'expired (day', currentDay, '>', challenge.duration_days, ') — finalizing');
        await this.updateParticipantProgress(challenge.id, user.id);
        continue;
      }

      // Recalculate progress on load so missed days are reflected
      await this.updateParticipantProgress(challenge.id, user.id);

      // If selectedIds contains undefined/null, it means the user joined before IDs were added
      // In that case, include ALL activities from the challenge
      const hasValidSelectedIds = selectedIds.length > 0 && selectedIds.every((id: any) => id && id !== 'undefined');

      if (hasValidSelectedIds) {
        // Normal case: user has valid selected activity IDs
        for (const activityId of selectedIds) {
          if (linkedIds.includes(activityId)) continue;

          const activity = predeterminedActivities.find((a: any) => String(a.id) === String(activityId));
          if (activity) {
            // Check if activity should show today (day-specific filtering)
            const startDay = activity.start_day || 1;
            const endDay = activity.end_day || challenge.duration_days;

            if (currentDay >= startDay && currentDay <= endDay) {
              const activityTime = (participation.activity_times || []).find(
                (t: any) => String(t.activity_id) === String(activityId) && !t.is_link
              );

              activities.push({
                id: activityId,
                title: activity.title,
                emoji: activity.emoji,
                challengeId: challenge.id,
                challengeName: challenge.name,
                participantId: participation.id,
                scheduledTime: activityTime?.scheduled_time,
                is_abstinence: activity.is_abstinence || false,
              });
            } else {
              if (__DEV__) console.log('⏭️  [CHALLENGES] Skipping activity', activity.title, '(days', startDay, '-', endDay, ', current:', currentDay, ')');
            }
          }
        }
      } else {
        // Fallback: include all activities from the challenge (for legacy participations)
        if (__DEV__) console.log('🟡 [CHALLENGES] Using fallback: including all activities for participation', participation.id);
        for (const activity of predeterminedActivities) {
          if (linkedIds.includes(activity.id)) continue;

          // Check if activity should show today (day-specific filtering)
          const startDay = activity.start_day || 1;
          const endDay = activity.end_day || challenge.duration_days;

          if (currentDay >= startDay && currentDay <= endDay) {
            const activityTime = (participation.activity_times || []).find(
              (t: any) => String(t.activity_id) === String(activity.id) && !t.is_link
            );

            activities.push({
              id: activity.id,
              title: activity.title,
              emoji: activity.emoji,
              challengeId: challenge.id,
              challengeName: challenge.name,
              participantId: participation.id,
              scheduledTime: activityTime?.scheduled_time,
              is_abstinence: activity.is_abstinence || false,
            });
          } else {
            if (__DEV__) console.log('⏭️  [CHALLENGES] Skipping activity', activity.title, '(days', startDay, '-', endDay, ', current:', currentDay, ')');
          }
        }
      }
    }

    if (__DEV__) console.log('🟢 [CHALLENGES] Found', activities.length, 'unlinked activities');
    return activities;
  }

  async getLinkedChallengeActivities(): Promise<any[]> {
    if (__DEV__) console.log('🔗 [CHALLENGES] Fetching linked challenge activities');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: participations, error } = await supabase
      .from('challenge_participants')
      .select(`
        id,
        challenge_id,
        linked_action_ids,
        activity_times,
        challenges!inner (
          id,
          name,
          predetermined_activities
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (error || !participations) return [];

    const linkedActivities = [];
    for (const participation of participations) {
      const activityTimes = participation.activity_times || [];
      const links = activityTimes.filter((t: any) => t.is_link);

      for (const link of links) {
        linkedActivities.push({
          linkedActionId: link.linked_to,
          challengeId: participation.challenge_id,
          challengeActivityId: link.activity_id,
          participantId: participation.id,
          challengeName: participation.challenges.name,
        });
      }
    }

    return linkedActivities;
  }

  async getTodayUserCompletions(): Promise<any[]> {
    if (__DEV__) console.log('✅ [CHALLENGES] Fetching today\'s completions');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Use LOCAL date string to match user's timezone
    const today = getLocalDateString();

    const { data, error } = await supabase
      .from('challenge_completions')
      .select('*')
      .eq('user_id', user.id)
      .eq('completion_date', today);

    if (error) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error fetching completions:', error);
      return [];
    }

    return data || [];
  }

  async getUserParticipations(): Promise<any[]> {
    if (__DEV__) console.log('📋 [CHALLENGES] Fetching user participations');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('challenge_participants')
      .select(`
        id,
        challenge_id,
        activity_times,
        challenges!inner (
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (error) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error fetching participations:', error);
      return [];
    }

    return data || [];
  }

  async recordChallengeActivity(
    participantId: string,
    activityId: string,
    linkedActionId?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (__DEV__) console.log('🏆 [CHALLENGES] Recording challenge activity completion:', {
      participantId,
      activityId,
      linkedActionId,
    });

    const { data: participant, error: participantError } = await supabase
      .from('challenge_participants')
      .select('user_id, challenge_id, personal_start_date')
      .eq('id', participantId)
      .single();

    if (participantError || !participant) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error fetching participant:', participantError);
      return { success: false, error: 'Participant not found' };
    }

    const { data: challengeCheck } = await supabase
      .from('challenges')
      .select('duration_days')
      .eq('id', participant.challenge_id)
      .single();

    if (challengeCheck && participant.personal_start_date) {
      const startDateLocal = parseLocalDateString(participant.personal_start_date);

      const now = new Date();
      const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const daysSinceStart = Math.floor((todayLocal.getTime() - startDateLocal.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceStart + 1 > challengeCheck.duration_days) {
        if (__DEV__) console.log('⏰ [CHALLENGES] Challenge expired');
        return { success: false, error: 'Challenge has ended' };
      }
    }

    const today = getLocalDateString();

    const { data: existing, count } = await supabase
      .from('challenge_completions')
      .select('id', { count: 'exact' })
      .eq('participant_id', participantId)
      .eq('challenge_activity_id', activityId)
      .eq('completion_date', today);

    if (count && count > 0) {
      if (__DEV__) console.log(`⚠️ [CHALLENGES] Activity already completed today (found ${count} record(s))`);
      return { success: false, error: 'Already completed today' };
    }

    const completionData: any = {
      user_id: participant.user_id,
      challenge_id: participant.challenge_id,
      participant_id: participantId,
      challenge_activity_id: activityId,
      completion_date: today,
      verification_type: 'honor',
    };

    if (linkedActionId) {
      completionData.action_id = linkedActionId;
    }

    const { error: insertError } = await supabase
      .from('challenge_completions')
      .insert(completionData);

    if (insertError) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error recording completion:', insertError);
      return { success: false, error: insertError.message };
    }

    await this.updateParticipantProgress(participant.challenge_id, participant.user_id);

    if (__DEV__) console.log('🟢 [CHALLENGES] Activity completed successfully');
    return { success: true };
  }

  async updateParticipantLinks(
    participantId: string,
    linkedActionIds: Record<string, string>
  ): Promise<{ success: boolean; error?: string }> {
    if (__DEV__) console.log('🔗 [CHALLENGES] Updating participant links:', participantId);

    const linkedIdsArray = Object.values(linkedActionIds);

    const { error } = await supabase
      .from('challenge_participants')
      .update({
        linked_action_ids: linkedIdsArray,
      })
      .eq('id', participantId);

    if (error) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error updating links:', error);
      return { success: false, error: error.message };
    }

    if (__DEV__) console.log('🟢 [CHALLENGES] Links updated successfully');
    return { success: true };
  }

  async updateParticipantActivityTimes(
    participantId: string,
    activityTimes: Record<string, string>
  ): Promise<{ success: boolean; error?: string }> {
    if (__DEV__) console.log('⏰ [CHALLENGES] Updating participant activity times:', participantId);

    const activityTimesArray: ActivityTime[] = Object.entries(activityTimes).map(([activityId, time]) => ({
      activity_id: activityId,
      scheduled_time: time,
    }));

    const { error } = await supabase
      .from('challenge_participants')
      .update({
        activity_times: activityTimesArray,
      })
      .eq('id', participantId);

    if (error) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error updating activity times:', error);
      return { success: false, error: error.message };
    }

    if (__DEV__) console.log('🟢 [CHALLENGES] Activity times updated successfully');
    return { success: true };
  }

  async updateChallengeActivityTime(
    userId: string,
    challengeId: string,
    activityId: string,
    newTime: string
  ): Promise<void> {
    if (__DEV__) console.log('⏰ [CHALLENGES] Updating single activity time:', { userId, challengeId, activityId, newTime });

    const { data: participant, error: fetchError } = await supabase
      .from('challenge_participants')
      .select('id, activity_times')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .eq('status', 'active')
      .single();

    if (fetchError || !participant) {
      const errorMsg = fetchError?.message || 'Participation not found';
      if (__DEV__) console.error('🔴 [CHALLENGES] Error fetching participant:', errorMsg);
      throw new Error(errorMsg);
    }

    const activityTimes = participant.activity_times || [];
    const existingIndex = activityTimes.findIndex(
      (t: any) => String(t.activity_id) === String(activityId) && !t.is_link
    );

    if (existingIndex >= 0) {
      activityTimes[existingIndex].scheduled_time = newTime;
      if (__DEV__) console.log('⏰ [CHALLENGES] Updated existing time at index:', existingIndex);
    } else {
      activityTimes.push({
        activity_id: activityId,
        scheduled_time: newTime,
        is_link: false
      });
      if (__DEV__) console.log('⏰ [CHALLENGES] Added new time entry');
    }

    const { error: updateError } = await supabase
      .from('challenge_participants')
      .update({ activity_times: activityTimes })
      .eq('id', participant.id);

    if (updateError) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error updating activity_times:', updateError);
      throw updateError;
    }

    if (__DEV__) console.log('✅ [CHALLENGES] Activity time updated successfully in JSONB');
  }

  async waitForParticipant(
    challengeId: string,
    maxAttempts: number = 10,
    delayMs: number = 200
  ): Promise<ChallengeParticipant | null> {
    if (__DEV__) console.log('⏳ [CHALLENGES] Waiting for participant record to be available...');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const participant = await this.getMyParticipation(challengeId);

      if (participant) {
        if (__DEV__) console.log(`🟢 [CHALLENGES] Participant found on attempt ${attempt}`);
        return participant;
      }

      if (attempt < maxAttempts) {
        if (__DEV__) console.log(`⏳ [CHALLENGES] Attempt ${attempt}/${maxAttempts}: Participant not found, waiting ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    if (__DEV__) console.error('🔴 [CHALLENGES] Participant not found after', maxAttempts, 'attempts');
    return null;
  }

  async verifyDataCommitted(
    participantId: string,
    expectedLinks: string[],
    expectedTimesCount: number
  ): Promise<boolean> {
    if (__DEV__) console.log('🔍 [CHALLENGES] Verifying data committed for participant:', participantId);

    const { data, error } = await supabase
      .from('challenge_participants')
      .select('linked_action_ids, activity_times')
      .eq('id', participantId)
      .single();

    if (error || !data) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Error verifying data:', error);
      return false;
    }

    const linksMatch = expectedLinks.length === 0 ||
                       (data.linked_action_ids && data.linked_action_ids.length >= expectedLinks.length);
    const timesMatch = data.activity_times && data.activity_times.length >= expectedTimesCount;

    if (__DEV__) console.log('🔍 [CHALLENGES] Verification result:', {
      linksMatch,
      timesMatch,
      actualLinks: data.linked_action_ids?.length || 0,
      expectedLinks: expectedLinks.length,
      actualTimes: data.activity_times?.length || 0,
      expectedTimes: expectedTimesCount,
    });

    return linksMatch && timesMatch;
  }

  async createChallenge(params: {
    circleId: string;
    name: string;
    description: string;
    emoji: string;
    durationDays: number;
    successThreshold: number;
    activities: PredeterminedActivity[];
  }): Promise<{ success: boolean; challengeId?: string; error?: string }> {
    try {
      if (__DEV__) console.log('🎯 [CHALLENGES] Creating new circle challenge:', params.name);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: challenge, error } = await supabase
        .from('challenges')
        .insert({
          circle_id: params.circleId,
          name: params.name,
          description: params.description,
          emoji: params.emoji,
          type: 'streak',
          scope: 'circle',
          duration_days: params.durationDays,
          success_threshold: params.successThreshold,
          predetermined_activities: params.activities,
          status: 'active',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        if (__DEV__) console.error('🔴 [CHALLENGES] Error creating challenge:', error);
        return { success: false, error: error.message };
      }

      if (__DEV__) console.log('✅ [CHALLENGES] Challenge created successfully:', challenge.id);
      return { success: true, challengeId: challenge.id };
    } catch (error: any) {
      if (__DEV__) console.error('🔴 [CHALLENGES] Exception creating challenge:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }
}

export const supabaseChallengeService = new SupabaseChallengeService();
