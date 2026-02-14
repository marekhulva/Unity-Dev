import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { LuxuryTheme } from '../../design/luxuryTheme';

interface ElevationCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: 'sm' | 'md' | 'lg';
  glassEffect?: boolean;
  borderGlow?: boolean;
  infiniteScrollCue?: boolean;
}

/**
 * ElevationCard - Enhanced card with proper depth, shadows, and separation
 * Purely visual wrapper that improves contrast and legibility
 */
export const ElevationCard: React.FC<ElevationCardProps> = ({
  children,
  style,
  elevation = 'md',
  glassEffect = true,
  borderGlow = false,
  infiniteScrollCue = true,
}) => {
  const shadowStyle = LuxuryTheme.shadow[elevation];
  
  return (
    <View style={[styles.container, shadowStyle, style]}>
      {glassEffect ? (
        <BlurView intensity={10} tint="dark" style={styles.card}>
          <LinearGradient
            colors={['rgba(18, 23, 28, 0.9)', 'rgba(18, 23, 28, 0.95)']}
            style={StyleSheet.absoluteFillObject}
          />
          
          {/* Border for separation */}
          <View style={styles.border} />
          
          {/* Content */}
          <View style={styles.content}>
            {children}
          </View>
          
          {/* Infinite scroll cue - subtle gradient fade at bottom */}
          {infiniteScrollCue && (
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.05)']}
              style={styles.scrollCue}
              pointerEvents="none"
            />
          )}
          
          {/* Optional border glow for emphasis */}
          {borderGlow && (
            <View style={[styles.borderGlow, LuxuryTheme.shadow.glow]} />
          )}
        </BlurView>
      ) : (
        <View style={[styles.card, styles.solidCard]}>
          <View style={styles.border} />
          <View style={styles.content}>
            {children}
          </View>
          {infiniteScrollCue && (
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.05)']}
              style={styles.scrollCue}
              pointerEvents="none"
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 8,
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  solidCard: {
    backgroundColor: LuxuryTheme.colors.background.card,
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.background.cardBorder,
    pointerEvents: 'none',
  },
  borderGlow: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.primary.gold,
    opacity: 0.3,
    pointerEvents: 'none',
  },
  content: {
    padding: 16,
  },
  scrollCue: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    pointerEvents: 'none',
  },
});