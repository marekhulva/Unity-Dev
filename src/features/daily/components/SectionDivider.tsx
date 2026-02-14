import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const SectionDivider: React.FC = () => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.06)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 1,
    marginTop: 4,
    marginBottom: 20,
    marginHorizontal: 24,
  },
  gradient: {
    flex: 1,
  },
});
