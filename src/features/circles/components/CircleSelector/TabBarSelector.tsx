import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { CircleSelectorProps } from './CircleSelectorProps';
import { CIRCLE_SELECTOR_CONFIG } from './config';
import { LuxuryTheme } from '../../../../design/luxuryTheme';
import { LinearGradient } from 'expo-linear-gradient';

export const TabBarSelector: React.FC<CircleSelectorProps> = ({
  circles,
  activeCircleId,
  onCircleSelect,
  onJoinCircle,
  loading,
  style,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef<{ [key: string]: Animated.Value }>({}).current;

  const config = CIRCLE_SELECTOR_CONFIG.tabBar;
  const commonConfig = CIRCLE_SELECTOR_CONFIG.common;
  const translateYAnims = useRef<{ [key: string]: Animated.Value }>({}).current;

  // Smart abbreviation function
  const getSmartAbbreviation = (name: string): string => {
    // Special cases
    if (name.toLowerCase() === 'all circles') return 'All';

    // Remove common words
    const filtered = name.replace(/\b(the|of|and|for|in|on|at|to|a|an)\b/gi, '');

    // Check for common patterns
    if (filtered.toLowerCase().includes('basketball')) return 'BBall';
    if (filtered.toLowerCase().includes('wellness')) return 'Wellness';
    if (filtered.toLowerCase().includes('fitness')) return 'Fitness';
    if (filtered.toLowerCase().includes('startup')) return 'Startup';
    if (filtered.toLowerCase().includes('book')) return 'Books';
    if (filtered.toLowerCase().includes('gaming')) return 'Gaming';

    // If it's already short enough (8 chars or less), use it
    const words = filtered.trim().split(/\s+/);
    if (filtered.length <= 8) return filtered;

    // If it's 2 words, try to abbreviate
    if (words.length === 2) {
      const firstWord = words[0];
      const secondWord = words[1];

      // If first word is short, keep it and abbreviate second
      if (firstWord.length <= 4) {
        return `${firstWord}${secondWord.charAt(0).toUpperCase()}`;
      }

      // Otherwise use initials of both
      return `${firstWord.substring(0, 3)}${secondWord.substring(0, 3)}`;
    }

    // If it's 3+ words, use initials or first word
    if (words.length >= 3) {
      const initials = words.map(w => w.charAt(0).toUpperCase()).join('');
      if (initials.length <= 5) return initials;

      // Otherwise just use first word truncated
      return words[0].substring(0, 7);
    }

    // Default: truncate to 7 chars
    return filtered.substring(0, 7);
  };

  // Initialize animations
  const getTranslateYAnim = (id: string | null) => {
    const key = id || 'all';
    if (!translateYAnims[key]) {
      translateYAnims[key] = new Animated.Value(0);
    }
    return translateYAnims[key];
  };

  // Check if content is scrollable
  useEffect(() => {
    const isScrollable = contentWidth > containerWidth;
    setShowScrollIndicator(isScrollable && config.showScrollIndicator);

    // Animate scroll indicator
    if (isScrollable && config.showScrollIndicator) {
      Animated.timing(fadeAnim, {
        toValue: scrollPosition < contentWidth - containerWidth - 50 ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [contentWidth, containerWidth, scrollPosition, config.showScrollIndicator]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollPosition(event.nativeEvent.contentOffset.x);
  };

  const handleContentSizeChange = (width: number, height: number) => {
    setContentWidth(width);
  };

  const handleLayout = (event: any) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const handleCirclePress = (circleId: string | null) => {
    if (commonConfig.hapticFeedback) {
      Haptics.selectionAsync();
    }
    onCircleSelect(circleId);
  };

  const renderTab = (
    emoji: string | undefined,
    name: string,
    isActive: boolean,
    onPress: () => void,
    testID?: string,
    circleId: string | null = null
  ) => {
    const translateY = getTranslateYAnim(circleId);
    const abbreviation = getSmartAbbreviation(name);
    const [showTooltip, setShowTooltip] = useState(false);

    // Animate lift on hover/active
    useEffect(() => {
      Animated.spring(translateY, {
        toValue: isActive ? -2 : 0,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }, [isActive]);

    return (
      <Animated.View
        style={[
          styles.tabWrapper,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        {isActive ? (
          <LinearGradient
            colors={['rgba(231, 180, 58, 0.2)', 'rgba(231, 180, 58, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tabGradient}
          >
            <TouchableOpacity
              style={[styles.tab, styles.activeTab]}
              onPress={onPress}
              onPressIn={() => setShowTooltip(true)}
              onPressOut={() => setShowTooltip(false)}
              testID={testID}
            >
              <Text style={styles.activeEmoji}>{emoji || '⭐'}</Text>
              <Text style={styles.activeTabText}>{abbreviation}</Text>
            </TouchableOpacity>
          </LinearGradient>
        ) : (
          <TouchableOpacity
            style={styles.tab}
            onPress={onPress}
            onPressIn={() => setShowTooltip(true)}
            onPressOut={() => setShowTooltip(false)}
            testID={testID}
          >
            <Text style={styles.emoji}>{emoji || '⭐'}</Text>
            <Text style={styles.tabText}>{abbreviation}</Text>
          </TouchableOpacity>
        )}

        {/* Full name tooltip on press */}
        {showTooltip && name !== abbreviation && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>{name}</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.scrollView, { overflow: 'visible' }]}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        scrollEventThrottle={16}
      >
        {/* All Circles Tab */}
        {commonConfig.showAllCirclesOption && renderTab(
          '🌐',
          'All Circles',
          activeCircleId === null,
          () => handleCirclePress(null),
          'all-circles-tab',
          null
        )}

        {/* Individual Circle Tabs */}
        {circles.map((circle) =>
          renderTab(
            circle.emoji,
            circle.name,
            activeCircleId === circle.id,
            () => handleCirclePress(circle.id),
            `circle-tab-${circle.id}`,
            circle.id
          )
        )}

        {/* Join New Circle Tab */}
        {commonConfig.allowJoinFromSelector && (
          <TouchableOpacity
            style={styles.addTab}
            onPress={onJoinCircle}
            testID="join-circle-tab"
          >
            <Text style={styles.addIcon}>➕</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Scroll Indicator */}
      {showScrollIndicator && (
        <Animated.View
          style={[
            styles.scrollIndicator,
            {
              opacity: fadeAnim,
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.scrollArrow}>→</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(10, 10, 10, 0.3)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(231, 180, 58, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(231, 180, 58, 0.1)',
    position: 'relative',
    overflow: 'visible',
    ...Platform.select({
      ios: {
        // iOS blur effect handled by BlurView
      },
      android: {
        // Android fallback styling
        backgroundColor: 'rgba(10, 10, 10, 0.6)',
      },
      web: {
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      },
    }),
  },
  scrollView: {
    flexGrow: 0,
    overflow: 'visible',
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'visible',
  },
  tabWrapper: {
    marginRight: 8,
    position: 'relative',
  },
  tabGradient: {
    borderRadius: 25,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.primary.gold,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(192, 192, 192, 0.1)',
    borderRadius: 25,
    paddingVertical: 9,
    paddingHorizontal: 15,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
      },
    }),
  },
  activeTab: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    shadowColor: LuxuryTheme.colors.primary.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#A7B0B7',
  },
  activeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: LuxuryTheme.colors.primary.gold,
  },
  emoji: {
    fontSize: 16,
    opacity: 0.85,
  },
  activeEmoji: {
    fontSize: 16,
    opacity: 1,
  },
  tooltip: {
    position: 'absolute',
    bottom: -32,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: '#1A1F24',
    borderWidth: 1,
    borderColor: 'rgba(231, 180, 58, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 80,
    maxWidth: 150,
    zIndex: 9999,
    elevation: 9999,
  },
  tooltipText: {
    fontSize: 11,
    color: LuxuryTheme.colors.primary.gold,
    textAlign: 'center',
    fontWeight: '400',
  },
  addTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderColor: 'rgba(231, 180, 58, 0.3)',
    borderWidth: 1,
    borderRadius: 25,
    paddingVertical: 9,
    paddingHorizontal: 15,
    minWidth: 44,
  },
  addIcon: {
    fontSize: 16,
    color: 'rgba(231, 180, 58, 0.6)',
  },
  scrollIndicator: {
    position: 'absolute',
    right: 5,
    top: '50%',
    transform: [{ translateY: -15 }],
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  scrollArrow: {
    fontSize: 14,
    color: LuxuryTheme.colors.primary.gold,
    fontWeight: 'bold',
  },
});