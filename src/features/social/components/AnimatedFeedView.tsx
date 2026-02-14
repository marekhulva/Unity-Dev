import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';

interface AnimatedFeedViewProps {
  children: React.ReactNode;
  feedKey: string;
}

export const AnimatedFeedView: React.FC<AnimatedFeedViewProps> = ({
  children,
  feedKey,
}) => {
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);

  React.useEffect(() => {
    // Fade and slide animation on feed change
    opacity.value = 0;
    translateX.value = -20;
    
    opacity.value = withTiming(1, { duration: 300 });
    translateX.value = withSpring(0, {
      damping: 20,
      stiffness: 200,
    });
  }, [feedKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View 
      style={[styles.container, animatedStyle]}
      entering={FadeIn.duration(300).springify()}
      exiting={FadeOut.duration(200)}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});