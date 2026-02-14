import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { LuxuryTheme } from '../../design/luxuryTheme';

export const ResetOnboardingButton: React.FC = () => {
  const handleReset = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will clear all onboarding data and restart the app. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            if (typeof localStorage !== 'undefined') {
              localStorage.removeItem('onboarding_completed');
              localStorage.removeItem('onboarding_milestones');
            }
            if (typeof window !== 'undefined' && window.location) {
              window.location.reload();
            }
            // For mobile, you might want to reset the app state instead
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity onPress={handleReset} style={styles.button}>
      <Text style={styles.text}>Reset Onboarding</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.4)',
  },
  text: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
  },
});