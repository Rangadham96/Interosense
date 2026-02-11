import { StyleSheet, Text, View, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { format, parseISO, startOfWeek, addDays, isSameDay } from 'date-fns';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';
import { ACHIEVEMENTS, TIER_COLORS } from '@/constants/achievements';
import { CLINICAL_SCALES } from '@/constants/clinical-scales';

const CATEGORY_LABELS: Record<string, string> = {
  heartbeat: 'Heartbeat',
  breathing: 'Breathing',
  bodyScanning: 'Body Scanning',
  tension: 'Tension',
  temperature: 'Temperature',
  exposure: 'Exposure',
  gut: 'Gut Awareness',
  movement: 'Movement',
};

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const {
    sessions,
    checkins,
    assessments,
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

  const moodDistribution = useMemo(() => {
    if (checkins.length === 0) return [];
    const counts: Record<string, number> = {};
    checkins.forEach(c => {
      if (c.mood) counts[c.mood] = (counts[c.mood] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [checkins]);

  const stressTrend = useMemo(() => {
    const withStress = checkins.filter(c => c.stressLevel !== undefined);
    const sorted = [...withStress].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(-7);
  }, [checkins]);

  const assessmentHistory = useMemo(() => {
    if (!assessments || assessments.length === 0) return [];
    const grouped: Record<string, typeof assessments> = {};
    assessments.forEach(a => {
      if (!grouped[a.scaleId]) grouped[a.scaleId] = [];
      grouped[a.scaleId].push(a);
    });
    return Object.entries(grouped).map(([scaleId, records]) => {
      const sorted = [...records].sort((a, b) => a.completedAt.localeCompare(b.completedAt));
      const scale = CLINICAL_SCALES.find(s => s.id === scaleId);
      return { scaleId, scaleName: scale?.name || records[0].scaleName, records: sorted, scale };
    });
  }, [assessments]);

  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1; });
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Progress</Text>
          <Text style={styles.subtitle}>Track your interoceptive journey</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard icon="activity" iconColor={Colors.primary} value={totalSessions} label="Sessions" />
            <StatCard icon="clock" iconColor={Colors.secondary} value={totalMinutes} label="Minutes" />
          </View>
          <View style={styles.statsRow}>
            <StatCard icon="zap" iconColor="#FF6B35" value={currentStreak} label="Streak" />
            <StatCard icon="award" iconColor={Colors.warning} value={longestStreak} label="Best Streak" />
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
                    const barColor = interpolateColor(Colors.secondary, Colors.primary, ratio);
                    return (
                      <View key={c.id || i} style={styles.barColumn}>
                        <View style={styles.barTrack}>
                          <View style={[styles.bar, { height: `${Math.max(ratio * 100, 5)}%`, backgroundColor: barColor }]} />
                        </View>
                        <Text style={styles.barLabel}>{format(parseISO(c.date), 'dd')}</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Feather name="bar-chart-2" size={32} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>Complete check-ins to see your awareness trend</Text>
              </View>
            )}
          </View>
        </View>

        {stressTrend.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stress Trend</Text>
            <View style={styles.card}>
              <View style={styles.barChart}>
                {stressTrend.map((c, i) => {
                  const ratio = (c.stressLevel || 0) / 10;
                  const barColor = interpolateColor('#4CAF50', '#E07A5F', ratio);
                  return (
                    <View key={c.id || i} style={styles.barColumn}>
                      <View style={styles.barTrack}>
                        <View style={[styles.bar, { height: `${Math.max(ratio * 100, 5)}%`, backgroundColor: barColor }]} />
                      </View>
                      <Text style={styles.barLabel}>{format(parseISO(c.date), 'dd')}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.trendLegend}>
                <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.legendText}>Low Stress</Text>
                <View style={[styles.legendDot, { backgroundColor: '#E07A5F', marginLeft: 12 }]} />
                <Text style={styles.legendText}>High Stress</Text>
              </View>
            </View>
          </View>
        )}

        {moodDistribution.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mood Distribution</Text>
            <View style={styles.card}>
              {moodDistribution.map(([mood, count]) => {
                const total = checkins.filter(c => c.mood).length;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <View key={mood} style={styles.moodRow}>
                    <Text style={styles.moodName}>{mood.charAt(0).toUpperCase() + mood.slice(1)}</Text>
                    <View style={styles.moodBarTrack}>
                      <View style={[styles.moodBarFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.moodPct}>{pct}%</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {assessmentHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Clinical Assessments</Text>
            {assessmentHistory.map(({ scaleId, scaleName, records, scale }) => {
              const latest = records[records.length - 1];
              const maxScore = scale ? scale.questions.length * 3 : 27;
              return (
                <View key={scaleId} style={[styles.card, { marginBottom: 12 }]}>
                  <Text style={styles.assessmentName}>{scaleName}</Text>
                  <View style={styles.assessmentMeta}>
                    <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(latest.severity) + '20' }]}>
                      <Text style={[styles.severityText, { color: getSeverityColor(latest.severity) }]}>
                        {latest.severity}
                      </Text>
                    </View>
                    <Text style={styles.assessmentScore}>{latest.totalScore}/{maxScore}</Text>
                    <Text style={styles.assessmentDate}>{format(parseISO(latest.completedAt), 'MMM d')}</Text>
                  </View>
                  {records.length > 1 && (
                    <View style={styles.trendRow}>
                      {records.slice(-5).map((r, i) => {
                        const ratio = r.totalScore / maxScore;
                        return (
                          <View key={r.id || i} style={styles.trendDot}>
                            <View style={[styles.trendCircle, {
                              backgroundColor: getSeverityColor(r.severity),
                              width: 8 + ratio * 16,
                              height: 8 + ratio * 16,
                              borderRadius: (8 + ratio * 16) / 2,
                            }]} />
                            <Text style={styles.trendDate}>{format(parseISO(r.completedAt), 'M/d')}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.retakeBtn}
                    onPress={() => router.push(`/assessment/${scaleId}` as any)}
                    activeOpacity={0.7}
                  >
                    <Feather name="refresh-cw" size={14} color={Colors.primary} />
                    <Text style={styles.retakeBtnText}>Retake Assessment</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercise Categories</Text>
          <View style={styles.card}>
            {categoryBreakdown.entries.length > 0 ? (
              categoryBreakdown.entries.map(([category, count]) => {
                const color = Colors.category[category as keyof typeof Colors.category] || Colors.primary;
                const widthPercent = (count / categoryBreakdown.maxCount) * 100;
                return (
                  <View key={category} style={styles.categoryRow}>
                    <View style={styles.categoryInfo}>
                      <View style={[styles.categoryDot, { backgroundColor: color }]} />
                      <Text style={styles.categoryName}>{CATEGORY_LABELS[category] || category}</Text>
                      <Text style={styles.categoryCount}>{count}</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                      <View style={[styles.progressBarFill, { width: `${widthPercent}%`, backgroundColor: color }]} />
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Feather name="layers" size={32} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>Complete exercises to see category breakdown</Text>
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
                const size = day.count === 0 ? baseSize : day.count === 1 ? baseSize + 4 : baseSize + 8;
                const bgColor = day.count === 0 ? 'transparent' : day.count === 1 ? Colors.primaryLight : Colors.primary;
                const borderColor = day.count === 0 ? Colors.border : bgColor;
                return (
                  <View key={i} style={styles.heatmapDay}>
                    <View style={[styles.heatmapCircle, {
                      width: size, height: size, borderRadius: size / 2,
                      backgroundColor: bgColor, borderWidth: day.count === 0 ? 2 : 0, borderColor,
                    }]}>
                      {day.count > 0 && <Text style={styles.heatmapCount}>{day.count}</Text>}
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
                      <View style={[styles.badge, { backgroundColor: tierColor + '20', borderColor: tierColor }]}>
                        <Feather name={a.iconName as any} size={20} color={tierColor} />
                      </View>
                      <Text style={styles.badgeLabel} numberOfLines={1}>{a.title}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Feather name="award" size={32} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>{unlockedAchievements.length} of {ACHIEVEMENTS.length} unlocked</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.quickLinks}>
          <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/goals' as any)}>
            <Feather name="target" size={20} color={Colors.primary} />
            <Text style={styles.linkText}>View Goals</Text>
            <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkButton, { marginTop: 10 }]} onPress={() => router.push('/bodymap' as any)}>
            <Feather name="user" size={20} color={Colors.secondary} />
            <Text style={styles.linkText}>View Body Map</Text>
            <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkButton, { marginTop: 10 }]} onPress={() => router.push('/conditions' as any)}>
            <Feather name="book-open" size={20} color={Colors.accent} />
            <Text style={styles.linkText}>Conditions Library</Text>
            <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, iconColor, value, label }: { icon: string; iconColor: string; value: number; label: string }) {
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

function getSeverityColor(severity: string): string {
  const lower = severity.toLowerCase();
  if (lower.includes('minimal') || lower.includes('none') || lower.includes('normal')) return '#4CAF50';
  if (lower.includes('mild') || lower.includes('low')) return '#FF9800';
  if (lower.includes('moderate')) return '#F57C00';
  if (lower.includes('severe') || lower.includes('high')) return '#E53935';
  return Colors.primary;
}

function interpolateColor(colorA: string, colorB: string, t: number): string {
  const parseHex = (hex: string) => {
    const c = hex.replace('#', '');
    return [parseInt(c.substring(0, 2), 16), parseInt(c.substring(2, 4), 16), parseInt(c.substring(4, 6), 16)];
  };
  const [r1, g1, b1] = parseHex(colorA);
  const [r2, g2, b2] = parseHex(colorB);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)}, ${Math.round(g1 + (g2 - g1) * t)}, ${Math.round(b1 + (b2 - b1) * t)})`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 20 },
  header: { marginTop: 16, marginBottom: 24 },
  title: { fontSize: 28, fontFamily: 'Nunito_700Bold', color: Colors.text },
  subtitle: { fontSize: 15, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary, marginTop: 4 },
  statsGrid: { gap: 12, marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: 16 },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 32, fontFamily: 'Nunito_800ExtraBold', color: Colors.text },
  statLabel: { fontSize: 13, fontFamily: 'Nunito_500Medium', color: Colors.textSecondary, marginTop: 2 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontFamily: 'Nunito_700Bold', color: Colors.text, marginBottom: 12 },
  seeAll: { fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: Colors.primary, marginBottom: 12 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20 },
  avgRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 20 },
  avgLabel: { fontSize: 14, fontFamily: 'Nunito_500Medium', color: Colors.textSecondary, marginRight: 8 },
  avgValue: { fontSize: 36, fontFamily: 'Nunito_800ExtraBold', color: Colors.primary },
  avgOutOf: { fontSize: 16, fontFamily: 'Nunito_500Medium', color: Colors.textTertiary, marginLeft: 2 },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, gap: 6 },
  barColumn: { flex: 1, alignItems: 'center' },
  barTrack: { width: '100%', height: 100, justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '70%', borderRadius: 6, minHeight: 4 },
  barLabel: { fontSize: 11, fontFamily: 'Nunito_500Medium', color: Colors.textTertiary, marginTop: 6 },
  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: 'Nunito_400Regular', color: Colors.textTertiary, textAlign: 'center' },
  trendLegend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { fontSize: 12, fontFamily: 'Nunito_500Medium', color: Colors.textSecondary },
  moodRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  moodName: { width: 80, fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: Colors.text },
  moodBarTrack: { flex: 1, height: 8, backgroundColor: Colors.backgroundSecondary, borderRadius: 4, overflow: 'hidden' as const },
  moodBarFill: { height: '100%', borderRadius: 4, backgroundColor: Colors.primary },
  moodPct: { width: 36, fontSize: 12, fontFamily: 'Nunito_600SemiBold', color: Colors.textSecondary, textAlign: 'right' },
  assessmentName: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.text, marginBottom: 8 },
  assessmentMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  severityText: { fontFamily: 'Nunito_600SemiBold', fontSize: 12 },
  assessmentScore: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.text },
  assessmentDate: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textTertiary },
  trendRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 10 },
  trendDot: { alignItems: 'center', gap: 4 },
  trendCircle: { backgroundColor: Colors.primary },
  trendDate: { fontSize: 10, fontFamily: 'Nunito_400Regular', color: Colors.textTertiary },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight, marginTop: 8 },
  retakeBtnText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.primary },
  categoryRow: { marginBottom: 14 },
  categoryInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  categoryDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  categoryName: { flex: 1, fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: Colors.text },
  categoryCount: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: Colors.textSecondary },
  progressBarTrack: { height: 6, backgroundColor: Colors.backgroundSecondary, borderRadius: 3, overflow: 'hidden' as const },
  progressBarFill: { height: '100%', borderRadius: 3 },
  heatmapRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heatmapDay: { alignItems: 'center', gap: 8 },
  heatmapCircle: { alignItems: 'center', justifyContent: 'center' },
  heatmapCount: { fontSize: 13, fontFamily: 'Nunito_700Bold', color: Colors.textInverse },
  heatmapLabel: { fontSize: 12, fontFamily: 'Nunito_500Medium', color: Colors.textSecondary },
  badgesRow: { flexDirection: 'row', justifyContent: 'space-around' },
  badgeContainer: { alignItems: 'center', width: 70 },
  badge: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  badgeLabel: { fontSize: 11, fontFamily: 'Nunito_500Medium', color: Colors.textSecondary, textAlign: 'center' },
  quickLinks: { marginBottom: 8 },
  linkButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 16,
  },
  linkText: { flex: 1, fontSize: 15, fontFamily: 'Nunito_600SemiBold', color: Colors.text, marginLeft: 12 },
});
