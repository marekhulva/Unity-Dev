import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle as SvgCircle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

// ============================================
// OPTION A: BALANCED GRID
// Consistency circle in center with metrics on sides
// ============================================
export const OptionA_BalancedGrid = ({ consistency = 75, totalScore = 780, streak = 12, activeGoals = 3, todayCompleted = 2, todayTotal = 5 }) => (
  <View style={optionAStyles.card}>
    <View style={optionAStyles.container}>
      {/* Left Side Metrics */}
      <View style={optionAStyles.sideMetrics}>
        <View style={optionAStyles.metricBox}>
          <Text style={optionAStyles.metricValue}>{activeGoals}</Text>
          <Text style={optionAStyles.metricLabel}>Active Goals</Text>
        </View>
        {/* TODO: Fix and re-enable streaks - See mvpfix.md Issue #1 */}
        {/*         <View style={optionAStyles.metricBox}>
          <Text style={optionAStyles.metricValue}>{streak}</Text>
          <Text style={optionAStyles.metricLabel}>Day Streak</Text>
        </View> */}
      </View>

      {/* Center Consistency Circle */}
      <View style={optionAStyles.centerSection}>
        <Svg width={90} height={90} style={{ position: 'absolute' }}>
          <Defs>
            <SvgGradient id="goldA" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFD700" />
              <Stop offset="100%" stopColor="#FFA500" />
            </SvgGradient>
          </Defs>
          <SvgCircle cx="45" cy="45" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
          <SvgCircle cx="45" cy="45" r="40" stroke="url(#goldA)" strokeWidth="6" fill="none"
            strokeDasharray={2 * Math.PI * 40}
            strokeDashoffset={2 * Math.PI * 40 * (1 - consistency / 100)}
            strokeLinecap="round"
            transform="rotate(-90 45 45)"
          />
        </Svg>
        <View style={optionAStyles.circleContent}>
          <Text style={optionAStyles.consistencyValue}>{consistency}%</Text>
          <Text style={optionAStyles.consistencyLabel}>CONSISTENCY</Text>
        </View>
      </View>

      {/* Right Side Metrics */}
      <View style={optionAStyles.sideMetrics}>
        <View style={optionAStyles.metricBox}>
          <Text style={optionAStyles.metricValue}>{todayCompleted}/{todayTotal}</Text>
          <Text style={optionAStyles.metricLabel}>Today</Text>
        </View>
        <View style={optionAStyles.metricBox}>
          <Text style={optionAStyles.metricValue}>{totalScore}</Text>
          <Text style={optionAStyles.metricLabel}>Total Score</Text>
        </View>
      </View>
    </View>
    
    {/* Gold underline */}
    <LinearGradient
      colors={['#D4AF37', '#FFD700', '#D4AF37']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={optionAStyles.underline}
    />
  </View>
);

const optionAStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    paddingVertical: 25,
    paddingHorizontal: 20,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideMetrics: {
    flex: 1,
    alignItems: 'center',
    gap: 15,
  },
  metricBox: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metricLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  centerSection: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  circleContent: {
    alignItems: 'center',
  },
  consistencyValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  consistencyLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 2,
    marginTop: 2,
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});

// ============================================
// OPTION B: HERO + STATS ROW
// Large consistency circle with stat cards below
// ============================================
export const OptionB_HeroStats = ({ consistency = 75, totalScore = 780, streak = 12, activeGoals = 3, todayCompleted = 2, todayTotal = 5 }) => (
  <View style={optionBStyles.card}>
    {/* Main Consistency Circle */}
    <View style={optionBStyles.heroSection}>
      <Svg width={100} height={100} style={{ position: 'absolute' }}>
        <Defs>
          <SvgGradient id="goldB" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFD700" />
            <Stop offset="50%" stopColor="#FFA500" />
            <Stop offset="100%" stopColor="#FFD700" />
          </SvgGradient>
        </Defs>
        <SvgCircle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
        <SvgCircle cx="50" cy="50" r="45" stroke="url(#goldB)" strokeWidth="8" fill="none"
          strokeDasharray={2 * Math.PI * 45}
          strokeDashoffset={2 * Math.PI * 45 * (1 - consistency / 100)}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
      </Svg>
      <View style={optionBStyles.circleContent}>
        <Text style={optionBStyles.consistencyValue}>{consistency}%</Text>
      </View>
    </View>
    <Text style={optionBStyles.consistencyLabel}>CONSISTENCY</Text>

    {/* Stats Row */}
    <View style={optionBStyles.statsRow}>
      <View style={optionBStyles.statCard}>
        <Text style={optionBStyles.statEmoji}>🔥</Text>
        <Text style={optionBStyles.statValue}>{streak}</Text>
        <Text style={optionBStyles.statLabel}>Streak</Text>
      </View>
      
      <View style={optionBStyles.statCard}>
        <Text style={optionBStyles.statEmoji}>⭐</Text>
        <Text style={optionBStyles.statValue}>{totalScore}</Text>
        <Text style={optionBStyles.statLabel}>Score</Text>
      </View>
      
      <View style={optionBStyles.statCard}>
        <Text style={optionBStyles.statEmoji}>🎯</Text>
        <Text style={optionBStyles.statValue}>{activeGoals}</Text>
        <Text style={optionBStyles.statLabel}>Goals</Text>
      </View>
      
      <View style={optionBStyles.statCard}>
        <Text style={optionBStyles.statEmoji}>✅</Text>
        <Text style={optionBStyles.statValue}>{todayCompleted}/{todayTotal}</Text>
        <Text style={optionBStyles.statLabel}>Today</Text>
      </View>
    </View>
    
    {/* Gold underline */}
    <LinearGradient
      colors={['#D4AF37', '#FFD700', '#D4AF37']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={optionBStyles.underline}
    />
  </View>
);

const optionBStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    paddingTop: 25,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroSection: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  circleContent: {
    alignItems: 'center',
  },
  consistencyValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowRadius: 10,
  },
  consistencyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 3,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 25,
  },
  statCard: {
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});

