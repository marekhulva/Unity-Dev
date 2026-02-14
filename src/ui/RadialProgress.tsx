import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RadialProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
}

export const RadialProgress: React.FC<RadialProgressProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
}) => {
  const animatedProgress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    animatedProgress.value = withSpring(progress / 100, {
      damping: 15,
      stiffness: 100,
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - (animatedProgress.value * circumference);
    return {
      strokeDashoffset,
    };
  });

  const textStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(animatedProgress.value, [0, 1], [0.9, 1]) }],
  }));

  const getGlowColor = () => {
    if (progress >= 100) return '#00FF88';
    if (progress >= 75) return '#00D4FF';
    if (progress >= 50) return '#FFD600';
    return '#FF006E';
  };

  const glowColor = getGlowColor();

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFillObject}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={glowColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
          />
        </G>
      </Svg>
      
      {/* Center content */}
      <Animated.View style={[styles.centerContent, textStyle]}>
        <Text style={[styles.progressText, { color: glowColor }]}>
          {Math.round(progress)}%
        </Text>
        <Text style={styles.label}>Complete</Text>
      </Animated.View>

      {/* Glow effect */}
      <View
        style={[
          styles.glowEffect,
          {
            shadowColor: glowColor,
            shadowOpacity: progress > 0 ? 0.5 : 0,
            shadowRadius: 20,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 32,
    fontWeight: '900',
  },
  label: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  glowEffect: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 60,
    shadowOffset: { width: 0, height: 0 },
  },
});