import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, Mic, Volume2, Radio } from 'lucide-react-native';
import { Audio } from 'expo-av';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { PostCardBase } from './PostCardBase';
import { Post } from '../../../../state/slices/socialSlice';

interface AudioCardProps {
  post: Post;
  onReact: (emoji: string) => void;
}

export const AudioCard: React.FC<AudioCardProps> = ({ post, onReact }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  
  const waveAnim = useSharedValue(0);

  useEffect(() => {
    waveAnim.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const loadAudio = async () => {
    if (!post.audioUri) return;
    
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: post.audioUri },
        { shouldPlay: false }
      );
      
      setSound(newSound);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setDuration(status.durationMillis || 0);
          setPosition(status.positionMillis || 0);
          setIsPlaying(status.isPlaying);
        }
      });
    } catch (error) {
      console.warn('Failed to load audio:', error);
    }
  };

  const togglePlayback = async () => {
    if (!sound) {
      await loadAudio();
      return;
    }

    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  const waveStyle1 = useAnimatedStyle(() => ({
    opacity: interpolate(waveAnim.value, [0, 1], [0.3, 0.8]),
    transform: [{ scaleX: interpolate(waveAnim.value, [0, 1], [0.8, 1.2]) }],
  }));

  const waveStyle2 = useAnimatedStyle(() => ({
    opacity: interpolate(waveAnim.value, [0, 1], [0.8, 0.3]),
    transform: [{ scaleX: interpolate(waveAnim.value, [0, 1], [1.2, 0.8]) }],
  }));

  const waveStyle3 = useAnimatedStyle(() => ({
    opacity: interpolate(waveAnim.value, [0, 1], [0.5, 1]),
    transform: [{ scaleX: interpolate(waveAnim.value, [0, 1], [1, 1.3]) }],
  }));

  return (
    <PostCardBase
      post={post}
      onReact={onReact}
      borderColor="rgba(147,112,219,0.2)"
      glowColor="rgba(147,112,219,0.15)"
    >
      {/* Audio player */}
      <View style={styles.audioPlayer}>
        <LinearGradient
          colors={['rgba(147,112,219,0.1)', 'rgba(147,112,219,0.05)']}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Play/Pause button */}
        <Pressable onPress={togglePlayback} style={styles.playButton}>
          <LinearGradient
            colors={['#9370DB', '#8A7CC7']}
            style={StyleSheet.absoluteFillObject}
          />
          {isPlaying ? (
            <Pause size={24} color="#FFFFFF" />
          ) : (
            <Play size={24} color="#FFFFFF" style={{ marginLeft: 2 }} />
          )}
        </Pressable>

        {/* Waveform visualization */}
        <View style={styles.waveform}>
          {isPlaying && (
            <>
              <Animated.View style={[styles.wave, waveStyle1]} />
              <Animated.View style={[styles.wave, waveStyle2]} />
              <Animated.View style={[styles.wave, waveStyle3]} />
              <Animated.View style={[styles.wave, waveStyle2]} />
              <Animated.View style={[styles.wave, waveStyle1]} />
            </>
          )}
          {!isPlaying && (
            <>
              <View style={[styles.wave, { opacity: 0.3 }]} />
              <View style={[styles.wave, { opacity: 0.5 }]} />
              <View style={[styles.wave, { opacity: 0.7 }]} />
              <View style={[styles.wave, { opacity: 0.5 }]} />
              <View style={[styles.wave, { opacity: 0.3 }]} />
            </>
          )}
        </View>

        {/* Duration */}
        <Text style={styles.duration}>
          {formatTime(position)} / {formatTime(duration || post.audioDuration || 0)}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <LinearGradient
          colors={['#9370DB', '#8A7CC7']}
          style={[styles.progressFill, { width: `${progress}%` }]}
        />
      </View>

      {/* Audio type indicator */}
      <View style={styles.audioType}>
        {post.audioType === 'voice' && (
          <>
            <Mic size={12} color="#9370DB" />
            <Text style={styles.audioTypeText}>Voice Note</Text>
          </>
        )}
        {post.audioType === 'meditation' && (
          <>
            <Volume2 size={12} color="#9370DB" />
            <Text style={styles.audioTypeText}>Guided Meditation</Text>
          </>
        )}
        {post.audioType === 'podcast' && (
          <>
            <Radio size={12} color="#9370DB" />
            <Text style={styles.audioTypeText}>Podcast Clip</Text>
          </>
        )}
      </View>

      {/* Transcript or caption */}
      {post.content && (
        <View style={styles.transcript}>
          <Text style={styles.transcriptLabel}>Transcript:</Text>
          <Text style={styles.transcriptText}>{post.content}</Text>
        </View>
      )}

      {/* Listening count */}
      {post.listens && post.listens > 0 && (
        <Text style={styles.listens}>🎧 {post.listens} listens</Text>
      )}
    </PostCardBase>
  );
};

const styles = StyleSheet.create({
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 40,
  },
  wave: {
    width: 3,
    height: '60%',
    backgroundColor: '#9370DB',
    borderRadius: 2,
  },
  duration: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(147,112,219,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  audioType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  audioTypeText: {
    fontSize: 11,
    color: '#9370DB',
    fontWeight: '600',
  },
  transcript: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(147,112,219,0.1)',
  },
  transcriptLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
    fontWeight: '600',
  },
  transcriptText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  listens: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
  },
});