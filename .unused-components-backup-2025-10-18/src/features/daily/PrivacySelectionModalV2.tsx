import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, Pressable, Dimensions, Platform } from 'react-native';
import { Camera, Mic, MessageSquare, Check, Globe, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface PrivacySelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (visibility: 'private' | 'circle' | 'followers', contentType: 'photo' | 'audio' | 'text' | 'check') => void;
  actionTitle: string;
  streak?: number;
}

export const PrivacySelectionModalV2: React.FC<PrivacySelectionModalProps> = ({
  visible,
  onClose,
  onSelect,
  actionTitle,
  streak = 0,
}) => {
  const [selectedContent, setSelectedContent] = useState<'photo' | 'audio' | 'text' | 'check' | null>(null);
  const [selectedPrivacy, setSelectedPrivacy] = useState<'private' | 'circle' | 'followers'>('circle');

  const handleContentSelect = (content: 'photo' | 'audio' | 'text' | 'check') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedContent(content);
  };

  const handlePrivacySelect = (privacy: 'private' | 'circle' | 'followers') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPrivacy(privacy);
  };

  const handleConfirm = () => {
    if (selectedContent) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onSelect(selectedPrivacy, selectedContent);
      // Reset for next time
      setTimeout(() => {
        setSelectedContent(null);
        setSelectedPrivacy('circle');
      }, 200);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after close
    setTimeout(() => {
      setSelectedContent(null);
      setSelectedPrivacy('circle');
    }, 200);
  };

  if (!visible) return null;

  const contentOptions = [
    { id: 'photo', icon: Camera, label: 'Photo', color: '#FFD700' },
    { id: 'audio', icon: Mic, label: 'Audio', color: '#C0C0C0' },
    { id: 'text', icon: MessageSquare, label: 'Comment', color: '#E5E4E2' },
    { id: 'check', icon: Check, label: 'Just Check', color: '#06FFA5' },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Complete Action</Text>
              <Text style={styles.subtitle}>{actionTitle}</Text>
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
                  const isSelected = selectedContent === option.id;
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

            {/* Privacy Segmented Control */}
            <View style={styles.privacySection}>
              <Text style={styles.sectionLabel}>Who can see this?</Text>
              <View style={styles.segmentedControl}>
                <Pressable 
                  onPress={() => handlePrivacySelect('private')}
                  style={[
                    styles.segment,
                    selectedPrivacy === 'private' && styles.segmentActive,
                    { borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }
                  ]}
                >
                  <Lock size={14} color={selectedPrivacy === 'private' ? '#000' : 'rgba(255,255,255,0.4)'} />
                  <Text style={[
                    styles.segmentText,
                    selectedPrivacy === 'private' && styles.segmentTextActive
                  ]}>Private</Text>
                </Pressable>
                
                <View style={styles.segmentDivider} />
                
                <Pressable 
                  onPress={() => handlePrivacySelect('circle')}
                  style={[
                    styles.segment,
                    selectedPrivacy === 'circle' && styles.segmentActive
                  ]}
                >
                  <Text style={[
                    styles.segmentText,
                    selectedPrivacy === 'circle' && styles.segmentTextActive
                  ]}>⭐ Circle</Text>
                </Pressable>
                
                <View style={styles.segmentDivider} />
                
                <Pressable 
                  onPress={() => handlePrivacySelect('followers')}
                  style={[
                    styles.segment,
                    selectedPrivacy === 'followers' && styles.segmentActive,
                    { borderTopRightRadius: 10, borderBottomRightRadius: 10 }
                  ]}
                >
                  <Globe size={14} color={selectedPrivacy === 'followers' ? '#000' : 'rgba(255,255,255,0.4)'} />
                  <Text style={[
                    styles.segmentText,
                    selectedPrivacy === 'followers' && styles.segmentTextActive
                  ]}>Followers</Text>
                </Pressable>
              </View>
              <Text style={styles.privacyHint}>
                {selectedPrivacy === 'private' 
                  ? 'Only you can see this'
                  : selectedPrivacy === 'circle'
                  ? 'Visible to your close friends'
                  : 'Visible to all your followers'}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Pressable onPress={handleClose} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable 
                onPress={handleConfirm} 
                style={[
                  styles.confirmButton,
                  !selectedContent && styles.confirmButtonDisabled
                ]}
                disabled={!selectedContent}
              >
                <Text style={[
                  styles.confirmText,
                  !selectedContent && styles.confirmTextDisabled
                ]}>
                  Complete
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
  },
  modal: {
    backgroundColor: '#0A0A0A',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
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
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contentGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  contentButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  contentButtonSelected: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
  },
  contentButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  privacySection: {
    marginBottom: 24,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 2,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 4,
  },
  segmentDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 4,
  },
  segmentActive: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  segmentTextActive: {
    color: '#000000',
  },
  privacyHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 8,
    marginLeft: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  confirmButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFD700',
  },
  confirmButtonDisabled: {
    backgroundColor: 'rgba(255,215,0,0.2)',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  confirmTextDisabled: {
    color: 'rgba(0,0,0,0.3)',
  },
});