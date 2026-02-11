import React, { useState } from 'react';
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
import Animated, { FadeIn } from 'react-native-reanimated';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';
import { CONDITIONS } from '@/constants/conditions';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const INTRO_PAGES = [
  {
    icon: 'activity' as const,
    title: 'Welcome to\nInteroSense',
    subtitle: "Discover interoceptive awareness - your ability to sense and understand your body's internal signals. Backed by clinical research.",
    gradientColors: ['#6B5B95', '#3D2F6B'] as [string, string],
    decorColor: 'rgba(139,125,181,0.3)',
  },
  {
    icon: 'heart' as const,
    title: 'Your Hidden\nEighth Sense',
    subtitle: "Feel your heartbeat, sense your breath, notice tension. Interoception shapes emotion regulation, decision-making, and mental health.",
    gradientColors: ['#5A9EA0', '#3A7578'] as [string, string],
    decorColor: 'rgba(136,179,181,0.3)',
  },
  {
    icon: 'sunrise' as const,
    title: 'Science-Backed\nWellness',
    subtitle: "Evidence-based exercises using MABT methodology and Kelly Mahler's framework. Clinical assessments. Personalized recommendations.",
    gradientColors: ['#C4848A', '#9B5A60'] as [string, string],
    decorColor: 'rgba(232,180,184,0.3)',
    benefits: [
      'Clinical symptom tracking (GAD-7, PHQ-9)',
      'Personalized exercise recommendations',
      'Condition-specific programs',
    ],
  },
];

const EXPERIENCE_LEVELS = [
  { key: 'beginner', label: 'Beginner', description: 'New to body awareness practices', icon: 'compass' as const },
  { key: 'intermediate', label: 'Intermediate', description: 'Some meditation or mindfulness experience', icon: 'trending-up' as const },
  { key: 'advanced', label: 'Advanced', description: 'Regular mindfulness or somatic practitioner', icon: 'award' as const },
];

const DAILY_OPTIONS = [5, 10, 15, 20, 30];

type SetupStep = 'name' | 'conditions' | 'experience' | 'goals';

