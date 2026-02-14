import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Challenge } from '../../../types/challenges.types';

interface ChallengeCardProps {
  challenge: Challenge;
  onPress?: () => void;
}

export const ChallengeCard = ({ challenge, onPress }: ChallengeCardProps) => {
  const startDate = challenge.start_date
    ? new Date(challenge.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'Anytime';

  return (
    <TouchableOpacity style={styles.challengeCard} onPress={onPress}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.challengeEmojiLarge}>{challenge.emoji}</Text>
          <View style={styles.cardHeaderText}>
            <Text style={styles.challengeName}>{challenge.name}</Text>
            <Text style={styles.challengeMeta}>
              {challenge.scope === 'global' ? '🌍 Global' : '👥 Circle'} • {challenge.duration_days} Days
            </Text>
          </View>
        </View>

        <View style={styles.cardStatsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{challenge.participant_count || 0}</Text>
            <Text style={styles.statLabel}> participants</Text>
          </View>
          <Text style={styles.statSeparator}>•</Text>
          <Text style={styles.statLabel}>Starts {startDate}</Text>
        </View>

        <View style={styles.cardStatsRow}>
          <Text style={styles.statLabel}>Success: </Text>
          <Text style={styles.statValue}>{challenge.success_threshold}%</Text>
          <Text style={styles.statSeparator}>•</Text>
          <Text style={styles.statLabel}>Badge: </Text>
          <Text style={styles.statValue}>{challenge.badge_emoji} {challenge.badge_name}</Text>
        </View>

        <View style={styles.cardButtons}>
          <TouchableOpacity style={styles.btnSecondary} onPress={onPress}>
            <Text style={styles.btnSecondaryText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnPrimary} onPress={onPress}>
            <Text style={styles.btnPrimaryText}>Join</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  challengeCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  challengeEmojiLarge: {
    fontSize: 36,
  },
  cardHeaderText: {
    flex: 1,
  },
  challengeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  challengeMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  cardStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 'normal',
    color: 'rgba(255,255,255,0.6)',
  },
  statSeparator: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginHorizontal: 6,
  },
  cardButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});
