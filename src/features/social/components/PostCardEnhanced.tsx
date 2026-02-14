import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Post } from '../../../state/slices/socialSlice';
import { isValidContent } from '../../../utils/contentValidation';

interface PostCardEnhancedProps {
  post: Post;
  onReact: (emoji: string) => void;
}

export const PostCardEnhanced: React.FC<PostCardEnhancedProps> = ({ post, onReact }) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  const pulse = () => Animated.sequence([
    Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }), 
    Animated.spring(scale, { toValue: 1, useNativeDriver: true })
  ]).start();

  // Dynamic gradient colors based on post type - luxury theme
  const getRingColors = () => {
    if (post.type === 'checkin') return ['rgba(255,215,0,0.2)', 'rgba(247,231,206,0.15)']; // Gold
    if (post.type === 'status') return ['rgba(192,192,192,0.2)', 'rgba(229,228,226,0.15)']; // Silver
    return ['rgba(255,215,0,0.15)', 'rgba(192,192,192,0.15)']; // Mixed gold/silver
  };

  const ringColors = getRingColors();

  return (
    <View style={styles.cardWrapper}>
      {/* Glow effect */}
      <LinearGradient
        colors={ringColors}
        style={styles.glowRing}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Main card */}
      <BlurView intensity={20} tint="dark" style={styles.card}>
        <LinearGradient
          colors={['rgba(255,215,0,0.03)', 'rgba(255,255,255,0.02)']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={ringColors}
                style={styles.avatarGlow}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>{post.avatar ?? '👤'}</Text>
              </View>
            </View>
            <View>
              <Text style={styles.userName}>{post.user ?? 'User'}</Text>
              <Text style={styles.time}>{post.time}</Text>
            </View>
          </View>

          {/* Goal pill */}
          {post.goal && isValidContent(post.goal) && (
            <View style={styles.goalPill}>
              <Text style={styles.goalText}>{post.goal}</Text>
            </View>
          )}
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Check-in banner */}
          {post.type === 'checkin' && (
            <View style={styles.checkinBanner}>
              <View style={styles.checkinContent}>
                <Text style={styles.checkinText}>✅ {isValidContent(post.actionTitle) ? post.actionTitle : ''}</Text>
                {typeof post.streak === 'number' && (
                  <Text style={styles.streakText}>🔥 {post.streak} day streak</Text>
                )}
              </View>
            </View>
          )}

          {/* Goal announcement */}
          {post.type === 'goal' && (
            <View style={styles.goalBanner}>
              <Text style={styles.goalAnnouncement}>
                🎯 New Goal: <Text style={styles.goalEmphasis}>{isValidContent(post.goal) ? post.goal : ''}</Text>
              </Text>
            </View>
          )}

          {/* Content text */}
          {post.content && isValidContent(post.content) && (
            <Text style={styles.content}>{post.content}</Text>
          )}

          {/* Media indicators */}
          {post.photoUri && (
            <Image source={{ uri: post.photoUri }} style={styles.photo} />
          )}
          {post.audioUri && (
            <View style={styles.mediaChip}>
              <Text style={styles.mediaText}>🎙️ Audio Attached</Text>
            </View>
          )}
        </View>

        {/* Reactions */}
        <Animated.View style={[styles.reactions, { transform: [{ scale }] }]}>
          <View style={styles.reactionButtons}>
            <Pressable
              onPress={() => {
                pulse();
                onReact('🔥');
              }}
              style={({ pressed }) => [
                styles.reactionButton,
                pressed && styles.reactionButtonPressed,
                post.userReacted && styles.reactionButtonActive
              ]}
            >
              <Text style={[
                styles.reactionText,
                post.userReacted && styles.reactionTextActive
              ]}>
                🔥 {post.reactions?.['🔥'] ?? 0}
              </Text>
            </Pressable>
          </View>
          <Pressable 
            style={styles.commentButton}
            onPress={() => {
              // TODO: Implement comment functionality
              if (__DEV__) console.log('Comment pressed for post:', post.id);
            }}
          >
            <Text style={styles.commentText}>💬 Comment</Text>
          </Pressable>
        </Animated.View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  glowRing: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 16,
    opacity: 0.3,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(192,192,192,0.08)',
    padding: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    opacity: 0.7,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 18,
  },
  userName: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 16,
  },
  time: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  goalPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  goalText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    marginTop: 12,
    gap: 12,
  },
  checkinBanner: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
    backgroundColor: 'rgba(255,215,0,0.05)',
    padding: 12,
  },
  checkinContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkinText: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  streakText: {
    color: '#FFD700',
    fontSize: 12,
  },
  goalBanner: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  goalAnnouncement: {
    color: '#F7E7CE',
    fontSize: 14,
  },
  goalEmphasis: {
    fontWeight: '600',
  },
  content: {
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
    marginTop: 4,
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginTop: 8,
  },
  mediaChip: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(192,192,192,0.1)',
    backgroundColor: 'rgba(192,192,192,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mediaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  reactions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reactionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  reactionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,215,0,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
  },
  reactionButtonPressed: {
    backgroundColor: 'rgba(255,215,0,0.15)',
  },
  reactionButtonActive: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderColor: 'rgba(255,215,0,0.4)',
  },
  reactionText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  reactionTextActive: {
    color: '#FFD700',
  },
  commentButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(192,192,192,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(192,192,192,0.1)',
  },
  commentText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
});