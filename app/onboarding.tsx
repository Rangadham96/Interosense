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
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const INTRO_PAGES = [
  {
    icon: 'activity' as const,
    title: 'Welcome to\nInterosense',
    subtitle: "Discover interoceptive awareness - your ability to sense and understand your body's internal signals.",
    gradientColors: ['#6B5B95', '#3D2F6B'] as [string, string],
    decorColor: 'rgba(139,125,181,0.3)',
  },
  {
    icon: 'heart' as const,
    title: 'Your Hidden\nEighth Sense',
    subtitle: "Feel your heartbeat, sense your breath, notice tension, and detect emotions in your body before your mind catches up.",
    gradientColors: ['#5A9EA0', '#3A7578'] as [string, string],
    decorColor: 'rgba(136,179,181,0.3)',
  },
  {
    icon: 'sunrise' as const,
    title: 'Transform\nYour Wellbeing',
    subtitle: "Through guided exercises, daily check-ins, and body mapping, build a deeper connection with yourself.",
    gradientColors: ['#C4848A', '#9B5A60'] as [string, string],
    decorColor: 'rgba(232,180,184,0.3)',
    benefits: [
      'Reduce anxiety and stress',
      'Improve emotional intelligence',
      'Enhance overall wellbeing',
    ],
  },
];

const EXPERIENCE_LEVELS = [
  { key: 'beginner', label: 'Beginner', description: 'New to body awareness', icon: 'compass' as const },
  { key: 'intermediate', label: 'Intermediate', description: 'Some meditation experience', icon: 'trending-up' as const },
  { key: 'advanced', label: 'Advanced', description: 'Regular mindfulness practitioner', icon: 'award' as const },
];

const DAILY_OPTIONS = [5, 10, 15, 20, 30];

