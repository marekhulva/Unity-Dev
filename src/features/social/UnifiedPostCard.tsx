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
import { MessageCircle, Send, Check, Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Post } from '../../state/slices/socialSlice';
import { isValidContent } from '../../utils/contentValidation';

interface UnifiedPostCardProps {
  post: Post;
  onReact: (id: string, emoji: string) => void;
  onComment: (id: string, text: string) => void;
  onProfilePress?: (userId: string) => void;
}

export const UnifiedPostCard: React.FC<UnifiedPostCardProps> = React.memo(({
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

  // Debug logging for photo posts
  if (post.mediaUrl && __DEV__) {
    console.log('📸 [POST-CARD] Rendering post with media - type:', post.type, 'isPhoto:', isPhoto, 'mediaUrl:', post.mediaUrl.substring(0, 50), 'photoUri:', post.photoUri?.substring(0, 50));
  }

  // Derive postType for visual differentiation
  type FeedPostType = 'ACTIVITY_CHALLENGE' | 'ACTIVITY_PERSONAL' | 'REGULAR_POST';
  const postType: FeedPostType = isCheckin
    ? (isChallenge ? 'ACTIVITY_CHALLENGE' : 'ACTIVITY_PERSONAL')
    : 'REGULAR_POST';
  const isActivityChallenge = postType === 'ACTIVITY_CHALLENGE';

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

  // Celebration - minimal inline style
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
                <View style={[styles.goalDot, { backgroundColor: post.goalColor || '#10B981' }]} />
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
      {/* Left accent rail for Challenge activity posts - inset capsule */}
      {isActivityChallenge && (
        <View style={styles.accentRailWrap}>
          <LinearGradient
            colors={['#E5C158', '#B8962E']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.accentRail}
          />
        </View>
      )}

      {/* Header row */}
      <View style={styles.header}>
        <Pressable
          onPress={() => post.userId && onProfilePress?.(post.userId)}
          style={styles.avatarWrap}
        >
          <View style={[styles.avatar, isActivityChallenge && styles.avatarGold]}>
            {post.avatar && (post.avatar.startsWith('http') || post.avatar.startsWith('data:')) ? (
              <Image source={{ uri: post.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarEmoji}>{post.avatar || '👤'}</Text>
            )}
          </View>
        </Pressable>

        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{post.user}</Text>
            {isActivityChallenge && (
              <View style={styles.challengeChip}>
                <Text style={styles.challengeChipText}>
                  🏆 {(post.challengeName && isValidContent(post.challengeName) ? post.challengeName : null) || 'Challenge'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.timeText}>{formatTime(post.time)}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isCheckin && (
          <View style={styles.checkinRow}>
            <View style={styles.checkIcon}>
              <Check size={14} color="#000" strokeWidth={3} />
            </View>
            <Text style={styles.actionTitle}>{(post.actionTitle && isValidContent(post.actionTitle) ? post.actionTitle : null) || 'Completed action'}</Text>
          </View>
        )}

        {post.content && isValidContent(post.content) && !isCheckin && (
          <Text style={styles.postText}>{post.content}</Text>
        )}

        {isPhoto && post.mediaUrl && (
          <View style={styles.mediaWrap}>
            <Image
              source={{ uri: post.mediaUrl }}
              style={styles.media}
              resizeMode="cover"
            />
          </View>
        )}

        {isPhoto && post.content && isValidContent(post.content) && (
          <Text style={styles.caption}>{post.content}</Text>
        )}

        {post.goal && isValidContent(post.goal) && !isCheckin && (
          <View style={styles.goalRow}>
            <View style={[styles.goalDot, { backgroundColor: post.goalColor || '#10B981' }]} />
            <Text style={styles.metaText}>{post.goal}</Text>
          </View>
        )}
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
});

const styles = StyleSheet.create({
  // Card container with background and border (matches Profile activity cards)
  item: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 8,
    marginBottom: 12,
    position: 'relative',
  },

  // Left accent rail wrapper - positions the capsule
  accentRailWrap: {
    position: 'absolute',
    left: 4,
    top: 12,
    bottom: 12,
    width: 4,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },

  // Accent rail gradient capsule
  accentRail: {
    flex: 1,
    width: 4,
    borderRadius: 10,
  },

  // Divider line (hidden now that we have card borders)
  divider: {
    height: 0,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  avatarWrap: {
    marginRight: 12,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  avatarGold: {
    borderWidth: 2,
    borderColor: '#D4AF37',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
  },

  avatarEmoji: {
    fontSize: 20,
  },

  headerText: {
    flex: 1,
    paddingTop: 2,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },

  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F5F5F5',
  },

  // Premium challenge chip
  challengeChip: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },

  challengeChipText: {
    fontSize: 10,
    color: 'rgba(212,175,55,0.7)',
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  timeText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 2,
  },

  // Content
  content: {
    marginBottom: 12,
  },

  checkinRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D4AF37',
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
  },

  mediaWrap: {
    marginTop: 12,
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
    marginTop: 10,
    lineHeight: 20,
  },

  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  goalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },

  metaText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },

  // Engagement - minimal
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

  // Celebration - inline minimal
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

export default UnifiedPostCard;
