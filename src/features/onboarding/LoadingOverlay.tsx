import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  FadeIn,
} from 'react-native-reanimated';
import { LuxuryTheme } from '../../design/luxuryTheme';

const { width, height } = Dimensions.get('window');

interface Props {
  message?: string;
  subMessage?: string;
}

export const LoadingOverlay: React.FC<Props> = ({ 
  message = 'Creating your journey...',
  subMessage = 'This will only take a moment'
}) => {
  const pulseAnim = useSharedValue(1);
  const rotateAnim = useSharedValue(0);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1
    );
    
    rotateAnim.value = withRepeat(
      withTiming(360, { duration: 3000 }),
      -1
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateAnim.value}deg` }],
  }));

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.9)']}
          style={StyleSheet.absoluteFillObject}
        />
      </BlurView>
      
      <View style={styles.container}>
        <Animated.View entering={FadeIn.duration(600)} style={styles.content}>
          <Animated.View style={[styles.spinnerContainer, rotateStyle]}>
            <LinearGradient
              colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
              style={styles.gradientRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>
          
          <Animated.View style={[styles.innerCircle, pulseStyle]}>
            <LinearGradient
              colors={['rgba(255,215,0,0.1)', 'rgba(255,215,0,0.05)']}
              style={styles.innerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>
          
          <ActivityIndicator 
            size="large" 
            color={LuxuryTheme.colors.primary.gold}
            style={styles.spinner}
          />
          
          <Text style={styles.message}>{message}</Text>
          {subMessage && (
            <Text style={styles.subMessage}>{subMessage}</Text>
          )}
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  spinnerContainer: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  gradientRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  innerCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    top: 10,
    left: 10,
  },
  innerGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  spinner: {
    marginTop: 10,
  },
  message: {
    marginTop: 120,
    fontSize: 18,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.primary,
    textAlign: 'center',
  },
  subMessage: {
    marginTop: 8,
    fontSize: 14,
    color: LuxuryTheme.colors.text.secondary,
    textAlign: 'center',
  },
});