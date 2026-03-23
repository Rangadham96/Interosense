import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Dimensions,
  Linking,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
  FadeIn,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FASTEST_EXERCISES = [
  {
    id: 'box_breathing',
    title: 'Box Breathing',
    scienceNote: 'Used by Navy SEALs to control stress. Activates the parasympathetic nervous system within 90 seconds.',
    icon: 'square' as const,
    color: '#88B3B5',
    duration: '4 min',
    steps: [
      { phase: 'Breathe In', duration: 4000, instruction: 'Slowly inhale through your nose' },
      { phase: 'Hold', duration: 4000, instruction: 'Gently hold your breath' },
      { phase: 'Breathe Out', duration: 4000, instruction: 'Slowly exhale through your mouth' },
      { phase: 'Hold', duration: 4000, instruction: 'Rest before next breath' },
    ],
  },
  {
    id: 'grounding',
    title: 'Grounding 5-4-3-2-1',
    scienceNote: 'Sensory grounding interrupts rumination loops and anchors awareness to the present via the prefrontal cortex.',
    icon: 'eye' as const,
    color: '#6B5B95',
    duration: '3 min',
  },
  {
    id: 'pmr',
    title: 'Muscle Relaxation',
    scienceNote: 'Progressive Muscle Relaxation lowers cortisol and reduces physiological tension by 30-40% in clinical studies.',
    icon: 'zap' as const,
    color: '#F0C05A',
    duration: '5 min',
    bodyParts: [
      { name: 'Hands', instruction: 'Make tight fists, hold 5 seconds, then release' },
      { name: 'Arms', instruction: 'Flex your biceps tightly, hold, then let go' },
      { name: 'Shoulders', instruction: 'Raise shoulders to ears, hold, then drop' },
      { name: 'Face', instruction: 'Scrunch your face tightly, hold, then relax' },
      { name: 'Chest', instruction: 'Take a deep breath, hold, then exhale slowly' },
      { name: 'Stomach', instruction: 'Tighten your abs, hold, then release' },
      { name: 'Legs', instruction: 'Press your thighs together, hold, then relax' },
      { name: 'Feet', instruction: 'Curl your toes tightly, hold, then release' },
    ],
  },
];

const GROUNDING_STEPS = [
  { count: 5, sense: 'SEE', prompt: 'Name 5 things you can see right now', icon: 'eye' as const, color: '#6B5B95' },
  { count: 4, sense: 'TOUCH', prompt: 'Notice 4 things you can physically feel', icon: 'edit-3' as const, color: '#88B3B5' },
  { count: 3, sense: 'HEAR', prompt: 'Listen for 3 sounds around you', icon: 'headphones' as const, color: '#E8B4B8' },
  { count: 2, sense: 'SMELL', prompt: 'Identify 2 scents nearby', icon: 'wind' as const, color: '#7FB069' },
  { count: 1, sense: 'TASTE', prompt: 'Notice 1 taste in your mouth', icon: 'coffee' as const, color: '#F0C05A' },
];

