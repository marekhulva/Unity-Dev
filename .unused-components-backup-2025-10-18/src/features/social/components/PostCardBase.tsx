import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Post } from '../../../../state/slices/socialSlice';

interface PostCardBaseProps {
  post: Post;
  children: React.ReactNode;
  onReact: (emoji: string) => void;
  borderColor?: string;
  glowColor?: string;
}

export const PostCardBase: React.FC<PostCardBaseProps> = ({
  post,
  children,
  onReact,
  borderColor = 'rgba(255,215,0,0.2)',
  glowColor = 'rgba(255,215,0,0.15)',
}) => {
  const scale = useSharedValue(1);
  const glowIntensity = useSharedValue(0);

  React.useEffect(() => {
    // Entrance animation
    scale.value = withSpring(1, { from: 0.95 });
    glowIntensity.value = withTiming(1, { duration: 500 });
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: interpolate(glowIntensity.value, [0, 1], [0, 0.3]),
    shadowRadius: interpolate(glowIntensity.value, [0, 1], [10, 20]),
  }));

  const handlePress = () => {
    scale.value = withSpring(0.98, {}, () => {
      scale.value = withSpring(1);
    });
  };

  // Calculate avatar ring intensity based on streak
  const streakIntensity = post.streak ? Math.min(post.streak / 30, 1) : 0;

  return (
    <Animated.View 
      style={[
        styles.container, 
        cardAnimatedStyle,
        { shadowColor: glowColor }
      ]}
    >
      {/* Glow ring */}
      <LinearGradient
        colors={[glowColor, 'transparent']}
        style={styles.glowRing}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Pressable onPress={handlePress}>
        <BlurView intensity={20} tint="dark" style={[styles.card, { borderColor }]}>
          <LinearGradient
            colors={['rgba(255,215,0,0.03)', 'rgba(0,0,0,0.5)']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              {/* Avatar with streak ring */}
              <View style={styles.avatarContainer}>
                {streakIntensity > 0 && (
                  <LinearGradient
                    colors={['#FFD700', '#F7E7CE', '#FFD700']}
                    style={[styles.streakRing, { opacity: streakIntensity }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                )}
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{post.avatar || '👤'}</Text>
                </View>
              </View>

              <View style={styles.userMeta}>
                <Text style={styles.userName}>{post.user}</Text>
                <Text style={styles.time}>{post.time}</Text>
              </View>
            </View>

            {/* Goal badge if present */}
            {post.goal && (
              <View style={[styles.goalBadge, { backgroundColor: `${post.goalColor}20` }]}>
                <Text style={[styles.goalText, { color: post.goalColor || '#FFD700' }]}>
                  {post.goal}
                </Text>
              </View>
            )}
          </View>

          {/* Content (passed as children) */}
          <View style={styles.content}>
            {children}
          </View>

          {/* Reactions and engagement */}
          <View style={styles.engagement}>
            <View style={styles.reactions}>
              {Object.entries(post.reactions).map(([emoji, count]) => (
                <Pressable
                  key={emoji}
                  onPress={() => onReact(emoji)}
                  style={styles.reactionButton}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  <Text style={styles.reactionCount}>{count}</Text>
                </Pressable>
              ))}
              
              {/* Add reaction button */}
              <Pressable
                onPress={() => onReact('👏')}
                style={styles.addReaction}
              >
                <Text style={styles.addReactionText}>+</Text>
              </Pressable>
            </View>

            {/* Comments count */}
            {post.comments && (
              <View style={styles.comments}>
                <Text style={styles.commentCount}>{post.comments} comments</Text>
              </View>
            )}
          </View>

          {/* Social proof */}
          {post.socialProof?.inspired && (
            <View style={styles.socialProof}>
              <Text style={styles.socialProofText}>
                💫 {post.socialProof.inspired} people boosted their streak after seeing this
              </Text>
            </View>
          )}
        </BlurView>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    opacity: 0.4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarContainer: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  streakRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 2,
    left: 2,
  },
  avatarText: {
    fontSize: 18,
  },
  userMeta: {
    gap: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  time: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  goalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  goalText: {
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  engagement: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  reactions: {
    flexDirection: 'row',
    gap: 8,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,215,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: '600',
  },
  addReaction: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(192,192,192,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(192,192,192,0.2)',
  },
  addReactionText: {
    fontSize: 16,
    color: '#C0C0C0',
  },
  comments: {
    paddingHorizontal: 8,
  },
  commentCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  socialProof: {
    backgroundColor: 'rgba(255,215,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,215,0,0.1)',
  },
  socialProofText: {
    fontSize: 11,
    color: '#F7E7CE',
    textAlign: 'center',
  },
});