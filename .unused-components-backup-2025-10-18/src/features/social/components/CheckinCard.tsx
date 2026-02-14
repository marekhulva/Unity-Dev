import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, TrendingUp, Calendar, Zap } from 'lucide-react-native';
import { PostCardBase } from './PostCardBase';
import { Post } from '../../../../state/slices/socialSlice';
import { formatStreakDisplay } from '../../../../utils/streakUtils';

interface CheckinCardProps {
  post: Post;
  onReact: (emoji: string) => void;
}

export const CheckinCard: React.FC<CheckinCardProps> = ({ post, onReact }) => {
  const metrics = post.streakMetrics;
  const formattedDisplay = metrics ? formatStreakDisplay({
    graceStreak: metrics.graceStreak || { done: 0, window: 14, percentage: 0, label: '' },
    recovery: metrics.recovery || { run: 0, isComeback: false },
    momentum: metrics.momentum || { score: 0, trend: 'stable', delta: 0 },
    monthProgress: metrics.monthProgress || { completed: 0, total: 20, onPace: 0, percentage: 0 },
    flexDays: { available: 0, earned: 0, used: 0 },
    intensity: metrics.intensity,
  }) : null;

  return (
    <PostCardBase
      post={post}
      onReact={onReact}
      borderColor={`${post.goalColor}40` || 'rgba(255,215,0,0.2)'}
      glowColor={`${post.goalColor}30` || 'rgba(255,215,0,0.15)'}
    >
      {/* Milestone badge if present */}
      {post.socialProof?.milestone && (
        <View style={styles.milestoneBadge}>
          <LinearGradient
            colors={['#FFD700', '#F7E7CE']}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={styles.milestoneText}>{post.socialProof.milestone}</Text>
        </View>
      )}

      {/* Main check-in banner */}
      <View style={styles.checkinBanner}>
        <LinearGradient
          colors={[`${post.goalColor}15`, `${post.goalColor}08`]}
          style={StyleSheet.absoluteFillObject}
        />
        
        <View style={styles.checkinHeader}>
          <Text style={styles.checkinTitle}>
            ✅ {post.actionTitle || 'Completed action'}
          </Text>
          
          {/* Traditional streak display */}
          {post.streak && post.streak > 0 && (
            <View style={styles.streakBadge}>
              <Flame size={14} color="#FFD700" />
              <Text style={styles.streakText}>{post.streak} day streak</Text>
            </View>
          )}
        </View>

        {/* Compassionate streak metrics */}
        {formattedDisplay && (
          <>
            {/* Primary badge (comeback, grace streak, etc) */}
            {formattedDisplay.primaryBadge && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryBadgeText}>
                  {formattedDisplay.primaryBadge}
                </Text>
              </View>
            )}

            {/* Metric chips */}
            <View style={styles.metricsRow}>
              {formattedDisplay.chips.map((chip, index) => (
                <View key={index} style={styles.metricChip}>
                  <Text style={styles.metricText}>{chip}</Text>
                </View>
              ))}
            </View>

            {/* Encouragement text */}
            <Text style={styles.encouragement}>
              {formattedDisplay.encouragement}
            </Text>
          </>
        )}
      </View>

      {/* Optional content/caption */}
      {post.content && (
        <Text style={styles.content}>{post.content}</Text>
      )}

      {/* Progress visualization */}
      {metrics?.momentum && (
        <View style={styles.progressSection}>
          <View style={styles.momentumBar}>
            <LinearGradient
              colors={
                metrics.momentum.trend === 'up' 
                  ? ['#FFD700', '#F7E7CE']
                  : metrics.momentum.trend === 'down'
                  ? ['#C0C0C0', '#E5E4E2']
                  : ['#FFD700', '#C0C0C0']
              }
              style={[styles.momentumFill, { width: `${metrics.momentum.score}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            
            {/* Trend indicator */}
            <View style={styles.trendIndicator}>
              {metrics.momentum.trend === 'up' && <TrendingUp size={12} color="#FFD700" />}
              {metrics.momentum.trend === 'down' && <TrendingUp size={12} color="#C0C0C0" style={{ transform: [{ rotate: '180deg' }] }} />}
              <Text style={styles.momentumScore}>{metrics.momentum.score}%</Text>
            </View>
          </View>
        </View>
      )}

      {/* Intensity indicator */}
      {metrics?.intensity && (
        <View style={styles.intensityRow}>
          <Zap size={12} color={
            metrics.intensity === 'High' ? '#FFD700' :
            metrics.intensity === 'Medium' ? '#C0C0C0' : '#666'
          } />
          <Text style={styles.intensityText}>
            Intensity: {metrics.intensity}
          </Text>
        </View>
      )}
    </PostCardBase>
  );
};

const styles = StyleSheet.create({
  milestoneBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  milestoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  checkinBanner: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
    overflow: 'hidden',
  },
  checkinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkinTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  streakText: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: '600',
  },
  primaryBadge: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  primaryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFD700',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  metricChip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  metricText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  encouragement: {
    fontSize: 12,
    color: '#F7E7CE',
    fontStyle: 'italic',
    marginTop: 4,
  },
  content: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    marginBottom: 8,
  },
  progressSection: {
    marginTop: 8,
  },
  momentumBar: {
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  momentumFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 10,
  },
  trendIndicator: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  momentumScore: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  intensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  intensityText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
});