const CONDITION_COPING: Record<string, { title: string; techniques: string[] }> = {
  anxiety: {
    title: 'For Anxiety',
    techniques: [
      'Name the anxiety: "I notice I am feeling anxious"',
      'Place one hand on your chest and breathe slowly',
      'Ask: Will this matter in 5 years?',
      'Ground with the 5-4-3-2-1 technique',
      'Move your body - even a short walk helps',
    ],
  },
  depression: {
    title: 'For Low Mood',
    techniques: [
      'This feeling is temporary, not permanent',
      'Do one small act of self-care right now',
      'Reach out to one person, even with a text',
      'Step outside, even briefly - light exposure helps',
      'Acknowledge that getting through today is enough',
    ],
  },
  ptsd: {
    title: 'For Trauma Response',
    techniques: [
      'You are safe right now. This is a memory, not happening now',
      'Feel your feet on the ground - notice the pressure',
      'Name 3 ways you know you are in the present',
      'Use the butterfly hug for bilateral stimulation',
      'Speak to yourself gently, as you would a friend',
    ],
  },
  'chronic-pain': {
    title: 'For Pain Flares',
    techniques: [
      'Pain is a signal, not a sentence. Acknowledge it without judgment',
      'Use gentle breathing to create space around the pain',
      'Apply heat or cold to the affected area',
      'Progressive muscle relaxation can ease surrounding tension',
      'Distraction with sensory input can modulate pain perception',
    ],
  },
  ibs: {
    title: 'For Digestive Distress',
    techniques: [
      'Place a warm hand on your abdomen and breathe',
      'Gentle abdominal massage in clockwise circles',
      'Diaphragmatic breathing calms the gut-brain axis',
      'Sip warm water slowly',
      'Progressive relaxation targets digestive tension',
    ],
  },
  adhd: {
    title: 'For Overwhelm',
    techniques: [
      'Write down everything in your head - externalize it',
      'Pick just ONE thing from the list',
      'Set a 5-minute timer - you only need 5 minutes',
      'Movement breaks reset your focus',
      'Cold water on wrists can improve alertness',
    ],
  },
  autism: {
    title: 'For Sensory Overload',
    techniques: [
      'Remove yourself from the overwhelming environment if possible',
      'Reduce sensory input: dim lights, reduce sounds',
      'Deep pressure stimulation - wrap yourself tightly',
      'Focus on one calming sensory input you enjoy',
      'Give yourself permission to take as long as you need',
    ],
  },
};

