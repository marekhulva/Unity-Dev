import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Post } from '../../../../state/slices/socialSlice';
import { SocialCardSurface } from '../../../../ui/atoms/SocialCardSurface';
import { StreakBadgeAnimated } from '../../../../ui/atoms/StreakBadgeAnimated';
import { MomentumRingAnimated } from '../../../../ui/atoms/MomentumRingAnimated';
import { CheckmarkAnimated } from '../../../../ui/atoms/CheckmarkAnimated';
import { ReactionChipAnimated } from '../../../../ui/atoms/ReactionChipAnimated';
import { LuxuryTheme } from '../../../../design/luxuryTheme';
import { useSocialV2 } from '../../../../utils/featureFlags';

interface PostCardBaseV3Props {
  post: Post;
  children: React.ReactNode;
  onReact: (emoji: string) => void;
  onProfilePress?: (userId: string) => void;
  category?: 'fitness' | 'mindfulness' | 'productivity';
  showDetailMeter?: boolean; // Only show bar meter in expanded states
}

/**
 * PostCardBaseV3 - V2 enhanced card with unified momentum visualization
 * Single primary momentum meter, improved spacing, better hierarchy
 */
export const PostCardBaseV3: React.FC<PostCardBaseV3Props> = ({
  post,
  children,
  onReact,
  onProfilePress,
  category,
  showDetailMeter = false, // Hide bar by default
}) => {
  const v2Enabled = useSocialV2();

  // Get category color with tuned opacity
  const getCategoryColor = () => {
    if (!category) return undefined;
    return LuxuryTheme.colors.semantic.category[category];
  };

  // Fallback for non-V2
  if (!v2Enabled) {
    return (
      <View style={styles.legacyCard}>
        <Text style={styles.userName}>{post.user}</Text>
        {children}
      </View>
    );
  }

  return (
    <SocialCardSurface
      categoryColor={getCategoryColor()}
      categoryOpacity={0.6} // Tuned down to not overpower text
      infiniteScrollCue={true}
    >
      {/* Header with improved spacing */}
      <View style={styles.header}>
        <Pressable 
          style={styles.primaryInfo}
          onPress={() => onProfilePress?.(post.user_id || '')}
        >
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{post.avatar || '👤'}</Text>
            </View>
            {/* Checkmark for completed actions */}
            {post.type === 'checkin' && (
              <View style={styles.checkmarkOverlay}>
                <CheckmarkAnimated checked={true} size={12} />
              </View>
            )}
          </View>

          {/* User info - PRIMARY hierarchy */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{post.user}</Text>
            {post.actionTitle && (
              <Text style={styles.actionTitle}>{post.actionTitle}</Text>
            )}
          </View>
        </Pressable>

        {/* Right side - SINGLE momentum meter */}
        <View style={styles.metrics}>
          {/* Streak badge for actual streaks */}
          {post.streak && post.streak > 0 && (
            <StreakBadgeAnimated
              value={post.streak}
              size="sm"
              milestone={[7, 30, 100].includes(post.streak)}
            />
          )}
          
          {/* Primary momentum ring - always visible when momentum exists */}
          {post.streakMetrics?.momentum && (
            <MomentumRingAnimated
              value={post.streakMetrics.momentum.score}
              size={36}
              trend={post.streakMetrics.momentum.trend}
              showLabel={false}
              showSweepHighlight={true}
            />
          )}
        </View>
      </View>

      {/* Content area with increased spacing */}
      <View style={styles.content}>
        {children}
        
        {/* Detail meter ONLY shown in expanded states */}
        {showDetailMeter && post.streakMetrics?.momentum && (
          <View style={styles.detailMeter}>
            {/* Bar meter as secondary visualization */}
            <View style={styles.meterBar}>
              <View 
                style={[
                  styles.meterFill, 
                  { width: `${post.streakMetrics.momentum.score}%` }
                ]} 
              />
            </View>
            <Text style={styles.meterLabel}>
              Momentum: {post.streakMetrics.momentum.score}%
            </Text>
          </View>
        )}
      </View>

      {/* Footer with metadata - TERTIARY hierarchy */}
      <View style={styles.footer}>
        <Text style={styles.metadata}>{post.time}</Text>
        
        {/* Intensity with muted color */}
        {post.streakMetrics?.intensity && (
          <View style={styles.intensity}>
            <View style={[
              styles.intensityDot,
              { 
                backgroundColor: 
                  post.streakMetrics.intensity === 'High' ? LuxuryTheme.colors.primary.gold :
                  post.streakMetrics.intensity === 'Medium' ? LuxuryTheme.colors.primary.silver :
                  LuxuryTheme.colors.text.muted
              }
            ]} />
            <Text style={styles.metadataMuted}>{post.streakMetrics.intensity}</Text>
          </View>
        )}

        {/* Animated reaction chips */}
        <View style={styles.reactions}>
          {['💪', '🔥', '👏'].map(emoji => (
            <ReactionChipAnimated
              key={emoji}
              emoji={emoji}
              count={post.reactions?.[emoji]}
              active={!!post.reactions?.[emoji]}
              onPress={() => onReact(emoji)}
            />
          ))}
        </View>
      </View>
    </SocialCardSurface>
  );
};

const styles = StyleSheet.create({
  // Legacy fallback
  legacyCard: {
    padding: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },

  // Header with increased spacing
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: LuxuryTheme.spacing.headerGap, // 14px (increased from 12)
  },
  primaryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  checkmarkOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16, // Remains strongest
    fontWeight: '700',
    color: LuxuryTheme.colors.text.primary,
    marginBottom: 2,
  },
  actionTitle: {
    fontSize: 14, // Slightly larger than body
    fontWeight: '500',
    color: LuxuryTheme.colors.text.secondary, // Brighter than body
  },

  // Metrics - single unified meter
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Content with improved line height
  content: {
    marginBottom: 12,
  },

  // Detail meter (hidden by default)
  detailMeter: {
    marginTop: 12,
    gap: 4,
  },
  meterBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    backgroundColor: LuxuryTheme.colors.primary.gold,
    borderRadius: 2,
  },
  meterLabel: {
    fontSize: 11,
    color: LuxuryTheme.colors.text.muted,
  },

  // Footer with tertiary text
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metadata: {
    fontSize: 12,
    color: LuxuryTheme.colors.text.tertiary,
  },
  metadataMuted: {
    fontSize: 12,
    color: LuxuryTheme.colors.text.muted, // Even more muted
  },
  intensity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  intensityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  reactions: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 'auto',
  },
});