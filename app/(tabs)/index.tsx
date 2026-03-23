import React, { useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
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
import type { Recommendation, InsightCard } from '@/lib/personalization-engine';

const DAILY_SCIENCE_INSIGHTS = [
  { label: 'THE INSULA', text: 'Regular interoceptive practice measurably thickens the insular cortex — the region that translates body signals into conscious awareness.' },
  { label: 'VAGUS NERVE', text: 'Your vagus nerve carries 80% of signals from gut to brain. Just 5 minutes of slow breathing activates your rest-and-digest system.' },
  { label: 'HRV & RESILIENCE', text: 'Heart rate variability (HRV) is your body\'s resilience score. Box breathing can raise it by 10–15% in a single session.' },
  { label: 'NEUROPLASTICITY', text: 'Each moment of mindful body attention reshapes neural pathways. Two weeks of daily practice produces measurable changes.' },
  { label: 'GUT-BRAIN AXIS', text: 'Your gut produces 95% of your body\'s serotonin. Gut awareness exercises directly support mood through the enteric nervous system.' },
  { label: 'INTEROCEPTION', text: 'People with greater interoceptive accuracy tend to experience emotions more intensely and make more intuitive decisions (Critchley, 2004).' },
  { label: 'BREATH & EMOTION', text: 'Your breathing pattern directly reflects your emotional state — and changing your breath can change your feelings within 90 seconds.' },
];

function getTimeOfDayGreeting(name: string): { greeting: string; subtext: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return {
      greeting: `Good morning, ${name}`,
      subtext: `${name} — how is your body this morning?`,
    };
  }
  if (hour >= 12 && hour < 17) {
    return {
      greeting: `Good afternoon, ${name}`,
      subtext: `${name} — how are you feeling right now?`,
    };
  }
  if (hour >= 17 && hour < 21) {
    return {
      greeting: `Good evening, ${name}`,
      subtext: `${name} — how has your body carried you today?`,
    };
  }
  return {
    greeting: `Good night, ${name}`,
    subtext: `${name} — how is your body winding down?`,
  };
}