const FOCUS_AREAS = [
  'Reduce anxiety',
  'Better sleep',
  'Pain management',
  'Emotional awareness',
  'Stress relief',
  'Mindfulness',
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const { completeOnboarding } = useApp();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [level, setLevel] = useState('beginner');
  const [dailyMinutes, setDailyMinutes] = useState(10);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = INTRO_PAGES.length + 1;
  const isSetupStep = step >= INTRO_PAGES.length;

  const handleNext = () => {
    setStep(prev => Math.min(prev + 1, totalSteps - 1));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 0));
  };

  const handleSkip = () => {
    setStep(INTRO_PAGES.length);
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await completeOnboarding({
        name: name,
        goals: selectedGoals,
        experienceLevel: level,
        dailyMinutes: dailyMinutes,
        createdAt: new Date().toISOString(),
      });
      router.replace('/(tabs)');
    } catch (e) {
      console.error('Onboarding error:', e);
      setIsSubmitting(false);
    }
  };

  if (isSetupStep) {
    return (
      <View style={[styles.setupContainer]}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryLight, Colors.background]}
          style={[styles.setupHeader, { paddingTop: topInset + 12 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <TouchableOpacity style={styles.setupBackBtn} onPress={handleBack} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.setupHeaderTitle}>Create Your Profile</Text>
          <Text style={styles.setupHeaderSub}>Personalize your experience</Text>
        </LinearGradient>

        <ScrollView
          style={styles.setupScroll}
          contentContainerStyle={[styles.setupContent, { paddingBottom: bottomInset + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>What should we call you?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Your name"
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Experience Level</Text>
            {EXPERIENCE_LEVELS.map(exp => (
              <TouchableOpacity
                key={exp.key}
                style={[
                  styles.experienceCard,
                  level === exp.key && styles.experienceCardSelected,
                ]}
                onPress={() => setLevel(exp.key)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.experienceIcon,
                  level === exp.key && styles.experienceIconSelected,
                ]}>
                  <Feather
                    name={exp.icon}
                    size={22}
                    color={level === exp.key ? '#FFFFFF' : Colors.primary}
                  />
                </View>
                <View style={styles.experienceInfo}>
                  <Text style={[
                    styles.experienceTitle,
                    level === exp.key && styles.experienceTitleSelected,
                  ]}>
                    {exp.label}
                  </Text>
                  <Text style={styles.experienceDesc}>{exp.description}</Text>
                </View>
                {level === exp.key && (
                  <Feather name="check-circle" size={22} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Daily Goal</Text>
            <View style={styles.pillsRow}>
              {DAILY_OPTIONS.map(min => (
                <TouchableOpacity
                  key={min}
                  style={[
                    styles.pill,
                    dailyMinutes === min && styles.pillSelected,
                  ]}
                  onPress={() => setDailyMinutes(min)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.pillText,
                    dailyMinutes === min && styles.pillTextSelected,
                  ]}>
                    {min} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Focus Areas</Text>
            <View style={styles.chipsGrid}>
              {FOCUS_AREAS.map(area => (
                <TouchableOpacity
                  key={area}
                  style={[
                    styles.chip,
                    selectedGoals.includes(area) && styles.chipSelected,
                  ]}
                  onPress={() => toggleGoal(area)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.chipText,
                    selectedGoals.includes(area) && styles.chipTextSelected,
                  ]}>
                    {area}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={[styles.setupFooter, { paddingBottom: bottomInset + 16 }]}>
          <TouchableOpacity onPress={handleSubmit} activeOpacity={0.8} disabled={isSubmitting}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={[styles.getStartedButton, isSubmitting && { opacity: 0.7 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.getStartedText}>
                {isSubmitting ? 'Setting up...' : 'Get Started'}
              </Text>
              {!isSubmitting && <Feather name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const page = INTRO_PAGES[step];

  return (
    <LinearGradient
      colors={page.gradientColors}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.3, y: 1 }}
    >
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />
      <View style={[styles.decorCircle3, { backgroundColor: page.decorColor }]} />

      <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
        <View style={{ width: 60 }}>
          {step > 0 && (
            <TouchableOpacity onPress={handleBack} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Feather name="arrow-left" size={24} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.dotsRow}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === step ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={{ width: 60, alignItems: 'flex-end' }}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pageContent}>
        <Animated.View
          key={step}
          entering={FadeIn.duration(400)}
          style={styles.pageInner}
        >
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
        <TouchableOpacity onPress={handleNext} activeOpacity={0.85}>
          <View style={styles.nextButton}>
            <Text style={styles.nextButtonText}>
              {step === INTRO_PAGES.length - 1 ? "Let's Begin" : 'Continue'}
            </Text>
            <Feather name="arrow-right" size={20} color={page.gradientColors[0]} />
          </View>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorCircle1: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: 120,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  decorCircle3: {
    position: 'absolute',
    top: '40%' as any,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  skipText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 28,
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    width: 6,
  },
  pageContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  pageInner: {
    alignItems: 'center',
  },
  iconOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  iconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 34,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 42,
  },
  pageSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  benefitsList: {
    marginTop: 28,
    gap: 12,
    alignSelf: 'stretch',
    paddingHorizontal: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  bottomArea: {
    paddingHorizontal: 28,
  },
  nextButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 17,
    color: '#3D2F6B',
  },
  setupContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  setupHeader: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  setupBackBtn: {
    marginBottom: 16,
  },
  setupHeaderTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  setupHeaderSub: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
  },
  setupScroll: {
    flex: 1,
  },
  setupContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  formSection: {
    marginBottom: 28,
  },
  formLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: Colors.text,
    marginBottom: 12,
  },
  textInput: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
  },
  experienceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 14,
  },
  experienceCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F5F0FF',
  },
  experienceIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  experienceIconSelected: {
    backgroundColor: Colors.primary,
  },
  experienceInfo: {
    flex: 1,
  },
  experienceTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: Colors.text,
  },
  experienceTitleSelected: {
    color: Colors.primary,
  },
  experienceDesc: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  pillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  setupFooter: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  getStartedButton: {
    borderRadius: 30,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
});
