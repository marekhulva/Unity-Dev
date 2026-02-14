import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GoalCardProps {
  title: string;
  currentDay?: number;
  totalDays?: number;
  progressPercent: number;
  onPress?: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  title,
  currentDay = 1,
  totalDays = 30,
  progressPercent,
  onPress
}) => {
  const dayLabel = `Day ${currentDay} of ${totalDays}`;

  return (
    <Pressable onPress={onPress}>
      <View style={styles.card}>
        <View style={styles.innerHighlight} />

        <View style={styles.content}>
          <View style={styles.info}>
            <Text style={styles.goalName} numberOfLines={1}>{title}</Text>
            <Text style={styles.goalDay}>{dayLabel}</Text>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]}>
              <LinearGradient
                colors={['#FFD168', '#F5A623']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: 'rgba(10, 10, 12, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  goalName: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.96)',
    marginBottom: 2,
  },
  goalDay: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFC84A',
    letterSpacing: 0.15,
  },
  progressBar: {
    width: 72,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
});