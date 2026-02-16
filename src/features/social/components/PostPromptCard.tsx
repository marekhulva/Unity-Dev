import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  TextInput, 
  FlatList,
  Dimensions,
  Platform,
  Image,
  Alert,
  ViewToken
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
  FadeIn,
  FadeOut,
  withSpring,
} from 'react-native-reanimated';
import { 
  Type, 
  Camera, 
  Mic, 
  Send, 
  Circle,
  Square,
  Trash2,
  Check,
  Settings,
  Play
} from 'lucide-react-native';
import { LuxuryTheme } from '../../../design/luxuryTheme';
import { LuxuryColors } from '../../../design/luxuryColors';
import { useStore } from '../../../state/rootStore';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { isFeatureEnabled } from '../../../utils/featureFlags';
import { FixedPromptCarousel } from './FixedPromptCarousel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PROMPT_WIDTH = SCREEN_WIDTH - 64;

const PROMPTS = [
  { text: "What's your biggest insight today?", accent: 'purple' },
  { text: "What challenged you most today?", accent: 'red' },
  { text: "Drop a photo from your habit grind", accent: 'teal' },
  { text: "Share a win from today", accent: 'gold' },
  { text: "What are you grateful for?", accent: 'purple' },
  { text: "How did you push your limits?", accent: 'red' },
  { text: "What's keeping you motivated?", accent: 'gold' },
  { text: "Share your morning routine", accent: 'teal' },
];

// Color system for Coca
const CocaColors = {
  gold: LuxuryTheme.colors.primary.gold,
  amber: LuxuryTheme.colors.primary.champagne,
  teal: '#4DB6AC',
  green: '#66BB6A',
  purple: '#9C27B0',
  blue: '#42A5F5',
  red: '#EF5350',
  orange: LuxuryTheme.colors.primary.champagne,
  dark: '#000',
  charcoal: '#1A1A1A',
  glass: 'rgba(10, 10, 10, 0.95)',
  silver: LuxuryTheme.colors.primary.silver,
  neonBlue: LuxuryTheme.colors.primary.gold,
  softGold: LuxuryTheme.colors.primary.gold,
};

const getAccentColor = (accent: string) => {
  switch(accent) {
    case 'gold': return CocaColors.gold;
    case 'teal': return CocaColors.teal;
    case 'purple': return CocaColors.purple;
    case 'red': return CocaColors.red;
    default: return CocaColors.amber;
  }
};

type PostMode = 'text' | 'photo' | 'audio';

interface PostPromptCardProps {
  onOpenComposer: (type: 'status' | 'photo' | 'audio', prompt?: string) => void;
}

