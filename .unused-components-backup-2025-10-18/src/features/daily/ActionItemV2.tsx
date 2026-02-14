import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Pressable } from 'react-native';
import { Flame, Trophy, Zap, CheckCircle2, Circle, Target, Clock, Edit3, Trash2, Sparkles, Activity } from 'lucide-react-native';
import { HapticManager } from '../../utils/haptics';
import { useStore } from '../../state/rootStore';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
  FadeIn,
  runOnJS,
  withSequence,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { LuxuryTheme } from '../../design/luxuryTheme';
import { PrivacySelectionModal } from './PrivacySelectionModal';
import ConfettiCannon from 'react-native-confetti-cannon';

interface ActionItemProps {
  id: string;
  title: string;
  goalTitle?: string;
  done?: boolean;
  streak: number;
  time?: string;
  type?: 'goal' | 'performance' | 'commitment' | 'oneTime' | 'one-time';
  goalColor?: string;
}

// Helper function to format time from 24hr to 12hr with AM/PM
const formatTime = (time?: string) => {
  if (!time) return undefined;
  
  // Handle various time formats (HH:MM or HH:MM:SS)
  const parts = time.split(':');
  let hours = parseInt(parts[0]);
  const minutes = parts[1];
  
  if (isNaN(hours)) return time;
  
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert 0 to 12 for midnight, and 13-23 to 1-11
  
  return `${hours}:${minutes} ${period}`;
};

// Check if time is "active now" (within 30 minutes)
const isActiveTime = (time?: string) => {
  if (!time) return false;
  const parts = time.split(':');
  const taskHours = parseInt(parts[0]);
  const taskMinutes = parseInt(parts[1]);
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const taskTotalMinutes = taskHours * 60 + taskMinutes;
  
  const diff = Math.abs(currentMinutes - taskTotalMinutes);
  return diff <= 30; // Within 30 minutes
};

