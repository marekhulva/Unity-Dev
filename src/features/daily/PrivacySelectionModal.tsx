import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, Pressable, Dimensions, Platform, Animated, TextInput, Image, Alert, Keyboard, ScrollView, KeyboardAvoidingView } from 'react-native';
import { Camera, Mic, MessageSquare, Check, Globe, Lock, X, MapPin, Users } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { KeyboardToolbar, useKeyboardToolbar } from '../../components/KeyboardToolbar';
import { useStore } from '../../state/rootStore';

if (__DEV__) console.log('PrivacySelectionModal.tsx (THREE-WAY) FILE LOADED');

const { width } = Dimensions.get('window');

interface PrivacySelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (
    visibility: 'private' | 'circle' | 'followers',
    contentType: 'photo' | 'audio' | 'text' | 'check',
    content?: string,
    mediaUri?: string,
    newVisibility?: {
      isPrivate: boolean;
      isExplore: boolean;
      isNetwork: boolean;
      circleIds: string[];
    }
  ) => void;
  actionTitle: string;
  streak?: number;
}

export const PrivacySelectionModal: React.FC<PrivacySelectionModalProps> = ({
  visible,
  onClose,
  onSelect,
  actionTitle,
  streak = 0,
}) => {
  // Use environment variable or default to true for production
  // TODO: Move to feature flag system if needed
  const TEST_NEW_UI = process.env.EXPO_PUBLIC_USE_NEW_PRIVACY_UI !== 'false';

  // Get user circles from store
  const userCircles = useStore(s => s.userCircles);
  const fetchUserCircles = useStore(s => s.fetchUserCircles);

  // Load circles when modal opens
  useEffect(() => {
    if (visible && TEST_NEW_UI) {
      if (__DEV__) console.log('🔵 Loading user circles for privacy modal...');
      if (__DEV__) console.log('🔵 Current userCircles:', userCircles);
      fetchUserCircles().then(() => {
        if (__DEV__) console.log('🔵 Circles loaded, count:', userCircles?.length);
      });
    }
  }, [visible, TEST_NEW_UI, fetchUserCircles]);

  // Initialize all circles as checked when modal opens
  // ALWAYS default to public: all circles + followers
  useEffect(() => {
    if (visible && userCircles && userCircles.length > 0) {
      const allCircleIds = new Set(userCircles.map(c => c.id));
      setSelectedCircleIds(allCircleIds);
      setIncludeFollowers(true); // Always include followers for public posting
      if (__DEV__) console.log('🔵 Initialized all circles as checked (PUBLIC):', allCircleIds);
    }
  }, [visible, userCircles]);

  const [selectedMedia, setSelectedMedia] = useState<'photo' | 'audio' | null>(null);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [selectedPrivacy, setSelectedPrivacy] = useState<'private' | 'circle' | 'followers'>('circle');
  const [dotPosition] = useState(new Animated.Value(23)); // Start at middle position for 'circle'
  const [commentText, setCommentText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // NEW: State for integrated circle selection
  const [selectedCircleIds, setSelectedCircleIds] = useState<Set<string>>(new Set());
  const [includeFollowers, setIncludeFollowers] = useState(true); // Default: followers included
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent duplicate submissions

  // Cleanup intervals/timeouts on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Keyboard toolbar hook for Android/Web
  const { keyboardHeight, isKeyboardVisible, toolbarStyle } = useKeyboardToolbar();

  const handleContentSelect = async (content: 'photo' | 'check') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Handle photo selection
    if (content === 'photo') {
      // Request permissions based on platform
      if (Platform.OS === 'ios') {
        const { status: cameraRollStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (cameraRollStatus !== 'granted') {
          Alert.alert('Permission needed', 'Please allow access to your photos in Settings');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please allow access to your photos');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.7,
        base64: true,
        exif: false,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const photoData = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        if (__DEV__) console.log('📸 Photo selected, using:', asset.base64 ? 'base64' : 'uri');
        setPhotoUri(photoData);
        setSelectedMedia('photo');
      }
    }
    // Handle just check
    else {
      setSelectedMedia(null);
    }
  };

  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed', 
          Platform.OS === 'ios' 
            ? 'Please allow access to your microphone in Settings' 
            : 'Please allow access to your microphone'
        );
        return;
      }

      // Set audio mode for iOS compatibility
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: Platform.OS === 'ios',
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create recording with iOS-optimized settings
      const recording = new Audio.Recording();
      
      // Use different presets for iOS vs Android
      const recordingOptions = Platform.OS === 'ios' 
        ? {
            extension: '.m4a',
            outputFormat: Audio.RECORDING_OPTION_OUTPUT_FORMAT_MPEG_4AAC,
            audioEncoder: Audio.RECORDING_OPTION_AUDIO_ENCODER_AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          }
        : Audio.RecordingOptionsPresets.HIGH_QUALITY;
      
      await recording.prepareToRecordAsync(recordingOptions);
      await recording.startAsync();
      
      recordingRef.current = recording;
      setIsRecording(true);

      // Update duration every second
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = setInterval(async () => {
        if (recordingRef.current) {
          const status = await recordingRef.current.getStatusAsync();
          if (status.isRecording) {
            setRecordingDuration(Math.floor(status.durationMillis / 1000));
          } else {
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
          }
        }
      }, 1000);
    } catch (error) {
      if (__DEV__) console.error('Failed to start recording:', error);
      Alert.alert(
        'Recording Error', 
        Platform.OS === 'ios' 
          ? 'Unable to start recording. Please check microphone permissions in Settings.' 
          : 'Failed to start recording'
      );
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    // Clear interval immediately
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    try {
      await recordingRef.current.stopAndUnloadAsync();
      
      // Reset audio mode after recording
      if (Platform.OS === 'ios') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
      }
      
      const uri = recordingRef.current.getURI();
      if (__DEV__) console.log('Recording saved to:', uri);
      
      // On iOS, validate the URI format
      if (Platform.OS === 'ios' && uri) {
        if (__DEV__) console.log('iOS Audio URI format:', uri);
      }
      
      setAudioUri(uri);
      setIsRecording(false);
      // Don't reset duration - keep it to show in the preview
      recordingRef.current = null;
    } catch (error) {
      if (__DEV__) console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save recording');
    }
  };

  const handlePrivacySelect = (privacy: 'private' | 'circle' | 'followers') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPrivacy(privacy);
    
    // Animate dot position
    const targetPosition = privacy === 'private' ? 2 : privacy === 'circle' ? 23 : 44;
    Animated.timing(dotPosition, {
      toValue: targetPosition,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleConfirm = () => {
    if (__DEV__) console.log('🎯 [PrivacyModal] handleConfirm called');

    // Prevent duplicate submissions
    if (isSubmitting) {
      if (__DEV__) console.log('⚠️ [PrivacyModal] Already submitting, ignoring click');
      return;
    }

    setIsSubmitting(true);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Determine contentType based on what's selected
    let contentType: 'photo' | 'text' | 'check';
    if (selectedMedia === 'photo') {
      contentType = 'photo';
    } else if (commentText.trim()) {
      contentType = 'text';
    } else {
      contentType = 'check';
    }

    // Pass both comment AND media (if they exist)
    const content = commentText.trim() || undefined;
    const mediaUri = selectedMedia === 'photo' ? photoUri : undefined;

    // If using new UI, pass the new visibility model
    const newVisibility = TEST_NEW_UI ? {
      isPrivate: false, // Removed "Only Me" option
      isExplore: false, // Removed from UI
      isNetwork: false, // Not using network-wide sharing
      circleIds: Array.from(selectedCircleIds),
      includeFollowers, // Whether to include followers
    } : undefined;

    if (__DEV__) console.log('🎯 [PrivacyModal] Calling onSelect with:', {
      privacy: selectedPrivacy,
      contentType,
      content,
      mediaUri: mediaUri || undefined,
      newVisibility
    });

    onSelect(selectedPrivacy, contentType, content, mediaUri || undefined, newVisibility);

    // Reset for next time
    if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    submitTimeoutRef.current = setTimeout(() => {
      setSelectedMedia(null);
      setSelectedPrivacy('circle');
      setCommentText('');
      setPhotoUri(null);
      setIsSubmitting(false);
      // Don't reset selectedCircleIds or includeFollowers - they'll be re-initialized when modal opens
    }, 200);
  };

  const handleClose = () => {
    onClose();
    // Reset state after close
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setSelectedMedia(null);
      setSelectedPrivacy('circle');
      setCommentText('');
      setPhotoUri(null);
      setIsSubmitting(false);
      // Don't reset selectedCircleIds or includeFollowers - they'll be re-initialized when modal opens
    }, 200);
  };

  if (!visible) return null;

  const contentOptions = [
    { id: 'photo', icon: Camera, label: 'Photo', color: '#FFD700' },
    { id: 'check', icon: Check, label: 'Just Check', color: '#06FFA5' },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => { Keyboard.dismiss(); handleClose(); }} />

          <View style={styles.modalContainer}>
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.subtitle}>{actionTitle}</Text>
              <Text style={styles.title}>ACTION</Text>
              {streak > 0 && (
                <View style={styles.streakBadge}>
                  <Text style={styles.streakText}>🔥 {streak} days</Text>
                </View>
              )}
            </View>

            {/* Content Type Selection */}
            <View style={styles.contentSection}>
              <Text style={styles.sectionLabel}>How do you want to share?</Text>
              <View style={styles.contentGrid}>
                {contentOptions.map((option) => {
                  const Icon = option.icon;
                  // Determine if this option is selected
                  const isSelected =
                    (option.id === 'photo' && selectedMedia === 'photo') ||
                    (option.id === 'check' && selectedMedia === null);
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => handleContentSelect(option.id as any)}
                      style={[
                        styles.contentButton,
                        isSelected && styles.contentButtonSelected,
                        isSelected && { borderColor: option.color }
                      ]}
                    >
                      <Icon
                        size={22}
                        color={isSelected ? option.color : 'rgba(255,255,255,0.4)'}
                      />
                      <Text style={[
                        styles.contentButtonText,
                        isSelected && { color: option.color }
                      ]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Comment Input - Always visible, optional */}
            <View style={styles.commentSection}>
              <TextInput
                style={styles.commentInput}
                placeholder={
                  selectedMedia === 'photo'
                    ? "Add a caption... (optional)"
                    : "Add a note... (optional)"
                }
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={200}
                inputAccessoryViewID={Platform.OS === 'ios' ? 'privacy-modal-toolbar' : undefined}
              />
              <Text style={styles.charCount}>{commentText.length}/200</Text>
            </View>

            {/* Photo Preview - Shows when photo is selected */}
            {selectedMedia === 'photo' && photoUri && (
              <View style={styles.mediaSection}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                <Pressable
                  style={styles.removeMediaButton}
                  onPress={() => {
                    setPhotoUri(null);
                    setSelectedMedia(null);
                  }}
                >
                  <X size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            )}


            {/* ============================================
                 PRIVACY SECTION - COMMENTED OUT FOR MVP
                 Everything defaults to PUBLIC (all circles + followers)
                 To re-enable: uncomment this section
                 ============================================ */}
            {/* <View style={styles.privacySection}>
              {TEST_NEW_UI ? (
                // NEW: Integrated circle selection UI
                <ScrollView style={styles.privacyScrollView} showsVerticalScrollIndicator={false}>
                  <Text style={styles.privacySectionLabel}>WHO CAN SEE THIS?</Text>

                  {userCircles && userCircles.length > 0 ? (
                    <>
                      {userCircles.map(circle => {
                        if (__DEV__) console.log('🔵 Rendering circle:', circle.name, circle.id);
                        return (
                        <Pressable
                          key={circle.id}
                          style={[
                            styles.circleOption,
                            selectedCircleIds.has(circle.id) && styles.circleOptionSelected
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            const newSet = new Set(selectedCircleIds);
                            if (newSet.has(circle.id)) {
                              newSet.delete(circle.id);
                            } else {
                              newSet.add(circle.id);
                            }
                            setSelectedCircleIds(newSet);
                          }}
                        >
                          <View style={[styles.checkbox, selectedCircleIds.has(circle.id) && styles.checkboxChecked]}>
                            {selectedCircleIds.has(circle.id) && <Check size={14} color="#000" strokeWidth={3} />}
                          </View>
                          <Text style={styles.circleEmoji}>{circle.emoji || '⭐'}</Text>
                          <Text style={[
                            styles.circleName,
                            selectedCircleIds.has(circle.id) && styles.circleNameSelected
                          ]}>
                            {circle.name}
                          </Text>
                        </Pressable>
                      )})}

                      <Pressable
                        style={[
                          styles.circleOption,
                          includeFollowers && styles.circleOptionSelected
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setIncludeFollowers(!includeFollowers);
                        }}
                      >
                        <View style={[styles.checkbox, includeFollowers && styles.checkboxChecked]}>
                          {includeFollowers && <Check size={14} color="#000" strokeWidth={3} />}
                        </View>
                        <Text style={styles.circleEmoji}>👥</Text>
                        <Text style={[
                          styles.circleName,
                          includeFollowers && styles.circleNameSelected
                        ]}>
                          Followers
                        </Text>
                      </Pressable>
                    </>
                  ) : userCircles ? (
                    <View style={{ marginTop: 16, padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 13 }}>
                        No circles found. Join or create circles to share with them.
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.privacySectionLabel, { marginTop: 16, color: 'rgba(255,255,255,0.3)' }]}>
                      Loading circles...
                    </Text>
                  )}
                </ScrollView>
              ) : (
                // OLD: Original three-way toggle
                <Pressable
                  onPress={() => {
                    const nextPrivacy =
                      selectedPrivacy === 'private' ? 'circle' :
                      selectedPrivacy === 'circle' ? 'followers' : 'private';
                    handlePrivacySelect(nextPrivacy);
                  }}
                  style={styles.privacyToggle}
                >
                  <View style={styles.privacyOption}>
                    {selectedPrivacy === 'private' ? (
                      <>
                        <Lock size={14} color="#C0C0C0" />
                        <Text style={[styles.privacyText, { color: '#C0C0C0' }]}>Keep Private</Text>
                      </>
                    ) : selectedPrivacy === 'circle' ? (
                      <>
                        <Text style={styles.privacyText}>⭐ Share to Circle</Text>
                      </>
                    ) : (
                      <>
                        <Globe size={16} color="#06FFA5" />
                        <Text style={[styles.privacyText, { color: '#06FFA5' }]}>All Followers</Text>
                      </>
                    )}
                  </View>
                  <View style={[
                    styles.toggleSwitch,
                    selectedPrivacy === 'private' && styles.toggleSwitchPrivate,
                    selectedPrivacy === 'followers' && styles.toggleSwitchFollowers
                  ]}>
                    <Animated.View style={[
                      styles.toggleDot,
                      {
                        left: dotPosition,
                        backgroundColor:
                          selectedPrivacy === 'private' ? '#C0C0C0' :
                          selectedPrivacy === 'circle' ? '#FFD700' : '#06FFA5'
                    }
                  ]} />
                </View>
              </Pressable>
              )}

              <Text style={styles.privacyHint}>
                {TEST_NEW_UI ? (
                  selectedCircleIds.size === 0 && !includeFollowers
                    ? 'No one selected - post will be private'
                    : selectedCircleIds.size > 0 && includeFollowers
                    ? `Visible to ${selectedCircleIds.size} circle${selectedCircleIds.size > 1 ? 's' : ''} and followers`
                    : selectedCircleIds.size > 0
                    ? `Visible to ${selectedCircleIds.size} circle${selectedCircleIds.size > 1 ? 's' : ''} only`
                    : 'Visible to followers only'
                ) : (
                  selectedPrivacy === 'private' ? 'Only you can see this' :
                  selectedPrivacy === 'circle' ? 'Visible to your close friends' :
                  'Visible to all your followers'
                )}
              </Text>
            </View> */}

            {/* MVP: Show public posting message */}
            <View style={styles.privacySection}>
              <Text style={styles.publicPostingNotice}>
                📢 Sharing publicly with all circles & followers
              </Text>
            </View>

            {/* Action Buttons */}
              <View style={styles.actions}>
                <Pressable
                  onPress={handleClose}
                  style={styles.cancelButton}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => { Keyboard.dismiss(); handleConfirm(); }}
                  style={[styles.confirmButton, isSubmitting && styles.confirmButtonDisabled]}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.confirmText, isSubmitting && styles.confirmTextDisabled]}>
                    {isSubmitting ? 'Posting...' : 'Complete'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>

      {/* iOS Keyboard Toolbar */}
      {Platform.OS === 'ios' && (
        <KeyboardToolbar
          nativeID="privacy-modal-toolbar"
          onCancel={() => {
            Keyboard.dismiss();
            setCommentText('');
          }}
          onSubmit={handleConfirm}
          submitText="Complete"
          submitDisabled={false}
        />
      )}

      {/* Android/Web Keyboard Toolbar */}
      {Platform.OS !== 'ios' && isKeyboardVisible && (
        <View style={toolbarStyle}>
          <KeyboardToolbar
            onCancel={() => {
              Keyboard.dismiss();
              setCommentText('');
            }}
            onSubmit={handleConfirm}
            submitText="Complete"
            submitDisabled={false}
          />
        </View>
      )}

    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: Math.min(width * 0.9, 360),
    maxHeight: '80%',
  },
  modal: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  streakBadge: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  streakText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  contentSection: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 10,
  },
  contentGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  contentButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  contentButtonSelected: {
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  contentButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  privacySection: {
    marginBottom: 24,
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privacyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  toggleSwitch: {
    width: 66,  // Wider for 3 positions
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,215,0,0.2)',
    padding: 2,
    position: 'relative',
  },
  toggleSwitchPrivate: {
    backgroundColor: 'rgba(192,192,192,0.2)',
  },
  toggleSwitchFollowers: {
    backgroundColor: 'rgba(6,255,165,0.2)',
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFD700',
    position: 'absolute',
    left: 2,
  },
  toggleDotPrivate: {
    backgroundColor: '#C0C0C0',
    left: 2,  // Left position
  },
  toggleDotCircle: {
    backgroundColor: '#FFD700',
    left: 23,  // Middle position
  },
  toggleDotFollowers: {
    backgroundColor: '#06FFA5',
    left: 44,  // Right position
  },
  privacyHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 8,
    marginLeft: 12,
  },
  publicPostingNotice: {
    fontSize: 11,
    color: 'rgba(255,215,0,0.5)',
    textAlign: 'center',
    padding: 10,
    backgroundColor: 'rgba(255,215,0,0.04)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.08)',
  },

  // New integrated circle selection styles
  privacyScrollView: {
    maxHeight: 400,
  },
  privacySectionLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: 'rgba(255,215,0,0.6)',
    marginBottom: 8,
    fontWeight: '600',
  },
  quickOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    gap: 10,
  },
  quickOptionSelected: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderColor: '#FFD700',
  },
  quickOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  quickOptionTextActive: {
    color: '#FFD700',
  },
  exploreOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    gap: 10,
  },
  exploreOptionActive: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderColor: '#FFD700',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  circleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    marginBottom: 4,
    gap: 8,
  },
  circleOptionSelected: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderColor: 'rgba(255,215,0,0.3)',
  },
  circleEmoji: {
    fontSize: 20,
  },
  circleName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
  },
  circleNameSelected: {
    color: '#FFD700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.25)',
  },
  confirmButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  confirmButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  confirmTextDisabled: {
    color: 'rgba(255,255,255,0.25)',
  },
  commentSection: {
    marginBottom: 14,
  },
  commentInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 11,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    minHeight: 42,
    maxHeight: 120,
  },
  charCount: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
    textAlign: 'right',
    marginTop: 4,
  },
  mediaSection: {
    width: '100%',
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
  },
  recordingText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  stopButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  audioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
  },
  audioText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  startRecordingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    borderRadius: 12,
    padding: 16,
  },
  startRecordingText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '500',
  },
});