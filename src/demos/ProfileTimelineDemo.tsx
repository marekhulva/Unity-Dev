import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  SlideInDown,
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { ChevronRight, ChevronUp, X, Heart, MessageCircle, Share2, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Sample activity data
const sampleActivities = [
  { id: '1', type: 'completion', icon: '✅', text: 'Completed morning workout', time: 'Just now', details: '45 min HIIT session - crushed it! 💪' },
  { id: '2', type: 'post', icon: '📝', text: 'Posted: "Meal prep Sunday! 🥗"', time: '2h ago', image: true },
  { id: '3', type: 'goal', icon: '🎯', text: 'Hit 50% of monthly goal', time: '5h ago', progress: 50 },
  { id: '4', type: 'milestone', icon: '🏆', text: 'Achieved 7-day streak!', time: '1 day ago', celebration: true },
  { id: '5', type: 'completion', icon: '✅', text: 'Read 10 pages', time: '1 day ago' },
  { id: '6', type: 'post', icon: '📝', text: 'Shared progress photo', time: '2 days ago', image: true },
  { id: '7', type: 'goal', icon: '🎯', text: 'Started new goal: 75 HARD', time: '3 days ago' },
  { id: '8', type: 'completion', icon: '✅', text: 'Outdoor workout complete', time: '3 days ago' },
];

// Profile Header Component (simplified from original)
const ProfileHeader = () => (
  <View style={styles.heroCard}>
    <LinearGradient
      colors={['rgba(0,0,0,0.95)', 'rgba(10,10,10,0.98)']}
      style={StyleSheet.absoluteFillObject}
    />
    <View style={styles.heroCardInner}>
      <View style={styles.avatarSection}>
        <LinearGradient
          colors={['#D4AF37', '#C9A050', '#B8860B', '#A0790A']}
          style={styles.avatarRing}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.avatarInner}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.profileInfo}>
        <Text style={styles.username}>@champion</Text>
        <Text style={styles.bio}>Building my best self, one day at a time ✨</Text>

        {/* Today's Progress */}
        <View style={styles.todayProgress}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>Today: 5/7 complete</Text>
            <View style={styles.timeLeft}>
              <Clock size={12} color="#FFD700" />
              <Text style={styles.timeLeftText}>6h 23m left</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={[styles.progressFill, { width: '71%' }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>
      </View>
    </View>
  </View>
);

// Public Goals Component with Consistency Metrics
const PublicGoals = () => {
  // Consistency calculation explanation (same as in Active Goals)
  const getConsistencyExplanation = (percentage: number) => {
    if (percentage >= 90) return "Outstanding consistency! You're crushing it!";
    if (percentage >= 75) return "Great consistency! Keep the momentum going!";
    if (percentage >= 60) return "Good progress! Room to be more consistent.";
    if (percentage >= 40) return "Building habits. Focus on daily execution.";
    return "Just getting started. One day at a time!";
  };

  return (
    <View style={styles.goalsSection}>
      <View style={styles.goalsSectionHeader}>
        <Text style={styles.sectionTitle}>🎯 Public Goals</Text>
        <Text style={styles.consistencyHint}>Consistency = Actions completed / Days active</Text>
      </View>

      <View style={styles.goalCard}>
        <LinearGradient
          colors={['rgba(255,215,0,0.05)', 'rgba(255,215,0,0.02)']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>75 HARD Challenge</Text>
          <Text style={styles.consistencyBadge}>89% Consistency</Text>
        </View>

        {/* Consistency Progress Bar */}
        <View style={styles.goalProgressBar}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={[styles.goalProgressFill, { width: '89%' }]}
          />
        </View>

        <View style={styles.goalStats}>
          <Text style={styles.goalStatItem}>Day 15 of 75</Text>
          <Text style={styles.goalStatDivider}>•</Text>
          <Text style={styles.goalStatItem}>67/75 actions</Text>
        </View>

        <Text style={styles.consistencyMessage}>
          {getConsistencyExplanation(89)}
        </Text>
      </View>

      <View style={styles.goalCard}>
        <LinearGradient
          colors={['rgba(76,237,196,0.05)', 'rgba(76,237,196,0.02)']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>Morning Routine</Text>
          <Text style={[styles.consistencyBadge, { color: '#4ECDC4' }]}>93% Consistency</Text>
        </View>

        <View style={styles.goalProgressBar}>
          <LinearGradient
            colors={['#4ECDC4', '#44A39F']}
            style={[styles.goalProgressFill, { width: '93%' }]}
          />
        </View>

        <View style={styles.goalStats}>
          <Text style={styles.goalStatItem}>28 days active</Text>
          <Text style={styles.goalStatDivider}>•</Text>
          <Text style={styles.goalStatItem}>26/28 completed</Text>
        </View>

        <Text style={styles.consistencyMessage}>
          {getConsistencyExplanation(93)}
        </Text>
      </View>

      <View style={styles.goalCard}>
        <LinearGradient
          colors={['rgba(255,107,107,0.05)', 'rgba(255,107,107,0.02)']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>Evening Meditation</Text>
          <Text style={[styles.consistencyBadge, { color: '#FF6B6B' }]}>71% Consistency</Text>
        </View>

        <View style={styles.goalProgressBar}>
          <LinearGradient
            colors={['#FF6B6B', '#FF5252']}
            style={[styles.goalProgressFill, { width: '71%' }]}
          />
        </View>

        <View style={styles.goalStats}>
          <Text style={styles.goalStatItem}>14 days active</Text>
          <Text style={styles.goalStatDivider}>•</Text>
          <Text style={styles.goalStatItem}>10/14 completed</Text>
        </View>

        <Text style={styles.consistencyMessage}>
          {getConsistencyExplanation(71)}
        </Text>
      </View>
    </View>
  );
};

// Option A: Compact Preview + Expand
const OptionA = () => {
  const [showFullTimeline, setShowFullTimeline] = useState(false);

  return (
    <View style={styles.optionContainer}>
      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>

        <View style={styles.compactList}>
          {sampleActivities.slice(0, 3).map((activity) => (
            <Pressable key={activity.id} style={styles.compactItem}>
              <Text style={styles.activityIcon}>{activity.icon}</Text>
              <View style={styles.compactContent}>
                <Text style={styles.compactText} numberOfLines={1}>{activity.text}</Text>
                <Text style={styles.compactTime}>{activity.time}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.viewAllButton}
          onPress={() => setShowFullTimeline(true)}
        >
          <Text style={styles.viewAllText}>See Full Activity Timeline</Text>
          <ChevronRight size={16} color="#FFD700" />
        </Pressable>
      </View>

      {/* Full Timeline Modal */}
      <Modal
        visible={showFullTimeline}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#000000', '#0A0A0A']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Activity Timeline</Text>
            <Pressable onPress={() => setShowFullTimeline(false)}>
              <X size={24} color="#FFF" />
            </Pressable>
          </View>

          <FlatList
            data={sampleActivities}
            renderItem={({ item }) => (
              <View style={styles.timelineItem}>
                <View style={styles.timelineIcon}>
                  <Text style={styles.activityIcon}>{item.icon}</Text>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineText}>{item.text}</Text>
                  {item.details && <Text style={styles.timelineDetails}>{item.details}</Text>}
                  <Text style={styles.timelineTime}>{item.time}</Text>
                </View>
              </View>
            )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>

      <PublicGoals />
    </View>
  );
};

// Option B: Instagram Stories Style
const OptionB = () => {
  const [selectedStory, setSelectedStory] = useState<string | null>(null);

  const storyDays = [
    { id: 'today', label: 'Today', icon: '⚡', count: 5 },
    { id: 'yesterday', label: 'Yesterday', icon: '🏃', count: 7 },
    { id: '2days', label: '2d ago', icon: '📚', count: 3 },
    { id: '3days', label: '3d ago', icon: '🥗', count: 4 },
    { id: 'week', label: 'Week', icon: '💪', count: 12 },
  ];

  return (
    <View style={styles.optionContainer}>
      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>Activity Stories</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesContainer}
        >
          {storyDays.map((day) => (
            <Pressable
              key={day.id}
              style={styles.storyBubble}
              onPress={() => setSelectedStory(day.id)}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.storyRing}
              >
                <View style={styles.storyInner}>
                  <Text style={styles.storyIcon}>{day.icon}</Text>
                  <View style={styles.storyBadge}>
                    <Text style={styles.storyCount}>{day.count}</Text>
                  </View>
                </View>
              </LinearGradient>
              <Text style={styles.storyLabel}>{day.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Story Viewer Modal */}
        <Modal
          visible={selectedStory !== null}
          animationType="fade"
          transparent
        >
          <Pressable
            style={styles.storyViewer}
            onPress={() => setSelectedStory(null)}
          >
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
            <View style={styles.storyContent}>
              <Text style={styles.storyTitle}>Today's Activities</Text>
              {sampleActivities.slice(0, 4).map((activity) => (
                <View key={activity.id} style={styles.storyItem}>
                  <Text style={styles.activityIcon}>{activity.icon}</Text>
                  <Text style={styles.storyItemText}>{activity.text}</Text>
                </View>
              ))}
              <Text style={styles.storyHint}>Tap to close</Text>
            </View>
          </Pressable>
        </Modal>
      </View>

      <PublicGoals />
    </View>
  );
};

// Option C: Peek Drawer
const OptionC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const translateY = useSharedValue(0);
  const PEEK_HEIGHT = 180;
  const FULL_HEIGHT = height * 0.6;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const toggleExpand = () => {
    if (isExpanded) {
      translateY.value = withSpring(0);
    } else {
      translateY.value = withSpring(-(FULL_HEIGHT - PEEK_HEIGHT));
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.optionContainer}>
      <View style={[styles.peekDrawerContainer, { height: PEEK_HEIGHT }]}>
        <Pressable onPress={toggleExpand} style={styles.peekHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.peekHint}>
            <Text style={styles.peekHintText}>Swipe up</Text>
            <ChevronUp size={16} color="#FFD700" />
          </View>
        </Pressable>

        <Animated.View style={[styles.peekContent, animatedStyle, { height: FULL_HEIGHT }]}>
          <View style={styles.peekDivider} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            scrollEnabled={isExpanded}
          >
            {sampleActivities.map((activity, index) => (
              <Animated.View
                key={activity.id}
                entering={isExpanded ? SlideInUp.delay(index * 50) : undefined}
                style={styles.peekItem}
              >
                <Text style={styles.activityIcon}>{activity.icon}</Text>
                <View style={styles.peekItemContent}>
                  <Text style={styles.peekItemText}>{activity.text}</Text>
                  <Text style={styles.peekItemTime}>{activity.time}</Text>
                </View>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>
      </View>

      <PublicGoals />
    </View>
  );
};

// Main Demo Component
export const ProfileTimelineDemo = () => {
  const [activeTab, setActiveTab] = useState<'optionA' | 'optionB' | 'optionC'>('optionA');

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#0A0A0A', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileHeader />

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'optionA' && styles.activeTab]}
            onPress={() => setActiveTab('optionA')}
          >
            <Text style={[styles.tabText, activeTab === 'optionA' && styles.activeTabText]}>
              Option A
            </Text>
            <Text style={styles.tabSubtext}>Compact + Expand</Text>
          </Pressable>

          <Pressable
            style={[styles.tab, activeTab === 'optionB' && styles.activeTab]}
            onPress={() => setActiveTab('optionB')}
          >
            <Text style={[styles.tabText, activeTab === 'optionB' && styles.activeTabText]}>
              Option B
            </Text>
            <Text style={styles.tabSubtext}>Stories Style</Text>
          </Pressable>

          <Pressable
            style={[styles.tab, activeTab === 'optionC' && styles.activeTab]}
            onPress={() => setActiveTab('optionC')}
          >
            <Text style={[styles.tabText, activeTab === 'optionC' && styles.activeTabText]}>
              Option C
            </Text>
            <Text style={styles.tabSubtext}>Peek Drawer</Text>
          </Pressable>
        </View>

        {/* Render Selected Option */}
        {activeTab === 'optionA' && <OptionA />}
        {activeTab === 'optionB' && <OptionB />}
        {activeTab === 'optionC' && <OptionC />}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  heroCard: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  heroCardInner: {
    alignItems: 'center',
  },
  avatarSection: {
    marginBottom: 16,
  },
  avatarRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    padding: 3,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 39,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  profileInfo: {
    alignItems: 'center',
    width: '100%',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 20,
  },
  todayProgress: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  timeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeLeftText: {
    fontSize: 12,
    color: '#FFD700',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  activeTabText: {
    color: '#FFD700',
  },
  tabSubtext: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 2,
  },
  optionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  activitySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  compactList: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  compactItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  activityIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  compactContent: {
    flex: 1,
  },
  compactText: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 2,
  },
  compactTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 12,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 8,
    gap: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  modalContainer: {
    flex: 1,
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  timelineItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,215,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineText: {
    fontSize: 15,
    color: '#FFF',
    marginBottom: 4,
  },
  timelineDetails: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  storiesContainer: {
    paddingVertical: 8,
    gap: 16,
  },
  storyBubble: {
    alignItems: 'center',
  },
  storyRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 2,
  },
  storyInner: {
    flex: 1,
    borderRadius: 34,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyIcon: {
    fontSize: 28,
  },
  storyBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF0000',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#000',
  },
  storyCount: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: 'bold',
  },
  storyLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 6,
  },
  storyViewer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyContent: {
    width: width * 0.85,
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  storyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  storyItemText: {
    fontSize: 14,
    color: '#FFF',
    marginLeft: 12,
  },
  storyHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 16,
  },
  peekDrawerContainer: {
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 24,
  },
  peekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
  },
  peekHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  peekHintText: {
    fontSize: 12,
    color: '#FFD700',
  },
  peekContent: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
  },
  peekDivider: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 8,
  },
  peekItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  peekItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  peekItemText: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 2,
  },
  peekItemTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  goalsSection: {
    marginTop: 24,
  },
  goalsSectionHeader: {
    marginBottom: 16,
  },
  consistencyHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
    fontStyle: 'italic',
  },
  goalCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  consistencyBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFD700',
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalStatItem: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  goalStatDivider: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
  },
  consistencyMessage: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
  },
  goalDay: {
    fontSize: 14,
    color: '#FFD700',
  },
  goalStatus: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
});