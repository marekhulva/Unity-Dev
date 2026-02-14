import React from 'react';
import { View, StyleSheet } from 'react-native';
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

interface NeonDividerProps {
  animated?: boolean;
  color?: string;
  thickness?: number;
  margin?: number;
}

export const NeonDivider: React.FC<NeonDividerProps> = ({
  animated = true,
  color = LuxuryTheme.colors.primary.gold,
  thickness = 1,
  margin = 16,
}) => {
  const glowAnim = useSharedValue(0);

  React.useEffect(() => {
    if (animated) {
      glowAnim.value = withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [animated]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnim.value, [0, 1], [0.3, 0.8]),
  }));

  return (
    <View style={[styles.container, { marginVertical: margin }]}>
      <LinearGradient
        colors={['transparent', color, color, 'transparent']}
        style={[styles.divider, { height: thickness }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
      {animated && (
        <Animated.View style={[styles.glow, glowStyle]}>
          <LinearGradient
            colors={['transparent', color, 'transparent']}
            style={[styles.glowGradient, { height: thickness * 3 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
  },
  divider: {
    width: '90%',
    opacity: 0.5,
  },
  glow: {
    position: 'absolute',
    width: '70%',
    alignItems: 'center',
  },
  glowGradient: {
    width: '100%',
    opacity: 0.4,
  },
});