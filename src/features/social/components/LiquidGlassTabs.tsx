import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LuxuryTheme } from '../../../design/luxuryTheme';
import { LuxuryColors } from '../../../design/luxuryColors';
import { isFeatureEnabled } from '../../../utils/featureFlags';

const { width } = Dimensions.get('window');
const TAB_WIDTH = (width - 48) / 2;

interface LiquidGlassTabsProps {
  activeTab: 'circle' | 'follow';
  onTabChange: (tab: 'circle' | 'follow') => void;
}

export const LiquidGlassTabs: React.FC<LiquidGlassTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const slideAnim = useSharedValue(activeTab === 'circle' ? 0 : 1);
  const glowAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(0);
  const isLuxury = true; // Always use luxury theme to match onboarding
  const styles = React.useMemo(() => createStyles(isLuxury), [isLuxury]);
  
  // Continuous pulse for active tab
  React.useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  React.useEffect(() => {
    slideAnim.value = withSpring(activeTab === 'circle' ? 0 : 1, {
      damping: 15,
      stiffness: 150,
      mass: 0.8,
    });
    
    // Burst glow on change
    glowAnim.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(0.7, { duration: 100 }),
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 300 })
    );
  }, [activeTab]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: interpolate(slideAnim.value, [0, 1], [0, TAB_WIDTH]),
    }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnim.value, [0, 1], [0.5, 1]),
    shadowRadius: interpolate(glowAnim.value, [0, 1], [10, 20]),
  }));
  
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulseAnim.value, [0, 1], [0.3, 0.6]),
  }));

  return (
    <View style={styles.container}>
      <BlurView intensity={isLuxury ? 10 : 30} tint="dark" style={[
        styles.blurContainer,
        isLuxury && typeof LuxuryColors !== 'undefined' && { backgroundColor: LuxuryColors.black.pure }
      ]}>
        {/* Conditional gradient based on luxury theme */}
        {!isLuxury ? (
          <>
            <LinearGradient
              colors={['#E7B43A', '#C0C0C0', '#E7B43A']}
              style={[StyleSheet.absoluteFillObject, { opacity: 0.15 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              locations={[0, 0.5, 1]}
            />
            <LinearGradient
              colors={['rgba(18,18,18,0.7)', 'rgba(18,18,18,0.85)']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
          </>
        ) : null}
        
        {/* Active indicator with enhanced glow */}
        <Animated.View style={[styles.indicator, indicatorStyle]}>
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']}
            style={styles.indicatorGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Animated.View style={[styles.indicatorGlow, glowStyle]}>
            <LinearGradient
              colors={['rgba(255, 215, 0, 0.3)', 'transparent']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
          </Animated.View>
          <Animated.View style={[styles.indicatorPulse, pulseStyle]} />
        </Animated.View>
        
        {/* Tab buttons */}
        <View style={styles.tabsRow}>
          <Pressable
            style={styles.tab}
            onPress={() => onTabChange('circle')}
          >
            <View style={styles.tabContent}>
              {activeTab === 'circle' && (
                <View style={styles.activeIndicatorDot} />
              )}
              <Text style={[
                styles.tabText,
                activeTab === 'circle' && styles.tabTextActive
              ]}>
                CIRCLE
              </Text>
              {activeTab === 'circle' && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>12</Text>
                </View>
              )}
            </View>
            {activeTab === 'circle' && (
              <Animated.View style={[styles.underline, glowStyle]}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.underlineGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </Animated.View>
            )}
          </Pressable>
          
          <Pressable
            style={styles.tab}
            onPress={() => onTabChange('follow')}
          >
            <View style={styles.tabContent}>
              {activeTab === 'follow' && (
                <View style={styles.activeIndicatorDot} />
              )}
              <Text style={[
                styles.tabText,
                activeTab === 'follow' && styles.tabTextActive
              ]}>
                FOLLOWING
              </Text>
              {activeTab === 'follow' && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>28</Text>
                </View>
              )}
            </View>
            {activeTab === 'follow' && (
              <Animated.View style={[styles.underline, glowStyle]}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.underlineGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </Animated.View>
            )}
          </Pressable>
        </View>
      </BlurView>
    </View>
  );
};

const createStyles = (isLuxury: boolean) => StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  blurContainer: {
    flex: 1,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
  },
  indicator: {
    position: 'absolute',
    width: TAB_WIDTH,
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  indicatorGradient: {
    flex: 1,
    borderRadius: 24,
  },
  indicatorGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  indicatorPulse: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  tabsRow: {
    flexDirection: 'row',
    flex: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1,
  },
  tabTextActive: {
    color: '#FFD700',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    fontWeight: '800',
  },
  tabBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFD700',
  },
  underline: {
    position: 'absolute',
    bottom: 6,
    width: '70%',
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  underlineGradient: {
    flex: 1,
  },
});