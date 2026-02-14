import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';

export const useShimmer = (active: boolean = false, duration: number = 2000) => {
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    if (active) {
      shimmerValue.value = withRepeat(
        withTiming(1, {
          duration,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else {
      shimmerValue.value = 0;
    }
  }, [active, duration]);

  const shimmerStyle = useAnimatedStyle(() => {
    if (!active) return {};
    
    const translateX = interpolate(
      shimmerValue.value,
      [0, 1],
      [-200, 200]
    );

    return {
      transform: [{ translateX }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    if (!active) return {};
    
    const opacity = interpolate(
      shimmerValue.value,
      [0, 0.5, 1],
      [0.3, 0.8, 0.3]
    );

    return {
      shadowOpacity: opacity,
      shadowRadius: interpolate(
        shimmerValue.value,
        [0, 0.5, 1],
        [20, 30, 20]
      ),
    };
  });

  return { shimmerStyle, glowStyle, shimmerValue };
};