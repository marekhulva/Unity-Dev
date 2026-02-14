import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LuxuryTheme } from '../../design/luxuryTheme';
import { useSocialV2 } from '../../utils/featureFlags';

interface SocialCardSurfaceProps {
  children: React.ReactNode;
  style?: ViewStyle;
  categoryColor?: string;
  categoryOpacity?: number;
  infiniteScrollCue?: boolean;
}

/**
 * SocialCardSurface - Card surface with vertical gradient and consistent depth
 * Adds faint gradient from top (darker) to bottom (lighter)
 */
export const SocialCardSurface: React.FC<SocialCardSurfaceProps> = ({
  children,
  style,
  categoryColor,
  categoryOpacity = 0.7, // Tuned down opacity for category rail
  infiniteScrollCue = true,
}) => {
  const v2Enabled = useSocialV2();
  
  // Use gradient only if V2 is enabled
  const gradientColors = v2Enabled
    ? [LuxuryTheme.colors.surface.cardTop, LuxuryTheme.colors.surface.cardBottom]
    : [LuxuryTheme.colors.background.card, LuxuryTheme.colors.background.card];

  return (
    <View style={[styles.container, LuxuryTheme.shadow.md, style]}>
      {/* Vertical gradient background */}
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      
      {/* Card border */}
      <View style={styles.border} />
      
      {/* Category accent rail */}
      {categoryColor && (
        <View 
          style={[
            styles.categoryRail, 
            { 
              backgroundColor: categoryColor,
              opacity: categoryOpacity,
            }
          ]} 
        />
      )}
      
      {/* Content with proper padding */}
      <View style={styles.content}>
        {children}
      </View>
      
      {/* Infinite scroll cue - subtle gradient fade at bottom */}
      {infiniteScrollCue && v2Enabled && (
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.03)']}
          style={styles.scrollCue}
          pointerEvents="none"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 8,
    overflow: 'hidden',
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
  categoryRail: {
    position: 'absolute',
    left: 0,
    top: LuxuryTheme.spacing.cardPadding,
    bottom: LuxuryTheme.spacing.cardPadding,
    width: 3,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  content: {
    padding: LuxuryTheme.spacing.cardPadding,
  },
  scrollCue: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 16,
    pointerEvents: 'none',
  },
});