const SETUP_STEPS: SetupStep[] = ['name', 'conditions', 'experience', 'goals'];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const { completeOnboarding } = useApp();

  const [introStep, setIntroStep] = useState(0);
  const [setupIndex, setSetupIndex] = useState(-1);
  const [name, setName] = useState('');
  const [level, setLevel] = useState('beginner');
  const [dailyMinutes, setDailyMinutes] = useState(10);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSetup = setupIndex >= 0;
  const currentSetup = isSetup ? SETUP_STEPS[setupIndex] : null;
  const totalDots = INTRO_PAGES.length + SETUP_STEPS.length;
  const currentDot = isSetup ? INTRO_PAGES.length + setupIndex : introStep;

  const handleIntroNext = () => {
    if (introStep < INTRO_PAGES.length - 1) {
      setIntroStep(prev => prev + 1);
    } else {
      setSetupIndex(0);
    }
  };

  const handleIntroBack = () => {
    if (introStep > 0) setIntroStep(prev => prev - 1);
  };

  const handleSetupNext = () => {
    if (setupIndex < SETUP_STEPS.length - 1) {
      setSetupIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSetupBack = () => {
    if (setupIndex > 0) {
      setSetupIndex(prev => prev - 1);
    } else {
      setIntroStep(INTRO_PAGES.length - 1);
      setSetupIndex(-1);
    }
  };

  const handleSkip = () => {
    setSetupIndex(0);
  };

  const toggleCondition = (id: string) => {
    setSelectedConditions(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await completeOnboarding({
        name: name,
        goals: [],
        experienceLevel: level as 'beginner' | 'intermediate' | 'advanced',
        dailyMinutes: dailyMinutes,
        createdAt: new Date().toISOString(),
        conditions: selectedConditions,
      });
      router.replace('/(tabs)');
    } catch (e) {
      console.error('Onboarding error:', e);
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentSetup) {
      case 'name': return name.trim().length > 0;
      default: return true;
    }
  };

  const getSetupLabel = () => {
    switch (currentSetup) {
      case 'name': return 'Step 1 of 4';
      case 'conditions': return 'Step 2 of 4';
      case 'experience': return 'Step 3 of 4';
      case 'goals': return 'Step 4 of 4';
      default: return '';
    }
  };

  const getButtonLabel = () => {
    if (setupIndex === SETUP_STEPS.length - 1) return isSubmitting ? 'Setting up...' : 'Get Started';
    return 'Continue';
  };

  if (isSetup) {
    return (
      <View style={styles.setupContainer}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryLight, Colors.background]}
          style={[styles.setupHeader, { paddingTop: topInset + 12 }]}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        >
          <View style={styles.setupTopBar}>
            <TouchableOpacity style={styles.setupBackBtn} onPress={handleSetupBack} activeOpacity={0.7}>
              <Feather name="arrow-left" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.setupStepLabel}>{getSetupLabel()}</Text>
            {setupIndex < SETUP_STEPS.length - 1 && (
              <TouchableOpacity onPress={handleSetupNext} activeOpacity={0.7}>
                <Text style={styles.skipSetupText}>Skip</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.dotsRowSetup}>
            {Array.from({ length: totalDots }).map((_, i) => (
              <View key={i} style={[styles.dot, i <= currentDot ? styles.dotActive : styles.dotInactive]} />
            ))}
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.setupScroll}
          contentContainerStyle={[styles.setupContent, { paddingBottom: bottomInset + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {currentSetup === 'name' && (
            <Animated.View entering={FadeIn.duration(300)}>
              <Text style={styles.setupTitle}>What should we call you?</Text>
              <Text style={styles.setupSubtitle}>We'll use your name to personalize your experience</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Your name"
                placeholderTextColor={Colors.textTertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoFocus
              />
            </Animated.View>
          )}

          {currentSetup === 'conditions' && (
            <Animated.View entering={FadeIn.duration(300)}>
              <Text style={styles.setupTitle}>What brings you here?</Text>
              <Text style={styles.setupSubtitle}>Select any conditions you'd like to focus on. This helps us personalize your exercises and recommendations.</Text>

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
          )}

          {currentSetup === 'experience' && (
            <Animated.View entering={FadeIn.duration(300)}>
              <Text style={styles.setupTitle}>Your experience level</Text>
              <Text style={styles.setupSubtitle}>This helps us recommend the right exercises for you</Text>

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
          )}

          {currentSetup === 'goals' && (
            <Animated.View entering={FadeIn.duration(300)}>
              <Text style={styles.setupTitle}>Daily practice goal</Text>
              <Text style={styles.setupSubtitle}>How many minutes per day would you like to practice? You can change this anytime.</Text>

              <View style={styles.pillsRow}>
                {DAILY_OPTIONS.map(min => (
                  <TouchableOpacity
                    key={min}
                    style={[styles.timePill, dailyMinutes === min && styles.timePillSelected]}
                    onPress={() => setDailyMinutes(min)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.timePillNumber, dailyMinutes === min && styles.timePillNumberSelected]}>{min}</Text>
                    <Text style={[styles.timePillLabel, dailyMinutes === min && styles.timePillLabelSelected]}>min</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Your personalized plan</Text>
                <View style={styles.summaryRow}>
                  <Feather name="user" size={14} color={Colors.primary} />
                  <Text style={styles.summaryText}>{name || 'Your'} journey</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Feather name="bar-chart-2" size={14} color={Colors.primary} />
                  <Text style={styles.summaryText}>{level.charAt(0).toUpperCase() + level.slice(1)} level</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Feather name="clock" size={14} color={Colors.primary} />
                  <Text style={styles.summaryText}>{dailyMinutes} minutes daily</Text>
                </View>
                {selectedConditions.length > 0 && (
                  <View style={styles.summaryRow}>
                    <Feather name="target" size={14} color={Colors.primary} />
                    <Text style={styles.summaryText}>
                      {selectedConditions.length} focus area{selectedConditions.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}
        </ScrollView>

        <View style={[styles.setupFooter, { paddingBottom: bottomInset + 16 }]}>
          <TouchableOpacity
            onPress={canProceed() ? handleSetupNext : undefined}
            activeOpacity={0.8}
            disabled={!canProceed() || isSubmitting}
          >
            <LinearGradient
              colors={canProceed() ? [Colors.primary, Colors.primaryDark] : [Colors.textTertiary, Colors.textTertiary]}
              style={[styles.getStartedButton, isSubmitting && { opacity: 0.7 }]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={styles.getStartedText}>{getButtonLabel()}</Text>
              {!isSubmitting && <Feather name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const page = INTRO_PAGES[introStep];

  return (
    <LinearGradient
      colors={page.gradientColors}
      style={styles.container}
      start={{ x: 0, y: 0 }} end={{ x: 0.3, y: 1 }}
    >
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />
      <View style={[styles.decorCircle3, { backgroundColor: page.decorColor }]} />

      <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
        <View style={{ width: 60 }}>
          {introStep > 0 && (
            <TouchableOpacity onPress={handleIntroBack} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Feather name="arrow-left" size={24} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.dotsRow}>
          {Array.from({ length: totalDots }).map((_, i) => (
            <View key={i} style={[styles.dot, i === currentDot ? styles.dotActive : styles.dotInactive]} />
          ))}
        </View>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={{ width: 60, alignItems: 'flex-end' as const }}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pageContent}>
        <Animated.View key={introStep} entering={FadeIn.duration(400)} style={styles.pageInner}>
          <View style={styles.iconOuter}>
            <View style={styles.iconInner}>
              <Feather name={page.icon} size={48} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.pageTitle}>{page.title}</Text>
          <Text style={styles.pageSubtitle}>{page.subtitle}</Text>

          {page.benefits && (
            <View style={styles.benefitsList}>
              {page.benefits.map((benefit, i) => (
                <View key={i} style={styles.benefitRow}>
                  <View style={styles.checkBadge}>
                    <Feather name="check" size={14} color="#FFFFFF" />
                  </View>
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </View>

      <View style={[styles.bottomArea, { paddingBottom: bottomInset + 20 }]}>
        <TouchableOpacity onPress={handleIntroNext} activeOpacity={0.85}>
          <View style={styles.nextButton}>
            <Text style={styles.nextButtonText}>
              {introStep === INTRO_PAGES.length - 1 ? "Let's Begin" : 'Continue'}
            </Text>
            <Feather name="arrow-right" size={20} color={page.gradientColors[0]} />
          </View>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  decorCircle1: { position: 'absolute', top: -80, right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(255,255,255,0.06)' },
  decorCircle2: { position: 'absolute', bottom: 120, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.04)' },
  decorCircle3: { position: 'absolute', top: '40%' as any, right: -40, width: 160, height: 160, borderRadius: 80 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8 },
  skipText: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: 'rgba(255,255,255,0.7)' },
  dotsRow: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dotsRowSetup: { flexDirection: 'row', gap: 5, alignItems: 'center', marginTop: 14 },
  dot: { height: 5, borderRadius: 2.5 },
  dotActive: { backgroundColor: '#FFFFFF', width: 22 },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.3)', width: 5 },
  pageContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  pageInner: { alignItems: 'center' },
  iconOuter: { width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  iconInner: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 34, color: '#FFFFFF', textAlign: 'center', marginBottom: 16, lineHeight: 42 },
  pageSubtitle: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 24, maxWidth: 320 },
  benefitsList: { marginTop: 28, gap: 12, alignSelf: 'stretch', paddingHorizontal: 12 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  benefitText: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#FFFFFF' },
  bottomArea: { paddingHorizontal: 28 },
  nextButton: { backgroundColor: '#FFFFFF', borderRadius: 30, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  nextButtonText: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: '#3D2F6B' },

  setupContainer: { flex: 1, backgroundColor: Colors.background },
  setupHeader: { paddingHorizontal: 24, paddingBottom: 20 },
  setupTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  setupBackBtn: { width: 40, height: 40, justifyContent: 'center' },
  setupStepLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  skipSetupText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  setupScroll: { flex: 1 },
  setupContent: { paddingHorizontal: 24, paddingTop: 24 },
  setupTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 24, color: Colors.text, marginBottom: 8 },
  setupSubtitle: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 21, marginBottom: 24 },
  textInput: {
    fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.text,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14,
    paddingHorizontal: 18, paddingVertical: 14, backgroundColor: Colors.surface,
  },
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
  pillsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32 },
  timePill: {
    width: (SCREEN_WIDTH - 48 - 40) / 5, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 16,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
  },
  timePillSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timePillNumber: { fontFamily: 'Nunito_800ExtraBold', fontSize: 20, color: Colors.text },
  timePillNumberSelected: { color: '#FFFFFF' },
  timePillLabel: { fontFamily: 'Nunito_500Medium', fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  timePillLabelSelected: { color: 'rgba(255,255,255,0.8)' },
  summaryCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: Colors.borderLight, gap: 12,
  },
  summaryTitle: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.text, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryText: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: Colors.textSecondary },
  setupFooter: {
    paddingHorizontal: 24, paddingTop: 12,
    backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  getStartedButton: { borderRadius: 30, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  getStartedText: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: '#FFFFFF' },
});
