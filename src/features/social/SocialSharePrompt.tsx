import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Share } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
  FadeInDown,
  FadeOutDown,
} from 'react-native-reanimated';
import { Share2, X, Users, MessageCircle, Trophy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { GlassSurface } from '../../ui/GlassSurface';
import { LinearGradient } from 'expo-linear-gradient';

interface SocialSharePromptProps {
  visible: boolean;
  onClose: () => void;
  progress: number;
  completedActions: number;
  totalActions: number;
  streak: number;
}

export const SocialSharePrompt: React.FC<SocialSharePromptProps> = ({
  visible,
  onClose,
  progress,
  completedActions,
  totalActions,
  streak,
}) => {
  const [isSharing, setIsSharing] = useState(false);

  const pulseValue = useAnimatedStyle(() => {
    const pulse = withRepeat(
      withTiming(1.1, { duration: 1000 }),
      -1,
      true
    );
    return {
      transform: [{ scale: pulse }],
    };
  });

  const handleShare = async () => {
    try {
      setIsSharing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const message = `🎯 Daily Progress Update!\n\n` +
        `✅ Completed ${completedActions}/${totalActions} actions (${Math.round(progress)}%)\n` +
        `🔥 ${streak} day streak\n\n` +
        `Staying consistent with my goals! #UnityApp #DailyProgress`;

      await Share.share({
        message,
        title: 'Unity Progress',
      });
    } catch (error) {
      if (__DEV__) console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.springify()}
      exiting={FadeOutDown}
      style={styles.container}
    >
      <GlassSurface style={styles.prompt} neonGlow="blue">
        {/* Close button */}
        <Pressable onPress={onClose} style={styles.closeButton}>
          <X size={20} color="rgba(255,255,255,0.5)" />
        </Pressable>

        {/* Header with pulse animation */}
        <Animated.View style={[styles.iconContainer, pulseValue]}>
          <LinearGradient
            colors={['#00D4FF', '#B366FF']}
            style={styles.iconGradient}
          >
            <Share2 size={28} color="#FFF" />
          </LinearGradient>
        </Animated.View>

        <Text style={styles.title}>Share Your Progress!</Text>
        <Text style={styles.subtitle}>
          Inspire others with your {Math.round(progress)}% completion today
        </Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Trophy size={16} color="#FFD600" />
            <Text style={styles.statText}>{completedActions}/{totalActions}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.statText}>{streak} days</Text>
          </View>
        </View>

        {/* Share options */}
        <View style={styles.shareOptions}>
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.shareButton,
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            disabled={isSharing}
          >
            <Share2 size={18} color="#FFF" />
            <Text style={styles.shareButtonText}>Share Progress</Text>
          </Pressable>

          <View style={styles.secondaryButtons}>
            <Pressable
              style={({ pressed }) => [
                styles.socialButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                // Handle community share
              }}
            >
              <Users size={18} color="#00D4FF" />
              <Text style={styles.socialButtonText}>Community</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.socialButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                // Handle message share
              }}
            >
              <MessageCircle size={18} color="#00FF88" />
              <Text style={styles.socialButtonText}>Message</Text>
            </Pressable>
          </View>
        </View>

        {/* Motivational text */}
        <Text style={styles.motivation}>
          "Sharing your journey motivates others to start theirs"
        </Text>
      </GlassSurface>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 999,
  },
  prompt: {
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statText: {
    color: '#FFF',
    fontWeight: '600',
  },
  streakEmoji: {
    fontSize: 14,
  },
  shareOptions: {
    width: '100%',
    gap: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#00D4FF',
  },
  shareButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 6,
  },
  socialButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  motivation: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
    marginTop: 16,
    textAlign: 'center',
  },
});