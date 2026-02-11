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
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { isToday, parseISO } from 'date-fns';

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

const TOTAL_STEPS = 6;

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
}: {
  value: number;
  onChange: (v: number) => void;
  leftLabel: string;
  rightLabel: string;
}) {
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
                selected && styles.scaleCircleSelected,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.scaleNumber,
                  selected && styles.scaleNumberSelected,
                ]}
              >
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
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedSensations, setSelectedSensations] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showAlreadyCheckedIn, setShowAlreadyCheckedIn] = useState(true);

  const todayCheckin = useMemo(() => {
    return checkins.find(c => isToday(parseISO(c.date)));
  }, [checkins]);

  const resetForm = () => {
    setStep(0);
    setAwareness(5);
    setEnergy(5);
    setSleep(5);
    setSelectedMood('');
    setSelectedSensations([]);
    setNotes('');
    setSubmitted(false);
    setShowAlreadyCheckedIn(true);
  };

  const handleSubmit = async () => {
    await addCheckin({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      awarenessScore: awareness,
      energyLevel: energy,
      sleepQuality: sleep,
      mood: selectedMood,
      sensations: selectedSensations,
      notes: notes,
    });
    setSubmitted(true);
  };

  const toggleSensation = (s: string) => {
    setSelectedSensations(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const canNext = () => {
    if (step === 3 && !selectedMood) return false;
    return true;
  };

  if (todayCheckedIn && showAlreadyCheckedIn && !submitted) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <ScrollView
          contentContainerStyle={styles.alreadyCheckedInContent}
          showsVerticalScrollIndicator={false}
        >
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
                <SummaryRow label="Mood" value={todayCheckin.mood ? todayCheckin.mood.charAt(0).toUpperCase() + todayCheckin.mood.slice(1) : '-'} />
                {todayCheckin.sensations.length > 0 && (
                  <SummaryRow label="Sensations" value={todayCheckin.sensations.join(', ')} />
                )}
                {todayCheckin.notes ? (
                  <SummaryRow label="Notes" value={todayCheckin.notes} />
                ) : null}
              </View>
            )}

            <TouchableOpacity
              style={styles.checkInAgainButton}
              onPress={() => setShowAlreadyCheckedIn(false)}
              activeOpacity={0.8}
            >
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
          <Text style={styles.successSubtitle}>Your daily check-in has been recorded.</Text>

          <View style={styles.summaryCard}>
            <SummaryRow label="Awareness" value={`${awareness}/10`} />
            <SummaryRow label="Energy" value={`${energy}/10`} />
            <SummaryRow label="Sleep" value={`${sleep}/10`} />
            <SummaryRow label="Mood" value={selectedMood ? selectedMood.charAt(0).toUpperCase() + selectedMood.slice(1) : '-'} />
            {selectedSensations.length > 0 && (
              <SummaryRow label="Sensations" value={selectedSensations.join(', ')} />
            )}
            {notes ? <SummaryRow label="Notes" value={notes} /> : null}
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={resetForm}
            activeOpacity={0.8}
          >
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
        <StepIndicator current={step} total={TOTAL_STEPS} />

        {step === 0 && (
          <View style={styles.stepContent}>
            <Text style={styles.mainTitle}>Daily Check-In</Text>
            <Text style={styles.stepQuestion}>
              How connected to your body do you feel right now?
            </Text>
            <ScaleSelector
              value={awareness}
              onChange={setAwareness}
              leftLabel="Disconnected"
              rightLabel="Fully Aware"
            />
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.mainTitle}>Daily Check-In</Text>
            <Text style={styles.stepQuestion}>What is your energy level?</Text>
            <ScaleSelector
              value={energy}
              onChange={setEnergy}
              leftLabel="Depleted"
              rightLabel="Energized"
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.mainTitle}>Daily Check-In</Text>
            <Text style={styles.stepQuestion}>How was your sleep?</Text>
            <ScaleSelector
              value={sleep}
              onChange={setSleep}
              leftLabel="Very Poor"
              rightLabel="Excellent"
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.mainTitle}>Daily Check-In</Text>
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
                    <Feather
                      name={mood.icon}
                      size={24}
                      color={isSelected ? Colors.primary : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.moodLabel,
                        isSelected && styles.moodLabelSelected,
                      ]}
                    >
                      {mood.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={styles.mainTitle}>Daily Check-In</Text>
            <Text style={styles.stepQuestion}>What sensations are you noticing?</Text>
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
                    <Text
                      style={[
                        styles.sensationText,
                        isSelected && styles.sensationTextSelected,
                      ]}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {step === 5 && (
          <View style={styles.stepContent}>
            <Text style={styles.mainTitle}>Daily Check-In</Text>
            <Text style={styles.stepQuestion}>Any additional notes?</Text>
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
          </View>
        )}

        <View style={styles.buttonRow}>
          {step > 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep(s => s - 1)}
              activeOpacity={0.8}
            >
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
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    marginBottom: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    width: 24,
    borderRadius: 4,
  },
  stepDotCompleted: {
    backgroundColor: Colors.primaryLight,
  },
  stepContent: {
    marginTop: 16,
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
    marginBottom: 8,
  },
  stepQuestion: {
    fontSize: 17,
    fontFamily: 'Nunito_500Medium',
    color: Colors.textSecondary,
    marginBottom: 32,
    lineHeight: 24,
  },
  scaleContainer: {
    marginTop: 8,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  scaleCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  scaleCircleSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  scaleNumber: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.textSecondary,
  },
  scaleNumberSelected: {
    color: Colors.textInverse,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  scaleLabelText: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textTertiary,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moodCard: {
    width: (SCREEN_WIDTH - 48 - 24) / 3,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  moodCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F5F2FA',
  },
  moodLabel: {
    fontSize: 13,
    fontFamily: 'Nunito_500Medium',
    color: Colors.textSecondary,
    marginTop: 8,
  },
  moodLabelSelected: {
    color: Colors.primary,
    fontFamily: 'Nunito_600SemiBold',
  },
  sensationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sensationChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  sensationChipSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  sensationText: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: Colors.textSecondary,
  },
  sensationTextSelected: {
    color: Colors.textInverse,
    fontFamily: 'Nunito_600SemiBold',
  },
  notesInput: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: Colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  backButtonText: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.primary,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    backgroundColor: Colors.primary,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textInverse,
  },
  alreadyCheckedInContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  alreadyCheckedInCard: {
    alignItems: 'center',
  },
  checkIconContainer: {
    marginBottom: 20,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0F9EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alreadyTitle: {
    fontSize: 24,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  alreadySubtitle: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  checkInAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginTop: 16,
  },
  checkInAgainText: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.primary,
  },
  successContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  successIconWrap: {
    marginBottom: 20,
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#F0F9EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 26,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textSecondary,
    marginBottom: 28,
    textAlign: 'center',
  },
  summaryCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.textSecondary,
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: Colors.text,
    flex: 2,
    textAlign: 'right',
  },
});
