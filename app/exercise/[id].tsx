import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import Colors from '@/constants/colors';
import { getExerciseById } from '@/constants/exercises';
import { useApp } from '@/contexts/AppContext';

type SessionPhase = 'prestart' | 'active' | 'complete';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TIMER_SIZE = Math.min(SCREEN_WIDTH * 0.6, 240);
const TIMER_STROKE = 8;
const TIMER_RADIUS = (TIMER_SIZE - TIMER_STROKE) / 2;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function ExerciseSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addSession } = useApp();
  const exercise = getExerciseById(id);

  const [phase, setPhase] = useState<SessionPhase>('prestart');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'active' || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
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

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [phase, isPaused, currentStepIndex, exercise]);

  const handleBegin = useCallback(() => {
    if (!exercise) return;
    setCurrentStepIndex(0);
    setTimeRemaining(exercise.steps[0].duration);
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
    try {
      await addSession({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        exerciseId: exercise.id,
        exerciseTitle: exercise.title,
        category: exercise.category,
        completedAt: new Date().toISOString(),
        durationMinutes: exercise.durationMinutes,
        rating: selectedRating,
        notes: notes,
      });
      router.back();
    } catch (e) {
      console.error('Failed to save session:', e);
      setIsSaving(false);
    }
  }, [exercise, addSession, selectedRating, notes, isSaving, router]);

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

  const currentStep = exercise.steps[currentStepIndex];
  const stepDuration = currentStep?.duration ?? 1;
  const progress = stepDuration > 0 ? (stepDuration - timeRemaining) / stepDuration : 0;
  const strokeDashoffset = TIMER_CIRCUMFERENCE * (1 - progress);
  const overallProgress = (currentStepIndex + (phase === 'complete' ? 0 : progress)) / exercise.steps.length;
  const difficultyLabel = exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1);

  if (phase === 'prestart') {
    return (
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.container}>
        <ScrollView
          style={styles.scrollFill}
          contentContainerStyle={[styles.prestartContent, { paddingTop: topInset + 16, paddingBottom: bottomInset + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="x-circle" size={28} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>

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
              <Feather name="layers" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.metaText}>{exercise.steps.length} steps</Text>
            </View>
          </View>

          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>Benefits</Text>
            {exercise.benefits.map((benefit, i) => (
              <View key={i} style={styles.benefitRow}>
                <Feather name="check-circle" size={16} color={Colors.secondaryLight} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.beginButton} onPress={handleBegin} activeOpacity={0.85}>
            <Feather name="play" size={22} color={Colors.primary} />
            <Text style={styles.beginButtonText}>Begin</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  if (phase === 'complete') {
    return (
      <LinearGradient colors={[Colors.primary, Colors.secondaryDark]} style={styles.container}>
        <ScrollView
          style={styles.scrollFill}
          contentContainerStyle={[styles.completeContent, { paddingTop: topInset + 24, paddingBottom: bottomInset + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.completeIconCircle}>
            <Feather name="check" size={48} color={Colors.success} />
          </View>
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
                    name={star <= selectedRating ? 'star' : 'star'}
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
            <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save & Close'}</Text>
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

  closeButton: {
    position: 'absolute',
    top: 0,
    left: 20,
    zIndex: 10,
  },
  prestartContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  prestartHeader: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  prestartTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  prestartSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
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
    marginHorizontal: 12,
  },
  metaText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  benefitsCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 36,
  },
  benefitsTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#fff',
    marginBottom: 14,
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
    marginBottom: 24,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 28,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 32,
  },
  statBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 28,
    alignItems: 'center',
    minWidth: 100,
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
});
