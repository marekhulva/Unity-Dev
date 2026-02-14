import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, Pressable, Dimensions, Platform } from 'react-native';
import { Camera, Mic, MessageSquare, Check, Globe, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

console.log('PrivacySelectionModalOriginal.tsx FILE LOADED');

const { width } = Dimensions.get('window');

interface PrivacySelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (visibility: 'private' | 'public', contentType: 'photo' | 'audio' | 'text' | 'check') => void;
  actionTitle: string;
  streak?: number;
}

export const PrivacySelectionModalOriginal: React.FC<PrivacySelectionModalProps> = ({
  visible,
  onClose,
  onSelect,
  actionTitle,
  streak = 0,
}) => {
  console.log('>>> USING ORIGINAL TWO-OPTION MODAL <<<');
  const [selectedContent, setSelectedContent] = useState<'photo' | 'audio' | 'text' | 'check' | null>(null);
  const [selectedPrivacy, setSelectedPrivacy] = useState<'private' | 'public'>('public');

  const handleContentSelect = (content: 'photo' | 'audio' | 'text' | 'check') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedContent(content);
  };

  const handlePrivacyToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPrivacy(prev => prev === 'public' ? 'private' : 'public');
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
        setSelectedPrivacy('public');
      }, 200);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after close
    setTimeout(() => {
      setSelectedContent(null);
      setSelectedPrivacy('public');
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

            {/* Original Privacy Toggle */}
            <View style={styles.privacySection}>
              <Pressable onPress={handlePrivacyToggle} style={styles.privacyToggle}>
                <View style={styles.privacyOption}>
                  {selectedPrivacy === 'public' ? (
                    <>
                      <Globe size={16} color="#FFD700" />
                      <Text style={styles.privacyText}>Share with Circle</Text>
                    </>
                  ) : (
                    <>
                      <Lock size={14} color="#C0C0C0" />
                      <Text style={[styles.privacyText, { color: '#C0C0C0' }]}>Keep Private</Text>
                    </>
                  )}
                </View>
                <View style={[
                  styles.toggleSwitch,
                  selectedPrivacy === 'private' && styles.toggleSwitchPrivate
                ]}>
                  <View style={[
                    styles.toggleDot,
                    selectedPrivacy === 'private' && styles.toggleDotPrivate
                  ]} />
                </View>
              </Pressable>
              <Text style={styles.privacyHint}>
                {selectedPrivacy === 'public' 
                  ? 'Visible to your accountability circle' 
                  : 'Only you can see this'}
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
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,215,0,0.2)',
    padding: 2,
  },
  toggleSwitchPrivate: {
    backgroundColor: 'rgba(192,192,192,0.2)',
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFD700',
  },
  toggleDotPrivate: {
    backgroundColor: '#C0C0C0',
    transform: [{ translateX: 20 }],
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