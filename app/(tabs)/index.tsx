import React, { useMemo, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';
import { EXERCISES, CATEGORY_INFO, ExerciseCategory } from '@/constants/exercises';
import { ARTICLES } from '@/constants/articles';
import { CONDITIONS } from '@/constants/conditions';
import { format, parseISO, differenceInDays } from 'date-fns';
import Svg from 'react-native-svg';
import type { Recommendation, InsightCard } from '@/lib/personalization-engine';
import { apiRequest } from '@/lib/query-client';
import { getWearableContext } from '@/lib/health';
import { getCompletedPathwayDays, getPathwayPurpose } from '@/lib/pathway';
import { HOME_SCIENCE_CLAIMS } from '@/constants/claim-registry';

const DAILY_SCIENCE_INSIGHTS = HOME_SCIENCE_CLAIMS;

function getTimeOfDayGreeting(name: string): { greeting: string; subtext: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return {
      greeting: `Good morning, ${name}`,
      subtext: 'How is your body feeling this morning?',
    };
  }
  if (hour >= 12 && hour < 17) {
    return {
      greeting: `Good afternoon, ${name}`,
      subtext: 'How are you holding up right now?',
    };
  }
  if (hour >= 17 && hour < 21) {
    return {
      greeting: `Good evening, ${name}`,
      subtext: 'How has your body carried you today?',
    };
  }
  return {
    greeting: `Good night, ${name}`,
    subtext: 'How is your body winding down?',
  };
}

const EVIDENCE_LABELS: Record<string, string> = {
  MABT: 'Research-informed',
  breathwork: 'Research-informed',
  mindfulness: 'Research-informed',
  somatic: 'Emerging Science',
  exposure: 'Research-informed',
};

