import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, cancelAnimation } from 'react-native-reanimated';
import { useStore } from '../../state/rootStore';

interface NotificationBellProps {
  onPress?: () => void;
  color?: string;
  size?: number;
}

export const NotificationBell = ({ onPress, color = '#FFD700', size = 24 }: NotificationBellProps) => {
  const unreadCount = useStore(s => s.unreadCount);
  const fetchUnreadCount = useStore(s => s.fetchUnreadCount);
  const subscribeToNotifications = useStore(s => s.subscribeToNotifications);
  const unsubscribeFromNotifications = useStore(s => s.unsubscribeFromNotifications);

  const pulseAnimation = useSharedValue(0);

  useEffect(() => {
    // Fetch unread count on mount
    fetchUnreadCount();

    // Subscribe to realtime notifications
    subscribeToNotifications();

    // Cleanup on unmount
    return () => {
      unsubscribeFromNotifications();
    };
  }, []);

  // Pulse animation when there are unread notifications
  useEffect(() => {
    if (unreadCount > 0) {
      pulseAnimation.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        true
      );
    }

    return () => {
      cancelAnimation(pulseAnimation);
    };
  }, [unreadCount]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseAnimation.value * 0.5 + 0.5,
  }));

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Animated.View style={[styles.bellContainer, unreadCount > 0 && pulseStyle]}>
        <Bell size={size} color={color} />
        {unreadCount > 0 && (
          <Animated.View entering={FadeInDown} style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  bellContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#000',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
