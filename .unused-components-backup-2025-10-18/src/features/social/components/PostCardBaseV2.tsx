import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Post } from '../../../../state/slices/socialSlice';
import { ElevationCard } from '../../../../ui/atoms/ElevationCard';
import { StreakBadgeAnimated } from '../../../../ui/atoms/StreakBadgeAnimated';
import { MomentumMeter } from '../../../../ui/atoms/MomentumMeter';
import { CheckmarkAnimated } from '../../../../ui/atoms/CheckmarkAnimated';
import { LuxuryTheme } from '../../../../design/luxuryTheme';
import { useSocialV1 } from '../../../../utils/featureFlags';

interface PostCardBaseV2Props {
  post: Post;
  children: React.ReactNode;
  onReact: (emoji: string) => void;
  category?: 'fitness' | 'mindfulness' | 'productivity';
}

/**
 * PostCardBaseV2 - Enhanced visual version with new design system
 * Improved hierarchy, contrast, and micro-animations
 */
export const PostCardBaseV2: React.FC<PostCardBaseV2Props> = ({
  post,
  children,
  onReact,
  category,
}) => {
  const v1Enabled = useSocialV1();
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSpring(0.98, {}, () => {
      scale.value = withSpring(1);
    });
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Get category color
  const getCategoryColor = () => {
    if (!category) return null;
    return LuxuryTheme.colors.semantic.category[category];
  };

  const categoryColor = getCategoryColor();

  // Legacy fallback if feature flag is off
  if (!v1Enabled) {
    return (
      <View style={styles.legacyCard}>
        <Text style={styles.userName}>{post.user}</Text>
        {children}
      </View>
    );
  }

  return (
    <Animated.View style={cardAnimatedStyle}>
      <ElevationCard
        elevation="md"
        glassEffect={true}
        borderGlow={post.streak && post.streak > 30}
        infiniteScrollCue={true}
      >
        {/* Category accent - minimal left edge */}
        {categoryColor && (
          <View style={[styles.categoryAccent, { backgroundColor: categoryColor }]} />
        )}

        {/* Header with proper hierarchy */}
        <View style={styles.header}>
          <View style={styles.primaryInfo}>
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

            {/* Username - PRIMARY hierarchy */}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{post.user}</Text>
              {post.actionTitle && (
                <Text style={styles.actionTitle}>{post.actionTitle}</Text>
              )}
            </View>
          </View>

          {/* Right side metrics */}
          <View style={styles.metrics}>
            {/* Streak badge - only for actual streaks */}
            {post.streak && post.streak > 0 && (
              <StreakBadgeAnimated
                value={post.streak}
                size="sm"
                milestone={[7, 30, 100].includes(post.streak)}
              />
            )}
            
            {/* Momentum meter instead of raw number */}
            {post.streakMetrics?.momentum && (
              <MomentumMeter
                value={post.streakMetrics.momentum.score}
                variant="ring"
                size={32}
                trend={post.streakMetrics.momentum.trend}
              />
            )}
          </View>
        </View>

        {/* Content area */}
        <View style={styles.content}>
          {children}
        </View>

        {/* Footer with metadata - TERTIARY hierarchy */}
        <View style={styles.footer}>
          <Text style={styles.metadata}>{post.time}</Text>
          
          {/* Intensity indicator */}
          {post.streakMetrics?.intensity && (
            <View style={styles.intensity}>
              <View style={[
                styles.intensityDot,
                { 
                  backgroundColor: 
                    post.streakMetrics.intensity === 'High' ? LuxuryTheme.colors.primary.gold :
                    post.streakMetrics.intensity === 'Medium' ? LuxuryTheme.colors.primary.silver :
                    LuxuryTheme.colors.text.tertiary
                }
              ]} />
              <Text style={styles.metadata}>{post.streakMetrics.intensity}</Text>
            </View>
          )}

          {/* Reaction buttons */}
          <View style={styles.reactions}>
            {['💪', '🔥', '👏'].map(emoji => (
              <Pressable
                key={emoji}
                onPress={() => onReact(emoji)}
                style={[
                  styles.reactionBtn,
                  post.reactions?.[emoji] && styles.reactionActive
                ]}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                {post.reactions?.[emoji] && (
                  <Text style={styles.reactionCount}>{post.reactions[emoji]}</Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </ElevationCard>
    </Animated.View>
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

  // Category accent
  categoryAccent: {
    position: 'absolute',
    left: 0,
    top: 16,
    bottom: 16,
    width: 3,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    fontSize: 16,
    fontWeight: '700',
    color: LuxuryTheme.colors.text.primary,
    marginBottom: 2,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: LuxuryTheme.colors.text.secondary,
  },

  // Metrics
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Content
  content: {
    marginBottom: 12,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metadata: {
    fontSize: 12,
    color: LuxuryTheme.colors.text.tertiary,
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
    gap: 8,
    marginLeft: 'auto',
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  reactionActive: {
    backgroundColor: 'rgba(231,180,58,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(231,180,58,0.2)',
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 11,
    color: LuxuryTheme.colors.text.tertiary,
  },
});