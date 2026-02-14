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
import { Post } from '../../../state/slices/socialSlice';
import Svg, { Path, Polyline, Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface TextPostCardProps {
  post: Post;
  onReact?: (postId: string, emoji: string) => void;
  onComment?: (postId: string, text: string) => void;
  onProfilePress?: (userId: string) => void;
}

export const TextPostCard: React.FC<TextPostCardProps> = ({
  post,
  onReact,
  onComment,
  onProfilePress,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const scale = useSharedValue(1);

  const {
    id,
    user,
    userId,
    avatar,
    type,
    content,
    time,
    timestamp,
    actionTitle,
    goal,
    goalColor,
    streak,
    reactions,
    userReacted,
    reactionCount = 0,
    commentCount = 0,
    comments,
    photoUri,
    mediaUrl,
    visibility,
  } = post;

  const isCheckin = type === 'checkin' || !!actionTitle;
  const isPhoto = type === 'photo' || !!mediaUrl;
  const hasStreak = streak && streak > 0;
  const hasReactions = reactionCount > 0;
  const hasComments = commentCount > 0;

  const animatedReactStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleReact = () => {
    if (!onReact) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(
      withTiming(1.3, { duration: 80 }),
      withSpring(1, { damping: 10 })
    );
    onReact(id, '🔥');
  };

  const handleComment = () => {
    if (!commentInput.trim() || !onComment) return;
    onComment(id, commentInput);
    setCommentInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleProfilePress = () => {
    if (userId && onProfilePress) {
      onProfilePress(userId);
    }
  };

  const formatTime = (): string => {
    if (!time && !timestamp) return 'Just now';
    if (time) return time;

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

    const month = postDate.toLocaleDateString('en-US', { month: 'short' });
    const day = postDate.getDate();
    return `${month} ${day}`;
  };

  const getActionEmoji = (action: string): string => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('meditat')) return '🧘';
    if (lowerAction.includes('journal')) return '📝';
    if (lowerAction.includes('read')) return '📖';
    if (lowerAction.includes('exercise') || lowerAction.includes('workout')) return '💪';
    if (lowerAction.includes('water')) return '💧';
    if (lowerAction.includes('sleep')) return '😴';
    return '✓';
  };

  const parseContent = (text: string) => {
    if (!text) return null;

    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return (
          <Text key={index} style={styles.contentBold}>
            {boldText}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  const engagementAvatars = ['😊', '👏', '🎉'];

  return (
    <View style={styles.card}>
      {/* Header Row */}
      <View style={styles.header}>
        <Pressable onPress={handleProfilePress} style={styles.avatarWrapper}>
          <View style={[styles.avatar, hasStreak && styles.avatarStreak]}>
            {avatar && (avatar.startsWith('http') || avatar.startsWith('data:')) ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarEmoji}>{avatar || '👤'}</Text>
            )}
          </View>

          {hasStreak && (
            <LinearGradient
              colors={['#FF6B35', '#FF4500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.streakBadge}
            >
              <Text style={styles.streakBadgeText}>🔥 {streak}</Text>
            </LinearGradient>
          )}
        </Pressable>

        <View style={styles.postMeta}>
          <View style={styles.userRow}>
            <Text style={styles.username}>{user || 'User'}</Text>
            {goal && (
              <View style={styles.goalTag}>
                <Text style={styles.goalTagText}>{goal}</Text>
              </View>
            )}
          </View>
          <Text style={styles.timeRow}>
            {formatTime()} · {goal || 'Social'}
          </Text>
        </View>

        {/* More button hidden until implemented */}
      </View>

      {/* Check-in Card (Optional) */}
      {isCheckin && actionTitle && (
        <View style={styles.checkinCard}>
          <LinearGradient
            colors={['#D4AF37', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.6, y: 1 }}
            style={styles.checkinGlow}
          />

          <View style={styles.checkinIcon}>
            <Text style={styles.checkinIconEmoji}>
              {getActionEmoji(actionTitle)}
            </Text>
          </View>

          <View style={styles.checkinInfo}>
            <Text style={styles.checkinLabel}>COMPLETED</Text>
            <Text style={styles.checkinAction} numberOfLines={1}>
              {actionTitle}
            </Text>
          </View>

          <Text style={styles.checkMark}>✓</Text>
        </View>
      )}

      {/* Post Content */}
      {content && !isPhoto && (
        <View style={styles.contentSection}>
          <Text style={styles.postContent}>{parseContent(content)}</Text>
        </View>
      )}

      {/* Photo */}
      {isPhoto && (mediaUrl || photoUri) && (
        <View style={styles.mediaWrap}>
          <Image
            source={{ uri: mediaUrl || photoUri }}
            style={styles.media}
            resizeMode="cover"
          />
          {content && <Text style={styles.caption}>{content}</Text>}
        </View>
      )}

      {/* Engagement Row */}
      {hasReactions && (
        <View style={styles.engagementRow}>
          <Text style={styles.engagementText}>
            {userReacted
              ? `You and ${reactionCount > 1 ? `${reactionCount - 1} other${reactionCount > 2 ? 's' : ''}` : ''} reacted`
              : `${reactionCount} reaction${reactionCount !== 1 ? 's' : ''}`
            }
          </Text>
        </View>
      )}

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <Animated.View style={animatedReactStyle}>
          <Pressable
            style={styles.actionButton}
            onPress={handleReact}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                fill={userReacted ? 'rgba(255,107,53,0.15)' : 'none'}
                stroke={userReacted ? '#FF6B35' : 'rgba(255,255,255,0.6)'}
                strokeWidth={2}
              />
              <Path
                d="M15.5 11c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"
                fill={userReacted ? '#FF6B35' : 'rgba(255,255,255,0.6)'}
              />
            </Svg>
            {userReacted && hasReactions && (
              <Text style={styles.reactTextActive}>🔥 {reactionCount}</Text>
            )}
            {!userReacted && hasReactions && (
              <Text style={styles.reactText}>{reactionCount}</Text>
            )}
          </Pressable>
        </Animated.View>

        <Pressable
          style={styles.actionButton}
          onPress={() => setShowComments(!showComments)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth={2}
            />
          </Svg>
          {hasComments && (
            <Text style={styles.commentText}>{commentCount}</Text>
          )}
        </Pressable>

        <View style={styles.spacer} />
      </View>

      {/* Comment Section */}
      {showComments && (
        <View style={styles.commentPreview}>
          {hasComments && comments && comments.length > 0 && (
            <>
              <View style={styles.commentItem}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarEmoji}>
                    {comments[0].avatar || '👤'}
                  </Text>
                </View>

                <View style={styles.commentBubble}>
                  <Text style={styles.commentUser}>
                    {comments[0].user || 'User'}
                  </Text>
                  <Text style={styles.commentBubbleText}>
                    {comments[0].content}
                  </Text>
                </View>
              </View>

              {commentCount > 1 && (
                <Pressable onPress={() => setShowComments(true)}>
                  <Text style={styles.viewAllComments}>
                    View all {commentCount} comments
                  </Text>
                </Pressable>
              )}
            </>
          )}

          <View style={styles.commentInputRow}>
            <View style={styles.inputAvatar}>
              <Text style={styles.inputAvatarEmoji}>{avatar || '👤'}</Text>
            </View>

            <TextInput
              style={styles.inputField}
              placeholder="Add a comment..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={commentInput}
              onChangeText={setCommentInput}
              onSubmitEditing={handleComment}
              returnKeyType="send"
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 8,
    marginBottom: 8,
    padding: 20,
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    position: 'relative',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },

  avatarWrapper: {
    position: 'relative',
    flexShrink: 0,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  avatarStreak: {
    borderWidth: 2,
    borderColor: '#D4AF37',
    shadowColor: 'rgba(212, 175, 55, 0.2)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },

  avatarImage: {
    width: '100%',
    height: '100%',
  },

  avatarEmoji: {
    fontSize: 18,
  },

  streakBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0A0A0A',
    overflow: 'hidden',
  },

  streakBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  postMeta: {
    flex: 1,
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },

  username: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  goalTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },

  goalTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D4AF37',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  timeRow: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 2,
  },

  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  moreText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '700',
  },

  checkinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
    position: 'relative',
    overflow: 'hidden',
  },

  checkinGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.06,
  },

  checkinIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkinIconEmoji: {
    fontSize: 18,
  },

  checkinInfo: {
    flex: 1,
  },

  checkinLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },

  checkinAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  checkMark: {
    fontSize: 20,
    color: '#D4AF37',
  },

  contentSection: {
    marginBottom: 14,
  },

  postContent: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 23.25,
  },

  contentBold: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  mediaWrap: {
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
  },

  media: {
    width: '100%',
    height: 240,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },

  caption: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    lineHeight: 20,
  },

  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  engagementFaces: {
    flexDirection: 'row',
    marginRight: 6,
  },

  engagementFace: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  engagementFaceEmoji: {
    fontSize: 10,
  },

  engagementText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },

  engagementBold: {
    fontWeight: '700',
    color: '#FFFFFF',
  },

  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'transparent',
    marginRight: 8,
  },

  reactText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },

  reactTextActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B35',
  },

  commentText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },

  spacer: {
    flex: 1,
  },

  commentPreview: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },

  commentItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },

  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  commentAvatarEmoji: {
    fontSize: 14,
  },

  commentBubble: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },

  commentUser: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },

  commentBubbleText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },

  viewAllComments: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 10,
  },

  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  inputAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  inputAvatarEmoji: {
    fontSize: 14,
  },

  inputField: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
