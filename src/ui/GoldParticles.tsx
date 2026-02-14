import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
}

interface GoldParticlesProps {
  variant?: 'gold' | 'silver' | 'mixed';
  particleCount?: number;
}

const AnimatedParticle: React.FC<{ particle: Particle }> = ({ particle }) => {
  const float = useSharedValue(0);
  const opacity = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    // Gentle floating motion
    float.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(1, {
          duration: particle.duration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );

    // Fade in and out
    opacity.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(1, {
          duration: particle.duration / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );

    // Shimmer effect
    shimmer.value = withRepeat(
      withTiming(1, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          float.value,
          [0, 1],
          [0, -30]
        ),
      },
      {
        translateX: interpolate(
          float.value,
          [0, 0.5, 1],
          [0, 10, 0]
        ),
      },
    ],
    opacity: interpolate(
      opacity.value,
      [0, 0.5, 1],
      [0.3, 0.8, 0.3]
    ),
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(
      shimmer.value,
      [0, 1],
      [0.5, 1]
    ),
    shadowRadius: interpolate(
      shimmer.value,
      [0, 1],
      [particle.size / 2, particle.size]
    ),
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        animatedStyle,
        shimmerStyle,
        {
          left: particle.x,
          top: particle.y,
          width: particle.size,
          height: particle.size,
          backgroundColor: particle.color,
          shadowColor: particle.color,
        },
      ]}
    />
  );
};

export const GoldParticles: React.FC<GoldParticlesProps> = ({
  variant = 'mixed',
  particleCount = 15,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'gold':
        return ['#FFD700', '#F7E7CE', '#FFD700'];
      case 'silver':
        return ['#C0C0C0', '#E5E4E2', '#C0C0C0'];
      case 'mixed':
      default:
        return ['#FFD700', '#C0C0C0', '#F7E7CE', '#E5E4E2'];
    }
  };

  const colors = getColors();
  
  const particles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 3 + 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 3000,
    duration: Math.random() * 5000 + 8000,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <AnimatedParticle key={particle.id} particle={particle} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    borderRadius: 999,
    shadowOffset: { width: 0, height: 0 },
  },
});