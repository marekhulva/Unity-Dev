import React, { useState, useEffect, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, TextInput, ScrollView, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { Trophy, Star, Heart, Target, Sparkles, ChevronRight } from 'lucide-react-native';
import { useStore } from '../../state/rootStore';
import { GlassSurface } from '../../ui/GlassSurface';
import { ConfettiView } from '../../ui/ConfettiView';
import { RadialProgress } from '../../ui/RadialProgress';

const { width } = Dimensions.get('window');

type MissedReason = { completed: boolean; distractions?: string; steps?: string };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const DailyReviewModal: React.FC = () => {
  const isOpen = useStore(s => s.isDailyReviewOpen);
  const close = useStore(s => s.closeDailyReview);
  const actions = useStore(s => s.actions);
  const toggleAction = useStore(s => s.toggleAction);
  const addAction = useStore(s => s.addAction);

  const missed = useMemo(() => actions.filter(a => !a.done), [actions]);
  const completed = actions.filter(a => a.done).length;
  const totalProgress = actions.length ? (completed / actions.length) * 100 : 0;

  const [step, setStep] = useState<number>(0);
  const [idx, setIdx] = useState<number>(0);
  const [reasons, setReasons] = useState<Record<string, MissedReason>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({
    biggestWin: '', insight: '', grateful: '', intention: ''
  });
  const [tomorrowText, setTomorrowText] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  const progress = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setIdx(0);
      setReasons({});
      setAnswers({ biggestWin: '', insight: '', grateful: '', intention: '' });
      setTomorrowText('');
      setShowConfetti(false);
      setEarnedPoints(0);
      progress.value = 0;
    }
  }, [isOpen]);

  useEffect(() => {
    progress.value = withSpring((step + 1) / 6);
  }, [step]);

  const currentMissed = missed[idx];

  const handleMarkDone = (done: boolean) => {
    if (!currentMissed) return;
    setReasons(r => ({ ...r, [currentMissed.id]: { ...(r[currentMissed.id] || {}), completed: done } }));
    if (done) {
      toggleAction(currentMissed.id);
      setEarnedPoints(prev => prev + 10);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleNextFromMissed = () => {
    if (!currentMissed) {
      setStep(1);
      return;
    }
    const r = reasons[currentMissed.id];
    if (!r || r.completed === undefined) return;
    
    if (r.completed) {
      toggleAction(currentMissed.id);
    }
    
    if (idx < missed.length - 1) {
      setIdx(idx + 1);
    } else {
      setStep(1);
      setEarnedPoints(prev => prev + 20);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleNextStep = () => {
    if (step < 5) {
      setStep(step + 1);
      setEarnedPoints(prev => prev + 15);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setShowConfetti(true);
    setEarnedPoints(prev => prev + 50);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      close();
    }, 2000);
  };

  const getStepIcon = () => {
    const icons = [Target, Trophy, Sparkles, Heart, Star, Target];
    const Icon = icons[Math.min(step, 5)];
    return <Icon size={32} color={getStepColor()} />;
  };

  const getStepColor = () => {
    const colors = ['#FF006E', '#00D4FF', '#B366FF', '#00FF88', '#FFD600', '#00D4FF'];
    return colors[Math.min(step, 5)];
  };

  const getStepTitle = () => {
    if (step === 0 && missed.length > 0) return `Missed Action ${idx + 1}/${missed.length}`;
    const titles = ['Review Missed', 'Biggest Win 🏆', 'Key Insight 💡', 'Gratitude 💖', 'Tomorrow\'s Focus 🎯', 'Set Intention ✨'];
    return titles[Math.min(step, 5)];
  };

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progress.value, [0, 1], [0, 100])}%`,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(1, { damping: 15 }) },
      { rotateY: `${interpolate(progress.value, [0, 1], [0, 360])}deg` }
    ],
  }));

  if (!isOpen) return null;

  return (
    <Modal transparent animationType="fade">
      <BlurView intensity={40} style={StyleSheet.absoluteFillObject}>
        <View style={styles.container}>
          <Animated.View 
            entering={FadeIn} 
            style={[styles.modal, cardStyle]}
          >
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View style={[styles.progressFill, progressBarStyle, { backgroundColor: getStepColor() }]} />
              </View>
              <Text style={styles.progressText}>Step {step + 1} of 6</Text>
            </View>

            {/* Points Display */}
            <View style={styles.pointsContainer}>
              <Trophy size={20} color="#FFD600" />
              <Text style={styles.pointsText}>{earnedPoints} pts</Text>
            </View>

            {/* Step Icon */}
            <Animated.View 
              entering={SlideInRight}
              exiting={SlideOutLeft}
              style={styles.iconContainer}
            >
              {getStepIcon()}
            </Animated.View>

            {/* Step Title */}
            <Text style={[styles.stepTitle, { color: getStepColor() }]}>
              {getStepTitle()}
            </Text>

            {/* Step Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {step === 0 && currentMissed && (
                <Animated.View entering={FadeIn}>
                  <GlassSurface style={styles.actionCard} neonGlow="pink">
                    <Text style={styles.actionTitle}>{currentMissed.title}</Text>
                    <Text style={styles.actionMeta}>{currentMissed.goalTitle || 'Action'}</Text>
                    
                    <View style={styles.buttonRow}>
                      <Pressable
                        onPress={() => handleMarkDone(true)}
                        style={[styles.optionButton, reasons[currentMissed.id]?.completed && styles.selectedButton]}
                      >
                        <Text style={styles.buttonText}>Actually Did It! ✓</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleMarkDone(false)}
                        style={[styles.optionButton, reasons[currentMissed.id]?.completed === false && styles.selectedButton]}
                      >
                        <Text style={styles.buttonText}>Missed It</Text>
                      </Pressable>
                    </View>

                    {reasons[currentMissed.id]?.completed === false && (
                      <TextInput
                        style={styles.input}
                        placeholder="What got in the way?"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={reasons[currentMissed.id]?.distractions || ''}
                        onChangeText={text => setReasons(r => ({
                          ...r,
                          [currentMissed.id]: { ...r[currentMissed.id], distractions: text }
                        }))}
                        multiline
                      />
                    )}
                  </GlassSurface>
                </Animated.View>
              )}

              {step === 1 && (
                <Animated.View entering={FadeIn}>
                  <Text style={styles.prompt}>What was your biggest win today?</Text>
                  <TextInput
                    style={styles.largeInput}
                    placeholder="Celebrate your victory..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={answers.biggestWin}
                    onChangeText={text => setAnswers(a => ({ ...a, biggestWin: text }))}
                    multiline
                    autoFocus
                  />
                </Animated.View>
              )}

              {step === 2 && (
                <Animated.View entering={FadeIn}>
                  <Text style={styles.prompt}>What key insight did you gain?</Text>
                  <TextInput
                    style={styles.largeInput}
                    placeholder="What did you learn..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={answers.insight}
                    onChangeText={text => setAnswers(a => ({ ...a, insight: text }))}
                    multiline
                    autoFocus
                  />
                </Animated.View>
              )}

              {step === 3 && (
                <Animated.View entering={FadeIn}>
                  <Text style={styles.prompt}>What are you grateful for?</Text>
                  <TextInput
                    style={styles.largeInput}
                    placeholder="Express your gratitude..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={answers.grateful}
                    onChangeText={text => setAnswers(a => ({ ...a, grateful: text }))}
                    multiline
                    autoFocus
                  />
                </Animated.View>
              )}

              {step === 4 && (
                <Animated.View entering={FadeIn}>
                  <Text style={styles.prompt}>What will you focus on tomorrow?</Text>
                  <TextInput
                    style={styles.largeInput}
                    placeholder="Tomorrow's priorities..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={tomorrowText}
                    onChangeText={setTomorrowText}
                    multiline
                    autoFocus
                  />
                </Animated.View>
              )}

              {step === 5 && (
                <Animated.View entering={FadeIn}>
                  <Text style={styles.prompt}>Set your intention for tomorrow</Text>
                  <TextInput
                    style={styles.largeInput}
                    placeholder="I will..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={answers.intention}
                    onChangeText={text => setAnswers(a => ({ ...a, intention: text }))}
                    multiline
                    autoFocus
                  />
                  
                  {/* Summary */}
                  <View style={styles.summary}>
                    <RadialProgress progress={totalProgress} size={100} />
                    <Text style={styles.summaryText}>
                      {completed}/{actions.length} Actions Complete
                    </Text>
                    <Text style={styles.earnedText}>
                      You earned {earnedPoints} points today!
                    </Text>
                  </View>
                </Animated.View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.footer}>
              {step === 0 && currentMissed ? (
                <AnimatedPressable
                  onPress={handleNextFromMissed}
                  style={[styles.nextButton, { backgroundColor: getStepColor() }]}
                  disabled={!reasons[currentMissed.id]?.completed !== undefined}
                >
                  <Text style={styles.nextText}>Next</Text>
                  <ChevronRight size={20} color="#FFF" />
                </AnimatedPressable>
              ) : (
                <AnimatedPressable
                  onPress={step === 5 ? handleComplete : handleNextStep}
                  style={[styles.nextButton, { backgroundColor: getStepColor() }]}
                >
                  <Text style={styles.nextText}>
                    {step === 5 ? 'Complete Review' : 'Continue'}
                  </Text>
                  <ChevronRight size={20} color="#FFF" />
                </AnimatedPressable>
              )}
            </View>
          </Animated.View>

          <ConfettiView active={showConfetti} />
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: width - 40,
    maxWidth: 400,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 24,
    maxHeight: '80%',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  pointsContainer: {
    position: 'absolute',
    top: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,214,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsText: {
    color: '#FFD600',
    fontWeight: '700',
    marginLeft: 6,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },
  content: {
    flex: 1,
    marginBottom: 20,
  },
  actionCard: {
    padding: 16,
    marginBottom: 16,
  },
  actionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  actionMeta: {
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  optionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: 'rgba(0,255,136,0.2)',
    borderColor: '#00FF88',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    color: '#FFF',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  prompt: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  largeInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  summary: {
    alignItems: 'center',
    marginTop: 24,
  },
  summaryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  earnedText: {
    color: '#FFD600',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  footer: {
    marginTop: 20,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  nextText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});