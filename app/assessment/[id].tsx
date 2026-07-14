import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/colors';
import { getScaleById, interpretScore } from '@/constants/clinical-scales';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import Svg, { Circle } from 'react-native-svg';
import { apiPost } from '@/lib/api';
import { EXERCISES } from '@/constants/exercises';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Phase = 'intro' | 'questions' | 'results';

export default function AssessmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { addAssessment, assessments } = useApp();
  const { user } = useAuth();
  const scale = getScaleById(id || '');

  const topInset = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const isPremium = user?.isPremium ?? false;

  const [phase, setPhase] = useState<Phase>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const previousAssessments = assessments
    .filter(a => a.scaleId === id)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  const handleStart = () => {
    if (!isPremium) {
      router.push('/premium' as any);
      return;
    }
    setAnswers(new Array(scale?.totalQuestions || 0).fill(-1));
    setCurrentQuestion(0);
    setPhase('questions');
  };

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);

    if (scale && currentQuestion < scale.totalQuestions - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      const score = newAnswers.reduce((s, a) => s + (a >= 0 ? a : 0), 0);
      setTotalScore(score);
      setPhase('results');
    }
  };

  const handleGoBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSave = useCallback(async () => {
    if (!scale || isSaving) return;
    setIsSaving(true);
    const interpretation = interpretScore(scale, totalScore);
    const assessmentData = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      scaleId: scale.id,
      scaleName: scale.shortName,
      completedAt: new Date().toISOString(),
      totalScore,
      severity: interpretation.severity,
      answers,
    };
    try {
      await addAssessment(assessmentData);
    } catch (e) {
      console.error('Failed to save assessment:', e);
      setIsSaving(false);
      return;
    }
    try {
      await apiPost('/api/assessments', assessmentData);
    } catch (e) {
      console.error('Failed to sync assessment to server:', e);
    }
    router.back();
  }, [scale, totalScore, answers, addAssessment, isSaving]);

  if (!scale) {
    return (
      <View style={[styles.container, { paddingTop: topInset + 40 }]}>
        <Text style={styles.errorText}>Assessment not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'intro') {
    return (
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.container}>
        <ScrollView
          contentContainerStyle={[styles.introContent, { paddingTop: topInset + 20, paddingBottom: bottomInset + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Feather name="x-circle" size={28} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <View style={styles.introIcon}>
            <Feather name="file-text" size={36} color={Colors.primary} />
          </View>

          <Text style={styles.introTitle}>{scale.shortName}</Text>
          <Text style={styles.introFullName}>{scale.name}</Text>
          <Text style={styles.introDesc}>{scale.description}</Text>

          <View style={styles.introMetaRow}>
            <View style={styles.introMetaItem}>
              <Feather name="clock" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.introMetaText}>{scale.estimatedMinutes} min</Text>
            </View>
            <View style={styles.introMetaDot} />
            <View style={styles.introMetaItem}>
              <Feather name="list" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.introMetaText}>{scale.totalQuestions} questions</Text>
            </View>
          </View>

          {!isPremium && (
            <View style={styles.premiumGate}>
              <View style={styles.premiumGateIconRow}>
                <Feather name="lock" size={22} color="rgba(255,255,255,0.9)" />
                <Text style={styles.premiumGateTitle}>Premium Feature</Text>
              </View>
              <Text style={styles.premiumGateDesc}>
                Clinical assessments are available on Interosense Premium. Start your 7-day free trial to access GAD-7, PHQ-9, PCL-5, and MAIA-2.
              </Text>
              <TouchableOpacity
                style={styles.premiumGateBtn}
                onPress={() => router.push('/premium' as any)}
                activeOpacity={0.85}
              >
                <Feather name="star" size={16} color={Colors.primary} />
                <Text style={styles.premiumGateBtnText}>Unlock with Premium</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.introCard}>
            <Text style={styles.introCardTitle}>How it works</Text>
            <Text style={styles.introCardText}>
              {scale.timeframe}, how often have you been bothered by the following problems? Rate each item on a scale from "{scale.responseOptions[0].label}" to "{scale.responseOptions[scale.responseOptions.length - 1].label}."
            </Text>
          </View>

          {previousAssessments.length > 0 && (
            <View style={styles.introCard}>
              <Text style={styles.introCardTitle}>Previous Results</Text>
              {previousAssessments.slice(0, 3).map((pa, i) => (
                <View key={i} style={styles.prevRow}>
                  <Text style={styles.prevDate}>{new Date(pa.completedAt).toLocaleDateString()}</Text>
                  <Text style={styles.prevScore}>{pa.totalScore}/{scale.maxScore}</Text>
                  <Text style={[styles.prevSeverity, { color: interpretScore(scale, pa.totalScore).color }]}>
                    {pa.severity}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.disclaimerBox}>
            <Feather name="info" size={14} color="rgba(255,255,255,0.6)" />
            <Text style={styles.disclaimerText}>{scale.disclaimer}</Text>
          </View>

          {isPremium && (
            <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
              <Feather name="play" size={20} color={Colors.primary} />
              <Text style={styles.startBtnText}>Begin Assessment</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </LinearGradient>
    );
  }

  if (phase === 'questions') {
    const question = scale.questions[currentQuestion];
    const progressPct = ((currentQuestion + 1) / scale.totalQuestions) * 100;

    return (
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.container}>
        <View style={[styles.questionContainer, { paddingTop: topInset + 12, paddingBottom: bottomInset + 16 }]}>
          <View style={styles.progressSection}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
            <Text style={styles.progressLabel}>
              Question {currentQuestion + 1} of {scale.totalQuestions}
            </Text>
          </View>

          <View style={styles.timeframeLabel}>
            <Text style={styles.timeframeText}>{scale.timeframe}</Text>
          </View>

          <View style={styles.questionBody}>
            <Text style={styles.questionText}>{question.text}</Text>
          </View>

          <View style={styles.optionsContainer}>
            {scale.responseOptions.map(option => (
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
                    <Feather name="check" size={12} color="#FFF" />
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
              <Text style={styles.backQuestionText}>Previous question</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    );
  }

  const pcl5Recommendations = useMemo(() => {
    if (id !== 'pcl5' || phase !== 'results') return [];
    const hyperarousalScore = answers.slice(14, 20).reduce((s, a) => s + (a >= 0 ? a : 0), 0);
    const reexperiencingScore = answers.slice(0, 5).reduce((s, a) => s + (a >= 0 ? a : 0), 0);
    const avoidanceScore = answers.slice(5, 7).reduce((s, a) => s + (a >= 0 ? a : 0), 0);

    const recs: string[] = [];
    if (hyperarousalScore >= 8) {
      recs.push('vagal-toning-breath', 'physiological-sigh', 'humming-vagal-activation');
    } else if (reexperiencingScore >= 8) {
      recs.push('somatic-grounding', 'safety-anchoring', 'titration-practice');
    } else if (avoidanceScore >= 4) {
      recs.push('pendulation-exercise', 'window-of-tolerance-checkin', 'resourcing');
    } else {
      recs.push('somatic-grounding', 'orienting-response', 'window-of-tolerance-checkin');
    }
    return recs.map(rid => EXERCISES.find(e => e.id === rid)).filter(Boolean).slice(0, 3) as typeof EXERCISES;
  }, [id, phase, answers]);

  const interpretation = interpretScore(scale, totalScore);
  const scorePercent = totalScore / scale.maxScore;
  const ringSize = 140;
  const ringStroke = 10;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - scorePercent);

  return (
    <LinearGradient colors={[Colors.primary, Colors.secondaryDark]} style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.resultsContent, { paddingTop: topInset + 20, paddingBottom: bottomInset + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.resultsTitle}>{scale.shortName} Results</Text>

        <View style={styles.scoreRingContainer}>
          <Svg width={ringSize} height={ringSize} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius}
              stroke="rgba(255,255,255,0.15)" strokeWidth={ringStroke} fill="none" />
            <Circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius}
              stroke={interpretation.color} strokeWidth={ringStroke} fill="none"
              strokeDasharray={`${ringCircumference}`} strokeDashoffset={ringOffset} strokeLinecap="round" />
          </Svg>
          <View style={styles.scoreCenter}>
            <Text style={styles.scoreNumber}>{totalScore}</Text>
            <Text style={styles.scoreMax}>/ {scale.maxScore}</Text>
          </View>
        </View>

        <View style={[styles.severityBadge, { backgroundColor: interpretation.color + '30' }]}>
          <Text style={[styles.severityText, { color: interpretation.color }]}>{interpretation.severity}</Text>
        </View>

        <View style={styles.interpretCard}>
          <Text style={styles.interpretDesc}>{interpretation.description}</Text>
          <View style={styles.interpretDivider} />
          <View style={styles.interpretRecRow}>
            <Feather name="arrow-right-circle" size={16} color={Colors.secondary} />
            <Text style={styles.interpretRec}>{interpretation.recommendation}</Text>
          </View>
        </View>

        {totalScore >= scale.clinicalCutoff && (
          <View style={styles.warningCard}>
            <Feather name="alert-triangle" size={18} color={Colors.warning} />
            <Text style={styles.warningText}>
              Your score is at or above the clinical cutoff ({scale.clinicalCutoff}). Consider consulting a qualified healthcare provider for a comprehensive evaluation.
            </Text>
          </View>
        )}

        <View style={styles.disclaimerBoxResult}>
          <Feather name="info" size={14} color="rgba(255,255,255,0.5)" />
          <Text style={styles.disclaimerTextResult}>{scale.disclaimer}</Text>
        </View>

        <Text style={styles.citationResult}>{scale.citation}</Text>

        {id === 'pcl5' && pcl5Recommendations.length > 0 && (
          <View style={styles.pcl5RecsCard}>
            <View style={styles.pcl5RecsHeader}>
              <Feather name="anchor" size={15} color="#8FAF8A" />
              <Text style={styles.pcl5RecsTitle}>Recommended Practices</Text>
            </View>
            <Text style={styles.pcl5RecsSubtitle}>
              Based on your response pattern, these trauma-informed exercises may be helpful:
            </Text>
            {pcl5Recommendations.map(ex => (
              <TouchableOpacity
                key={ex.id}
                style={styles.pcl5RecRow}
                activeOpacity={0.8}
                onPress={() => router.push(`/exercise/${ex.id}` as any)}
              >
                <View style={styles.pcl5RecIcon}>
                  <Feather name={ex.iconName as any} size={16} color="#5A7A58" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pcl5RecTitle}>{ex.title}</Text>
                  <Text style={styles.pcl5RecMeta}>{ex.durationMinutes} min  {ex.difficulty}</Text>
                </View>
                <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            ))}
            <Text style={styles.pcl5RecsDisclaimer}>
              These are supportive practices, not clinical treatment. Use alongside professional care.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={isSaving}
        >
          <Feather name="check-circle" size={20} color={Colors.primary} />
          <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Results'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeResult} onPress={() => router.back()}>
          <Text style={styles.closeResultText}>Close without saving</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorText: { fontFamily: 'Nunito_600SemiBold', fontSize: 18, color: Colors.text, textAlign: 'center' },
  backLink: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.primary, textAlign: 'center', marginTop: 16 },

  introContent: { paddingHorizontal: 24, alignItems: 'center' },
  closeBtn: { alignSelf: 'flex-start', marginBottom: 20 },
  introIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  introTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 28, color: '#FFF' },
  introFullName: { fontFamily: 'Nunito_500Medium', fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 4, textAlign: 'center' },
  introDesc: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 12, lineHeight: 21 },
  introMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 24 },
  introMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  introMetaText: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  introMetaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 12 },
  introCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 18, width: '100%', marginBottom: 16 },
  introCardTitle: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#FFF', marginBottom: 8 },
  introCardText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
  prevRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  prevDate: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)', flex: 1 },
  prevScore: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#FFF', marginRight: 12 },
  prevSeverity: { fontFamily: 'Nunito_600SemiBold', fontSize: 13 },
  disclaimerBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 24 },
  disclaimerText: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.5)', flex: 1, lineHeight: 16 },

  pcl5RecsCard: {
    width: '100%',
    backgroundColor: 'rgba(143,175,138,0.15)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(143,175,138,0.3)',
  },
  pcl5RecsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  pcl5RecsTitle: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#8FAF8A' },
  pcl5RecsSubtitle: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 14, lineHeight: 19 },
  pcl5RecRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
  },
  pcl5RecIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(143,175,138,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  pcl5RecTitle: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#FFF' },
  pcl5RecMeta: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  pcl5RecsDisclaimer: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 16, marginTop: 8 },

  premiumGate: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    padding: 22,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  premiumGateIconRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  premiumGateTitle: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: '#FFF' },
  premiumGateDesc: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 21, marginBottom: 18 },
  premiumGateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 50,
  },
  premiumGateBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.primary },

  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#FFF', paddingVertical: 16, paddingHorizontal: 48, borderRadius: 30, width: '100%', maxWidth: 300,
  },
  startBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.primary },

  questionContainer: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  progressSection: { marginBottom: 16 },
  progressTrack: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: Colors.secondaryLight, borderRadius: 2 },
  progressLabel: { fontFamily: 'Nunito_500Medium', fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  timeframeLabel: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'center', marginBottom: 20 },
  timeframeText: { fontFamily: 'Nunito_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  questionBody: { flex: 1, justifyContent: 'center', paddingVertical: 20 },
  questionText: { fontFamily: 'Nunito_600SemiBold', fontSize: 20, color: '#FFF', textAlign: 'center', lineHeight: 30 },
  optionsContainer: { gap: 10, marginBottom: 20 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  optionBtnSelected: { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.4)' },
  optionDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  optionDotSelected: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  optionText: { fontFamily: 'Nunito_500Medium', fontSize: 15, color: 'rgba(255,255,255,0.8)', flex: 1 },
  optionTextSelected: { color: '#FFF', fontFamily: 'Nunito_700Bold' },
  optionValue: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  optionValueSelected: { color: '#FFF' },
  backQuestion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  backQuestionText: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.6)' },

  resultsContent: { paddingHorizontal: 24, alignItems: 'center' },
  resultsTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 24, color: '#FFF', marginBottom: 24 },
  scoreRingContainer: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  scoreCenter: { position: 'absolute', alignItems: 'center' },
  scoreNumber: { fontFamily: 'Nunito_800ExtraBold', fontSize: 36, color: '#FFF' },
  scoreMax: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  severityBadge: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginBottom: 24 },
  severityText: { fontFamily: 'Nunito_700Bold', fontSize: 16 },
  interpretCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 20, width: '100%', marginBottom: 16 },
  interpretDesc: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 21 },
  interpretDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 14 },
  interpretRecRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  interpretRec: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.secondaryLight, flex: 1 },
  warningCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: 'rgba(240,192,90,0.15)', borderRadius: 14, padding: 16, width: '100%', marginBottom: 16,
  },
  warningText: { fontFamily: 'Nunito_500Medium', fontSize: 13, color: 'rgba(255,255,255,0.85)', flex: 1, lineHeight: 19 },
  disclaimerBoxResult: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  disclaimerTextResult: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.45)', flex: 1, lineHeight: 16 },
  citationResult: { fontFamily: 'Nunito_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginBottom: 24, lineHeight: 14 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#FFF', paddingVertical: 16, paddingHorizontal: 48, borderRadius: 30, width: '100%', maxWidth: 300, marginBottom: 14,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.primary },
  closeResult: { paddingVertical: 10 },
  closeResultText: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.6)' },
});
