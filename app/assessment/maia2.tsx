import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, Share, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import {
  MAIA2_SCALE,
  calculateMaia2Subscales,
  getMaia2OverallAverage,
  getMaia2ClinicalFlags,
  generateClinicianReport,
  hasCompleteSubscaleScores,
} from '@/constants/clinical-scales';
import { useApp } from '@/contexts/AppContext';
import { apiPost } from '@/lib/api';
import RadarChart from '@/components/RadarChart';

type Phase = 'intro' | 'questions' | 'results';

const SUBSCALE_ORDER = [
  'noticing',
  'notDistracting',
  'notWorrying',
  'attentionRegulation',
  'emotionalAwareness',
  'selfRegulation',
  'bodyListening',
  'trusting',
];

export default function Maia2Screen() {
  const insets = useSafeAreaInsets();
  const { addAssessment, assessments } = useApp();
  const topInset = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const [phase, setPhase] = useState<Phase>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(37).fill(-1));
  const [subscaleScores, setSubscaleScores] = useState<Record<string, number>>({});
  const [overallAverage, setOverallAverage] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const previousMaia2 = useMemo(() => {
    return assessments
      .filter(a => a.scaleId === 'maia2')
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  }, [assessments]);

  const handleStart = () => {
    setAnswers(new Array(37).fill(-1));
    setCurrentQuestion(0);
    setPhase('questions');
  };

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);

    if (currentQuestion < MAIA2_SCALE.totalQuestions - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      const scores = calculateMaia2Subscales(newAnswers);
      const avg = getMaia2OverallAverage(scores);
      setSubscaleScores(scores);
      setOverallAverage(avg);
      setPhase('results');
    }
  };

  const handleGoBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const clinicalFlags = useMemo(() => {
    if (Object.keys(subscaleScores).length === 0) return [];
    return getMaia2ClinicalFlags(subscaleScores);
  }, [subscaleScores]);

  const handleShareWithClinician = useCallback(async () => {
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const report = generateClinicianReport(subscaleScores, date);
    try {
      await Share.share({ message: report, title: 'MAIA-2 Body Awareness Profile' });
    } catch {
      Alert.alert('Unable to share', 'Please try again.');
    }
  }, [subscaleScores]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);

    const score100 = Math.round(overallAverage * 20);
    const assessmentData = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      scaleId: 'maia2' as const,
      scaleName: 'MAIA-2',
      completedAt: new Date().toISOString(),
      totalScore: score100,
      severity: getMaia2SeverityLabel(overallAverage),
      answers,
      subscaleScores,
    };

    try {
      await addAssessment(assessmentData);
    } catch (e) {
      console.error('Failed to save MAIA-2:', e);
      setIsSaving(false);
      return;
    }
    try {
      await apiPost('/api/assessments', assessmentData);
    } catch (e) {
      console.error('Failed to sync MAIA-2 to server:', e);
    }
    router.back();
  }, [isSaving, overallAverage, answers, subscaleScores, addAssessment]);

  if (phase === 'intro') {
    return (
      <LinearGradient colors={['#4A6FA5', '#2D4A7A']} style={styles.container}>
        <ScrollView
          contentContainerStyle={[styles.introContent, { paddingTop: topInset + 20, paddingBottom: bottomInset + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Feather name="x-circle" size={28} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <View style={styles.introIcon}>
            <Feather name="activity" size={36} color="#4A6FA5" />
          </View>

          <Text style={styles.introTitle}>MAIA-2</Text>
          <Text style={styles.introFullName}>Multidimensional Assessment of Interoceptive Awareness</Text>
          <Text style={styles.introDesc}>
            The only scientifically validated measure of body awareness. 37 questions across 8 dimensions reveal exactly where your interoceptive awareness is strongest, and where it is growing.
          </Text>

          <View style={styles.introMetaRow}>
            <View style={styles.introMetaItem}>
              <Feather name="clock" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.introMetaText}>10 min</Text>
            </View>
            <View style={styles.introMetaDot} />
            <View style={styles.introMetaItem}>
              <Feather name="list" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.introMetaText}>37 questions</Text>
            </View>
            <View style={styles.introMetaDot} />
            <View style={styles.introMetaItem}>
              <Feather name="layers" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.introMetaText}>8 dimensions</Text>
            </View>
          </View>

          <View style={styles.introCard}>
            <Text style={styles.introCardTitle}>8 Dimensions Measured</Text>
            {MAIA2_SCALE.subscales.map(s => (
              <View key={s.key} style={styles.subscaleRow}>
                <View style={styles.subscaleDot} />
                <View style={styles.subscaleInfo}>
                  <Text style={styles.subscaleName}>{s.name}</Text>
                  <Text style={styles.subscaleDesc} numberOfLines={1}>{s.description}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.introCard}>
            <Text style={styles.introCardTitle}>How to respond</Text>
            <Text style={styles.introCardText}>
              Rate each statement from 0 (Never) to 5 (Always) based on how often it applies to you. There are no right or wrong answers. This measures your current experience.
            </Text>
          </View>

          {previousMaia2.length > 0 && (
            <View style={styles.introCard}>
              <Text style={styles.introCardTitle}>Previous Results</Text>
              {previousMaia2.slice(0, 3).map((pa, i) => (
                <View key={i} style={styles.prevRow}>
                  <Text style={styles.prevDate}>{new Date(pa.completedAt).toLocaleDateString()}</Text>
                  <Text style={styles.prevScore}>Score: {pa.totalScore}/100</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.disclaimerBox}>
            <Feather name="info" size={14} color="rgba(255,255,255,0.6)" />
            <Text style={styles.disclaimerText}>{MAIA2_SCALE.disclaimer}</Text>
          </View>

          <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
            <Feather name="play" size={20} color="#4A6FA5" />
            <Text style={styles.startBtnText}>Begin Assessment</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  if (phase === 'questions') {
    const question = MAIA2_SCALE.questions[currentQuestion];
    const progressPct = ((currentQuestion + 1) / MAIA2_SCALE.totalQuestions) * 100;
    const subscale = MAIA2_SCALE.subscales.find(s => s.key === question.subscale);

    const subscaleIndex = SUBSCALE_ORDER.indexOf(question.subscale || '');
    const subscaleColors = [
      '#4A6FA5', '#5B8FB9', '#7BAFD4', '#9EC5E0',
      '#88B3B5', '#6FA8A6', '#5A9E9B', '#4A8E8B',
    ];
    const subscaleColor = subscaleColors[subscaleIndex] || '#4A6FA5';

    return (
      <LinearGradient colors={['#4A6FA5', '#2D4A7A']} style={styles.container}>
        <View style={[styles.questionContainer, { paddingTop: topInset + 12, paddingBottom: bottomInset + 16 }]}>
          <View style={styles.progressSection}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
            </View>
            <Text style={styles.progressLabel}>
              {currentQuestion + 1} of {MAIA2_SCALE.totalQuestions}
            </Text>
          </View>

          {subscale && (
            <View style={[styles.subscaleBadge, { backgroundColor: subscaleColor + '40' }]}>
              <Text style={styles.subscaleBadgeText}>{subscale.name}</Text>
            </View>
          )}

          <View style={styles.questionBody}>
            <Text style={styles.questionText}>{question.text}</Text>
          </View>

          <View style={styles.optionsContainer}>
            {MAIA2_SCALE.responseOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionBtn,
                  answers[currentQuestion] === option.value && styles.optionBtnSelected,
                ]}
                onPress={() => handleAnswer(option.value)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.optionDot,
                  answers[currentQuestion] === option.value && styles.optionDotSelected,
                ]}>
                  {answers[currentQuestion] === option.value && (
                    <Feather name="check" size={10} color="#FFF" />
                  )}
                </View>
                <Text style={[
                  styles.optionText,
                  answers[currentQuestion] === option.value && styles.optionTextSelected,
                ]}>
                  {option.label}
                </Text>
                <Text style={[
                  styles.optionValue,
                  answers[currentQuestion] === option.value && styles.optionValueSelected,
                ]}>
                  {option.value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {currentQuestion > 0 && (
            <TouchableOpacity style={styles.backQuestion} onPress={handleGoBack}>
              <Feather name="arrow-left" size={16} color="rgba(255,255,255,0.6)" />
              <Text style={styles.backQuestionText}>Previous</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    );
  }

  const radarDimensions = MAIA2_SCALE.subscales.map(s => ({
    key: s.key,
    label: s.name,
    value: subscaleScores[s.key] ?? 0,
    maxValue: 5,
  }));

  const sortedSubscales = MAIA2_SCALE.subscales
    .map(s => ({ ...s, score: subscaleScores[s.key] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  const strongest = sortedSubscales.slice(0, 2);
  const growing = sortedSubscales.slice(-2).reverse();

  const previousSubscaleScores = previousMaia2.length > 0 && hasCompleteSubscaleScores(previousMaia2[0].subscaleScores)
    ? previousMaia2[0].subscaleScores!
    : null;

  return (
    <LinearGradient colors={['#4A6FA5', '#2D4A7A']} style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.resultsContent, { paddingTop: topInset + 20, paddingBottom: bottomInset + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.resultsTitle}>Your Body Awareness Profile</Text>

        <View style={styles.aggregateRow}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{Math.round(overallAverage * 20)}</Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <View style={styles.aggregateNote}>
            <Text style={styles.aggregateNoteLabel}>Aggregate indicator only</Text>
            <Text style={styles.aggregateNoteText}>
              MAIA-2 authors advise against a single composite score, the pattern across all 8 subscales is the clinically meaningful result.
            </Text>
          </View>
        </View>

        <View style={styles.radarContainer}>
          <RadarChart
            dimensions={radarDimensions}
            size={280}
            color="#88D5E0"
            secondaryColor="rgba(255,255,255,0.4)"
          />
        </View>

        {previousSubscaleScores && (
          <View style={styles.comparisonCard}>
            <Text style={styles.comparisonTitle}>Month-over-Month Changes</Text>
            {MAIA2_SCALE.subscales.map(s => {
              const current = subscaleScores[s.key] ?? 0;
              const prev = previousSubscaleScores[s.key] ?? 0;
              const diff = current - prev;
              const arrow = diff > 0.1 ? '↑' : diff < -0.1 ? '↓' : '→';
              const arrowColor = diff > 0.1 ? '#7FB069' : diff < -0.1 ? '#E07A5F' : 'rgba(255,255,255,0.5)';
              return (
                <View key={s.key} style={styles.comparisonRow}>
                  <Text style={styles.comparisonLabel}>{s.name}</Text>
                  <Text style={[styles.comparisonArrow, { color: arrowColor }]}>{arrow}</Text>
                  <Text style={styles.comparisonValues}>
                    {prev.toFixed(1)} → {current.toFixed(1)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.interpretCard}>
          <View style={styles.interpretSection}>
            <View style={styles.interpretHeader}>
              <Feather name="star" size={16} color="#F0C05A" />
              <Text style={styles.interpretHeading}>Your Strongest Areas</Text>
            </View>
            {strongest.map(s => (
              <View key={s.key} style={styles.interpretItem}>
                <View style={styles.interpretItemHeader}>
                  <Text style={styles.interpretItemName}>{s.name}</Text>
                  <Text style={styles.interpretItemScore}>{s.score.toFixed(1)}/5</Text>
                </View>
                <Text style={styles.interpretItemContext}>{s.clinicalContext}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.interpretDivider]} />

          <View style={styles.interpretSection}>
            <View style={styles.interpretHeader}>
              <Feather name="trending-up" size={16} color="#88D5E0" />
              <Text style={styles.interpretHeading}>Areas with Room to Grow</Text>
            </View>
            {growing.map(s => (
              <View key={s.key} style={styles.interpretItem}>
                <View style={styles.interpretItemHeader}>
                  <Text style={styles.interpretItemName}>{s.name}</Text>
                  <Text style={styles.interpretItemScore}>{s.score.toFixed(1)}/5</Text>
                </View>
                <Text style={styles.interpretItemContext}>{s.clinicalContext}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.subscaleBreakdown}>
          <Text style={styles.subscaleBreakdownTitle}>All 8 Dimensions</Text>
          {MAIA2_SCALE.subscales.map(s => {
            const score = subscaleScores[s.key] ?? 0;
            const pct = (score / 5) * 100;
            return (
              <View key={s.key} style={styles.subscaleBreakdownRow}>
                <Text style={styles.subscaleBreakdownName}>{s.name}</Text>
                <View style={styles.subscaleBreakdownTrack}>
                  <View style={[styles.subscaleBreakdownFill, { width: `${pct}%` as any }]} />
                </View>
                <Text style={styles.subscaleBreakdownScore}>{score.toFixed(1)}</Text>
              </View>
            );
          })}
        </View>

        {clinicalFlags.length > 0 && (
          <View style={styles.clinicalFlagsCard}>
            <Text style={styles.clinicalFlagsTitle}>Clinical Interpretation</Text>
            {clinicalFlags.map(flag => (
              <View key={flag.key} style={styles.clinicalFlagItem}>
                <View style={styles.clinicalFlagHeader}>
                  <Feather
                    name={flag.type === 'professional' ? 'user' : flag.type === 'distress' ? 'alert-circle' : 'trending-up'}
                    size={14}
                    color={flag.type === 'professional' ? '#88D5E0' : flag.type === 'distress' ? '#E8A48B' : '#7FB069'}
                  />
                  <Text style={styles.clinicalFlagTitle}>{flag.title}</Text>
                </View>
                <Text style={styles.clinicalFlagMessage}>{flag.message}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.citationBox}>
          <Feather name="book-open" size={14} color="rgba(255,255,255,0.5)" />
          <Text style={styles.citationText}>{MAIA2_SCALE.citation}</Text>
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShareWithClinician} activeOpacity={0.8}>
          <Feather name="share-2" size={18} color="#4A6FA5" />
          <Text style={styles.shareBtnText}>Share with Clinician</Text>
        </TouchableOpacity>
        <Text style={styles.shareBtnNote}>
          Sends a formatted subscale report your therapist can read without knowing the MAIA-2 instrument.
        </Text>

        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={isSaving}
        >
          <Feather name="check-circle" size={20} color="#4A6FA5" />
          <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Results'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeResult} onPress={() => router.back()}>
          <Text style={styles.closeResultText}>Close without saving</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

function getMaia2SeverityLabel(avg: number): string {
  if (avg >= 4) return 'Excellent';
  if (avg >= 3) return 'Good';
  if (avg >= 2) return 'Developing';
  if (avg >= 1) return 'Beginning';
  return 'Starting Out';
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  introContent: { paddingHorizontal: 24, alignItems: 'center' },
  closeBtn: { alignSelf: 'flex-start', marginBottom: 20 },
  introIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  introTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 28, color: '#FFF' },
  introFullName: {
    fontFamily: 'Nunito_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.8)',
    marginTop: 4, textAlign: 'center',
  },
  introDesc: {
    fontFamily: 'Nunito_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.75)',
    textAlign: 'center', marginTop: 12, lineHeight: 21,
  },
  introMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  introMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  introMetaText: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  introMetaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  introCard: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 18, width: '100%', marginBottom: 16,
  },
  introCardTitle: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#FFF', marginBottom: 8 },
  introCardText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
  subscaleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 10 },
  subscaleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#88D5E0' },
  subscaleInfo: { flex: 1 },
  subscaleName: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#FFF' },
  subscaleDesc: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  prevRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  prevDate: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  prevScore: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#FFF' },
  disclaimerBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 24 },
  disclaimerText: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.5)', flex: 1, lineHeight: 16 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#FFF', paddingVertical: 16, paddingHorizontal: 48, borderRadius: 30, width: '100%', maxWidth: 300,
  },
  startBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#4A6FA5' },

  questionContainer: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  progressSection: { marginBottom: 12 },
  progressTrack: {
    width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2, overflow: 'hidden', marginBottom: 6,
  },
  progressFill: { height: '100%', backgroundColor: '#88D5E0', borderRadius: 2 },
  progressLabel: { fontFamily: 'Nunito_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  subscaleBadge: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, alignSelf: 'center', marginBottom: 12,
  },
  subscaleBadgeText: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: '#FFF' },
  questionBody: { flex: 1, justifyContent: 'center', paddingVertical: 16 },
  questionText: { fontFamily: 'Nunito_600SemiBold', fontSize: 18, color: '#FFF', textAlign: 'center', lineHeight: 27 },
  optionsContainer: { gap: 8, marginBottom: 16 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  optionBtnSelected: { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.4)' },
  optionDot: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  optionDotSelected: { backgroundColor: '#88D5E0', borderColor: '#88D5E0' },
  optionText: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.8)', flex: 1 },
  optionTextSelected: { color: '#FFF', fontFamily: 'Nunito_700Bold' },
  optionValue: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  optionValueSelected: { color: '#FFF' },
  backQuestion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  backQuestionText: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.6)' },

  resultsContent: { paddingHorizontal: 24, alignItems: 'center' },
  resultsTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 22, color: '#FFF', marginBottom: 20, textAlign: 'center' },
  aggregateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16, width: '100%', marginBottom: 24,
  },
  scoreCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  aggregateNote: { flex: 1 },
  aggregateNoteLabel: {
    fontFamily: 'Nunito_700Bold', fontSize: 12, color: 'rgba(255,255,255,0.6)',
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  aggregateNoteText: {
    fontFamily: 'Nunito_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 17,
  },
  scoreNumber: { fontFamily: 'Nunito_800ExtraBold', fontSize: 28, color: '#FFF' },
  scoreMax: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  radarContainer: { alignItems: 'center', marginBottom: 24 },
  comparisonCard: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 16, width: '100%', marginBottom: 16,
  },
  comparisonTitle: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#FFF', marginBottom: 10 },
  comparisonRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 8 },
  comparisonLabel: { fontFamily: 'Nunito_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.8)', flex: 1 },
  comparisonArrow: { fontFamily: 'Nunito_700Bold', fontSize: 14, width: 16, textAlign: 'center' },
  comparisonValues: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.7)', width: 80, textAlign: 'right' },
  interpretCard: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 18, width: '100%', marginBottom: 16,
  },
  interpretSection: { },
  interpretHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  interpretHeading: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#FFF' },
  interpretItem: { marginBottom: 12 },
  interpretItemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  interpretItemName: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#FFF' },
  interpretItemScore: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#88D5E0' },
  interpretItemContext: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 18 },
  interpretDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 14 },
  subscaleBreakdown: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, width: '100%', marginBottom: 16,
  },
  subscaleBreakdownTitle: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#FFF', marginBottom: 12 },
  subscaleBreakdownRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  subscaleBreakdownName: { fontFamily: 'Nunito_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.8)', width: 90 },
  subscaleBreakdownTrack: {
    flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden',
  },
  subscaleBreakdownFill: { height: '100%', backgroundColor: '#88D5E0', borderRadius: 3 },
  subscaleBreakdownScore: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: '#88D5E0', width: 30, textAlign: 'right' },
  citationBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 24 },
  citationText: {
    fontFamily: 'Nunito_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.4)',
    flex: 1, lineHeight: 15,
  },
  clinicalFlagsCard: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 16, width: '100%', marginBottom: 16,
  },
  clinicalFlagsTitle: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#FFF', marginBottom: 12 },
  clinicalFlagItem: {
    paddingLeft: 0, marginBottom: 14,
  },
  clinicalFlagHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  clinicalFlagTitle: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#FFF', flex: 1 },
  clinicalFlagMessage: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },

  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#FFF', paddingVertical: 14, paddingHorizontal: 48,
    borderRadius: 30, width: '100%', maxWidth: 300, marginBottom: 8,
  },
  shareBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#4A6FA5' },
  shareBtnNote: {
    fontFamily: 'Nunito_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.5)',
    textAlign: 'center', marginBottom: 20, lineHeight: 16,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 14, paddingHorizontal: 48,
    borderRadius: 30, width: '100%', maxWidth: 300, marginBottom: 14,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#FFF' },
  closeResult: { paddingVertical: 10 },
  closeResultText: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.6)' },
});
