import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';

interface ComposerRowProps {
  onStatus: () => void;
  onPhoto: () => void;
  onAudio: () => void;
}

export const ComposerRow: React.FC<ComposerRowProps> = ({ onStatus, onPhoto, onAudio }) => {
  return (
    <View style={styles.row}>
      <Pressable 
        onPress={onStatus} 
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed
        ]}
      >
        <Text style={styles.buttonText}>✨ Status</Text>
      </Pressable>
      <Pressable 
        onPress={onPhoto}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed
        ]}
      >
        <Text style={styles.buttonText}>🖼️ Photo</Text>
      </Pressable>
      <Pressable 
        onPress={onAudio}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed
        ]}
      >
        <Text style={styles.buttonText}>🎙️ Audio</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  buttonText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
});