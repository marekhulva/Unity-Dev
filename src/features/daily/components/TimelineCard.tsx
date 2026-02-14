import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface TimelineCardProps {
  action: any;
  state: 'default' | 'current' | 'done';
  onPress: () => void;
  onLongPress: () => void;
}

export const TimelineCard: React.FC<TimelineCardProps> = ({ action, state, onPress, onLongPress }) => {
  const isDone = state === 'done';
  const isCurrent = state === 'current';

  const getEmoji = () => {
    if (action.challengeIcon) return action.challengeIcon;
    if (action.title.toLowerCase().includes('workout')) return '💪';
    if (action.title.toLowerCase().includes('read')) return '📖';
    if (action.title.toLowerCase().includes('wake')) return '☀️';
    if (action.title.toLowerCase().includes('water')) return '💧';
    return '🏃';
  };

  return (
    <Pressable
      style={[
        styles.card,
        isDone && styles.cardDone,
        isCurrent && styles.cardCurrent,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {isCurrent && <View style={styles.goldStripe} />}

      <View style={styles.row}>
        <Text style={styles.emoji}>{getEmoji()}</Text>

        <View style={styles.content}>
          <Text style={[styles.title, isDone && styles.titleDone]}>{action.title}</Text>
          <View style={styles.subtitle}>
            {action.challengeName && (
              <>
                <Text style={styles.subtitleText}>{action.challengeName}</Text>
                {action.goalTitle && <View style={styles.dot} />}
              </>
            )}
            {action.goalTitle && <Text style={styles.subtitleText}>{action.goalTitle}</Text>}
          </View>
        </View>

        {isDone && (
          <View style={styles.doneIndicator}>
            <Text style={styles.doneCheck}>✓</Text>
          </View>
        )}

        {isCurrent && (
          <View style={styles.nowBadge}>
            <Text style={styles.nowText}>NOW</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  cardDone: {
    backgroundColor: 'rgba(34,197,94,0.03)',
    borderColor: 'rgba(34,197,94,0.15)',
  },
  cardCurrent: {
    borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: 'rgba(212,175,55,0.04)',
  },
  goldStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#D4AF37',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 20,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 1,
  },
  titleDone: {
    color: 'rgba(255,255,255,0.40)',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  subtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subtitleText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.40)',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  doneIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(34,197,94,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  doneCheck: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '700',
  },
  nowBadge: {
    backgroundColor: 'rgba(212,175,55,0.12)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  nowText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D4AF37',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
