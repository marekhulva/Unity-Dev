import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { MessageCircle, Send, Check, Flame, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Post } from '../../state/slices/socialSlice';
import { isValidContent } from '../../utils/contentValidation';

interface UnifiedPostCardTimelineProps {
  post: Post;
  onReact: (id: string, emoji: string) => void;
  onComment: (id: string, text: string) => void;
  onProfilePress?: (userId: string) => void;
}

export const UnifiedPostCardTimeline: React.FC<UnifiedPostCardTimelineProps> = React.memo(({
  post,
  onReact,
  onComment,
  onProfilePress,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const scale = useSharedValue(1);

  const isChallenge = post.isChallenge || !!post.challengeId;
  const isCheckin = post.type === 'checkin' || !!post.actionTitle;
  const isPhoto = post.type === 'photo' || !!post.mediaUrl;
  const isCelebration = post.is_celebration;

  if (__DEV__) {
    console.log('📸 [TIMELINE-CARD] Rendering post:', {
      id: post.id.substring(0, 8),
      type: post.type,
      user: post.user,
      goal: post.goal,
      actionTitle: post.actionTitle,
      content: post.content,
      hasMedia: !!post.mediaUrl
    });
  }

  const handleReact = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(
      withTiming(1.3, { duration: 80 }),
      withSpring(1, { damping: 10 })
    );
    onReact(post.id, '🔥');
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    onComment(post.id, commentText);
    setCommentText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const animatedReactStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const formatTime = (time: string) => time || 'now';

  const hasReactions = (post.reactionCount || 0) > 0;
  const hasComments = (post.commentCount || 0) > 0;

  // Get accent color from goal color or default to purple
  const accentColor = post.goalColor || '#B366FF';

  // Extract streak if available
  const streak = post.streak || 0;

  // Celebration - keep same style as original
  if (isCelebration) {
    return (
      <View style={styles.item}>
        <View style={styles.celebrationRow}>
          <View style={styles.celebrationIconWrap}>
            <Text style={styles.celebrationIcon}>💯</Text>
          </View>
          <View style={styles.celebrationContent}>
            <Text style={styles.celebrationText}>
              <Text style={styles.goldText}>{post.user}</Text>
              {' '}completed all daily actions
            </Text>
            {post.goal && isValidContent(post.goal) && (
              <View style={styles.goalRow}>
                <View style={[styles.goalDot, { backgroundColor: accentColor }]} />
                <Text style={styles.metaText}>{post.goal}</Text>
              </View>
            )}
          </View>
          <Text style={styles.timeText}>{formatTime(post.time)}</Text>
        </View>
        <View style={styles.divider} />
      </View>
    );
  }

  return (
    <View style={styles.item}>
      {/* Vertical accent line on the left */}
      <View style={styles.accentLineWrap}>
        <LinearGradient
          colors={[accentColor, `${accentColor}50`]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.accentLine}
        />
      </View>

      {/* Header with avatar and username */}
      <View style={styles.header}>
        <Pressable
          onPress={() => post.userId && onProfilePress?.(post.userId)}
          style={styles.avatarWrap}
        >
          <View style={styles.avatar}>
            {post.avatar && (post.avatar.startsWith('http') || post.avatar.startsWith('data:')) ? (
              <Image source={{ uri: post.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarEmoji}>{post.avatar || '👤'}</Text>
            )}
          </View>
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.userName}>{post.user && post.user.trim() !== '.' ? post.user : 'User'}</Text>
          {isChallenge && post.challengeName && isValidContent(post.challengeName) && (
            <View style={styles.challengeChip}>
              <Text style={styles.challengeChipText}>
                🏆 {post.challengeName}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Check-in display */}
        {isCheckin && post.actionTitle && isValidContent(post.actionTitle) && (
          <View style={styles.checkinRow}>
            <View style={[styles.checkIcon, { backgroundColor: accentColor }]}>
              <Check size={14} color="#000" strokeWidth={3} />
            </View>
            <Text style={styles.actionTitle}>{post.actionTitle}</Text>
          </View>
        )}

        {/* Content/comment (show for both check-ins and regular posts) */}
        {post.content && isValidContent(post.content) && !isPhoto &&
         post.content !== 'Completed' &&
         post.content !== `Completed: ${post.actionTitle}` && (
          <Text style={styles.postText}>{post.content}</Text>
        )}

        {/* Photo */}
        {isPhoto && post.mediaUrl && (
          <View style={styles.mediaWrap}>
            <Image
              source={{ uri: post.mediaUrl }}
              style={styles.media}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Photo caption */}
        {isPhoto && post.content && isValidContent(post.content) && (
          <Text style={styles.caption}>{post.content}</Text>
        )}

        {/* Meta info row - time, streak, goal badge */}
        <View style={styles.metaRow}>
          {post.time && (
            <View style={styles.metaBadge}>
              <Clock size={12} color="rgba(255,255,255,0.5)" />
              <Text style={styles.metaBadgeText}>{formatTime(post.time)}</Text>
            </View>
          )}

          {streak > 0 && (
            <View style={styles.metaBadge}>
              <Flame size={12} color={accentColor} />
              <Text style={styles.metaBadgeText}>{streak} days</Text>
            </View>
          )}

          {post.goal && isValidContent(post.goal) && (
            <View style={[styles.goalBadge, { borderColor: `${accentColor}50` }]}>
              <View style={[styles.goalDot, { backgroundColor: accentColor }]} />
              <Text style={[styles.goalBadgeText, { color: accentColor }]}>{post.goal}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Engagement */}
      <View style={styles.engagement}>
        <Animated.View style={animatedReactStyle}>
          <Pressable
            style={styles.engageBtn}
            onPress={handleReact}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Flame
              size={18}
              color={post.userReacted ? '#D4AF37' : 'rgba(255,255,255,0.35)'}
              fill={post.userReacted ? '#D4AF37' : 'transparent'}
            />
            {hasReactions && (
              <Text style={[styles.engageCount, post.userReacted && styles.engageCountActive]}>
                {post.reactionCount}
              </Text>
            )}
          </Pressable>
        </Animated.View>

        <Pressable
          style={styles.engageBtn}
          onPress={() => setShowComments(!showComments)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MessageCircle
            size={18}
            color={showComments ? '#D4AF37' : 'rgba(255,255,255,0.35)'}
          />
          {hasComments && (
            <Text style={[styles.engageCount, showComments && styles.engageCountActive]}>
              {post.commentCount}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Comments */}
      {showComments && (
        <Animated.View entering={FadeIn.duration(150)} style={styles.commentsSection}>
          {post.comments && post.comments.length > 0 && (
            <View style={styles.commentsList}>
              {post.comments.slice(0, 3).map((comment, index) => {
                if (!comment.user || !comment.content || !isValidContent(comment.content)) return null;
                return (
                  <View key={comment.id || index} style={styles.commentItem}>
                    <Text style={styles.commentUser}>{comment.user}</Text>
                    <Text style={styles.commentText}>{comment.content}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Reply..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={commentText}
              onChangeText={setCommentText}
              onSubmitEditing={handleComment}
            />
            <Pressable
              style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
              onPress={handleComment}
              disabled={!commentText.trim()}
            >
              <Send size={14} color="#000" />
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Divider */}
      <View style={styles.divider} />
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.reactionCount === nextProps.post.reactionCount &&
    prevProps.post.commentCount === nextProps.post.commentCount &&
    prevProps.post.userReacted === nextProps.post.userReacted &&
    prevProps.post.comments?.length === nextProps.post.comments?.length
  );
});

const styles = StyleSheet.create({
  item: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: 20,
    paddingLeft: 28,
    marginHorizontal: 8,
    marginBottom: 12,
    position: 'relative',
  },

  // Vertical accent line on left
  accentLineWrap: {
    position: 'absolute',
    left: 12,
    top: 20,
    bottom: 20,
    width: 4,
  },

  accentLine: {
    flex: 1,
    width: 4,
    borderRadius: 2,
  },

  divider: {
    height: 0,
  },

  // Header - compact with avatar + username
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },

  avatarWrap: {
    marginRight: 2,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
  },

  avatarEmoji: {
    fontSize: 16,
  },

  headerText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },

  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F5F5F5',
  },

  challengeChip: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },

  challengeChipText: {
    fontSize: 10,
    color: '#D4AF37',
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Content
  content: {
    marginBottom: 12,
  },

  checkinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F0F0F0',
    flex: 1,
  },

  postText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
    marginBottom: 8,
  },

  mediaWrap: {
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },

  media: {
    width: '100%',
    height: 240,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },

  caption: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
    lineHeight: 20,
  },

  // Meta info row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },

  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  metaBadgeText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },

  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },

  goalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  goalBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  timeText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
  },

  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  metaText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },

  // Engagement
  engagement: {
    flexDirection: 'row',
    gap: 20,
  },

  engageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },

  engageCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },

  engageCountActive: {
    color: '#D4AF37',
  },

  // Comments
  commentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },

  commentsList: {
    marginBottom: 12,
  },

  commentItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  commentUser: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F5F5F5',
    marginRight: 8,
  },

  commentText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    flex: 1,
    lineHeight: 18,
  },

  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#fff',
  },

  sendBtn: {
    backgroundColor: '#D4AF37',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sendBtnDisabled: {
    opacity: 0.25,
  },

  // Celebration
  celebrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },

  celebrationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212,175,55,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  celebrationIcon: {
    fontSize: 20,
  },

  celebrationContent: {
    flex: 1,
  },

  celebrationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },

  goldText: {
    color: '#D4AF37',
    fontWeight: '700',
  },
});

export default UnifiedPostCardTimeline;
