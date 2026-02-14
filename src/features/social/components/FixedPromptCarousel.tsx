import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  Dimensions,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { LuxuryTheme } from '../../../design/luxuryTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FixedPromptCarouselProps {
  prompts: any[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onPromptSelect: (prompt: any) => void;
}

/**
 * Fixed Position Carousel - No scrolling, just animated transitions between fixed positions
 * Shows 3 prompts: previous (faded left), current (bright center), next (faded right)
 * 
 * Based on luxury theme with proper visual hierarchy per documentation:
 * - Primary: Current prompt (bright, scaled)
 * - Secondary: Adjacent prompts (faded, smaller)
 * - Tertiary: Dots indicators
 */
export const FixedPromptCarousel: React.FC<FixedPromptCarouselProps> = ({
  prompts,
  currentIndex,
  onIndexChange,
  onPromptSelect,
}) => {
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const autoRotateTimeoutRef = useRef<NodeJS.Timeout>();
  const transitionAnim = useSharedValue(0);
  
  // Get the three visible prompts
  const getPrevIndex = (index: number) => (index - 1 + prompts.length) % prompts.length;
  const getNextIndex = (index: number) => (index + 1) % prompts.length;
  
  const prevIndex = getPrevIndex(currentIndex);
  const nextIndex = getNextIndex(currentIndex);

  // Auto-rotate logic
  useEffect(() => {
    if (!isUserInteracting && prompts.length > 1) {
      autoRotateTimeoutRef.current = setTimeout(() => {
        handleNext();
      }, 8000);
    }
    
    return () => {
      if (autoRotateTimeoutRef.current) {
        clearTimeout(autoRotateTimeoutRef.current);
      }
    };
  }, [currentIndex, isUserInteracting, prompts.length]);

  // Handle navigation
  const handlePrevious = () => {
    setIsUserInteracting(true);
    const newIndex = getPrevIndex(currentIndex);
    animateTransition('left', () => {
      onIndexChange(newIndex);
    });
    
    // Resume auto-rotation after 5 seconds
    setTimeout(() => setIsUserInteracting(false), 5000);
  };

  const handleNext = () => {
    const newIndex = getNextIndex(currentIndex);
    animateTransition('right', () => {
      onIndexChange(newIndex);
    });
    
    if (isUserInteracting) {
      setTimeout(() => setIsUserInteracting(false), 5000);
    }
  };

  const handlePromptPress = (index: number) => {
    setIsUserInteracting(true);
    
    if (index === currentIndex) {
      // Select current prompt
      onPromptSelect(prompts[currentIndex]);
    } else if (index === prevIndex) {
      handlePrevious();
    } else if (index === nextIndex) {
      handleNext();
    }
  };

  // Animate the transition
  const animateTransition = (direction: 'left' | 'right', onComplete: () => void) => {
    transitionAnim.value = withSequence(
      withTiming(direction === 'left' ? -1 : 1, { 
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }, () => {
        runOnJS(onComplete)();
      }),
      withTiming(0, { duration: 0 })
    );
  };

  // Swipe gesture handling
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 50) {
          handlePrevious();
        } else if (gestureState.dx < -50) {
          handleNext();
        }
      },
    })
  ).current;

  // Animated styles for each prompt position
  const leftPromptStyle = useAnimatedStyle(() => ({
    opacity: interpolate(transitionAnim.value, [-1, 0, 1], [0.8, 0.4, 0]),
    transform: [
      { 
        translateX: interpolate(
          transitionAnim.value, 
          [-1, 0, 1], 
          [0, -SCREEN_WIDTH * 0.35, -SCREEN_WIDTH * 0.7]
        )
      },
      { scale: interpolate(transitionAnim.value, [-1, 0, 1], [1, 0.85, 0.7]) },
    ],
  }));

  const centerPromptStyle = useAnimatedStyle(() => ({
    opacity: interpolate(transitionAnim.value, [-1, 0, 1], [0.4, 1, 0.4]),
    transform: [
      { 
        translateX: interpolate(
          transitionAnim.value, 
          [-1, 0, 1], 
          [SCREEN_WIDTH * 0.35, 0, -SCREEN_WIDTH * 0.35]
        )
      },
      { scale: interpolate(transitionAnim.value, [-1, 0, 1], [0.85, 1, 0.85]) },
    ],
  }));

  const rightPromptStyle = useAnimatedStyle(() => ({
    opacity: interpolate(transitionAnim.value, [-1, 0, 1], [0, 0.4, 0.8]),
    transform: [
      { 
        translateX: interpolate(
          transitionAnim.value, 
          [-1, 0, 1], 
          [SCREEN_WIDTH * 0.7, SCREEN_WIDTH * 0.35, 0]
        )
      },
      { scale: interpolate(transitionAnim.value, [-1, 0, 1], [0.7, 0.85, 1]) },
    ],
  }));

  // Render prompt card
  const renderPrompt = (
    prompt: any, 
    index: number, 
    position: 'left' | 'center' | 'right',
    animatedStyle: any
  ) => {
    const promptText = typeof prompt === 'string' ? prompt : prompt.text;
    const accentColor = typeof prompt === 'string' ? '#FFB74D' : getAccentColor(prompt.accent);
    
    return (
      <Animated.View
        key={`${position}-${index}`}
        style={[
          styles.promptCard,
          position === 'left' && styles.leftCard,
          position === 'center' && styles.centerCard,
          position === 'right' && styles.rightCard,
          animatedStyle,
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.promptPressable,
            pressed && styles.promptPressed,
          ]}
          onPress={() => handlePromptPress(index)}
        >
          <Text 
            style={[
              styles.promptText,
              position === 'center' && styles.promptTextActive,
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {promptText}
          </Text>
        </Pressable>
      </Animated.View>
    );
  };
  
  const getAccentColor = (accent: string) => {
    switch(accent) {
      case 'gold': return '#FFB74D';
      case 'teal': return '#4DB6AC';
      case 'purple': return '#7E57C2';
      case 'red': return '#EF5350';
      default: return '#FFA726';
    }
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Background gradient for depth */}
      <LinearGradient
        colors={['rgba(231,180,58,0.05)', 'transparent']}
        style={styles.backgroundGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      
      {/* Carousel viewport */}
      <View style={styles.carousel}>
        {/* Navigation buttons */}
        <Pressable 
          style={[styles.navButton, styles.navButtonLeft]}
          onPress={handlePrevious}
        >
          <ChevronLeft size={20} color="rgba(255,255,255,0.4)" />
        </Pressable>
        
        <Pressable 
          style={[styles.navButton, styles.navButtonRight]}
          onPress={handleNext}
        >
          <ChevronRight size={20} color="rgba(255,255,255,0.4)" />
        </Pressable>
        
        {/* Three fixed position prompts */}
        {prompts.length > 0 && (
          <>
            {renderPrompt(prompts[prevIndex], prevIndex, 'left', leftPromptStyle)}
            {renderPrompt(prompts[currentIndex], currentIndex, 'center', centerPromptStyle)}
            {renderPrompt(prompts[nextIndex], nextIndex, 'right', rightPromptStyle)}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 80,
    marginBottom: 0,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  carousel: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  navButtonLeft: {
    left: 8,
  },
  navButtonRight: {
    right: 8,
  },
  promptCard: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.65,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  leftCard: {
    left: -SCREEN_WIDTH * 0.15,
  },
  centerCard: {
    left: '50%',
    marginLeft: -SCREEN_WIDTH * 0.325,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(231,180,58,0.2)',
  },
  rightCard: {
    right: -SCREEN_WIDTH * 0.15,
  },
  promptPressable: {
    width: '100%',
    alignItems: 'center',
  },
  promptPressed: {
    opacity: 0.8,
  },
  promptText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
    lineHeight: 20,
    textAlign: 'center',
  },
  promptTextActive: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
});

export default FixedPromptCarousel;