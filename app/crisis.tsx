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
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GROUNDING_STEPS = [
  { count: 5, sense: 'SEE', prompt: 'Name 5 things you can see right now', icon: 'eye' as const, color: '#6B5B95' },
  { count: 4, sense: 'TOUCH', prompt: 'Notice 4 things you can physically feel', icon: 'edit-3' as const, color: '#88B3B5' },
  { count: 3, sense: 'HEAR', prompt: 'Listen for 3 sounds around you', icon: 'headphones' as const, color: '#E8B4B8' },
  { count: 2, sense: 'SMELL', prompt: 'Identify 2 scents nearby', icon: 'wind' as const, color: '#7FB069' },
  { count: 1, sense: 'TASTE', prompt: 'Notice 1 taste in your mouth', icon: 'coffee' as const, color: '#F0C05A' },
];

const CRISIS_TECHNIQUES = [
  {
    id: 'box_breathing',
    title: 'Box Breathing',
    subtitle: 'Navy SEAL calming technique',
    icon: 'square' as const,
    color: '#88B3B5',
    duration: '4 minutes',
    description: 'Breathe in for 4 counts, hold for 4, out for 4, hold for 4. Used by Navy SEALs to control stress responses.',
    steps: [
      { phase: 'Breathe In', duration: 4000, instruction: 'Slowly inhale through your nose' },
      { phase: 'Hold', duration: 4000, instruction: 'Gently hold your breath' },
      { phase: 'Breathe Out', duration: 4000, instruction: 'Slowly exhale through your mouth' },
      { phase: 'Hold', duration: 4000, instruction: 'Rest before next breath' },
    ],
  },
  {
    id: 'pmr',
    title: 'Progressive Muscle Relaxation',
    subtitle: 'Release physical tension',
    icon: 'zap' as const,
    color: '#6B5B95',
    duration: '5 minutes',
    description: 'Systematically tense and release each muscle group to reduce physical stress.',
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
  {
    id: 'bilateral',
    title: 'Butterfly Hug',
    subtitle: 'Bilateral stimulation for calm',
    icon: 'heart' as const,
    color: '#E8B4B8',
    duration: '3 minutes',
    description: 'Cross arms over chest and alternately tap shoulders. This bilateral stimulation activates both brain hemispheres and reduces emotional distress.',
    steps: [
      'Cross your arms over your chest',
      'Place your hands on opposite shoulders',
      'Alternately tap your left and right hand',
      'Tap slowly and rhythmically',
      'Focus on the sensation of each tap',
      'Continue for 2-3 minutes',
      'Notice your breathing slowing down',
    ],
  },
  {
    id: 'safe_place',
    title: 'Safe Place Visualization',
    subtitle: 'Mental refuge technique',
    icon: 'home' as const,
    color: '#7FB069',
    duration: '5 minutes',
    description: 'Create a detailed mental image of a place where you feel completely safe and at peace.',
    prompts: [
      'Close your eyes and think of a place where you feel safe',
      'What do you see? Notice colors, shapes, light',
      'What sounds are present? Perhaps silence, or gentle sounds',
      'What textures can you feel? Warmth? A breeze?',
      'What pleasant scents fill this space?',
      'Let yourself fully arrive in this place',
      'You are safe here. Stay as long as you need',
    ],
  },
  {
    id: 'cold_exposure',
    title: 'Cold Water Reset',
    subtitle: 'Activate your dive reflex',
    icon: 'droplet' as const,
    color: '#6AABCF',
    duration: '2 minutes',
    description: 'Splash cold water on your face or hold ice cubes. This triggers the mammalian dive reflex, immediately slowing heart rate and calming your nervous system.',
    steps: [
      'Find cold water or ice cubes',
      'Splash cold water on your face',
      'Or hold ice cubes in your hands',
      'Focus on the intense cold sensation',
      'Notice your breathing change',
      'The shock reflex calms your nervous system',
      'Repeat if needed',
    ],
  },
  {
    id: 'body_scan',
    title: 'Emergency Body Scan',
    subtitle: 'Reconnect with your body',
    icon: 'activity' as const,
    color: '#F0C05A',
    duration: '4 minutes',
    description: 'Quickly scan through your body to identify and release tension, bringing awareness back to the present moment.',
    regions: [
      { name: 'Crown of head', instruction: 'Notice any tightness or tingling' },
      { name: 'Forehead & eyes', instruction: 'Soften the muscles around your eyes' },
      { name: 'Jaw & mouth', instruction: 'Unclench your jaw, part your lips slightly' },
      { name: 'Neck & throat', instruction: 'Let your neck lengthen, release tension' },
      { name: 'Shoulders', instruction: 'Drop them away from your ears' },
      { name: 'Chest & heart', instruction: 'Feel your heartbeat, breathe into this space' },
      { name: 'Stomach', instruction: 'Soften your belly, let it expand with breath' },
      { name: 'Legs & feet', instruction: 'Feel the ground supporting you' },
    ],
  },
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

const RESOURCES = [
  { title: '988 Suicide & Crisis Lifeline', detail: 'Call or text 988', icon: 'phone' as const, url: 'tel:988' },
  { title: 'Crisis Text Line', detail: 'Text HOME to 741741', icon: 'message-square' as const, url: 'sms:741741' },
  { title: 'SAMHSA Helpline', detail: '1-800-662-4357 (24/7)', icon: 'phone-call' as const, url: 'tel:18006624357' },
  { title: 'International Crisis Lines', detail: 'findahelpline.com', icon: 'globe' as const, url: 'https://findahelpline.com' },
  { title: 'Veterans Crisis Line', detail: 'Dial 988, then press 1', icon: 'shield' as const, url: 'tel:988' },
];

function BreathingExercise({ technique, onClose }: { technique: typeof CRISIS_TECHNIQUES[0]; onClose: () => void }) {
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
    let cycles = 0;

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
      if (step % totalSteps === 0) {
        cycles++;
        setCycleCount(cycles);
      }
    };

    runStep();
    const totalCycleDuration = stepDurations.reduce((a, b) => a + b, 0);
    const stepInterval = stepDurations[0];
    let elapsed = 0;

    intervalRef.current = setInterval(() => {
      elapsed++;
      const idx = elapsed % totalSteps;
      setCurrentStep(idx);

      const targetScale = idx === 0 ? 1 : idx === 2 ? 0.5 : (idx === 1 ? 1 : 0.5);
      scale.value = withTiming(targetScale, { duration: stepDurations[idx], easing: Easing.inOut(Easing.ease) });
      progressValue.value = withTiming((idx + 1) / totalSteps, { duration: stepDurations[idx] });

      if (idx === 0) {
        setCycleCount(prev => prev + 1);
      }

      if (Platform.OS !== 'web') {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      }
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
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
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
                <Text style={modalStyles.phaseText}>
                  {isActive ? currentPhase?.phase || 'Go' : 'Ready'}
                </Text>
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
          <Text style={modalStyles.descText}>{technique.description}</Text>
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

function GuidedExercise({ technique, onClose }: { technique: typeof CRISIS_TECHNIQUES[0]; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useSharedValue(1);
  const items = technique.bodyParts || technique.regions || technique.prompts || technique.steps || [];
  const stepItems = Array.isArray(items) ? items : [];

  const goNext = () => {
    if (currentStep < stepItems.length - 1) {
      fadeAnim.value = withSequence(
        withTiming(0, { duration: 150 }),
        withTiming(1, { duration: 300 }),
      );
      setTimeout(() => setCurrentStep(prev => prev + 1), 150);
      if (Platform.OS !== 'web') {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      }
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      fadeAnim.value = withSequence(
        withTiming(0, { duration: 150 }),
        withTiming(1, { duration: 300 }),
      );
      setTimeout(() => setCurrentStep(prev => prev - 1), 150);
    }
  };

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

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

function GroundingInteractive() {
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
    <View>
      {GROUNDING_STEPS.map((step, index) => {
        const isDone = completedSteps.includes(index);
        const isActive = activeStep === index;
        return (
          <Pressable
            key={step.count}
            style={[styles.groundingCard, isDone && styles.groundingCardDone]}
            onPress={() => toggleStep(index)}
          >
            <View style={[styles.groundingIcon, { backgroundColor: step.color + '18' }]}>
              {isDone ? (
                <Feather name="check" size={20} color={step.color} />
              ) : (
                <Feather name={step.icon} size={20} color={step.color} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.groundingContent}>
                <Text style={[styles.groundingCount, isDone && { textDecorationLine: 'line-through' as const, color: Colors.textTertiary }]}>{step.count}</Text>
                <Text style={[styles.groundingSense, isDone && { color: Colors.textTertiary }]}>
                  thing{step.count > 1 ? 's' : ''} you can {step.sense}
                </Text>
              </View>
              {isActive && !isDone && (
                <Text style={styles.groundingPrompt}>{step.prompt}</Text>
              )}
            </View>
            {isDone && (
              <Feather name="check-circle" size={18} color={Colors.success} />
            )}
          </Pressable>
        );
      })}
      {allDone && (
        <View style={styles.groundingComplete}>
          <Feather name="award" size={24} color={Colors.success} />
          <Text style={styles.groundingCompleteText}>Well done. You are grounded in the present moment.</Text>
        </View>
      )}
    </View>
  );
}

export default function CrisisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useApp();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const [activeTechnique, setActiveTechnique] = useState<typeof CRISIS_TECHNIQUES[0] | null>(null);
  const [activeTab, setActiveTab] = useState<'tools' | 'coping' | 'resources'>('tools');

  const userConditions = profile?.conditions || [];
  const relevantCoping = userConditions
    .filter(c => CONDITION_COPING[c])
    .map(c => ({ conditionId: c, ...CONDITION_COPING[c] }));

  const handleResourcePress = (url: string) => {
    try {
      Linking.openURL(url);
    } catch {}
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#524578', '#3D2F6B']}
        style={[styles.headerGradient, { paddingTop: topInset + 8 }]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={24} color={Colors.textInverse} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Feather name="shield" size={18} color={Colors.accent} />
          <Text style={styles.headerTitle}>Crisis Support</Text>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <View style={styles.disclaimerCard}>
        <Feather name="alert-triangle" size={18} color={Colors.error} />
        <Text style={styles.disclaimerText}>
          If you are in immediate danger, please call emergency services (911) or go to your nearest emergency room.
        </Text>
      </View>

      <View style={styles.tabBar}>
        {(['tools', 'coping', 'resources'] as const).map(tab => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Feather
              name={tab === 'tools' ? 'tool' : tab === 'coping' ? 'heart' : 'phone'}
              size={14}
              color={activeTab === tab ? Colors.primary : Colors.textTertiary}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'tools' ? 'Crisis Tools' : tab === 'coping' ? 'Coping Cards' : 'Get Help'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'tools' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Calm Techniques</Text>
              <Text style={styles.sectionSubtitle}>
                Evidence-based tools to help regulate your nervous system right now
              </Text>
              <View style={styles.techniquesGrid}>
                {CRISIS_TECHNIQUES.map(tech => (
                  <Pressable
                    key={tech.id}
                    style={styles.techniqueCard}
                    onPress={() => setActiveTechnique(tech)}
                  >
                    <View style={[styles.techniqueIconBg, { backgroundColor: tech.color + '15' }]}>
                      <Feather name={tech.icon} size={22} color={tech.color} />
                    </View>
                    <Text style={styles.techniqueTitle}>{tech.title}</Text>
                    <Text style={styles.techniqueSubtitle} numberOfLines={2}>{tech.subtitle}</Text>
                    <View style={[styles.techniqueDuration, { backgroundColor: tech.color + '12' }]}>
                      <Feather name="clock" size={11} color={tech.color} />
                      <Text style={[styles.techniqueDurationText, { color: tech.color }]}>{tech.duration}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5-4-3-2-1 Grounding</Text>
              <Text style={styles.sectionSubtitle}>
                Tap each step as you complete it to anchor yourself in the present
              </Text>
              <GroundingInteractive />
            </View>
          </>
        )}

        {activeTab === 'coping' && (
          <View style={styles.section}>
            {relevantCoping.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Your Coping Cards</Text>
                <Text style={styles.sectionSubtitle}>
                  Personalized for your conditions. Tap a card to expand.
                </Text>
                {relevantCoping.map(coping => (
                  <View key={coping.conditionId} style={styles.copingSection}>
                    <Text style={styles.copingTitle}>{coping.title}</Text>
                    {coping.techniques.map((tip, i) => (
                      <View key={i} style={styles.copingCard}>
                        <View style={styles.copingBullet}>
                          <Text style={styles.copingBulletText}>{i + 1}</Text>
                        </View>
                        <Text style={styles.copingText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Feather name="info" size={24} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>No conditions selected</Text>
                <Text style={styles.emptyText}>
                  Add conditions in your profile to see personalized coping strategies
                </Text>
              </View>
            )}

            <View style={styles.copingSection}>
              <Text style={styles.copingTitle}>Universal Coping Strategies</Text>
              {[
                'Remember: feelings are temporary, even intense ones',
                'Focus on things within your control right now',
                'Speak to yourself as you would to a close friend',
                'Physical movement changes your emotional state',
                'Naming your emotion reduces its intensity',
                'You have survived difficult moments before',
              ].map((tip, i) => (
                <View key={i} style={styles.copingCard}>
                  <View style={[styles.copingBullet, { backgroundColor: Colors.secondary + '20' }]}>
                    <Feather name="star" size={10} color={Colors.secondary} />
                  </View>
                  <Text style={styles.copingText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'resources' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Crisis Resources</Text>
            <Text style={styles.sectionSubtitle}>
              Free, confidential support available 24/7
            </Text>
            {RESOURCES.map((resource, index) => (
              <Pressable
                key={index}
                style={styles.resourceCard}
                onPress={() => handleResourcePress(resource.url)}
              >
                <View style={styles.resourceIconWrap}>
                  <Feather name={resource.icon} size={20} color={Colors.primary} />
                </View>
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceTitle}>{resource.title}</Text>
                  <Text style={styles.resourceDetail}>{resource.detail}</Text>
                </View>
                <Feather name="external-link" size={16} color={Colors.textTertiary} />
              </Pressable>
            ))}

            <View style={styles.safetyNote}>
              <Feather name="heart" size={18} color={Colors.primary} />
              <Text style={styles.safetyNoteText}>
                You matter. Reaching out for help is a sign of strength, not weakness. These resources are staffed by trained professionals ready to listen.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

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
    </View>
  );
}

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
  outerRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseText: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: '#fff' },
  instruction: { fontFamily: 'Nunito_500Medium', fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 8 },
  cycleText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.textTertiary, marginBottom: 20 },
  descText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 10,
  },
  actionBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#fff' },
  stepIndicator: { width: '100%', height: 4, borderRadius: 2, marginBottom: 32 },
  stepProgress: { height: 4, borderRadius: 2 },
  stepContent: { alignItems: 'center', paddingHorizontal: 20, flex: 1, justifyContent: 'center' },
  stepIconCircle: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  stepLabel: { fontFamily: 'Nunito_700Bold', fontSize: 22, color: Colors.text, marginBottom: 12, textAlign: 'center' },
  stepDetail: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 20, gap: 12 },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
    backgroundColor: Colors.backgroundSecondary,
  },
  navBtnPrimary: {},
  navBtnText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.text },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: Colors.textInverse,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFE0E0',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 20,
    marginTop: 16,
    gap: 10,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: Colors.error,
    lineHeight: 19,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 5,
  },
  tabActive: {
    backgroundColor: Colors.surface,
    ...Platform.select({
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    }),
  },
  tabText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    color: Colors.textTertiary,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  scroll: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 19,
  },
  techniquesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  techniqueCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(107,91,149,0.08)' },
      default: { shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2 },
    }),
  },
  techniqueIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  techniqueTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  techniqueSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 10,
  },
  techniqueDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  techniqueDurationText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
  },
  groundingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(107,91,149,0.08)' },
      default: { shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2 },
    }),
  },
  groundingCardDone: {
    backgroundColor: Colors.success + '08',
    borderWidth: 1,
    borderColor: Colors.success + '20',
  },
  groundingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  groundingContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  groundingCount: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 22,
    color: Colors.text,
  },
  groundingSense: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  groundingPrompt: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  groundingComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '10',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  groundingCompleteText: {
    flex: 1,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.success,
    lineHeight: 20,
  },
  copingSection: {
    marginBottom: 24,
  },
  copingTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: Colors.primary,
    marginBottom: 12,
  },
  copingCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    ...Platform.select({
      web: { boxShadow: '0 1px 4px rgba(107,91,149,0.06)' },
      default: { shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 1 },
    }),
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
  copingBulletText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
    color: Colors.primary,
  },
  copingText: {
    flex: 1,
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.text,
  },
  emptyText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(107,91,149,0.08)' },
      default: { shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2 },
    }),
  },
  resourceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.text,
    marginBottom: 2,
  },
  resourceDetail: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: Colors.primary,
  },
  safetyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primary + '08',
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    gap: 12,
  },
  safetyNoteText: {
    flex: 1,
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
});
