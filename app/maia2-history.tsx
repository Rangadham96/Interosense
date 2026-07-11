import React, { useMemo, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, Share, Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import Svg, { Polyline, Circle, Line, Text as SvgText, Rect, Path } from 'react-native-svg';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';
import { MAIA2_SCALE, getMaia2OverallAverage, generateClinicianReport, PastMaia2Assessment } from '@/constants/clinical-scales';
import RadarChart from '@/components/RadarChart';
import { exportMaia2Pdf } from '@/lib/maia2-pdf';

const SUBSCALE_SHORT: Record<string, string> = {
  noticing: 'Not',
  notDistracting: 'NDi',
  notWorrying: 'NWo',
  attentionRegulation: 'Att',
  emotionalAwareness: 'Emo',
  selfRegulation: 'Reg',
  bodyListening: 'BLi',
  trusting: 'Tru',
};

const SUBSCALE_FULL: Record<string, string> = {
  noticing: 'Noticing',
  notDistracting: 'Not-Distracting',
  notWorrying: 'Not-Worrying',
  attentionRegulation: 'Attention Reg.',
  emotionalAwareness: 'Emotional Awareness',
  selfRegulation: 'Self-Regulation',
  bodyListening: 'Body Listening',
  trusting: 'Trusting',
};

interface TrendPoint {
  date: string;
  value: number;
}

interface SubscaleTrendChartProps {
  subscaleKey: string;
  subscaleName: string;
  points: TrendPoint[];
  expanded: boolean;
  onPress: () => void;
  cardWidth: number;
}

function SubscaleTrendChart({ subscaleKey, subscaleName, points, expanded, onPress, cardWidth }: SubscaleTrendChartProps) {
  if (points.length < 2) return null;

  const compactH = 80;
  const expandedH = 160;
  const chartH = expanded ? expandedH : compactH;

  const paddingLeft = expanded ? 32 : 8;
  const paddingRight = expanded ? 12 : 8;
  const paddingTop = expanded ? 14 : 10;
  const paddingBottom = expanded ? 28 : 10;

  const innerW = cardWidth - paddingLeft - paddingRight;
  const innerH = chartH - paddingTop - paddingBottom;

  const minVal = 0;
  const maxVal = 5;

  function xPos(i: number) {
    if (points.length === 1) return paddingLeft + innerW / 2;
    return paddingLeft + (i / (points.length - 1)) * innerW;
  }

  function yPos(v: number) {
    return paddingTop + ((maxVal - v) / (maxVal - minVal)) * innerH;
  }

  const polyPoints = points.map((p, i) => `${xPos(i)},${yPos(p.value)}`).join(' ');

  const first = points[0].value;
  const last = points[points.length - 1].value;
  const diff = last - first;
  const lineColor = diff > 0.15 ? Colors.success : diff < -0.15 ? Colors.error : Colors.primary;

  const yGridValues = expanded ? [0, 1, 2, 3, 4, 5] : [];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={[
        trendStyles.card,
        expanded ? trendStyles.cardExpanded : { width: cardWidth },
      ]}
    >
      <View style={trendStyles.cardHeader}>
        <Text style={trendStyles.cardTitle} numberOfLines={1}>
          {expanded ? (SUBSCALE_FULL[subscaleKey] ?? subscaleName) : (SUBSCALE_SHORT[subscaleKey] ?? subscaleName)}
        </Text>
        <View style={trendStyles.cardHeaderRight}>
          <Text style={[trendStyles.cardScore, { color: lineColor }]}>{last.toFixed(1)}</Text>
          {diff > 0.15 ? (
            <Feather name="trending-up" size={12} color={Colors.success} />
          ) : diff < -0.15 ? (
            <Feather name="trending-down" size={12} color={Colors.error} />
          ) : (
            <Feather name="minus" size={12} color={Colors.textTertiary} />
          )}
        </View>
      </View>

      <Svg width={cardWidth} height={chartH} style={{ marginTop: 4 }}>
        {expanded && yGridValues.map(v => {
          const y = yPos(v);
          return (
            <React.Fragment key={`grid-${v}`}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={cardWidth - paddingRight}
                y2={y}
                stroke={Colors.border}
                strokeWidth={v === 0 || v === 5 ? 1 : 0.5}
                opacity={0.7}
              />
              <SvgText
                x={paddingLeft - 4}
                y={y + 3.5}
                textAnchor="end"
                fontSize={8}
                fontFamily="Nunito_500Medium"
                fill={Colors.textTertiary}
              >
                {v}
              </SvgText>
            </React.Fragment>
          );
        })}

        {expanded && points.map((p, i) => {
          const x = xPos(i);
          const dateLabel = format(parseISO(p.date), 'MMM d');
          return (
            <SvgText
              key={`xlabel-${i}`}
              x={x}
              y={chartH - 4}
              textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
              fontSize={7.5}
              fontFamily="Nunito_500Medium"
              fill={Colors.textTertiary}
            >
              {dateLabel}
            </SvgText>
          );
        })}

        <Polyline
          points={polyPoints}
          fill="none"
          stroke={lineColor}
          strokeWidth={expanded ? 2 : 1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((p, i) => {
          const cx = xPos(i);
          const cy = yPos(p.value);
          const isFirst = i === 0;
          const isLast = i === points.length - 1;
          const showDot = expanded || isFirst || isLast;

          if (!showDot) return null;

          return (
            <React.Fragment key={`dot-${i}`}>
              <Circle
                cx={cx}
                cy={cy}
                r={expanded ? 3.5 : 3}
                fill={Colors.surface}
                stroke={lineColor}
                strokeWidth={1.5}
              />
              {expanded && (
                <>
                  <Rect
                    x={cx - 10}
                    y={cy - 17}
                    width={20}
                    height={12}
                    rx={4}
                    fill={lineColor + 'EE'}
                  />
                  <SvgText
                    x={cx}
                    y={cy - 8}
                    textAnchor="middle"
                    fontSize={8}
                    fontFamily="Nunito_700Bold"
                    fill={Colors.surface}
                  >
                    {p.value.toFixed(1)}
                  </SvgText>
                </>
              )}
            </React.Fragment>
          );
        })}
      </Svg>

      {expanded && (
        <Text style={trendStyles.expandedNote}>
          {points.length} assessment{points.length !== 1 ? 's' : ''} — scale 0 to 5
        </Text>
      )}
    </TouchableOpacity>
  );
}

const trendStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 10,
    paddingBottom: 6,
    marginBottom: 8,
  },
  cardExpanded: {
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 10,
    color: Colors.textSecondary,
    flex: 1,
  },
  cardScore: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
    marginRight: 2,
  },
  expandedNote: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 9.5,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: 2,
  },
});

export default function Maia2HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { assessments, profile } = useApp();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [expandedTrendKey, setExpandedTrendKey] = useState<string | null>(null);

  const screenWidth = Dimensions.get('window').width;
  const horizontalPadding = 32;
  const cardGap = 8;
  const compactCardWidth = Math.floor((screenWidth - horizontalPadding - cardGap) / 2);

  const maia2Assessments = useMemo(() => {
    return assessments
      .filter(a => a.scaleId === 'maia2')
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  }, [assessments]);

  const chronological = useMemo(() => [...maia2Assessments].reverse(), [maia2Assessments]);

  const subscaleTrends = useMemo(() => {
    if (chronological.length < 2) return null;
    return MAIA2_SCALE.subscales.map(s => {
      const pts: TrendPoint[] = chronological
        .filter(a => !!a.subscaleScores)
        .map(a => ({ date: a.completedAt, value: a.subscaleScores![s.key] ?? 0 }));
      return { key: s.key, name: s.name, points: pts };
    });
  }, [chronological]);

  const handleShareMulti = useCallback(async () => {
    if (maia2Assessments.length === 0) return;
    const latest = maia2Assessments[0];
    if (!latest.subscaleScores) return;
    const latestDate = format(parseISO(latest.completedAt), 'MMMM d, yyyy');
    const pastAssessments: PastMaia2Assessment[] = maia2Assessments
      .slice(1, 4)
      .filter(a => !!a.subscaleScores)
      .map(a => ({
        date: format(parseISO(a.completedAt), 'MMMM d, yyyy'),
        subscaleScores: a.subscaleScores!,
      }));
    const userName = profile?.name;
    const report = generateClinicianReport(
      latest.subscaleScores,
      latestDate,
      userName,
      pastAssessments.length > 0 ? pastAssessments : undefined,
    );
    try {
      await Share.share({ message: report, title: 'MAIA-2 Longitudinal Report' });
    } catch {
      Alert.alert('Unable to share', 'Please try again.');
    }
  }, [maia2Assessments, profile]);

  const handleExportPdf = useCallback(async () => {
    if (maia2Assessments.length === 0) return;
    const latest = maia2Assessments[0];
    if (!latest.subscaleScores) return;

    const latestDate = format(parseISO(latest.completedAt), 'MMMM d, yyyy');
    const pastAssessments: PastMaia2Assessment[] = maia2Assessments
      .slice(1, 4)
      .filter(a => !!a.subscaleScores)
      .map(a => ({
        date: format(parseISO(a.completedAt), 'MMMM d, yyyy'),
        subscaleScores: a.subscaleScores!,
      }));

    setPdfLoading(true);
    try {
      await exportMaia2Pdf({
        subscaleScores: latest.subscaleScores,
        assessmentDate: latestDate,
        userName: profile?.name,
        pastAssessments: pastAssessments.length > 0 ? pastAssessments : undefined,
      });
    } finally {
      setPdfLoading(false);
    }
  }, [maia2Assessments, profile]);

  const trendSummary = useMemo(() => {
    if (maia2Assessments.length < 2) return null;
    const latest = maia2Assessments[0];
    const oldest = maia2Assessments[maia2Assessments.length - 1];
    if (!latest.subscaleScores || !oldest.subscaleScores) return null;
    return MAIA2_SCALE.subscales.map(s => {
      const curr = latest.subscaleScores![s.key] ?? 0;
      const first = oldest.subscaleScores![s.key] ?? 0;
      const diff = curr - first;
      return { key: s.key, name: s.name, diff, curr, first };
    });
  }, [maia2Assessments]);

  const improved = trendSummary?.filter(t => t.diff > 0.1).length ?? 0;
  const declined = trendSummary?.filter(t => t.diff < -0.1).length ?? 0;

  if (maia2Assessments.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="arrow-left" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MAIA-2 History</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Feather name="activity" size={48} color={Colors.primary} />
          <Text style={styles.emptyTitle}>No assessments yet</Text>
          <Text style={styles.emptySubtitle}>
            Take your first MAIA-2 assessment to begin tracking your body awareness journey.
          </Text>
          <TouchableOpacity
            style={styles.emptyAction}
            onPress={() => router.push('/assessment/maia2' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.emptyActionText}>Take MAIA-2</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MAIA-2 History</Text>
        {maia2Assessments.length > 0 && (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleShareMulti} style={styles.shareBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="share-2" size={19} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleExportPdf} style={styles.shareBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} disabled={pdfLoading}>
              {pdfLoading
                ? <ActivityIndicator size="small" color={Colors.primary} />
                : <Feather name="download" size={19} color={Colors.primary} />
              }
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding + 24 }]}>

        <Text style={styles.countLabel}>
          {maia2Assessments.length} assessment{maia2Assessments.length !== 1 ? 's' : ''} recorded
        </Text>

        {trendSummary && maia2Assessments.length >= 2 && (
          <View style={styles.trendBanner}>
            <Text style={styles.trendBannerTitle}>
              Overall trend: {format(parseISO(maia2Assessments[maia2Assessments.length - 1].completedAt), 'MMM d, yyyy')} to present
            </Text>
            <View style={styles.trendPillRow}>
              {improved > 0 && (
                <View style={[styles.trendPill, styles.trendPillUp]}>
                  <Feather name="trending-up" size={12} color={Colors.success} />
                  <Text style={[styles.trendPillText, { color: Colors.success }]}>{improved} improved</Text>
                </View>
              )}
              {declined > 0 && (
                <View style={[styles.trendPill, styles.trendPillDown]}>
                  <Feather name="trending-down" size={12} color={Colors.error} />
                  <Text style={[styles.trendPillText, { color: Colors.error }]}>{declined} declined</Text>
                </View>
              )}
              {(8 - improved - declined) > 0 && (
                <View style={[styles.trendPill, styles.trendPillFlat]}>
                  <Text style={[styles.trendPillText, { color: Colors.textTertiary }]}>{8 - improved - declined} stable</Text>
                </View>
              )}
            </View>
            <View style={styles.trendGrid}>
              {trendSummary.map(t => {
                const color = t.diff > 0.1 ? Colors.success : t.diff < -0.1 ? Colors.error : Colors.textTertiary;
                const arrow = t.diff > 0.1 ? '↑' : t.diff < -0.1 ? '↓' : '→';
                return (
                  <View key={t.key} style={styles.trendGridItem}>
                    <Text style={styles.trendGridLabel}>{SUBSCALE_SHORT[t.key]}</Text>
                    <Text style={[styles.trendGridArrow, { color }]}>{arrow}</Text>
                    <Text style={[styles.trendGridDiff, { color }]}>
                      {t.diff > 0 ? '+' : ''}{t.diff.toFixed(1)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {subscaleTrends && maia2Assessments.length >= 2 && (
          <View style={styles.trendsSection}>
            <View style={styles.trendsSectionHeader}>
              <Text style={styles.sectionTitle}>Subscale Trends</Text>
              <Text style={styles.trendsSectionHint}>Tap to expand</Text>
            </View>

            {MAIA2_SCALE.subscales.map((s, idx) => {
              const trend = subscaleTrends.find(t => t.key === s.key)!;
              const isExpanded = expandedTrendKey === s.key;
              const chartWidth = isExpanded
                ? screenWidth - horizontalPadding
                : compactCardWidth;

              if (isExpanded) {
                return (
                  <SubscaleTrendChart
                    key={s.key}
                    subscaleKey={s.key}
                    subscaleName={s.name}
                    points={trend.points}
                    expanded={true}
                    onPress={() => setExpandedTrendKey(null)}
                    cardWidth={chartWidth}
                  />
                );
              }

              if (idx % 2 === 0) {
                const nextS = MAIA2_SCALE.subscales[idx + 1];
                const nextTrend = nextS ? subscaleTrends.find(t => t.key === nextS.key) : null;
                return (
                  <View key={s.key} style={styles.trendRow}>
                    <SubscaleTrendChart
                      subscaleKey={s.key}
                      subscaleName={s.name}
                      points={trend.points}
                      expanded={false}
                      onPress={() => setExpandedTrendKey(s.key)}
                      cardWidth={compactCardWidth}
                    />
                    {nextTrend && nextS && (
                      <SubscaleTrendChart
                        subscaleKey={nextS.key}
                        subscaleName={nextS.name}
                        points={nextTrend.points}
                        expanded={false}
                        onPress={() => setExpandedTrendKey(nextS.key)}
                        cardWidth={compactCardWidth}
                      />
                    )}
                  </View>
                );
              }

              return null;
            })}
          </View>
        )}

        {maia2Assessments.length >= 2 && (
          <View style={styles.shareCard}>
            <Feather name="file-text" size={18} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.shareCardTitle}>Longitudinal report</Text>
              <Text style={styles.shareCardSub}>
                Includes your current profile plus up to 3 prior assessments for your clinician.
              </Text>
            </View>
            <View style={styles.shareCardActions}>
              <TouchableOpacity onPress={handleShareMulti} style={[styles.shareCardBtn, styles.shareCardBtnOutline]} activeOpacity={0.8}>
                <Feather name="share-2" size={13} color={Colors.primary} />
                <Text style={[styles.shareCardBtnText, { color: Colors.primary }]}>Text</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleExportPdf} style={styles.shareCardBtn} activeOpacity={0.8} disabled={pdfLoading}>
                {pdfLoading ? (
                  <ActivityIndicator size="small" color={Colors.textInverse} />
                ) : (
                  <>
                    <Feather name="download" size={13} color={Colors.textInverse} />
                    <Text style={styles.shareCardBtnText}>PDF</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>All Assessments</Text>

        {maia2Assessments.map((assessment, index) => {
          const isExpanded = expandedId === (assessment.id || String(index));
          const id = assessment.id || String(index);
          const scores = assessment.subscaleScores;
          const overall = scores ? getMaia2OverallAverage(scores) : null;
          const isLatest = index === 0;

          const radarDimensions = scores
            ? MAIA2_SCALE.subscales.map(s => ({
                key: s.key,
                label: s.name,
                value: scores[s.key] ?? 0,
                maxValue: 5,
              }))
            : null;

          const prevAssessment = maia2Assessments[index + 1];
          const prevScores = prevAssessment?.subscaleScores;

          return (
            <TouchableOpacity
              key={id}
              style={[styles.assessmentCard, isLatest && styles.assessmentCardLatest]}
              onPress={() => setExpandedId(isExpanded ? null : id)}
              activeOpacity={0.85}
            >
              <View style={styles.assessmentCardHeader}>
                <View style={styles.assessmentCardLeft}>
                  {isLatest && (
                    <View style={styles.latestBadge}>
                      <Text style={styles.latestBadgeText}>Latest</Text>
                    </View>
                  )}
                  <Text style={styles.assessmentDate}>
                    {format(parseISO(assessment.completedAt), 'MMMM d, yyyy')}
                  </Text>
                  {overall !== null && (
                    <Text style={styles.assessmentOverall}>
                      Avg {overall.toFixed(1)}/5
                    </Text>
                  )}
                </View>
                <View style={styles.assessmentCardRight}>
                  {scores && (
                    <View style={styles.sparklineRow}>
                      {MAIA2_SCALE.subscales.map(s => {
                        const score = scores[s.key] ?? 0;
                        const height = Math.max((score / 5) * 28, 3);
                        const barColor = score >= 3.5 ? Colors.success : score >= 2 ? Colors.primary : Colors.warning;
                        return (
                          <View key={s.key} style={styles.sparklineBar}>
                            <View style={[styles.sparklineFill, { height, backgroundColor: barColor }]} />
                          </View>
                        );
                      })}
                    </View>
                  )}
                  <Feather
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={Colors.textTertiary}
                    style={{ marginLeft: 8 }}
                  />
                </View>
              </View>

              {isExpanded && scores && radarDimensions && (
                <View style={styles.expandedContent}>
                  <View style={styles.radarWrap}>
                    <RadarChart
                      dimensions={radarDimensions}
                      size={240}
                      color={isLatest ? Colors.primary : Colors.secondary}
                      secondaryColor={Colors.secondary}
                    />
                  </View>

                  <Text style={styles.expandedSectionTitle}>8-Dimension Profile</Text>
                  {MAIA2_SCALE.subscales.map(s => {
                    const score = scores[s.key] ?? 0;
                    const pct = (score / 5) * 100;
                    const barColor = score >= 3.5 ? Colors.success : score >= 2 ? Colors.primary : Colors.warning;
                    const prevScore = prevScores ? (prevScores[s.key] ?? null) : null;
                    const diff = prevScore !== null ? score - prevScore : null;

                    return (
                      <View key={s.key} style={styles.subscaleRow}>
                        <View style={styles.subscaleRowHeader}>
                          <Text style={styles.subscaleName}>{s.name}</Text>
                          <View style={styles.subscaleScoreRow}>
                            {diff !== null && (
                              <Text style={[styles.subscaleDiff, {
                                color: diff > 0.1 ? Colors.success : diff < -0.1 ? Colors.error : Colors.textTertiary,
                              }]}>
                                {diff > 0.1 ? '+' : ''}{diff !== 0 ? diff.toFixed(1) : '—'}
                              </Text>
                            )}
                            <Text style={[styles.subscaleScore, { color: barColor }]}>{score.toFixed(1)}</Text>
                          </View>
                        </View>
                        <View style={styles.subscaleTrack}>
                          <View style={[styles.subscaleFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
                        </View>
                      </View>
                    );
                  })}

                  {prevScores && (
                    <Text style={styles.comparedNote}>
                      Differences shown vs. {format(parseISO(prevAssessment.completedAt), 'MMM d, yyyy')}
                    </Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={styles.disclaimer}>
          <Feather name="info" size={13} color={Colors.textTertiary} />
          <Text style={styles.disclaimerText}>
            MAIA-2 authors advise against a single composite score. The pattern across all 8 subscales is the clinically meaningful result (Mehling et al., 2018, PLOS ONE).
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  shareBtn: { width: 36, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Nunito_700Bold', color: Colors.text },
  scroll: { paddingHorizontal: 16 },
  countLabel: {
    fontSize: 13, fontFamily: 'Nunito_500Medium', color: Colors.textTertiary,
    marginBottom: 14,
  },

  trendBanner: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 16,
  },
  trendBannerTitle: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: Colors.textSecondary, marginBottom: 10,
  },
  trendPillRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  trendPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  trendPillUp: { backgroundColor: Colors.success + '15' },
  trendPillDown: { backgroundColor: Colors.error + '15' },
  trendPillFlat: { backgroundColor: Colors.backgroundSecondary },
  trendPillText: { fontFamily: 'Nunito_600SemiBold', fontSize: 12 },
  trendGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  trendGridItem: {
    width: '22%', alignItems: 'center', backgroundColor: Colors.backgroundSecondary,
    borderRadius: 10, paddingVertical: 8,
  },
  trendGridLabel: { fontSize: 11, fontFamily: 'Nunito_600SemiBold', color: Colors.textSecondary, marginBottom: 2 },
  trendGridArrow: { fontSize: 16, fontFamily: 'Nunito_700Bold' },
  trendGridDiff: { fontSize: 11, fontFamily: 'Nunito_600SemiBold' },

  trendsSection: {
    marginBottom: 20,
  },
  trendsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  trendsSectionHint: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    color: Colors.textTertiary,
  },
  trendRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 0,
  },

  shareCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.primary + '10', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.primary + '30', marginBottom: 20,
  },
  shareCardTitle: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.text, marginBottom: 2 },
  shareCardSub: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
  shareCardActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  shareCardBtn: {
    backgroundColor: Colors.primary, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 60, justifyContent: 'center',
  },
  shareCardBtnOutline: {
    backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary,
  },
  shareCardBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.textInverse },

  sectionTitle: {
    fontSize: 16, fontFamily: 'Nunito_700Bold', color: Colors.text, marginBottom: 12,
  },

  assessmentCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12,
  },
  assessmentCardLatest: {
    borderWidth: 1.5, borderColor: Colors.primary + '40',
  },
  assessmentCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  assessmentCardLeft: { flex: 1 },
  assessmentCardRight: { flexDirection: 'row', alignItems: 'center' },
  latestBadge: {
    backgroundColor: Colors.primary + '15', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4,
  },
  latestBadgeText: { fontFamily: 'Nunito_700Bold', fontSize: 10, color: Colors.primary },
  assessmentDate: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.text, marginBottom: 2 },
  assessmentOverall: { fontFamily: 'Nunito_500Medium', fontSize: 12, color: Colors.textSecondary },

  sparklineRow: {
    flexDirection: 'row', alignItems: 'flex-end', height: 32, gap: 2,
  },
  sparklineBar: {
    width: 7, height: 32, justifyContent: 'flex-end', alignItems: 'center',
  },
  sparklineFill: {
    width: 7, borderRadius: 3,
  },

  expandedContent: { marginTop: 16, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 16 },
  radarWrap: { alignItems: 'center', marginBottom: 16 },
  expandedSectionTitle: {
    fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.text, marginBottom: 12,
  },
  subscaleRow: { marginBottom: 12 },
  subscaleRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  subscaleName: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.text },
  subscaleScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subscaleDiff: { fontFamily: 'Nunito_600SemiBold', fontSize: 11 },
  subscaleScore: { fontFamily: 'Nunito_700Bold', fontSize: 13 },
  subscaleTrack: {
    height: 6, backgroundColor: Colors.backgroundSecondary, borderRadius: 3, overflow: 'hidden' as const,
  },
  subscaleFill: { height: '100%', borderRadius: 3 },
  comparedNote: {
    fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.textTertiary,
    marginTop: 4, textAlign: 'right',
  },

  disclaimer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.backgroundSecondary, borderRadius: 12, padding: 12, marginTop: 8,
  },
  disclaimerText: {
    fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.textTertiary, flex: 1, lineHeight: 17,
  },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontFamily: 'Nunito_700Bold', fontSize: 20, color: Colors.text, textAlign: 'center' },
  emptySubtitle: {
    fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 20,
  },
  emptyAction: {
    backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8,
  },
  emptyActionText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.textInverse },
});
