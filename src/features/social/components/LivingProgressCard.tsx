import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Post } from '../../../state/slices/socialSlice';
import Svg, { Circle } from 'react-native-svg';
import { supabase } from '../../../services/supabase.service';

interface LivingProgressCardProps {
  post: Post;
  onToggleLike?: (postId: string, visibility: string) => Promise<void>;
  onComment?: (postId: string, content: string, visibility: string) => Promise<void>;
}

export const LivingProgressCard: React.FC<LivingProgressCardProps> = ({
  post,
  onToggleLike,
  onComment,
}) => {
  // Extract data from post
  const {
    user,
    userId,
    avatar,
    completedActions = [],
    totalActions = 0,
    actionsToday = 0,
    timestamp,
    is_challenge,
    challenge_id,
    challenge_name,
    challengeName,
    challengeProgress,
    progressDate,
  } = post;

  // Parse challengeProgress (stored as string in DB)
  let currentDay: number | undefined;
  let totalDays: number | undefined;

  if (challengeProgress) {
    try {
      const progress = typeof challengeProgress === 'string'
        ? JSON.parse(challengeProgress)
        : challengeProgress;
      currentDay = progress.current_day;
      totalDays = progress.total_days;
    } catch (e) {
      console.error('Failed to parse challengeProgress:', e);
    }
  }

  // Fallback calculation for historical cards without challenge_progress
  const [calculatedDay, setCalculatedDay] = React.useState<{current: number, total: number} | null>(null);

  React.useEffect(() => {
    async function fetchDayNumber() {
      if (!currentDay && challenge_id && progressDate && userId) {
        try {
          const { data, error } = await supabase
            .from('challenge_participants')
            .select('personal_start_date, challenges(duration_days)')
            .eq('user_id', userId)
            .eq('challenge_id', challenge_id)
            .single();

          if (data && !error) {
            const startDate = new Date(data.personal_start_date);
            const cardDate = new Date(progressDate);

            const daysDiff = Math.floor(
              (cardDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            const calculatedCurrent = daysDiff + 1;
            const calculatedTotal = (data as any).challenges?.duration_days || 0;

            setCalculatedDay({ current: calculatedCurrent, total: calculatedTotal });
          }
        } catch (e) {
          console.error('Failed to calculate day number:', e);
        }
      }
    }

    fetchDayNumber();
  }, [currentDay, challenge_id, progressDate, userId]);

  // Use calculated day if challenge_progress wasn't available
  const displayDay = currentDay || calculatedDay?.current;
  const displayTotal = totalDays || calculatedDay?.total;

  // Challenge detection - handle both naming conventions
  const isChallengeSnake = is_challenge && challenge_id;
  const isChallengeCamel = (post as any).isChallenge && (post as any).challengeId;
  const isChallenge = isChallengeSnake || isChallengeCamel;

  // Get challenge name from either naming convention
  const displayChallengeName = challenge_name || challengeName;

  // Perfect day calculation
  const percentage = totalActions > 0 ? Math.round((actionsToday / totalActions) * 100) : 0;
  const isPerfectDay = percentage === 100;

  // Time ago calculation
  const getTimeAgo = (): string => {
    if (!timestamp) return 'Just now';

    const now = new Date();
    const postDate = new Date(timestamp);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    // Format as "Feb 3"
    const month = postDate.toLocaleDateString('en-US', { month: 'short' });
    const day = postDate.getDate();
    return `${month} ${day}`;
  };

  // Progress ring calculation
  const ringRadius = 21;
  const circumference = 2 * Math.PI * ringRadius; // ~132
  const progress = totalActions > 0 ? actionsToday / totalActions : 0;
  const strokeDashoffset = circumference - (circumference * progress);

  // Get streak count (fallback to 0)
  const streakCount = (post as any).streakCount || 0;

  // Show all completed actions
  const visibleActions = completedActions;

  return (
    <View style={[styles.card, isPerfectDay && styles.cardPerfectDay]}>
      {/* Subtle Gold Background Overlay - Always visible */}
      <LinearGradient
        colors={[
          'rgba(212, 175, 55, 0.04)',
          'rgba(212, 175, 55, 0.02)',
          'transparent'
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.goldBackgroundOverlay}
      />

      {/* Perfect Day Decorations */}
      {isPerfectDay && (
        <>
          <LinearGradient
            colors={['#D4AF37', '#E7C455', '#D4AF37']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.goldTopLine}
          />
          <LinearGradient
            colors={['rgba(212, 175, 55, 0.08)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.goldGlow}
          />
        </>
      )}

      {/* Challenge Name Header */}
      {!!displayChallengeName && (
        <View style={styles.challengeHeader}>
          <Text style={styles.challengeHeaderText}>{displayChallengeName}</Text>
          {displayDay && displayTotal && (
            <Text style={styles.challengeDayText}>
              Day {displayDay} of {displayTotal}
            </Text>
          )}
          <LinearGradient
            colors={['transparent', '#FFD700', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.challengeHeaderLine}
          />
        </View>
      )}

      {/* Header Row */}
      <View style={styles.header}>
        {/* Progress Ring with Avatar */}
        <View style={styles.progressRingWrapper}>
          {/* Background Ring */}
          <Svg width={48} height={48} viewBox="0 0 48 48" style={StyleSheet.absoluteFill}>
            <Circle
              cx={24}
              cy={24}
              r={ringRadius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth={3}
            />
          </Svg>

          {/* Progress Fill Ring */}
          <Svg
            width={48}
            height={48}
            viewBox="0 0 48 48"
            style={[StyleSheet.absoluteFill, { transform: [{ rotate: '-90deg' }] }]}
          >
            <Circle
              cx={24}
              cy={24}
              r={ringRadius}
              fill="none"
              stroke="#D4AF37"
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </Svg>

          {/* Avatar Inside Ring */}
          <View style={styles.avatarInner}>
            <Text style={styles.avatarEmoji}>{avatar || '👤'}</Text>
          </View>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          {/* User Row: Name + Streak Badge */}
          <View style={styles.userRow}>
            <Text style={styles.username}>{user}</Text>
            {streakCount > 0 && (
              <LinearGradient
                colors={['#FF6B35', '#FF4500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.streakBadge}
              >
                <Text style={styles.streakBadgeText}>🔥 {streakCount}</Text>
              </LinearGradient>
            )}
          </View>

          {/* Subtitle Row: Perfect Badge + Time */}
          <View style={styles.subtitleRow}>
            {isPerfectDay && <Text style={styles.perfectBadge}>✦ PERFECT DAY</Text>}
            {isPerfectDay && <Text style={styles.dotSeparator}>·</Text>}
            <Text style={styles.timeAgo}>{getTimeAgo()}</Text>
          </View>
        </View>

        {/* More button hidden until implemented */}
      </View>

      {/* Action Tiles */}
      <View style={styles.actionTiles}>
        {visibleActions.map((action, index) => {
          const isFailed = action.failed === true;
          return (
            <View key={action.actionId || index} style={[styles.actionTile, isFailed && styles.actionTileFailed]}>
              {isFailed ? (
                <Text style={styles.failedMark}>✕</Text>
              ) : (
                action.completed && <Text style={styles.checkMark}>✓</Text>
              )}

              <Text style={[styles.actionEmoji, isFailed && styles.actionEmojiMuted]}>
                {action.emoji || '✓'}
              </Text>

              <Text style={[styles.actionName, isFailed && styles.actionNameFailed]} numberOfLines={2}>
                {action.title || action.name || 'Action'}
              </Text>

              {isFailed ? (
                <View style={styles.failedBar} />
              ) : (
                action.completed && <View style={styles.completedBar} />
              )}
            </View>
          );
        })}

      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Completion Stat with Percentage */}
        <View style={styles.completionStat}>
          <Text style={styles.completionPercent}>{percentage}%</Text>
          <Text style={styles.completionNumber}>{actionsToday}/{totalActions}</Text>
          <Text style={styles.completionText}> completed</Text>
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Outer Container
  card: {
    marginHorizontal: 8,
    marginBottom: 8,
    padding: 20,
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  cardPerfectDay: {
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },

  // Gold Background Overlay (always visible)
  goldBackgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },

  // Challenge Header
  challengeHeader: {
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 1,
  },
  challengeHeaderText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#D4AF37',
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  challengeDayText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
    marginBottom: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  challengeHeaderLine: {
    height: 1,
    width: '100%',
  },

  // Perfect Day Decorations
  goldTopLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 0,
  },
  goldGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 0,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    zIndex: 1,
  },

  // Progress Ring
  progressRingWrapper: {
    width: 48,
    height: 48,
    position: 'relative',
    flexShrink: 0,
  },
  avatarInner: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 999,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 16,
  },

  // User Info
  userInfo: {
    flex: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  streakBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
  streakBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  perfectBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D4AF37',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dotSeparator: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.2)',
  },
  timeAgo: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },

  // More Button
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  moreText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '700',
  },

  // Action Tiles
  actionTiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
    zIndex: 1,
  },
  actionTile: {
    width: '30%',
    flexGrow: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  checkMark: {
    position: 'absolute',
    top: 6,
    right: 6,
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '700',
  },
  failedMark: {
    position: 'absolute',
    top: 6,
    right: 6,
    fontSize: 14,
    color: '#E74C3C',
    fontWeight: '700',
  },
  actionTileFailed: {
    borderColor: 'rgba(231, 76, 60, 0.25)',
    backgroundColor: 'rgba(231, 76, 60, 0.06)',
  },
  actionEmojiMuted: {
    opacity: 0.4,
  },
  actionNameFailed: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  failedBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#E74C3C',
  },
  actionEmoji: {
    fontSize: 20,
    marginBottom: 4,
    textAlign: 'center',
    color: '#D4AF37',
  },
  actionName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 14.3,
    textAlign: 'center',
  },
  completedBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#D4AF37',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },
  completionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completionPercent: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D4AF37',
    marginRight: 4,
  },
  completionNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E7C455',
  },
  completionText: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  spacer: {
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  buttonTextActive: {
    color: '#FF6B35',
  },
});
