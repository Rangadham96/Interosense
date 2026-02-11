import React, { useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';
import { CATEGORY_INFO, ExerciseCategory } from '@/constants/exercises';
import { CONDITIONS } from '@/constants/conditions';
import { format, parseISO } from 'date-fns';
import Svg, { Circle } from 'react-native-svg';
import type { Recommendation, InsightCard } from '@/lib/personalization-engine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DAILY_QUOTES: { text: string; source: string }[] = [
  { text: "Interoception is the sense that allows us to answer the question, 'How do I feel?' It is the foundation of self-awareness.", source: "A.D. Craig, Neuroscientist" },
  { text: "The body keeps the score. If the memory of trauma is encoded in the viscera, in heartbreaking and gut-wrenching emotions, then the pathway to recovery is found through the body.", source: "Bessel van der Kolk, MD" },
  { text: "Awareness of internal bodily signals is a key component of emotional experience and regulation.", source: "Lisa Feldman Barrett, PhD" },
  { text: "Mindfulness is paying attention, on purpose, in the present moment, non-judgmentally, as if your life depended on it.", source: "Jon Kabat-Zinn, PhD" },
  { text: "The capacity to notice what you are feeling at any given moment is the cornerstone of emotional intelligence.", source: "Daniel Goleman, PhD" },
  { text: "Between stimulus and response there is a space. In that space is our freedom and power to choose our response.", source: "Viktor Frankl, MD, PhD" },
  { text: "People with greater interoceptive accuracy tend to experience emotions more intensely and make more intuitive decisions.", source: "Hugo Critchley, Neuroscientist" },
  { text: "Resilience is not about bouncing back. It is about learning to move forward with a deeper understanding of yourself.", source: "Ann Masten, PhD" },
  { text: "The mind and body are not separate entities. What affects one profoundly affects the other.", source: "Candace Pert, PhD" },
  { text: "Your heartbeat is a constant companion. Learning to listen to it is the first step in body awareness.", source: "Sarah Garfinkel, PhD" },
  { text: "Feelings are not just the shady side of reason; they are the foundation upon which it is built.", source: "Antonio Damasio, MD, PhD" },
  { text: "The greatest weapon against stress is our ability to choose one thought over another, grounded in bodily awareness.", source: "William James, Psychologist" },
  { text: "Interoceptive awareness acts as a bridge between the conscious mind and the body's physiological state.", source: "Sahib Khalsa, MD, PhD" },
  { text: "Every cell in your body is eavesdropping on your thoughts. Awareness of this connection is empowerment.", source: "Deepak Chopra, MD" },
  { text: "Self-regulation begins with body regulation. You cannot manage what you cannot feel.", source: "Stephen Porges, PhD" },
  { text: "The breath is the intersection of biology and psychology, the bridge between the conscious and unconscious.", source: "Herbert Benson, MD" },
  { text: "Tuning into the body's signals is not a luxury. It is a fundamental requirement for psychological well-being.", source: "Peter Levine, PhD" },
  { text: "Our bodies communicate to us clearly and specifically, if we are willing to listen.", source: "Shakti Gawain, Author" },
  { text: "Neuroplasticity means your brain is always changing. Each moment of mindful attention reshapes neural pathways.", source: "Richard Davidson, PhD" },
  { text: "The quality of our breath expresses our inner feelings. Conscious breathing calms the autonomic nervous system.", source: "Tich Nhat Hanh" },
  { text: "Emotions are not mental states that happen to have bodily expressions. They are bodily states that happen to be mentally interpreted.", source: "Lisa Feldman Barrett, PhD" },
  { text: "Chronic stress rewires the brain. Interoceptive practice helps restore the balance between alertness and calm.", source: "Bruce McEwen, PhD" },
  { text: "When we pay attention to our bodies, we discover a wealth of intelligence that the thinking mind alone cannot access.", source: "Jon Kabat-Zinn, PhD" },
  { text: "The vagus nerve is the body's superhighway for calming signals. Practices that engage it build resilience over time.", source: "Stephen Porges, PhD" },
  { text: "Mindful awareness of the body is the doorway to understanding the patterns that shape our lives.", source: "Daniel Siegel, MD" },
  { text: "Heart rate variability reflects the flexibility of our autonomic nervous system. Greater flexibility means greater resilience.", source: "Fred Shaffer, PhD" },
  { text: "Somatic awareness is not about fixing the body. It is about listening to what the body already knows.", source: "Thomas Hanna, PhD" },
  { text: "The interoceptive system provides a moment-by-moment map of the body's internal landscape, essential for homeostasis.", source: "A.D. Craig, Neuroscientist" },
  { text: "Compassion for oneself begins with noticing the body's distress without judgment and responding with care.", source: "Kristin Neff, PhD" },
  { text: "Each time you notice a sensation and stay with it, you strengthen the neural circuits of self-awareness.", source: "Norman Farb, PhD" },
  { text: "The body is not something we have. It is something we are. Reconnecting with it is reconnecting with ourselves.", source: "Maurice Merleau-Ponty, Philosopher" },
  { text: "Attention to interoceptive signals can reduce alexithymia and improve one's capacity to identify and describe emotions.", source: "Olga Pollatos, PhD" },
];

