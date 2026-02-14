import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  interpolate,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface ConfettiPieceProps {
  delay: number;
  color: string;
  startX: number;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ delay, color, startX }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(-height, {
        duration: 2000,
        easing: Easing.out(Easing.quad),
      })
    );
    translateX.value = withDelay(
      delay,
      withTiming((Math.random() - 0.5) * 200, {
        duration: 2000,
      })
    );
    rotate.value = withDelay(
      delay,
      withTiming(360 * (Math.random() > 0.5 ? 1 : -1), {
        duration: 2000,
      })
    );
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 200 })
    );
    const timeoutId = setTimeout(() => {
      opacity.value = withDelay(1000, withTiming(0, { duration: 800 }));
    }, delay + 200);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimation(translateY);
      cancelAnimation(translateX);
      cancelAnimation(rotate);
      cancelAnimation(opacity);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: startX + translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
};

interface ConfettiViewProps {
  active: boolean;
}

export const ConfettiView: React.FC<ConfettiViewProps> = ({ active }) => {
  if (!active) return null;

  const colors = ['#00D4FF', '#00FF88', '#FFD600', '#FF006E', '#B366FF'];
  const pieces = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    delay: Math.random() * 300,
    color: colors[i % colors.length],
    startX: (Math.random() - 0.5) * width,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map(piece => (
        <ConfettiPiece
          key={piece.id}
          delay={piece.delay}
          color={piece.color}
          startX={piece.startX}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 20,
    borderRadius: 2,
  },
});