import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Play, Pause, Mic } from 'lucide-react-native';
import { Audio } from 'expo-av';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface AudioPlayerProps {
  uri: string;
  duration?: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ uri, duration = 0 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(duration);
  const waveAnimation = useSharedValue(0);

  useEffect(() => {
    // Animate waves when playing
    if (isPlaying) {
      waveAnimation.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
    } else {
      waveAnimation.value = withTiming(0, { duration: 200 });
    }
  }, [isPlaying]);

  const waveStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + waveAnimation.value * 0.5,
    transform: [{ scaleY: 0.5 + waveAnimation.value * 0.5 }],
  }));

  const loadAndPlaySound = async () => {
    try {
      if (!uri) {
        if (__DEV__) console.error('No audio URI provided');
        return;
      }

      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setPlaybackPosition(status.positionMillis || 0);
            setPlaybackDuration(status.durationMillis || 0);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPlaybackPosition(0);
            }
          }
        }
      );

      setSound(sound);
      setIsPlaying(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      if (__DEV__) console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const stopSound = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setPlaybackPosition(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopSound();
    } else {
      loadAndPlaySound();
    }
  };

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const formatDuration = (millis: number) => {
    const seconds = Math.floor(millis / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Pressable onPress={togglePlayback} style={styles.container}>
      <LinearGradient
        colors={isPlaying 
          ? ['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']
          : ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
        style={styles.background}
      />
      
      <View style={styles.content}>
        {/* Play/Pause Button */}
        <View style={styles.playButton}>
          {isPlaying ? (
            <Pause size={18} color="#FFD700" />
          ) : (
            <Play size={18} color="rgba(255, 255, 255, 0.8)" />
          )}
        </View>

        {/* Waveform Visualization */}
        <View style={styles.waveContainer}>
          {[...Array(15)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.wave,
                {
                  height: 8 + (i % 3) * 4,
                  opacity: isPlaying ? 0.8 : 0.3,
                },
              ]}
            />
          ))}
        </View>

        {/* Duration */}
        <Text style={styles.duration}>
          {playbackDuration > 0 ? formatDuration(playbackPosition) + ' / ' + formatDuration(playbackDuration) : '0:00'}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    height: 56,
    maxHeight: 56,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    height: 56,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 24,
  },
  wave: {
    width: 2,
    backgroundColor: '#FFD700',
    borderRadius: 1,
  },
  duration: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
});