// Improved PromptStrip component with FlatList for perfect snapping
const PromptStrip: React.FC<{ 
  prompts: any[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onPromptSelect: (prompt: any) => void;
}> = ({ prompts, currentIndex, onIndexChange, onPromptSelect }) => {
  const flatListRef = useRef<FlatList>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const autoRotateTimeoutRef = useRef<NodeJS.Timeout>();
  const interactionTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-rotate prompts only when user is not interacting
  useEffect(() => {
    if (!isUserInteracting && prompts.length > 0) {
      autoRotateTimeoutRef.current = setTimeout(() => {
        const nextIndex = (currentIndex + 1) % prompts.length;
        flatListRef.current?.scrollToIndex({ 
          index: nextIndex, 
          animated: true 
        });
        onIndexChange(nextIndex);
      }, 8000);
    }
    
    return () => {
      if (autoRotateTimeoutRef.current) {
        clearTimeout(autoRotateTimeoutRef.current);
      }
    };
  }, [currentIndex, prompts.length, isUserInteracting]);

  const handleViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      onIndexChange(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 200,
  }).current;

  const handlePromptPress = (index: number, prompt: any) => {
    // Stop auto-rotation when user interacts
    setIsUserInteracting(true);
    if (autoRotateTimeoutRef.current) {
      clearTimeout(autoRotateTimeoutRef.current);
    }
    
    // Scroll to selected prompt
    flatListRef.current?.scrollToIndex({ 
      index, 
      animated: true 
    });
    onIndexChange(index);
    onPromptSelect(prompt);
    
    // Resume auto-rotation after 5 seconds
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
    interactionTimeoutRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 5000);
  };

  const handleScrollBegin = () => {
    setIsUserInteracting(true);
    if (autoRotateTimeoutRef.current) {
      clearTimeout(autoRotateTimeoutRef.current);
    }
  };

  const handleScrollEnd = () => {
    // Resume auto-rotation after user stops scrolling
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
    interactionTimeoutRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 3000);
  };

  const renderPrompt = ({ item, index }: { item: any; index: number }) => {
    // Ensure item is never empty
    const displayItem = item || PROMPTS[index % PROMPTS.length];
    const displayText = typeof displayItem === 'string' ? displayItem : displayItem.text;
    const accentColor = typeof displayItem === 'string' ? CocaColors.amber : getAccentColor(displayItem.accent);
    
    return (
      <Pressable
        style={({ pressed }) => [
          promptStyles.promptItem,
          pressed && promptStyles.promptItemPressed
        ]}
        onPress={() => handlePromptPress(index, displayItem)}
      >
        <Text 
          style={[
            promptStyles.promptText,
            index === currentIndex && promptStyles.promptTextActive
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {displayText}
        </Text>
      </Pressable>
    );
  };

  // Ensure we always have valid prompts
  const validPrompts = prompts.length > 0 ? prompts : PROMPTS;

  return (
    <View style={promptStyles.container}>
      <FlatList
        ref={flatListRef}
        data={validPrompts}
        renderItem={renderPrompt}
        keyExtractor={(item, index) => `prompt-${index}-${item}`}
        horizontal
        pagingEnabled
        snapToAlignment="start"
        snapToInterval={PROMPT_WIDTH}
        decelerationRate={0.9}
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={handleScrollBegin}
        onMomentumScrollEnd={handleScrollEnd}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(data, index) => ({
          length: PROMPT_WIDTH,
          offset: PROMPT_WIDTH * index,
          index,
        })}
        contentContainerStyle={promptStyles.scrollContent}
        initialScrollIndex={0}
        removeClippedSubviews={false}
        windowSize={3}
        maxToRenderPerBatch={3}
        updateCellsBatchingPeriod={100}
      />
    </View>
  );
};

// TextInputCompact component with prompt placeholder
const TextInputCompact: React.FC<{
  value: string;
  onChange: (text: string) => void;
  selectedPrompt?: any;
  luxuryStyles?: any;
  isLuxury?: boolean;
}> = ({ value, onChange, selectedPrompt, luxuryStyles, isLuxury = false }) => {
  const [height, setHeight] = useState(40);
  const [isFocused, setIsFocused] = useState(false);
  const glowAnim = useSharedValue(0.5);
  
  useEffect(() => {
    if (isFocused) {
      glowAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
    } else {
      glowAnim.value = withTiming(0.5, { duration: 300 });
    }
  }, [isFocused]);
  
  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(glowAnim.value, [0.5, 1], [0.3, 0.6]),
    shadowRadius: interpolate(glowAnim.value, [0.5, 1], [8, 16]),
  }));
  
  const promptText = typeof selectedPrompt === 'string' ? selectedPrompt : selectedPrompt?.text;
  
  return (
    <Animated.View style={[
      textInputStyles.container, 
      glowStyle,
      isLuxury && luxuryStyles?.input,
      isFocused && isLuxury && luxuryStyles?.inputFocused
    ]}>
      {selectedPrompt && !value && (
        <Text style={[textInputStyles.selectedPrompt, isLuxury && luxuryStyles?.promptText && { color: luxuryStyles.promptText.color }]}>
          Responding to: {promptText}
        </Text>
      )}
      <TextInput
        style={[
          textInputStyles.input, 
          isFocused && textInputStyles.inputFocused,
          isLuxury && luxuryStyles?.input && { color: luxuryStyles.input.color }
        ]}
        placeholder={selectedPrompt ? "Type your response..." : "What's on your mind?"}
        placeholderTextColor={isLuxury && typeof LuxuryColors !== 'undefined' ? LuxuryColors.text.tertiary : "rgba(255,255,255,0.3)"}
        value={value}
        onChangeText={onChange}
        multiline
        numberOfLines={3}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onContentSizeChange={(e) => {
          setHeight(Math.max(40, e.nativeEvent.contentSize.height));
        }}
      />
    </Animated.View>
  );
};

