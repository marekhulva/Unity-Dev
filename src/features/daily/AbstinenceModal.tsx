import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  TextInput,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { Camera, X, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../../state/rootStore';

const { width } = Dimensions.get('window');

interface AbstinenceModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (
    didStayOnTrack: boolean,
    comment?: string,
    photoUri?: string,
    circleIds?: string[],
    includeFollowers?: boolean
  ) => void;
  actionTitle: string;
  streak?: number;
}

export const AbstinenceModal: React.FC<AbstinenceModalProps> = ({
  visible,
  onClose,
  onComplete,
  actionTitle,
  streak = 0,
}) => {
  // Get user circles from store
  const userCircles = useStore(s => s.userCircles);
  const fetchUserCircles = useStore(s => s.fetchUserCircles);

  // Refs for cleanup
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [selectedAnswer, setSelectedAnswer] = useState<'yes' | 'no' | null>(null);
  const [commentText, setCommentText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selectedCircleIds, setSelectedCircleIds] = useState<Set<string>>(new Set());
  const [includeFollowers, setIncludeFollowers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Load circles when modal opens
  useEffect(() => {
    if (visible) {
      if (__DEV__) console.log('[AbstinenceModal] Loading user circles...');
      fetchUserCircles();
    }
  }, [visible, fetchUserCircles]);

  // Initialize circles: ALWAYS public (all circles + followers)
  useEffect(() => {
    if (visible && userCircles && userCircles.length > 0) {
      // ALWAYS default to public: all circles + followers (for both yes and no)
      const allCircleIds = new Set(userCircles.map(c => c.id));
      setSelectedCircleIds(allCircleIds);
      setIncludeFollowers(true);
      if (__DEV__) console.log('[AbstinenceModal] Initialized PUBLIC posting (all circles + followers)');
    }
  }, [visible, userCircles, selectedAnswer]);

  // Handle answer selection
  const handleAnswerSelect = (answer: 'yes' | 'no') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedAnswer(answer);
  };

  // Handle photo selection
  const handlePhotoPress = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          Platform.OS === 'ios'
            ? 'Please allow access to your photos in Settings'
            : 'Please allow access to your photos'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const photoData = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setPhotoUri(photoData);
        if (__DEV__) console.log('[AbstinenceModal] Photo selected, using:', asset.base64 ? 'base64' : 'uri');
      }
    } catch (error) {
      if (__DEV__) console.error('[AbstinenceModal] Photo picker error:', error);
    }
  };

  // Handle circle toggle
  const handleCircleToggle = (circleId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newSet = new Set(selectedCircleIds);
    if (newSet.has(circleId)) {
      newSet.delete(circleId);
    } else {
      newSet.add(circleId);
    }
    setSelectedCircleIds(newSet);
  };

  // Handle followers toggle
  const handleFollowersToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIncludeFollowers(!includeFollowers);
  };

  // Handle post/log
  const handleSubmit = () => {
    if (!selectedAnswer) return;

    if (isSubmitting) {
      if (__DEV__) console.log('[AbstinenceModal] Already submitting, ignoring');
      return;
    }

    setIsSubmitting(true);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const didStayOnTrack = selectedAnswer === 'yes';
    const circleIds = Array.from(selectedCircleIds);

    if (__DEV__) {
      console.log('[AbstinenceModal] Submitting:', {
        didStayOnTrack,
        comment: commentText,
        hasPhoto: !!photoUri,
        circleIds,
        includeFollowers,
      });
    }

    onComplete(
      didStayOnTrack,
      commentText.trim() || undefined,
      photoUri || undefined,
      circleIds,
      includeFollowers
    );

    // Reset state
    if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    submitTimeoutRef.current = setTimeout(() => {
      setSelectedAnswer(null);
      setCommentText('');
      setPhotoUri(null);
      setSelectedCircleIds(new Set());
      setIncludeFollowers(true);
      setIsSubmitting(false);
    }, 200);
  };

  // Handle close
  const handleClose = () => {
    onClose();
    // Reset state after close
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setSelectedAnswer(null);
      setCommentText('');
      setPhotoUri(null);
      setSelectedCircleIds(new Set());
      setIncludeFollowers(true);
      setIsSubmitting(false);
    }, 200);
  };

  // Get privacy hint text
  const getPrivacyHint = () => {
    const circleCount = selectedCircleIds.size;
    if (circleCount === 0 && !includeFollowers) {
      return 'Private — only you can see this';
    }
    if (circleCount > 0 && includeFollowers) {
      return `Visible to ${circleCount} group${circleCount > 1 ? 's' : ''} and followers`;
    }
    if (circleCount > 0) {
      return `Visible to ${circleCount} group${circleCount > 1 ? 's' : ''} only`;
    }
    return 'Visible to followers only';
  };

  if (!visible) return null;

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
              <Text style={styles.actionName}>{actionTitle}</Text>
              <Text style={styles.actionType}>ABSTINENCE</Text>
              <Text style={styles.question}>Did you stay on track today?</Text>
            </View>

            {/* Yes/No Buttons */}
            <View style={styles.answerRow}>
              <Pressable
                style={[
                  styles.answerButton,
                  styles.yesButton,
                  selectedAnswer === 'yes' && styles.yesButtonActive,
                ]}
                onPress={() => handleAnswerSelect('yes')}
              >
                <Text
                  style={[
                    styles.answerButtonText,
                    styles.yesButtonText,
                    selectedAnswer === 'yes' && styles.yesButtonTextActive,
                  ]}
                >
                  YES
                </Text>
              </Pressable>

            </View>

            <View style={styles.divider} />

            {/* Photo Preview */}
            {photoUri && (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photoUri }} style={styles.photoPreviewImage} />
                <Pressable style={styles.removePhotoButton} onPress={() => setPhotoUri(null)}>
                  <X size={14} color="#FFFFFF" />
                </Pressable>
              </View>
            )}

            {/* Comment Input with Camera */}
            <View style={styles.commentWrapper}>
              <TextInput
                style={styles.commentInput}
                placeholder={selectedAnswer === 'no' ? 'What happened? (optional)' : 'Add a comment...'}
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={200}
                returnKeyType="done"
                blurOnSubmit={true}
              />
              <Pressable style={styles.cameraButton} onPress={handlePhotoPress}>
                <Camera size={14} color="rgba(255,255,255,0.35)" />
              </Pressable>
            </View>

            {/* ============================================
                 PRIVACY SECTION - COMMENTED OUT FOR MVP
                 Everything defaults to PUBLIC (all circles + followers)
                 To re-enable: uncomment this section
                 ============================================ */}
            {/* <ScrollView style={styles.privacySection} showsVerticalScrollIndicator={false}>
              <Text style={styles.privacyLabel}>SHARE WITH</Text>

              {userCircles && userCircles.length > 0 ? (
                <>
                  {userCircles.map(circle => {
                    const isSelected = selectedCircleIds.has(circle.id);
                    return (
                      <Pressable
                        key={circle.id}
                        style={[
                          styles.circleOption,
                          isSelected && styles.circleOptionSelected,
                        ]}
                        onPress={() => handleCircleToggle(circle.id)}
                      >
                        <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                          {isSelected && <Check size={10} color="#111" strokeWidth={3} />}
                        </View>
                        <Text style={styles.circleEmoji}>{circle.emoji || '⭐'}</Text>
                        <Text
                          style={[
                            styles.circleName,
                            isSelected && styles.circleNameSelected,
                          ]}
                        >
                          {circle.name}
                        </Text>
                      </Pressable>
                    );
                  })}

                  <Pressable
                    style={[
                      styles.circleOption,
                      includeFollowers && styles.circleOptionSelected,
                    ]}
                    onPress={handleFollowersToggle}
                  >
                    <View style={[styles.checkbox, includeFollowers && styles.checkboxChecked]}>
                      {includeFollowers && <Check size={10} color="#111" strokeWidth={3} />}
                    </View>
                    <Text style={styles.circleEmoji}>👥</Text>
                    <Text
                      style={[
                        styles.circleName,
                        includeFollowers && styles.circleNameSelected,
                      ]}
                    >
                      Followers
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Text style={styles.noCirclesText}>No groups available</Text>
              )}

              <Text style={styles.privacyHint}>{getPrivacyHint()}</Text>
            </ScrollView> */}

            {/* MVP: Show public posting message */}
            <View style={styles.publicNoticeWrapper}>
              <Text style={styles.publicPostingNotice}>
                📢 Sharing publicly with all circles & followers
              </Text>
            </View>

            {/* Post/Log Button */}
            <Pressable
              style={[
                styles.submitButton,
                !selectedAnswer && styles.submitButtonInactive,
                selectedAnswer === 'yes' && styles.submitButtonYes,
                selectedAnswer === 'no' && styles.submitButtonNo,
              ]}
              onPress={() => { Keyboard.dismiss(); handleSubmit(); }}
              disabled={!selectedAnswer || isSubmitting}
            >
              <Text
                style={[
                  styles.submitButtonText,
                  !selectedAnswer && styles.submitButtonTextInactive,
                  selectedAnswer === 'yes' && styles.submitButtonTextYes,
                ]}
              >
                {isSubmitting
                  ? 'Posting...'
                  : selectedAnswer === 'no'
                  ? 'Log it'
                  : selectedAnswer === 'yes'
                  ? 'Post'
                  : 'Post'}
              </Text>
            </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  actionName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  actionType: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 4,
  },
  answerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  answerButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yesButton: {
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  yesButtonActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  noButton: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  noButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.25)',
  },
  answerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  yesButtonText: {
    color: '#D4AF37',
  },
  yesButtonTextActive: {
    color: '#000000',
  },
  noButtonText: {
    color: 'rgba(255,255,255,0.4)',
  },
  noButtonTextActive: {
    color: 'rgba(255,255,255,0.9)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 14,
  },
  photoPreview: {
    width: '100%',
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
    position: 'relative',
  },
  photoPreviewImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  removePhotoButton: {
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
  commentWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  commentInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 11,
    paddingRight: 42,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    minHeight: 42,
  },
  cameraButton: {
    position: 'absolute',
    right: 5,
    top: '50%',
    transform: [{ translateY: -16 }],
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacySection: {
    marginBottom: 14,
    maxHeight: 200,
  },
  privacyLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.2)',
    marginBottom: 6,
    fontWeight: '500',
  },
  circleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 7,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    marginBottom: 3,
    gap: 8,
  },
  circleOptionSelected: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderColor: 'rgba(255,255,255,0.7)',
  },
  circleEmoji: {
    fontSize: 16,
  },
  circleName: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    flex: 1,
  },
  circleNameSelected: {
    color: 'rgba(255,255,255,0.7)',
  },
  privacyHint: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
    marginTop: 4,
    marginLeft: 2,
  },
  noCirclesText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    paddingVertical: 12,
  },
  submitButton: {
    width: '100%',
    padding: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonInactive: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  submitButtonYes: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  submitButtonNo: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButtonTextInactive: {
    color: 'rgba(255,255,255,0.25)',
  },
  submitButtonTextYes: {
    color: '#111',
  },
  publicNoticeWrapper: {
    marginBottom: 14,
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
});
