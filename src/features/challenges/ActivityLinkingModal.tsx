import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  FadeOut,
  SlideInDown,
} from 'react-native-reanimated';
import { Link2, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useStore } from '../../state/rootStore';

const { height } = Dimensions.get('window');

interface ActivityLinkingModalProps {
  visible: boolean;
  challengeActivities: Array<{ id: string; title: string; icon: string }>;
  onComplete: (links: Record<string, string>) => void;
  onSkip: () => void;
}

export const ActivityLinkingModal: React.FC<ActivityLinkingModalProps> = ({
  visible,
  challengeActivities,
  onComplete,
  onSkip,
}) => {
  const actions = useStore((state) => state.actions);
  const [links, setLinks] = useState<Record<string, string>>({});
  
  // Get existing user habits/actions
  const existingActions = actions.filter(a => !a.isChallenge);

  const toggleLink = (activityId: string, actionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setLinks(prev => {
      const newLinks = { ...prev };
      
      // If same link, remove it
      if (newLinks[activityId] === actionId) {
        delete newLinks[activityId];
      } else {
        // Remove any previous links to this action (one action can only link to one activity)
        Object.keys(newLinks).forEach(key => {
          if (newLinks[key] === actionId) {
            delete newLinks[key];
          }
        });
        // Set new link
        newLinks[activityId] = actionId;
      }
      
      return newLinks;
    });
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete(links);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
    >
      <Animated.View 
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        style={StyleSheet.absoluteFillObject}
      >
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject}>
          <View style={styles.backdrop} />
        </BlurView>
        
        <Animated.View
          entering={SlideInDown.springify()}
          style={styles.container}
        >
          <View style={styles.modal}>
            <LinearGradient
              colors={['rgba(255,215,0,0.05)', 'transparent']}
              style={StyleSheet.absoluteFillObject}
            />
            
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Link Activities</Text>
                <Text style={styles.subtitle}>
                  Do any of these match habits you already track?
                </Text>
              </View>
              <Pressable onPress={onSkip} style={styles.closeButton}>
                <X size={24} color="rgba(255,255,255,0.5)" />
              </Pressable>
            </View>
            
            {/* Info */}
            <View style={styles.infoBox}>
              <Link2 size={16} color="#FFD700" />
              <Text style={styles.infoText}>
                Linked activities will share completion. Check off once, counts for both!
              </Text>
            </View>
            
            {/* Activities */}
            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {challengeActivities.map((activity) => (
                <View key={activity.id} style={styles.activitySection}>
                  {/* Challenge Activity */}
                  <View style={styles.challengeActivity}>
                    <Text style={styles.activityIcon}>{activity.icon}</Text>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                  </View>
                  
                  {/* Existing Actions */}
                  <View style={styles.existingActions}>
                    <Text style={styles.sectionLabel}>Link to existing habit:</Text>
                    <Pressable
                      style={[
                        styles.optionButton,
                        !links[activity.id] && styles.optionButtonSelected
                      ]}
                      onPress={() => {
                        const newLinks = { ...links };
                        delete newLinks[activity.id];
                        setLinks(newLinks);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={styles.optionText}>Keep as new activity</Text>
                    </Pressable>
                    
                    {existingActions.map((action) => (
                      <Pressable
                        key={action.id}
                        style={[
                          styles.optionButton,
                          links[activity.id] === action.id && styles.optionButtonSelected
                        ]}
                        onPress={() => toggleLink(activity.id, action.id)}
                      >
                        <Text style={styles.optionIcon}>{action.icon}</Text>
                        <Text style={styles.optionText}>{action.title}</Text>
                        {links[activity.id] === action.id && (
                          <View style={styles.linkedBadge}>
                            <Text style={styles.linkedText}>Linked</Text>
                          </View>
                        )}
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
            
            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.linkCount}>
                {Object.keys(links).length} activities linked
              </Text>
              
              <View style={styles.buttons}>
                <Pressable
                  style={styles.skipButton}
                  onPress={onSkip}
                >
                  <Text style={styles.skipButtonText}>Skip Linking</Text>
                </Pressable>
                
                <Pressable
                  style={styles.continueButton}
                  onPress={handleContinue}
                >
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                  <Text style={styles.continueButtonText}>Continue</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 450,
    maxHeight: height * 0.85,
    backgroundColor: 'rgba(20,20,20,0.95)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  closeButton: {
    padding: 8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
    marginBottom: 20,
  },
  activitySection: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  challengeActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  activityIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
  },
  existingActions: {
    paddingLeft: 8,
  },
  sectionLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  optionButtonSelected: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderColor: 'rgba(255,215,0,0.3)',
  },
  optionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  linkedBadge: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  linkedText: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: '600',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 20,
  },
  linkCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  continueButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});