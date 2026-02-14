import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
} from 'react-native-reanimated';

interface CelebrationCardMinimalProps {
  userName: string;
  userAvatar?: string;
  timestamp: string;
  goals?: Array<{
    title: string;
    color: string;
  }>;
}

export const CelebrationCardMinimal: React.FC<CelebrationCardMinimalProps> = ({
  userName,
  timestamp,
  goals = [],
}) => {
  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      style={styles.container}
    >
      {/* Golden gradient line at top */}
      <View style={styles.topGradient}>
        <LinearGradient
          colors={[
            'rgba(212, 175, 55, 0)',
            'rgba(212, 175, 55, 0.4)',
            'rgba(201, 160, 80, 0.4)',
            'rgba(184, 134, 11, 0.4)',
            'rgba(160, 121, 10, 0.4)',
            'rgba(184, 134, 11, 0.4)',
            'rgba(212, 175, 55, 0)'
          ]}
          locations={[0, 0.2, 0.35, 0.5, 0.65, 0.8, 1]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>💯</Text>
          </View>
          
          <View style={styles.textContent}>
            <View style={styles.mainLine}>
              <Text style={styles.mainText}>
                <Text style={styles.userName}>{userName}</Text>
                <Text style={styles.regularText}> completed all daily actions</Text>
              </Text>
              <View style={styles.percentBadge}>
                <LinearGradient
                  colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 165, 0, 0.1)']}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Text style={styles.percentText}>100%</Text>
              </View>
            </View>
            
            {goals.length > 0 && (
              <View style={styles.goalsRow}>
                {goals.map((goal, index) => (
                  <View key={index} style={styles.goalChip}>
                    <View style={[styles.goalDot, { backgroundColor: goal.color }]} />
                    <Text style={styles.goalText}>{goal.title}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(5, 5, 5, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    marginBottom: 12,  // Match regular post cards
    overflow: 'hidden',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    zIndex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    paddingHorizontal: 16,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 14,
  },
  textContent: {
    flex: 1,
    gap: 6,
  },
  mainLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mainText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  userName: {
    color: 'rgba(255, 215, 0, 0.9)',
    fontWeight: '600',
  },
  regularText: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  percentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    overflow: 'hidden',
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
  },
  goalsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  goalDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  goalText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  timestamp: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.3)',
  },
});