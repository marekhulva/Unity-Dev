import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Pressable, 
  Image,
  TextInput,
  RefreshControl,
  Dimensions,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { 
  Plus,
  Heart,
  MessageCircle,
  Users,
  UserPlus,
  Camera,
  Image as ImageIcon,
  Mic,
  Play,
  Pause,
  X,
  Sparkles,
  Crown,
  Award,
  Target,
  CheckCircle2
} from 'lucide-react-native';
import { useStore } from '../../state/rootStore';
import { Post } from '../../state/slices/socialSlice';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';

// Import existing modals and components  
import { CircleMembersModal } from './CircleMembersModal';
import { JoinCircleModal } from './JoinCircleModal';
import { DiscoverUsersModal } from './DiscoverUsersModal';
// Removed ShareComposer - using inline composer instead

const { width, height } = Dimensions.get('window');

export const SocialScreenV5 = () => {
  const insets = useSafeAreaInsets();
  
  // All the same state and hooks from original
  const feedView = useStore(s => s.feedView);
  const setFeedView = useStore(s => s.setFeedView);
  const circle = useStore(s => s.circleFeed);
  const follow = useStore(s => s.followFeed);
  const completedActions = useStore(s => s.completedActions);
  const user = useStore(s => s.user);
  const circleId = useStore(s => s.circleId);
  const circleName = useStore(s => s.circleName);
  const loadCircleData = useStore(s => s.loadCircleData);
  const fetchFeeds = useStore(s => s.fetchFeeds);
  const loadFollowing = useStore(s => s.loadFollowing);
  const react = useStore(s => s.react);
  const addComment = useStore(s => s.addComment);
  const addPost = useStore(s => s.addPost);
  const clearCheckinPosts = useStore(s => s.clearCheckinPosts);
  const clearCompletedActions = useStore(s => s.clearCompletedActions);
  
  // Clear old check-in posts and completed actions on mount
  useEffect(() => {
    clearCheckinPosts();
    clearCompletedActions();
  }, []);
  
  // Modal states
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showJoinCircleModal, setShowJoinCircleModal] = useState(false);
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Inline composer state
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [postText, setPostText] = useState('');
  const [postPhoto, setPostPhoto] = useState<string | null>(null);
  const [postAudio, setPostAudio] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  
  // Animation values
  const scrollY = useSharedValue(0);
  const fabScale = useSharedValue(1);
  
  // Load data on mount
  useEffect(() => {
    loadCircleData();
    fetchFeeds();
    loadFollowing();
  }, []);
  
  // Combine posts with completed actions (same logic as original)
  const actionPosts: Post[] = completedActions.map(ca => ({
    id: `action-${ca.actionId}`,
    user: 'You',
    avatar: user?.avatar || '👤',
    content: '', // Caption can be empty for check-ins
    type: 'checkin' as const,
    reactions: {},
    time: new Date(ca.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: ca.completedAt,
    goalColor: ca.goalColor || '#FFD700',
    visibility: 'circle' as const,
    // Check-in specific fields
    actionTitle: ca.title,
    goal: ca.goalTitle,
    streak: ca.streak || 0,
  }));
  
  const combinedCircle = [...actionPosts, ...circle]
    .map(post => {
      if (post.user === 'You' || post.user === user?.name || post.user === user?.email) {
        return { ...post, avatar: user?.avatar || post.avatar || '👤' };
      }
      return post;
    })
    .sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, 20);
  
  const posts: Post[] = feedView === 'circle' ? combinedCircle : follow;
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchFeeds();
    setIsRefreshing(false);
  };
  
  // Animated header style
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.95],
      Extrapolate.CLAMP
    );
    
    return {
      opacity
    };
  });
  
  // Handle post submission
  const handlePost = async () => {
    if (!postText.trim() && !postPhoto && !postAudio) return;
    
    // Determine the post type based on media
    let postType = 'status';
    if (postPhoto) {
      postType = 'photo';
      console.log('Posting photo:', postPhoto);
    } else if (postAudio) {
      postType = 'audio';
      console.log('Posting audio:', postAudio);
    }
    
    await addPost({
      content: postText,
      type: postType,
      visibility: feedView === 'circle' ? 'circle' : 'follow',
      photoUri: postPhoto,
      audioUri: postAudio,
    });
    
    // Reset composer
    setPostText('');
    setPostPhoto(null);
    setPostAudio(null);
    setComposerExpanded(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Success);
  };
  
  // Handle photo picker
  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to add photos!');
      return;
    }
    
    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets[0]) {
      setPostPhoto(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  // Handle camera capture
  const takePhoto = async () => {
    // Request permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to take photos!');
      return;
    }
    
    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets[0]) {
      setPostPhoto(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  // Handle audio recording
  const toggleRecording = async () => {
    if (isRecording && recording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setPostAudio(uri);
      setIsRecording(false);
      setRecording(null);
    } else {
      const { status } = await Audio.requestPermissionsAsync();
      if (status === 'granted') {
        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(newRecording);
        setIsRecording(true);
      }
    }
  };
  
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Luxury Header */}
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <View style={styles.headerTop}>
            <Text style={styles.logoText}>UNITY</Text>
            <View style={styles.headerActions}>
              {feedView === 'circle' ? (
                <Pressable 
                  style={styles.headerButton}
                  onPress={() => setShowMembersModal(true)}
                >
                  <Users size={20} color="#FFD700" />
                </Pressable>
              ) : (
                <Pressable 
                  style={styles.headerButton}
                  onPress={() => setShowDiscoverModal(true)}
                >
                  <UserPlus size={20} color="#FFD700" />
                </Pressable>
              )}
            </View>
          </View>
          
          {/* Minimal Tab Selector */}
          <View style={styles.tabRow}>
            <Pressable 
              onPress={() => {
                setFeedView('circle');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={styles.tabButton}
            >
              <Text style={[
                styles.tabText,
                feedView === 'circle' && styles.tabTextActive
              ]}>
                CIRCLE
              </Text>
              {feedView === 'circle' && (
                <View style={styles.tabIndicator}>
                  <LinearGradient
                    colors={['#FFD700', '#F5A623']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
              )}
            </Pressable>
            
            <Pressable 
              onPress={() => {
                setFeedView('following');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={styles.tabButton}
            >
              <Text style={[
                styles.tabText,
                feedView === 'following' && styles.tabTextActive
              ]}>
                FOLLOWING
              </Text>
              {feedView === 'following' && (
                <View style={styles.tabIndicator}>
                  <LinearGradient
                    colors={['#FFD700', '#F5A623']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
            )}
            </Pressable>
          </View>
          
          {/* Circle Status Bar */}
          {feedView === 'circle' && circleId && (
            <View style={styles.statusBar}>
              <View style={styles.statusItem}>
                <Crown size={14} color="#FFD700" />
                <Text style={styles.statusText}>{circleName}</Text>
              </View>
              <View style={styles.statusDivider} />
              <View style={styles.statusItem}>
                <Sparkles size={14} color="#FFD700" />
                <Text style={styles.statusText}>{posts.length} active today</Text>
              </View>
            </View>
          )}
        </Animated.View>
        
        <View style={styles.scrollViewWrapper}>
          {/* Background texture image */}
          <Image 
            source={require('../../../assets/images/background-texture.jpg')}
            style={styles.backgroundTexture}
            resizeMode="stretch"
            pointerEvents="none"
          />
          {/* Dark overlay to make background darker */}
          <View style={styles.darkOverlay} pointerEvents="none" />
          
          <Animated.ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={(e) => {
              scrollY.value = e.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#FFD700"
                progressBackgroundColor="#000000"
              />
            }
          >
          {/* Inline Composer with White Glow */}
          <Animated.View 
            style={[
              styles.inlineComposer,
              composerExpanded && styles.inlineComposerExpanded,
              {
                shadowColor: '#FFFFFF',  // Changed from gold to white
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.3,
                shadowRadius: 25,
              }
            ]}
          >
            {/* Enhanced white glow background */}
            <View style={styles.composerGlow}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)', 'transparent']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0.5, y: 0.5 }}
                end={{ x: 0, y: 0 }}
              />
            </View>
            
            {!composerExpanded ? (
              // Collapsed state
              <Pressable 
                style={styles.composerCollapsed}
                onPress={() => {
                  setComposerExpanded(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Image 
                  source={{ uri: user?.avatar || 'https://via.placeholder.com/32' }}
                  style={styles.composerAvatar}
                />
                <Text style={styles.composerPlaceholder}>Share your victory...</Text>
                <View style={styles.composerIcons}>
                  <Camera size={18} color="rgba(255,215,0,0.4)" />
                  <ImageIcon size={18} color="rgba(255,215,0,0.4)" />
                  <Mic size={18} color="rgba(255,215,0,0.4)" />
                </View>
              </Pressable>
            ) : (
              // Expanded state
              <View style={styles.composerExpanded}>
                <View style={styles.composerHeader}>
                  <Image 
                    source={{ uri: user?.avatar || 'https://via.placeholder.com/40' }}
                    style={styles.composerAvatarLarge}
                  />
                  <Text style={styles.composerName}>{user?.name || 'You'}</Text>
                  <Pressable 
                    style={styles.composerClose}
                    onPress={() => setComposerExpanded(false)}
                  >
                    <X size={20} color="rgba(255,255,255,0.4)" />
                  </Pressable>
                </View>
                
                <TextInput
                  style={styles.composerInput}
                  placeholder="Share your victory..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={postText}
                  onChangeText={setPostText}
                  multiline
                  autoFocus
                />
                
                {/* Media preview */}
                {postPhoto && (
                  <View style={styles.mediaPreview}>
                    <Image source={{ uri: postPhoto }} style={styles.previewImage} />
                    <Pressable 
                      style={styles.removeMedia}
                      onPress={() => setPostPhoto(null)}
                    >
                      <X size={16} color="#000" />
                    </Pressable>
                  </View>
                )}
                
                {postAudio && (
                  <View style={styles.audioPreview}>
                    <Play size={20} color="#FFD700" />
                    <Text style={styles.audioText}>Audio recorded</Text>
                    <Pressable onPress={() => setPostAudio(null)}>
                      <X size={16} color="rgba(255,255,255,0.4)" />
                    </Pressable>
                  </View>
                )}
                
                <View style={styles.composerActions}>
                  <View style={styles.composerMediaButtons}>
                    <Pressable 
                      style={styles.mediaButton}
                      onPress={takePhoto}
                    >
                      <Camera size={20} color="rgba(255,255,255,0.4)" />
                    </Pressable>
                    <Pressable 
                      style={styles.mediaButton}
                      onPress={pickImage}
                    >
                      <ImageIcon size={20} color="rgba(255,255,255,0.4)" />
                    </Pressable>
                    <Pressable 
                      style={[
                        styles.mediaButton,
                        isRecording && styles.mediaButtonActive
                      ]}
                      onPress={toggleRecording}
                    >
                      <Mic 
                        size={20} 
                        color={isRecording ? '#FFD700' : 'rgba(255,255,255,0.4)'} 
                      />
                    </Pressable>
                  </View>
                  
                  <Pressable 
                    style={[
                      styles.postButton,
                      (!postText.trim() && !postPhoto && !postAudio) && styles.postButtonDisabled
                    ]}
                    onPress={handlePost}
                    disabled={!postText.trim() && !postPhoto && !postAudio}
                  >
                    <LinearGradient
                      colors={['#FFD700', '#F5A623']}
                      style={StyleSheet.absoluteFillObject}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                    <Text style={styles.postButtonText}>POST</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </Animated.View>
          
          {/* Join Circle Card if needed */}
          {feedView === 'circle' && !circleId && (
            <Pressable 
              style={styles.joinCard}
              onPress={() => setShowJoinCircleModal(true)}
            >
              <LinearGradient
                colors={['rgba(255,215,0,0.1)', 'rgba(255,215,0,0.05)']}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.joinCardIcon}>
                <Users size={32} color="#FFD700" />
              </View>
              <Text style={styles.joinCardTitle}>Join Your Circle</Text>
              <Text style={styles.joinCardSubtitle}>
                Connect with your inner circle
              </Text>
            </Pressable>
          )}
          
          {/* Posts */}
          {posts.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Sparkles size={48} color="rgba(255,215,0,0.3)" />
              </View>
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySubtitle}>
                Be the first to share your victory
              </Text>
            </View>
          ) : (
            <View style={styles.postsContainer}>
              {posts.map((post, index) => (
                <LuxuryPostCard 
                  key={post.id} 
                  post={post} 
                  onReact={react}
                  onComment={addComment}
                  delay={index * 50}
                  feedView={feedView}
                />
              ))}
            </View>
          )}
        </Animated.ScrollView>
        </View>
      </SafeAreaView>
      
      {/* Modals */}
      <CircleMembersModal 
        visible={showMembersModal}
        onClose={() => setShowMembersModal(false)}
      />
      
      <JoinCircleModal
        visible={showJoinCircleModal}
        onClose={() => setShowJoinCircleModal(false)}
      />
      
      <DiscoverUsersModal
        visible={showDiscoverModal}
        onClose={() => setShowDiscoverModal(false)}
      />
    </View>
  );
};

// Luxury Post Card Component
const LuxuryPostCard: React.FC<{
  post: Post;
  onReact: (id: string, emoji: string, which: 'circle' | 'follow') => void;
  onComment: (postId: string, content: string, which: 'circle' | 'follow') => void;
  delay: number;
  feedView: string;
}> = ({ post, onReact, onComment, delay, feedView }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const scaleAnim = useSharedValue(1);
  
  const visibility = feedView === 'circle' ? 'circle' : 'follow';
  
  // Debug logging
  if (post.mediaUrl) {
    console.log('Post has mediaUrl:', post.mediaUrl);
  }
  
  // Check for photo and audio
  const hasPhoto = !!post.photoUri;
  const hasAudio = !!post.audioUri;
  
  console.log('Post detection - hasPhoto:', hasPhoto, 'photoUri:', post.photoUri, 'hasAudio:', hasAudio, 'audioUri:', post.audioUri);
  
  // Handle audio playback
  const toggleAudio = async () => {
    if (hasAudio && post.audioUri) {
      if (isPlaying && sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: post.audioUri },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    }
  };
  
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);
  
  const handleReact = () => {
    scaleAnim.value = withSpring(0.95, {}, () => {
      scaleAnim.value = withSpring(1);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onReact(post.id, '❤️', visibility);
  };
  
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }]
  }));
  
  const getPostTypeIcon = () => {
    switch(post.type) {
      case 'check-in':
        return <Award size={14} color="#FFD700" />;
      case 'milestone':
        return <Crown size={14} color="#FFD700" />;
      case 'goal':
        return <Sparkles size={14} color="#FFD700" />;
      default:
        return null;
    }
  };
  
  return (
    <Animated.View 
      entering={FadeIn.delay(delay).duration(600)}
      style={animatedCardStyle}
    >
      <View style={styles.postCard}>
        {/* Post Header - hide for check-in posts */}
        {post.type !== 'checkin' && (
          <View style={styles.postHeader}>
            <View style={styles.postAvatarContainer}>
              <Image 
                source={{ uri: post.avatar || 'https://via.placeholder.com/48' }}
                style={styles.postAvatar}
              />
              {post.user === 'You' && (
                <View style={styles.avatarBadge}>
                  <Crown size={10} color="#000" />
                </View>
              )}
            </View>
            
            <View style={styles.postHeaderInfo}>
              <View style={styles.postHeaderTop}>
                <Text style={styles.postUsername}>{post.user}</Text>
                <Text style={styles.postTimeSeparator}>•</Text>
                <Text style={styles.postTime}>{post.time || 'now'}</Text>
                {getPostTypeIcon()}
              </View>
            </View>
          </View>
        )}
        
        {/* Photo Display First (if exists) - Full Width */}
        {hasPhoto && post.type !== 'checkin' && (
          <View style={styles.photoContainer}>
            <Image 
              source={{ uri: post.photoUri }}
              style={styles.postPhoto}
              resizeMode="cover"
            />
          </View>
        )}
        
        {/* Post Content */}
        <View style={styles.postContent}>
          {/* Special rendering for check-in posts - WITH PROMINENT USER */}
          {post.type === 'checkin' && post.actionTitle ? (
            <View style={styles.checkinCardNew}>
              {/* Subtle celebration gradient overlay - reduced */}
              <LinearGradient
                colors={['rgba(255, 215, 0, 0.06)', 'rgba(255, 215, 0, 0.02)', 'transparent']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              
              {/* Gold accent bar removed - too overwhelming */}
              
              {/* User Header Row - PROMINENT */}
              <View style={styles.checkinUserHeader}>
                {/* Profile Picture */}
                <View style={styles.checkinUserAvatar}>
                  {post.avatar?.startsWith('http') || post.avatar?.startsWith('data:') ? (
                    <Image source={{ uri: post.avatar }} style={styles.checkinUserAvatarImage} />
                  ) : (
                    <Text style={styles.checkinUserAvatarEmoji}>{post.avatar || '👤'}</Text>
                  )}
                </View>
                
                {/* User Name with action on same line */}
                <View style={styles.checkinUserInfo}>
                  <Text style={styles.checkinUserName}>{post.user}</Text>
                  <Text style={styles.checkinUserAction}>completed a task</Text>
                </View>
                
                {/* Streak badge if exists */}
                {post.streak && post.streak > 0 && (
                  <View style={styles.checkinStreakBadge}>
                    <Text style={styles.checkinStreakEmoji}>🔥</Text>
                    <Text style={styles.checkinStreakNumber}>{post.streak}</Text>
                  </View>
                )}
              </View>
              
              {/* Action Content Row */}
              <View style={styles.checkinActionRow}>
                {/* Check icon */}
                <View style={styles.checkinCheckIcon}>
                  <CheckCircle2 size={20} color="#FFD700" />
                </View>
                
                {/* Action details - activity and goal on same line */}
                <View style={styles.checkinActionContent}>
                  <View style={styles.checkinActionLine}>
                    <Text style={styles.checkinActionTitle}>{post.actionTitle}</Text>
                    {post.goal && (
                      <>
                        <Text style={styles.checkinActionSeparator}>•</Text>
                        <Text style={styles.checkinActionGoal}>{post.goal}</Text>
                      </>
                    )}
                  </View>
                </View>
              </View>
            </View>
          ) : post.content ? (
            <Text style={[styles.postText, hasPhoto && styles.postTextWithPhoto]}>{post.content}</Text>
          ) : null}
        </View>
        
        {/* Audio Display */}
        {hasAudio && (
            <Pressable style={styles.audioContainer} onPress={toggleAudio}>
              <LinearGradient
                colors={['rgba(255,215,0,0.1)', 'rgba(255,215,0,0.05)']}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.audioButton}>
                {isPlaying ? (
                  <Pause size={20} color="#FFD700" fill="#FFD700" />
                ) : (
                  <Play size={20} color="#FFD700" fill="#FFD700" />
                )}
              </View>
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
            </Pressable>
          )}
        
        {/* Post Actions */}
        <View style={styles.postActions}>
          <Pressable style={styles.actionButton} onPress={handleReact}>
            <Heart 
              size={20} 
              color={post.userReacted ? '#FFD700' : 'rgba(255,255,255,0.4)'}
              fill={post.userReacted ? '#FFD700' : 'transparent'}
              strokeWidth={1.5}
            />
            {Object.keys(post.reactions || {}).length > 0 && (
              <Text style={styles.actionCount}>
                {Object.keys(post.reactions).length}
              </Text>
            )}
          </Pressable>
          
          <Pressable 
            style={styles.actionButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Would open comment modal
            }}
          >
            <MessageCircle 
              size={20} 
              color="rgba(255,255,255,0.4)"
              strokeWidth={1.5}
            />
            {post.comments && post.comments.length > 0 && (
              <Text style={styles.actionCount}>
                {post.comments.length}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Reverted to black
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 8, // Reduced from 12 to 8 for wider cards
    paddingBottom: 15, // Space for the tabs
    backgroundColor: '#000000', // Reverted to black
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,215,0,0.2)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 4,
    color: '#FFFFFF',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    marginLeft: 24, // Move slightly to the right
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 8,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 40,
    justifyContent: 'center',
    paddingTop: 5,
  },
  tabButton: {
    paddingBottom: 8,
    position: 'relative',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.4)',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    overflow: 'hidden',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
  statusDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  scrollViewWrapper: {
    flex: 1,
    position: 'relative',
  },
  backgroundTexture: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.1, // Increased visibility to see the pattern better
    zIndex: -2,
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 50% black overlay - lighter
    zIndex: -1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent', // Transparent to show background
    zIndex: 1,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 120,
    paddingHorizontal: 8, // Add horizontal padding for consistent width
  },
  inlineComposer: {
    marginHorizontal: 0, // No margin - use container padding for full width
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',  // Changed to white
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FFFFFF',  // Changed from gold to white
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  composerGlow: {
    position: 'absolute',
    top: -30,
    left: -30,
    right: -30,
    bottom: -30,
    opacity: 0.6,
  },
  inlineComposerExpanded: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.25)',  // Changed to white
    boxShadow: '0 0 10px rgba(255, 255, 255, 0.08)',  // Changed to white
  },
  composerCollapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, // Add padding for spacing from edges
    paddingVertical: 16,
  },
  composerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 16,
  },
  composerPlaceholder: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  composerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  composerExpanded: {
    padding: 20,
  },
  composerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  composerAvatarLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 12,
  },
  composerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  composerClose: {
    padding: 4,
  },
  composerInput: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 24,
    minHeight: 80,
    marginBottom: 16,
    letterSpacing: 0.3,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  mediaPreview: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  removeMedia: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,215,0,0.2)',
    marginBottom: 16,
  },
  audioText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  composerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  composerMediaButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  mediaButton: {
    padding: 8,
  },
  mediaButtonActive: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 20,
  },
  postButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  postButtonDisabled: {
    opacity: 0.3,
  },
  postButtonText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    color: '#000000',
  },
  joinCard: {
    marginHorizontal: 24,
    marginBottom: 32,
    padding: 48,
    borderRadius: 0,
    borderWidth: 0.5,
    borderColor: 'rgba(255,215,0,0.3)',
    alignItems: 'center',
    overflow: 'hidden',
  },
  joinCardIcon: {
    marginBottom: 20,
  },
  joinCardTitle: {
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 1,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  joinCardSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
  },
  emptyState: {
    paddingVertical: 120,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
  },
  postsContainer: {
    paddingHorizontal: 0, // No padding - using scrollContent padding
    gap: 32,
  },
  postCard: {
    marginBottom: 32,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,  // Reduced from 20 to make more compact
  },
  postAvatarContainer: {
    position: 'relative',
  },
  postAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postHeaderInfo: {
    marginLeft: 16,
    flex: 1,
  },
  postHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postUsername: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  postTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
  },
  postTimeSeparator: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
  },
  postContent: {
    marginBottom: 12,  // Reduced bottom margin
    paddingHorizontal: 0, // No padding for full width check-in cards
  },
  postText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 24,
    letterSpacing: 0.3,
    paddingHorizontal: 16, // Add padding for regular text posts
  },
  postTextWithPhoto: {
    textAlign: 'center',  // Center align text only when with photo
  },
  photoContainer: {
    marginTop: 0,  // No top margin since it comes right after header
    marginHorizontal: -12,  // Negative margin to extend to edges
    marginBottom: 16,  // Space before text below
    overflow: 'hidden',
    borderWidth: 0,  // Remove border for cleaner look
  },
  postPhoto: {
    width: '100%',
    aspectRatio: 1,  // Square aspect ratio like Instagram
    backgroundColor: 'rgba(0,0,0,0.5)',  // Darker background for loading state
  },
  audioContainer: {
    marginTop: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255,215,0,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  audioButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,215,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  audioWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  audioBar: {
    width: 2,
    backgroundColor: 'rgba(255,215,0,0.3)',
  },
  postActions: {
    flexDirection: 'row',
    gap: 32,
    paddingTop: 20,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
  // Check-in post styles - NEW VERSION WITH PROMINENT USER
  checkinCardNew: {
    backgroundColor: 'rgba(10, 10, 12, 0.7)',
    borderRadius: 20, // Match inline composer
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)',
    overflow: 'hidden',
    position: 'relative',
    // Subtle celebration glow - reduced
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginHorizontal: 0, // Same as inline composer
  },
  checkinUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 6,
    gap: 12,
  },
  checkinUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  checkinUserAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  checkinUserAvatarEmoji: {
    fontSize: 22,
  },
  checkinUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkinUserName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  checkinUserAction: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.3,
  },
  checkinStreakBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkinStreakEmoji: {
    fontSize: 16,
  },
  checkinStreakNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
  },
  checkinActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 2,
    gap: 10,
  },
  checkinCheckIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkinActionContent: {
    flex: 1,
  },
  checkinActionLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkinActionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  checkinActionSeparator: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.3)',
  },
  checkinActionGoal: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '500',
  },
  // All unused checkin styles removed
});