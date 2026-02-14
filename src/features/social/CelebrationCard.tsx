import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { Trophy, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface CelebrationCardProps {
  userName: string;
  userAvatar?: string;
  timestamp: string;
  streak?: number;
}

export const CelebrationCard: React.FC<CelebrationCardProps> = ({
  userName,
  userAvatar,
  timestamp,
  streak = 0,
}) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const goldShimmer = useSharedValue(0);

  useEffect(() => {
    // Trigger haptic feedback when card appears
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate the trophy
    scale.value = withRepeat(
      withSequence(
        withSpring(1.1, { damping: 8 }),
        withSpring(1, { damping: 8 })
      ),
      3,
      false
    );

    // Rotate sparkles
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 8000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Shimmer effect
    goldShimmer.value = withRepeat(
      withTiming(1, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + goldShimmer.value * 0.3,
  }));

  return (
    <Animated.View
      entering={ZoomIn.duration(600).springify()}
      style={styles.container}
    >
      {/* Background gradient */}
      <LinearGradient
        colors={['#FFD700', '#FFA500', '#FF8C00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Blur overlay for glass effect */}
      <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFillObject} />

      {/* Dark overlay for contrast */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />

      {/* Animated sparkles background */}
      <Animated.View style={[styles.sparklesContainer, sparkleStyle]}>
        <Sparkles size={200} color="rgba(255,255,255,0.1)" />
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        {/* Trophy icon */}
        <Animated.View style={[styles.trophyContainer, trophyStyle]}>
          <LinearGradient
            colors={['#FFD700', '#FFC700']}
            style={styles.trophyGradient}
          >
            <Trophy size={24} color="#FFF" />
          </LinearGradient>
        </Animated.View>

        {/* Main message */}
        <View style={styles.messageContainer}>
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <View style={styles.textWrapper}>
            <Text style={styles.mainText}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.achievement}> crushed it!</Text>
            </Text>
            <Text style={styles.subtitleText}>100% Daily Complete</Text>
          </View>
        </View>

        {/* 100% badge */}
        <Animated.View style={[styles.badgeContainer, shimmerStyle]}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.badge}
          >
            <Text style={styles.badgeText}>100%</Text>
          </LinearGradient>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 120,
  },
  sparklesContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -100,
    marginTop: -100,
  },
  content: {
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trophyContainer: {
    marginRight: 12,
  },
  trophyGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  messageContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  celebrationEmoji: {
    fontSize: 18,
    marginHorizontal: 4,
  },
  mainText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  userName: {
    color: '#FFD700',
    fontWeight: '800',
  },
  achievement: {
    color: '#FFFFFF',
  },
  textWrapper: {
    flexDirection: 'column',
  },
  subtitleText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  badgeContainer: {
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
  },
});