import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trophy, X, Star, TrendingUp, Calendar, Award } from 'lucide-react-native';
import Animated, { FadeIn, BounceIn, SlideInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { ChallengeWithDetails } from '../../types/challenges.types';

interface ChallengeCompletionModalProps {
  visible: boolean;
  challenge: ChallengeWithDetails | null;
  onClose: () => void;
  onContinueAsHabit?: () => void;
}

export const ChallengeCompletionModal: React.FC<ChallengeCompletionModalProps> = ({
  visible,
  challenge,
  onClose,
  onContinueAsHabit,
}) => {
  const insets = useSafeAreaInsets();
  const [showHabitOption, setShowHabitOption] = useState(false);

  if (!visible || !challenge || !challenge.my_participation) {
    return null;
  }

  const participation = challenge.my_participation;
  const badgeType = participation.badge_earned || 'bronze';
  const completionPercentage = participation.completion_percentage || 0;
  const daysTaken = participation.days_taken || challenge.duration_days;
  const rank = participation.rank || 0;
  const percentile = participation.percentile || 0;

  const getBadgeColor = () => {
    switch (badgeType) {
      case 'gold':
        return ['#FFD700', '#FFA500'];
      case 'silver':
        return ['#C0C0C0', '#A8A8A8'];
      case 'bronze':
        return ['#CD7F32', '#B8732D'];
      default:
        return ['#9E9E9E', '#757575'];
    }
  };

  const getBadgeMessage = () => {
    if (badgeType === 'failed') {
      return "You didn't meet the success threshold, but you gave it your best!";
    }
    if (completionPercentage >= 95) {
      return 'Outstanding! Nearly perfect performance!';
    }
    if (completionPercentage >= 80) {
      return 'Excellent work! You crushed this challenge!';
    }
    if (completionPercentage >= 60) {
      return 'Great job! You showed real dedication!';
    }
    return 'You completed the challenge!';
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleContinueAsHabit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onContinueAsHabit) {
      onContinueAsHabit();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleClose}
        />

        <Animated.View
          entering={SlideInDown.springify()}
          style={[styles.modalContainer, { paddingBottom: insets.bottom + 20 }]}
        >
          <LinearGradient
            colors={['#000000', '#000']}
            style={StyleSheet.absoluteFillObject}
          />

          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={BounceIn.delay(200).springify()} style={styles.badgeContainer}>
              <LinearGradient
                colors={getBadgeColor()}
                style={styles.badgeCircle}
              >
                <Text style={styles.badgeEmoji}>{challenge.badge_emoji}</Text>
              </LinearGradient>
              <Text style={styles.badgeTypeText}>{badgeType.toUpperCase()} BADGE</Text>
            </Animated.View>

            <Animated.View entering={FadeIn.delay(400)}>
              <Text style={styles.title}>Challenge Complete!</Text>
              <Text style={styles.subtitle}>{getBadgeMessage()}</Text>
            </Animated.View>

            <Animated.View entering={FadeIn.delay(600)} style={styles.statsSection}>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <LinearGradient
                    colors={['rgba(255,215,0,0.15)', 'rgba(255,215,0,0.05)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <TrendingUp size={24} color="#FFD700" />
                  <Text style={styles.statValue}>{completionPercentage.toFixed(0)}%</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>

                <View style={styles.statCard}>
                  <LinearGradient
                    colors={['rgba(255,215,0,0.15)', 'rgba(255,215,0,0.05)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Calendar size={24} color="#FFD700" />
                  <Text style={styles.statValue}>{daysTaken}</Text>
                  <Text style={styles.statLabel}>Days Taken</Text>
                </View>
              </View>

              {rank > 0 && (
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <LinearGradient
                      colors={['rgba(255,215,0,0.15)', 'rgba(255,215,0,0.05)']}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Trophy size={24} color="#FFD700" />
                    <Text style={styles.statValue}>#{rank}</Text>
                    <Text style={styles.statLabel}>Final Rank</Text>
                  </View>

                  {percentile > 0 && (
                    <View style={styles.statCard}>
                      <LinearGradient
                        colors={['rgba(255,215,0,0.15)', 'rgba(255,215,0,0.05)']}
                        style={StyleSheet.absoluteFillObject}
                      />
                      <Star size={24} color="#FFD700" />
                      <Text style={styles.statValue}>Top {percentile.toFixed(0)}%</Text>
                      <Text style={styles.statLabel}>Percentile</Text>
                    </View>
                  )}
                </View>
              )}
            </Animated.View>

            <Animated.View entering={FadeIn.delay(800)} style={styles.actions}>
              {badgeType !== 'failed' && (
                <TouchableOpacity
                  style={styles.habitButton}
                  onPress={() => setShowHabitOption(!showHabitOption)}
                >
                  <LinearGradient
                    colors={['rgba(255,215,0,0.2)', 'rgba(255,215,0,0.1)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Award size={20} color="#FFD700" />
                  <Text style={styles.habitButtonText}>Continue as Daily Habit</Text>
                </TouchableOpacity>
              )}

              {showHabitOption && (
                <Animated.View entering={FadeIn} style={styles.habitNote}>
                  <Text style={styles.habitNoteText}>
                    Keep your momentum going! Your challenge activities will be added to your Daily page.
                  </Text>
                  <TouchableOpacity style={styles.confirmButton} onPress={handleContinueAsHabit}>
                    <LinearGradient
                      colors={['#FFD700', '#FFA500']}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Text style={styles.confirmButtonText}>Yes, Continue!</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}

              <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '85%',
    backgroundColor: '#000',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  badgeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  badgeEmoji: {
    fontSize: 60,
  },
  badgeTypeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
    marginTop: 16,
    letterSpacing: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  statsSection: {
    gap: 12,
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
    overflow: 'hidden',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  actions: {
    gap: 16,
    paddingBottom: 20,
  },
  habitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    overflow: 'hidden',
    gap: 8,
  },
  habitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
  },
  habitNote: {
    backgroundColor: 'rgba(255,215,0,0.05)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  habitNoteText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  doneButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
});
