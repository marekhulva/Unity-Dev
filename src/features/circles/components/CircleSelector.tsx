import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, Check, Plus, Users } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { height } = Dimensions.get('window');

interface Circle {
  id: string;
  name: string;
  emoji?: string;
  member_count?: number;
}

// Special feed type IDs
export const FEED_ALL = '__ALL__';
export const FEED_FOLLOWING = '__FOLLOWING__';

interface CircleSelectorProps {
  circles: Circle[];
  activeCircleId: string | null;
  onCircleSelect: (circleId: string | null) => void;
  onJoinCircle: () => void;
  loading?: boolean;
  error?: string | null;
  style?: any;
  compact?: boolean;
}

export const CircleSelector: React.FC<CircleSelectorProps> = ({
  circles,
  activeCircleId,
  onCircleSelect,
  onJoinCircle,
  loading,
  error,
  style,
  compact = false,
}) => {
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  const activeCircle = circles.find(c => c.id === activeCircleId);

  // Get display name for current selection
  const getDisplayName = () => {
    if (activeCircleId === FEED_ALL || activeCircleId === null) return 'All';
    if (activeCircleId === FEED_FOLLOWING) return 'Following';
    return activeCircle?.name || 'Select Feed';
  };

  const getDisplayEmoji = () => {
    if (activeCircleId === FEED_ALL || activeCircleId === null) return '🌐';
    if (activeCircleId === FEED_FOLLOWING) return '👥';
    return activeCircle?.emoji || '👥';
  };

  const handleCircleSelect = (circleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCircleSelect(circleId);
    setShowBottomSheet(false);
  };

  const handleJoinCircle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowBottomSheet(false);
    onJoinCircle();
  };

  if (compact) {
    return (
      <>
        <Pressable
          style={[styles.compactTrigger, style]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowBottomSheet(true);
          }}
        >
          <Text style={styles.compactText} numberOfLines={1}>
            {getDisplayEmoji()} {getDisplayName()}
          </Text>
          <ChevronDown size={16} color="#FFD700" />
        </Pressable>

        <BottomSheetModal
          visible={showBottomSheet}
          onClose={() => setShowBottomSheet(false)}
          circles={circles}
          activeCircleId={activeCircleId}
          onCircleSelect={handleCircleSelect}
          onJoinCircle={handleJoinCircle}
          loading={loading}
          error={error}
        />
      </>
    );
  }

  return (
    <>
      <Pressable
        style={[styles.trigger, style]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowBottomSheet(true);
        }}
      >
        <Text style={styles.triggerName} numberOfLines={1}>
          {getDisplayName()}
        </Text>
        <ChevronDown size={14} color="rgba(255,255,255,0.4)" />
      </Pressable>

      <BottomSheetModal
        visible={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        circles={circles}
        activeCircleId={activeCircleId}
        onCircleSelect={handleCircleSelect}
        onJoinCircle={handleJoinCircle}
        loading={loading}
        error={error}
      />
    </>
  );
};

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  circles: Circle[];
  activeCircleId: string | null;
  onCircleSelect: (circleId: string) => void;
  onJoinCircle: () => void;
  loading?: boolean;
  error?: string | null;
}

