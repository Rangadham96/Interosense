import React, { useMemo } from 'react';
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
import { EXERCISES, CATEGORY_INFO } from '@/constants/exercises';
import { format, parseISO } from 'date-fns';
import Svg, { Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function ProgressRing({ progress, size = 120, strokeWidth = 10 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference * (1 - clampedProgress);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.borderLight}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={styles.progressPercent}>{Math.round(clampedProgress * 100)}%</Text>
      </View>
    </View>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Feather
          key={i}
          name="star"
          size={12}
          color={i <= rating ? Colors.warning : Colors.borderLight}
        />
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    profile,
    sessions,
    currentStreak,
    averageAwareness,
    todaySessionCount,
  } = useApp();

  const webTopPadding = Platform.OS === 'web' ? 67 : 0;

  const recentSessions = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 3);
  }, [sessions]);

  const featuredExercise = useMemo(() => {
    const completedIds = new Set(sessions.map(s => s.exerciseId));
    const uncompleted = EXERCISES.filter(e => !completedIds.has(e.id));
    return uncompleted.length > 0 ? uncompleted[0] : EXERCISES[0];
  }, [sessions]);

  const dailyTarget = profile?.dailyMinutes ? Math.max(Math.ceil(profile.dailyMinutes / 10), 1) : 3;
  const dailyProgress = dailyTarget > 0 ? todaySessionCount / dailyTarget : 0;

  const greeting = getGreeting();
  const userName = profile?.name || 'Welcome';

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={[styles.hero, { paddingTop: webTopPadding + insets.top + 24 }]}
      >
        <Text style={styles.greeting}>{greeting},</Text>
        <Text style={styles.userName}>{userName}</Text>
        <View style={styles.streakRow}>
          <Feather name="zap" size={16} color={Colors.warning} />
          <Text style={styles.streakText}>
            {currentStreak} day streak
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Feather name="activity" size={20} color={Colors.secondary} />
            <Text style={styles.statNumber}>{todaySessionCount}</Text>
            <Text style={styles.statLabel}>Sessions Today</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="zap" size={20} color={Colors.warning} />
            <Text style={styles.statNumber}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="eye" size={20} color={Colors.primary} />
            <Text style={styles.statNumber}>{averageAwareness.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Awareness</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/checkin')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.accentLight }]}>
                <Feather name="plus-circle" size={22} color={Colors.accentDark} />
              </View>
              <Text style={styles.actionLabel}>Check In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/exercises')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.secondaryLight }]}>
                <Feather name="layers" size={22} color={Colors.secondaryDark} />
              </View>
              <Text style={styles.actionLabel}>Exercise</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/bodymap')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E8E0F5' }]}>
                <Feather name="map-pin" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.actionLabel}>Body Map</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          <View style={styles.progressCard}>
            <ProgressRing progress={dailyProgress} />
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Daily Goal</Text>
              <Text style={styles.progressSubtitle}>
                {todaySessionCount} of {dailyTarget} sessions
              </Text>
              <Text style={styles.progressHint}>
                {dailyProgress >= 1
                  ? 'Goal reached! Great work.'
                  : `${dailyTarget - todaySessionCount} more to go`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="inbox" size={40} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No sessions yet</Text>
              <Text style={styles.emptySubtitle}>Start your first exercise to begin</Text>
            </View>
          ) : (
            recentSessions.map(session => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionLeft}>
                  <Text style={styles.sessionTitle}>{session.exerciseTitle}</Text>
                  <Text style={styles.sessionDate}>
                    {format(parseISO(session.completedAt), 'MMM d, h:mm a')}
                  </Text>
                  <StarRating rating={session.rating} />
                </View>
                <View style={styles.sessionRight}>
                  <Text style={styles.sessionDuration}>{session.durationMinutes}m</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggested for You</Text>
          {featuredExercise && (
            <TouchableOpacity
              style={styles.featuredCard}
              onPress={() => router.push(`/exercise/${featuredExercise.id}`)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[Colors.primaryLight, Colors.primary]}
                style={styles.featuredGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.featuredContent}>
                  <View style={styles.featuredTop}>
                    <View style={styles.difficultyBadge}>
                      <Text style={styles.difficultyText}>
                        {featuredExercise.difficulty}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.featuredTitle}>{featuredExercise.title}</Text>
                  <Text style={styles.featuredCategory}>
                    {CATEGORY_INFO[featuredExercise.category]?.label}
                  </Text>
                  <View style={styles.featuredMeta}>
                    <Feather name="clock" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.featuredDuration}>
                      {featuredExercise.durationMinutes} min
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.crisisCard}
          onPress={() => router.push('/crisis')}
          activeOpacity={0.7}
        >
          <Feather name="phone" size={16} color={Colors.textTertiary} />
          <Text style={styles.crisisText}>Need immediate support?</Text>
          <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
        </TouchableOpacity>

        <View style={{ height: Platform.OS === 'web' ? 34 : 100 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  greeting: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
    color: '#FFFFFF',
    marginTop: 2,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  streakText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  content: {
    paddingHorizontal: 20,
    marginTop: -16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  statNumber: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 22,
    color: Colors.text,
  },
  statLabel: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: Colors.text,
  },
  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  progressPercent: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 24,
    color: Colors.primary,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: Colors.text,
  },
  progressSubtitle: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  progressHint: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: Colors.text,
    marginTop: 4,
  },
  emptySubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  sessionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  sessionLeft: {
    flex: 1,
    gap: 4,
  },
  sessionTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: Colors.text,
  },
  sessionDate: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: Colors.textTertiary,
  },
  sessionRight: {
    alignItems: 'flex-end',
  },
  sessionDuration: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: Colors.primary,
  },
  featuredCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  featuredGradient: {
    padding: 24,
    borderRadius: 20,
  },
  featuredContent: {
    gap: 8,
  },
  featuredTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  difficultyBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  difficultyText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  featuredTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  featuredCategory: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  featuredDuration: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  crisisCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  crisisText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    color: Colors.textTertiary,
    flex: 1,
  },
});
