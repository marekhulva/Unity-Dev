import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  ArrowLeft,
  Users,
  Trophy,
  Activity,
} from 'lucide-react-native';
import { useStore } from '../../../state/rootStore';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface CircleViewContainerProps {
  onBack: () => void;
}

export const CircleViewContainer: React.FC<CircleViewContainerProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  
  // Store connections
  const circleId = useStore(s => s.circleId);
  const circleName = useStore(s => s.circleName);
  const circleFeed = useStore(s => s.circleFeed);
  const user = useStore(s => s.user);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'feed' | 'members' | 'challenges'>('feed');
  
  // Animation for tab indicator
  const indicatorPosition = useSharedValue(0);
  
  useEffect(() => {
    // Animate indicator based on active tab
    const tabWidth = width / 3;
    let position = 0;
    
    switch(activeTab) {
      case 'feed':
        position = 0;
        break;
      case 'members':
        position = tabWidth;
        break;
      case 'challenges':
        position = tabWidth * 2;
        break;
    }
    
    indicatorPosition.value = withSpring(position, {
      damping: 20,
      stiffness: 200,
    });
  }, [activeTab]);
  
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
  }));
  
  const handleTabPress = (tab: 'feed' | 'members' | 'challenges') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };
  
  // TEMPORARY: Removed check for testing
  // if (!circleId) {
  //   return null;
  // }
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>{circleName || 'Circle'}</Text>
        <View style={{ width: 40 }} />
      </View>
      
      {/* Tabs - Exact same styling as main tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabsRow}>
          {/* Feed Tab */}
          <Pressable
            style={styles.tabButton}
            onPress={() => handleTabPress('feed')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'feed' && styles.tabTextActive
            ]}>
              FEED
            </Text>
            {activeTab === 'feed' && (
              <View style={styles.tabIndicator}>
                <View style={styles.tabIndicatorGlow} />
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>
            )}
          </Pressable>
          
          {/* Members Tab (Dynamic Name) */}
          <Pressable
            style={styles.tabButton}
            onPress={() => handleTabPress('members')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'members' && styles.tabTextActive
            ]}>
              {(circleName || 'CIRCLE').toUpperCase()}
            </Text>
            {activeTab === 'members' && (
              <View style={styles.tabIndicator}>
                <View style={styles.tabIndicatorGlow} />
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>
            )}
          </Pressable>
          
          {/* Challenges Tab */}
          <Pressable
            style={styles.tabButton}
            onPress={() => handleTabPress('challenges')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'challenges' && styles.tabTextActive
            ]}>
              CHALLENGES
            </Text>
            {activeTab === 'challenges' && (
              <View style={styles.tabIndicator}>
                <View style={styles.tabIndicatorGlow} />
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>
            )}
          </Pressable>
        </View>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'feed' && (
          <CircleFeedTab />
        )}
        
        {activeTab === 'members' && (
          <CircleMembersTab circleName={circleName} />
        )}
        
        {activeTab === 'challenges' && (
          <CircleChallengesTab />
        )}
      </View>
    </View>
  );
};

// Feed Tab Component
const CircleFeedTab = () => {
  const circleFeed = useStore(s => s.circleFeed);
  
  return (
    <ScrollView style={styles.tabContent}>
      {/* This will show the existing circle feed posts */}
      <Text style={styles.placeholderText}>
        Circle Feed Posts Will Appear Here
      </Text>
      {/* TODO: Import and use existing post components */}
    </ScrollView>
  );
};

// Members Tab Component
const CircleMembersTab = ({ circleName }: { circleName: string }) => {
  return (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Members of {circleName}</Text>
      {/* TODO: Fetch and display circle members */}
      <Text style={styles.placeholderText}>
        Member list will appear here
      </Text>
    </ScrollView>
  );
};

// Challenges Tab Component
const CircleChallengesTab = () => {
  return (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Circle Challenges</Text>
      {/* TODO: Implement challenges */}
      <Text style={styles.placeholderText}>
        Challenges will appear here
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  
  // Tab styles - EXACT COPY from SocialScreenV6
  tabsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    paddingBottom: 8,
    position: 'relative',
    flex: 1,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.4)',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    overflow: 'hidden',
    borderRadius: 0,
  },
  tabIndicatorGlow: {
    position: 'absolute',
    top: -3,
    left: 0,
    right: 0,
    bottom: -3,
    backgroundColor: '#B8860B',
    opacity: 0.2,
    shadowColor: '#996515',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  
  // Content styles
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 1,
  },
  placeholderText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 40,
  },
});