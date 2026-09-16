import React, { useMemo } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import { getExerciseById } from '@/constants/exercises';
import { useApp } from '@/contexts/AppContext';
import { getCompletedPathwayDays, getPathwayPurpose, PATHWAY_SEQUENCE } from '@/lib/pathway';

export default function PathwayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pathway14, startPathway14, resetPathway14 } = useApp();
  const topPadding = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);
  const completedDays = useMemo(
    () => pathway14 ? getCompletedPathwayDays(pathway14) : [],
    [pathway14],
  );
  const currentExercise = pathway14 ? getExerciseById(pathway14.currentExerciseId) : null;
  const baselineAttempt = pathway14?.attempts[0] ?? null;
  const latestAttempt = pathway14?.attempts[pathway14.attempts.length - 1] ?? null;
  const progress = pathway14?.completedAt
    ? 100
    : pathway14
      ? Math.round((completedDays.length / PATHWAY_SEQUENCE.length) * 100)
      : 0;

  const handleRestart = () => {
    const restart = () => resetPathway14().then(startPathway14);
    if (Platform.OS === 'web') {
      restart();
      return;
    }
    Alert.alert(
      'Restart pathway?',
      'This clears your current pathway progress. Your saved exercise sessions will remain.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restart', style: 'destructive', onPress: restart },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={Colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>14-Day Pathway</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 24 }]}>
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Feather name="compass" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.introTitle}>Learn your body signals, one short practice at a time</Text>
          <Text style={styles.introText}>
            The sequence uses beginner practices and your own comfort reports. Missed days do not reset progress, and you can pause or repeat whenever needed.
          </Text>

          {!pathway14 ? (
            <TouchableOpacity style={styles.primaryButton} onPress={startPathway14}>
              <Text style={styles.primaryButtonText}>Start Day 1</Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  {pathway14.completedAt ? 'Pathway complete' : `Day ${pathway14.currentDay} of 14`}
                </Text>
                <Text style={styles.progressPercent}>{progress}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
            </>
          )}
        </View>

        {pathway14 && !pathway14.completedAt && currentExercise && (
          <View style={styles.currentCard}>
            <Text style={styles.eyebrow}>CURRENT PRACTICE</Text>
            <Text style={styles.currentTitle}>{currentExercise.title}</Text>
            <Text style={styles.currentPurpose}>{getPathwayPurpose(pathway14)}</Text>
            {pathway14.currentExerciseId === 'safety-anchoring' && (
              <View style={styles.supportNote}>
                <Feather name="heart" size={15} color={Colors.primary} />
                <Text style={styles.supportText}>
                  Your recent responses suggested repeating with a gentler support practice before continuing.
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push(`/exercise/${currentExercise.id}`)}
            >
              <Feather name="play" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Begin today&apos;s practice</Text>
            </TouchableOpacity>
          </View>
        )}

        {pathway14?.completedAt && (
          <View style={styles.completeCard}>
            <Feather name="check-circle" size={30} color={Colors.success} />
            <Text style={styles.completeTitle}>You completed the pathway</Text>
            <Text style={styles.completeText}>
              This comparison uses the same questions from the beginning and end. It is a personal observation, not a clinical score.
            </Text>
            {baselineAttempt && latestAttempt && (
              <View style={styles.outcomeComparison}>
                <View style={styles.outcomeRow}>
                  <Text style={styles.outcomeLabel}>Sensation clarity</Text>
                  <Text style={styles.outcomeValue}>
                    {baselineAttempt.beforeAwareness} at start  •  {latestAttempt.afterAwareness} at end
                  </Text>
                </View>
                <View style={styles.outcomeDivider} />
                <View style={styles.outcomeRow}>
                  <Text style={styles.outcomeLabel}>Comfort with sensations</Text>
                  <Text style={styles.outcomeValue}>
                    {baselineAttempt.beforeComfort} at start  •  {latestAttempt.afterComfort} at end
                  </Text>
                </View>
              </View>
            )}
            <TouchableOpacity style={styles.secondaryButton} onPress={handleRestart}>
              <Text style={styles.secondaryButtonText}>Start again</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>THE 14 DAYS</Text>
        <View style={styles.daysCard}>
          {PATHWAY_SEQUENCE.map(item => {
            const exercise = getExerciseById(item.exerciseId);
            const completed = completedDays.includes(item.day);
            const current = pathway14 && !pathway14.completedAt && pathway14.currentDay === item.day;
            return (
              <View key={item.day} style={styles.dayRow}>
                <View style={[styles.dayNumber, completed && styles.dayNumberComplete, current && styles.dayNumberCurrent]}>
                  {completed
                    ? <Feather name="check" size={14} color="#FFFFFF" />
                    : <Text style={[styles.dayNumberText, current && styles.dayNumberTextCurrent]}>{item.day}</Text>}
                </View>
                <View style={styles.dayContent}>
                  <Text style={[styles.dayTitle, current && styles.dayTitleCurrent]}>
                    {exercise?.title ?? `Day ${item.day}`}
                  </Text>
                  <Text style={styles.dayPurpose}>{item.purpose}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {pathway14 && !pathway14.completedAt && (
          <TouchableOpacity style={styles.resetLink} onPress={handleRestart}>
            <Text style={styles.resetLinkText}>Restart pathway</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    height: 56, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 72 },
  backText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.primary },
  headerTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 17, color: Colors.text },
  headerSpacer: { width: 72 },
  content: { padding: 20, gap: 18 },
  introCard: { backgroundColor: '#F1ECF8', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E2D8F0' },
  introIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  introTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 21, lineHeight: 27, color: Colors.text },
  introText: { fontFamily: 'Nunito_400Regular', fontSize: 14, lineHeight: 21, color: Colors.textSecondary, marginTop: 8 },
  primaryButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 14, marginTop: 18,
  },
  primaryButtonText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#FFFFFF' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, marginBottom: 7 },
  progressLabel: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.text },
  progressPercent: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.primary },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: Colors.primary },
  currentCard: { backgroundColor: Colors.surface, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: Colors.border },
  eyebrow: { fontFamily: 'Nunito_700Bold', fontSize: 11, letterSpacing: 1.2, color: Colors.primary, marginBottom: 7 },
  currentTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 20, color: Colors.text },
  currentPurpose: { fontFamily: 'Nunito_400Regular', fontSize: 14, lineHeight: 20, color: Colors.textSecondary, marginTop: 6 },
  supportNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: '#F5F1FA', padding: 12, borderRadius: 12, marginTop: 13 },
  supportText: { flex: 1, fontFamily: 'Nunito_400Regular', fontSize: 12, lineHeight: 18, color: Colors.textSecondary },
  completeCard: { backgroundColor: '#EEF8F1', borderRadius: 18, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#CFE8D5' },
  completeTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 20, color: Colors.text, marginTop: 10 },
  completeText: { fontFamily: 'Nunito_400Regular', fontSize: 13, lineHeight: 19, color: Colors.textSecondary, textAlign: 'center', marginTop: 6 },
  outcomeComparison: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginTop: 16 },
  outcomeRow: { gap: 3 },
  outcomeLabel: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: Colors.text },
  outcomeValue: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.primary },
  outcomeDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 11 },
  secondaryButton: { borderWidth: 1, borderColor: Colors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginTop: 15 },
  secondaryButtonText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.primary },
  sectionTitle: { fontFamily: 'Nunito_700Bold', fontSize: 12, letterSpacing: 1.3, color: Colors.textSecondary, marginTop: 4 },
  daysCard: { backgroundColor: Colors.surface, borderRadius: 18, paddingHorizontal: 16, borderWidth: 1, borderColor: Colors.border },
  dayRow: { flexDirection: 'row', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  dayNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  dayNumberComplete: { backgroundColor: Colors.success },
  dayNumberCurrent: { backgroundColor: Colors.primary },
  dayNumberText: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: Colors.textSecondary },
  dayNumberTextCurrent: { color: '#FFFFFF' },
  dayContent: { flex: 1 },
  dayTitle: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.text },
  dayTitleCurrent: { color: Colors.primary },
  dayPurpose: { fontFamily: 'Nunito_400Regular', fontSize: 12, lineHeight: 17, color: Colors.textSecondary, marginTop: 2 },
  resetLink: { alignSelf: 'center', paddingVertical: 10 },
  resetLinkText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.error },
});