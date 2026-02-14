import { supabase } from './supabase.service';
import type {
  NotificationType,
  NotificationPreferences,
  NotificationSchedule,
  NotificationTone,
  CreateNotificationParams,
  SocialNotificationParams,
  CompetitiveNotificationParams,
  ChallengeNotificationParams
} from '../types/notifications.types';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: any;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  action_url?: string;
  category?: 'digest' | 'social' | 'challenge' | 'competitive' | 'system';
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

const NOTIFICATION_RULES = {
  max_social_per_day: 5,
  max_challenge_updates_per_day: 3,
  batch_window_minutes: 10,
  batch_likes: true,
};

class SupabaseNotificationService {

  async getNotifications(limit = 50): Promise<Notification[]> {
    try {
      if (__DEV__) console.log('🔔 [NOTIFICATIONS] Fetching notifications, limit:', limit);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (__DEV__) console.log('❌ [NOTIFICATIONS] No user found');
        return [];
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        if (__DEV__) console.error('🔴 [NOTIFICATIONS] Error fetching:', error);
        return [];
      }

      if (__DEV__) console.log('🟢 [NOTIFICATIONS] Fetched', data?.length || 0, 'notifications');
      return data || [];
    } catch (error) {
      if (__DEV__) console.error('🔴 [NOTIFICATIONS] Exception:', error);
      return [];
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        if (__DEV__) console.error('🔴 [NOTIFICATIONS] Error getting unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      if (__DEV__) console.error('🔴 [NOTIFICATIONS] Exception getting count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<{ success: boolean }> {
    try {
      if (__DEV__) console.log('🔔 [NOTIFICATIONS] Marking as read:', notificationId);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (__DEV__) console.log('❌ [NOTIFICATIONS] No user found');
        return { success: false };
      }

      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        if (__DEV__) console.error('🔴 [NOTIFICATIONS] Error marking as read:', error);
        return { success: false };
      }

      if (__DEV__) console.log('✅ [NOTIFICATIONS] Marked as read');
      return { success: true };
    } catch (error) {
      if (__DEV__) console.error('🔴 [NOTIFICATIONS] Exception:', error);
      return { success: false };
    }
  }

  async markAllAsRead(): Promise<{ success: boolean }> {
    try {
      if (__DEV__) console.log('🔔 [NOTIFICATIONS] Marking all as read');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (__DEV__) console.log('❌ [NOTIFICATIONS] No user found');
        return { success: false };
      }

      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        if (__DEV__) console.error('🔴 [NOTIFICATIONS] Error marking all as read:', error);
        return { success: false };
      }

