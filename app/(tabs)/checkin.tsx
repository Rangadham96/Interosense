import { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { isToday, parseISO } from 'date-fns';
import { apiPost } from '@/lib/api';
import { router } from 'expo-router';
import GetHelpLink from '@/components/GetHelpLink';
import { EXERCISES, CATEGORY_INFO } from '@/constants/exercises';

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour <= 11) return 'morning';
  if (hour >= 12 && hour <= 16) return 'afternoon';
  if (hour >= 17 && hour <= 21) return 'evening';
  return 'night';
}

const TIME_HINTS: Record<TimeOfDay, Record<number, string>> = {
  morning: {
    0: 'Take a moment to notice how your body feels waking into this day.',
    1: 'Notice any morning heaviness or lightness. Your body is speaking.',
    2: 'How did rest land in your body last night?',
    3: 'Notice any anticipatory tension your body is already holding.',
  },
  afternoon: {
    0: 'Pause and reconnect. Your body has been carrying you all morning.',
    1: 'How has your energy shifted since you woke up?',
    2: 'How is last night\'s rest still affecting how you feel right now?',
    3: 'Notice where the morning\'s demands have landed in your body.',
  },
  evening: {
    0: 'Wind down and tune in. What has your body absorbed today?',
    1: 'How much energy does your body have left at the end of this day?',
    2: 'How is your body recovering from last night?',
    3: 'What stress has built through the day. Where does it live in you?',
  },
  night: {
    0: 'Check in with your body as you prepare for rest.',
    1: 'Is your body restless or ready to release into sleep?',
    2: 'Is your body settling toward rest tonight?',
    3: 'Let go of the day. Notice what your body is still holding onto.',
  },
};

const MOODS = [
  { key: 'calm', label: 'Calm', icon: 'sun' as const },
  { key: 'anxious', label: 'Anxious', icon: 'cloud' as const },
  { key: 'happy', label: 'Happy', icon: 'smile' as const },
  { key: 'sad', label: 'Sad', icon: 'cloud-drizzle' as const },
  { key: 'energetic', label: 'Energetic', icon: 'zap' as const },
  { key: 'tired', label: 'Tired', icon: 'moon' as const },
  { key: 'focused', label: 'Focused', icon: 'target' as const },
  { key: 'scattered', label: 'Scattered', icon: 'wind' as const },
  { key: 'neutral', label: 'Neutral', icon: 'minus-circle' as const },
];

const SENSATIONS = [
  'tension', 'tingling', 'warmth', 'coolness', 'heaviness', 'lightness',
  'pulsing', 'numbness', 'butterflies', 'pressure', 'pain', 'relaxation',
];

const BODY_AREAS = [
  'head', 'neck', 'shoulders', 'chest', 'upper back', 'lower back',
  'stomach', 'arms', 'hands', 'hips', 'legs', 'feet',
];

const STEP_QUESTIONS: Record<number, string> = {
  0: 'How connected to your body do you feel right now?',
  1: 'What is your energy like right now?',
  2: 'How did you sleep last night?',
  3: 'How much stress is your body carrying right now?',
  4: 'Which word best captures your emotional weather right now?',
  5: 'What sensations are you noticing in your body?',
  6: 'Where in your body do you feel these sensations most?',
  7: 'Is there anything else your body is trying to tell you today?',
};

const TOTAL_STEPS = 8;

const CHECK_IN_BENEFITS = [
  'Personalises your exercises for today',
  'Helps you notice patterns over time',
  'Creates a record you can reflect on',
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            i < current ? styles.stepDotCompleted : i === current ? styles.stepDotActive : null,
          ]}
        />
      ))}
    </View>
  );
}

