import React, { useState, useEffect } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Dimensions, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient as SvgLinearGradient, Stop, RadialGradient, Polygon } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Post } from '../../state/slices/socialSlice';
import { isValidContent } from '../../utils/contentValidation';

const { width } = Dimensions.get('window');

// Design tokens
const T = {
  bgStart: "#0E0E10",
  bgEnd: "#151518",
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.62)",
  glassStroke: "rgba(255,255,255,0.06)",
  badgeStroke: "rgba(255,255,255,0.08)",
  badgeBgA: "rgba(255,255,255,0.10)",
  badgeBgB: "rgba(255,255,255,0.05)",
  goldA: "#F8E39A",
  goldB: "#E7B960",
  goldC: "#A87435",
  plateA: "#3B2A14",
  plateB: "#1A1209",
  coinFaceA: "#6B4A23",
  coinFaceB: "#2A1B0C",
  pointsText: "#FFE3B0",
};

interface LuxuryPostCardPremiumProps {
  post: Post;
  onReact: (id: string, emoji: string, which: 'circle' | 'follow') => void;
  onComment: (id: string, text: string, which: 'circle' | 'follow') => void;
  onProfilePress?: (userId: string) => void;
  delay?: number;
  feedView: string;
}

export const LuxuryPostCardPremium: React.FC<LuxuryPostCardPremiumProps> = ({ 
  post, 
  onReact, 
  onComment,
  onProfilePress, 
  delay = 0,
  feedView 
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const coinScale = useSharedValue(1);
  const coinGlow = useSharedValue(0);
  
  // Check post type variations
  const isChallenge = post.isChallenge || false;
  const hasGoal = !!post.goal || !!post.goalTitle;
  const isActivityCheckin = post.type === 'activity' || post.type === 'checkin';
  const isPremiumCard = (isChallenge || hasGoal) && isActivityCheckin;
  
  // Format timestamp
  const formatTimestamp = (time?: string) => {
    if (!time) return 'Today';

    const postTime = new Date(time);

    // Check if date is valid
    if (isNaN(postTime.getTime())) {
      return 'Today';
    }

    const now = new Date();
    const hours = postTime.getHours();
    const minutes = postTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    const timeStr = `${displayHours}:${displayMinutes} ${ampm}`;

    // Check if it's today
    const isToday = postTime.toDateString() === now.toDateString();
    if (isToday) {
      return `Today · ${timeStr}`;
    }

    // Check if it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (postTime.toDateString() === yesterday.toDateString()) {
      return `Yesterday · ${timeStr}`;
    }

    // Check if it's within the last week
    const daysAgo = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo < 7) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `${dayNames[postTime.getDay()]} · ${timeStr}`;
    }

    // Older than a week - show date
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[postTime.getMonth()]} ${postTime.getDate()} · ${timeStr}`;
  };
  
  const handleReact = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate coin
    coinScale.value = withSequence(
      withTiming(0.92, { duration: 70 }),
      withSpring(1, { damping: 12 })
    );
    coinGlow.value = withSequence(
      withTiming(1, { duration: 140 }),
      withTiming(0, { duration: 200 })
    );
    
    onReact(post.id, '🔥', feedView as 'circle' | 'follow');
  };
  
  const coinAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coinScale.value }],
  }));
  
  // If not a premium card (activity check-in), don't render
  if (!isPremiumCard) {
    return null;
  }
  
  // Extract action title for display
  const actionTitle = post.actionTitle || post.content || '';
  
  return (
    <View style={styles.cardWrapper}>
      {/* Silver metallic overlay for challenge cards */}
      {isChallenge && (
        <LinearGradient
          colors={['#C0C0C0', '#808080', '#C0C0C0']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.silverOverlay}
        />
      )}
      <LinearGradient 
        colors={['rgba(0,0,0,0.9)', 'rgba(15,15,15,0.95)']} 
        start={{x:0,y:0}} 
        end={{x:0,y:1}} 
        style={[styles.card, isChallenge && styles.cardWithOverlay]}
      >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerLeft}
          onPress={() => {
            const userId = post.userId || post.user_id || post.user;
            if (__DEV__) console.log('🔴 [LuxuryPostCardPremium] Profile click - postData:', {
              userId: post.userId,
              user_id: post.user_id,
              user: post.user,
              actualUserId: userId
            });
            onProfilePress?.(userId);
          }}
        >
          {post.avatar?.startsWith('http') || post.avatar?.startsWith('data:') ? (
            <Image source={{ uri: post.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarEmoji]}>
              <Text style={styles.avatarEmojiText}>{post.avatar || '👤'}</Text>
            </View>
          )}
          <View>
            <Text style={styles.name}>{post.user}</Text>
            <Text style={styles.time}>{formatTimestamp(post.timestamp || post.created_at)}</Text>
          </View>
        </Pressable>
        {isChallenge && (
          <LinearGradient 
            colors={[T.badgeBgA, T.badgeBgB]} 
            start={{x:0,y:0}} 
            end={{x:1,y:1}} 
            style={styles.badge}
          >
            <Text style={styles.badgeText}>🏆 {(post.challengeName && isValidContent(post.challengeName) ? post.challengeName : null) || 'CHALLENGE'}</Text>
          </LinearGradient>
        )}
      </View>

      {/* Body */}
      <View style={styles.bodyRow}>
        <GoldCheck size={36} />
        <View style={styles.textBlock}>
          <Text style={styles.title}>{isValidContent(actionTitle) ? actionTitle : ''}</Text>
          {hasGoal && (
            <Text style={styles.subtitle}>Goal: {(post.goal && isValidContent(post.goal) ? post.goal : null) || (post.goalTitle && isValidContent(post.goalTitle) ? post.goalTitle : null) || 'Personal growth'}</Text>
          )}
        </View>
        <Animated.View style={[styles.pointsWrap, coinAnimatedStyle]}>
          <Text style={styles.pointsText}>+5</Text>
        </Animated.View>
      </View>

      {/* Engagement Section */}
      <View style={styles.engagementSection}>
        <View style={styles.actionButtons}>
          <Pressable
            style={[styles.actionButton, post.userReacted && styles.actionButtonActive]}
            onPress={handleReact}
          >
            <Text style={styles.actionButtonIcon}>🔥</Text>
            <Text style={[styles.actionButtonText, post.userReacted && styles.actionButtonTextActive]}>
              {post.reactionCount || 0}
            </Text>
          </Pressable>
          
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowComments(!showComments);
            }}
          >
            <Text style={styles.actionButtonIcon}>💬</Text>
            <Text style={styles.actionButtonText}>
              {post.commentCount || 0}
            </Text>
          </Pressable>
        </View>
      </View>
      
      {/* Comments Section */}
      {showComments && (
        <View style={styles.commentsSection}>
          {/* Display existing comments */}
          {post.comments && post.comments.length > 0 && (
            <>
              {post.comments.map((comment, idx) => (
                <View key={idx} style={styles.commentItem}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {comment.userAvatar || comment.user?.charAt(0) || '💬'}
                    </Text>
                  </View>
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentAuthor}>{comment.user}</Text>
                    <Text style={styles.commentText}>{(comment.content && isValidContent(comment.content) ? comment.content : null) || (comment.text && isValidContent(comment.text) ? comment.text : null)}</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Comment input */}
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add support..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={commentText}
              onChangeText={setCommentText}
              onSubmitEditing={() => {
                if (commentText.trim()) {
                  onComment(post.id, commentText.trim(), feedView as 'circle' | 'follow');
                  setCommentText('');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              returnKeyType="send"
            />
            <Pressable
              style={styles.sendButton}
              onPress={() => {
                if (commentText.trim()) {
                  onComment(post.id, commentText.trim(), feedView as 'circle' | 'follow');
                  setCommentText('');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </Pressable>
          </View>
        </View>
      )}
      </LinearGradient>
    </View>
  );
};

// GoldCheck SVG Component
function GoldCheck({size=96}:{size?:number}) {
  const scale = size / 96; // Scale factor based on default size
  
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <Defs>
        <SvgLinearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFD700" />
          <Stop offset="100%" stopColor="#FFA500" />
        </SvgLinearGradient>
      </Defs>
      {/* Simple classic checkmark - clean and bold */}
      <Path 
        d="M 30 48 L 42 60 L 66 36" 
        stroke="url(#goldGradient)" 
        strokeWidth={6} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none" 
      />
    </Svg>
  );
}

// Coin SVG Component
function Coin() {
  return (
    <Svg 
      width={20} 
      height={20} 
      viewBox="0 0 64 64" 
      style={{
        shadowColor:"#FFBA49", 
        shadowOffset:{width:0,height:6}, 
        shadowOpacity:0.35, 
        shadowRadius:12, 
        elevation:8
      }}
    >
      <Defs>
        <SvgLinearGradient id="c_ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={T.goldA} />
          <Stop offset="50%" stopColor={T.goldB} />
          <Stop offset="100%" stopColor={T.goldC} />
        </SvgLinearGradient>
        <RadialGradient id="c_face" cx="35%" cy="30%" r="80%">
          <Stop offset="0%" stopColor={T.coinFaceA} />
          <Stop offset="100%" stopColor={T.coinFaceB} />
        </RadialGradient>
      </Defs>
      <Circle cx="32" cy="32" r="22" fill="url(#c_face)" />
      <Circle cx="32" cy="32" r="28" stroke="url(#c_ring)" strokeWidth="5" fill="none" />
      <Circle cx="32" cy="32" r="12" stroke="url(#c_ring)" strokeWidth="4" fill="none" />
      <Polygon points="32,22 37,32 27,32" fill="url(#c_ring)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 12,
    position: 'relative',
  },
  silverOverlay: {
    position: 'absolute',
    top: -1.5,
    left: -1.5,
    right: -1.5,
    bottom: -1.5,
    borderRadius: 21,
    opacity: 0.4,
    zIndex: 1,
  },
  card: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 2,
  },
  cardWithOverlay: {
    borderColor: 'transparent',
  },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between" 
  },
  headerLeft: { 
    flexDirection: "row", 
    alignItems: "center", 
    columnGap: 10 
  },
  avatar: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: "rgba(255,255,255,0.10)" 
  },
  avatarEmoji: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmojiText: {
    fontSize: 16,
  },
  name: { 
    color: T.textPrimary, 
    fontSize: 14, 
    fontWeight: "600" 
  },
  time: { 
    color: T.textSecondary, 
    fontSize: 11, 
    marginTop: 1 
  },
  badge: { 
    height: 26, 
    paddingHorizontal: 10, 
    borderRadius: 999, 
    borderWidth: 1, 
    borderColor: T.badgeStroke, 
    justifyContent: "center" 
  },
  badgeText: { 
    color: "rgba(255,255,255,0.90)", 
    fontSize: 10, 
    fontWeight: "600", 
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  bodyRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginTop: 14 
  },
  textBlock: { 
    flex: 1, 
    marginLeft: 12 
  },
  title: { 
    color: T.textPrimary, 
    fontSize: 14, 
    fontWeight: "600"
  },
  subtitle: { 
    color: T.textSecondary, 
    fontSize: 13, 
    marginTop: 4 
  },
  pointsWrap: { 
    flexDirection: "row", 
    alignItems: "center", 
    columnGap: 6, 
    alignSelf: "flex-end" 
  },
  pointsText: { 
    color: T.pointsText, 
    fontSize: 12, 
    fontWeight: "600" 
  },
  engagementSection: {
    padding: 16,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderColor: 'rgba(255,215,0,0.3)',
  },
  actionButtonIcon: {
    fontSize: 14,
  },
  actionButtonText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  actionButtonTextActive: {
    color: '#FFD700',
  },
  commentsSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    fontSize: 12,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 8,
    paddingHorizontal: 12,
  },
  commentAuthor: {
    fontSize: 12,
    color: T.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 13,
    color: T.textSecondary,
    lineHeight: 18,
  },
  commentInputContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: T.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sendButton: {
    backgroundColor: T.goldA,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
});