import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Post } from '../../../../state/slices/socialSlice';
import { PostCardBaseV2 } from './PostCardBaseV2';
import { LuxuryTheme } from '../../../../design/luxuryTheme';
import { formatStreakDisplay } from '../../../../utils/streakUtils';

interface CheckinCardV2Props {
  post: Post;
  onReact: (emoji: string) => void;
}

/**
 * CheckinCardV2 - Enhanced check-in card with improved visual hierarchy
 * Uses category colors and refined metrics display
 */
export const CheckinCardV2: React.FC<CheckinCardV2Props> = ({ post, onReact }) => {
  const metrics = post.streakMetrics;
  const formattedDisplay = metrics ? formatStreakDisplay({
    graceStreak: metrics.graceStreak || { done: 0, window: 14, percentage: 0, label: '' },
    recovery: metrics.recovery || { run: 0, isComeback: false },
    momentum: metrics.momentum || { score: 0, trend: 'stable', delta: 0 },
    monthProgress: metrics.monthProgress || { completed: 0, total: 20, onPace: 0, percentage: 0 },
    flexDays: { available: 0, earned: 0, used: 0 },
    intensity: metrics.intensity,
  }) : null;

  // Determine category based on goal or action
  const getCategory = (): 'fitness' | 'mindfulness' | 'productivity' | undefined => {
    const title = (post.actionTitle || post.goal || '').toLowerCase();
    if (title.includes('workout') || title.includes('exercise') || title.includes('run')) {
      return 'fitness';
    }
    if (title.includes('meditat') || title.includes('breath') || title.includes('mindful')) {
      return 'mindfulness';
    }
    if (title.includes('work') || title.includes('study') || title.includes('task')) {
      return 'productivity';
    }
    return undefined;
  };

  const category = getCategory();

  return (
    <PostCardBaseV2
      post={post}
      onReact={onReact}
      category={category}
    >
      {/* Milestone celebration */}
      {post.socialProof?.milestone && (
        <View style={styles.milestone}>
          <LinearGradient
            colors={LuxuryTheme.gradientPresets.goldShine}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={styles.milestoneText}>🎉 {post.socialProof.milestone}</Text>
        </View>
      )}

      {/* Main content */}
      {post.content && (
        <Text style={styles.content}>{post.content}</Text>
      )}

      {/* Compassionate metrics display */}
      {formattedDisplay && (
        <View style={styles.metricsContainer}>
          {/* Primary badge */}
          {formattedDisplay.primaryBadge && (
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryBadgeText}>
                {formattedDisplay.primaryBadge}
              </Text>
            </View>
          )}

          {/* Metric chips - smaller, more subtle */}
          {formattedDisplay.chips.length > 0 && (
            <View style={styles.chipRow}>
              {formattedDisplay.chips.slice(0, 3).map((chip, index) => (
                <View key={index} style={styles.chip}>
                  <Text style={styles.chipText}>{chip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Encouragement - italicized and subtle */}
          {formattedDisplay.encouragement && (
            <Text style={styles.encouragement}>
              {formattedDisplay.encouragement}
            </Text>
          )}
        </View>
      )}

      {/* Progress bar if month progress exists */}
      {metrics?.monthProgress && (
        <View style={styles.progressBar}>
          <LinearGradient
            colors={
              metrics.monthProgress.percentage >= 80 
                ? [LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]
                : ['rgba(192,192,192,0.3)', 'rgba(192,192,192,0.2)']
            }
            style={[styles.progressFill, { width: `${metrics.monthProgress.percentage}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
      )}
    </PostCardBaseV2>
  );
};

const styles = StyleSheet.create({
  milestone: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  milestoneText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B0F12',
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    color: LuxuryTheme.colors.text.primary,
    marginBottom: 12,
  },
  metricsContainer: {
    gap: 8,
  },
  primaryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(231,180,58,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(231,180,58,0.2)',
  },
  primaryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: LuxuryTheme.colors.primary.gold,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  chipText: {
    fontSize: 11,
    color: LuxuryTheme.colors.text.tertiary,
  },
  encouragement: {
    fontSize: 13,
    fontStyle: 'italic',
    color: LuxuryTheme.colors.text.secondary,
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});