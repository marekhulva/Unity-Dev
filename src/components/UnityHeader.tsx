import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface UnityHeaderProps {
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export const UnityHeader: React.FC<UnityHeaderProps> = ({ leftContent, rightContent }) => (
  <>
    <View style={styles.header}>
      {leftContent ? (
        <>
          <View style={styles.sideSlot}>{leftContent}</View>
          <Text style={styles.logoText}>UNITY</Text>
          <View style={styles.sideSlot}>{rightContent}</View>
        </>
      ) : (
        <>
          <Text style={styles.logoText}>UNITY</Text>
          <View style={styles.sideSlot}>{rightContent}</View>
        </>
      )}
    </View>
    <LinearGradient
      colors={['transparent', '#FFD700', 'transparent']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.goldLine}
    />
  </>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 60,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 3,
  },
  sideSlot: {
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  goldLine: {
    height: 1,
    marginHorizontal: 20,
  },
});
