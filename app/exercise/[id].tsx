import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { getExerciseById, EXERCISES, CATEGORY_INFO } from '@/constants/exercises';
import { useApp } from '@/contexts/AppContext';
import { apiPost } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

type SessionPhase = 'prestart' | 'active' | 'complete';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TIMER_SIZE = Math.min(SCREEN_WIDTH * 0.6, 240);
const TIMER_STROKE = 8;
const TIMER_RADIUS = (TIMER_SIZE - TIMER_STROKE) / 2;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;

const EVIDENCE_LABELS: Record<string, { label: string; bg: string }> = {
  MABT: { label: 'Strong Evidence', bg: '#4A8C3F20' },
  breathwork: { label: 'Strong Evidence', bg: '#4A8C3F20' },
  mindfulness: { label: 'Strong Evidence', bg: '#4A8C3F20' },
  somatic: { label: 'Emerging Science', bg: '#B8860B20' },
  exposure: { label: 'Strong Evidence', bg: '#4A8C3F20' },
};

const CATEGORY_SCIENCE_REFLECTIONS: Record<string, string> = {
  heartbeat: 'Your insular cortex has been actively processing cardiac signals during this session. Research shows this strengthens the brain-heart connection that underlies emotional awareness.',
  breathing: 'Your vagus nerve has been stimulated through this practice. Each slow exhale activated your parasympathetic system, reducing cortisol and increasing heart rate variability.',
  bodyScanning: 'You have just completed a systematic interoceptive map of your body. The insular cortex processes each region you attended to, building a more precise internal body model.',
  tension: 'By noticing and releasing tension, you have engaged your proprioceptive and interoceptive systems together. This integration is what makes somatic practices so powerful for stress.',
  temperature: 'Thermal interoception engages your trigeminal nerve and insular cortex simultaneously. Developing this sensitivity improves all forms of body awareness.',
  exposure: 'Controlled exposure to uncomfortable sensations builds distress tolerance. Your amygdala has learned, just slightly, that these signals are safe to feel.',
  gut: 'The enteric nervous system you just connected with contains 500 million neurons. You have strengthened the gut-brain axis, a direct pathway to mood regulation.',
  movement: 'Mindful movement engages proprioceptive receptors throughout your body, feeding rich sensory information to your cerebellum and insula simultaneously.',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function ExerciseSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addSession, sessions, totalSessions, currentStreak, unlockedAchievements, exerciseBookmarks, toggleExerciseBookmark, profile } = useApp();
  const exercise = getExerciseById(id);

  const [phase, setPhase] = useState<SessionPhase>('prestart');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prevAchievementCount] = useState(unlockedAchievements.length);
  const [showEscapeLink, setShowEscapeLink] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: practiceCountsData } = useQuery<{ counts: Record<string, number> }>({
    queryKey: ['/api/exercises/counts'],
    staleTime: 5 * 60 * 1000,
  });
  const practiceCount = practiceCountsData?.counts?.[id] ?? 0;

  const celebrationScale = useSharedValue(0);
  const celebrationOpacity = useSharedValue(0);

  useEffect(() => {
    if (phase === 'complete') {
      celebrationScale.value = withSpring(1, { damping: 12 });
      celebrationOpacity.value = withTiming(1, { duration: 400 });
      if (Platform.OS !== 'web') {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      }
    }
  }, [phase]);

  const celebrationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
    opacity: celebrationOpacity.value,
  }));

  const nextExercise = useMemo(() => {
    if (!exercise) return null;
    const sameCategory = EXERCISES.filter(e => e.category === exercise.category && e.id !== exercise.id);
    if (sameCategory.length > 0) return sameCategory[Math.floor(Math.random() * sameCategory.length)];
    return EXERCISES[Math.floor(Math.random() * EXERCISES.length)];
  }, [exercise]);

  const newAchievements = useMemo(() => {
    if (!saved) return [];
    return unlockedAchievements.slice(prevAchievementCount);
  }, [saved, unlockedAchievements, prevAchievementCount]);

  const topInset = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'active' || isPaused) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null; }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (exercise && currentStepIndex < exercise.steps.length - 1) {
            setCurrentStepIndex(i => i + 1);
            return exercise.steps[currentStepIndex + 1].duration;
          } else {
            setPhase('complete');
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    elapsedRef.current = setInterval(() => {
      setElapsedSeconds(prev => {
        if (prev === 29) setShowEscapeLink(true);
        return prev + 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null; }
    };
  }, [phase, isPaused, currentStepIndex, exercise]);

  const handleBegin = useCallback(() => {
    if (!exercise) return;
    setCurrentStepIndex(0);
    setTimeRemaining(exercise.steps[0].duration);
    setElapsedSeconds(0);
    setShowEscapeLink(false);
    setPhase('active');
    setIsPaused(false);
  }, [exercise]);

  const handleSkip = useCallback(() => {
    if (!exercise) return;
    if (currentStepIndex < exercise.steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setTimeRemaining(exercise.steps[nextIndex].duration);
    } else {
      setPhase('complete');
    }
  }, [exercise, currentStepIndex]);

  const handleSave = useCallback(async () => {
    if (!exercise || isSaving) return;
    setIsSaving(true);
    const sessionData = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      exerciseId: exercise.id,
      exerciseTitle: exercise.title,
      category: exercise.category,
      completedAt: new Date().toISOString(),
      durationMinutes: exercise.durationMinutes,
      rating: selectedRating,
      notes: notes,
    };
    try {
      await addSession(sessionData);
      setSaved(true);
      if (Platform.OS !== 'web') {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      }
    } catch (e) {
      console.error('Failed to save session:', e);
      setIsSaving(false);
      return;
    }
    try {
      await apiPost('/api/sessions', sessionData);
    } catch (e) {
      console.error('Failed to sync session to server:', e);
    }
  }, [exercise, addSession, selectedRating, notes, isSaving]);

  if (!exercise) {
    return (
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.container}>
        <View style={[styles.centered, { paddingTop: topInset }]}>
          <Text style={styles.errorText}>Exercise not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const catInfo = CATEGORY_INFO[exercise.category as keyof typeof CATEGORY_INFO];
  const currentStep = exercise.steps[currentStepIndex];
  const stepDuration = currentStep?.duration ?? 1;
  const progress = stepDuration > 0 ? (stepDuration - timeRemaining) / stepDuration : 0;
  const strokeDashoffset = TIMER_CIRCUMFERENCE * (1 - progress);
  const overallProgress = (currentStepIndex + (phase === 'complete' ? 0 : progress)) / exercise.steps.length;
  const difficultyLabel = exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1);
  const evidence = EVIDENCE_LABELS[exercise.methodology] || { label: 'Emerging Science', bg: '#B8860B20' };
  const hasContraindications = exercise.contraindications && exercise.contraindications.length > 0;
  const userName = profile?.name ? profile.name.split(' ')[0] : '';
  const categoryReflection = CATEGORY_SCIENCE_REFLECTIONS[exercise.category] || 'You have just completed an interoceptive practice session. Each session strengthens your body awareness pathways.';

  if (phase === 'prestart') {
    return (
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.container}>
        <ScrollView
          style={styles.scrollFill}
          contentContainerStyle={[styles.prestartContent, { paddingTop: topInset + 16, paddingBottom: bottomInset + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.prestartTopBar}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="x-circle" size={28} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bookmarkButton}
              onPress={() => toggleExerciseBookmark(exercise.id)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather
                name="bookmark"
                size={28}
                color={exerciseBookmarks.includes(exercise.id) ? Colors.warning : 'rgba(255,255,255,0.8)'}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.categoryLabel}>
            <Text style={styles.categoryLabelText}>{(catInfo?.label || exercise.category).toUpperCase()}</Text>
          </View>

          <View style={styles.prestartHeader}>
            <View style={styles.iconCircle}>
              <Feather name={exercise.iconName as any} size={32} color={Colors.primary} />
            </View>
            <Text style={styles.prestartTitle}>{exercise.title}</Text>
            <Text style={styles.prestartSubtitle}>{exercise.subtitle}</Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="clock" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.metaText}>{exercise.durationMinutes} min</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <Feather name="bar-chart-2" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.metaText}>{difficultyLabel}</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <Feather name="award" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.metaText}>{evidence.label}</Text>
            </View>
          </View>

          {practiceCount > 0 && (
            <View style={styles.practiceCountBadge}>
              <Feather name="users" size={13} color="rgba(255,255,255,0.65)" />
              <Text style={styles.practiceCountText}>{practiceCount} {practiceCount === 1 ? 'person practiced' : 'people practiced'} this week</Text>
            </View>
          )}

          {hasContraindications && (
            <View style={styles.contraindicationCard}>
              <View style={styles.contraindicationHeader}>
                <Feather name="alert-triangle" size={16} color="#B8860B" />
                <Text style={styles.contraindicationTitle}>Before you begin: please read</Text>
              </View>
              {exercise.contraindications.map((c, i) => (
                <View key={i} style={styles.benefitRow}>
                  <Feather name="alert-circle" size={14} color="#E07A5F" />
                  <Text style={styles.benefitText}>{c}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>Benefits</Text>
            {exercise.benefits.map((benefit, i) => (
              <View key={i} style={styles.benefitRow}>
                <Feather name="check-circle" size={16} color={Colors.secondaryLight} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {exercise.preparationTips && exercise.preparationTips.length > 0 && (
            <View style={styles.benefitsCard}>
              <Text style={styles.benefitsTitle}>TO PREPARE</Text>
              {exercise.preparationTips.map((tip, i) => (
                <View key={i} style={styles.benefitRow}>
                  <Feather name="info" size={14} color="rgba(255,255,255,0.5)" />
                  <Text style={styles.benefitText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          {exercise.expectedSensations && exercise.expectedSensations.length > 0 && (
            <View style={styles.benefitsCard}>
              <Text style={styles.benefitsTitle}>YOU MAY NOTICE</Text>
              {exercise.expectedSensations.map((s, i) => (
                <View key={i} style={styles.benefitRow}>
                  <Feather name="eye" size={14} color="rgba(255,255,255,0.5)" />
                  <Text style={styles.benefitText}>{s}</Text>
                </View>
              ))}
              <Text style={styles.sensationNormalisingText}>
                Whatever you notice is valid information. There is no wrong way to sense.
              </Text>
            </View>
          )}

          {exercise.scienceNote && (
            <View style={styles.benefitsCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Feather name="book-open" size={14} color={Colors.secondaryLight} />
                <Text style={styles.benefitsTitle}>WHY THIS WORKS</Text>
              </View>
              <Text style={styles.benefitText}>{exercise.scienceNote}</Text>
              {exercise.researchCitation && (
                <Text style={styles.citationText}>{exercise.researchCitation}</Text>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.beginButton} onPress={handleBegin} activeOpacity={0.85}>
            <Feather name="play" size={22} color={Colors.primary} />
            <Text style={styles.beginButtonText}>Begin</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  if (phase === 'complete') {
    if (saved) {
      return (
        <LinearGradient colors={[Colors.primary, '#3D2F6B']} style={styles.container}>
          <ScrollView
            style={styles.scrollFill}
            contentContainerStyle={[styles.completeContent, { paddingTop: topInset + 24, paddingBottom: bottomInset + 24 }]}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={[styles.celebrationWrap, celebrationStyle]}>
              <View style={styles.celebrationRing3} />
              <View style={styles.celebrationRing2} />
              <View style={styles.celebrationRing1}>
                <Feather name="check" size={40} color="#fff" />
              </View>
            </Animated.View>

            <Text style={styles.completeTitle}>
              {userName ? `Well done, ${userName}` : 'Well done'}
            </Text>
            <Text style={styles.completeSubtitle}>You finished {exercise.title}</Text>

            <View style={styles.scienceReflectionCard}>
              <View style={styles.scienceReflectionHeader}>
                <Feather name="book-open" size={14} color={Colors.secondaryLight} />
                <Text style={styles.scienceReflectionLabel}>{(catInfo?.label || exercise.category).toUpperCase()} | WHAT JUST HAPPENED</Text>
              </View>
              <Text style={styles.scienceReflectionText}>{categoryReflection}</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{exercise.durationMinutes}</Text>
                <Text style={styles.statLabel}>Minutes</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{totalSessions}</Text>
                <Text style={styles.statLabel}>Total Sessions</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{currentStreak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </View>

            {practiceCount > 0 && (
              <View style={styles.practiceCountBadge}>
                <Feather name="users" size={13} color="rgba(255,255,255,0.55)" />
                <Text style={styles.practiceCountText}>{practiceCount} {practiceCount === 1 ? 'person practiced' : 'people practiced'} this exercise this week</Text>
              </View>
            )}

            {newAchievements.length > 0 && (
              <View style={styles.achievementUnlock}>
                <Feather name="award" size={20} color={Colors.warning} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.achievementUnlockTitle}>Achievement Unlocked</Text>
                  <Text style={styles.achievementUnlockText}>
                    You earned {newAchievements.length} new badge{newAchievements.length > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            )}

            {nextExercise && (
              <View style={styles.nextUpSection}>
                <Text style={styles.nextUpLabel}>Up Next</Text>
                <TouchableOpacity
                  style={styles.nextExerciseCard}
                  onPress={() => router.replace(`/exercise/${nextExercise.id}`)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.nextExerciseIcon, { backgroundColor: (CATEGORY_INFO[nextExercise.category as keyof typeof CATEGORY_INFO]?.color || Colors.primary) + '30' }]}>
                    <Feather name={nextExercise.iconName as any} size={18} color={CATEGORY_INFO[nextExercise.category as keyof typeof CATEGORY_INFO]?.color || Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nextExerciseTitle}>{nextExercise.title}</Text>
                    <Text style={styles.nextExerciseMeta}>{nextExercise.durationMinutes} min  {nextExercise.difficulty}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      );
    }

    return (
      <LinearGradient colors={[Colors.primary, Colors.secondaryDark]} style={styles.container}>
        <ScrollView
          style={styles.scrollFill}
          contentContainerStyle={[styles.completeContent, { paddingTop: topInset + 24, paddingBottom: bottomInset + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.completeIconCircle, celebrationStyle]}>
            <Feather name="check" size={48} color={Colors.success} />
          </Animated.View>
          <Text style={styles.completeTitle}>Well Done</Text>
          <Text style={styles.completeSubtitle}>You completed {exercise.title}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{exercise.durationMinutes}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{exercise.steps.length}</Text>
              <Text style={styles.statLabel}>Steps</Text>
            </View>
          </View>

          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>How was this exercise?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setSelectedRating(star)}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Feather
                    name="star"
                    size={36}
                    color={star <= selectedRating ? Colors.warning : 'rgba(255,255,255,0.3)'}
                    style={star <= selectedRating ? { opacity: 1 } : { opacity: 0.6 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="How did you feel during the exercise?"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={isSaving}
          >
            <Feather name="check-circle" size={20} color={Colors.primary} />
            <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Session'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeTextButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.closeTextButtonLabel}>Close without saving</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[Colors.primary, Colors.secondaryDark]} style={styles.container}>
      <View style={[styles.activeContainer, { paddingTop: topInset + 8, paddingBottom: bottomInset + 16 }]}>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${overallProgress * 100}%` }]} />
          </View>
          <Text style={styles.stepCounter}>Step {currentStepIndex + 1} of {exercise.steps.length}</Text>
        </View>

        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>{currentStep.instruction}</Text>
        </View>

        <View style={styles.timerContainer}>
          <Svg width={TIMER_SIZE} height={TIMER_SIZE} style={styles.timerSvg}>
            <Circle
              cx={TIMER_SIZE / 2}
              cy={TIMER_SIZE / 2}
              r={TIMER_RADIUS}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={TIMER_STROKE}
              fill="none"
            />
            <Circle
              cx={TIMER_SIZE / 2}
              cy={TIMER_SIZE / 2}
              r={TIMER_RADIUS}
              stroke={Colors.secondaryLight}
              strokeWidth={TIMER_STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${TIMER_CIRCUMFERENCE}`}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${TIMER_SIZE / 2} ${TIMER_SIZE / 2})`}
            />
          </Svg>
          <View style={styles.timerTextContainer}>
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          </View>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setIsPaused(p => !p)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name={isPaused ? 'play' : 'pause'} size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleSkip}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="skip-forward" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {showEscapeLink && (
          <TouchableOpacity
            style={styles.escapeLink}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Feather name="heart" size={14} color="rgba(255,255,255,0.6)" />
            <Text style={styles.escapeLinkText}>If you feel overwhelmed, it's okay to stop</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.activeCloseButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="x" size={20} color="rgba(255,255,255,0.6)" />
          <Text style={styles.activeCloseText}>End session</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollFill: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 18,
    color: '#fff',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  backButtonText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },

  prestartTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 0,
  },
  closeButton: {
    padding: 4,
  },
  bookmarkButton: {
    padding: 4,
  },
  categoryLabel: {
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  categoryLabelText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
    color: Colors.secondaryLight,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  prestartContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  prestartHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  prestartTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 30,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  prestartSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 8,
  },
  metaText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  practiceCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
  },
  practiceCountText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
  },
  contraindicationCard: {
    backgroundColor: 'rgba(240,192,90,0.15)',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(240,192,90,0.3)',
  },
  contraindicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  contraindicationTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: '#B8860B',
  },
  benefitsCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  benefitsTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 14,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  benefitText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    flex: 1,
    lineHeight: 22,
  },
  sensationNormalisingText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    fontStyle: 'italic' as const,
    marginTop: 8,
    lineHeight: 19,
  },
  citationText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 12,
    lineHeight: 16,
  },
  beginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    width: '100%',
    maxWidth: 300,
    marginTop: 8,
  },
  beginButtonText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: Colors.primary,
  },

  activeContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.secondaryLight,
    borderRadius: 2,
  },
  stepCounter: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  instructionContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
    maxHeight: 140,
  },
  instructionText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 30,
  },
  timerContainer: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  timerSvg: {
    position: 'absolute',
  },
  timerTextContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 40,
    color: '#fff',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 12,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  escapeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  escapeLinkText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    textDecorationLine: 'underline',
  },
  activeCloseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  activeCloseText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },

  completeContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  completeIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  completeTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
    color: '#fff',
    marginBottom: 8,
  },
  completeSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 24,
  },
  scienceReflectionCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    marginBottom: 24,
  },
  scienceReflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  scienceReflectionLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
    color: Colors.secondaryLight,
    letterSpacing: 0.8,
  },
  scienceReflectionText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    minWidth: 90,
  },
  statValue: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 28,
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  ratingLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: '#fff',
    marginBottom: 14,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  notesSection: {
    width: '100%',
    marginBottom: 28,
  },
  notesLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 16,
    minHeight: 90,
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    maxWidth: 300,
    marginBottom: 14,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: Colors.primary,
  },
  closeTextButton: {
    paddingVertical: 10,
  },
  closeTextButtonLabel: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },

  celebrationWrap: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  celebrationRing1: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  celebrationRing2: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.success + '40',
    position: 'absolute',
  },
  celebrationRing3: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: Colors.success + '20',
    position: 'absolute',
  },
  achievementUnlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(240,192,90,0.15)',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(240,192,90,0.3)',
  },
  achievementUnlockTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: Colors.warning,
  },
  achievementUnlockText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  nextUpSection: {
    width: '100%',
    marginBottom: 24,
  },
  nextUpLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 10,
  },
  nextExerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  nextExerciseIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextExerciseTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: '#fff',
  },
  nextExerciseMeta: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  doneButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  doneButtonText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: Colors.primary,
  },
});