function BreathingExercise({ technique, onClose }: { technique: typeof FASTEST_EXERCISES[0]; onClose: () => void }) {
  const scale = useSharedValue(0.5);
  const progressValue = useSharedValue(0);
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSteps = technique.steps?.length || 4;

  const startExercise = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
    setCycleCount(0);

    const stepDurations = technique.steps!.map(s => s.duration);
    let step = 0;

    const runStep = () => {
      setCurrentStep(step % totalSteps);
      const dur = stepDurations[step % totalSteps];
      const targetScale = step % totalSteps === 0 ? 1 : step % totalSteps === 2 ? 0.5 : (step % totalSteps === 1 ? 1 : 0.5);
      scale.value = withTiming(targetScale, { duration: dur, easing: Easing.inOut(Easing.ease) });
      progressValue.value = withTiming((step % totalSteps + 1) / totalSteps, { duration: dur });
      if (Platform.OS !== 'web') {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      }
      step++;
      if (step % totalSteps === 0) setCycleCount(c => c + 1);
    };

    runStep();

    intervalRef.current = setInterval(() => {
      const idx = step % totalSteps;
      setCurrentStep(idx);
      const targetScale = idx === 0 ? 1 : idx === 2 ? 0.5 : (idx === 1 ? 1 : 0.5);
      scale.value = withTiming(targetScale, { duration: stepDurations[idx], easing: Easing.inOut(Easing.ease) });
      progressValue.value = withTiming((idx + 1) / totalSteps, { duration: stepDurations[idx] });
      if (idx === 0) setCycleCount(prev => prev + 1);
      if (Platform.OS !== 'web') {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      }
      step++;
    }, stepDurations[0]);
  }, [technique, scale, progressValue, totalSteps]);

  const stopExercise = useCallback(() => {
    setIsActive(false);
    cancelAnimation(scale);
    scale.value = withTiming(0.5, { duration: 300 });
    progressValue.value = withTiming(0, { duration: 300 });
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [scale, progressValue]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const animatedCircle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const currentPhase = technique.steps?.[currentStep];

  return (
    <View style={modalStyles.container}>
      <View style={modalStyles.header}>
        <View style={{ width: 40 }} />
        <Text style={modalStyles.title}>{technique.title}</Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Feather name="x" size={24} color={Colors.text} />
        </Pressable>
      </View>
      <View style={modalStyles.body}>
        <View style={modalStyles.circleArea}>
          <Animated.View style={[modalStyles.outerRing, animatedCircle, { borderColor: technique.color + '40' }]}>
            <View style={[modalStyles.innerRing, { backgroundColor: technique.color + '20', borderColor: technique.color + '60' }]}>
              <View style={[modalStyles.centerCircle, { backgroundColor: technique.color }]}>
                <Text style={modalStyles.phaseText}>{isActive ? currentPhase?.phase || 'Go' : 'Ready'}</Text>
              </View>
            </View>
          </Animated.View>
        </View>
        {isActive && currentPhase && (
          <Text style={modalStyles.instruction}>{currentPhase.instruction}</Text>
        )}
        {isActive && (
          <Text style={modalStyles.cycleText}>Cycle {cycleCount + 1}</Text>
        )}
        {!isActive && (
          <Text style={modalStyles.descText}>{technique.scienceNote}</Text>
        )}
        <Pressable
          style={[modalStyles.actionBtn, { backgroundColor: isActive ? Colors.error : technique.color }]}
          onPress={isActive ? stopExercise : startExercise}
        >
          <Feather name={isActive ? 'square' : 'play'} size={18} color="#fff" />
          <Text style={modalStyles.actionBtnText}>{isActive ? 'Stop' : 'Begin'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function GuidedExercise({ technique, onClose }: { technique: typeof FASTEST_EXERCISES[0]; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useSharedValue(1);
  const items = (technique as any).bodyParts || (technique as any).regions || (technique as any).steps || [];
  const stepItems = Array.isArray(items) ? items : [];

  const goNext = () => {
    if (currentStep < stepItems.length - 1) {
      fadeAnim.value = withSequence(withTiming(0, { duration: 150 }), withTiming(1, { duration: 300 }));
      setTimeout(() => setCurrentStep(prev => prev + 1), 150);
      if (Platform.OS !== 'web') {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      }
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      fadeAnim.value = withSequence(withTiming(0, { duration: 150 }), withTiming(1, { duration: 300 }));
      setTimeout(() => setCurrentStep(prev => prev - 1), 150);
    }
  };

  const fadeStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value }));
  const currentItem = stepItems[currentStep] as any;
  const label = currentItem?.name || currentItem?.phase || `Step ${currentStep + 1}`;
  const detail = currentItem?.instruction || currentItem?.toString?.() || '';

  return (
    <View style={modalStyles.container}>
      <View style={modalStyles.header}>
        <Pressable onPress={onClose} hitSlop={12}>
          <Feather name="x" size={24} color={Colors.text} />
        </Pressable>
        <Text style={modalStyles.title}>{technique.title}</Text>
        <Text style={[modalStyles.stepCounter, { color: technique.color }]}>{currentStep + 1}/{stepItems.length}</Text>
      </View>
      <View style={modalStyles.body}>
        <View style={[modalStyles.stepIndicator, { backgroundColor: technique.color + '15' }]}>
          <View style={[modalStyles.stepProgress, { width: `${((currentStep + 1) / stepItems.length) * 100}%`, backgroundColor: technique.color }]} />
        </View>
        <Animated.View style={[modalStyles.stepContent, fadeStyle]}>
          <View style={[modalStyles.stepIconCircle, { backgroundColor: technique.color + '18' }]}>
            <Feather name={technique.icon} size={28} color={technique.color} />
          </View>
          <Text style={modalStyles.stepLabel}>{label}</Text>
          <Text style={modalStyles.stepDetail}>{detail}</Text>
        </Animated.View>
        <View style={modalStyles.navRow}>
          <Pressable
            style={[modalStyles.navBtn, currentStep === 0 && { opacity: 0.3 }]}
            onPress={goPrev}
            disabled={currentStep === 0}
          >
            <Feather name="chevron-left" size={20} color={Colors.text} />
            <Text style={modalStyles.navBtnText}>Previous</Text>
          </Pressable>
          {currentStep < stepItems.length - 1 ? (
            <Pressable style={[modalStyles.navBtn, modalStyles.navBtnPrimary, { backgroundColor: technique.color }]} onPress={goNext}>
              <Text style={[modalStyles.navBtnText, { color: '#fff' }]}>Next</Text>
              <Feather name="chevron-right" size={20} color="#fff" />
            </Pressable>
          ) : (
            <Pressable style={[modalStyles.navBtn, modalStyles.navBtnPrimary, { backgroundColor: Colors.success }]} onPress={onClose}>
              <Feather name="check" size={18} color="#fff" />
              <Text style={[modalStyles.navBtnText, { color: '#fff' }]}>Done</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

function GroundingModal({ onClose }: { onClose: () => void }) {
  const [activeStep, setActiveStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const toggleStep = (index: number) => {
    if (completedSteps.includes(index)) {
      setCompletedSteps(prev => prev.filter(i => i !== index));
    } else {
      setCompletedSteps(prev => [...prev, index]);
      if (Platform.OS !== 'web') {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
      }
    }
    setActiveStep(activeStep === index ? -1 : index);
  };

  const allDone = completedSteps.length === GROUNDING_STEPS.length;

  return (
    <View style={modalStyles.container}>
      <View style={modalStyles.header}>
        <View style={{ width: 40 }} />
        <Text style={modalStyles.title}>5-4-3-2-1 Grounding</Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Feather name="x" size={24} color={Colors.text} />
        </Pressable>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <Text style={modalStyles.descText}>Tap each step as you complete it to anchor yourself in the present moment.</Text>
        {GROUNDING_STEPS.map((step, index) => {
          const isDone = completedSteps.includes(index);
          const isActive = activeStep === index;
          return (
            <Pressable
              key={step.count}
              style={[groundingStyles.card, isDone && groundingStyles.cardDone]}
              onPress={() => toggleStep(index)}
            >
              <View style={[groundingStyles.icon, { backgroundColor: step.color + '18' }]}>
                {isDone ? (
                  <Feather name="check" size={20} color={step.color} />
                ) : (
                  <Feather name={step.icon} size={20} color={step.color} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={groundingStyles.row}>
                  <Text style={[groundingStyles.count, isDone && { textDecorationLine: 'line-through' as const, color: Colors.textTertiary }]}>{step.count}</Text>
                  <Text style={[groundingStyles.sense, isDone && { color: Colors.textTertiary }]}>
                    thing{step.count > 1 ? 's' : ''} you can {step.sense}
                  </Text>
                </View>
                {isActive && !isDone && (
                  <Text style={groundingStyles.prompt}>{step.prompt}</Text>
                )}
              </View>
              {isDone && <Feather name="check-circle" size={18} color={Colors.success} />}
            </Pressable>
          );
        })}
        {allDone && (
          <View style={groundingStyles.complete}>
            <Feather name="award" size={24} color={Colors.success} />
            <Text style={groundingStyles.completeText}>Well done. You are grounded in the present moment.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default function CrisisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useApp();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const [activeTechnique, setActiveTechnique] = useState<typeof FASTEST_EXERCISES[0] | null>(null);
  const [showGrounding, setShowGrounding] = useState(false);

  const userConditions = profile?.conditions || [];
  const relevantCoping = userConditions
    .filter(c => CONDITION_COPING[c])
    .map(c => ({ conditionId: c, ...CONDITION_COPING[c] }));

  const handleEmergencyCall = () => {
    try { Linking.openURL('tel:911'); } catch {}
  };

  const handleCrisisText = () => {
    try { Linking.openURL(Platform.OS === 'web' ? 'https://www.crisistextline.org' : 'sms:741741'); } catch {}
  };

  const handleExercisePress = (ex: typeof FASTEST_EXERCISES[0]) => {
    if (ex.id === 'grounding') {
      setShowGrounding(true);
    } else {
      setActiveTechnique(ex);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      <View style={[styles.navBar, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>Crisis Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomInset + 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(400)}>
          <View style={styles.heroCard}>
            <Text style={styles.heroHeadline}>You are not alone.</Text>
            <Text style={styles.heroSubtext}>Help is available right now. Take a breath.</Text>

            <Pressable style={styles.emergencyBtn} onPress={handleEmergencyCall}>
              <Feather name="phone" size={20} color="#FFFFFF" />
              <Text style={styles.emergencyBtnText}>Call Emergency Services (911)</Text>
            </Pressable>

            <Pressable style={styles.crisisTextBtn} onPress={handleCrisisText}>
              <Feather name="message-square" size={18} color="#D32F2F" />
              <Text style={styles.crisisTextBtnText}>Crisis Text Line — Text HOME to 741741</Text>
            </Pressable>
          </View>
        </Animated.View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RIGHT NOW, TRY THIS</Text>
          <Text style={styles.sectionSub}>These three exercises can help within minutes.</Text>
          {FASTEST_EXERCISES.map(ex => (
            <Pressable
              key={ex.id}
              style={styles.exerciseCard}
              onPress={() => handleExercisePress(ex)}
            >
              <View style={[styles.exerciseIconBox, { backgroundColor: ex.color + '18' }]}>
                <Feather name={ex.icon} size={24} color={ex.color} />
              </View>
              <View style={styles.exerciseContent}>
                <View style={styles.exerciseTopRow}>
                  <Text style={styles.exerciseTitle}>{ex.title}</Text>
                  <View style={[styles.durationPill, { backgroundColor: ex.color + '15' }]}>
                    <Feather name="clock" size={11} color={ex.color} />
                    <Text style={[styles.durationText, { color: ex.color }]}>{ex.duration}</Text>
                  </View>
                </View>
                <Text style={styles.exerciseScienceNote} numberOfLines={2}>{ex.scienceNote}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
            </Pressable>
          ))}
        </View>

        {relevantCoping.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CONDITION-SPECIFIC SUPPORT</Text>
            <Text style={styles.sectionSub}>Personalized for your conditions.</Text>
            {relevantCoping.map(coping => (
              <View key={coping.conditionId} style={styles.copingBlock}>
                <Text style={styles.copingBlockTitle}>{coping.title}</Text>
                {coping.techniques.map((tip, i) => (
                  <View key={i} style={styles.copingRow}>
                    <View style={styles.copingBullet}>
                      <Text style={styles.copingBulletText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.copingText}>{tip}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MORE RESOURCES</Text>
          <View style={styles.resourcesCard}>
            <ResourceRow icon="phone" title="988 Suicide & Crisis Lifeline" detail="Call or text 988" url="tel:988" />
            <ResourceRow icon="phone-call" title="SAMHSA Helpline" detail="1-800-662-4357 (24/7)" url="tel:18006624357" />
            <ResourceRow icon="globe" title="International Crisis Lines" detail="findahelpline.com" url="https://findahelpline.com" />
            <ResourceRow icon="shield" title="Veterans Crisis Line" detail="Dial 988, then press 1" url="tel:988" last />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBanner, { paddingBottom: bottomInset + 12 }]}>
        <Text style={styles.bottomBannerText}>You reached out. That was brave. We are here.</Text>
      </View>

      <Modal
        visible={!!activeTechnique}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveTechnique(null)}
      >
        {activeTechnique && (
          activeTechnique.id === 'box_breathing' ? (
            <BreathingExercise technique={activeTechnique} onClose={() => setActiveTechnique(null)} />
          ) : (
            <GuidedExercise technique={activeTechnique} onClose={() => setActiveTechnique(null)} />
          )
        )}
      </Modal>

      <Modal
        visible={showGrounding}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGrounding(false)}
      >
        <GroundingModal onClose={() => setShowGrounding(false)} />
      </Modal>
    </View>
  );
}

function ResourceRow({ icon, title, detail, url, last }: { icon: string; title: string; detail: string; url: string; last?: boolean }) {
  const handlePress = () => {
    try { Linking.openURL(url); } catch {}
  };
  return (
    <Pressable
      style={[styles.resourceRow, !last && styles.resourceRowBorder]}
      onPress={handlePress}
    >
      <View style={styles.resourceIcon}>
        <Feather name={icon as any} size={18} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.resourceTitle}>{title}</Text>
        <Text style={styles.resourceDetail}>{detail}</Text>
      </View>
      <Feather name="external-link" size={14} color={Colors.textTertiary} />
    </Pressable>
  );
}

const groundingStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    gap: 14,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDone: {
    backgroundColor: Colors.success + '08',
    borderWidth: 1,
    borderColor: Colors.success + '20',
  },
  icon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  count: { fontFamily: 'Nunito_800ExtraBold', fontSize: 22, color: Colors.text },
  sense: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: Colors.textSecondary },
  prompt: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.primary, marginTop: 4, fontStyle: 'italic' as const },
  complete: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '10',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  completeText: { flex: 1, fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.success, lineHeight: 20 },
});

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.text },
  stepCounter: { fontFamily: 'Nunito_700Bold', fontSize: 14 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  circleArea: { width: 220, height: 220, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  outerRing: { width: 200, height: 200, borderRadius: 100, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  innerRing: { width: 160, height: 160, borderRadius: 80, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  centerCircle: { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center' },
  phaseText: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: '#fff' },
  instruction: { fontFamily: 'Nunito_500Medium', fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 8 },
  cycleText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.textTertiary, marginBottom: 20 },
  descText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 28, gap: 10 },
  actionBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#fff' },
  stepIndicator: { width: '100%', height: 4, borderRadius: 2, marginBottom: 32 },
  stepProgress: { height: 4, borderRadius: 2 },
  stepContent: { alignItems: 'center', paddingHorizontal: 20, flex: 1, justifyContent: 'center' },
  stepIconCircle: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  stepLabel: { fontFamily: 'Nunito_700Bold', fontSize: 22, color: Colors.text, marginBottom: 12, textAlign: 'center' },
  stepDetail: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 20, gap: 12 },
  navBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, gap: 6, backgroundColor: Colors.backgroundSecondary },
  navBtnPrimary: {},
  navBtnText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.text },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: '#FFFFFF',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.text },
  scroll: { flex: 1, backgroundColor: '#FFFFFF' },
  heroCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  heroHeadline: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
    color: Colors.text,
    marginBottom: 6,
  },
  heroSubtext: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 17,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#D32F2F',
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 12,
  },
  emergencyBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
  },
  crisisTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: '#D32F2F',
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: '#FFF5F5',
  },
  crisisTextBtnText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: '#D32F2F',
  },
  section: { paddingHorizontal: 20, paddingTop: 28 },
  sectionLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  sectionSub: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Platform.select({
      default: {
        shadowColor: Colors.cardShadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 3,
      },
    }),
  },
  exerciseIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseContent: { flex: 1 },
  exerciseTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  exerciseTitle: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: Colors.text },
  durationPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  durationText: { fontFamily: 'Nunito_600SemiBold', fontSize: 11 },
  exerciseScienceNote: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  copingBlock: { marginBottom: 20 },
  copingBlockTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: Colors.primary,
    marginBottom: 12,
  },
  copingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  copingBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  copingBulletText: { fontFamily: 'Nunito_700Bold', fontSize: 11, color: Colors.primary },
  copingText: { flex: 1, fontFamily: 'Nunito_500Medium', fontSize: 17, color: Colors.text, lineHeight: 24 },
  resourcesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  resourceRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  resourceRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resourceTitle: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.text, marginBottom: 2 },
  resourceDetail: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.primary },
  bottomBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2ABFBF',
    paddingTop: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  bottomBannerText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
  },
});
