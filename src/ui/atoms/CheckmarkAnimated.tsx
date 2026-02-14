import React from 'react';
import { View, StyleSheet, AccessibilityInfo } from 'react-native';
import { Check } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LuxuryTheme } from '../../design/luxuryTheme';

interface CheckmarkAnimatedProps {
  checked: boolean;
  size?: number;
  color?: string;
  onToggle?: () => void;
  disableAnimation?: boolean;
}

/**
 * CheckmarkAnimated - Micro-animated checkmark with spring scale
 * No layout shift, respects Reduce Motion
 */
export const CheckmarkAnimated: React.FC<CheckmarkAnimatedProps> = ({
  checked,
  size = 20,
  color = LuxuryTheme.colors.primary.gold,
  onToggle,
  disableAnimation = false,
}) => {
  const scale = useSharedValue(1);
  const [reduceMotion, setReduceMotion] = React.useState(false);
  
  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  React.useEffect(() => {
    if (checked && !disableAnimation && !reduceMotion) {
      // Spring scale animation: 0.9 → 1.0
      scale.value = withSequence(
        withTiming(LuxuryTheme.motion.checkmark.scale.from, { 
          duration: 40 
        }),
        withSpring(LuxuryTheme.motion.checkmark.scale.to, {
          damping: LuxuryTheme.motion.springScale.damping,
          stiffness: LuxuryTheme.motion.springScale.stiffness,
        })
      );
    } else {
      scale.value = 1;
    }
  }, [checked, disableAnimation, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!checked) return null;

  return (
    <Animated.View 
      style={[styles.container, animatedStyle]}
      accessible={true}
      accessibilityLabel="Completed"
      accessibilityRole="image"
    >
      <Check size={size} color={color} strokeWidth={3} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});