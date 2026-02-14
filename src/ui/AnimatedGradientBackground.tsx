import React, { useEffect, useRef } from 'react';
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

interface AnimatedGradientBackgroundProps {
  colors: string[][];
  speed?: number;
  children?: React.ReactNode;
}

export const AnimatedGradientBackground: React.FC<AnimatedGradientBackgroundProps> = ({
  colors,
  speed = 8000,
  children,
}) => {
  const progress = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(colors.length - 1, {
        duration: speed * colors.length,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    rotation.value = withRepeat(
      withTiming(360, {
        duration: speed * 4,
        easing: Easing.linear,
      }),
      -1
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: speed, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: speed, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const currentColorIndex = Math.floor(progress.value);
  const nextColorIndex = (currentColorIndex + 1) % colors.length;
  const currentColors = colors[currentColorIndex] || colors[0];
  const nextColors = colors[nextColorIndex] || colors[1];

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Base gradient */}
      <LinearGradient
        colors={currentColors}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Animated overlay gradient */}
      <AnimatedLinearGradient
        colors={nextColors}
        style={[StyleSheet.absoluteFillObject, animatedStyle]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Mesh effect overlay */}
      <View style={styles.meshOverlay}>
        {[...Array(3)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.orb,
              {
                left: `${20 + i * 30}%`,
                top: `${10 + i * 25}%`,
              },
              useAnimatedStyle(() => ({
                transform: [
                  {
                    translateX: interpolate(
                      progress.value,
                      [0, colors.length - 1],
                      [0, 50 * (i % 2 === 0 ? 1 : -1)]
                    ),
                  },
                  {
                    translateY: interpolate(
                      progress.value,
                      [0, colors.length - 1],
                      [0, 30 * (i % 2 === 0 ? -1 : 1)]
                    ),
                  },
                ],
                opacity: interpolate(
                  progress.value,
                  [0, colors.length / 2, colors.length - 1],
                  [0.3, 0.6, 0.3]
                ),
              })),
            ]}
          >
            <LinearGradient
              colors={[
                'rgba(255,255,255,0.1)',
                'rgba(255,255,255,0.05)',
                'transparent',
              ]}
              style={styles.orbGradient}
              start={{ x: 0.5, y: 0.5 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>
        ))}
      </View>

      {/* Content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  meshOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  orb: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.4,
  },
});