import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { CONDITIONS } from '@/constants/conditions';
import { EXERCISES } from '@/constants/exercises';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TOTAL_STEPS = 7;

const EXPERIENCE_LEVELS = [
  {
    key: 'beginner',
    label: 'New to this',
    description: 'I have little or no experience with body awareness or mindfulness practices',
    icon: 'compass' as const,
  },
  {
    key: 'intermediate',
    label: 'Some experience',
    description: 'I have tried meditation, breathwork, or mindfulness a few times',
    icon: 'trending-up' as const,
  },
  {
    key: 'advanced',
    label: 'Regular practitioner',
    description: 'I have an established mindfulness or somatic practice',
    icon: 'award' as const,
  },
];

type InteroceptiveAnswer = 'clear' | 'faint' | 'none';

interface WeekPlan {
  week: number;
  title: string;
  focus: string;
  exerciseIds: string[];
  color: string;
}

function generatePlan(conditions: string[], experienceLevel: string): WeekPlan[] {
  const isPtsdOrAnxiety = conditions.some(c => ['ptsd', 'anxiety', 'panic'].includes(c));
  const isDepression = conditions.includes('depression');
  const isAlexithymia = conditions.includes('alexithymia');

  if (isPtsdOrAnxiety) {
    return [
      {
        week: 1,
        title: 'Safe Ground',
        focus: 'Establish safety with gentle breath awareness',
        exerciseIds: ['box-breathing', 'diaphragmatic-breathing'],
        color: '#88B3B5',
      },
      {
        week: 2,
        title: 'Body Contact',
        focus: 'Introduce body scanning starting from neutral areas',
        exerciseIds: ['progressive-body-scan', 'shoulder-check'],
        color: '#6B5B95',
      },
      {
        week: 3,
        title: 'Heartbeat Awareness',
        focus: 'Explore cardiac sensations at a comfortable pace',
        exerciseIds: ['heartbeat-detection', '478-breathing'],
        color: '#E8B4B8',
      },
      {
        week: 4,
        title: 'Integration',
        focus: 'Connect body signals to emotional states',
        exerciseIds: ['tension-release', 'cold-exposure-intro'],
        color: '#7FB069',
      },
    ];
  }

  if (isAlexithymia) {
    return [
      {
        week: 1,
        title: 'Body Signals 101',
        focus: 'Learn to notice and name body sensations',
        exerciseIds: ['progressive-body-scan', 'quick-body-check'],
        color: '#9BA3C2',
      },
      {
        week: 2,
        title: 'Cardiac Connection',
        focus: 'Build heartbeat awareness as an emotional anchor',
        exerciseIds: ['heartbeat-detection', 'heartbeat-tracking'],
        color: '#E85D5D',
      },
      {
        week: 3,
        title: 'Emotion Mapping',
        focus: 'Link body states to emotional vocabulary',
        exerciseIds: ['heartbeat-emotion', 'emotion-body-mapping'],
        color: '#6B5B95',
      },
      {
        week: 4,
        title: 'Daily Practice',
        focus: 'Embed interoception into everyday awareness',
        exerciseIds: ['breath-temperature', 'gut-feeling-scan'],
        color: '#88B3B5',
      },
    ];
  }

  if (isDepression) {
    return [
      {
        week: 1,
        title: 'Gentle Start',
        focus: 'Low-effort practices to rebuild body connection',
        exerciseIds: ['diaphragmatic-breathing', 'quick-body-check'],
        color: '#6AABCF',
      },
      {
        week: 2,
        title: 'Movement & Breath',
        focus: 'Explore the body through mindful movement',
        exerciseIds: ['slow-walking', 'box-breathing'],
        color: '#7FB069',
      },
      {
        week: 3,
        title: 'Gut & Heart',
        focus: 'Notice gut and cardiac sensations alongside mood',
        exerciseIds: ['gut-feeling-scan', 'heartbeat-detection'],
        color: '#C4A484',
      },
      {
        week: 4,
        title: 'Body Stories',
        focus: 'Decode what your body is telling you emotionally',
        exerciseIds: ['emotion-body-mapping', 'progressive-body-scan'],
        color: '#6B5B95',
      },
    ];
  }

  const isAdvanced = experienceLevel === 'advanced';
  return [
    {
      week: 1,
      title: 'Foundation',
      focus: 'Build core interoceptive skills',
      exerciseIds: isAdvanced ? ['heartbeat-tracking', 'breath-temperature'] : ['box-breathing', 'heartbeat-detection'],
      color: '#6B5B95',
    },
    {
      week: 2,
      title: 'Depth',
      focus: 'Expand body awareness through scanning',
      exerciseIds: isAdvanced ? ['heartbeat-emotion', 'progressive-body-scan'] : ['diaphragmatic-breathing', 'progressive-body-scan'],
      color: '#88B3B5',
    },
    {
      week: 3,
      title: 'Refinement',
      focus: 'Sharpen discriminative awareness',
      exerciseIds: ['tension-release', 'breath-temperature'],
      color: '#C4848A',
    },
    {
      week: 4,
      title: 'Integration',
      focus: 'Connect body wisdom to daily life',
      exerciseIds: ['gut-feeling-scan', 'emotion-body-mapping'],
      color: '#7FB069',
    },
  ];
}