function ScaleSelector({
  value,
  onChange,
  leftLabel,
  rightLabel,
  color,
}: {
  value: number;
  onChange: (v: number) => void;
  leftLabel: string;
  rightLabel: string;
  color?: string;
}) {
  const activeColor = color || Colors.primary;
  return (
    <View style={styles.scaleContainer}>
      <View style={styles.scaleRow}>
        {Array.from({ length: 10 }, (_, i) => {
          const num = i + 1;
          const selected = num === value;
          return (
            <TouchableOpacity
              key={num}
              onPress={() => onChange(num)}
              style={[
                styles.scaleCircle,
                selected && [styles.scaleCircleSelected, { backgroundColor: activeColor, borderColor: activeColor }],
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.scaleNumber, selected && styles.scaleNumberSelected]}>
                {num}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.scaleLabels}>
        <Text style={styles.scaleLabelText}>{leftLabel}</Text>
        <Text style={styles.scaleLabelText}>{rightLabel}</Text>
      </View>
    </View>
  );
}

interface CheckinDiagnosis {
  state: string;
  heading: string;
  body: string;
  recommendedExerciseId: string;
  exerciseReason: string;
}

function getNervousSystemDiagnosis(
  awareness: number,
  energy: number,
  stress: number,
  mood: string,
  sleep: number,
): CheckinDiagnosis {
  if (stress >= 7 && sleep <= 4) {
    const ex = EXERCISES.find(e => e.category === 'breathing' && e.difficulty === 'beginner') ?? EXERCISES.find(e => e.category === 'breathing');
    return {
      state: 'High stress and low rest',
      heading: 'Today may need a gentler pace',
      body: 'Your check-in suggests high stress alongside low sleep. That combination can make ordinary sensations feel more demanding. A short, comfortable breathing practice gives you a structured way to pause and check what you need without forcing yourself to feel different.',
      recommendedExerciseId: ex?.id ?? '',
      exerciseReason: 'Try a short breathing practice as a simple anchor. Keep the pace comfortable and stop if focusing on your breath feels unpleasant.',
    };
  }
  if (stress >= 7 || mood === 'anxious' || mood === 'stressed') {
    const ex = EXERCISES.find(e => e.category === 'breathing');
    return {
      state: 'Elevated stress today',
      heading: 'Your body is carrying a lot today',
      body: 'High stress is information, not failure. A short pause can help you notice where that stress is showing up and choose a manageable next step. You do not need to make the feeling disappear for the check-in to be useful.',
      recommendedExerciseId: ex?.id ?? '',
      exerciseReason: 'This exercise gives you a guided way to follow your breath and notice whether the pace feels supportive today.',
    };
  }
  if (energy <= 3) {
    const ex = EXERCISES.find(e => e.category === 'bodyScanning' && e.difficulty === 'beginner') ?? EXERCISES.find(e => e.category === 'bodyScanning');
    return {
      state: 'Low energy today',
      heading: 'Your body is asking for rest',
      body: 'Low energy is useful information. A gentle body scan lets you check in without asking for a demanding response. You can notice heaviness, ease, or nothing in particular, then decide what would support you next.',
      recommendedExerciseId: ex?.id ?? '',
      exerciseReason: 'This is a low-effort way to notice sensations at your own pace. You can keep it brief or stop whenever you need to.',
    };
  }
  if (mood === 'sad' || mood === 'down') {
    const ex = EXERCISES.find(e => e.category === 'gut') ?? EXERCISES.find(e => e.category === 'movement');
    return {
      state: 'Low mood today',
      heading: 'Your body is carrying something heavy',
      body: 'Sadness can change how we experience energy, movement, and body sensations. A gentle practice can offer a moment of contact with what is present, without asking it to resolve your mood.',
      recommendedExerciseId: ex?.id ?? '',
      exerciseReason: 'This practice invites gentle attention to sensations in your abdomen. You can stay curious without needing to interpret what you notice.',
    };
  }
  if (awareness >= 7 && energy >= 6) {
    const ex = EXERCISES.find(e => e.category === 'heartbeat' && e.difficulty !== 'beginner') ?? EXERCISES.find(e => e.category === 'heartbeat');
    return {
      state: 'Ready to explore',
      heading: 'Your body is open and receptive today',
      body: 'Your ratings suggest you have attention and energy available today. If you are curious, this may be a good moment to explore a more focused practice while keeping your pace comfortable.',
      recommendedExerciseId: ex?.id ?? '',
      exerciseReason: 'Heartbeat practice asks you to notice a subtle internal rhythm. Treat it as an observation exercise, not a performance test.',
    };
  }
  const ex = EXERCISES.find(e => e.category === 'bodyScanning');
  return {
    state: 'A moment to notice',
    heading: 'Thank you for checking in with yourself',
    body: 'An ordinary day is useful information too. This check-in gives you a snapshot of sensations, energy, mood, and context that you can compare with later days.',
    recommendedExerciseId: ex?.id ?? '',
    exerciseReason: 'A body scan gives you a quiet opportunity to notice subtle sensations without needing to change them.',
  };
}

export default function CheckinScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);
  const { addCheckin, todayCheckedIn, checkins } = useApp();

  const [phase, setPhase] = useState<'intro' | 'steps' | 'submitted'>('intro');
  const [step, setStep] = useState(0);
  const [awareness, setAwareness] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [sleep, setSleep] = useState(5);
  const [stress, setStress] = useState(5);
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedSensations, setSelectedSensations] = useState<string[]>([]);
  const [selectedBodyAreas, setSelectedBodyAreas] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [showAlreadyCheckedIn, setShowAlreadyCheckedIn] = useState(true);
  const timeOfDay = getTimeOfDay();

  const todayCheckin = useMemo(() => {
    return checkins.find(c => isToday(parseISO(c.date)));
  }, [checkins]);

  const resetForm = () => {
    setPhase('intro');
    setStep(0);
    setAwareness(5);
    setEnergy(5);
    setSleep(5);
    setStress(5);
    setSelectedMood('');
    setSelectedSensations([]);
    setSelectedBodyAreas([]);
    setNotes('');
    setShowAlreadyCheckedIn(true);
  };

  const handleSubmit = async () => {
    const checkinData = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      awarenessScore: awareness,
      energyLevel: energy,
      sleepQuality: sleep,
      stressLevel: stress,
      mood: selectedMood,
      sensations: selectedSensations,
      bodyAreas: selectedBodyAreas,
      notes: notes,
    };
    await addCheckin(checkinData);
    setPhase('submitted');
    try {
      await apiPost('/api/checkins', checkinData);
    } catch (e) {
      console.error('Failed to sync check-in to server:', e);
    }
  };

  const toggleSensation = (s: string) => {
    setSelectedSensations(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const toggleBodyArea = (a: string) => {
    setSelectedBodyAreas(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    );
  };

  const canNext = () => {
    if (step === 4 && !selectedMood) return false;
    return true;
  };

  const getStepTitle = () => {
    const titles = [
      'Body Awareness',
      'Energy Level',
      'Sleep Quality',
      'Stress Level',
      'Current Mood',
      'Body Sensations',
      'Body Areas',
      'Additional Notes',
    ];
    return titles[step] || 'Check-In';
  };

  const getStepIcon = (): string => {
    const icons = ['activity', 'battery-charging', 'moon', 'alert-circle', 'smile', 'thermometer', 'user', 'edit-3'];
    return icons[step] || 'check';
  };

  const diagnosis = useMemo(() => getNervousSystemDiagnosis(awareness, energy, stress, selectedMood, sleep), [awareness, energy, stress, selectedMood, sleep]);
  const diagnosisExercise = useMemo(() => EXERCISES.find(e => e.id === diagnosis.recommendedExerciseId) ?? null, [diagnosis.recommendedExerciseId]);

  if (todayCheckedIn && showAlreadyCheckedIn && phase !== 'submitted') {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <ScrollView contentContainerStyle={styles.alreadyCheckedInContent} showsVerticalScrollIndicator={false}>
          <View style={styles.alreadyCheckedInCard}>
            <View style={styles.checkIconContainer}>
              <Feather name="check-circle" size={56} color={Colors.success} />
            </View>
            <Text style={styles.alreadyTitle}>You've already checked in today</Text>
            <Text style={styles.alreadySubtitle}>
              Your body's signals have been recorded. Your exercises are personalised for today.
            </Text>
            {todayCheckin && (
              <View style={styles.summaryCard}>
                <SummaryRow label="Awareness" value={`${todayCheckin.awarenessScore}/10`} />
                <SummaryRow label="Energy" value={`${todayCheckin.energyLevel}/10`} />
                <SummaryRow label="Sleep" value={`${todayCheckin.sleepQuality}/10`} />
                {todayCheckin.stressLevel !== undefined && (
                  <SummaryRow label="Stress" value={`${todayCheckin.stressLevel}/10`} />
                )}
                <SummaryRow label="Mood" value={todayCheckin.mood ? todayCheckin.mood.charAt(0).toUpperCase() + todayCheckin.mood.slice(1) : '-'} />
                {todayCheckin.sensations.length > 0 && (
                  <SummaryRow label="Sensations" value={todayCheckin.sensations.join(', ')} />
                )}
                {todayCheckin.bodyAreas && todayCheckin.bodyAreas.length > 0 && (
                  <SummaryRow label="Body Areas" value={todayCheckin.bodyAreas.join(', ')} />
                )}
                {todayCheckin.notes ? <SummaryRow label="Notes" value={todayCheckin.notes} /> : null}
              </View>
            )}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/(tabs)/exercises')}
              activeOpacity={0.8}
            >
              <Feather name="arrow-right" size={18} color={Colors.textInverse} />
              <Text style={styles.primaryButtonText}>See My Recommended Exercises</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.checkInAgainButton} onPress={() => setShowAlreadyCheckedIn(false)} activeOpacity={0.8}>
              <Feather name="refresh-cw" size={18} color={Colors.primary} />
              <Text style={styles.checkInAgainText}>Check In Again</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (phase === 'submitted') {
    const exCatInfo = diagnosisExercise ? CATEGORY_INFO[diagnosisExercise.category as keyof typeof CATEGORY_INFO] : null;
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <Animated.ScrollView entering={FadeIn.duration(400)} contentContainerStyle={styles.successScrollContent} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.successGradient}
          >
            <View style={styles.successIconWrap}>
              <Feather name="check" size={36} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>Check-in Complete</Text>
            <View style={styles.nsStatePill}>
              <Text style={styles.nsStatePillText}>{diagnosis.state.toUpperCase()}</Text>
            </View>
            <Text style={styles.successSubtitleGradient}>{diagnosis.heading}</Text>
          </LinearGradient>
          <View style={styles.successBody}>
            <View style={styles.successInsightCard}>
              <Feather name="activity" size={16} color={Colors.primary} style={{ marginTop: 2 }} />
              <Text style={styles.successInsightText}>{diagnosis.body}</Text>
            </View>

            {diagnosisExercise && (
              <View style={styles.diagnosisExCard}>
                <Text style={styles.diagnosisExLabel}>START HERE</Text>
                <View style={styles.diagnosisExTop}>
                  <View style={[styles.diagnosisExIcon, { backgroundColor: (exCatInfo?.color ?? Colors.primary) + '20' }]}>
                    <Feather name={diagnosisExercise.iconName as any} size={18} color={exCatInfo?.color ?? Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.diagnosisExTitle}>{diagnosisExercise.title}</Text>
                    <Text style={styles.diagnosisExMeta}>{diagnosisExercise.durationMinutes} min · {diagnosisExercise.difficulty.charAt(0).toUpperCase() + diagnosisExercise.difficulty.slice(1)}</Text>
                  </View>
                </View>
                <Text style={styles.diagnosisExReason}>{diagnosis.exerciseReason}</Text>
                <TouchableOpacity
                  style={styles.diagnosisExBtn}
                  onPress={() => router.push(`/exercise/${diagnosisExercise.id}` as any)}
                  activeOpacity={0.85}
                >
                  <Feather name="play" size={14} color="#fff" />
                  <Text style={styles.diagnosisExBtnText}>Begin This Exercise</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.summaryCard}>
              <SummaryRow label="Awareness" value={`${awareness}/10`} />
              <SummaryRow label="Energy" value={`${energy}/10`} />
              <SummaryRow label="Sleep" value={`${sleep}/10`} />
              <SummaryRow label="Stress" value={`${stress}/10`} />
              <SummaryRow label="Mood" value={selectedMood ? selectedMood.charAt(0).toUpperCase() + selectedMood.slice(1) : '-'} />
              {selectedSensations.length > 0 && <SummaryRow label="Sensations" value={selectedSensations.join(', ')} />}
              {selectedBodyAreas.length > 0 && <SummaryRow label="Body Areas" value={selectedBodyAreas.join(', ')} />}
              {notes ? <SummaryRow label="Notes" value={notes} /> : null}
            </View>
            <TouchableOpacity style={[styles.checkInAgainButton, { marginTop: 4 }]} onPress={resetForm} activeOpacity={0.8}>
              <Text style={styles.checkInAgainText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Animated.ScrollView>
      </View>
    );
  }

  if (phase === 'intro') {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <ScrollView contentContainerStyle={styles.introScrollContent} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={[Colors.primary, '#8B5CF6', Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.introGradient}
          >
            <View style={styles.introBadge}>
              <Feather name="activity" size={16} color="rgba(255,255,255,0.9)" />
              <Text style={styles.introBadgeText}>3 minutes</Text>
            </View>
            <Text style={styles.introTitle}>Daily Body Check-In</Text>
            <Text style={styles.introSubtitle}>
              Tuning into your body each day gives you a clearer record of sensations, energy, and mood.
            </Text>
            <View style={styles.introBenefitsList}>
              {CHECK_IN_BENEFITS.map((b, i) => (
                <View key={i} style={styles.introBenefitRow}>
                  <View style={styles.introBenefitIcon}>
                    <Feather name="check" size={12} color={Colors.primary} />
                  </View>
                  <Text style={styles.introBenefitText}>{b}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
          <View style={styles.introBottomContent}>
            <Text style={styles.introStepsPreview}>8 quick questions about how your body feels right now</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setPhase('steps')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Begin Check-In →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Check-In</Text>
        <GetHelpLink />
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <StepIndicator current={step} total={TOTAL_STEPS} />
        <Text style={styles.stepCountText}>Step {step + 1} of {TOTAL_STEPS}</Text>

        <View style={styles.stepHeader}>
          <View style={styles.stepIconWrap}>
            <Feather name={getStepIcon() as any} size={18} color={Colors.primary} />
          </View>
          <Text style={styles.stepHeaderLabel}>{getStepTitle()}</Text>
        </View>

        {step === 0 && (
          <Animated.View entering={FadeIn.duration(250)} style={styles.stepContent}>
            <Text style={styles.stepQuestion}>{STEP_QUESTIONS[0]}</Text>
            <Text style={styles.stepHint}>{TIME_HINTS[timeOfDay][0] || 'Interoceptive awareness is your ability to sense your heartbeat, breathing, and inner tensions.'}</Text>
            <ScaleSelector value={awareness} onChange={setAwareness} leftLabel="Disconnected" rightLabel="Fully Aware" />
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View entering={FadeIn.duration(250)} style={styles.stepContent}>
            <Text style={styles.stepQuestion}>{STEP_QUESTIONS[1]}</Text>
            <Text style={styles.stepHint}>{TIME_HINTS[timeOfDay][1] || 'Notice how energy manifests physically: heaviness in limbs, mental alertness, desire to move or rest.'}</Text>
            <ScaleSelector value={energy} onChange={setEnergy} leftLabel="Depleted" rightLabel="Energised" color={Colors.secondary} />
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeIn.duration(250)} style={styles.stepContent}>
            <Text style={styles.stepQuestion}>{STEP_QUESTIONS[2]}</Text>
            <Text style={styles.stepHint}>{TIME_HINTS[timeOfDay][2] || 'Notice how the quality of your sleep may be showing up in your energy and body sensations today.'}</Text>
            <ScaleSelector value={sleep} onChange={setSleep} leftLabel="Very Poor" rightLabel="Excellent" color="#5A6FB5" />
          </Animated.View>
        )}

        {step === 3 && (
          <Animated.View entering={FadeIn.duration(250)} style={styles.stepContent}>
            <Text style={styles.stepQuestion}>{STEP_QUESTIONS[3]}</Text>
            <Text style={styles.stepHint}>{TIME_HINTS[timeOfDay][3] || 'Stress can show up in physical cues such as jaw tension, changes in breathing, or tight shoulders.'}</Text>
            <ScaleSelector value={stress} onChange={setStress} leftLabel="Very Calm" rightLabel="Very Stressed" color="#E07A5F" />
          </Animated.View>
        )}

        {step === 4 && (
          <Animated.View entering={FadeIn.duration(250)} style={styles.stepContent}>
            <Text style={styles.stepQuestion}>{STEP_QUESTIONS[4]}</Text>
            <View style={styles.moodGrid}>
              {MOODS.map(mood => {
                const isSelected = selectedMood === mood.key;
                return (
                  <TouchableOpacity
                    key={mood.key}
                    style={[styles.moodCard, isSelected && styles.moodCardSelected]}
                    onPress={() => setSelectedMood(mood.key)}
                    activeOpacity={0.7}
                  >
                    <Feather name={mood.icon} size={24} color={isSelected ? Colors.primary : Colors.textSecondary} />
                    <Text style={[styles.moodLabel, isSelected && styles.moodLabelSelected]}>{mood.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}

        {step === 5 && (
          <Animated.View entering={FadeIn.duration(250)} style={styles.stepContent}>
            <Text style={styles.stepQuestion}>{STEP_QUESTIONS[5]}</Text>
            <Text style={styles.stepHint}>Select all that apply. Building sensation vocabulary is a core interoceptive skill. There are no wrong answers.</Text>
            <View style={styles.sensationContainer}>
              {SENSATIONS.map(s => {
                const isSelected = selectedSensations.includes(s);
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.sensationChip, isSelected && styles.sensationChipSelected]}
                    onPress={() => toggleSensation(s)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.sensationText, isSelected && styles.sensationTextSelected]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}

        {step === 6 && (
          <Animated.View entering={FadeIn.duration(250)} style={styles.stepContent}>
            <Text style={styles.stepQuestion}>{STEP_QUESTIONS[6]}</Text>
            <Text style={styles.stepHint}>Mapping sensations to body regions can make them easier to describe. Select anywhere you notice something.</Text>
            <View style={styles.sensationContainer}>
              {BODY_AREAS.map(a => {
                const isSelected = selectedBodyAreas.includes(a);
                return (
                  <TouchableOpacity
                    key={a}
                    style={[styles.sensationChip, isSelected && styles.bodyAreaChipSelected]}
                    onPress={() => toggleBodyArea(a)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.sensationText, isSelected && styles.bodyAreaTextSelected]}>
                      {a.charAt(0).toUpperCase() + a.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}

        {step === 7 && (
          <Animated.View entering={FadeIn.duration(250)} style={styles.stepContent}>
            <Text style={styles.stepQuestion}>{STEP_QUESTIONS[7]}</Text>
            <Text style={styles.stepHint}>Record any patterns, triggers, or observations. This is just for you.</Text>
            <TextInput
              style={styles.notesInput}
              multiline
              numberOfLines={4}
              placeholder="Write anything you would like to notice or remember..."
              placeholderTextColor={Colors.textTertiary}
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
            />
          </Animated.View>
        )}

        <View style={styles.buttonRow}>
          {step > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={() => setStep(s => s - 1)} activeOpacity={0.8}>
              <Feather name="arrow-left" size={18} color={Colors.primary} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          {step < TOTAL_STEPS - 1 ? (
            <TouchableOpacity
              style={[styles.primaryButton, !canNext() && styles.primaryButtonDisabled]}
              onPress={() => canNext() && setStep(s => s + 1)}
              activeOpacity={0.8}
              disabled={!canNext()}
            >
              <Text style={styles.primaryButtonText}>Next</Text>
              <Feather name="arrow-right" size={18} color={Colors.textInverse} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} activeOpacity={0.8}>
              <Text style={styles.primaryButtonText}>Complete</Text>
              <Feather name="check" size={18} color={Colors.textInverse} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(32, (SCREEN_WIDTH - 80) / 10 - 4);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  topBarTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 22, color: Colors.text, letterSpacing: -0.3 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  introScrollContent: { flexGrow: 1 },
  introGradient: { paddingHorizontal: 28, paddingTop: 48, paddingBottom: 40 },
  introBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 20 },
  introBadgeText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  introTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 30, color: '#FFFFFF', marginBottom: 12, lineHeight: 38 },
  introSubtitle: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: 'rgba(255,255,255,0.85)', lineHeight: 24, marginBottom: 28 },
  introBenefitsList: { gap: 12 },
  introBenefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  introBenefitIcon: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  introBenefitText: { fontFamily: 'Nunito_500Medium', fontSize: 15, color: 'rgba(255,255,255,0.9)', flex: 1, lineHeight: 22 },
  introBottomContent: { padding: 28, gap: 20 },
  introStepsPreview: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },

  stepCountText: { fontFamily: 'Nunito_500Medium', fontSize: 13, color: Colors.textTertiary, textAlign: 'center', marginBottom: 4 },
  stepIndicator: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 16, marginBottom: 4 },
  stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  stepDotActive: { backgroundColor: Colors.primary, width: 20, borderRadius: 3 },
  stepDotCompleted: { backgroundColor: Colors.primaryLight },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, marginBottom: 4 },
  stepIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  stepHeaderLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 22, color: Colors.text, letterSpacing: -0.3 },
  stepContent: { marginTop: 8 },
  stepQuestion: { fontSize: 17, fontFamily: 'Nunito_700Bold', color: Colors.text, marginBottom: 8, lineHeight: 25 },
  stepHint: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: Colors.textTertiary, marginBottom: 24, lineHeight: 19 },
  scaleContainer: { marginTop: 8 },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  scaleCircle: {
    width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface,
  },
  scaleCircleSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  scaleNumber: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: Colors.textSecondary },
  scaleNumberSelected: { color: Colors.textInverse },
  scaleLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 4 },
  scaleLabelText: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: Colors.textTertiary },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moodCard: {
    width: (SCREEN_WIDTH - 48 - 24) / 3, backgroundColor: Colors.surface, borderRadius: 16,
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.border,
  },
  moodCardSelected: { borderColor: Colors.primary, backgroundColor: '#F5F2FA' },
  moodLabel: { fontSize: 13, fontFamily: 'Nunito_500Medium', color: Colors.textSecondary, marginTop: 8 },
  moodLabelSelected: { color: Colors.primary, fontFamily: 'Nunito_600SemiBold' },
  sensationContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sensationChip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
  },
  sensationChipSelected: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  sensationText: { fontSize: 14, fontFamily: 'Nunito_500Medium', color: Colors.textSecondary },
  sensationTextSelected: { color: Colors.textInverse, fontFamily: 'Nunito_600SemiBold' },
  bodyAreaChipSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  bodyAreaTextSelected: { color: '#6B3A3E', fontFamily: 'Nunito_600SemiBold' },
  notesInput: {
    backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border,
    padding: 16, fontSize: 15, fontFamily: 'Nunito_400Regular', color: Colors.text, minHeight: 120, textAlignVertical: 'top',
  },
  buttonRow: { flexDirection: 'row', alignItems: 'center', marginTop: 40, gap: 12 },
  backButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 14, paddingHorizontal: 20, borderRadius: 16,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
  },
  backButtonText: { fontSize: 15, fontFamily: 'Nunito_600SemiBold', color: Colors.primary },
  primaryButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 28, borderRadius: 16, backgroundColor: Colors.primary,
  },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: Colors.textInverse },
  alreadyCheckedInContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  alreadyCheckedInCard: { alignItems: 'center' },
  checkIconContainer: { marginBottom: 20, width: 96, height: 96, borderRadius: 48, backgroundColor: '#F0F9EC', alignItems: 'center', justifyContent: 'center' },
  alreadyTitle: { fontSize: 26, fontFamily: 'Nunito_800ExtraBold', color: Colors.text, marginBottom: 8, textAlign: 'center', letterSpacing: -0.5 },
  alreadySubtitle: { fontSize: 15, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22, paddingHorizontal: 16 },
  checkInAgainButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 28, borderRadius: 16,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary, marginTop: 16,
  },
  checkInAgainText: { fontSize: 15, fontFamily: 'Nunito_600SemiBold', color: Colors.primary },

  successScrollContent: { flexGrow: 1 },
  successGradient: { paddingHorizontal: 28, paddingTop: 40, paddingBottom: 36, alignItems: 'center' },
  successIconWrap: { marginBottom: 20, width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 28, fontFamily: 'Nunito_800ExtraBold', color: '#FFFFFF', marginBottom: 10, textAlign: 'center', letterSpacing: -0.5 },
  successSubtitleGradient: { fontSize: 16, fontFamily: 'Nunito_500Medium', color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 24, paddingHorizontal: 8 },
  nsStatePill: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 10 },
  nsStatePillText: { fontFamily: 'Nunito_700Bold', fontSize: 11, color: '#fff', letterSpacing: 1.2 },
  successBody: { padding: 24 },
  successInsightCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: Colors.primary + '10', borderRadius: 14, padding: 16, marginBottom: 20 },
  successInsightText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text, flex: 1, lineHeight: 22 },
  diagnosisExCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: Colors.borderLight, gap: 12 },
  diagnosisExLabel: { fontFamily: 'Nunito_700Bold', fontSize: 11, color: Colors.primary, letterSpacing: 1.2, marginBottom: -4 },
  diagnosisExTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  diagnosisExIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  diagnosisExTitle: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.text },
  diagnosisExMeta: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  diagnosisExReason: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 20, paddingHorizontal: 2 },
  diagnosisExBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: Colors.primary, borderRadius: 24, paddingVertical: 12 },
  diagnosisExBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#fff' },

  summaryCard: {
    width: '100%', backgroundColor: Colors.surface, borderRadius: 16, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  summaryLabel: { fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: Colors.textSecondary, flex: 1 },
  summaryValue: { fontSize: 14, fontFamily: 'Nunito_500Medium', color: Colors.text, flex: 2, textAlign: 'right' },
});
