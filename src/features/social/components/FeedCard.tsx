import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MessageCircle, MoreVertical, Clock, Award, Zap, TrendingUp } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Post } from '../../../state/slices/socialSlice';
import { ReactionChipAnimated } from '../../../ui/atoms/ReactionChipAnimated';
import { LuxuryTheme } from '../../../design/luxuryTheme';
import { useStore } from '../../../state/rootStore';
import * as Haptics from 'expo-haptics';
import { SimpleAudioPlayer } from './SimpleAudioPlayer';
import { CommentSection } from './CommentSection';
import { isValidContent } from '../../../utils/contentValidation';

const { width } = Dimensions.get('window');

interface FeedCardProps {
  post: Post;
  onReact: (emoji: string) => void;
  onComment?: (content: string) => void;
  onProfileTap?: () => void;
}

export const FeedCard: React.FC<FeedCardProps> = ({
  post,
  onReact,
  onComment,
  onProfileTap,
}) => {
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const scale = useSharedValue(1);
  const glowIntensity = useSharedValue(0);
  const urgencyPulse = useSharedValue(0);
  const engagementGlow = useSharedValue(0);
  const goals = useStore(s => s.goals);
  
  // Calculate engagement metrics
  const totalReactions = React.useMemo(() => {
    if (!post.reactions) return 0;
    return Object.values(post.reactions).reduce((sum: number, count) => sum + (count || 0), 0);
  }, [post.reactions]);
  
  const isHighEngagement = totalReactions > 5;
  const isNew = post.time?.includes('min') || post.time?.includes('sec');
  const hasStreak = post.streak && post.streak > 7;
  
  // Get habit color from daily state
  const habitColor = React.useMemo(() => {
    if (post.type === 'checkin' && post.goal) {
      const goal = goals.find(g => g.title === post.goal);
      return goal?.color || LuxuryTheme.colors.primary.gold;
    }
    return null;
  }, [post, goals]);
  
  // Animate high engagement posts
  useEffect(() => {
    if (isHighEngagement) {
      engagementGlow.value = withTiming(1, { duration: 1000 });
    }
    if (isNew) {
      urgencyPulse.value = withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 500 })
      );
    }
  }, [isHighEngagement, isNew]);

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
    glowIntensity.value = withTiming(1, { duration: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    glowIntensity.value = withTiming(0, { duration: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(glowIntensity.value, [0, 1], [0.1, 0.3]),
    shadowRadius: interpolate(glowIntensity.value, [0, 1], [8, 16]),
  }));
  
  const urgencyStyle = useAnimatedStyle(() => ({
    opacity: urgencyPulse.value,
  }));
  
  const engagementStyle = useAnimatedStyle(() => ({
    opacity: interpolate(engagementGlow.value, [0, 1], [0, 0.3]),
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle, glowStyle]}>
      <BlurView intensity={20} tint="dark" style={styles.card}>
        {/* Dynamic gradient based on engagement */}
        <LinearGradient
          colors={isHighEngagement 
            ? ['rgba(255, 215, 0, 0.05)', 'rgba(255, 215, 0, 0.02)', 'transparent']
            : ['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.01)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
          locations={[0, 0.5, 1]}
        />
        
        {/* Engagement glow overlay */}
        {isHighEngagement && (
          <Animated.View style={[styles.engagementGlow, engagementStyle]}>
            <LinearGradient
              colors={['rgba(255, 215, 0, 0.1)', 'transparent']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
          </Animated.View>
        )}
        
        {/* New post indicator */}
        {isNew && (
          <Animated.View style={[styles.newIndicator, urgencyStyle]}>
            <Zap size={12} color="#FFD700" />
            <Text style={styles.newText}>NEW</Text>
          </Animated.View>
        )}
        
        {/* Habit color accent for check-ins */}
        {habitColor && (
          <View style={[styles.habitAccent, { backgroundColor: habitColor }]} />
        )}
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable 
            style={styles.profileSection}
            onPress={() => {
              onProfileTap?.();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            {/* Profile Photo with Status Ring */}
            <View style={styles.avatarContainer}>
              {/* Status ring for streaks */}
              {hasStreak && (
                <LinearGradient
                  colors={['#FFD700', '#FFA500', '#FFD700']}
                  style={styles.statusRing}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              {(() => {
                // Debug: Check what avatar data we have
                if (__DEV__) console.log(`FeedCard - Post by ${post.user}, avatar:`, post.avatar?.substring(0, 50));
                const isImageAvatar = post.avatar && (
                  post.avatar.startsWith('data:') || 
                  post.avatar.startsWith('http') || 
                  post.avatar.startsWith('blob:')
                );
                
                if (isImageAvatar) {
                  return <Image source={{ uri: post.avatar }} style={styles.avatarPhoto} />;
                } else if (post.avatar && post.avatar !== '👤') {
                  return <Text style={styles.avatarEmoji}>{post.avatar}</Text>;
                } else {
                  return (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitial}>
                        {post.user.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  );
                }
              })()}
            </View>
            
            {/* User Info with Badges */}
            <View style={styles.userInfo}>
              <View style={styles.userNameRow}>
                <Text style={styles.username}>{post.user}</Text>
                {hasStreak && (
                  <View style={styles.streakIndicator}>
                    <Text style={styles.miniStreakText}>🔥{post.streak}</Text>
                  </View>
                )}
              </View>
              <View style={styles.timestampRow}>
                <Clock size={10} color="rgba(255, 255, 255, 0.3)" />
                <Text style={styles.timestamp}>{post.time}</Text>
                {isHighEngagement && (
                  <>
                    <Text style={styles.timestampDot}>•</Text>
                    <TrendingUp size={10} color="#4AE54A" />
                    <Text style={styles.trendingLabel}>Trending</Text>
                  </>
                )}
              </View>
            </View>
          </Pressable>
          
          {/* Engagement Score */}
          {totalReactions > 0 && (
            <View style={styles.engagementScore}>
              <Award size={14} color="#FFD700" />
              <Text style={styles.scoreText}>{totalReactions}</Text>
            </View>
          )}
        </View>
        
        {/* Content */}
        <View style={styles.contentSection}>
          {/* Check-in specific - Enhanced */}
          {post.type === 'checkin' && post.actionTitle && (
            <View style={styles.checkinHeader}>
              <View style={styles.checkinMain}>
                <View style={styles.checkmarkContainer}>
                  <Text style={styles.checkmark}>✅</Text>
                </View>
                <Text style={styles.checkinAction}>{isValidContent(post.actionTitle) ? post.actionTitle : ''}</Text>
              </View>
              {post.goal && isValidContent(post.goal) && (
                <Text style={styles.goalContext}>→ {post.goal}</Text>
              )}
            </View>
          )}
          
          {/* Main content */}
          {post.content && isValidContent(post.content) && (
            <Text style={styles.content}>{post.content}</Text>
          )}
          
          {/* Photo */}
          {post.photoUri && (
            <Image source={{ uri: post.photoUri }} style={styles.photo} />
          )}
          
          {/* Audio player */}
          {post.audioUri && (
            <View style={{ zIndex: 10, position: 'relative' }}>
              <SimpleAudioPlayer uri={post.audioUri} />
            </View>
          )}
        </View>
        
        {/* Footer with reactions - Enhanced */}
        <View style={styles.footer}>
          <View style={styles.reactionsRow}>
            <ReactionChipAnimated
              emoji="🔥"
              count={post.reactions?.['🔥']}
              active={post.userReacted || false}
              onPress={() => {
                onReact('🔥');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            />
          </View>
          
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Pressable 
              style={[
                styles.commentButton,
                commentsExpanded && styles.commentButtonActive
              ]} 
              onPress={() => {
                setCommentsExpanded(!commentsExpanded);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <MessageCircle 
                size={14} 
                color={commentsExpanded ? '#FFD700' : 'rgba(255, 255, 255, 0.6)'} 
              />
              {post.commentCount !== undefined && post.commentCount > 0 && (
                <Text style={[
                  styles.commentCount,
                  commentsExpanded && styles.commentCountActive
                ]}>
                  {post.commentCount}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
        
        {/* Comment Section */}
        <CommentSection
          postId={post.id}
          comments={post.comments}
          isExpanded={commentsExpanded}
          onAddComment={(content) => {
            onComment?.(content);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          onToggleExpand={() => setCommentsExpanded(!commentsExpanded)}
        />
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 10, 10, 0.6)',
  },
  engagementGlow: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  newIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    zIndex: 10,
  },
  newText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  habitAccent: {
    position: 'absolute',
    left: 0,
    top: 20,
    bottom: 20,
    width: 3,
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  statusRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 24,
    opacity: 0.8,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  avatarPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  streakIndicator: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  miniStreakText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFD700',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  timestamp: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  timestampDot: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 2,
  },
  trendingLabel: {
    fontSize: 10,
    color: '#4AE54A',
    fontWeight: '600',
  },
  engagementScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
  },
  moreButton: {
    padding: 8,
  },
  contentSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  checkinHeader: {
    marginBottom: 8,
  },
  checkinMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(74, 229, 74, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 14,
  },
  checkinAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4AE54A',
    flex: 1,
  },
  goalContext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
    marginLeft: 32,
    fontStyle: 'italic',
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.9)',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
  },
  audioIndicator: {
    backgroundColor: 'rgba(147,112,219,0.1)',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(147,112,219,0.2)',
  },
  audioText: {
    fontSize: 14,
    color: '#9370DB',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.03)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  reactionsRow: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  commentButtonActive: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderColor: 'rgba(255,215,0,0.2)',
  },
  commentCount: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
  },
  commentCountActive: {
    color: '#FFD700',
  },
});