interface AhaMoment {
  whatWeNoticed: string;
  whatYourBodyDoes: string;
  whatWellTrain: string;
  citation: string;
}

function getAhaMoment(conditions: string[], baseline: InteroceptiveAnswer | null): AhaMoment {
  const isPtsd = conditions.includes('ptsd');
  const isPanic = conditions.includes('panic');
  const isAnxiety = conditions.includes('anxiety');
  const isAlexithymia = conditions.includes('alexithymia');
  const isDepression = conditions.includes('depression');

  if (isPtsd) {
    return {
        whatWeNoticed: baseline === 'clear'
        ? "You noticed several body signals clearly. We can use that awareness as a starting point."
        : "Some people notice body signals very strongly after difficult experiences, while others feel disconnected from them. Both responses are understandable.",
      whatYourBodyDoes: "After trauma, the systems involved in threat and attention can respond differently. Some people become more watchful of sensations, while others feel numb or distant. Responses vary from person to person.",
      whatWellTrain: "We will start with choice-based, trauma-sensitive noticing practices. Begin with neutral sensations such as your hands or feet, pause when needed, and stay within what feels manageable.",
      citation: "van der Kolk, B. (2014). The Body Keeps the Score., Porges, S. (2011). The Polyvagal Theory.",
    };
  }

  if (isPanic) {
    return {
        whatWeNoticed: baseline === 'clear'
        ? "You noticed your heartbeat clearly. We can explore that awareness gently and without forcing it."
        : "Panic can make ordinary body sensations feel confusing or threatening. We will begin with observation and choice.",
      whatYourBodyDoes: "During panic, changes in breathing, heart rate, muscle tension, and attention can arrive together and feel alarming. The meaning your mind gives those sensations can influence how intense the experience feels.",
      whatWellTrain: "Clinicians sometimes use carefully planned interoceptive exposure within CBT for panic. In this app, we will stay with gentle observation and grounding rather than deliberately inducing intense sensations.",
      citation: "Craske et al. (2008). Interoceptive exposure vs. breathing retraining within CBT for panic disorder. BJCP, 47(1).",
    };
  }

  if (isAnxiety) {
    return {
        whatWeNoticed: baseline === 'none'
        ? "Anxiety can make it harder to notice or describe body signals, even when you feel activated."
        : "You notice body signals. We will practice separating what you sense from the story your mind may attach to it.",
      whatYourBodyDoes: "Anxiety can increase attention to internal sensations and make ambiguous signals feel more concerning. A racing heart can have many explanations, including movement, emotion, or stress.",
      whatWellTrain: "We will practice noticing a sensation, describing its qualities, and considering more than one possible explanation. This is a reflection skill, not a way to diagnose what a sensation means.",
      citation: "Garfinkel et al. (2015). Knowing your own heart. Biological Psychology, 104, 65–74.",
    };
  }

  if (isAlexithymia) {
    return {
        whatWeNoticed: baseline === 'clear'
        ? "You have some access to body signals already. We will build a clearer vocabulary for describing them."
        : "Some people find body signals or emotion words difficult to identify. We can start with simple, pressure-free observations.",
      whatYourBodyDoes: "Body sensations and emotions influence one another, but the connection is not always easy to interpret. Attention, language, context, and personal experience all shape what a sensation means to you.",
      whatWellTrain: "We will use a simple Notice, Describe, Connect sequence: detect a sensation, name its qualities, and consider what emotion or context may be present. Treat your interpretation as a hypothesis, not a fact.",
      citation: "Price & Hooven (2018). Interoceptive awareness skills for emotion regulation. Frontiers in Psychology, 9, 798.",
    };
  }

  if (isDepression) {
    return {
        whatWeNoticed: baseline === 'faint' || baseline === 'none'
        ? "Low energy or low mood can make body signals feel faint or far away. We will begin with small, manageable observations."
        : "You noticed some body awareness today. That can be a useful starting point, even when mood and energy fluctuate.",
      whatYourBodyDoes: "Depression can affect energy, attention, sleep, appetite, and the way emotions are felt in the body. These experiences differ across people and are not a diagnostic test.",
      whatWellTrain: "Gentle practices can give you a brief, structured moment to notice sensations such as temperature, tension, or breathing. They are a complement to professional care, not a treatment for depression.",
      citation: "Paulus & Stein (2010). Interoception in anxiety and depression. Brain Structure and Function, 214(5–6).",
    };
  }

  return {
    whatWeNoticed: baseline === 'clear'
      ? "You noticed body signals clearly in this exercise. That is a useful starting point."
      : baseline === 'faint'
      ? "Faint awareness is a valid starting point. We can build your vocabulary gradually without forcing stronger sensations."
      : "Low baseline awareness is common. We can start with brief, practical observations and see what feels useful.",
    whatYourBodyDoes: "Your insular cortex constantly receives signals from every organ and tissue. Most of this traffic never reaches consciousness, interoception is the skill of tuning in to this stream.",
    whatWellTrain: "Structured practices informed by body awareness research can help you notice, describe, and reflect on sensations with more detail over time.",
    citation: "Price, C. J. & Hooven, C. (2018). MABT. Frontiers in Psychology, 9, 798.",
  };
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const { completeOnboarding } = useApp();
  const { updateAuthProfile } = useAuth();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [wellbeing, setWellbeing] = useState(5);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [level, setLevel] = useState('beginner');
  const [bodyAwarenessVersion, setBodyAwarenessVersion] = useState<'A' | 'B'>('B');
  const [bodyAwarenessPaused, setBodyAwarenessPaused] = useState(true);
  const [baselineAnswer, setBaselineAnswer] = useState<InteroceptiveAnswer | null>(null);
  const [ahaCardsVisible, setAhaCardsVisible] = useState([false, false, false]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [crisisRedirecting, setCrisisRedirecting] = useState(false);

  const pulseScale = useSharedValue(1);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ahaMoment = getAhaMoment(selectedConditions, baselineAnswer);
  const plan = generatePlan(selectedConditions, level);
  const week1ExerciseId = plan[0]?.exerciseIds?.[0] || 'box-breathing';
  const week1Exercise = EXERCISES.find(e => e.id === week1ExerciseId);

  useEffect(() => {
    if (step === 5) {
      const needsVersion =
        selectedConditions.some(c => ['anxiety', 'panic', 'ptsd'].includes(c));
      setBodyAwarenessVersion(needsVersion ? 'A' : 'B');
      setBodyAwarenessPaused(true);
      setBaselineAnswer(null);
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
      pauseTimerRef.current = setTimeout(() => {
        setBodyAwarenessPaused(false);
      }, 3000);
    } else {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
      pulseScale.value = withTiming(1, { duration: 200 });
    }
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, [step]);

  useEffect(() => {
    if (step === 6) {
      setAhaCardsVisible([false, false, false]);
      const t1 = setTimeout(() => setAhaCardsVisible(prev => [true, prev[1], prev[2]]), 300);
      const t2 = setTimeout(() => setAhaCardsVisible(prev => [prev[0], true, prev[2]]), 1800);
      const t3 = setTimeout(() => setAhaCardsVisible(prev => [prev[0], prev[1], true]), 3300);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [step]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const toggleCondition = (id: string) => {
    setSelectedConditions(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleCrisisRedirect = () => {
    setCrisisRedirecting(true);
    setTimeout(() => {
      router.replace('/crisis');
    }, 2000);
  };

  const handleAdvanceConditions = async () => {
    try {
      await updateAuthProfile({ conditions: selectedConditions });
    } catch {}
    setStep(4);
  };

  const handleAdvanceExperience = async () => {
    try {
      await updateAuthProfile({ experienceLevel: level });
    } catch {}
    setStep(5);
  };

  const handleBaselineAnswer = async (answer: InteroceptiveAnswer) => {
    setBaselineAnswer(answer);
    const baseline = { version: bodyAwarenessVersion, answer };
    try {
      await AsyncStorage.setItem('@interosense:interoceptiveBaseline', JSON.stringify(baseline));
      await updateAuthProfile({ interoceptiveBaseline: baseline });
    } catch {}
    setTimeout(() => setStep(6), 500);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateAuthProfile({ onboardingPlan: plan as unknown as Record<string, unknown>[] });
      await completeOnboarding({
        name,
        goals: [],
        experienceLevel: level as 'beginner' | 'intermediate' | 'advanced',
        dailyMinutes: 10,
        createdAt: new Date().toISOString(),
        conditions: selectedConditions,
      });
      router.replace('/(tabs)');
    } catch (e) {
      console.error('Onboarding error:', e);
      setIsSubmitting(false);
    }
  };

  const handleBeginExercise = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const generatedPlan = plan;
      await updateAuthProfile({ onboardingPlan: generatedPlan as unknown as Record<string, unknown>[] });
      await completeOnboarding({
        name,
        goals: [],
        experienceLevel: level as 'beginner' | 'intermediate' | 'advanced',
        dailyMinutes: 10,
        createdAt: new Date().toISOString(),
        conditions: selectedConditions,
      });
      router.replace(`/exercise/${week1ExerciseId}` as any);
    } catch (e) {
      console.error('Onboarding error:', e);
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const renderProgressDots = () => (
    <View style={styles.dotsRow}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < step ? styles.dotCompleted : i === step - 1 ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );

  if (crisisRedirecting) {
    return (
      <LinearGradient colors={['#6B5B95', '#3D2F6B']} style={styles.crisisTransition}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.crisisMsg}>
          <Feather name="heart" size={40} color="#FFFFFF" style={{ marginBottom: 20 }} />
          <Text style={styles.crisisMsgTitle}>You are not alone.</Text>
          <Text style={styles.crisisMsgText}>
            Taking you to immediate support resources.
          </Text>
        </Animated.View>
      </LinearGradient>
    );
  }

  if (step === 1) {
    return (
      <LinearGradient
        colors={['#6B5B95', '#4A3580', '#3D2F6B']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <View style={[styles.step1Top, { paddingTop: topInset + 12 }]}>
          {renderProgressDots()}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.step1Content, { paddingBottom: bottomInset + 120 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(600)}>
            <View style={styles.step1IconWrap}>
              <View style={styles.step1Icon}>
                <Feather name="activity" size={36} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.step1Title}>Welcome to{'\n'}Interosense</Text>
            <Text style={styles.step1Subtitle}>
               Evidence-informed body awareness practice, personalized to your goals and comfort.
            </Text>

            <View style={styles.trustLines}>
              <TrustLine icon="shield" text="Informed by body awareness research" />
              <TrustLine icon="lock" text="Your data stays private and secure" />
              <TrustLine icon="users" text="Designed to complement professional care" />
              <TrustLine icon="star" text="Personalized to your conditions" />
            </View>

            <Text style={styles.step1Label}>What should we call you?</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Your first name"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => name.trim().length > 0 && setStep(2)}
            />
          </Animated.View>
        </ScrollView>

        <View style={[styles.step1Footer, { paddingBottom: bottomInset + 16 }]}>
          <TouchableOpacity
            onPress={() => name.trim().length > 0 ? setStep(2) : undefined}
            activeOpacity={name.trim().length > 0 ? 0.8 : 1}
            disabled={name.trim().length === 0}
          >
            <View style={[styles.whiteButton, name.trim().length === 0 && styles.whiteButtonDisabled]}>
              <Text style={[styles.whiteButtonText, name.trim().length === 0 && styles.whiteButtonTextDisabled]}>
                Continue
              </Text>
              <Feather
                name="arrow-right"
                size={20}
                color={name.trim().length > 0 ? '#3D2F6B' : 'rgba(100,80,160,0.4)'}
              />
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (step === 2) {
    const isDistress = wellbeing <= 2;
    return (
      <View style={[styles.setupContainer, { backgroundColor: Colors.background }]}>
        <LinearGradient
          colors={['#6B5B95', '#8B6BA8', Colors.background]}
          style={[styles.setupHeader, { paddingTop: topInset + 12 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.setupTopBar}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
              <Feather name="arrow-left" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.stepLabel}>Step 2 of 7</Text>
            <View style={{ width: 40 }} />
          </View>
          {renderProgressDots()}
        </LinearGradient>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.setupContent, { paddingBottom: bottomInset + 120 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(300)}>
            <Text style={styles.setupTitle}>Safety check-in</Text>
            <Text style={styles.setupSubtitle}>
              How are you feeling right now, {name}? There are no wrong answers.
            </Text>

            <View style={styles.sliderContainer}>
              <View style={styles.sliderRow}>
                <Text style={styles.sliderValue}>{wellbeing}</Text>
                <Text style={styles.sliderScale}>/ 10</Text>
              </View>
              <Text style={styles.sliderLabel}>
                {wellbeing <= 2 ? '😔 Struggling' : wellbeing <= 4 ? '😕 Difficult' : wellbeing <= 6 ? '😐 Managing' : wellbeing <= 8 ? '🙂 Good' : '😊 Great'}
              </Text>
              <View style={styles.sliderTrack}>
                {Array.from({ length: 11 }).map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.sliderPip,
                      i <= wellbeing && styles.sliderPipActive,
                      i === wellbeing && styles.sliderPipCurrent,
                    ]}
                    onPress={() => setWellbeing(i)}
                    activeOpacity={0.7}
                  />
                ))}
              </View>
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>Not well</Text>
                <Text style={styles.sliderLabelText}>Very well</Text>
              </View>
            </View>

            <Text style={styles.cardGroupLabel}>What would you like to do?</Text>

            <TouchableOpacity
              style={[styles.safetyCard, isDistress && styles.safetyCardActive]}
              onPress={handleCrisisRedirect}
              activeOpacity={0.8}
            >
              <View style={[styles.safetyCardIcon, { backgroundColor: '#FEE8E8' }]}>
                <Feather name="phone" size={22} color="#E85D5D" />
              </View>
              <View style={styles.safetyCardInfo}>
                <Text style={[styles.safetyCardTitle, isDistress && { color: '#E85D5D' }]}>
                  I need immediate support
                </Text>
                <Text style={styles.safetyCardDesc}>
                  Access crisis resources and grounding tools right now
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.safetyCard, !isDistress && styles.safetyCardActive]}
              onPress={() => setStep(3)}
              activeOpacity={0.8}
            >
              <View style={[styles.safetyCardIcon, { backgroundColor: '#EBF5F0' }]}>
                <Feather name="compass" size={22} color="#4A9E6F" />
              </View>
              <View style={styles.safetyCardInfo}>
                <Text style={[styles.safetyCardTitle, !isDistress && { color: '#4A9E6F' }]}>
                  I am okay to explore
                </Text>
                <Text style={styles.safetyCardDesc}>
                  Continue to personalise your programme
                </Text>
              </View>
            </TouchableOpacity>

            {isDistress && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.distressNote}>
                <Feather name="heart" size={16} color={Colors.primary} style={{ marginTop: 2 }} />
                <Text style={styles.distressNoteText}>
                  It takes courage to check in. Immediate support resources are waiting for you, you don't have to face this alone.
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  if (step === 3) {
    return (
      <View style={styles.setupContainer}>
        <LinearGradient
          colors={['#6B5B95', '#8B6BA8', Colors.background]}
          style={[styles.setupHeader, { paddingTop: topInset + 12 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.setupTopBar}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
              <Feather name="arrow-left" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.stepLabel}>Step 3 of 7</Text>
            <View style={{ width: 40 }} />
          </View>
          {renderProgressDots()}
        </LinearGradient>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.setupContent, { paddingBottom: bottomInset + 120 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(300)}>
            <Text style={styles.setupTitle}>What brings you here?</Text>
            <Text style={styles.setupSubtitle}>
               Select any that apply. Your choices help us tailor educational context and practice suggestions.
            </Text>

            <View style={styles.conditionsList}>
              {CONDITIONS.map(condition => {
                const isSelected = selectedConditions.includes(condition.id);
                return (
                  <TouchableOpacity
                    key={condition.id}
                    style={[styles.conditionCard, isSelected && styles.conditionCardSelected]}
                    onPress={() => toggleCondition(condition.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.conditionIcon, { backgroundColor: isSelected ? condition.color + '25' : Colors.backgroundSecondary }]}>
                      <Feather name={condition.iconName as any} size={20} color={isSelected ? condition.color : Colors.textSecondary} />
                    </View>
                    <View style={styles.conditionInfo}>
                      <Text style={[styles.conditionName, isSelected && styles.conditionNameSelected]}>{condition.name}</Text>
                      <Text style={styles.conditionDesc} numberOfLines={1}>{condition.subtitle}</Text>
                    </View>
                    {isSelected && <Feather name="check-circle" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.noneCard}
              onPress={() => setSelectedConditions([])}
              activeOpacity={0.7}
            >
              <Feather name="minus-circle" size={16} color={Colors.textSecondary} />
              <Text style={styles.noneText}>None of these / Just exploring</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>

        <View style={[styles.setupFooter, { paddingBottom: bottomInset + 16 }]}>
          <TouchableOpacity onPress={handleAdvanceConditions} activeOpacity={0.8}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.primaryButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
              <Feather name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 4) {
    return (
      <View style={styles.setupContainer}>
        <LinearGradient
          colors={['#6B5B95', '#8B6BA8', Colors.background]}
          style={[styles.setupHeader, { paddingTop: topInset + 12 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.setupTopBar}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
              <Feather name="arrow-left" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.stepLabel}>Step 4 of 7</Text>
            <View style={{ width: 40 }} />
          </View>
          {renderProgressDots()}
        </LinearGradient>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.setupContent, { paddingBottom: bottomInset + 120 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(300)}>
            <Text style={styles.setupTitle}>Your experience level</Text>
            <Text style={styles.setupSubtitle}>
              This calibrates exercise complexity, pacing, and how we explain the neuroscience behind each practice.
            </Text>

            {EXPERIENCE_LEVELS.map(exp => (
              <TouchableOpacity
                key={exp.key}
                style={[styles.experienceCard, level === exp.key && styles.experienceCardSelected]}
                onPress={() => setLevel(exp.key)}
                activeOpacity={0.7}
              >
                <View style={[styles.experienceIcon, level === exp.key && styles.experienceIconSelected]}>
                  <Feather name={exp.icon} size={22} color={level === exp.key ? '#FFFFFF' : Colors.primary} />
                </View>
                <View style={styles.experienceInfo}>
                  <Text style={[styles.experienceTitle, level === exp.key && styles.experienceTitleSelected]}>{exp.label}</Text>
                  <Text style={styles.experienceDesc}>{exp.description}</Text>
                </View>
                {level === exp.key && <Feather name="check-circle" size={22} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </Animated.View>
        </ScrollView>

        <View style={[styles.setupFooter, { paddingBottom: bottomInset + 16 }]}>
          <TouchableOpacity onPress={handleAdvanceExperience} activeOpacity={0.8}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.primaryButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
              <Feather name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 5) {
    return (
      <View style={styles.setupContainer}>
        <LinearGradient
          colors={['#6B5B95', '#8B6BA8', Colors.background]}
          style={[styles.setupHeader, { paddingTop: topInset + 12 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.setupTopBar}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
              <Feather name="arrow-left" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.stepLabel}>Step 5 of 7</Text>
            <View style={{ width: 40 }} />
          </View>
          {renderProgressDots()}
        </LinearGradient>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.setupContent, { paddingBottom: bottomInset + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(300)}>
            <Text style={styles.setupTitle}>Body awareness baseline</Text>
            <Text style={styles.setupSubtitle}>
              {bodyAwarenessVersion === 'A'
                ? 'Ground yourself first. Notice 3 things you can feel physically right now, your feet on the floor, air on your skin, your weight in the seat.'
                : 'We are measuring your interoceptive starting point. This is research data, there is no right or wrong answer.'}
            </Text>

            <View style={styles.pulseArea}>
              <Animated.View style={[styles.pulseOuter, pulseStyle]}>
                <View style={styles.pulseMiddle}>
                  <View style={styles.pulseInner}>
                    <Feather
                      name={bodyAwarenessVersion === 'A' ? 'activity' : 'heart'}
                      size={32}
                      color="#FFFFFF"
                    />
                  </View>
                </View>
              </Animated.View>

              {bodyAwarenessPaused ? (
                <Animated.View entering={FadeIn.duration(400)} style={styles.pauseText}>
                  <Text style={styles.pauseInstruction}>
                    {bodyAwarenessVersion === 'A'
                      ? 'Close your eyes and feel the ground beneath you...'
                      : 'Turn your attention inward...'}
                  </Text>
                </Animated.View>
              ) : (
                <Animated.View entering={FadeIn.duration(500)} style={styles.questionArea}>
                  <Text style={styles.bodyQuestion}>
                    {bodyAwarenessVersion === 'A'
                      ? 'Can you feel your body touching the surface beneath you right now?'
                      : 'Can you feel your heartbeat without touching your chest?'}
                  </Text>

                  <View style={styles.answerButtons}>
                    <TouchableOpacity
                      style={[styles.answerBtn, baselineAnswer === 'clear' && styles.answerBtnSelected]}
                      onPress={() => handleBaselineAnswer('clear')}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.answerBtnText, baselineAnswer === 'clear' && styles.answerBtnTextSelected]}>
                        Clearly
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.answerBtn, baselineAnswer === 'faint' && styles.answerBtnSelected]}
                      onPress={() => handleBaselineAnswer('faint')}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.answerBtnText, baselineAnswer === 'faint' && styles.answerBtnTextSelected]}>
                        Faintly
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.answerBtn, baselineAnswer === 'none' && styles.answerBtnSelected]}
                      onPress={() => handleBaselineAnswer('none')}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.answerBtnText, baselineAnswer === 'none' && styles.answerBtnTextSelected]}>
                        Not really
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  if (step === 6) {
    const cards = [
      { label: 'What we noticed', text: ahaMoment.whatWeNoticed, icon: 'eye' as const, color: '#6B5B95' },
      { label: 'What your body does', text: ahaMoment.whatYourBodyDoes, icon: 'activity' as const, color: '#88B3B5' },
      { label: 'What we will train', text: ahaMoment.whatWellTrain, icon: 'target' as const, color: '#7FB069' },
    ];

    return (
      <View style={styles.setupContainer}>
        <LinearGradient
          colors={['#6B5B95', '#8B6BA8', Colors.background]}
          style={[styles.setupHeader, { paddingTop: topInset + 12 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.setupTopBar}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
              <Feather name="arrow-left" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.stepLabel}>Step 6 of 7</Text>
            <View style={{ width: 40 }} />
          </View>
          {renderProgressDots()}
        </LinearGradient>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.setupContent, { paddingBottom: bottomInset + 120 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.setupTitle}>Your aha moment</Text>
          <Text style={styles.setupSubtitle}>
            Here is what neuroscience tells us about you, based on what you shared.
          </Text>

          {cards.map((card, idx) => (
            ahaCardsVisible[idx] ? (
              <Animated.View key={idx} entering={FadeIn.duration(600)} style={styles.ahaCard}>
                <View style={[styles.ahaCardIcon, { backgroundColor: card.color + '20' }]}>
                  <Feather name={card.icon} size={18} color={card.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.ahaCardLabel, { color: card.color }]}>{card.label}</Text>
                  <Text style={styles.ahaCardText}>{card.text}</Text>
                </View>
              </Animated.View>
            ) : (
              <View key={idx} style={[styles.ahaCard, { opacity: 0 }]} />
            )
          ))}

          {ahaCardsVisible[2] && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.citationBox}>
              <Feather name="book-open" size={13} color={Colors.textTertiary} />
              <Text style={styles.citationText}>{ahaMoment.citation}</Text>
            </Animated.View>
          )}
        </ScrollView>

        <View style={[styles.setupFooter, { paddingBottom: bottomInset + 16 }]}>
          <TouchableOpacity onPress={() => setStep(7)} activeOpacity={0.8}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.primaryButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryButtonText}>See my plan</Text>
              <Feather name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 7) {
    return (
      <View style={styles.setupContainer}>
        <LinearGradient
          colors={['#6B5B95', '#8B6BA8', Colors.background]}
          style={[styles.setupHeader, { paddingTop: topInset + 12 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.setupTopBar}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
              <Feather name="arrow-left" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.stepLabel}>Step 7 of 7</Text>
            <View style={{ width: 40 }} />
          </View>
          {renderProgressDots()}
        </LinearGradient>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.setupContent, { paddingBottom: bottomInset + 160 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(300)}>
            <Text style={styles.setupTitle}>Your 4-week plan</Text>
            <Text style={styles.setupSubtitle}>
              Personalised to your conditions and baseline. Each week builds on the last.
            </Text>

            <View style={styles.timeline}>
              {plan.map((week, idx) => (
                <View key={week.week} style={styles.timelineItem}>
                  <View style={styles.timelineLine}>
                    <View style={[styles.timelineDot, { backgroundColor: week.color }]} />
                    {idx < plan.length - 1 && <View style={[styles.timelineConnector, { backgroundColor: week.color + '40' }]} />}
                  </View>
                  <View style={[styles.weekCard, idx === 0 && styles.weekCardHighlight]}>
                    <View style={styles.weekCardHeader}>
                      <View style={[styles.weekBadge, { backgroundColor: week.color + '20' }]}>
                        <Text style={[styles.weekBadgeText, { color: week.color }]}>Week {week.week}</Text>
                      </View>
                      <Text style={styles.weekTitle}>{week.title}</Text>
                    </View>
                    <Text style={styles.weekFocus}>{week.focus}</Text>
                    {idx === 0 && week1Exercise && (
                      <View style={styles.week1Exercise}>
                        <Feather name={week1Exercise.iconName as any} size={14} color={Colors.primary} />
                        <Text style={styles.week1ExerciseText}>
                          Start with: {week1Exercise.title}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>

        <View style={[styles.planFooter, { paddingBottom: bottomInset + 16 }]}>
          <TouchableOpacity
            onPress={handleBeginExercise}
            activeOpacity={0.8}
            disabled={isSubmitting}
            style={{ marginBottom: 12 }}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={[styles.primaryButton, isSubmitting && { opacity: 0.7 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? 'Setting up...' : 'Begin My First Exercise →'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.7}
            disabled={isSubmitting}
          >
            <Text style={styles.exploreLink}>Explore the app first</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

function TrustLine({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  return (
    <View style={styles.trustLine}>
      <View style={styles.trustIcon}>
        <Feather name={icon} size={14} color="rgba(255,255,255,0.9)" />
      </View>
      <Text style={styles.trustText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  decorCircle1: { position: 'absolute', top: -80, right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(255,255,255,0.05)' },
  decorCircle2: { position: 'absolute', bottom: 160, left: -100, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,255,255,0.04)' },

  dotsRow: { flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center', marginTop: 14, marginBottom: 4 },
  dot: { height: 5, borderRadius: 2.5 },
  dotActive: { backgroundColor: '#FFFFFF', width: 22 },
  dotCompleted: { backgroundColor: 'rgba(255,255,255,0.6)', width: 16 },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.25)', width: 5 },

  step1Top: { paddingHorizontal: 24, paddingBottom: 8 },
  step1Content: { paddingHorizontal: 28, paddingTop: 8 },
  step1IconWrap: { alignItems: 'center', marginBottom: 24 },
  step1Icon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  step1Title: { fontFamily: 'Nunito_800ExtraBold', fontSize: 34, color: '#FFFFFF', textAlign: 'center', marginBottom: 12, lineHeight: 42 },
  step1Subtitle: { fontFamily: 'Nunito_400Regular', fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 23, marginBottom: 28 },
  trustLines: { gap: 12, marginBottom: 32 },
  trustLine: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trustIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  trustText: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.9)', flex: 1 },
  step1Label: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: 'rgba(255,255,255,0.85)', marginBottom: 10 },
  nameInput: {
    fontFamily: 'Nunito_400Regular', fontSize: 17, color: '#FFFFFF',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', borderRadius: 14,
    paddingHorizontal: 18, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.1)',
  },
  step1Footer: { paddingHorizontal: 28, paddingTop: 12, backgroundColor: 'transparent' },
  whiteButton: {
    backgroundColor: '#FFFFFF', borderRadius: 30, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  whiteButtonDisabled: { backgroundColor: 'rgba(255,255,255,0.35)' },
  whiteButtonText: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: '#3D2F6B' },
  whiteButtonTextDisabled: { color: 'rgba(80,60,140,0.5)' },

  crisisTransition: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  crisisMsg: { alignItems: 'center' },
  crisisMsgTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 26, color: '#FFFFFF', marginBottom: 12 },
  crisisMsgText: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 24 },

  setupContainer: { flex: 1, backgroundColor: Colors.background },
  setupHeader: { paddingHorizontal: 24, paddingBottom: 20 },
  setupTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  stepLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  setupContent: { paddingHorizontal: 24, paddingTop: 24 },
  setupTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 24, color: Colors.text, marginBottom: 8 },
  setupSubtitle: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 21, marginBottom: 24 },
  setupFooter: { paddingHorizontal: 24, paddingTop: 12, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  planFooter: { paddingHorizontal: 24, paddingTop: 12, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  primaryButton: { borderRadius: 30, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: '#FFFFFF' },
  exploreLink: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 8 },

  sliderContainer: { marginBottom: 28, backgroundColor: Colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.borderLight },
  sliderRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 4 },
  sliderValue: { fontFamily: 'Nunito_800ExtraBold', fontSize: 40, color: Colors.primary },
  sliderScale: { fontFamily: 'Nunito_500Medium', fontSize: 16, color: Colors.textSecondary },
  sliderLabel: { fontFamily: 'Nunito_500Medium', fontSize: 15, color: Colors.textSecondary, marginBottom: 16 },
  sliderTrack: { flexDirection: 'row', gap: 4, justifyContent: 'space-between', marginBottom: 8 },
  sliderPip: { flex: 1, height: 8, borderRadius: 4, backgroundColor: Colors.backgroundSecondary },
  sliderPipActive: { backgroundColor: Colors.primary + '60' },
  sliderPipCurrent: { backgroundColor: Colors.primary, height: 12, borderRadius: 6 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabelText: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.textTertiary },
  cardGroupLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  safetyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 2, borderColor: Colors.border,
  },
  safetyCardActive: { borderColor: Colors.primary, backgroundColor: '#F5F0FF' },
  safetyCardIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  safetyCardInfo: { flex: 1 },
  safetyCardTitle: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.text },
  safetyCardDesc: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  distressNote: { flexDirection: 'row', gap: 10, backgroundColor: '#F5F0FF', borderRadius: 12, padding: 14, marginTop: 8 },
  distressNoteText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.text, flex: 1, lineHeight: 19 },

  conditionsList: { gap: 10 },
  conditionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 2, borderColor: Colors.border,
  },
  conditionCardSelected: { borderColor: Colors.primary, backgroundColor: '#F5F0FF' },
  conditionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  conditionInfo: { flex: 1 },
  conditionName: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.text },
  conditionNameSelected: { color: Colors.primary },
  conditionDesc: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  noneCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 16, paddingVertical: 14, borderRadius: 14,
    backgroundColor: Colors.backgroundSecondary,
  },
  noneText: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: Colors.textSecondary },

  experienceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 2, borderColor: Colors.border,
  },
  experienceCardSelected: { borderColor: Colors.primary, backgroundColor: '#F5F0FF' },
  experienceIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  experienceIconSelected: { backgroundColor: Colors.primary },
  experienceInfo: { flex: 1 },
  experienceTitle: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.text },
  experienceTitleSelected: { color: Colors.primary },
  experienceDesc: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  pulseArea: { alignItems: 'center', paddingVertical: 20 },
  pulseOuter: { width: 140, height: 140, borderRadius: 70, backgroundColor: Colors.primary + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  pulseMiddle: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primary + '28', alignItems: 'center', justifyContent: 'center' },
  pulseInner: { width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  pauseText: { alignItems: 'center', paddingHorizontal: 20 },
  pauseInstruction: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, fontStyle: 'italic' },
  questionArea: { alignItems: 'center', paddingHorizontal: 8, width: '100%' },
  bodyQuestion: { fontFamily: 'Nunito_600SemiBold', fontSize: 17, color: Colors.text, textAlign: 'center', lineHeight: 26, marginBottom: 24 },
  answerButtons: { flexDirection: 'row', gap: 10, width: '100%', justifyContent: 'center' },
  answerBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.border,
  },
  answerBtnSelected: { borderColor: Colors.primary, backgroundColor: '#F5F0FF' },
  answerBtnText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.text },
  answerBtnTextSelected: { color: Colors.primary },

  ahaCard: {
    flexDirection: 'row', gap: 14, backgroundColor: Colors.surface,
    borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  ahaCardIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  ahaCardLabel: { fontFamily: 'Nunito_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  ahaCardText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text, lineHeight: 20 },
  citationBox: { flexDirection: 'row', gap: 8, backgroundColor: Colors.backgroundSecondary, borderRadius: 10, padding: 12, marginTop: 4, alignItems: 'flex-start' },
  citationText: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.textTertiary, lineHeight: 16, flex: 1, fontStyle: 'italic' },

  timeline: { gap: 0 },
  timelineItem: { flexDirection: 'row', gap: 12 },
  timelineLine: { alignItems: 'center', width: 20 },
  timelineDot: { width: 16, height: 16, borderRadius: 8, marginTop: 18 },
  timelineConnector: { width: 2, flex: 1, marginTop: 4, marginBottom: 4 },
  weekCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  weekCardHighlight: { borderColor: Colors.primary, borderWidth: 2 },
  weekCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  weekBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  weekBadgeText: { fontFamily: 'Nunito_700Bold', fontSize: 11, textTransform: 'uppercase' },
  weekTitle: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.text, flex: 1 },
  weekFocus: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  week1Exercise: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: Colors.primary + '12', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  week1ExerciseText: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: Colors.primary },
});