// PhotoAttachRow component
const PhotoAttachRow: React.FC<{
  photoUri: string | null;
  caption: string;
  onPhotoSelect: () => void;
  onCaptionChange: (text: string) => void;
  selectedPrompt?: string;
}> = ({ photoUri, caption, onPhotoSelect, onCaptionChange, selectedPrompt }) => {
  return (
    <View style={photoStyles.container}>
      {selectedPrompt && (
        <Text style={photoStyles.promptContext}>
          Responding to: {selectedPrompt}
        </Text>
      )}
      <Pressable style={photoStyles.photoArea} onPress={onPhotoSelect}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={photoStyles.thumbnail} />
        ) : (
          <View style={photoStyles.placeholder}>
            <Camera size={24} color="rgba(255,255,255,0.4)" />
            <Text style={photoStyles.placeholderText}>Tap to add photo</Text>
          </View>
        )}
      </Pressable>
      {photoUri && (
        <TextInput
          style={photoStyles.caption}
          placeholder="Add a caption..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={caption}
          onChangeText={onCaptionChange}
        />
      )}
    </View>
  );
};

// AudioRecorderRow component
const AudioRecorderRow: React.FC<{
  isRecording: boolean;
  duration: number;
  onRecord: () => void;
  onStop: () => void;
  onDelete: () => void;
  onAttach: () => void;
  hasRecording: boolean;
  selectedPrompt?: string;
  recordingUri?: string | null;
}> = ({ isRecording, duration, onRecord, onStop, onDelete, onAttach, hasRecording, selectedPrompt, recordingUri }) => {
  const pulseAnim = useSharedValue(1);
  
  useEffect(() => {
    if (isRecording) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1
      );
    } else {
      pulseAnim.value = withTiming(1);
    }
  }, [isRecording]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View>
      {selectedPrompt && (
        <Text style={audioStyles.promptContext}>
          Responding to: {selectedPrompt}
        </Text>
      )}
      <View style={audioStyles.container}>
        <Animated.View style={pulseStyle}>
          <Pressable
            style={[audioStyles.recordButton, isRecording && audioStyles.recordingActive]}
            onPress={isRecording ? onStop : onRecord}
          >
            {isRecording ? (
              <Square size={20} color="#FFF" fill="#FFF" />
            ) : (
              <Circle size={20} color="#FFF" fill="#FFF" />
            )}
          </Pressable>
        </Animated.View>
        
        <View style={audioStyles.waveform}>
          {[...Array(12)].map((_, i) => {
            const heightAnim = useSharedValue(10);
            
            useEffect(() => {
              if (isRecording) {
                heightAnim.value = withRepeat(
                  withSequence(
                    withTiming(Math.random() * 20 + 10, { duration: 300 }),
                    withTiming(Math.random() * 10 + 5, { duration: 300 })
                  ),
                  -1
                );
              } else {
                heightAnim.value = withTiming(10);
              }
            }, [isRecording]);

            const barStyle = useAnimatedStyle(() => ({
              height: heightAnim.value,
            }));

            return (
              <Animated.View 
                key={i} 
                style={[audioStyles.bar, barStyle]}
              />
            );
          })}
        </View>
        
        <Text style={audioStyles.timer}>{formatTime(duration)}</Text>
        
        {hasRecording && !isRecording && (
          <>
            <Pressable style={audioStyles.iconButton} onPress={onDelete}>
              <Trash2 size={18} color="rgba(255,255,255,0.6)" />
            </Pressable>
            {recordingUri && (
              <Pressable 
                style={audioStyles.iconButton} 
                onPress={async () => {
                  try {
                    const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
                    await sound.playAsync();
                  } catch (err) {
                    if (__DEV__) console.error('Playback failed:', err);
                  }
                }}
              >
                <Play size={18} color={LuxuryTheme.colors.primary.gold} />
              </Pressable>
            )}
          </>
        )}
      </View>
    </View>
  );
};

