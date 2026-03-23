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

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour <= 11) return 'morning';
  if (hour >= 12 && hour <= 16) return 'afternoon';
  if (hour >= 17 && hour <= 21) return 'evening';
  return 'night';
}

const TIME_GREETINGS: Record<TimeOfDay, { greeting: string; icon: string; subtitle: string }> = {
  morning: { greeting: 'Good Morning', icon: 'sun', subtitle: 'Start your day with awareness' },
  afternoon: { greeting: 'Good Afternoon', icon: 'cloud', subtitle: 'Take a midday body check' },
  evening: { greeting: 'Good Evening', icon: 'sunset', subtitle: 'Reflect on your body\'s signals today' },
  night: { greeting: 'Good Night', icon: 'moon', subtitle: 'How is your body winding down?' },
};

const TIME_HINTS: Record<TimeOfDay, Record<number, string>> = {
  morning: {
    0: 'How connected to your body do you feel after waking up?',
    1: 'How do you feel after waking up? Notice your body\'s natural energy.',
    2: 'Reflect on last night\'s rest and how it affects your body now.',
    3: 'Starting the day calm? Notice any anticipatory tension.',
  },
  afternoon: {
    0: 'Pause and reconnect with your body at midday.',
    1: 'How has your energy shifted since the morning?',
    2: 'Is last night\'s sleep still affecting your afternoon?',
    3: 'Has stress built up through the morning?',
  },
  evening: {
    0: 'Wind down and tune into your body after a full day.',
    1: 'How much energy do you have left at the end of the day?',
    2: 'How is your body recovering from last night\'s sleep?',
    3: 'How has stress accumulated through the day?',
  },
  night: {
    0: 'Check in with your body as you prepare for rest.',
    1: 'How depleted or restless does your body feel right now?',
    2: 'Are you feeling ready for sleep tonight?',
    3: 'Let go of the day\'s tension. Notice what remains.',
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

const TOTAL_STEPS = 8;

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

export default function CheckinScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const { addCheckin, todayCheckedIn, checkins } = useApp();

  const [step, setStep] = useState(0);
  const [awareness, setAwareness] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [sleep, setSleep] = useState(5);
  const [stress, setStress] = useState(5);
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedSensations, setSelectedSensations] = useState<string[]>([]);
  const [selectedBodyAreas, setSelectedBodyAreas] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showAlreadyCheckedIn, setShowAlreadyCheckedIn] = useState(true);
  const timeOfDay = getTimeOfDay();
  const greetingData = TIME_GREETINGS[timeOfDay];

  const todayCheckin = useMemo(() => {
    return checkins.find(c => isToday(parseISO(c.date)));
  }, [checkins]);

  const resetForm = () => {
    setStep(0);
    setAwareness(5);
    setEnergy(5);
    setSleep(5);
    setStress(5);
    setSelectedMood('');
    setSelectedSensations([]);
    setSelectedBodyAreas([]);
    setNotes('');
    setSubmitted(false);
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
    setSubmitted(true);
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

  if (todayCheckedIn && showAlreadyCheckedIn && !submitted) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <ScrollView contentContainerStyle={styles.alreadyCheckedInContent} showsVerticalScrollIndicator={false}>
          <View style={styles.alreadyCheckedInCard}>
            <View style={styles.checkIconContainer}>
              <Feather name="check-circle" size={56} color={Colors.success} />
            </View>
            <Text style={styles.alreadyTitle}>Already Checked In Today</Text>
            <Text style={styles.alreadySubtitle}>
              You have already completed your daily check-in. Here is a summary:
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
            <TouchableOpacity style={styles.checkInAgainButton} onPress={() => setShowAlreadyCheckedIn(false)} activeOpacity={0.8}>
              <Feather name="refresh-cw" size={18} color={Colors.primary} />
              <Text style={styles.checkInAgainText}>Check In Again</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (submitted) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.successContainer}>
          <View style={styles.successIconWrap}>
            <Feather name="check-circle" size={64} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Check-in Complete</Text>
          <Text style={styles.successSubtitle}>Your daily check-in has been recorded. This data helps personalize your recommendations.</Text>
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
          <TouchableOpacity style={styles.primaryButton} onPress={resetForm} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.greetingGradient}
        >
          <Feather name={greetingData.icon as any} size={28} color={Colors.textInverse} />
          <Text style={styles.greetingText}>{greetingData.greeting}</Text>
          <Text style={styles.greetingSubtitle}>{greetingData.subtitle}</Text>
        </LinearGradient>

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
            <Text style={styles.stepQuestion}>{TIME_HINTS[timeOfDay][0] || 'How connected to your body do you feel right now?'}</Text>
            <Text style={styles.stepHint}>Interoceptive awareness is your ability to sense internal body signals like heartbeat, breathing, and tension.</Text>
            <ScaleSelector value={awareness} onChange={setAwareness} leftLabel="Disconnected" rightLabel="Fully Aware" />
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View entering={FadeIn.duration(250)} style={styles.stepContent}>
            <Text style={styles.stepQuestion}>What is your energy level?</Text>
            <Text style={styles.stepHint}>{TIME_HINTS[timeOfDay][1] || 'Notice how energy manifests physically - heaviness in limbs, alertness, desire to move.'}</Text>
            <ScaleSelector value={energy} onChange={setEnergy} leftLabel="Depleted" rightLabel="Energized" color={Colors.secondary} />
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeIn.duration(250)} style={styles.stepContent}>
            <Text style={styles.stepQuestion}>How was your sleep?</Text>
            <Text style={styles.stepHint}>{TIME_HINTS[timeOfDay][2] || 'Sleep quality directly impacts interoceptive sensitivity and emotional regulation.'}</Text>
            <ScaleSelector value={sleep} onChange={setSleep} leftLabel="Very Poor" rightLabel="Excellent" color="#5A6FB5" />
          </Animated.View>
        )}

        {step === 3 && (
          <Animated.View entering={FadeIn.duration(250)} style={styles.stepContent}>
            <Text style={styles.stepQuestion}>What is your current stress level?</Text>
            <Text style={styles.stepHint}>{TIME_HINTS[timeOfDay][3] || 'Stress activates the autonomic nervous system. Notice physical cues: jaw tension, shallow breathing, elevated heart rate.'}</Text>
            <ScaleSelector value={stress} onChange={setStress} leftLabel="Very Calm" rightLabel="Very Stressed" color="#E07A5F" />
          </Animated.View>
        )}

        {step === 4 && (
          <Animated.View entering={FadeIn.duration(250)} style={styles.stepContent}>
            <Text style={styles.stepQuestion}>What best describes your mood?</Text>
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
            <Text style={styles.stepQuestion}>What sensations are you noticing?</Text>
            <Text style={styles.stepHint}>Select all that apply. Building awareness of sensations is a core interoceptive skill.</Text>
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
            <Text style={styles.stepQuestion}>Where in your body do you notice these sensations?</Text>
            <Text style={styles.stepHint}>Mapping sensations to body regions improves interoceptive accuracy over time.</Text>
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
            <Text style={styles.stepQuestion}>Any additional notes?</Text>
            <Text style={styles.stepHint}>Record patterns, triggers, or anything noteworthy about your body awareness today.</Text>
            <TextInput
              style={styles.notesInput}
              multiline
              numberOfLines={4}
              placeholder="Write anything you would like to note..."
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
              <Text style={styles.primaryButtonText}>Submit</Text>
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
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  greetingGradient: {
    borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 8, marginTop: 8,
  },
  greetingText: {
    fontFamily: 'Nunito_700Bold', fontSize: 22, color: Colors.textInverse, marginTop: 8,
  },
  greetingSubtitle: {
    fontFamily: 'Nunito_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4,
  },
  stepCountText: {
    fontFamily: 'Nunito_500Medium', fontSize: 13, color: Colors.textTertiary, textAlign: 'center', marginBottom: 4,
  },
  stepIndicator: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 16, marginBottom: 4 },
  stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  stepDotActive: { backgroundColor: Colors.primary, width: 20, borderRadius: 3 },
  stepDotCompleted: { backgroundColor: Colors.primaryLight },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, marginBottom: 4 },
  stepIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  stepHeaderLabel: { fontFamily: 'Nunito_700Bold', fontSize: 20, color: Colors.text },
  stepContent: { marginTop: 8 },
  stepQuestion: { fontSize: 16, fontFamily: 'Nunito_600SemiBold', color: Colors.text, marginBottom: 8, lineHeight: 24 },
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
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 28, borderRadius: 16, backgroundColor: Colors.primary,
  },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: Colors.textInverse },
  alreadyCheckedInContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  alreadyCheckedInCard: { alignItems: 'center' },
  checkIconContainer: { marginBottom: 20, width: 96, height: 96, borderRadius: 48, backgroundColor: '#F0F9EC', alignItems: 'center', justifyContent: 'center' },
  alreadyTitle: { fontSize: 24, fontFamily: 'Nunito_700Bold', color: Colors.text, marginBottom: 8, textAlign: 'center' },
  alreadySubtitle: { fontSize: 15, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22, paddingHorizontal: 16 },
  checkInAgainButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 28, borderRadius: 16,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary, marginTop: 16,
  },
  checkInAgainText: { fontSize: 15, fontFamily: 'Nunito_600SemiBold', color: Colors.primary },
  successContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 40, alignItems: 'center' },
  successIconWrap: { marginBottom: 20, width: 104, height: 104, borderRadius: 52, backgroundColor: '#F0F9EC', alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 26, fontFamily: 'Nunito_700Bold', color: Colors.text, marginBottom: 8 },
  successSubtitle: { fontSize: 15, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary, marginBottom: 28, textAlign: 'center', lineHeight: 22 },
  summaryCard: {
    width: '100%', backgroundColor: Colors.surface, borderRadius: 16, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  summaryLabel: { fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: Colors.textSecondary, flex: 1 },
  summaryValue: { fontSize: 14, fontFamily: 'Nunito_500Medium', color: Colors.text, flex: 2, textAlign: 'right' },
});
