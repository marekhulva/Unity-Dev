import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { ProfileTimelineDemo } from './src/demos/ProfileTimelineDemo';

export default function AppDemo() {
  return (
    <SafeAreaView style={styles.container}>
      <ProfileTimelineDemo />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});