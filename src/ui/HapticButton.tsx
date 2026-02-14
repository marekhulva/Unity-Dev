import React from 'react';
import { Pressable, PressableProps, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface HapticButtonProps extends PressableProps {
  hapticType?: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid';
  scaleAmount?: number;
  children: React.ReactNode;
}

export const HapticButton: React.FC<HapticButtonProps> = ({
  hapticType = 'light',
  scaleAmount = 0.95,
  onPressIn,
  onPressOut,
  onPress,
  style,
  children,
  ...props
}) => {
  const scale = useSharedValue(1);

  const getHapticStyle = () => {
    switch (hapticType) {
      case 'light':
        return Haptics.ImpactFeedbackStyle.Light;
      case 'medium':
        return Haptics.ImpactFeedbackStyle.Medium;
      case 'heavy':
        return Haptics.ImpactFeedbackStyle.Heavy;
      case 'soft':
        return Haptics.ImpactFeedbackStyle.Soft;
      case 'rigid':
        return Haptics.ImpactFeedbackStyle.Rigid;
      default:
        return Haptics.ImpactFeedbackStyle.Light;
    }
  };

  const handlePressIn = (event: any) => {
    scale.value = withSpring(scaleAmount, {
      damping: 15,
      stiffness: 400,
    });
    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
    onPressOut?.(event);
  };

  const handlePress = (event: any) => {
    Haptics.impactAsync(getHapticStyle());
    onPress?.(event);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[animatedStyle, style]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
};