// ModePills component
const ModePills: React.FC<{
  activeMode: PostMode;
  onModeChange: (mode: PostMode) => void;
  luxuryStyles?: any;
  isLuxury?: boolean;
}> = ({ activeMode, onModeChange, luxuryStyles, isLuxury = false }) => {
  const scaleAnims = {
    text: useSharedValue(activeMode === 'text' ? 1 : 1),
    photo: useSharedValue(activeMode === 'photo' ? 1 : 1),
    audio: useSharedValue(activeMode === 'audio' ? 1 : 1),
  };

  const handlePress = (mode: PostMode) => {
    scaleAnims[mode].value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );
    onModeChange(mode);
  };
  
  const getModeColor = (mode: PostMode) => {
    if (isLuxury && typeof LuxuryColors !== 'undefined') return LuxuryColors.gold.primary;
    switch(mode) {
      case 'text': return CocaColors.gold;
      case 'photo': return CocaColors.silver;
      case 'audio': return CocaColors.purple;
    }
  };
  
  const getModeIcon = (mode: PostMode) => {
    const iconColor = isLuxury && typeof LuxuryColors !== 'undefined'
      ? (activeMode === mode ? LuxuryColors.black.pure : LuxuryColors.text.secondary)
      : (activeMode === mode ? '#FFF' : 'rgba(255,255,255,0.5)');
    
    switch(mode) {
      case 'text': return <Type size={14} color={iconColor} />;
      case 'photo': return <Camera size={14} color={iconColor} />;
      case 'audio': return <Mic size={14} color={iconColor} />;
    }
  };

  return (
    <View style={pillStyles.container}>
      {(['text', 'photo'] as PostMode[]).map((mode) => {
        const isActive = activeMode === mode;
        const modeColor = getModeColor(mode);
        
        return (
          <Animated.View
            key={mode}
            style={useAnimatedStyle(() => ({
              transform: [{ scale: scaleAnims[mode].value }],
            }))}
          >
            <Pressable
              style={[
                pillStyles.pill,
                isActive && pillStyles.pillActive,
                isLuxury && (isActive ? luxuryStyles?.pillActive : luxuryStyles?.pillInactive)
              ]}
              onPress={() => handlePress(mode)}
            >
              {isActive && !isLuxury && (
                <LinearGradient
                  colors={mode === 'text' ? [CocaColors.gold, CocaColors.orange] :
                          mode === 'photo' ? [CocaColors.silver, CocaColors.neonBlue] :
                          [CocaColors.purple, '#E91E63']}
                  style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              <View style={pillStyles.pillContent}>
                {getModeIcon(mode)}
                <Text style={[
                  pillStyles.pillText,
                  isActive && pillStyles.pillTextActive,
                  isLuxury && (isActive ? luxuryStyles?.pillTextActive : luxuryStyles?.pillText)
                ]}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
};

// SendButton component
const SendButton: React.FC<{
  enabled: boolean;
  onPress: () => void;
  luxuryStyles?: any;
  isLuxury?: boolean;
}> = ({ enabled, onPress, luxuryStyles, isLuxury = false }) => {
  const scaleAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0);
  
  useEffect(() => {
    if (enabled) {
      glowAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.3, { duration: 1000 })
        ),
        -1
      );
    } else {
      glowAnim.value = withTiming(0, { duration: 200 });
    }
  }, [enabled]);
  
  const handlePress = () => {
    if (enabled) {
      scaleAnim.value = withSequence(
        withSpring(0.9),
        withSpring(1)
      );
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
    opacity: withTiming(enabled ? 1 : 0.4, { duration: 200 }),
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));

  return (
    <Animated.View style={[sendStyles.container, animatedStyle]}>
      <Pressable
        style={[
          sendStyles.button,
          isLuxury && (enabled ? luxuryStyles?.sendButtonEnabled : luxuryStyles?.sendButton)
        ]}
        onPress={handlePress}
        disabled={!enabled}
      >
        {enabled && !isLuxury && (
          <>
            <Animated.View style={[sendStyles.glowRing, glowStyle]} />
            <LinearGradient
              colors={[CocaColors.orange, '#FF1493', CocaColors.neonBlue]}
              style={sendStyles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              locations={[0, 0.5, 1]}
            />
          </>
        )}
        {!enabled && !isLuxury && (
          <View style={sendStyles.disabledBg} />
        )}
        <Send size={18} color={
          isLuxury && typeof LuxuryColors !== 'undefined'
            ? (enabled ? LuxuryColors.black.pure : LuxuryColors.text.tertiary)
            : (enabled ? '#FFFFFF' : 'rgba(255,255,255,0.3)')
        } />
      </Pressable>
    </Animated.View>
  );
};

// Main PostPromptCard component
export const PostPromptCard: React.FC<PostPromptCardProps> = ({ onOpenComposer }) => {
  const isLuxury = isFeatureEnabled('ui.social.luxuryTheme');
  const luxuryStyles = React.useMemo(() => isLuxury ? getLuxuryStyles() : null, [isLuxury]);
  const [mode, setMode] = useState<PostMode>('text');
  const [promptIndex, setPromptIndex] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [textValue, setTextValue] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  
  // Check if we should use the fixed carousel
  const useFixedCarousel = isFeatureEnabled('ui.social.fixedCarousel');

  const hasContent = 
    (mode === 'text' && textValue.trim().length > 0) ||
    (mode === 'photo' && photoUri !== null) ||
    (mode === 'audio' && hasRecording);

  const handlePromptSelect = (prompt: any) => {
    setSelectedPrompt(prompt);
    const promptText = typeof prompt === 'string' ? prompt : prompt.text;
    // Automatically switch to appropriate mode based on prompt
    if (promptText.toLowerCase().includes('photo') || promptText.includes('📸')) {
      setMode('photo');
    } else if (promptText.toLowerCase().includes('voice') || promptText.toLowerCase().includes('audio')) {
      setMode('audio');
    } else {
      setMode('text');
    }
  };

  const handlePhotoSelect = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const photoData = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;
      setPhotoUri(photoData);
    }
  };

  const handleRecord = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Enable microphone to record audio');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
    } catch (err) {
      if (__DEV__) console.error('Failed to start recording', err);
    }
  };

  const handleStopRecording = async () => {
    if (!recording) return;
    
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    
    // Convert to base64 for web platform to persist across refreshes
    if (Platform.OS === 'web' && uri) {
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          if (__DEV__) console.log('Audio converted to base64, length:', base64.length);
          setRecordingUri(base64);
          setHasRecording(true);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        if (__DEV__) console.error('Error converting audio to base64:', error);
        setRecordingUri(uri); // Fallback to blob URL
        setHasRecording(true);
      }
    } else {
      setRecordingUri(uri);
      setHasRecording(true);
    }
    
    setRecording(null);
  };

  const handleSend = () => {
    if (hasContent) {
      // Instead of opening composer, post directly from here
      const post = {
        type: mode === 'photo' ? 'photo' : mode === 'audio' ? 'audio' : 'status',
        visibility: 'circle', // Default to circle
        content: mode === 'text' ? textValue : photoCaption || '',
        mediaUrl: mode === 'photo' ? photoUri : mode === 'audio' ? recordingUri : undefined,
        photoUri: mode === 'photo' ? photoUri : undefined,
        audioUri: mode === 'audio' ? recordingUri : undefined,
      };
      
      if (__DEV__) console.log('Posting directly from PostPromptCard:', post);
      
      // Call the API directly to create the post
      const { addPost } = useStore.getState();
      addPost(post);
      
      // Reset state
      setTextValue('');
      setPhotoUri(null);
      setPhotoCaption('');
      setHasRecording(false);
      setRecordingDuration(0);
      setRecordingUri(null);
      setSelectedPrompt('');
      
      // Show success feedback
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  return (
    <View style={[styles.container, isLuxury && luxuryStyles?.container]}>
      <BlurView intensity={isLuxury ? 20 : 50} tint="dark" style={[styles.card, isLuxury && luxuryStyles?.card]}>
        {/* Conditional gradient based on luxury theme */}
        {isLuxury && typeof LuxuryColors !== 'undefined' ? (
          <LinearGradient
            colors={LuxuryColors.gradients.card}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        ) : (
          <>
            <LinearGradient
              colors={['#C0C0C0', '#2C3539', '#121212']}
              style={[StyleSheet.absoluteFillObject, { opacity: 0.3 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              locations={[0, 0.5, 1]}
            />
            <LinearGradient
              colors={['rgba(18,18,18,0.85)', 'rgba(18,18,18,0.95)']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
          </>
        )}
        
        <View style={styles.cardInner}>
          {/* Prompt Layer */}
          <View style={styles.promptLayer}>
            {useFixedCarousel ? (
              <FixedPromptCarousel
                prompts={PROMPTS}
                currentIndex={promptIndex}
                onIndexChange={setPromptIndex}
                onPromptSelect={handlePromptSelect}
              />
            ) : (
              <PromptStrip
                prompts={PROMPTS}
                currentIndex={promptIndex}
                onIndexChange={setPromptIndex}
                onPromptSelect={handlePromptSelect}
              />
            )}
          </View>
          
          {/* Input Layer (mode-aware) */}
          <View style={styles.inputLayer}>
            {mode === 'text' && (
              <TextInputCompact 
                value={textValue} 
                onChange={setTextValue}
                selectedPrompt={selectedPrompt}
                luxuryStyles={luxuryStyles}
                isLuxury={isLuxury}
              />
            )}
            {mode === 'photo' && (
              <PhotoAttachRow
                photoUri={photoUri}
                caption={photoCaption}
                onPhotoSelect={handlePhotoSelect}
                onCaptionChange={setPhotoCaption}
                selectedPrompt={selectedPrompt}
              />
            )}
            {mode === 'audio' && (
              <AudioRecorderRow
                isRecording={isRecording}
                duration={recordingDuration}
                onRecord={handleRecord}
                onStop={handleStopRecording}
                onDelete={() => {
                  setHasRecording(false);
                  setRecordingDuration(0);
                  setRecordingUri(null);
                }}
                onAttach={() => {}}
                hasRecording={hasRecording}
                selectedPrompt={selectedPrompt}
                recordingUri={recordingUri}
              />
            )}
          </View>
          
          {/* Controls Layer */}
          <View style={styles.controlsLayer}>
            <ModePills 
              activeMode={mode} 
              onModeChange={setMode} 
              luxuryStyles={luxuryStyles}
              isLuxury={isLuxury}
            />
            <SendButton 
              enabled={hasContent} 
              onPress={handleSend} 
              luxuryStyles={luxuryStyles}
              isLuxury={isLuxury}
            />
          </View>
        </View>
      </BlurView>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: LuxuryTheme.colors.primary.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(231, 180, 58, 0.1)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  cardInner: {
    padding: 16,
  },
  promptLayer: {
    backgroundColor: 'transparent',
    marginHorizontal: -16,
    marginTop: -16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 0,
  },
  selectedPromptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,184,77,0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,184,77,0.15)',
  },
  selectedPromptText: {
    fontSize: 13,
    color: CocaColors.amber,
    flex: 1,
    fontWeight: '500',
  },
  clearPrompt: {
    padding: 4,
  },
  clearPromptText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 16,
  },
  inputLayer: {
    minHeight: 36,
    marginBottom: 10,
    marginTop: 0,
  },
  controlsLayer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

const promptStyles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 70,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  promptItem: {
    width: PROMPT_WIDTH,
    paddingHorizontal: 16,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  promptItemPressed: {
    opacity: 0.9,
  },
  promptText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  promptTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontStyle: 'normal',
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  dotActive: {
    width: 20,
    backgroundColor: 'transparent',
  },
});

const textInputStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(18,18,18,0.6)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: CocaColors.silver,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    marginTop: 0,
  },
  selectedPrompt: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 12,
    paddingTop: 4,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    minHeight: 36,
    maxHeight: 60,
  },
  inputFocused: {
    borderColor: CocaColors.neonBlue,
    backgroundColor: 'rgba(18,18,18,0.8)',
  },
});

