import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LuxuryTheme } from '../../design/luxuryTheme';

const { width, height } = Dimensions.get('window');

interface GradientBackgroundProps {
  children: React.ReactNode;
  variant?: 'radial' | 'linear';
  animated?: boolean;
  colors?: string[];
}

/**
 * GradientBackground - Provides depth and immersion with subtle gradients
 * Visual-only component that enhances background depth
 */
export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  variant = 'radial',
  animated = true,
  colors = LuxuryTheme.gradientPresets.radialGradient,
}) => {
  const breathAnim = useSharedValue(0);

  React.useEffect(() => {
    if (animated) {
      breathAnim.value = withRepeat(
        withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breathAnim.value, [0, 1], [0.8, 1]),
  }));

  if (variant === 'radial') {
    return (
      <View style={styles.container}>
        {/* Base gradient */}
        <LinearGradient
          colors={colors}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        
        {/* Radial overlay for depth */}
        <Animated.View style={[styles.radialOverlay, animated && animatedStyle]} pointerEvents="none">
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 0, y: 1 }}
          />
        </Animated.View>
        
        {children}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuxuryTheme.colors.background.primary,
  },
  radialOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
});