import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SectionHeaderProps {
  title: string;
  completedCount: number;
  totalCount: number;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, completedCount, totalCount }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.count}>{completedCount} of {totalCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.40)',
    textTransform: 'uppercase',
  },
  count: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.20)',
  },
});
