import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface LuxuryGradientBackgroundProps {
  variant?: 'gold' | 'silver' | 'mixed';
  children?: React.ReactNode;
}

export const LuxuryGradientBackground: React.FC<LuxuryGradientBackgroundProps> = ({
  variant = 'mixed',
  children,
}) => {
  const shimmer = useSharedValue(0);
  const glow = useSharedValue(0);

  const getColors = () => {
    switch (variant) {
      case 'gold':
        return {
          base: ['#000000', '#0A0A0A', '#000000'],
          shimmer: ['rgba(255, 215, 0, 0.1)', 'rgba(255, 215, 0, 0.05)', 'transparent'],
        };
      case 'silver':
        return {
          base: ['#000000', '#141414', '#000000'],
          shimmer: ['rgba(192, 192, 192, 0.1)', 'rgba(192, 192, 192, 0.05)', 'transparent'],
        };
      case 'mixed':
      default:
        return {
          base: ['#000000', '#0A0A0A', '#000000'],
          shimmer: ['rgba(255, 215, 0, 0.08)', 'rgba(192, 192, 192, 0.08)', 'transparent'],
        };
    }
  };

  const colors = getColors();

  useEffect(() => {
    // Subtle shimmer effect
    shimmer.value = withRepeat(
      withTiming(1, {
        duration: 6000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    // Gentle glow pulse
    glow.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 3000 }),
        withTiming(0, { duration: 3000 })
      ),
      -1
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
    transform: [
      {
        translateX: interpolate(
          shimmer.value,
          [0, 1],
          [-width, width]
        ),
      },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Base black gradient */}
      <LinearGradient
        colors={colors.base}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Subtle shimmer overlay */}
      <AnimatedLinearGradient
        colors={colors.shimmer}
        style={[StyleSheet.absoluteFillObject, shimmerStyle]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      />

      {/* Gold/Silver accent spots */}
      <Animated.View style={[styles.accentContainer, glowStyle]}>
        <View style={[styles.accentOrb, styles.topLeft]}>
          <LinearGradient
            colors={variant === 'silver' 
              ? ['rgba(192, 192, 192, 0.15)', 'transparent']
              : ['rgba(255, 215, 0, 0.15)', 'transparent']
            }
            style={styles.orbGradient}
          />
        </View>
        <View style={[styles.accentOrb, styles.bottomRight]}>
          <LinearGradient
            colors={variant === 'gold'
              ? ['rgba(255, 215, 0, 0.15)', 'transparent']
              : ['rgba(192, 192, 192, 0.15)', 'transparent']
            }
            style={styles.orbGradient}
          />
        </View>
      </Animated.View>

      {/* Subtle texture overlay */}
      <View style={styles.textureOverlay} />

      {/* Content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  accentContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  accentOrb: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
  },
  topLeft: {
    top: -width * 0.3,
    left: -width * 0.3,
  },
  bottomRight: {
    bottom: -width * 0.3,
    right: -width * 0.3,
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.3,
  },
  textureOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    opacity: 0.02,
    // This creates a subtle texture effect
    borderStyle: 'dotted',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.02)',
  },
});