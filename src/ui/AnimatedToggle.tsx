import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface AnimatedToggleProps {
  checked: boolean;
  onToggle: () => void;
  glowColor?: string;
  size?: number;
}

export const AnimatedToggle: React.FC<AnimatedToggleProps> = ({
  checked,
  onToggle,
  glowColor = '#00D4FF',
  size = 32,
}) => {
  const scale = useSharedValue(1);
  const progress = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(checked ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [checked]);

  const handlePress = () => {
    scale.value = withSpring(0.95, { duration: 50 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    }, 50);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowColor: glowColor,
    shadowOpacity: interpolate(progress.value, [0, 1], [0, 0.5]),
    shadowRadius: interpolate(progress.value, [0, 1], [0, 15]),
    elevation: interpolate(progress.value, [0, 1], [2, 8]),
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: progress.value }],
    opacity: progress.value,
  }));

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.container, { width: size, height: size }, animatedStyle]}>
        {/* Unchecked glass state */}
        <View style={[styles.glass, { borderColor: glowColor + '30' }]} />
        
        {/* Checked gradient fill */}
        <Animated.View style={[StyleSheet.absoluteFillObject, backgroundStyle]}>
          <LinearGradient
            colors={['#ECEDEF', '#FFFFFF']}
            style={[styles.gradient, { borderRadius: size / 2.5 }]}
          />
        </Animated.View>
        
        {/* Check icon */}
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          <Check size={size * 0.5} color="#000" strokeWidth={3} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  glass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  iconContainer: {
    position: 'absolute',
  },
});