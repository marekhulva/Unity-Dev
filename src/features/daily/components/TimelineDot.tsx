import React from 'react';
import { View, StyleSheet } from 'react-native';

interface TimelineDotProps {
  state: 'default' | 'active' | 'done';
}

export const TimelineDot: React.FC<TimelineDotProps> = ({ state }) => {
  return (
    <View style={[styles.dot, styles[state]]} />
  );
};

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    left: 32,
    top: 14,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: '#000000',
    zIndex: 2,
  },
  default: {
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  active: {
    backgroundColor: '#D4AF37',
    shadowColor: 'rgba(231,180,58,0.5)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 12,
  },
  done: {
    backgroundColor: '#22C55E',
    shadowColor: 'rgba(34,197,94,0.4)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
});