function InsightCardView({ insight }: { insight: InsightCard }) {
  return (
    <View style={styles.insightCard}>
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

interface ContextualSectionProps {
  title: string;
  subtitle: string;
  accentColor: string;
  iconName: string;
  exerciseIds: string[];
}

function ContextualExerciseSection({ title, subtitle, accentColor, iconName, exerciseIds }: ContextualSectionProps) {
  const exercises = EXERCISES.filter(e => exerciseIds.includes(e.id)).slice(0, 3);
  if (exercises.length === 0) return null;
  return (
    <View style={[styles.contextualSection, { borderColor: accentColor + '40', backgroundColor: accentColor + '0C' }]}>
      <View style={styles.contextualInner}>
        <View style={styles.contextualHeader}>
          <View style={[styles.contextualIconWrap, { backgroundColor: accentColor + '20' }]}>
            <Feather name={iconName as any} size={16} color={accentColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.contextualTitle, { color: accentColor }]}>{title}</Text>
            <Text style={styles.contextualSubtitle}>{subtitle}</Text>
          </View>
        </View>
        {exercises.map(ex => (
          <TouchableOpacity
            key={ex.id}
            style={styles.contextualExerciseRow}
            onPress={() => router.push(`/exercise/${ex.id}`)}
            activeOpacity={0.7}
          >
            <View style={[styles.contextualExIconBox, { backgroundColor: accentColor + '18' }]}>
              <Feather name={ex.iconName as any} size={16} color={accentColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contextualExTitle} numberOfLines={1}>{ex.title}</Text>
              <Text style={styles.contextualExMeta}>{ex.durationMinutes} min · {ex.difficulty}</Text>
            </View>
            <Feather name="chevron-right" size={15} color={accentColor + 'AA'} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    profile,
    sessions,
    checkins,
    currentStreak,
    longestStreak,
    totalMinutes,
    averageAwareness,
    todaySessionCount,
    onboardingComplete,
    isLoading,
    advisorState,
    todayCheckedIn,
    assessments,
    totalSessions,
    wearableData,
    pathway14,
  } = useApp();

  const queryClient = useQueryClient();

  const STREAK_MILESTONES = [7, 14, 30, 60];
  const isMilestone = STREAK_MILESTONES.includes(currentStreak);
  const milestoneScale = useRef(new Animated.Value(1)).current;
  const milestoneOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isMilestone && currentStreak > 0) {
      milestoneOpacity.setValue(0);
      milestoneScale.setValue(0.7);
      Animated.parallel([
        Animated.spring(milestoneScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 6 }),
        Animated.timing(milestoneOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
    }
  }, [currentStreak]);

  const wearableContext = useMemo(() => getWearableContext(wearableData), [wearableData]);

  const prevWearableContextRef = useRef(wearableContext);
  useEffect(() => {
    const prev = prevWearableContextRef.current;
    prevWearableContextRef.current = wearableContext;
    if (prev === null && wearableContext !== null) {
      queryClient.invalidateQueries({ queryKey: ['/api/advisor/insight'] });
    }
  }, [wearableContext, queryClient]);

  useEffect(() => {
    if (!isLoading && !onboardingComplete) {
      router.replace('/onboarding');
    }
  }, [isLoading, onboardingComplete]);

  const showMaia2Prompt = useMemo(() => {
    const maia2 = assessments
      .filter(a => a.scaleId === 'maia2')
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
    if (maia2.length === 0 && totalSessions >= 10) return true;
    if (maia2.length > 0) {
      const daysSince = differenceInDays(new Date(), parseISO(maia2[0].completedAt));
      return daysSince >= 30;
    }
    return false;
  }, [assessments, totalSessions]);

  const webTopPadding = 0;

  const userName = profile?.name ? profile.name.split(' ')[0] : 'there';
  const { greeting, subtext } = useMemo(() => getTimeOfDayGreeting(userName), [userName]);

  const todayScience = useMemo(() => {
    const dayIndex = Math.floor(Date.now() / 86400000) % DAILY_SCIENCE_INSIGHTS.length;
    return DAILY_SCIENCE_INSIGHTS[dayIndex];
  }, []);

  const { data: aiInsightData, isLoading: aiInsightLoading } = useQuery<{ insight: string } | null>({
    queryKey: ['/api/advisor/insight', wearableContext?.avgHrv, wearableContext?.lastSleepHours],
    queryFn: async () => {
      try {
        const res = await apiRequest('POST', '/api/advisor/insight', { wearableContext });
        return await res.json();
      } catch {
        return null;
      }
    },
    enabled: onboardingComplete && !isLoading,
    staleTime: 1000 * 60 * 60,
    retry: false,
  });

  const aiInsightText = aiInsightData?.insight || null;

  const topRecommendations = advisorState.recommendations.slice(0, 5);
  const topInsights = advisorState.insights.slice(0, 3);

  const recentCheckin = useMemo(() => {
    return checkins
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
  }, [checkins]);

  const showNervousSystemSection = useMemo(() => {
    if (!recentCheckin) return false;
    const highMood = recentCheckin.mood === 'anxious' || recentCheckin.mood === 'stressed';
    const highStress = (recentCheckin.stressLevel ?? 0) >= 7;
    return highMood || highStress;
  }, [recentCheckin]);

  const nervousSystemExerciseIds = useMemo(() => {
    return EXERCISES
      .filter(e => e.category === 'nervousSystem')
      .sort((a, b) => a.durationMinutes - b.durationMinutes)
      .map(e => e.id);
  }, []);

  const showTraumaSection = useMemo(() => {
    const hasPtsd = (profile?.conditions ?? []).includes('ptsd');
    const latestPcl5 = assessments
      .filter(a => a.scaleId === 'pcl-5')
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
    const highPcl5 = (latestPcl5?.totalScore ?? 0) >= 33;
    return hasPtsd || highPcl5;
  }, [profile, assessments]);

  const traumaExerciseIds = useMemo(() => {
    return EXERCISES
      .filter(e => e.category === 'traumaInformed')
      .map(e => e.id);
  }, []);

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
        return `You have ${recentSessions.length} session${recentSessions.length !== 1 ? 's' : ''} this month. Every practice counts.`;
      }
      return 'Your journey begins with a single breath';
    }
    if (currentStreak === 1) return '1 day of practice. A powerful beginning.';
    if (currentStreak < 7) return `${currentStreak} days of consistent awareness. Keep going.`;
    if (currentStreak < 14) return `${currentStreak} days. Notice what is becoming more familiar with practice.`;
    if (currentStreak < 30) return `${currentStreak} days. Remarkable dedication to yourself.`;
    return `${currentStreak} days. A sustained record of showing up for practice.`;
  }, [currentStreak, sessions]);

  const recentArticles = useMemo(() => {
    const cutoff = 30;
    return ARTICLES.filter(a => {
      if (!a.releaseDate) return false;
      return differenceInDays(new Date(), parseISO(a.releaseDate)) <= cutoff;
    });
  }, []);

  const nextExercise = advisorState.nextExercise;
  const pathwayExercise = pathway14 && !pathway14.completedAt
    ? EXERCISES.find(exercise => exercise.id === pathway14.currentExerciseId) ?? null
    : null;
  const pathwayCompletedDays = pathway14 ? getCompletedPathwayDays(pathway14).length : 0;
  const nextExerciseRecommendation = nextExercise
    ? advisorState.recommendations.find(rec => rec.type === 'exercise' && rec.actionId === nextExercise.id)
    : null;
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
            {profile?.conditions?.[0] && (
              <Text style={styles.conditionLabel}>
                {CONDITIONS.find(c => c.id === profile.conditions?.[0])?.name}
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

        {isMilestone && currentStreak > 0 && (
          <Animated.View style={[styles.milestoneBadge, { opacity: milestoneOpacity, transform: [{ scale: milestoneScale }] }]}>
            <Feather name="star" size={13} color="#F59E0B" />
            <Text style={styles.milestoneBadgeText}>{currentStreak}-day milestone reached</Text>
          </Animated.View>
        )}

        {longestStreak > 0 && currentStreak < longestStreak && (
          <View style={styles.personalBestRow}>
            <Text style={styles.personalBestText}>Personal best: {longestStreak} days</Text>
          </View>
        )}

        <View style={styles.focusCard}>
          <Feather name="target" size={14} color={Colors.primary} />
          <Text style={styles.focusText}>{advisorState.todayFocus}</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{todaySessionCount}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalMinutes}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>14-Day Body-Signal Pathway</Text>
          </View>
          <TouchableOpacity
            style={styles.pathwayCard}
            onPress={() => router.push('/pathway')}
            activeOpacity={0.75}
          >
            <View style={styles.pathwayTopRow}>
              <View style={styles.pathwayIcon}>
                <Feather name={pathway14?.completedAt ? 'check' : 'compass'} size={20} color={Colors.primary} />
              </View>
              <View style={styles.pathwayHeading}>
                <Text style={styles.pathwayTitle}>
                  {!pathway14
                    ? 'Start a focused 14-day sequence'
                    : pathway14.completedAt
                      ? 'Pathway complete'
                      : `Day ${pathway14.currentDay}: ${pathwayExercise?.title ?? 'Your next practice'}`}
                </Text>
                <Text style={styles.pathwaySubtitle}>
                  {!pathway14
                    ? 'Short beginner practices that adapt to your comfort and saved responses.'
                    : pathway14.completedAt
                      ? 'Review your daily responses and what felt useful.'
                      : getPathwayPurpose(pathway14)}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
            </View>
            {pathway14 && (
              <View style={styles.pathwayProgressRow}>
                <View style={styles.pathwayProgressTrack}>
                  <View
                    style={[
                      styles.pathwayProgressFill,
                      { width: `${pathway14.completedAt ? 100 : Math.round((pathwayCompletedDays / 14) * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.pathwayProgressText}>{pathwayCompletedDays}/14</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {nextExercise && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today&apos;s Exercise</Text>
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
                {nextExerciseRecommendation?.reason ? (
                  <View style={styles.recReasonRow}>
                    <Feather name="zap" size={11} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.recReasonText}>{nextExerciseRecommendation.reason}</Text>
                  </View>
                ) : null}
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
          <Text style={styles.sectionTitle}>Today&apos;s Science</Text>
          {aiInsightText ? (
            <LinearGradient
              colors={[Colors.primaryDark, Colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiInsightCard}
            >
              <View style={styles.aiInsightHeader}>
                <View style={styles.aiInsightBadge}>
                  <Feather name="sun" size={11} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.aiInsightBadgeText}>SENSE AI</Text>
                </View>
              </View>
              <Text style={styles.aiInsightBody}>{aiInsightText}</Text>
              <Text style={styles.aiPoweredLabel}>Personalized for you</Text>
            </LinearGradient>
          ) : aiInsightLoading ? (
            <LinearGradient
              colors={[Colors.primaryDark, Colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.aiInsightCard, { alignItems: 'center', paddingVertical: 28 }]}
            >
              <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
              <Text style={{ fontFamily: 'Nunito_500Medium', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 10 }}>Sensing your patterns...</Text>
            </LinearGradient>
          ) : (
            <LinearGradient
              colors={['#3D2E6B', Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.dailyInsightCard}
            >
              <Text style={styles.scienceLabel}>TODAY&apos;S SCIENCE</Text>
              <Text style={styles.scienceHeading}>{todayScience.label}</Text>
              <Text style={styles.scienceBody}>{todayScience.text}</Text>
            </LinearGradient>
          )}
          {topInsights.length > 0 && <View style={{ height: 12 }} />}
          {topInsights.map(insight => (
            <InsightCardView key={insight.id} insight={insight} />
          ))}
        </View>

        {recentArticles.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>New in Learn</Text>
              <TouchableOpacity onPress={() => router.push('/articles' as any)} activeOpacity={0.7}>
                <Text style={styles.newInLearnSeeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.newInLearnRow}
            >
              {recentArticles.map(article => (
                <TouchableOpacity
                  key={article.id}
                  style={styles.newInLearnCard}
                  onPress={() => router.push(`/article/${article.id}` as any)}
                  activeOpacity={0.75}
                >
                  <View style={styles.newInLearnIconWrap}>
                    <Feather name={article.iconName as any} size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.newInLearnBadge}>
                    <Text style={styles.newInLearnBadgeText}>NEW</Text>
                  </View>
                  <Text style={styles.newInLearnCardTitle} numberOfLines={2}>{article.title}</Text>
                  <Text style={styles.newInLearnCardMeta}>{article.readTimeMinutes} min read</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {showNervousSystemSection && (
          <View style={styles.section}>
            <ContextualExerciseSection
              title="Your nervous system needs support"
              subtitle="Your recent check-in included higher stress. These practices offer gentle, structured ways to pause."
              accentColor="#88B3B5"
              iconName="radio"
              exerciseIds={nervousSystemExerciseIds}
            />
          </View>
        )}

        {showTraumaSection && (
          <View style={styles.section}>
            <ContextualExerciseSection
              title="Trauma-informed practice"
              subtitle="Gentle somatic exercises designed for nervous system safety and grounding"
              accentColor="#8FAF8A"
              iconName="anchor"
              exerciseIds={traumaExerciseIds}
            />
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

        {showMaia2Prompt && (
          <TouchableOpacity
            style={styles.maia2Banner}
            onPress={() => router.push('/assessment/maia2' as any)}
            activeOpacity={0.85}
          >
            <View style={styles.maia2BannerIcon}>
              <Feather name="activity" size={18} color="#4A6FA5" />
            </View>
            <View style={styles.maia2BannerContent}>
              <Text style={styles.maia2BannerTitle}>Measure Your Body Awareness</Text>
              <Text style={styles.maia2BannerSubtitle}>
                Take the MAIA-2: the validated 8-dimension body awareness assessment
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color="#4A6FA5" />
          </TouchableOpacity>
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
  hero: { paddingHorizontal: 24, paddingBottom: 44 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLeft: { flex: 1 },
  greeting: { fontFamily: 'Nunito_800ExtraBold', fontSize: 28, color: '#FFFFFF', letterSpacing: -0.5, lineHeight: 34 },
  greetingSubtext: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.72)', marginTop: 6, lineHeight: 20 },
  conditionLabel: { fontFamily: 'Nunito_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4, letterSpacing: 0.3 },
  getHelpLink: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  streakText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  milestoneBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(245,158,11,0.2)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', marginTop: 8,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.35)',
  },
  milestoneBadgeText: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: '#F59E0B' },
  personalBestRow: { marginTop: 4 },
  personalBestText: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  focusCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 14,
  },
  focusText: { fontFamily: 'Nunito_500Medium', fontSize: 13, color: '#FFFFFF', flex: 1, lineHeight: 19 },
  content: { paddingHorizontal: 20, marginTop: -24 },
  statsBar: {
    backgroundColor: Colors.surface, borderRadius: 20, flexDirection: 'row',
    paddingVertical: 18, marginBottom: 20,
    shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 14, elevation: 4,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.borderLight, marginVertical: 6 },
  statNumber: { fontFamily: 'Nunito_800ExtraBold', fontSize: 28, color: Colors.text, lineHeight: 32 },
  statLabel: { fontFamily: 'Nunito_500Medium', fontSize: 11, color: Colors.textSecondary, marginTop: 3, letterSpacing: 0.2 },

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

  section: { marginBottom: 26 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: Colors.textSecondary, marginBottom: 12, letterSpacing: 1.4, textTransform: 'uppercase' as const },
  pathwayCard: {
    backgroundColor: '#F5F1FA', borderRadius: 18, padding: 17,
    borderWidth: 1, borderColor: '#E5DCF2',
  },
  pathwayTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pathwayIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  pathwayHeading: { flex: 1 },
  pathwayTitle: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.text },
  pathwaySubtitle: { fontFamily: 'Nunito_400Regular', fontSize: 12, lineHeight: 17, color: Colors.textSecondary, marginTop: 3 },
  pathwayProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  pathwayProgressTrack: { flex: 1, height: 7, borderRadius: 4, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  pathwayProgressFill: { height: '100%', borderRadius: 4, backgroundColor: Colors.primary },
  pathwayProgressText: { fontFamily: 'Nunito_700Bold', fontSize: 11, color: Colors.primary },
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
  recReasonRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 10, marginBottom: 2 },
  recReasonText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 18, flex: 1 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'nowrap', gap: 10 },
  actionCard: {
    flex: 1, minWidth: 60, backgroundColor: Colors.surface, borderRadius: 18,
    paddingVertical: 18, alignItems: 'center', gap: 10,
    shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 10, elevation: 3,
  },
  actionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: Colors.text, textAlign: 'center' },
  insightCard: {
    backgroundColor: Colors.surface, borderRadius: 18, padding: 18, marginBottom: 10,
    shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 12, elevation: 3,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  insightTitle: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.text, flex: 1 },
  insightBody: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
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
  maia2Banner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#EDF2FB', borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#C8D8F0',
    shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  maia2BannerIcon: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: '#D5E3F7',
    alignItems: 'center', justifyContent: 'center',
  },
  maia2BannerContent: { flex: 1 },
  maia2BannerTitle: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#2D4A7A', marginBottom: 2 },
  maia2BannerSubtitle: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: '#4A6FA5', lineHeight: 15 },
  dailyInsightCard: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 0,
  },
  scienceLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1.6,
    marginBottom: 10,
    textTransform: 'uppercase' as const,
  },
  scienceHeading: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  scienceBody: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 22,
  },
  aiInsightCard: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 0,
  },
  aiInsightHeader: {
    marginBottom: 14,
  },
  aiInsightBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    alignSelf: 'flex-start' as const,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  aiInsightBadgeText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1.2,
  },
  aiInsightBody: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 14,
  },
  aiPoweredLabel: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },

  contextualSection: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  contextualInner: {
    padding: 18,
  },
  contextualHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  contextualIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  contextualTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 3,
  },
  contextualSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  contextualExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '50',
  },
  contextualExIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextualExTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: Colors.text,
  },
  contextualExMeta: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  newInLearnSeeAll: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    color: Colors.primary,
    marginBottom: 12,
  },
  newInLearnRow: {
    paddingRight: 4,
    gap: 12,
    flexDirection: 'row',
  },
  newInLearnCard: {
    width: 150,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  newInLearnIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  newInLearnBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '20',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 8,
  },
  newInLearnBadgeText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 9,
    color: Colors.primary,
    letterSpacing: 1,
  },
  newInLearnCardTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
    marginBottom: 6,
    flex: 1,
  },
  newInLearnCardMeta: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
