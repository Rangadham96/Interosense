import { StyleSheet, Text, View, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { format, parseISO, startOfWeek, addDays, isSameDay } from 'date-fns';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';
import { ACHIEVEMENTS, TIER_COLORS } from '@/constants/achievements';

const CATEGORY_LABELS: Record<string, string> = {
  heartbeat: 'Heartbeat',
  breathing: 'Breathing',
  bodyScanning: 'Body Scanning',
  tension: 'Tension',
  temperature: 'Temperature',
  exposure: 'Exposure',
};

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const {
    sessions,
    checkins,
    totalSessions,
    totalMinutes,
    currentStreak,
    longestStreak,
    averageAwareness,
    unlockedAchievements,
  } = useApp();

  const last7Checkins = useMemo(() => {
    const sorted = [...checkins].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(-7);
  }, [checkins]);

  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach(s => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const maxCount = entries.length > 0 ? entries[0][1] : 1;
    return { entries, maxCount };
  }, [sessions]);

  const weeklyActivity = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const days: { date: Date; count: number; label: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const count = sessions.filter(s => isSameDay(parseISO(s.completedAt), day)).length;
      days.push({ date: day, count, label: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i] });
    }
    return days;
  }, [sessions]);

  const achievementBadges = useMemo(() => {
    return ACHIEVEMENTS.filter(a => unlockedAchievements.includes(a.id)).slice(0, 4);
  }, [unlockedAchievements]);

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Your Progress</Text>
          <Text style={styles.subtitle}>Track your interoceptive journey</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              icon="activity"
              iconColor={Colors.primary}
              value={totalSessions}
              label="Total Sessions"
            />
            <StatCard
              icon="clock"
              iconColor={Colors.secondary}
              value={totalMinutes}
              label="Total Minutes"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon="zap"
              iconColor="#FF6B35"
              value={currentStreak}
              label="Current Streak"
            />
            <StatCard
              icon="award"
              iconColor={Colors.warning}
              value={longestStreak}
              label="Longest Streak"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Awareness Score</Text>
          <View style={styles.card}>
            {checkins.length > 0 ? (
              <>
                <View style={styles.avgRow}>
                  <Text style={styles.avgLabel}>Average</Text>
                  <Text style={styles.avgValue}>{averageAwareness}</Text>
                  <Text style={styles.avgOutOf}>/10</Text>
                </View>
                <View style={styles.barChart}>
                  {last7Checkins.map((c, i) => {
                    const ratio = c.awarenessScore / 10;
                    const barColor = interpolateColor(
                      Colors.secondary,
                      Colors.primary,
                      ratio
                    );
                    return (
                      <View key={c.id || i} style={styles.barColumn}>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.bar,
                              {
                                height: `${Math.max(ratio * 100, 5)}%`,
                                backgroundColor: barColor,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.barLabel}>
                          {format(parseISO(c.date), 'dd')}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Feather name="bar-chart-2" size={32} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>
                  Complete check-ins to see your awareness trend
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercise Categories</Text>
          <View style={styles.card}>
            {categoryBreakdown.entries.length > 0 ? (
              categoryBreakdown.entries.map(([category, count]) => {
                const color =
                  Colors.category[category as keyof typeof Colors.category] ||
                  Colors.primary;
                const widthPercent = (count / categoryBreakdown.maxCount) * 100;
                return (
                  <View key={category} style={styles.categoryRow}>
                    <View style={styles.categoryInfo}>
                      <View style={[styles.categoryDot, { backgroundColor: color }]} />
                      <Text style={styles.categoryName}>
                        {CATEGORY_LABELS[category] || category}
                      </Text>
                      <Text style={styles.categoryCount}>{count}</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${widthPercent}%`, backgroundColor: color },
                        ]}
                      />
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Feather name="layers" size={32} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>
                  Complete exercises to see category breakdown
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.card}>
            <View style={styles.heatmapRow}>
              {weeklyActivity.map((day, i) => {
                const baseSize = 36;
                const size =
                  day.count === 0
                    ? baseSize
                    : day.count === 1
                    ? baseSize + 4
                    : baseSize + 8;
                const bgColor =
                  day.count === 0
                    ? 'transparent'
                    : day.count === 1
                    ? Colors.primaryLight
                    : Colors.primary;
                const borderColor =
                  day.count === 0 ? Colors.border : bgColor;

                return (
                  <View key={i} style={styles.heatmapDay}>
                    <View
                      style={[
                        styles.heatmapCircle,
                        {
                          width: size,
                          height: size,
                          borderRadius: size / 2,
                          backgroundColor: bgColor,
                          borderWidth: day.count === 0 ? 2 : 0,
                          borderColor: borderColor,
                        },
                      ]}
                    >
                      {day.count > 0 && (
                        <Text style={styles.heatmapCount}>{day.count}</Text>
                      )}
                    </View>
                    <Text style={styles.heatmapLabel}>{day.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <TouchableOpacity onPress={() => router.push('/achievements' as any)}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {achievementBadges.length > 0 ? (
              <View style={styles.badgesRow}>
                {achievementBadges.map(a => {
                  const tierColor = TIER_COLORS[a.tier];
                  return (
                    <View key={a.id} style={styles.badgeContainer}>
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: tierColor + '20', borderColor: tierColor },
                        ]}
                      >
                        <Feather
                          name={a.iconName as any}
                          size={20}
                          color={tierColor}
                        />
                      </View>
                      <Text style={styles.badgeLabel} numberOfLines={1}>
                        {a.title}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Feather name="award" size={32} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>
                  {unlockedAchievements.length} of {ACHIEVEMENTS.length} unlocked
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.quickLinks}>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/goals' as any)}
          >
            <Feather name="target" size={20} color={Colors.primary} />
            <Text style={styles.linkText}>View Goals</Text>
            <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.linkButton, { marginTop: 10 }]}
            onPress={() => router.push('/bodymap' as any)}
          >
            <Feather name="user" size={20} color={Colors.secondary} />
            <Text style={styles.linkText}>View Body Map</Text>
            <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function StatCard({
  icon,
  iconColor,
  value,
  label,
}: {
  icon: string;
  iconColor: string;
  value: number;
  label: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: iconColor + '15' }]}>
        <Feather name={icon as any} size={20} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function interpolateColor(colorA: string, colorB: string, t: number): string {
  const parseHex = (hex: string) => {
    const c = hex.replace('#', '');
    return [
      parseInt(c.substring(0, 2), 16),
      parseInt(c.substring(2, 4), 16),
      parseInt(c.substring(4, 6), 16),
    ];
  };
  const [r1, g1, b1] = parseHex(colorA);
  const [r2, g2, b2] = parseHex(colorB);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statsGrid: {
    gap: 12,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'Nunito_500Medium',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.primary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  avgRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  avgLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: Colors.textSecondary,
    marginRight: 8,
  },
  avgValue: {
    fontSize: 36,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.primary,
  },
  avgOutOf: {
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: Colors.textTertiary,
    marginLeft: 2,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    gap: 6,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    width: '100%',
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '70%',
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    fontFamily: 'Nunito_500Medium',
    color: Colors.textTertiary,
    marginTop: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  categoryRow: {
    marginBottom: 14,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.text,
  },
  categoryCount: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textSecondary,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  heatmapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heatmapDay: {
    alignItems: 'center',
    gap: 8,
  },
  heatmapCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapCount: {
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textInverse,
  },
  heatmapLabel: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: Colors.textSecondary,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  badgeContainer: {
    alignItems: 'center',
    width: 70,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  badgeLabel: {
    fontSize: 11,
    fontFamily: 'Nunito_500Medium',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  quickLinks: {
    marginBottom: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.text,
    marginLeft: 12,
  },
});