      if (__DEV__) console.log('✅ [NOTIFICATIONS] All marked as read');
      return { success: true };
    } catch (error) {
      if (__DEV__) console.error('🔴 [NOTIFICATIONS] Exception:', error);
      return { success: false };
    }
  }

  async subscribeToNotifications(callback: (payload: any) => void) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      if (__DEV__) console.log('🔔 [NOTIFICATIONS] Subscribing to realtime notifications');

      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (__DEV__) console.log('🔔 [NOTIFICATIONS] New notification received:', payload);
            callback(payload);
          }
        )
        .subscribe();

      return channel;
    } catch (error) {
      if (__DEV__) console.error('🔴 [NOTIFICATIONS] Error subscribing:', error);
      return null;
    }
  }

  async getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          const defaultPrefs = await this.createDefaultPreferences(userId);
          return defaultPrefs;
        }
        if (__DEV__) console.error('🔴 [NOTIFICATIONS] Error fetching preferences:', error);
        return null;
      }

      return data;
    } catch (error) {
      if (__DEV__) console.error('🔴 [NOTIFICATIONS] Exception getting preferences:', error);
      return null;
    }
  }

  async createDefaultPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: userId,
          push_enabled: true,
          email_enabled: false,
          social_notifications: true,
          challenge_notifications: true,
          reminder_notifications: true,
          competitive_notifications: true,
          morning_digest_enabled: true,
          morning_digest_time: '07:00:00',
          notification_tone: 'aggressive',
          quiet_hours_start: '22:00:00',
          quiet_hours_end: '07:00:00',
          timezone: 'UTC',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      if (__DEV__) console.error('🔴 [NOTIFICATIONS] Error creating default preferences:', error);
      return null;
    }
  }

  async updatePreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      if (__DEV__) console.error('🔴 [NOTIFICATIONS] Error updating preferences:', error);
      return { success: false };
    }
  }

  async canSendNotification(
    userId: string,
    type: NotificationType
  ): Promise<boolean> {
    try {
      const prefs = await this.getUserPreferences(userId);
      if (!prefs) return false;

      if (type.includes('social') && !prefs.social_notifications) return false;
      if (type.includes('challenge') && !prefs.challenge_notifications) return false;
      if (type.includes('leaderboard') && !prefs.competitive_notifications) return false;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', todayStart.toISOString());

      if (type.includes('social') && (count || 0) >= NOTIFICATION_RULES.max_social_per_day) {
        return false;
      }

      if (type.includes('challenge') && (count || 0) >= NOTIFICATION_RULES.max_challenge_updates_per_day) {
        return false;
      }

      return true;
    } catch (error) {
      if (__DEV__) console.error('🔴 [NOTIFICATIONS] Error checking if can send:', error);
      return false;
    }
  }

  async createNotification(params: CreateNotificationParams): Promise<{ success: boolean; notification?: Notification }> {
    try {
      if (__DEV__) console.log('🔔 [NOTIFICATIONS] Creating notification:', params);

      const canSend = await this.canSendNotification(params.userId, params.type);
      if (!canSend) {
        if (__DEV__) console.log('⚠️ [NOTIFICATIONS] Cannot send - preferences or limits');
        return { success: false };
      }

      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: params.userId,
          type: params.type,
          title: params.title,
          body: params.body,
          data: params.data || {},
          action_url: params.actionUrl,
          category: params.category,
          priority: params.priority || 'medium',
          is_read: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        if (__DEV__) console.error('🔴 [NOTIFICATIONS] Error creating:', error);
        return { success: false };
      }

      if (__DEV__) console.log('✅ [NOTIFICATIONS] Created successfully');
      return { success: true, notification };
    } catch (error) {
      if (__DEV__) console.error('🔴 [NOTIFICATIONS] Exception:', error);
      return { success: false };
    }
  }

  async createSocialNotification(params: SocialNotificationParams): Promise<{ success: boolean }> {
    const prefs = await this.getUserPreferences(params.userId);
    if (!prefs?.social_notifications) {
      return { success: false };
    }

    let title = '';
    let body = '';
    let actionUrl = '';
    let type: NotificationType = 'post_like';

    switch (params.type) {
      case 'like':
        type = 'post_like';
        title = `👍 ${params.actorName} liked your post`;
        body = params.postTitle || 'Check it out!';
        actionUrl = `/posts/${params.postId}`;
        break;

      case 'comment':
        type = 'post_comment';
        title = `💬 ${params.actorName} commented on your post`;
        body = params.commentText || 'See what they said';
        actionUrl = `/posts/${params.postId}`;
        break;

      case 'mention':
        type = 'post_mention';
        title = `@mentioned you in a post`;
        body = `${params.actorName} mentioned you`;
        actionUrl = `/posts/${params.postId}`;
        break;
    }

    return this.createNotification({
      userId: params.userId,
      type,
      title,
      body,
      data: {
        postId: params.postId,
        actorId: params.actorUserId,
        actorName: params.actorName,
      },
      actionUrl,
      category: 'social',
      priority: params.type === 'mention' ? 'high' : 'medium',
    });
  }

  async createCompetitiveNotification(params: CompetitiveNotificationParams): Promise<{ success: boolean }> {
    const prefs = await this.getUserPreferences(params.userId);
    if (!prefs?.competitive_notifications) {
      return { success: false };
    }

    let title = '';
    let body = '';
    let type: NotificationType = 'leaderboard_passed';
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';

    switch (params.type) {
      case 'leaderboard_passed':
        type = 'leaderboard_passed';
        title = '🔥 Someone just passed you!';
        body = `${params.userName} completed their task and moved ahead of you`;
        priority = 'high';
        break;

      case 'leaderboard_position_drop':
        type = 'leaderboard_position_drop';
        title = '📉 You dropped in the rankings';
        body = `${params.userName} is now #${params.newPosition} and you're #${params.newPosition + 1}`;
        priority = 'medium';
        break;

      case 'last_one_standing':
        type = 'circle_last_one';
        title = '⚠️ You\'re the only one left!';
        body = `Everyone else in ${params.circleName} completed their tasks today`;
        priority = 'critical';
        break;

      case 'streak_dying':
        type = 'streak_dying';
        title = `🔥 Your ${params.streakDays}-day streak ends in ${params.hoursLeft} hours!`;
        body = 'Complete 1 action now to keep it alive';
        priority = 'critical';
        break;
    }

    return this.createNotification({
      userId: params.userId,
      type,
      title,
      body,
      data: params.data || {},
      category: 'competitive',
      priority,
    });
  }

  async createChallengeNotification(params: ChallengeNotificationParams): Promise<{ success: boolean }> {
    const prefs = await this.getUserPreferences(params.userId);
    if (!prefs?.challenge_notifications) {
      return { success: false };
    }

    let title = '';
    let body = '';
    let type: NotificationType = 'challenge_started';
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';

    switch (params.type) {
      case 'starting_soon':
        type = 'challenge_starting_soon';
        title = `🧊 ${params.challengeName} starts in 1 hour!`;
        body = `${params.participantCount} people joined - get ready!`;
        priority = 'high';
        break;

      case 'started':
        type = 'challenge_started';
        title = '⏰ Challenge starting NOW';
        body = `${params.challengeName} - be the first to complete!`;
        priority = 'high';
        break;

      case 'milestone':
        type = 'challenge_milestone';
        title = `🔥 ${params.milestoneType === '50%' ? 'Halfway done!' : 'Almost there!'}`;
        body = `You've completed ${params.completedDays}/${params.totalDays} days`;
        priority = 'medium';
        break;

      case 'final_day':
        type = 'challenge_final_day';
        title = '💪 Final day!';
        body = `Finish ${params.challengeName} strong to earn the badge`;
        priority = 'high';
        break;

      case 'position_change':
        type = 'challenge_position_change';
        title = params.position === 1 ? '🏆 You\'re #1!' : `You're #${params.position}`;
        body = params.position === 1 ? 'Defend your position!' : `${params.ahead} ahead of you`;
        priority = params.position === 1 ? 'high' : 'medium';
        break;
    }

    return this.createNotification({
      userId: params.userId,
      type,
      title,
      body,
      data: { challengeId: params.challengeId },
      actionUrl: `/challenges/${params.challengeId}`,
      category: 'challenge',
      priority,
    });
  }

  async scheduleNotification(schedule: Omit<NotificationSchedule, 'id' | 'created_at'>): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('notification_schedules')
        .insert({
          user_id: schedule.user_id,
          notification_type: schedule.notification_type,
          scheduled_for: schedule.scheduled_for,
          data: schedule.data,
          status: 'pending',
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      if (__DEV__) console.error('🔴 [NOTIFICATIONS] Error scheduling notification:', error);
      return { success: false };
    }
  }

  async scheduleMorningDigest(userId: string, digestTime: string): Promise<{ success: boolean }> {
    try {
      const prefs = await this.getUserPreferences(userId);
      if (!prefs?.morning_digest_enabled) {
        return { success: false };
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const [hours, minutes] = (prefs.morning_digest_time || '07:00:00').split(':');
      tomorrow.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      return this.scheduleNotification({
        user_id: userId,
        notification_type: 'morning_digest',
        scheduled_for: tomorrow.toISOString(),
        data: {},
        status: 'pending',
      });
    } catch (error) {
      if (__DEV__) console.error('🔴 [NOTIFICATIONS] Error scheduling morning digest:', error);
      return { success: false };
    }
  }

  async getPendingSchedules(): Promise<NotificationSchedule[]> {
    try {
      const { data, error } = await supabase
        .from('notification_schedules')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      if (__DEV__) console.error('🔴 [NOTIFICATIONS] Error getting pending schedules:', error);
      return [];
    }
  }

  async markScheduleAsSent(scheduleId: string): Promise<void> {
    await supabase
      .from('notification_schedules')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', scheduleId);
  }

  async batchLikeNotifications(postId: string, postAuthorId: string): Promise<{ success: boolean }> {
    try {
      const tenMinutesAgo = new Date(Date.now() - NOTIFICATION_RULES.batch_window_minutes * 60 * 1000);

      const { data: recentLikes } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', postAuthorId)
        .eq('type', 'post_like')
        .eq('data->postId', postId)
        .gte('created_at', tenMinutesAgo.toISOString());

      if (recentLikes && recentLikes.length > 0) {
        return { success: false };
      }

      const { data: likes } = await supabase
        .from('likes')
        .select('user_id, profiles(username)')
        .eq('post_id', postId)
        .gte('created_at', tenMinutesAgo.toISOString());

      if (!likes || likes.length === 0) return { success: false };

      const likerNames = likes.map((l: any) => l.profiles?.username).filter(Boolean);
      const title = likerNames.length === 1
        ? `👍 ${likerNames[0]} liked your post`
        : likerNames.length === 2
        ? `👍 ${likerNames[0]} and ${likerNames[1]} liked your post`
        : `👍 ${likerNames[0]} and ${likerNames.length - 1} others liked your post`;

      return this.createNotification({
        userId: postAuthorId,
        type: 'post_like',
        title,
        body: 'Check it out!',
        data: { postId, likerIds: likes.map((l: any) => l.user_id) },
        actionUrl: `/posts/${postId}`,
        category: 'social',
      });
    } catch (error) {
      if (__DEV__) console.error('🔴 [NOTIFICATIONS] Error batching like notifications:', error);
      return { success: false };
    }
  }
}

export const supabaseNotificationService = new SupabaseNotificationService();
