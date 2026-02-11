import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/colors';
import { getConditionById } from '@/constants/conditions';
import { getExerciseById } from '@/constants/exercises';

export default function ConditionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const condition = getConditionById(id || '');
  const webTopPadding = Platform.OS === 'web' ? 67 : 0;

  if (!condition) {
    return (
      <View style={[styles.container, { paddingTop: webTopPadding + insets.top + 40 }]}>
        <Text style={styles.errorText}>Condition not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const recommendedExercises = condition.recommendedExerciseIds
    .map(eid => getExerciseById(eid))
    .filter(Boolean);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.headerBar, { paddingTop: webTopPadding + insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.heroSection}>
        <View style={[styles.heroIcon, { backgroundColor: condition.color + '20' }]}>
          <Feather name={condition.iconName as any} size={32} color={condition.color} />
        </View>
        <Text style={styles.heroTitle}>{condition.name}</Text>
        <Text style={styles.heroSubtitle}>{condition.subtitle}</Text>
        <View style={styles.prevalenceBox}>
          <Text style={styles.prevalenceText}>{condition.prevalence}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Section title="Overview" iconName="info" content={condition.overview} />
        <Section title="Neuroscience" iconName="cpu" content={condition.neuroscience} />
        <Section title="Interoception Connection" iconName="link" content={condition.interoceptionConnection} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="alert-circle" size={16} color={Colors.text} />
            <Text style={styles.sectionTitle}>Common Symptoms</Text>
          </View>
          {condition.symptoms.map((s, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: condition.color }]} />
              <Text style={styles.bulletText}>{s}</Text>
            </View>
          ))}
        </View>

        {recommendedExercises.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="play-circle" size={16} color={Colors.text} />
              <Text style={styles.sectionTitle}>Recommended Exercises</Text>
            </View>
            {recommendedExercises.map(ex => ex && (
              <TouchableOpacity
                key={ex.id}
                style={styles.exerciseRow}
                onPress={() => router.push(`/exercise/${ex.id}`)}
                activeOpacity={0.7}
              >
                <Feather name={ex.iconName as any} size={18} color={condition.color} />
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{ex.title}</Text>
                  <Text style={styles.exerciseMeta}>{ex.durationMinutes} min | {ex.difficulty} | {ex.methodology}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="heart" size={16} color={Colors.text} />
            <Text style={styles.sectionTitle}>Self-Care Strategies</Text>
          </View>
          {condition.selfCareStrategies.map((s, i) => (
            <View key={i} style={styles.strategyCard}>
              <Text style={styles.strategyNumber}>{i + 1}</Text>
              <Text style={styles.strategyText}>{s}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="alert-triangle" size={16} color={Colors.warning} />
            <Text style={styles.sectionTitle}>When to Seek Professional Help</Text>
          </View>
          {condition.warningSignsForProfessionalHelp.map((s, i) => (
            <View key={i} style={styles.warningRow}>
              <Feather name="alert-circle" size={14} color={Colors.error} />
              <Text style={styles.warningText}>{s}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="book-open" size={16} color={Colors.text} />
            <Text style={styles.sectionTitle}>Research Citations</Text>
          </View>
          {condition.researchCitations.map((c, i) => (
            <Text key={i} style={styles.citation}>{c}</Text>
          ))}
        </View>

        <View style={styles.disclaimerBox}>
          <Feather name="info" size={14} color={Colors.textSecondary} />
          <Text style={styles.disclaimerText}>{condition.disclaimer}</Text>
        </View>
      </View>

      <View style={{ height: Platform.OS === 'web' ? 34 : 40 }} />
    </ScrollView>
  );
}

function Section({ title, iconName, content }: { title: string; iconName: string; content: string }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Feather name={iconName as any} size={16} color={Colors.text} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.sectionContent}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBar: { paddingHorizontal: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  heroSection: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 24 },
  heroIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 26, color: Colors.text, textAlign: 'center' },
  heroSubtitle: { fontFamily: 'Nunito_500Medium', fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginTop: 6 },
  prevalenceBox: { backgroundColor: Colors.backgroundSecondary, borderRadius: 12, padding: 14, marginTop: 16, marginHorizontal: 8 },
  prevalenceText: { fontFamily: 'Nunito_500Medium', fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19 },
  body: { paddingHorizontal: 20 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: Colors.text },
  sectionContent: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  bulletText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary, flex: 1 },
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 8,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.text },
  exerciseMeta: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  strategyCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 8,
  },
  strategyNumber: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: Colors.primary, width: 22 },
  strategyText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 19 },
  warningRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  warningText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 19 },
  citation: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textTertiary, lineHeight: 17, marginBottom: 8 },
  disclaimerBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.backgroundSecondary, borderRadius: 12, padding: 14, marginBottom: 20,
  },
  disclaimerText: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textSecondary, flex: 1, lineHeight: 17 },
  errorText: { fontFamily: 'Nunito_600SemiBold', fontSize: 18, color: Colors.text, textAlign: 'center' },
  backLink: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.primary, textAlign: 'center', marginTop: 16 },
});