const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
  visible,
  onClose,
  circles,
  activeCircleId,
  onCircleSelect,
  onJoinCircle,
  loading,
  error,
}) => {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <Animated.View
          entering={FadeIn.duration(200)}
          style={[
            styles.bottomSheet,
            {
              maxHeight: height * 0.6,
              paddingBottom: 20,
            }
          ]}
        >
          <LinearGradient
            colors={['#1a1a1a', '#000']}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Switch Circle</Text>
            <Text style={styles.sheetSubtitle}>
              {circles.length} {circles.length === 1 ? 'circle' : 'circles'} available
            </Text>
          </View>

          <ScrollView
            style={styles.sheetContent}
            contentContainerStyle={[
              styles.sheetContentContainer,
              { paddingBottom: 20 }
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* All and Following options */}
            <Animated.View entering={FadeIn.delay(0)}>
              <Pressable
                style={[styles.circleItem, (activeCircleId === FEED_ALL || activeCircleId === null) && styles.circleItemActive]}
                onPress={() => onCircleSelect(FEED_ALL)}
              >
                {(activeCircleId === FEED_ALL || activeCircleId === null) && (
                  <LinearGradient
                    colors={['rgba(255,215,0,0.15)', 'rgba(255,215,0,0.05)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                )}
                <View style={styles.circleItemContent}>
                  <View style={styles.circleItemLeft}>
                    <Text style={styles.circleEmoji}>🌐</Text>
                    <View style={styles.circleInfo}>
                      <Text style={styles.circleName}>All</Text>
                      <Text style={styles.circleMeta}>Posts from all circles & following</Text>
                    </View>
                  </View>
                  {(activeCircleId === FEED_ALL || activeCircleId === null) && (
                    <View style={styles.checkContainer}>
                      <Check size={20} color="#FFD700" strokeWidth={3} />
                    </View>
                  )}
                </View>
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeIn.delay(50)}>
              <Pressable
                style={[styles.circleItem, activeCircleId === FEED_FOLLOWING && styles.circleItemActive]}
                onPress={() => onCircleSelect(FEED_FOLLOWING)}
              >
                {activeCircleId === FEED_FOLLOWING && (
                  <LinearGradient
                    colors={['rgba(255,215,0,0.15)', 'rgba(255,215,0,0.05)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                )}
                <View style={styles.circleItemContent}>
                  <View style={styles.circleItemLeft}>
                    <Text style={styles.circleEmoji}>👥</Text>
                    <View style={styles.circleInfo}>
                      <Text style={styles.circleName}>Following</Text>
                      <Text style={styles.circleMeta}>Posts from people you follow</Text>
                    </View>
                  </View>
                  {activeCircleId === FEED_FOLLOWING && (
                    <View style={styles.checkContainer}>
                      <Check size={20} color="#FFD700" strokeWidth={3} />
                    </View>
                  )}
                </View>
              </Pressable>
            </Animated.View>

            {/* Divider */}
            <View style={styles.sectionDivider}>
              <Text style={styles.sectionLabel}>YOUR CIRCLES</Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Loading circles...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : circles.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Users size={48} color="rgba(255,215,0,0.3)" />
                <Text style={styles.emptyTitle}>No circles yet</Text>
                <Text style={styles.emptySubtitle}>
                  Join or create your first circle
                </Text>
              </View>
            ) : (
              circles.map((circle, index) => {
                const isActive = circle.id === activeCircleId;
                return (
                  <Animated.View
                    key={circle.id}
                    entering={FadeIn.delay((index + 2) * 50)}
                  >
                    <Pressable
                      style={[styles.circleItem, isActive && styles.circleItemActive]}
                      onPress={() => onCircleSelect(circle.id)}
                    >
                      {isActive && (
                        <LinearGradient
                          colors={['rgba(255,215,0,0.15)', 'rgba(255,215,0,0.05)']}
                          style={StyleSheet.absoluteFillObject}
                        />
                      )}

                      <View style={styles.circleItemContent}>
                        <View style={styles.circleItemLeft}>
                          <Text style={styles.circleEmoji}>{circle.emoji || '⭐'}</Text>
                          <View style={styles.circleInfo}>
                            <Text style={styles.circleName}>{circle.name}</Text>
                            {circle.member_count !== undefined && (
                              <Text style={styles.circleMeta}>
                                {circle.member_count} {circle.member_count === 1 ? 'member' : 'members'}
                              </Text>
                            )}
                          </View>
                        </View>

                        {isActive && (
                          <View style={styles.checkContainer}>
                            <Check size={20} color="#FFD700" strokeWidth={3} />
                          </View>
                        )}
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })
            )}

            <Pressable style={styles.joinButton} onPress={onJoinCircle}>
              <LinearGradient
                colors={['rgba(255,215,0,0.1)', 'rgba(255,215,0,0.05)']}
                style={StyleSheet.absoluteFillObject}
              />
              <Plus size={20} color="#FFD700" />
              <Text style={styles.joinButtonText}>Join Another Circle</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  triggerEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  triggerTextContainer: {
    flex: 1,
  },
  triggerLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 2,
  },
  triggerName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  compactTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  compactText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    maxWidth: 120,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  bottomSheet: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sheetHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  sheetContent: {
    flex: 1,
  },
  sheetContentContainer: {
    padding: 20,
  },
  circleItem: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  circleItemActive: {
    borderColor: 'rgba(255,215,0,0.3)',
  },
  circleItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  circleItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  circleEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  circleInfo: {
    flex: 1,
  },
  circleName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  circleMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  checkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,215,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  joinButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFD700',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: 'rgba(255,100,100,0.8)',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  sectionDivider: {
    marginTop: 16,
    marginBottom: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
  },
});