const photoStyles = StyleSheet.create({
  container: {
    gap: 10,
  },
  promptContext: {
    fontSize: 11,
    color: CocaColors.teal,
    marginBottom: 0,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  photoArea: {
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
  },
  placeholder: {
    flex: 1,
    backgroundColor: 'rgba(77,182,172,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(77,182,172,0.2)',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  placeholderText: {
    color: CocaColors.teal,
    fontSize: 14,
    fontWeight: '500',
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: CocaColors.teal,
  },
  caption: {
    backgroundColor: 'rgba(18,18,18,0.8)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
    height: 40,
    borderWidth: 1,
    borderColor: 'rgba(77,182,172,0.2)',
  },
});

const audioStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(126,87,194,0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(126,87,194,0.15)',
  },
  promptContext: {
    fontSize: 11,
    color: CocaColors.purple,
    marginBottom: 0,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  recordButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: CocaColors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: CocaColors.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 3,
  },
  recordingActive: {
    backgroundColor: CocaColors.red,
    shadowColor: CocaColors.red,
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  bar: {
    width: 3,
    backgroundColor: CocaColors.purple,
    borderRadius: 1.5,
    opacity: 0.6,
  },
  timer: {
    fontSize: 14,
    color: CocaColors.purple,
    fontVariant: ['tabular-nums'],
    minWidth: 50,
    fontWeight: '600',
  },
  iconButton: {
    padding: 8,
  },
});

const pillStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
    overflow: 'hidden',
  },
  pillActive: {
    borderColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 3,
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  pillTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  pillGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
  },
});

