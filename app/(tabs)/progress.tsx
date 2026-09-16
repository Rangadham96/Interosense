import { StyleSheet, Text, View, ScrollView, Platform, TouchableOpacity, Share, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import GetHelpLink from '@/components/GetHelpLink';
import { useMemo, useCallback } from 'react';
import { format, parseISO, startOfWeek, addDays, isSameDay, differenceInDays } from 'date-fns';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';
import { ACHIEVEMENTS, TIER_COLORS } from '@/constants/achievements';
import { CLINICAL_SCALES, MAIA2_SCALE, generateClinicianReport, PastMaia2Assessment, hasCompleteSubscaleScores } from '@/constants/clinical-scales';
import RadarChart from '@/components/RadarChart';
import { formatPatternLabel, getBodyPatternSummary } from '@/lib/body-patterns';

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
  const topPadding = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);

  const {
    sessions,
    checkins,
    assessments,
    bodyMarks,
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
      if (a.scaleId === 'maia2') return;
      if (!grouped[a.scaleId]) grouped[a.scaleId] = [];
      grouped[a.scaleId].push(a);
    });
    return Object.entries(grouped).map(([scaleId, records]) => {
      const sorted = [...records].sort((a, b) => a.completedAt.localeCompare(b.completedAt));
      const scale = CLINICAL_SCALES.find(s => s.id === scaleId);
      return { scaleId, scaleName: scale?.name || records[0].scaleName, records: sorted, scale };
    });
  }, [assessments]);

  const maia2Assessments = useMemo(() => {
    return assessments
      .filter(a => a.scaleId === 'maia2')
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  }, [assessments]);

  const latestMaia2 = maia2Assessments[0] ?? null;
  const previousMaia2 = maia2Assessments[1] ?? null;

  const latestMaia2SubscalesComplete = useMemo(
    () => hasCompleteSubscaleScores(latestMaia2?.subscaleScores),
    [latestMaia2],
  );

  const maia2RadarDimensions = useMemo(() => {
    if (!latestMaia2SubscalesComplete || !latestMaia2?.subscaleScores) return null;
    return MAIA2_SCALE.subscales.map(s => ({
      key: s.key,
      label: s.name,
      value: latestMaia2.subscaleScores![s.key],
      maxValue: 5,
    }));
  }, [latestMaia2, latestMaia2SubscalesComplete]);

  const maia2PrevRadarDimensions = useMemo(() => {
    if (!hasCompleteSubscaleScores(previousMaia2?.subscaleScores)) return undefined;
    return MAIA2_SCALE.subscales.map(s => ({
      key: s.key,
      label: s.name,
      value: previousMaia2!.subscaleScores![s.key],
      maxValue: 5,
    }));
  }, [previousMaia2]);

  const handleShareWithClinician = useCallback(async () => {
    if (!latestMaia2SubscalesComplete || !latestMaia2?.subscaleScores) return;
    const date = format(parseISO(latestMaia2.completedAt), 'MMMM d, yyyy');
    const pastAssessments: PastMaia2Assessment[] = maia2Assessments
      .slice(1, 4)
      .filter(a => hasCompleteSubscaleScores(a.subscaleScores))
      .map(a => ({
        date: format(parseISO(a.completedAt), 'MMMM d, yyyy'),
        subscaleScores: a.subscaleScores!,
      }));
    const report = generateClinicianReport(
      latestMaia2.subscaleScores,
      date,
      undefined,
      pastAssessments.length > 0 ? pastAssessments : undefined,
    );
    try {
      await Share.share({ message: report, title: 'MAIA-2 Body Awareness Profile' });
    } catch {
      Alert.alert('Unable to share', 'Please try again.');
    }
  }, [latestMaia2, maia2Assessments]);

  const showMaia2Prompt = useMemo(() => {
    if (maia2Assessments.length === 0 && totalSessions >= 10) return true;
    if (maia2Assessments.length > 0) {
      const daysSince = differenceInDays(new Date(), parseISO(maia2Assessments[0].completedAt));
      return daysSince >= 30;
    }
    return false;
  }, [maia2Assessments, totalSessions]);

  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1; });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const maxCount = entries.length > 0 ? entries[0][1] : 1;
    return { entries, maxCount };
  }, [sessions]);

  const topRatedExercises = useMemo(() => {
    const ratingMap: Record<string, { title: string; totalRating: number; count: number }> = {};
    sessions.forEach(s => {
      if (s.rating && s.rating > 0) {
        if (!ratingMap[s.exerciseId]) {
          ratingMap[s.exerciseId] = { title: s.exerciseTitle, totalRating: 0, count: 0 };
        }
        ratingMap[s.exerciseId].totalRating += s.rating;
        ratingMap[s.exerciseId].count += 1;
      }
    });
    return Object.entries(ratingMap)
      .map(([id, data]) => ({ id, title: data.title, avg: data.totalRating / data.count, count: data.count }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3);
  }, [sessions]);

  const bodyPatternSummary = useMemo(
    () => getBodyPatternSummary(bodyMarks, checkins),
    [bodyMarks, checkins],
  );

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

  const recentCheckinAverages = useMemo(() => {
    if (checkins.length === 0) return null;
    const recent = [...checkins]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);
    const avgAwareness = recent.reduce((s, c) => s + c.awarenessScore, 0) / recent.length;
    const avgEnergy = recent.reduce((s, c) => s + c.energyLevel, 0) / recent.length;
    const avgStress = recent.reduce((s, c) => s + (c.stressLevel ?? 5), 0) / recent.length;
    return {
      count: recent.length,
      awareness: Math.round(avgAwareness * 10) / 10,
      energy: Math.round(avgEnergy * 10) / 10,
      stress: Math.round(avgStress * 10) / 10,
    };
  }, [checkins]);

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={styles.title}>Your Progress</Text>
            <GetHelpLink />
          </View>
          <Text style={styles.subtitle}>Your interoceptive journey, visualised</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Check-in Snapshot</Text>
          <View style={styles.card}>
            {recentCheckinAverages !== null ? (
              <View>
                <Text style={styles.snapshotDescription}>
                  Your averages across the last {recentCheckinAverages.count} check-in{recentCheckinAverages.count === 1 ? '' : 's'}. These are separate self-reports, not a combined clinical score.
                </Text>
                <View style={styles.snapshotMetrics}>
                  <View style={styles.snapshotMetric}>
                    <Text style={styles.snapshotValue}>{recentCheckinAverages.awareness.toFixed(1)}</Text>
                    <Text style={styles.snapshotLabel}>Awareness</Text>
                  </View>
                  <View style={styles.snapshotMetric}>
                    <Text style={styles.snapshotValue}>{recentCheckinAverages.energy.toFixed(1)}</Text>
                    <Text style={styles.snapshotLabel}>Energy</Text>
                  </View>
                  <View style={styles.snapshotMetric}>
                    <Text style={styles.snapshotValue}>{recentCheckinAverages.stress.toFixed(1)}</Text>
                    <Text style={styles.snapshotLabel}>Stress</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Feather name="activity" size={32} color={Colors.primary} />
                <Text style={styles.emptyText}>Complete a check-in to begin seeing your recent self-reported patterns</Text>
                <TouchableOpacity style={styles.emptyActionBtn} onPress={() => router.push('/(tabs)/checkin')}>
                  <Text style={styles.emptyActionText}>Start a Check-In</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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

        {checkins.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Check-in Awareness Trend</Text>
            <View style={styles.card}>
              <Text style={styles.chartContextLabel}>
                Your self-reported awareness from recent check-ins.
                {maia2Assessments.length === 0 && ' Take the MAIA-2 for a clinically validated subscale profile.'}
              </Text>
              <View style={styles.barChart}>
                {last7Checkins.map((c, i) => {
                  const ratio = c.awarenessScore / 10;
                  const barColor = interpolateColor(Colors.secondary, Colors.primary, ratio);
                  return (
                    <View key={c.id || i} style={styles.barColumn}>
                      <View style={styles.barTrack}>
                        <View style={[styles.bar, { height: `${Math.max(ratio * 100, 5)}%` as any, backgroundColor: barColor }]} />
                      </View>
                      <Text style={styles.barLabel}>{format(parseISO(c.date), 'dd')}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {bodyPatternSummary.totalReports > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Body Signal Patterns</Text>
            <View style={[styles.card, styles.bodyPatternCard]}>
              <View style={styles.bodyPatternHeader}>
                <View style={styles.bodyPatternIcon}>
                  <Feather name="map-pin" size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bodyPatternTitle}>Last {bodyPatternSummary.windowDays} days</Text>
                  <Text style={styles.bodyPatternMeta}>
                    {bodyPatternSummary.totalReports} recorded entr{bodyPatternSummary.totalReports === 1 ? 'y' : 'ies'} across {bodyPatternSummary.activeDays} day{bodyPatternSummary.activeDays === 1 ? '' : 's'}
                  </Text>
                </View>
              </View>

              {bodyPatternSummary.topSensation && (
                <View style={styles.bodyPatternRow}>
                  <Text style={styles.bodyPatternLabel}>Most recorded sensation</Text>
                  <Text style={styles.bodyPatternValue}>
                    {formatPatternLabel(bodyPatternSummary.topSensation.value)} · {bodyPatternSummary.topSensation.count} times
                  </Text>
                </View>
              )}
              {bodyPatternSummary.topRegion && (
                <View style={styles.bodyPatternRow}>
                  <Text style={styles.bodyPatternLabel}>Most recorded area</Text>
                  <Text style={styles.bodyPatternValue}>
                    {formatPatternLabel(bodyPatternSummary.topRegion.value)} · {bodyPatternSummary.topRegion.count} times
                  </Text>
                </View>
              )}
              {bodyPatternSummary.averageMappedIntensity !== null && (
                <View style={styles.bodyPatternRow}>
                  <Text style={styles.bodyPatternLabel}>Average mapped intensity</Text>
                  <Text style={styles.bodyPatternValue}>{bodyPatternSummary.averageMappedIntensity.toFixed(1)}/5</Text>
                </View>
              )}

              {!bodyPatternSummary.topSensation && !bodyPatternSummary.topRegion && (
                <Text style={styles.bodyPatternEmpty}>
                  Keep recording on different days to see repeated sensations and areas.
                </Text>
              )}
              <Text style={styles.bodyPatternCaution}>
                These are patterns in what you entered, not a diagnosis or explanation of cause.
              </Text>
              <TouchableOpacity style={styles.bodyPatternLink} onPress={() => router.push('/bodymap' as any)}>
                <Text style={styles.bodyPatternLinkText}>Open Body Map</Text>
                <Feather name="arrow-right" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {showMaia2Prompt && (
          <TouchableOpacity
            style={styles.maia2Prompt}
            onPress={() => router.push('/assessment/maia2' as any)}
            activeOpacity={0.85}
          >
            <View style={styles.maia2PromptIcon}>
              <Feather name="activity" size={20} color="#4A6FA5" />
            </View>
            <View style={styles.maia2PromptContent}>
              <Text style={styles.maia2PromptTitle}>
                {maia2Assessments.length === 0 ? 'Measure Your Body Awareness' : 'Monthly MAIA-2 Check-in'}
              </Text>
              <Text style={styles.maia2PromptSubtitle}>
                {maia2Assessments.length === 0
                  ? 'Take the validated MAIA-2 assessment to view your self-reported profile across 8 dimensions.'
                  : "It's been 30+ days since your last MAIA-2. Track your progress with a new measurement."}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#4A6FA5" />
          </TouchableOpacity>
        )}

        {latestMaia2 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Body Awareness Profile</Text>
              <View style={styles.sectionHeaderActions}>
                {maia2Assessments.length >= 2 && (
                  <TouchableOpacity onPress={() => router.push('/maia2-history' as any)} style={{ marginRight: 12 }}>
                    <Text style={styles.seeAll}>History</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => router.push('/assessment/maia2' as any)}>
                  <Text style={styles.seeAll}>Retake</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={[styles.card, styles.maia2Card]}>
              <Text style={styles.maia2CardDate}>
                {format(parseISO(latestMaia2.completedAt), 'MMM d, yyyy')} · MAIA-2
              </Text>

              {latestMaia2SubscalesComplete && maia2RadarDimensions ? (
                <>
                  <View style={styles.maia2RadarWrap}>
                    <RadarChart
                      dimensions={maia2RadarDimensions}
                      size={260}
                      color={Colors.primary}
                      secondaryColor={Colors.secondary}
                      secondaryDimensions={maia2PrevRadarDimensions}
                    />
                  </View>
                  {maia2PrevRadarDimensions && previousMaia2 && (
                    <View style={styles.maia2Legend}>
                      <View style={styles.maia2LegendItem}>
                        <View style={[styles.maia2LegendDot, { backgroundColor: Colors.primary }]} />
                        <Text style={styles.maia2LegendText}>{format(parseISO(latestMaia2.completedAt), 'MMM d')}</Text>
                      </View>
                      <View style={styles.maia2LegendItem}>
                        <View style={[styles.maia2LegendDot, { backgroundColor: Colors.secondary, borderStyle: 'dashed' as const }]} />
                        <Text style={styles.maia2LegendText}>{format(parseISO(previousMaia2.completedAt), 'MMM d')}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.subscaleProfileSection}>
                    <Text style={styles.subscaleProfileTitle}>8-Dimension Subscale Profile</Text>
                    <Text style={styles.subscaleProfileNote}>
                      MAIA-2 authors advise against a single composite score. Interpret the pattern across all 8 subscales.
                    </Text>
                    {MAIA2_SCALE.subscales.map(s => {
                      const score = latestMaia2.subscaleScores![s.key];
                      const pct = (score / 5) * 100;
                      const barColor = score >= 3.5 ? Colors.success : score >= 2 ? Colors.primary : Colors.warning;
                      return (
                        <View key={s.key} style={styles.subscaleProfileRow}>
                          <View style={styles.subscaleProfileHeader}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.subscaleProfileName}>{s.name}</Text>
                              <Text style={styles.subscaleDimensionWhat}>{MAIA2_DIMENSION_WHAT[s.key]}</Text>
                            </View>
                            <Text style={[styles.subscaleProfileScore, { color: barColor }]}>{score.toFixed(1)}/5</Text>
                          </View>
                          <View style={styles.subscaleProfileTrack}>
                            <View style={[styles.subscaleProfileFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
                          </View>
                          <Text style={styles.subscaleProfileDesc}>{getSubscaleOneLiner(s.key, score)}</Text>
                        </View>
                      );
                    })}
                  </View>

                  {hasCompleteSubscaleScores(previousMaia2?.subscaleScores) && previousMaia2?.subscaleScores && (
                    <View style={styles.maia2Comparisons}>
                      <Text style={styles.maia2ComparisonTitle}>Month-over-Month</Text>
                      {MAIA2_SCALE.subscales.map(s => {
                        const current = latestMaia2.subscaleScores![s.key];
                        const prev = previousMaia2.subscaleScores![s.key];
                        const diff = current - prev;
                        const arrow = diff > 0.1 ? '↑' : diff < -0.1 ? '↓' : '→';
                        const arrowColor = diff > 0.1 ? Colors.success : diff < -0.1 ? Colors.error : Colors.textTertiary;
                        return (
                          <View key={s.key} style={styles.maia2CompRow}>
                            <Text style={styles.maia2CompLabel}>{s.name}</Text>
                            <Text style={[styles.maia2CompArrow, { color: arrowColor }]}>{arrow}</Text>
                            <Text style={styles.maia2CompValues}>{prev.toFixed(1)} → {current.toFixed(1)}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.subscaleIncompleteState}>
                  <Feather name="alert-circle" size={28} color={Colors.warning} />
                  <Text style={styles.subscaleIncompleteTitle}>Subscale data incomplete</Text>
                  <Text style={styles.subscaleIncompleteText}>
                    This assessment is missing one or more subscale scores and cannot be displayed. This can happen if the assessment was saved before the full subscale profile was introduced, or if data was lost during sync.
                  </Text>
                  <TouchableOpacity
                    style={styles.subscaleIncompleteBtn}
                    onPress={() => router.push('/assessment/maia2' as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.subscaleIncompleteBtnText}>Retake Assessment</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[styles.shareClinicianBtn, !latestMaia2SubscalesComplete && styles.shareClinicianBtnDisabled]}
                onPress={handleShareWithClinician}
                activeOpacity={latestMaia2SubscalesComplete ? 0.8 : 1}
                disabled={!latestMaia2SubscalesComplete}
              >
                <Feather name="share-2" size={16} color={latestMaia2SubscalesComplete ? Colors.primary : Colors.textTertiary} />
                <Text style={[styles.shareClinicianText, !latestMaia2SubscalesComplete && styles.shareClinicianTextDisabled]}>
                  Share with Clinician
                </Text>
              </TouchableOpacity>
              {!latestMaia2SubscalesComplete ? (
                <Text style={styles.shareClinicianNote}>
                  Sharing is unavailable until a complete assessment with all 8 subscale scores is recorded.
                </Text>
              ) : (
                <Text style={styles.shareClinicianNote}>
                  {maia2Assessments.length >= 2
                    ? `Generates a formatted report with your current profile plus ${Math.min(maia2Assessments.length - 1, 3)} prior assessment${Math.min(maia2Assessments.length - 1, 3) !== 1 ? 's' : ''} for longitudinal context.`
                    : 'Generates a formatted report of your 8 subscale scores you can send by email, messages, or print.'}
                </Text>
              )}
              {maia2Assessments.length >= 2 && (
                <TouchableOpacity
                  style={styles.viewHistoryBtn}
                  onPress={() => router.push('/maia2-history' as any)}
                  activeOpacity={0.8}
                >
                  <Feather name="clock" size={14} color={Colors.textSecondary} />
                  <Text style={styles.viewHistoryText}>View full history ({maia2Assessments.length} assessments)</Text>
                  <Feather name="chevron-right" size={14} color={Colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {stressTrend.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stress Trend</Text>
            <View style={styles.card}>
              <Text style={styles.chartContextLabel}>Lower bars indicate calmer days. A downward trend over time is meaningful progress.</Text>
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
              <Text style={styles.chartContextLabel}>How your emotional states have distributed across all check-ins</Text>
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

        {topRatedExercises.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What Has Helped You Most</Text>
            <View style={styles.card}>
              <Text style={styles.chartContextLabel}>Your highest-rated exercises based on your own feedback</Text>
              {topRatedExercises.map((ex, i) => (
                <TouchableOpacity
                  key={ex.id}
                  style={styles.topExerciseRow}
                  onPress={() => router.push(`/exercise/${ex.id}` as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.topExerciseRank}>
                    <Text style={styles.topExerciseRankNum}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.topExerciseTitle} numberOfLines={1}>{ex.title}</Text>
                    <Text style={styles.topExerciseMeta}>{ex.count} session{ex.count !== 1 ? 's' : ''}</Text>
                  </View>
                  <View style={styles.starRow}>
                    {[1,2,3,4,5].map(s => (
                      <Feather key={s} name="star" size={12} color={s <= Math.round(ex.avg) ? Colors.warning : Colors.border} />
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {assessmentHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Clinical Assessment Trends</Text>
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
            <View style={styles.clinicalDisclaimer}>
              <Feather name="info" size={13} color={Colors.textTertiary} />
              <Text style={styles.clinicalDisclaimerText}>
                These scores are for personal tracking only and are not a clinical diagnosis. Always speak with a qualified professional about your mental health.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercise Categories</Text>
          <View style={styles.card}>
            <Text style={styles.chartContextLabel}>The more diverse your practice, the broader your body awareness</Text>
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
                <Feather name="layers" size={32} color={Colors.primary} />
                <Text style={styles.emptyText}>Your story starts here</Text>
                <Text style={styles.emptySubText}>Complete exercises to see your journey take shape</Text>
                <TouchableOpacity style={styles.emptyActionBtn} onPress={() => router.push('/(tabs)/exercises')}>
                  <Text style={styles.emptyActionText}>Browse Exercises</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.card}>
            <Text style={styles.chartContextLabel}>Consistency over intensity. Every session matters.</Text>
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
                <Feather name="award" size={32} color={Colors.primary} />
                <Text style={styles.emptyText}>Your first milestone is within reach</Text>
                <Text style={styles.emptySubText}>Complete exercises and check-ins to unlock achievements</Text>
                <TouchableOpacity style={styles.emptyActionBtn} onPress={() => router.push('/achievements' as any)}>
                  <Text style={styles.emptyActionText}>View Milestones</Text>
                </TouchableOpacity>
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

const MAIA2_DIMENSION_WHAT: Record<string, string> = {
  noticing: 'Detecting physical sensations (heartbeat, breath, hunger, tension) before they demand your attention',
  notDistracting: 'Staying present with discomfort rather than distracting yourself from unpleasant sensations',
  notWorrying: 'Noticing body signals without turning them into anxiety or catastrophic thoughts',
  attentionRegulation: 'Deliberately directing and sustaining your attention to specific areas of your body',
  emotionalAwareness: 'Recognising how emotions create physical sensations and how sensations colour your mood',
  selfRegulation: 'Using body awareness to calm yourself when distressed, overwhelmed, or anxious',
  bodyListening: 'Consulting your body as a source of wisdom for decisions, rest, and self-care',
  trusting: 'Experiencing your body as a safe, reliable place to be rather than something threatening',
};

function getSubscaleOneLiner(key: string, score: number): string {
  const level = score >= 3.5 ? 'high' : score >= 2 ? 'moderate' : 'developing';
  const map: Record<string, Record<string, string>> = {
    noticing: {
      high: `${score.toFixed(1)}: You naturally pick up on what your body is communicating.`,
      moderate: `${score.toFixed(1)}: You notice body signals some of the time.`,
      developing: `${score.toFixed(1)}: Developing sensitivity to body signals.`,
    },
    notDistracting: {
      high: `${score.toFixed(1)}: You tend to stay present with uncomfortable sensations.`,
      moderate: `${score.toFixed(1)}: You sometimes push away discomfort rather than staying with it.`,
      developing: `${score.toFixed(1)}: Tendency to distract from physical discomfort.`,
    },
    notWorrying: {
      high: `${score.toFixed(1)}: You can notice discomfort without catastrophising.`,
      moderate: `${score.toFixed(1)}: Sensations sometimes trigger worry.`,
      developing: `${score.toFixed(1)}: Body sensations tend to feel distressing.`,
    },
    attentionRegulation: {
      high: `${score.toFixed(1)}: You can deliberately focus and redirect attention in the body.`,
      moderate: `${score.toFixed(1)}: Moderate ability to sustain body-focused attention.`,
      developing: `${score.toFixed(1)}: Sustaining body awareness is an area of growth.`,
    },
    emotionalAwareness: {
      high: `${score.toFixed(1)}: You recognise how emotions live in your body.`,
      moderate: `${score.toFixed(1)}: Some awareness of the mind-body connection.`,
      developing: `${score.toFixed(1)}: The mind-body bridge is developing.`,
    },
    selfRegulation: {
      high: `${score.toFixed(1)}: You can use body awareness to calm distress.`,
      moderate: `${score.toFixed(1)}: Sometimes able to regulate through body awareness.`,
      developing: `${score.toFixed(1)}: Using body awareness for regulation is emerging.`,
    },
    bodyListening: {
      high: `${score.toFixed(1)}: You consult your body as a source of wisdom.`,
      moderate: `${score.toFixed(1)}: Occasionally listen to your body for guidance.`,
      developing: `${score.toFixed(1)}: Body listening is an area to explore.`,
    },
    trusting: {
      high: `${score.toFixed(1)}: You experience your body as safe and trustworthy.`,
      moderate: `${score.toFixed(1)}: Some sense of body as safe, with room to deepen.`,
      developing: `${score.toFixed(1)}: Feeling safe in your body is a growing edge.`,
    },
  };
  return map[key]?.[level] ?? `${score.toFixed(1)}/5`;
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
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 28, fontFamily: 'Nunito_800ExtraBold', color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary, marginTop: 4 },
  statsGrid: { gap: 12, marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: 16 },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 32, fontFamily: 'Nunito_800ExtraBold', color: Colors.text },
  statLabel: { fontSize: 13, fontFamily: 'Nunito_500Medium', color: Colors.textSecondary, marginTop: 2 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeaderActions: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 12, fontFamily: 'Nunito_700Bold', color: Colors.textSecondary, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 12 },
  seeAll: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: Colors.primary, marginBottom: 12 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20 },
  bodyPatternCard: { padding: 18 },
  bodyPatternHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  bodyPatternIcon: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  bodyPatternTitle: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.text },
  bodyPatternMeta: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  bodyPatternRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: 16, paddingVertical: 9, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  bodyPatternLabel: { flex: 1, fontFamily: 'Nunito_500Medium', fontSize: 12, color: Colors.textSecondary },
  bodyPatternValue: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: Colors.text, textAlign: 'right' },
  bodyPatternEmpty: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  bodyPatternCaution: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.textTertiary, lineHeight: 16, marginTop: 10 },
  bodyPatternLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, alignSelf: 'flex-start' },
  bodyPatternLinkText: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.primary },
  chartContextLabel: { fontSize: 12, fontFamily: 'Nunito_400Regular', color: Colors.textTertiary, marginBottom: 14, lineHeight: 17 },

  snapshotDescription: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary, lineHeight: 19, marginBottom: 16 },
  snapshotMetrics: { flexDirection: 'row', gap: 10 },
  snapshotMetric: { flex: 1, backgroundColor: Colors.backgroundSecondary, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  snapshotValue: { fontSize: 22, fontFamily: 'Nunito_800ExtraBold', color: Colors.primary },
  snapshotLabel: { fontSize: 11, fontFamily: 'Nunito_600SemiBold', color: Colors.textSecondary, marginTop: 2 },

  avgRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  avgLabel: { fontSize: 14, fontFamily: 'Nunito_500Medium', color: Colors.textSecondary, marginRight: 8 },
  avgValue: { fontSize: 36, fontFamily: 'Nunito_800ExtraBold', color: Colors.primary },
  avgOutOf: { fontSize: 16, fontFamily: 'Nunito_500Medium', color: Colors.textTertiary, marginLeft: 2 },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, gap: 6 },
  barColumn: { flex: 1, alignItems: 'center' },
  barTrack: { width: '100%', height: 100, justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '70%', borderRadius: 6, minHeight: 4 },
  barLabel: { fontSize: 11, fontFamily: 'Nunito_500Medium', color: Colors.textTertiary, marginTop: 6 },
  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: 'Nunito_500Medium', color: Colors.textSecondary, textAlign: 'center' },
  emptySubText: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: Colors.textTertiary, textAlign: 'center' },
  emptyActionBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 4 },
  emptyActionText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.textInverse },
  trendLegend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { fontSize: 12, fontFamily: 'Nunito_500Medium', color: Colors.textSecondary },
  moodRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  moodName: { width: 80, fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: Colors.text },
  moodBarTrack: { flex: 1, height: 8, backgroundColor: Colors.backgroundSecondary, borderRadius: 4, overflow: 'hidden' as const },
  moodBarFill: { height: '100%', borderRadius: 4, backgroundColor: Colors.primary },
  moodPct: { width: 36, fontSize: 12, fontFamily: 'Nunito_600SemiBold', color: Colors.textSecondary, textAlign: 'right' },

  topExerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  topExerciseRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  topExerciseRankNum: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.primary },
  topExerciseTitle: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.text },
  topExerciseMeta: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  starRow: { flexDirection: 'row', gap: 2 },

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
  clinicalDisclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.backgroundSecondary, borderRadius: 12, padding: 12, marginTop: 4 },
  clinicalDisclaimerText: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textTertiary, flex: 1, lineHeight: 18 },

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
  badge: { width: 52, height: 52, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  badgeLabel: { fontSize: 11, fontFamily: 'Nunito_500Medium', color: Colors.textSecondary, textAlign: 'center' },
  quickLinks: { marginBottom: 8 },
  linkButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 16,
  },
  linkText: { flex: 1, fontSize: 15, fontFamily: 'Nunito_600SemiBold', color: Colors.text, marginLeft: 12 },
  awarenessSubtitle: { fontSize: 12, fontFamily: 'Nunito_400Regular', color: Colors.textTertiary, marginBottom: 4 },
  maia2Prompt: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDF2FB',
    borderRadius: 16, padding: 16, marginBottom: 24, gap: 12,
    borderWidth: 1, borderColor: '#C8D8F0',
  },
  maia2PromptIcon: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: '#D5E3F7',
    alignItems: 'center', justifyContent: 'center',
  },
  maia2PromptContent: { flex: 1 },
  maia2PromptTitle: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#2D4A7A', marginBottom: 4 },
  maia2PromptSubtitle: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: '#4A6FA5', lineHeight: 17 },
  maia2Card: { alignItems: 'center' },
  maia2CardDate: { fontFamily: 'Nunito_500Medium', fontSize: 12, color: Colors.textTertiary, marginBottom: 16, alignSelf: 'flex-start' },
  maia2RadarWrap: { marginBottom: 12 },
  maia2Legend: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  maia2LegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  maia2LegendDot: { width: 10, height: 10, borderRadius: 5 },
  maia2LegendText: { fontFamily: 'Nunito_500Medium', fontSize: 12, color: Colors.textSecondary },
  maia2Comparisons: { width: '100%', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 14, marginTop: 4 },
  maia2ComparisonTitle: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.text, marginBottom: 8 },
  maia2CompRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3, gap: 6 },
  maia2CompLabel: { fontFamily: 'Nunito_500Medium', fontSize: 12, color: Colors.textSecondary, flex: 1 },
  maia2CompArrow: { fontFamily: 'Nunito_700Bold', fontSize: 14, width: 16, textAlign: 'center' },
  maia2CompValues: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: Colors.textTertiary, width: 80, textAlign: 'right' },

  subscaleProfileSection: {
    width: '100%', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 16, marginTop: 4,
  },
  subscaleProfileTitle: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.text, marginBottom: 6 },
  subscaleProfileNote: {
    fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.textTertiary, lineHeight: 16, marginBottom: 14,
    backgroundColor: Colors.backgroundSecondary, borderRadius: 8, padding: 10,
  },
  subscaleProfileRow: { marginBottom: 14 },
  subscaleProfileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  subscaleProfileName: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.text },
  subscaleDimensionWhat: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.textTertiary, lineHeight: 15, marginTop: 2 },
  subscaleProfileScore: { fontFamily: 'Nunito_700Bold', fontSize: 13 },
  subscaleProfileTrack: {
    height: 6, backgroundColor: Colors.backgroundSecondary, borderRadius: 3, overflow: 'hidden' as const, marginBottom: 5,
  },
  subscaleProfileFill: { height: '100%', borderRadius: 3 },
  subscaleProfileDesc: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },

  clinicalFlagsSection: {
    width: '100%', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 16, marginTop: 4,
  },
  clinicalFlagsTitle: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.text, marginBottom: 10 },
  clinicalFlagCard: { borderRadius: 12, padding: 14, marginBottom: 10 },
  flagType_professional: { backgroundColor: '#EDF2FB' },
  flagType_distress: { backgroundColor: '#FDF1EE' },
  flagType_encouragement: { backgroundColor: '#EFF7F0' },
  clinicalFlagHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  clinicalFlagTitle: { fontFamily: 'Nunito_700Bold', fontSize: 13, flex: 1 },
  clinicalFlagMessage: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  subscaleIncompleteState: {
    alignItems: 'center', paddingVertical: 20, paddingHorizontal: 8, gap: 10,
  },
  subscaleIncompleteTitle: {
    fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.warning, textAlign: 'center',
  },
  subscaleIncompleteText: {
    fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 19,
  },
  subscaleIncompleteBtn: {
    marginTop: 6, paddingVertical: 10, paddingHorizontal: 24,
    backgroundColor: Colors.primary, borderRadius: 10,
  },
  subscaleIncompleteBtnText: {
    fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#FFF',
  },
  shareClinicianBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20,
    width: '100%', marginTop: 16,
  },
  shareClinicianBtnDisabled: {
    borderColor: Colors.border, opacity: 0.5,
  },
  shareClinicianText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.primary },
  shareClinicianTextDisabled: { color: Colors.textTertiary },
  shareClinicianNote: {
    fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.textTertiary,
    textAlign: 'center', marginTop: 8, lineHeight: 16,
  },
  viewHistoryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, marginTop: 8, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  viewHistoryText: {
    flex: 1, fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.textSecondary,
  },
});