function ProgressRing({ progress, size = 100, strokeWidth = 8 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference * (1 - clampedProgress);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={Colors.borderLight} strokeWidth={strokeWidth} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={Colors.primary} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${circumference}`} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={styles.progressPercent}>{Math.round(clampedProgress * 100)}%</Text>
      </View>
    </View>
  );
}

function InsightCardView({ insight }: { insight: InsightCard }) {
  return (
    <View style={[styles.insightCard, { borderLeftColor: insight.color }]}>
      <View style={styles.insightHeader}>
        <Feather name={insight.iconName as any} size={16} color={insight.color} />
        <Text style={styles.insightTitle}>{insight.title}</Text>
      </View>
      <Text style={styles.insightBody}>{insight.body}</Text>
    </View>
  );
}

function RecommendationCard({ rec, onPress }: { rec: Recommendation; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.recCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.recIconBox, { backgroundColor: rec.color + '18' }]}>
        <Feather name={rec.iconName as any} size={20} color={rec.color} />
      </View>
      <View style={styles.recContent}>
        <Text style={styles.recTitle} numberOfLines={1}>{rec.title}</Text>
        <Text style={styles.recSubtitle} numberOfLines={1}>{rec.subtitle}</Text>
        <Text style={styles.recReason} numberOfLines={2}>{rec.reason}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    profile,
    sessions,
    currentStreak,
    totalMinutes,
    averageAwareness,
    todaySessionCount,
    onboardingComplete,
    isLoading,
    advisorState,
    todayCheckedIn,
  } = useApp();

  useEffect(() => {
    if (!isLoading && !onboardingComplete) {
      router.replace('/onboarding');
    }
  }, [isLoading, onboardingComplete]);

  const webTopPadding = Platform.OS === 'web' ? 67 : 0;

  const dailyQuote = useMemo(() => {
    const dayIndex = Math.floor(Date.now() / 86400000) % DAILY_QUOTES.length;
    return DAILY_QUOTES[dayIndex];
  }, []);

  const dailyTarget = profile?.dailyMinutes ? Math.max(Math.ceil(profile.dailyMinutes / 10), 1) : 3;
  const dailyProgress = dailyTarget > 0 ? todaySessionCount / dailyTarget : 0;

  const topRecommendations = advisorState.recommendations.slice(0, 5);
  const topInsights = advisorState.insights.slice(0, 3);

  const handleRecPress = (rec: Recommendation) => {
    switch (rec.type) {
      case 'exercise':
        if (rec.actionId) router.push(`/exercise/${rec.actionId}`);
        break;
      case 'checkin':
        router.push('/(tabs)/checkin');
        break;
      case 'assessment':
        if (rec.actionId) router.push(`/assessment/${rec.actionId}`);
        break;
      case 'bodymap':
        router.push('/bodymap');
        break;
      case 'streak':
        router.push('/(tabs)/exercises');
        break;
      default:
        router.push('/(tabs)/exercises');
    }
  };

  const conditionNames = useMemo(() => {
    if (!profile?.conditions?.length) return null;
    return profile.conditions
      .map(id => CONDITIONS.find(c => c.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  }, [profile]);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark, Colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: webTopPadding + insets.top + 20 }]}
      >
        <View style={styles.heroTopRow}>
          <View style={styles.heroLeft}>
            <Text style={styles.greeting}>{advisorState.greeting}</Text>
            {conditionNames && (
              <Text style={styles.conditionLabel}>Focus: {conditionNames}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.crisisButton}
            onPress={() => router.push('/crisis')}
            activeOpacity={0.7}
          >
            <Feather name="shield" size={18} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        <View style={styles.streakRow}>
          <Feather name="trending-up" size={14} color={Colors.warning} />
          <Text style={styles.streakText}>{advisorState.streakMessage}</Text>
        </View>

        <View style={styles.focusCard}>
          <Feather name="target" size={14} color={Colors.primary} />
          <Text style={styles.focusText}>{advisorState.todayFocus}</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Feather name="activity" size={18} color={Colors.secondary} />
            <Text style={styles.statNumber}>{todaySessionCount}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="zap" size={18} color={Colors.warning} />
            <Text style={styles.statNumber}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="clock" size={18} color={Colors.primary} />
            <Text style={styles.statNumber}>{totalMinutes}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="eye" size={18} color={Colors.accent} />
            <Text style={styles.statNumber}>{averageAwareness.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Aware</Text>
          </View>
        </View>

        {advisorState.nextExercise && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended Next</Text>
            <TouchableOpacity
              style={styles.nextExerciseCard}
              onPress={() => router.push(`/exercise/${advisorState.nextExercise!.id}`)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextExerciseGradient}
              >
                <View style={styles.nextExerciseHeader}>
                  <View style={styles.methodBadge}>
                    <Text style={styles.methodText}>{advisorState.nextExercise.methodology}</Text>
                  </View>
                  <View style={styles.difficultyBadge}>
                    <Text style={styles.difficultyText}>{advisorState.nextExercise.difficulty}</Text>
                  </View>
                </View>
                <Text style={styles.nextExerciseTitle}>{advisorState.nextExercise.title}</Text>
                <Text style={styles.nextExerciseSubtitle}>{advisorState.nextExercise.subtitle}</Text>
                <View style={styles.nextExerciseMeta}>
                  <Feather name="clock" size={13} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.nextExerciseDuration}>{advisorState.nextExercise.durationMinutes} min</Text>
                  <Feather name={advisorState.nextExercise.iconName as any} size={13} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.nextExerciseDuration}>
                    {CATEGORY_INFO[advisorState.nextExercise.category]?.label}
                  </Text>
                </View>
                <View style={styles.startButton}>
                  <Feather name="play" size={18} color={Colors.primary} />
                  <Text style={styles.startButtonText}>Begin Session</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/checkin')} activeOpacity={0.7}>
              <View style={[styles.actionIcon, { backgroundColor: todayCheckedIn ? Colors.successLight + '30' : Colors.accentLight }]}>
                <Feather name={todayCheckedIn ? 'check-circle' : 'plus-circle'} size={20}
                  color={todayCheckedIn ? Colors.success : Colors.accentDark} />
              </View>
              <Text style={styles.actionLabel}>{todayCheckedIn ? 'Checked In' : 'Check In'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/exercises')} activeOpacity={0.7}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.secondaryLight }]}>
                <Feather name="layers" size={20} color={Colors.secondaryDark} />
              </View>
              <Text style={styles.actionLabel}>Exercises</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/bodymap')} activeOpacity={0.7}>
              <View style={[styles.actionIcon, { backgroundColor: '#E8E0F5' }]}>
                <Feather name="map-pin" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.actionLabel}>Body Map</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/conditions')} activeOpacity={0.7}>
              <View style={[styles.actionIcon, { backgroundColor: '#FDE8E8' }]}>
                <Feather name="book" size={20} color={Colors.error} />
              </View>
              <Text style={styles.actionLabel}>Conditions</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Insight</Text>
          <View style={styles.dailyInsightCard}>
            <View style={styles.dailyInsightAccent} />
            <View style={styles.dailyInsightContent}>
              <View style={styles.dailyInsightIconRow}>
                <Feather name="compass" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.dailyInsightQuote}>{dailyQuote.text}</Text>
              <Text style={styles.dailyInsightSource}>{dailyQuote.source}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          <View style={styles.progressCard}>
            <ProgressRing progress={dailyProgress} size={90} strokeWidth={7} />
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Daily Goal</Text>
              <Text style={styles.progressSubtitle}>{todaySessionCount} of {dailyTarget} sessions</Text>
              <Text style={styles.progressHint}>
                {dailyProgress >= 1 ? 'Goal reached! Neural pathways strengthening.' : `${dailyTarget - todaySessionCount} more to go`}
              </Text>
            </View>
          </View>
        </View>

        {topInsights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insights</Text>
            {topInsights.map(insight => (
              <InsightCardView key={insight.id} insight={insight} />
            ))}
          </View>
        )}

        {topRecommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personalized For You</Text>
            {topRecommendations.map(rec => (
              <RecommendationCard key={rec.id} rec={rec} onPress={() => handleRecPress(rec)} />
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.crisisFooter}
          onPress={() => router.push('/crisis')}
          activeOpacity={0.7}
        >
          <Feather name="phone" size={14} color={Colors.textTertiary} />
          <Text style={styles.crisisFooterText}>Need immediate support?</Text>
          <Feather name="chevron-right" size={14} color={Colors.textTertiary} />
        </TouchableOpacity>

        <View style={{ height: Platform.OS === 'web' ? 34 : 100 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: { paddingHorizontal: 24, paddingBottom: 40 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLeft: { flex: 1 },
  greeting: { fontFamily: 'Nunito_700Bold', fontSize: 22, color: '#FFFFFF' },
  conditionLabel: { fontFamily: 'Nunito_500Medium', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  crisisButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  streakText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  focusCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 14,
  },
  focusText: { fontFamily: 'Nunito_500Medium', fontSize: 13, color: '#FFFFFF', flex: 1, lineHeight: 19 },
  content: { paddingHorizontal: 20, marginTop: -20 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 8,
    alignItems: 'center', gap: 4,
    shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 10, elevation: 3,
  },
  statNumber: { fontFamily: 'Nunito_800ExtraBold', fontSize: 20, color: Colors.text },
  statLabel: { fontFamily: 'Nunito_500Medium', fontSize: 10, color: Colors.textSecondary },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: Colors.text, marginBottom: 12 },
  nextExerciseCard: { borderRadius: 20, overflow: 'hidden' },
  nextExerciseGradient: { padding: 22, borderRadius: 20 },
  nextExerciseHeader: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  methodBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  methodText: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: '#FFFFFF', textTransform: 'uppercase' as const },
  difficultyBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  difficultyText: { fontFamily: 'Nunito_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.9)', textTransform: 'capitalize' as const },
  nextExerciseTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 20, color: '#FFFFFF' },
  nextExerciseSubtitle: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  nextExerciseMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  nextExerciseDuration: { fontFamily: 'Nunito_500Medium', fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  startButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 12, marginTop: 16,
  },
  startButtonText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.primary },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: (SCREEN_WIDTH - 50) / 4 - 3, backgroundColor: Colors.surface, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', gap: 8,
    shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  actionIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 10, color: Colors.text, textAlign: 'center' },
  progressCard: {
    backgroundColor: Colors.surface, borderRadius: 18, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 20,
    shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 10, elevation: 3,
  },
  progressPercent: { fontFamily: 'Nunito_800ExtraBold', fontSize: 20, color: Colors.primary },
  progressInfo: { flex: 1 },
  progressTitle: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.text },
  progressSubtitle: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: Colors.textSecondary, marginTop: 3 },
  progressHint: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textTertiary, marginTop: 3 },
  insightCard: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  insightTitle: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.text, flex: 1 },
  insightBody: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  recCard: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  recIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  recContent: { flex: 1, gap: 2 },
  recTitle: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.text },
  recSubtitle: { fontFamily: 'Nunito_500Medium', fontSize: 12, color: Colors.textSecondary },
  recReason: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.textTertiary, lineHeight: 15 },
  crisisFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.backgroundSecondary, borderRadius: 12, padding: 12, marginBottom: 8,
  },
  crisisFooterText: { fontFamily: 'Nunito_500Medium', fontSize: 12, color: Colors.textTertiary, flex: 1 },
  dailyInsightCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  dailyInsightAccent: {
    width: 4,
    backgroundColor: Colors.accent,
  },
  dailyInsightContent: {
    flex: 1,
    padding: 18,
  },
  dailyInsightIconRow: {
    marginBottom: 10,
  },
  dailyInsightQuote: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.text,
    fontStyle: 'italic' as const,
    lineHeight: 22,
    marginBottom: 10,
  },
  dailyInsightSource: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    color: Colors.textTertiary,
  },
});