// Luxury theme styles - created as a function to avoid initialization errors
const getLuxuryStyles = () => {
  // Only create styles if LuxuryColors is available
  if (typeof LuxuryColors === 'undefined') {
    return StyleSheet.create({});
  }
  
  return StyleSheet.create({
    container: {
      shadowColor: LuxuryColors.glow.gold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
    },
    card: {
      backgroundColor: LuxuryColors.background.card,
      borderColor: LuxuryColors.borders.subtle,
    },
    promptText: {
      color: LuxuryColors.text.primary,
    },
    promptTextActive: {
      color: LuxuryColors.gold.primary,
      textShadowColor: LuxuryColors.glow.gold,
      textShadowRadius: 8,
    },
    input: {
      backgroundColor: LuxuryColors.black.pure,
      borderColor: LuxuryColors.borders.default,
      color: LuxuryColors.text.primary,
    },
    inputFocused: {
      borderColor: LuxuryColors.gold.primary,
      shadowColor: LuxuryColors.glow.gold,
    },
    pillInactive: {
      backgroundColor: 'transparent',
      borderColor: LuxuryColors.borders.default,
    },
    pillActive: {
      backgroundColor: LuxuryColors.gold.primary,
      borderColor: LuxuryColors.gold.primary,
    },
    pillText: {
      color: LuxuryColors.text.secondary,
    },
    pillTextActive: {
      color: LuxuryColors.black.pure,
    },
    sendButton: {
      borderColor: LuxuryColors.borders.default,
    },
    sendButtonEnabled: {
      backgroundColor: LuxuryColors.gold.primary,
      shadowColor: LuxuryColors.glow.gold,
    },
  });
};

const sendStyles = StyleSheet.create({
  container: {
    marginLeft: 'auto',
  },
  button: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  disabledBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 21,
  },
  glowRing: {
    position: 'absolute',
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    borderRadius: 33,
    backgroundColor: '#FFA500',
    opacity: 0.25,
  },
});