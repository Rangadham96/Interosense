import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Dimensions,
  FlatList,
  ViewToken,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const INTRO_PAGES = [
  {
    icon: 'activity' as const,
    title: 'Welcome to Interosense',
    subtitle: "Discover the power of interoceptive awareness - your ability to sense and understand your body's internal signals.",
    gradientColors: [Colors.primary, Colors.primaryDark] as [string, string],
  },
  {
    icon: 'heart' as const,
    title: 'What is Interoception?',
    subtitle: "It's your hidden eighth sense - the ability to feel your heartbeat, sense your breath, notice tension, and detect emotions in your body before your mind catches up.",
    gradientColors: [Colors.secondary, Colors.secondaryDark] as [string, string],
  },
  {
    icon: 'trending-up' as const,
    title: 'Build Awareness',
    subtitle: "Through guided exercises, daily check-ins, and body mapping, you'll develop a deeper connection with your body and unlock better emotional regulation.",
    gradientColors: [Colors.accent, Colors.accentDark] as [string, string],
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

function DotIndicators({ total, current }: { total: number; current: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === current ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

function IntroPage({ page, index }: { page: typeof INTRO_PAGES[0]; index: number }) {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <LinearGradient
      colors={page.gradientColors}
      style={[styles.introPage, { width: SCREEN_WIDTH }]}
    >
      <View style={[styles.introContent, { paddingTop: topPadding + 60 }]}>
        <View style={styles.iconCircle}>
          <Feather name={page.icon} size={80} color="#FFFFFF" />
        </View>
        <Text style={styles.introTitle}>{page.title}</Text>
        <Text style={styles.introSubtitle}>{page.subtitle}</Text>
        {page.benefits && (
          <View style={styles.benefitsList}>
            {page.benefits.map((benefit, i) => (
              <View key={i} style={styles.benefitRow}>
                <Feather name="check" size={20} color="#FFFFFF" />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;
  const { completeOnboarding } = useApp();

  const [currentPage, setCurrentPage] = useState(0);
  const [showSetup, setShowSetup] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const currentPageRef = useRef(0);

  const [name, setName] = useState('');
  const [level, setLevel] = useState('beginner');
  const [dailyMinutes, setDailyMinutes] = useState(10);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPages = INTRO_PAGES.length + 1;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      currentPageRef.current = viewableItems[0].index;
      setCurrentPage(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    const page = currentPageRef.current;
    if (page < INTRO_PAGES.length - 1) {
      const nextPage = page + 1;
      currentPageRef.current = nextPage;
      setCurrentPage(nextPage);
      flatListRef.current?.scrollToIndex({ index: nextPage, animated: true });
    } else {
      setShowSetup(true);
    }
  };

  const handleBack = () => {
    if (showSetup) {
      setShowSetup(false);
    } else {
      const page = currentPageRef.current;
      if (page > 0) {
        const prevPage = page - 1;
        currentPageRef.current = prevPage;
        setCurrentPage(prevPage);
        flatListRef.current?.scrollToIndex({ index: prevPage, animated: true });
      }
    }
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

  if (showSetup) {
    return (
      <View style={[styles.setupContainer, { paddingTop: topPadding + 20 }]}>
        <ScrollView
          style={styles.setupScroll}
          contentContainerStyle={[styles.setupContent, { paddingBottom: bottomPadding + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Feather name="arrow-left" size={24} color={Colors.text} />
          </TouchableOpacity>

          <Text style={styles.setupTitle}>Let's Set Up Your Profile</Text>

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

        <View style={[styles.setupFooter, { paddingBottom: bottomPadding + 16 }]}>
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
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={INTRO_PAGES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => <IntroPage page={item} index={index} />}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
      />
      <View style={[styles.bottomBar, { paddingBottom: bottomPadding + 16 }]}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={handleBack}
          activeOpacity={0.7}
          disabled={currentPage === 0}
        >
          {currentPage > 0 && (
            <Text style={styles.navButtonText}>Back</Text>
          )}
        </TouchableOpacity>

        <DotIndicators total={totalPages} current={showSetup ? INTRO_PAGES.length : currentPage} />

        <TouchableOpacity
          style={styles.navButton}
          onPress={handleNext}
          activeOpacity={0.7}
        >
          <Text style={styles.navButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  introPage: {
    flex: 1,
    height: SCREEN_HEIGHT,
  },
  introContent: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  introTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  introSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  benefitsList: {
    marginTop: 32,
    alignSelf: 'stretch',
    gap: 14,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  navButton: {
    width: 70,
    alignItems: 'center',
  },
  navButtonText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  setupContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  setupScroll: {
    flex: 1,
  },
  setupContent: {
    paddingHorizontal: 24,
  },
  backButton: {
    marginBottom: 16,
  },
  setupTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 28,
    color: Colors.text,
    marginBottom: 28,
  },
  formSection: {
    marginBottom: 28,
  },
  formLabel: {
    fontFamily: 'Nunito_600SemiBold',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
});
