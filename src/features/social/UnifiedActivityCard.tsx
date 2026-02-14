import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Post } from '../../state/slices/socialSlice';
import { MessageCircle, Play, Pause, Send, Check } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { isValidContent } from '../../utils/contentValidation';

const { width } = Dimensions.get('window');

interface UnifiedActivityCardProps {
  post: Post;
  onReact: (id: string, emoji: string, which: 'circle' | 'follow') => void;
  onComment: (id: string, text: string) => void;
  onProfilePress?: (userId: string) => void;
  feedView: string;
}

export const UnifiedActivityCard: React.FC<UnifiedActivityCardProps> = ({
  post,
  onReact,
  onComment,
  onProfilePress,
  feedView
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const coinScale = useSharedValue(1);
  const coinGlow = useSharedValue(0);
  
  // Determine what type of content we have
  const hasPhoto = !!post.mediaUrl || !!post.photoUri;
  const hasAudio = !!post.audioUri;
  const hasComment = !!post.content && post.content !== `Completed: ${post.actionTitle}` && post.content !== 'Completed';
  const isJustCheck = !hasPhoto && !hasAudio && !hasComment;
  
  // Check if it's a challenge or has a goal
  const isChallenge = post.isChallenge || false;
  const hasGoal = !!post.goal || !!post.goalTitle;
  
  // Format timestamp
  const formatTimestamp = (time?: string) => {
    if (!time) return 'Today';

    const postTime = new Date(time);

    // Check if date is valid
    if (isNaN(postTime.getTime())) {
      return 'Today';
    }

    const now = new Date();
    const hours = postTime.getHours();
    const minutes = postTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    const timeStr = `${displayHours}:${displayMinutes} ${ampm}`;

    // Check if it's today
    const isToday = postTime.toDateString() === now.toDateString();
    if (isToday) {
      return `Today · ${timeStr}`;
    }

    // Check if it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (postTime.toDateString() === yesterday.toDateString()) {
      return `Yesterday · ${timeStr}`;
    }

    // Check if it's within the last week
    const daysAgo = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo < 7) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `${dayNames[postTime.getDay()]} · ${timeStr}`;
    }

    // Older than a week - show date
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[postTime.getMonth()]} ${postTime.getDate()} · ${timeStr}`;
  };
  
  const handleReact = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animate coin/points
    coinScale.value = withSequence(
      withTiming(0.92, { duration: 70 }),
      withSpring(1, { damping: 12 })
    );
    coinGlow.value = withSequence(
      withTiming(1, { duration: 140 }),
      withTiming(0, { duration: 200 })
    );

    onReact(post.id, '🔥', feedView as 'circle' | 'follow');
  };

  const handleSendComment = () => {
    if (commentText.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onComment(post.id, commentText.trim());
      setCommentText('');
    }
  };
  
  // Set up audio mode on mount for iOS
  useEffect(() => {
    const setupAudio = async () => {
      if (Platform.OS === 'ios' && hasAudio) {
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false
          });
        } catch (error) {
          if (__DEV__) console.error('Error setting audio mode:', error);
        }
      }
    };
    setupAudio();
    
    // Cleanup
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [hasAudio]);
  
  const handlePlayAudio = async () => {
    if (!hasAudio || !post.audioUri) return;
    
    try {
      // Configure audio session for iOS
      if (Platform.OS === 'ios') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false
        });
      }
      
      if (isPlayingAudio && sound) {
        // Pause audio
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.pauseAsync();
          setIsPlayingAudio(false);
        }
      } else {
        // Play audio
        if (sound) {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            await sound.playAsync();
            setIsPlayingAudio(true);
          }
        } else {
          // Load and play new audio
          if (__DEV__) console.log('Loading audio from URI:', post.audioUri);
          
          // For iOS, ensure the URI is properly formatted
          let audioUri = post.audioUri;
          if (Platform.OS === 'ios' && audioUri.startsWith('file://')) {
            // iOS sometimes needs the file:// prefix removed or added
            audioUri = audioUri.replace('file://', '');
            if (!audioUri.startsWith('/')) {
              audioUri = '/' + audioUri;
            }
          }
          
          const { sound: newSound, status } = await Audio.Sound.createAsync(
            { uri: audioUri },
            { 
              shouldPlay: true,
              volume: 1.0,
              rate: 1.0,
              shouldCorrectPitch: true
            },
            (playbackStatus) => {
              if (playbackStatus.isLoaded) {
                if (playbackStatus.didJustFinish) {
                  setIsPlayingAudio(false);
                }
              }
            }
          );
          
          setSound(newSound);
          setIsPlayingAudio(true);
          
          // Set up listener for when audio finishes
          newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsPlayingAudio(false);
            }
          });
        }
      }
    } catch (error) {
      if (__DEV__) console.error('Error playing audio:', error);
      // Try alternative URI format for iOS
      if (Platform.OS === 'ios' && post.audioUri) {
        try {
          const alternativeUri = post.audioUri.startsWith('file://') 
            ? post.audioUri 
            : `file://${post.audioUri}`;
          
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: alternativeUri },
            { shouldPlay: true }
          );
          setSound(newSound);
          setIsPlayingAudio(true);
        } catch (altError) {
          if (__DEV__) console.error('Alternative audio playback also failed:', altError);
        }
      }
    }
  };
  
  const coinAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coinScale.value }],
  }));
  
  return (
    <Pressable
      style={styles.cardWrapper}
      onPress={() => {
        if (__DEV__) console.log('🟢 [UnifiedActivityCard] Card clicked anywhere');
      }}
    >
      {/* Silver metallic overlay for challenge cards */}
      {isChallenge && (
        <LinearGradient
          colors={['#C0C0C0', '#808080', '#C0C0C0']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.silverOverlay}
        />
      )}

      <LinearGradient
        colors={['rgba(0,0,0,0.9)', 'rgba(15,15,15,0.95)']}
        start={{x:0,y:0}}
        end={{x:0,y:1}}
        style={[styles.card, isChallenge && styles.cardWithOverlay]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.headerLeft}
            onPress={() => {
              const userId = post.userId || post.user_id || post.user;
              if (__DEV__) console.log('🔴 [UnifiedActivityCard] Profile click - postData:', {
                userId: post.userId,
                user_id: post.user_id,
                user: post.user,
                actualUserId: userId
              });
              if (__DEV__) console.log('🔴 [UnifiedActivityCard] Calling onProfilePress with:', userId);
              if (onProfilePress) {
                if (__DEV__) console.log('🔴 [UnifiedActivityCard] onProfilePress exists, calling it');
                onProfilePress(userId);
              } else {
                if (__DEV__) console.log('🔴 [UnifiedActivityCard] onProfilePress is undefined!');
              }
            }}
          >
            {post.avatar?.startsWith('http') || post.avatar?.startsWith('data:') ? (
              <Image source={{ uri: post.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarEmoji]}>
                <Text style={styles.avatarEmojiText}>{post.avatar || '👤'}</Text>
              </View>
            )}
            <View>
              <Text style={styles.name}>{post.user}</Text>
              <Text style={styles.time}>{formatTimestamp(post.timestamp || post.created_at)}</Text>
            </View>
          </Pressable>
          
          {/* Badge for challenge/goal */}
          {(isChallenge || hasGoal) && (
            <LinearGradient 
              colors={['rgba(255,215,0,0.15)', 'rgba(255,215,0,0.05)']} 
              start={{x:0,y:0}} 
              end={{x:1,y:1}} 
              style={styles.badge}
            >
              <Text style={styles.badgeText}>
                {isChallenge ? `🏆 ${post.challengeName || 'CHALLENGE'}` : `🎯 ${post.goalTitle || 'GOAL'}`}
              </Text>
            </LinearGradient>
          )}
        </View>

        {/* Main Content Area - Adapts based on content type */}
        <View style={styles.contentArea}>
          {/* Check mark and action title - always shown */}
          <View style={styles.actionRow}>
            <GoldCheck size={28} />
            <Text style={styles.actionTitle}>{(post.actionTitle && isValidContent(post.actionTitle) ? post.actionTitle : null) || 'Completed action'}</Text>
            <Animated.View style={[styles.pointsWrap, coinAnimatedStyle]}>
              <Text style={styles.pointsText}>+5</Text>
            </Animated.View>
          </View>
          
          {/* User's comment if provided */}
          {hasComment && (
            <View style={styles.commentSection}>
              <Text style={styles.userComment}>{isValidContent(post.content) ? post.content : ''}</Text>
            </View>
          )}
          
          {/* Photo if provided */}
          {hasPhoto && (
            <View style={styles.photoSection}>
              <Image 
                source={{ uri: post.mediaUrl || post.photoUri }} 
                style={styles.photo}
                resizeMode="cover"
              />
            </View>
          )}
          
          {/* Audio if provided */}
          {hasAudio && (
            <Pressable style={styles.audioSection} onPress={handlePlayAudio}>
              <View style={styles.audioPlayer}>
                {isPlayingAudio ? (
                  <Pause size={20} color="#FFD700" />
                ) : (
                  <Play size={20} color="#FFD700" />
                )}
                <View style={styles.audioWaveform}>
                  {[...Array(20)].map((_, i) => (
                    <View 
                      key={i} 
                      style={[
                        styles.audioBar, 
                        { height: Math.random() * 20 + 10 }
                      ]} 
                    />
                  ))}
                </View>
                <Text style={styles.audioDuration}>0:30</Text>
              </View>
            </Pressable>
          )}
        </View>

        {/* Engagement Section */}
        <View style={styles.engagementSection}>
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, post.userReacted && styles.actionButtonActive]}
              onPress={handleReact}
            >
              <Text style={styles.actionButtonIcon}>🔥</Text>
              <Text style={[styles.actionButtonText, post.userReacted && styles.actionButtonTextActive]}>
                {post.reactionCount || 0}
              </Text>
            </Pressable>

            <Pressable
              style={styles.actionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowComments(!showComments);
              }}
            >
              <MessageCircle size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.actionButtonText}>{post.commentCount || 0}</Text>
            </Pressable>
          </View>
        </View>
        
        {/* Comments Section */}
        {showComments && (
          <View style={styles.commentsSection}>
            {/* Existing comments */}
            {post.comments && post.comments.length > 0 && (
              <>
                {post.comments.map((comment, idx) => (
                  <View key={idx} style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>
                        {comment.userAvatar || comment.user?.charAt(0) || '💬'}
                      </Text>
                    </View>
                    <View style={styles.commentBubble}>
                      <Text style={styles.commentAuthor}>{comment.user}</Text>
                      <Text style={styles.commentText}>{(comment.content && isValidContent(comment.content) ? comment.content : null) || (comment.text && isValidContent(comment.text) ? comment.text : null)}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Comment Input */}
            <View style={styles.commentInputWrapper}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a supportive comment..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                returnKeyType="send"
                onSubmitEditing={handleSendComment}
              />
              <Pressable
                style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
                onPress={handleSendComment}
                disabled={!commentText.trim()}
              >
                <Send size={18} color={commentText.trim() ? '#FFD700' : 'rgba(255,255,255,0.3)'} />
              </Pressable>
            </View>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
};

// Bordered Icon Check Component
function GoldCheck({size=28}:{size?:number}) {
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 1.5,
      borderColor: '#FFD700',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,215,0,0.08)',
    }}>
      <Check size={size * 0.55} color="#FFD700" strokeWidth={2.5} />
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 12,
    position: 'relative',
    width: '100%',
  },
  silverOverlay: {
    position: 'absolute',
    top: -1.5,
    left: -1.5,
    right: -1.5,
    bottom: -1.5,
    borderRadius: 21,
    opacity: 0.4,
    zIndex: 1,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 2,
  },
  cardWithOverlay: {
    borderColor: 'transparent',
  },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: { 
    flexDirection: "row", 
    alignItems: "center", 
    columnGap: 10,
    flex: 1,
  },
  avatar: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: "rgba(255,255,255,0.10)" 
  },
  avatarEmoji: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmojiText: {
    fontSize: 16,
  },
  name: { 
    color: '#FFFFFF', 
    fontSize: 14, 
    fontWeight: "600" 
  },
  time: { 
    color: 'rgba(255,255,255,0.5)', 
    fontSize: 11, 
    marginTop: 1 
  },
  badge: { 
    paddingHorizontal: 10,
    paddingVertical: 5, 
    borderRadius: 999, 
    borderWidth: 1, 
    borderColor: 'rgba(255,215,0,0.2)',
  },
  badgeText: { 
    color: "rgba(255,215,0,0.9)", 
    fontSize: 10, 
    fontWeight: "600", 
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  contentArea: {
    paddingHorizontal: 20,
  },
  actionRow: { 
    flexDirection: "row", 
    alignItems: "center",
    gap: 10,
  },
  actionTitle: { 
    flex: 1,
    color: '#FFFFFF', 
    fontSize: 14, 
    fontWeight: "600"
  },
  pointsWrap: { 
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 12,
  },
  pointsText: { 
    color: '#FFD700', 
    fontSize: 12, 
    fontWeight: "600" 
  },
  commentSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  userComment: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
  },
  photoSection: {
    marginTop: 12,
    marginHorizontal: -20, // Extend photo to card edges
    borderRadius: 0, // Remove border radius on photos
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 250, // Increased height for better display
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  audioSection: {
    marginTop: 12,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  audioWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  audioBar: {
    width: 2,
    backgroundColor: 'rgba(255,215,0,0.3)',
    borderRadius: 1,
  },
  audioDuration: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  engagementSection: {
    padding: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    marginTop: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderColor: 'rgba(255,215,0,0.3)',
  },
  actionButtonIcon: {
    fontSize: 14,
  },
  actionButtonText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  actionButtonTextActive: {
    color: '#FFD700',
  },
  commentsSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    fontSize: 12,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 8,
    paddingHorizontal: 12,
  },
  commentAuthor: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 12,
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,215,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.05)',
  },
});