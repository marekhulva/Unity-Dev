export type ChallengeType = 'streak' | 'cumulative' | 'competition' | 'team';
export type ChallengeScope = 'global' | 'circle';
export type ChallengeStatus = 'draft' | 'active' | 'archived';

export type ParticipantStatus = 'active' | 'completed' | 'failed' | 'abandoned' | 'left';
export type BadgeType = 'gold' | 'silver' | 'bronze' | 'diamond' | 'legendary';
export type VerificationType = 'honor' | 'photo' | 'required_photo';
export type ForumCategory = 'tips' | 'questions' | 'motivation' | 'strategy';

export interface Challenge {
  id: string;
  name: string;
  description?: string;
  emoji?: string;

  type: ChallengeType;
  scope: ChallengeScope;
  circle_id?: string;

  duration_days: number;
  success_threshold: number;

  predetermined_activities: PredeterminedActivity[];
  rules?: Record<string, any>;
  benefits?: string[];

  badge_emoji?: string;
  badge_name?: string;

  has_forum: boolean;

  status: ChallengeStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PredeterminedActivity {
  id?: string;
  title: string;
  emoji?: string;
  frequency: 'daily' | 'weekly' | 'custom' | 'once';
  min_duration_minutes?: number;
  description?: string;
  start_day?: number;  // Which day to start showing (1-based)
  end_day?: number;    // Which day to stop showing (inclusive)
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;

  joined_at: string;
  personal_start_date: string;
  personal_end_date?: string;

  current_day: number;
  completed_days: number;
  current_streak: number;
  longest_streak: number;
  last_completion_at?: string;

  completion_percentage: number;
  status: ParticipantStatus;
  badge_earned?: BadgeType | 'failed' | 'abandoned';
  completed_at?: string;
  abandoned_at?: string;
  left_at?: string;
  days_taken?: number;

  selected_activity_ids: string[];
  activity_times: ActivityTime[];
  linked_action_ids: string[];
  kept_activities?: boolean;

  created_at: string;
  updated_at: string;
}

export interface ActivityTime {
  activity_id: string;
  scheduled_time?: string;
  is_link?: boolean;
  linked_to?: string;
}

export interface ChallengeActivitySchedule {
  id: string;
  user_id: string;
  challenge_id: string;
  activity_id: string;

  scheduled_time: string;
  reminder_minutes_before: number;
  frequency: 'daily' | 'weekly' | 'custom';
  days_of_week?: number[];

  created_at: string;
}

export interface ChallengeCompletion {
  id: string;
  user_id: string;
  challenge_id: string;
  action_id?: string;

  completed_at: string;
  completion_date: string;

  photo_url?: string;
  is_verified: boolean;
  verification_type: VerificationType;

  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  challenge_id: string;

  badge_type: BadgeType;
  badge_emoji: string;
  badge_name: string;

  is_displayed_on_profile: boolean;
  display_order?: number;

  completion_percentage?: number;
  final_rank?: number;
  total_participants?: number;
  days_taken?: number;

  earned_at: string;
}

export interface ChallengeForumThread {
  id: string;
  challenge_id: string;
  author_id: string;

  title: string;
  content: string;
  category?: ForumCategory;

  is_pinned: boolean;
  is_locked: boolean;

  upvotes: number;
  downvotes: number;
  reply_count: number;
  view_count: number;

  created_at: string;
  updated_at: string;
  last_reply_at?: string;
}

export interface ChallengeForumReply {
  id: string;
  thread_id: string;
  parent_reply_id?: string;
  author_id: string;

  content: string;

  upvotes: number;
  downvotes: number;

  created_at: string;
  updated_at: string;
}

export interface ChallengeWithDetails extends Challenge {
  participant_count?: number;
  participants?: ChallengeParticipant[];
  my_participation?: ChallengeParticipant;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  name?: string;
  avatar_url?: string;
  completion_percentage: number;
  completed_days: number;
  current_day?: number;
  current_streak: number;
  days_taken?: number;
  rank: number;
  percentile?: number;
}
