import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Play, Pause, Mic } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface SimpleAudioPlayerProps {
  uri: string;
}

export const SimpleAudioPlayer: React.FC<SimpleAudioPlayerProps> = ({ uri }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const togglePlayback = async () => {
    if (__DEV__) console.log('SimpleAudioPlayer - Toggle playback called');
    if (__DEV__) console.log('URI received:', uri);
    if (__DEV__) console.log('URI type:', typeof uri);
    if (__DEV__) console.log('URI starts with data:audio:', uri?.startsWith('data:audio'));
    if (__DEV__) console.log('URI length:', uri?.length);
    if (__DEV__) console.log('Is playing:', isPlaying);
    
    try {
      if (isPlaying && sound) {
        // Stop playback
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      } else {
        // Start playback
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        // Validate URI before trying to play
        if (!uri) {
          if (__DEV__) console.error('No URI provided for audio playback');
          return;
        }

        if (__DEV__) console.log('Creating audio sound from URI...');
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          (status) => {
            if (__DEV__) console.log('Audio status update:', status);
            if (status.isLoaded && status.didJustFinish) {
              setIsPlaying(false);
            }
          }
        );

        setSound(newSound);
        setIsPlaying(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      if (__DEV__) console.error('Playback error:', error);
      if (__DEV__) console.error('Error details:', JSON.stringify(error, null, 2));
      setIsPlaying(false);
    }
  };

  return (
    <Pressable onPress={togglePlayback} style={styles.container}>
      <LinearGradient
        colors={['rgba(255, 215, 0, 0.08)', 'rgba(255, 215, 0, 0.03)']}
        style={styles.background}
      />
      
      <View style={styles.playButton}>
        {isPlaying ? (
          <Pause size={16} color="#FFD700" />
        ) : (
          <Play size={16} color="rgba(255, 255, 255, 0.7)" />
        )}
      </View>

      <Mic size={14} color="rgba(255, 255, 255, 0.5)" />
      <Text style={styles.label}>Voice Note</Text>
      
      {isPlaying && (
        <View style={styles.indicator}>
          <View style={styles.dot} />
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    height: 44,
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  playButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFD700',
  },
});