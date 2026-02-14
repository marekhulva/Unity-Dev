import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Post } from '../../../../state/slices/socialSlice';
import { PostCardBaseV3 } from './PostCardBaseV3';
import { LuxuryTheme } from '../../../../design/luxuryTheme';
import { formatStreakDisplay } from '../../../../utils/streakUtils';

interface CheckinCardV3Props {
  post: Post;
  onReact: (emoji: string) => void;
  showDetailMeter?: boolean;
}

/**
 * CheckinCardV3 - Enhanced check-in card with V2 improvements
 * Better spacing, unified momentum, improved text hierarchy
 */
export const CheckinCardV3: React.FC<CheckinCardV3Props> = ({ 
  post, 
  onReact,
  showDetailMeter = false,
}) => {
  const metrics = post.streakMetrics;
  const formattedDisplay = metrics ? formatStreakDisplay({
    graceStreak: metrics.graceStreak || { done: 0, window: 14, percentage: 0, label: '' },
    recovery: metrics.recovery || { run: 0, isComeback: false },
    momentum: metrics.momentum || { score: 0, trend: 'stable', delta: 0 },
    monthProgress: metrics.monthProgress || { completed: 0, total: 20, onPace: 0, percentage: 0 },
    flexDays: { available: 0, earned: 0, used: 0 },
    intensity: metrics.intensity,
  }) : null;

  // Determine category from content
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
    <PostCardBaseV3
      post={post}
      onReact={onReact}
      category={category}
      showDetailMeter={showDetailMeter}
    >
      {/* Milestone - only for explicit wins (gold discipline) */}
      {post.socialProof?.milestone && (
        <View style={styles.milestone}>
          <LinearGradient
            colors={LuxuryTheme.gradientPresets.goldShine}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={styles.milestoneText}>🎉 {post.socialProof.milestone}</Text>
        </View>
      )}

      {/* Main content with improved line height */}
      {post.content && (
        <Text style={styles.content}>{post.content}</Text>
      )}

      {/* Compassionate metrics - use neutral colors */}
      {formattedDisplay && (
        <View style={styles.metricsContainer}>
          {/* Primary badge - neutral unless it's a win */}
          {formattedDisplay.primaryBadge && (
            <View style={[
              styles.primaryBadge,
              formattedDisplay.primaryBadge.includes('Comeback') && styles.primaryBadgeWin
            ]}>
              <Text style={[
                styles.primaryBadgeText,
                formattedDisplay.primaryBadge.includes('Comeback') && styles.primaryBadgeTextWin
              ]}>
                {formattedDisplay.primaryBadge}
              </Text>
            </View>
          )}

          {/* Metric chips - always muted */}
          {formattedDisplay.chips.length > 0 && (
            <View style={styles.chipRow}>
              {formattedDisplay.chips.slice(0, 3).map((chip, index) => (
                <View key={index} style={styles.chip}>
                  <Text style={styles.chipText}>{chip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Encouragement text */}
          {formattedDisplay.encouragement && (
            <Text style={styles.encouragement}>
              {formattedDisplay.encouragement}
            </Text>
          )}
        </View>
      )}

      {/* Month progress bar - neutral unless high achievement */}
      {metrics?.monthProgress && (
        <View style={styles.progressBar}>
          <LinearGradient
            colors={
              metrics.monthProgress.percentage >= 80 
                ? [LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]
                : ['rgba(192,192,192,0.2)', 'rgba(192,192,192,0.1)']
            }
            style={[styles.progressFill, { width: `${metrics.monthProgress.percentage}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
      )}
    </PostCardBaseV3>
  );
};

const styles = StyleSheet.create({
  // Milestone - gold for wins only
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
  
  // Content with improved line height
  content: {
    fontSize: 15,
    lineHeight: LuxuryTheme.spacing.lineHeight.body, // 22px
    color: LuxuryTheme.colors.text.primary,
    marginBottom: 12,
  },
  
  // Metrics container
  metricsContainer: {
    gap: 8,
  },
  
  // Primary badge - neutral by default
  primaryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(192,192,192,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(192,192,192,0.15)',
  },
  primaryBadgeWin: {
    backgroundColor: 'rgba(231,180,58,0.12)',
    borderColor: 'rgba(231,180,58,0.2)',
  },
  primaryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.secondary,
  },
  primaryBadgeTextWin: {
    color: LuxuryTheme.colors.primary.gold,
  },
  
  // Chips - always muted
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  chipText: {
    fontSize: 11,
    color: LuxuryTheme.colors.text.muted,
  },
  
  // Encouragement
  encouragement: {
    fontSize: 13,
    fontStyle: 'italic',
    color: LuxuryTheme.colors.text.secondary,
    marginTop: 4,
    lineHeight: 18,
  },
  
  // Progress bar
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});