// ============================================
// OPTION C: DASHBOARD STYLE
// Compact layout with side-by-side arrangement
// ============================================
export const OptionC_Dashboard = ({ consistency = 75, totalScore = 780, streak = 12, activeGoals = 3, todayCompleted = 2, todayTotal = 5 }) => (
  <View style={optionCStyles.card}>
    <View style={optionCStyles.topRow}>
      {/* Left: Consistency Circle */}
      <View style={optionCStyles.leftSection}>
        <Svg width={80} height={80} style={{ position: 'absolute' }}>
          <Defs>
            <SvgGradient id="goldC" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFD700" />
              <Stop offset="100%" stopColor="#FFA500" />
            </SvgGradient>
          </Defs>
          <SvgCircle cx="40" cy="40" r="36" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
          <SvgCircle cx="40" cy="40" r="36" stroke="url(#goldC)" strokeWidth="6" fill="none"
            strokeDasharray={2 * Math.PI * 36}
            strokeDashoffset={2 * Math.PI * 36 * (1 - consistency / 100)}
            strokeLinecap="round"
            transform="rotate(-90 40 40)"
          />
        </Svg>
        <View style={optionCStyles.circleContent}>
          <Text style={optionCStyles.consistencyValue}>{consistency}%</Text>
        </View>
      </View>

      {/* Right: Primary Stats */}
      <View style={optionCStyles.rightSection}>
        <View style={optionCStyles.primaryStat}>
          <Text style={optionCStyles.primaryLabel}>TOTAL SCORE</Text>
          <Text style={optionCStyles.primaryValue}>{totalScore.toLocaleString()}</Text>
        </View>
        <View style={optionCStyles.primaryStat}>
          <Text style={optionCStyles.primaryLabel}>CURRENT STREAK</Text>
          <View style={optionCStyles.streakContainer}>
            <Text style={optionCStyles.primaryValue}>{streak} days</Text>
            <Text style={optionCStyles.flame}>🔥</Text>
          </View>
        </View>
      </View>
    </View>

    {/* Bottom: Secondary Stats Bar */}
    <View style={optionCStyles.bottomBar}>
      <View style={optionCStyles.bottomStat}>
        <Text style={optionCStyles.bottomValue}>{activeGoals}</Text>
        <Text style={optionCStyles.bottomLabel}>Active Goals</Text>
      </View>
      <View style={optionCStyles.divider} />
      <View style={optionCStyles.bottomStat}>
        <Text style={optionCStyles.bottomValue}>{todayCompleted}/{todayTotal}</Text>
        <Text style={optionCStyles.bottomLabel}>Today's Progress</Text>
      </View>
      <View style={optionCStyles.divider} />
      <View style={optionCStyles.bottomStat}>
        <Text style={optionCStyles.bottomValue}>{Math.round((todayCompleted/todayTotal) * 100)}%</Text>
        <Text style={optionCStyles.bottomLabel}>Daily Rate</Text>
      </View>
    </View>
    
    {/* Gold underline */}
    <LinearGradient
      colors={['#D4AF37', '#FFD700', '#D4AF37']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={optionCStyles.underline}
    />
  </View>
);

const optionCStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  leftSection: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 25,
  },
  circleContent: {
    alignItems: 'center',
  },
  consistencyValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  rightSection: {
    flex: 1,
    gap: 12,
  },
  primaryStat: {
    gap: 4,
  },
  primaryLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1.5,
  },
  primaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flame: {
    fontSize: 16,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  bottomStat: {
    alignItems: 'center',
    flex: 1,
  },
  bottomValue: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  bottomLabel: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  divider: {
    width: 1,
    height: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});