const EVIDENCE_LABELS: Record<string, string> = {
  MABT: 'Strong Evidence',
  breathwork: 'Strong Evidence',
  mindfulness: 'Strong Evidence',
  somatic: 'Emerging Science',
  exposure: 'Strong Evidence',
};

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

  const userName = profile?.name ? profile.name.split(' ')[0] : 'there';
  const { greeting, subtext } = useMemo(() => getTimeOfDayGreeting(userName), [userName]);

  const todayScience = useMemo(() => {
    const dayIndex = Math.floor(Date.now() / 86400000) % DAILY_SCIENCE_INSIGHTS.length;
    return DAILY_SCIENCE_INSIGHTS[dayIndex];
  }, []);

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

  const compassionateStreakMessage = useMemo(() => {
    if (currentStreak === 0) {
      const recentSessions = sessions.filter(s => {
        const d = new Date(s.completedAt);
        const now = new Date();
        const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 30;
      });
      if (recentSessions.length > 0) {
        return `You have ${recentSessions.length} session${recentSessions.length !== 1 ? 's' : ''} this month — every practice counts`;
      }
      return 'Your journey begins with a single breath';
    }
    if (currentStreak === 1) return '1 day of practice — a powerful beginning';
    if (currentStreak < 7) return `${currentStreak} days of consistent awareness — keep going`;
    if (currentStreak < 14) return `${currentStreak} days — your neural pathways are strengthening`;
    if (currentStreak < 30) return `${currentStreak} days — remarkable dedication to yourself`;
    return `${currentStreak} days — you are genuinely rewiring your brain`;
  }, [currentStreak, sessions]);

  const nextExercise = advisorState.nextExercise;
  const evidenceBadge = nextExercise ? (EVIDENCE_LABELS[nextExercise.methodology] || 'Emerging Science') : '';

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
            <Text style={styles.greeting}>{greeting}</Text>
            {profile?.primaryCondition && (
              <Text style={styles.conditionLabel}>
                {CONDITIONS.find(c => c.id === profile.primaryCondition)?.title}
              </Text>
            )}
            <Text style={styles.greetingSubtext}>{subtext}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/crisis')}
            activeOpacity={0.7}
          >
            <Text style={styles.getHelpLink}>Get Help</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.streakRow}>
          <Feather name="trending-up" size={14} color={Colors.warning} />
          <Text style={styles.streakText}>{compassionateStreakMessage}</Text>
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

        {!todayCheckedIn ? (
          <TouchableOpacity
            style={styles.checkinPromptCard}
            onPress={() => router.push('/(tabs)/checkin')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#6B5B95', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.checkinGradient}
            >
              <View style={styles.checkinPromptContent}>
                <View style={styles.checkinPromptLeft}>
                  <Text style={styles.checkinPromptLabel}>DAILY CHECK-IN</Text>
                  <Text style={styles.checkinPromptTitle}>How is your body right now?</Text>
                  <Text style={styles.checkinPromptSubtitle}>Take 3 minutes to tune in</Text>
                </View>
                <View style={styles.checkinPromptIcon}>
                  <Feather name="plus-circle" size={28} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.checkinBenefitsRow}>
                <View style={styles.checkinBenefit}>
                  <Feather name="check" size={12} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.checkinBenefitText}>Personalises your exercises</Text>
                </View>
                <View style={styles.checkinBenefit}>
                  <Feather name="check" size={12} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.checkinBenefitText}>Tracks your progress</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.checkinDoneCard}>
            <View style={styles.checkinDoneLeft}>
              <View style={styles.checkinDoneIconWrap}>
                <Feather name="check-circle" size={22} color={Colors.success} />
              </View>
              <View>
                <Text style={styles.checkinDoneTitle}>Check-in complete</Text>
                <Text style={styles.checkinDoneSubtitle}>Your exercises are personalised for today</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/checkin')} activeOpacity={0.7}>
              <Text style={styles.checkinDoneLink}>View</Text>
            </TouchableOpacity>
          </View>
        )}

        {nextExercise && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended for You</Text>
            <TouchableOpacity
              style={styles.nextExerciseCard}
              onPress={() => router.push(`/exercise/${nextExercise!.id}`)}
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
                    <Text style={styles.methodText}>{nextExercise.methodology}</Text>
                  </View>
                  <View style={styles.evidenceBadge}>
                    <Feather name="award" size={10} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.evidenceText}>{evidenceBadge}</Text>
                  </View>
                </View>
                <Text style={styles.nextExerciseTitle}>{nextExercise.title}</Text>
                <Text style={styles.nextExerciseSubtitle}>{nextExercise.subtitle}</Text>
                <View style={styles.nextExerciseMeta}>
                  <Feather name="clock" size={13} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.nextExerciseDuration}>{nextExercise.durationMinutes} min</Text>
                  <Feather name={nextExercise.iconName as any} size={13} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.nextExerciseDuration}>
                    {CATEGORY_INFO[nextExercise.category]?.label}
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
          <Text style={styles.sectionTitle}>Today's Science</Text>
          <View style={styles.scienceCard}>
            <View style={styles.scienceCardAccent} />
            <View style={styles.scienceCardContent}>
              <Text style={styles.scienceLabel}>TODAY'S SCIENCE</Text>
              <Text style={styles.scienceHeading}>{todayScience.label}</Text>
              <Text style={styles.scienceBody}>{todayScience.text}</Text>
            </View>
          </View>
          {topInsights.length > 0 && <View style={{ height: 12 }} />}
          {topInsights.map(insight => (
            <InsightCardView key={insight.id} insight={insight} />
          ))}
        </View>

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
  container: { flex: 1, backgroundColor: '#FAFAFE' },
  hero: { paddingHorizontal: 24, paddingBottom: 40 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLeft: { flex: 1 },
  greeting: { fontFamily: 'Nunito_700Bold', fontSize: 22, color: '#FFFFFF' },
  greetingSubtext: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4, lineHeight: 20 },
  conditionLabel: { fontFamily: 'Nunito_500Medium', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  getHelpLink: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.85)' },
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

  checkinPromptCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 24 },
  checkinGradient: { borderRadius: 20 },
  checkinPromptContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  checkinPromptLeft: { flex: 1 },
  checkinPromptLabel: { fontFamily: 'Nunito_700Bold', fontSize: 10, color: 'rgba(255,255,255,0.75)', letterSpacing: 1.2, marginBottom: 4 },
  checkinPromptTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 20, color: '#FFFFFF', marginBottom: 4 },
  checkinPromptSubtitle: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  checkinPromptIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  checkinBenefitsRow: { flexDirection: 'row', gap: 16, paddingHorizontal: 20, paddingBottom: 16 },
  checkinBenefit: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  checkinBenefitText: { fontFamily: 'Nunito_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  checkinDoneCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F0F9F0', borderRadius: 16, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: Colors.success + '40',
  },
  checkinDoneLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  checkinDoneIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.success + '20', alignItems: 'center', justifyContent: 'center' },
  checkinDoneTitle: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.text },
  checkinDoneSubtitle: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  checkinDoneLink: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.success },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: Colors.text, marginBottom: 12 },
  nextExerciseCard: { borderRadius: 20, overflow: 'hidden' },
  nextExerciseGradient: { padding: 22, borderRadius: 20 },
  nextExerciseHeader: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  methodBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  methodText: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: '#FFFFFF', textTransform: 'uppercase' as const },
  evidenceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  evidenceText: { fontFamily: 'Nunito_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.9)' },
  nextExerciseTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 20, color: '#FFFFFF' },
  nextExerciseSubtitle: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  nextExerciseMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  nextExerciseDuration: { fontFamily: 'Nunito_500Medium', fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  startButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 12, marginTop: 16,
  },
  startButtonText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.primary },
  actionsGrid: { flexDirection: 'row', flexWrap: 'nowrap', gap: 10 },
  actionCard: {
    flex: 1, minWidth: 60, backgroundColor: Colors.surface, borderRadius: 16,
    paddingVertical: 14, alignItems: 'center', gap: 8,
    shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  actionIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 10, color: Colors.text, textAlign: 'center' },
  insightCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  insightTitle: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.text, flex: 1 },
  insightBody: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  recCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 14, marginBottom: 8,
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
  scienceCard: {
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
  scienceCardAccent: {
    width: 4,
    backgroundColor: Colors.primary,
  },
  scienceCardContent: {
    flex: 1,
    padding: 18,
  },
  scienceLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 10,
    color: Colors.primary,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  scienceHeading: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: Colors.text,
    marginBottom: 6,
  },
  scienceBody: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
