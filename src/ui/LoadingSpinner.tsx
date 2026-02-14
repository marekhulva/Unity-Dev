import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  FadeIn,
} from 'react-native-reanimated';
import { LuxuryTheme } from '../design/luxuryTheme';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
  overlay?: boolean;
  theme?: 'gold' | 'silver' | 'default';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = 'Loading...',
  size = 'medium',
  overlay = false,
  theme = 'gold'
}) => {
  const pulseAnimation = useSharedValue(0);
  const rotateAnimation = useSharedValue(0);

  React.useEffect(() => {
    pulseAnimation.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    );
    rotateAnimation.value = withRepeat(
      withTiming(360, { duration: 2000 }),
      -1
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulseAnimation.value, [0, 1], [0.5, 1]),
    transform: [
      { scale: interpolate(pulseAnimation.value, [0, 1], [0.95, 1.05]) }
    ],
  }));

  const getSize = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 48;
      default: return 36;
    }
  };

  const getThemeColor = () => {
    switch (theme) {
      case 'silver': return '#C0C0C0';
      case 'default': return '#FFFFFF';
      default: return LuxuryTheme.colors.primary.gold;
    }
  };

  const content = (
    <Animated.View entering={FadeIn} style={[styles.container, overlay && styles.overlayContainer]}>
      {overlay && (
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
      )}
      
      <View style={[styles.content, overlay && styles.overlayContent]}>
        {/* Luxury glow effect */}
        <Animated.View style={[styles.glowContainer, pulseStyle]}>
          <LinearGradient
            colors={[
              'rgba(255, 215, 0, 0.3)',
              'rgba(255, 215, 0, 0.1)',
              'rgba(255, 215, 0, 0.05)'
            ]}
            style={[styles.glowCircle, { width: getSize() * 2, height: getSize() * 2 }]}
          />
          <ActivityIndicator 
            size={getSize()} 
            color={getThemeColor()}
            style={styles.spinner}
          />
        </Animated.View>
        
        {text && (
          <Animated.Text 
            style={[styles.text, { color: getThemeColor() }]}
            entering={FadeIn.delay(200)}
          >
            {text}
          </Animated.Text>
        )}
      </View>
    </Animated.View>
  );

  return content;
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  overlayContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  glowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowCircle: {
    position: 'absolute',
    borderRadius: 100,
  },
  spinner: {
    zIndex: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});