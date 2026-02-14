export type NotificationType =
  // Morning digest
  | 'morning_digest'

  // Social engagement
  | 'post_like'
  | 'post_comment'
  | 'post_mention'

  // Competitive
  | 'leaderboard_passed'
  | 'leaderboard_position_drop'
  | 'streak_comparison'
  | 'circle_last_one'

  // Challenge
  | 'challenge_starting_soon'
  | 'challenge_started'
  | 'challenge_position_change'
  | 'challenge_milestone'
  | 'challenge_final_day'
  | 'streak_dying'

  // Circle
  | 'circle_milestone'
  | 'circle_challenge_created'

  // Legacy types (keep for compatibility)
  | 'challenge_invite'
  | 'challenge_start'
  | 'activity_reminder'
  | 'streak_milestone'
  | 'challenge_complete'
  | 'badge_earned';

export type NotificationCategory = 'digest' | 'social' | 'challenge' | 'competitive' | 'system';

export type NotificationTone = 'aggressive' | 'supportive' | 'neutral';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  category?: NotificationCategory;
  title: string;
  body: string;
  data: any;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  action_url?: string;
  tone?: NotificationTone;
  opened_at?: string;
  led_to_action?: boolean;
}

export interface NotificationPreferences {
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  social_notifications: boolean;
  challenge_notifications: boolean;
  reminder_notifications: boolean;
  competitive_notifications: boolean;
  morning_digest_enabled: boolean;
  morning_digest_time: string;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  notification_tone: NotificationTone;
  created_at: string;
  updated_at: string;
}

export interface NotificationSchedule {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  scheduled_for: string;
  title: string;
  body: string;
  data: any;
  action_url?: string;
  status: 'pending' | 'sent' | 'cancelled' | 'failed';
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  category?: NotificationCategory;
  title: string;
  body: string;
  data?: any;
  actionUrl?: string;
  tone?: NotificationTone;
}

export interface ScheduleNotificationParams {
  userId: string;
  notificationType: NotificationType;
  scheduledFor: Date;
  title: string;
  body: string;
  data?: any;
  actionUrl?: string;
}
