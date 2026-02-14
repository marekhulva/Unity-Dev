import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Polyline } from 'react-native-svg';

interface CommitmentCardProps {
  action: any;
  onPress: () => void;
  onLongPress: () => void;
}

export const CommitmentCard: React.FC<CommitmentCardProps> = ({ action, onPress, onLongPress }) => {
  const isDone = action.done;

  return (
    <Pressable
      style={[styles.card, isDone && styles.cardDone]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {isDone && <View style={styles.greenStripe} />}

      <View style={[styles.checkbox, isDone && styles.checkboxChecked]}>
        {isDone ? (
          <LinearGradient
            colors={['#D4AF37', '#E7C455']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24">
              <Polyline
                points="20 6 9 17 4 12"
                stroke="#000"
                strokeWidth={3}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
          </LinearGradient>
        ) : (
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Circle
              cx={12}
              cy={12}
              r={10}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1.5}
              fill="none"
            />
          </Svg>
        )}
      </View>

      <View style={styles.info}>
        <Text style={[styles.title, isDone && styles.titleDone]}>{action.title}</Text>
        {(action.challengeName || action.goalTitle) && (
          <View style={styles.meta}>
            <Text style={styles.badge}>{action.challengeName || action.goalTitle}</Text>
          </View>
        )}
      </View>

      {isDone && (
        <View style={styles.doneIndicator}>
          <Text style={styles.doneCheck}>✓</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  cardDone: {
    backgroundColor: 'rgba(34,197,94,0.03)',
    borderColor: 'rgba(34,197,94,0.15)',
  },
  greenStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#22C55E',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.20)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 12,
    overflow: 'hidden',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.96)',
    letterSpacing: 0.2,
    marginBottom: 1,
  },
  titleDone: {
    color: 'rgba(255,255,255,0.40)',
    textDecorationLine: 'line-through',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.40)',
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
});
