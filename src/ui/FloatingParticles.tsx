import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

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

interface FloatingParticlesProps {
  colors?: string[];
  particleCount?: number;
}

const AnimatedParticle: React.FC<{ particle: Particle }> = ({ particle }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(-height - 100, {
          duration: particle.duration,
          easing: Easing.linear,
        }),
        -1
      )
    );

    translateX.value = withRepeat(
      withSequence(
        withTiming(20, { duration: particle.duration / 4 }),
        withTiming(-20, { duration: particle.duration / 2 }),
        withTiming(0, { duration: particle.duration / 4 })
      ),
      -1
    );

    opacity.value = withDelay(
      particle.delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 2000 }),
          withTiming(0.3, { duration: 2000 })
        ),
        -1
      )
    );

    scale.value = withDelay(
      particle.delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 3000 }),
          withTiming(0.8, { duration: 3000 })
        ),
        -1
      )
    );

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(translateX);
      cancelAnimation(opacity);
      cancelAnimation(scale);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        animatedStyle,
        {
          left: particle.x,
          bottom: particle.y,
          width: particle.size,
          height: particle.size,
          backgroundColor: particle.color,
          shadowColor: particle.color,
        },
      ]}
    />
  );
};

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  colors = ['#FF006E', '#00D4FF', '#06FFA5', '#8B5CF6', '#FB8500'],
  particleCount = 20,
}) => {
  const particles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    y: Math.random() * -height,
    size: Math.random() * 6 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 5000,
    duration: Math.random() * 10000 + 15000,
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
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
});