import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useStore } from '../../state/rootStore';
import { format, differenceInDays, startOfDay, subDays } from 'date-fns';

const { width, height } = Dimensions.get('window');

export const ProgressMinimal = () => {
  const completedActions = useStore(s => s.completedActions);
  const goals = useStore(s => s.goals);
  const user = useStore(s => s.user);
  
  // Calculate the real metrics that matter
  const today = startOfDay(new Date());
  const firstActionDate = completedActions.length > 0 
    ? new Date(Math.min(...completedActions.map(a => new Date(a.completedAt).getTime())))
    : today;
  
  const daysSinceStart = Math.max(1, differenceInDays(today, firstActionDate) + 1);
  const uniqueDaysWithActions = new Set(
    completedActions.map(a => format(new Date(a.completedAt), 'yyyy-MM-dd'))
  ).size;
  
  const consistencyRate = Math.round((uniqueDaysWithActions / daysSinceStart) * 100);
  
  // Get last 30 days of data for the minimalist graph
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(today, 29 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const actionsOnDay = completedActions.filter(
      a => format(new Date(a.completedAt), 'yyyy-MM-dd') === dateStr
    );
    return {
      date,
      completed: actionsOnDay.length > 0,
      count: actionsOnDay.length,
    };
  });
  
  // Pulse animation for the main number
  const pulseAnim = useSharedValue(1);
  
  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, []);
  
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));
  
  // Determine the brutal truth message
  const getTruthMessage = () => {
    if (consistencyRate >= 90) return "You're actually doing it.";
    if (consistencyRate >= 70) return "Good. But not great.";
    if (consistencyRate >= 50) return "Half-assing it won't work.";
    if (consistencyRate >= 30) return "You're lying to yourself.";
    return "Start. Or quit pretending.";
  };
  
  const getSubMessage = () => {
    if (uniqueDaysWithActions === 0) return "Zero days completed. Time to begin.";
    if (uniqueDaysWithActions === 1) return "One day. Keep going.";
    if (daysSinceStart === uniqueDaysWithActions) return "Perfect record. Rare.";
    const missed = daysSinceStart - uniqueDaysWithActions;
    return `${missed} day${missed === 1 ? '' : 's'} missed. That's the truth.`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Days Counter - The Only Number That Matters */}
        <Animated.View 
          entering={FadeIn.duration(1000)}
          style={styles.heroSection}
        >
          <Text style={styles.label}>DAYS COMMITTED</Text>
          <Animated.View style={pulseStyle}>
            <Text style={styles.heroNumber}>
              {uniqueDaysWithActions}
              <Text style={styles.heroTotal}>/{daysSinceStart}</Text>
            </Text>
          </Animated.View>
        </Animated.View>
        
        {/* The Truth Section */}
        <Animated.View 
          entering={FadeInDown.delay(300).duration(800)}
          style={styles.truthSection}
        >
          <Text style={styles.truthMessage}>{getTruthMessage()}</Text>
          <Text style={styles.truthSub}>{getSubMessage()}</Text>
        </Animated.View>
        
        {/* Minimalist Activity Graph - Last 30 Days */}
        <Animated.View 
          entering={FadeInDown.delay(600).duration(800)}
          style={styles.graphSection}
        >
          <Text style={styles.graphLabel}>LAST 30 DAYS</Text>
          <View style={styles.graph}>
            {last30Days.map((day, index) => (
              <View key={index} style={styles.dayColumn}>
                <View 
                  style={[
                    styles.dayBar,
                    {
                      height: day.completed ? Math.min(40, 10 + day.count * 10) : 2,
                      backgroundColor: day.completed 
                        ? 'rgba(212, 175, 55, 0.8)'  // Gold when active
                        : 'rgba(255, 255, 255, 0.05)', // Almost invisible when not
                    }
                  ]}
                />
              </View>
            ))}
          </View>
          <View style={styles.graphFooter}>
            <Text style={styles.graphFooterText}>30 days ago</Text>
            <Text style={styles.graphFooterText}>Today</Text>
          </View>
        </Animated.View>
        
        {/* Consistency Rate - Single Line */}
        <Animated.View 
          entering={FadeInDown.delay(900).duration(800)}
          style={styles.consistencySection}
        >
          <View style={styles.consistencyBar}>
            <View 
              style={[
                styles.consistencyFill,
                { width: `${consistencyRate}%` }
              ]}
            />
          </View>
          <Text style={styles.consistencyText}>
            {consistencyRate}% CONSISTENCY
          </Text>
        </Animated.View>
        
        {/* Active Goals - Super Minimal */}
        {goals.length > 0 && (
          <Animated.View 
            entering={FadeInDown.delay(1200).duration(800)}
            style={styles.goalsSection}
          >
            <Text style={styles.goalsLabel}>PURSUING</Text>
            {goals.slice(0, 3).map((goal, index) => (
              <Text key={index} style={styles.goalItem}>
                {goal.title.toUpperCase()}
              </Text>
            ))}
          </Animated.View>
        )}
        
        {/* The Bottom Line */}
        <Animated.View 
          entering={FadeInDown.delay(1500).duration(800)}
          style={styles.bottomLine}
        >
          <Text style={styles.bottomText}>
            {uniqueDaysWithActions === 0 
              ? "BEGIN."
              : consistencyRate >= 80 
              ? "KEEP GOING."
              : "DO BETTER."}
          </Text>
        </Animated.View>
      </ScrollView>
      
      {/* Subtle gradient overlay at bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)', '#000000']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    paddingTop: 40,
    paddingBottom: 100,
    alignItems: 'center',
  },
  
  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  label: {
    fontSize: 11,
    letterSpacing: 2,
    color: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 16,
    fontWeight: '600',
  },
  heroNumber: {
    fontSize: 96,
    fontWeight: '200',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  heroTotal: {
    fontSize: 48,
    color: 'rgba(255, 255, 255, 0.2)',
  },
  
  // Truth Section
  truthSection: {
    alignItems: 'center',
    marginBottom: 60,
    paddingHorizontal: 40,
  },
  truthMessage: {
    fontSize: 24,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  truthSub: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    fontWeight: '400',
  },
  
  // Graph Section
  graphSection: {
    width: width - 80,
    marginBottom: 60,
  },
  graphLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 20,
    fontWeight: '600',
  },
  graph: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'flex-end',
    gap: 2,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
  },
  dayBar: {
    width: '100%',
    borderRadius: 1,
  },
  graphFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  graphFooterText: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.2)',
    fontWeight: '500',
  },
  
  // Consistency Section
  consistencySection: {
    width: width - 80,
    marginBottom: 60,
  },
  consistencyBar: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  consistencyFill: {
    height: '100%',
    backgroundColor: 'rgba(212, 175, 55, 0.6)',
  },
  consistencyText: {
    fontSize: 11,
    letterSpacing: 2,
    color: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '600',
  },
  
  // Goals Section
  goalsSection: {
    width: width - 80,
    marginBottom: 60,
  },
  goalsLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 16,
    fontWeight: '600',
  },
  goalItem: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  
  // Bottom Line
  bottomLine: {
    marginTop: 40,
  },
  bottomText: {
    fontSize: 14,
    letterSpacing: 3,
    color: 'rgba(212, 175, 55, 0.8)',
    fontWeight: '600',
  },
  
  // Gradient
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
});