export const ActionItemV2: React.FC<ActionItemProps> = ({ 
  id, 
  title, 
  goalTitle, 
  done = false, 
  streak,
  time,
  type = 'goal',
  goalColor
}) => {
  console.log('ActionItemV2 rendering:', { title, goalTitle, goalColor });
  const toggle = useStore(s => s.toggleAction);
  const updateAction = useStore(s => s.updateAction);
  const deleteAction = useStore(s => s.deleteAction);
  const openShare = useStore(s => s.openShare);
  const addCompletedAction = useStore(s => s.addCompletedAction);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Animations
  const checkAnimation = useSharedValue(done ? 1 : 0);
  const cardPressAnimation = useSharedValue(1);
  const glowAnimation = useSharedValue(0);
  const sweepAnimation = useSharedValue(0);
  const timeGlowAnimation = useSharedValue(0);
  
  // Active time glow animation
  useEffect(() => {
    if (isActiveTime(time)) {
      timeGlowAnimation.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [time]);
  
  // Card press animation
  const handlePressIn = () => {
    cardPressAnimation.value = withSpring(0.98, { damping: 15 });
    sweepAnimation.value = withTiming(1, { duration: 300 });
  };
  
  const handlePressOut = () => {
    cardPressAnimation.value = withSpring(1, { damping: 15 });
    sweepAnimation.value = withTiming(0, { duration: 200 });
  };
  
  // Complete animation
  useEffect(() => {
    checkAnimation.value = withSpring(done ? 1 : 0, {
      damping: 12,
      stiffness: 180,
    });
  }, [done]);
  
  // Card animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cardPressAnimation.value },
      { scale: interpolate(checkAnimation.value, [0, 1], [1, 0.98]) }
    ],
    opacity: interpolate(checkAnimation.value, [0, 1], [1, 0.85]),
  }));
  
  // Sweep light animation
  const sweepStyle = useAnimatedStyle(() => ({
    opacity: sweepAnimation.value * 0.3,
    transform: [
      { translateX: interpolate(sweepAnimation.value, [0, 1], [-200, 200]) }
    ],
  }));
  
  // Checkbox animated styles
  const checkboxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(checkAnimation.value, [0, 0.5, 1], [1, 1.2, 1]) }],
  }));
  
  const checkboxFillStyle = useAnimatedStyle(() => ({
    opacity: checkAnimation.value,
    transform: [{ scale: checkAnimation.value }],
  }));
  
  // Time pill glow animation
  const timePillStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(timeGlowAnimation.value, [0, 1], [0.2, 0.5]),
    transform: [{ scale: interpolate(timeGlowAnimation.value, [0, 1], [1, 1.02]) }],
  }));
  
  const handleToggle = () => {
    if (!done) {
      // Trigger confetti
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      
      // Show privacy modal when completing an action
      setShowPrivacyModal(true);
      HapticManager.interaction.premiumPress();
    } else {
      // Allow unchecking
      toggle(id);
      HapticManager.interaction.tap();
    }
  };

  const handlePrivacySelect = (visibility: 'public' | 'private', contentType: 'photo' | 'audio' | 'text' | 'check') => {
    // Mark action as complete
    toggle(id);
    if (streak >= 7) {
      HapticManager.context.streakExtended();
    } else {
      HapticManager.context.actionCompleted();
    }
    
    // Map content type to action type
    const actionType = contentType === 'photo' ? 'photo' : 
                      contentType === 'audio' ? 'audio' : 
                      contentType === 'text' ? 'milestone' : 
                      'check';
    
    // Generate mock media URL for photos (in real app, would capture actual photo)
    const mediaUrl = contentType === 'photo' 
      ? `https://picsum.photos/400/400?random=${Date.now()}` 
      : undefined;
    
    // Store the completed action with privacy setting and content type
    addCompletedAction({
      id: `${id}-${Date.now()}`,
      actionId: id,
      title,
      goalTitle,
      completedAt: new Date(),
      isPrivate: visibility === 'private',
      streak: streak + 1,
      type: actionType,
      mediaUrl,
      category: 'fitness', // Could be dynamic based on goal
    });
    
    // If public and not just a check, trigger share modal
    if (visibility === 'public' && contentType !== 'check') {
      setTimeout(() => {
        openShare({
          type: 'checkin',
          visibility: 'circle',
          actionTitle: title,
          goal: goalTitle,
          streak: streak + 1,
          goalColor: goalColor || LuxuryTheme.colors.primary.gold,
          contentType,
        });
      }, 500);
    }
    
    setShowPrivacyModal(false);
  };

  const handleLongPress = () => {
    setShowActionMenu(true);
    HapticManager.interaction.longPress();
  };

  const handleEdit = () => {
    setShowActionMenu(false);
    Alert.prompt(
      'Edit Action',
      'Update your action details',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (newTitle) => {
            if (newTitle && newTitle.trim()) {
              updateAction(id, { title: newTitle.trim() });
              HapticManager.interaction.tap();
            }
          }
        }
      ],
      'plain-text',
      title
    );
  };

  const handleDelete = () => {
    setShowActionMenu(false);
    Alert.alert(
      'Delete Action',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteAction(id);
            HapticManager.error.strong();
          }
        }
      ]
    );
  };

  return (
    <Animated.View entering={FadeIn} style={cardAnimatedStyle}>
      <Pressable 
        onPress={handleToggle} 
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.card}>
          {/* Glassmorphism background */}
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
          
          {/* Gradient border effect */}
          <LinearGradient
            colors={done 
              ? ['rgba(34, 197, 94, 0.3)', 'rgba(34, 197, 94, 0.1)']
              : ['rgba(255, 215, 0, 0.15)', 'rgba(255, 140, 0, 0.08)']}
            style={styles.gradientBorder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          {/* Inner glow */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.01)']}
            style={StyleSheet.absoluteFillObject}
          />
          
          {/* Light sweep effect */}
          <Animated.View style={[styles.sweepLight, sweepStyle]}>
            <LinearGradient
              colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sweep}
            />
          </Animated.View>
          
          <View style={styles.content}>
            {/* Left: Circular checkbox */}
            <TouchableOpacity onPress={handleToggle} activeOpacity={0.8}>
              <Animated.View style={[styles.checkbox, checkboxStyle]}>
                <View style={styles.checkboxOuter}>
                  <LinearGradient
                    colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 140, 0, 0.1)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  {done && (
                    <Animated.View style={[StyleSheet.absoluteFillObject, checkboxFillStyle]}>
                      <LinearGradient
                        colors={['#FFD700', '#FFA500']}
                        style={styles.checkboxFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                      <View style={styles.checkIcon}>
                        <CheckCircle2 color="#000" size={24} strokeWidth={3} />
                      </View>
                    </Animated.View>
                  )}
                  {!done && (
                    <Circle color="rgba(255, 215, 0, 0.6)" size={24} strokeWidth={1.5} />
                  )}
                </View>
              </Animated.View>
            </TouchableOpacity>
            
            {/* Center: Task and category */}
            <View style={styles.centerContent}>
              <Text style={[styles.taskTitle, done && styles.taskTitleDone]}>{title}</Text>
              {goalTitle && (
                <View style={styles.categoryBadge}>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                  <View style={styles.badgeShine}>
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0)']}
                      style={StyleSheet.absoluteFillObject}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                    />
                  </View>
                  <Text style={styles.categoryText}>{goalTitle.toUpperCase()}</Text>
                </View>
              )}
              
              {/* Mini progress ring */}
              {streak > 0 && (
                <View style={styles.progressContainer}>
                  <View style={styles.miniProgressRing}>
                    <View style={[styles.progressFill, { width: `${Math.min(streak * 10, 100)}%` }]} />
                  </View>
                  <Text style={styles.streakText}>{streak} days</Text>
                </View>
              )}
            </View>
            
            {/* Right: Time pill */}
            {time && (
              <Animated.View style={[
                styles.timePill,
                isActiveTime(time) && timePillStyle
              ]}>
                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
                <LinearGradient
                  colors={isActiveTime(time) 
                    ? ['rgba(255, 215, 0, 0.3)', 'rgba(255, 215, 0, 0.1)']
                    : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                  style={StyleSheet.absoluteFillObject}
                />
                <Clock size={14} color={isActiveTime(time) ? '#FFD700' : 'rgba(255, 255, 255, 0.7)'} />
                <Text style={[styles.timeText, isActiveTime(time) && styles.timeTextActive]}>
                  {formatTime(time)}
                </Text>
              </Animated.View>
            )}
          </View>
        </View>
      </Pressable>
      
      {/* Confetti */}
      {showConfetti && (
        <ConfettiCannon
          count={30}
          origin={{x: -10, y: 0}}
          autoStart={true}
          fadeOut={true}
          explosionSpeed={500}
          fallSpeed={2000}
          colors={['#FFD700', '#FFA500', '#FF6347']}
        />
      )}
      
      {/* Privacy Selection Modal */}
      <PrivacySelectionModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onSelect={handlePrivacySelect}
        actionTitle={title}
        streak={streak}
      />
      
      {/* Action Menu Modal */}
      {showActionMenu && (
        <TouchableOpacity 
          style={styles.overlay} 
          onPress={() => setShowActionMenu(false)}
          activeOpacity={1}
        >
          <View style={styles.actionMenu}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
              <Edit3 size={20} color={LuxuryTheme.colors.text.primary} />
              <Text style={styles.menuText}>Edit Action</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
              <Trash2 size={20} color="#ef4444" />
              <Text style={[styles.menuText, { color: '#ef4444' }]}>Delete Action</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(20, 20, 20, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  gradientBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  sweepLight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    zIndex: 1,
  },
  sweep: {
    flex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingVertical: 18,
    zIndex: 2,
  },
  checkbox: {
    marginRight: 16,
  },
  checkboxOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    overflow: 'hidden',
  },
  checkboxFill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -12,
    marginTop: -12,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  taskTitleDone: {
    opacity: 0.6,
    textDecorationLine: 'line-through',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 6,
  },
  badgeShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniProgressRing: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  streakText: {
    fontSize: 11,
    color: 'rgba(255, 215, 0, 0.8)',
    fontWeight: '600',
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.5,
  },
  timeTextActive: {
    color: '#FFD700',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  actionMenu: {
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderRadius: 16,
    padding: 8,
    minWidth: 180,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  menuText: {
    color: LuxuryTheme.colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 12,
  },
});