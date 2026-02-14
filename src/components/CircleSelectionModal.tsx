import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Lock, Globe, MapPin, AlertTriangle, Check } from 'lucide-react-native';
import { useStore } from '../state/rootStore';
import { PostVisibility } from '../state/slices/socialSlice';

const { width, height } = Dimensions.get('window');

interface CircleSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (visibility: PostVisibility, selectedCircleIds: string[]) => void;
  initialSelection?: PostVisibility;
  initialCircleIds?: string[];
}

export const CircleSelectionModal: React.FC<CircleSelectionModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialSelection,
  initialCircleIds = [],
}) => {
  // Get user's circles from store
  const userCircles = useStore(s => s.userCircles);

  // State management
  const [isPrivate, setIsPrivate] = useState(initialSelection?.isPrivate || false);
  const [isExplore, setIsExplore] = useState(initialSelection?.isExplore || false);
  const [isNetwork, setIsNetwork] = useState(initialSelection?.isNetwork || false);
  const [selectedCircleIds, setSelectedCircleIds] = useState<Set<string>>(
    new Set(initialCircleIds)
  );

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      if (initialSelection) {
        setIsPrivate(initialSelection.isPrivate);
        setIsExplore(initialSelection.isExplore);
        setIsNetwork(initialSelection.isNetwork);
        setSelectedCircleIds(new Set(initialSelection.circleIds));
      }
    }
  }, [visible, initialSelection]);

  const handleQuickOption = useCallback((option: 'private' | 'network') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (option === 'private') {
      setIsPrivate(true);
      setIsNetwork(false);
      setIsExplore(false);
      setSelectedCircleIds(new Set());
    } else if (option === 'network') {
      setIsNetwork(true);
      setIsPrivate(false);
      setSelectedCircleIds(new Set());
    }
  }, []);

  const toggleExplore = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newExplore = !isExplore;
    setIsExplore(newExplore);

    // If enabling Explore, disable Private
    if (newExplore) {
      setIsPrivate(false);
    }
  }, [isExplore]);

  const toggleCircle = useCallback((circleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newSet = new Set(selectedCircleIds);
    if (newSet.has(circleId)) {
      newSet.delete(circleId);
    } else {
      newSet.add(circleId);
    }
    setSelectedCircleIds(newSet);

    // If selecting circles, clear private and network
    if (newSet.size > 0) {
      setIsPrivate(false);
      setIsNetwork(false);
    }
  }, [selectedCircleIds]);

  const selectAllCircles = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const allCircleIds = userCircles.map(c => c.id);
    setSelectedCircleIds(new Set(allCircleIds));
    setIsPrivate(false);
    setIsNetwork(false);
  }, [userCircles]);

  const clearAllCircles = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCircleIds(new Set());
  }, []);

  const handleConfirm = useCallback(() => {
    const visibility: PostVisibility = {
      isPrivate,
      isExplore,
      isNetwork,
      circleIds: Array.from(selectedCircleIds),
    };

    // Validation
    if (!isPrivate && !isNetwork && selectedCircleIds.size === 0 && !isExplore) {
      Alert.alert('Select Audience', 'Please select who can see this post');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm(visibility, Array.from(selectedCircleIds));
    onClose();
  }, [isPrivate, isExplore, isNetwork, selectedCircleIds, onConfirm, onClose]);

  const getSelectionSummary = () => {
    if (isPrivate) {
      return 'Private - Only you can see this';
    }

    const parts = [];

    if (isExplore) {
      parts.push('Explore');
    }

    if (isNetwork) {
      parts.push('My Network');
    } else if (selectedCircleIds.size > 0) {
      const selectedCircles = userCircles.filter(c => selectedCircleIds.has(c.id));
      const totalMembers = selectedCircles.reduce((sum, c) => sum + (c.member_count || 0), 0);

      if (selectedCircleIds.size === 1) {
        const circle = selectedCircles[0];
        parts.push(circle?.name || 'Circle');
      } else {
        parts.push(`${selectedCircleIds.size} circles (${totalMembers} people)`);
      }
    }

    if (parts.length === 0) {
      return 'No audience selected';
    }

    return parts.join(' + ');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={() => {}}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />

          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={['rgba(255,215,0,0.1)', 'rgba(255,215,0,0.05)']}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.headerTitle}>Who can see this?</Text>
          </View>

          {/* Body */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Quick Options */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>QUICK OPTIONS</Text>

              <Pressable
                style={[styles.quickOption, isPrivate && styles.quickOptionSelected]}
                onPress={() => handleQuickOption('private')}
              >
                <Lock size={20} color={isPrivate ? '#FFD700' : '#FFF'} />
                <View style={styles.quickOptionText}>
                  <Text style={styles.quickOptionLabel}>Only Me</Text>
                  <Text style={styles.quickOptionDesc}>Private - save for yourself</Text>
                </View>
              </Pressable>

              <Pressable
                style={[styles.quickOption, isNetwork && styles.quickOptionSelected]}
                onPress={() => handleQuickOption('network')}
              >
                <Globe size={20} color={isNetwork ? '#FFD700' : '#FFF'} />
                <View style={styles.quickOptionText}>
                  <Text style={styles.quickOptionLabel}>My Network</Text>
                  <Text style={styles.quickOptionDesc}>All circles & followers</Text>
                </View>
              </Pressable>
            </View>

            {/* Explore Toggle */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>DISCOVERY</Text>

              <Pressable
                style={[styles.exploreToggle, isExplore && styles.exploreToggleActive]}
                onPress={toggleExplore}
              >
                <View style={[styles.checkbox, isExplore && styles.checkboxChecked]}>
                  {isExplore && <Check size={14} color="#000" strokeWidth={3} />}
                </View>
                <MapPin size={20} color={isExplore ? '#FFD700' : '#FFF'} />
                <View style={styles.quickOptionText}>
                  <Text style={styles.quickOptionLabel}>Share to Explore</Text>
                  <Text style={styles.quickOptionDesc}>Make discoverable by everyone</Text>
                </View>
              </Pressable>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Circle Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>OR SELECT SPECIFIC CIRCLES</Text>

              {userCircles.map(circle => (
                <Pressable
                  key={circle.id}
                  style={[
                    styles.circleItem,
                    selectedCircleIds.has(circle.id) && styles.circleItemSelected
                  ]}
                  onPress={() => toggleCircle(circle.id)}
                >
                  <View style={[
                    styles.checkbox,
                    selectedCircleIds.has(circle.id) && styles.checkboxChecked
                  ]}>
                    {selectedCircleIds.has(circle.id) && (
                      <Check size={14} color="#000" strokeWidth={3} />
                    )}
                  </View>
                  <Text style={styles.circleEmoji}>{circle.emoji || '⭐'}</Text>
                  <View style={styles.circleInfo}>
                    <Text style={styles.circleName}>{circle.name}</Text>
                    <Text style={styles.circleMembers}>
                      {circle.member_count || 0} members
                    </Text>
                  </View>
                </Pressable>
              ))}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Pressable style={styles.btnSelectAll} onPress={selectAllCircles}>
                  <Text style={styles.btnSelectAllText}>Select All</Text>
                </Pressable>
                <Pressable style={styles.btnClear} onPress={clearAllCircles}>
                  <Text style={styles.btnClearText}>Clear</Text>
                </Pressable>
              </View>
            </View>

            {/* Warning for Explore */}
            {isExplore && (
              <View style={styles.warning}>
                <AlertTriangle size={16} color="#FFA500" />
                <Text style={styles.warningText}>
                  Posts shared to Explore will be discoverable by everyone on the platform
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.summary}>{getSelectionSummary()}</Text>

            <View style={styles.footerButtons}>
              <Pressable style={styles.btnCancel} onPress={onClose}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </Pressable>

              <Pressable style={styles.btnConfirm} onPress={handleConfirm}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Text style={styles.btnConfirmText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: width * 0.9,
    maxWidth: 400,
    maxHeight: height * 0.8,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  body: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: 'rgba(255,215,0,0.6)',
    marginBottom: 12,
    fontWeight: '600',
  },
  quickOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  quickOptionSelected: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderColor: '#FFD700',
  },
  quickOptionText: {
    flex: 1,
  },
  quickOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  quickOptionDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  exploreToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  exploreToggleActive: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderColor: '#FFD700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,215,0,0.2)',
    marginVertical: 20,
  },
  circleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    marginBottom: 8,
  },
  circleItemSelected: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderColor: 'rgba(255,215,0,0.5)',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  circleEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  circleInfo: {
    flex: 1,
  },
  circleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  circleMembers: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  btnSelectAll: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSelectAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
  },
  btnClear: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    borderRadius: 8,
    alignItems: 'center',
  },
  btnClearText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
  },
  warning: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,100,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,100,0,0.3)',
    borderRadius: 8,
    padding: 10,
    gap: 8,
    alignItems: 'center',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#FFA500',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  summary: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
    textAlign: 'center',
    minHeight: 20,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  btnConfirm: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    overflow: 'hidden',
  },
  btnConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});