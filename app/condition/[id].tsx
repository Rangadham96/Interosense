import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { getConditionById } from '@/constants/conditions';
import { getExerciseById } from '@/constants/exercises';

export default function ConditionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const condition = getConditionById(id || '');
  const webTopPadding = 0;

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
    .filter(Boolean)
    .slice(0, 4);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.headerBar, { paddingTop: webTopPadding + insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.primary} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={[condition.color + '30', Colors.background]}
        style={styles.heroSection}
      >
        <View style={[styles.heroIcon, { backgroundColor: condition.color + '25' }]}>
          <Feather name={condition.iconName as any} size={32} color={condition.color} />
        </View>
        <Text style={styles.heroTitle}>{condition.name}</Text>
        <Text style={styles.heroSubtitle}>{condition.subtitle}</Text>
        <View style={styles.prevalenceBox}>
          <Text style={styles.prevalenceText}>{condition.prevalence}</Text>
        </View>
      </LinearGradient>

      <View style={styles.disclaimerCard}>
        <View style={styles.disclaimerIconWrap}>
          <Feather name="shield" size={16} color={Colors.warning} />
        </View>
        <Text style={styles.disclaimerText}>{condition.disclaimer}</Text>
      </View>

      <View style={styles.body}>
        <Section title="Overview" iconName="info" content={condition.overview} />
        <Section title="The Neuroscience" iconName="cpu" content={condition.neuroscience} />

        <View style={styles.interoCard}>
          <View style={styles.interoHeader}>
            <View style={styles.interoIconWrap}>
              <Feather name="link" size={15} color={Colors.primary} />
            </View>
            <Text style={styles.interoTitle}>Interoception Connection</Text>
          </View>
          <Text style={styles.interoContent}>{condition.interoceptionConnection}</Text>
        </View>

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
                  <Text style={styles.exerciseMeta}>{ex.durationMinutes} min · {ex.difficulty} · {ex.methodology}</Text>
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

        <View style={styles.professionalSupportCard}>
          <View style={styles.professionalSupportHeader}>
            <View style={styles.professionalIconWrap}>
              <Feather name="user-check" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.professionalSupportTitle}>When to Seek Professional Help</Text>
          </View>
          <Text style={styles.professionalSupportSubtitle}>
            Self-care is valuable, but professional support makes a lasting difference.
          </Text>
          {condition.warningSignsForProfessionalHelp.map((s, i) => (
            <View key={i} style={styles.warningRow}>
              <Feather name="alert-circle" size={14} color={Colors.error} />
              <Text style={styles.warningText}>{s}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={styles.crisisButton}
            onPress={() => router.push('/crisis')}
            activeOpacity={0.8}
          >
            <Feather name="phone" size={15} color={Colors.primary} />
            <Text style={styles.crisisButtonText}>Get Support Now</Text>
          </TouchableOpacity>
        </View>

        {condition.resources.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="external-link" size={16} color={Colors.text} />
              <Text style={styles.sectionTitle}>Resources</Text>
            </View>
            {condition.resources.map((r, i) => (
              <View key={i} style={styles.resourceRow}>
                <View style={styles.resourceDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.resourceName}>{r.name}</Text>
                  <Text style={styles.resourceDesc}>{r.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="book-open" size={16} color={Colors.text} />
            <Text style={styles.sectionTitle}>Research Citations</Text>
          </View>
          {condition.researchCitations.map((c, i) => (
            <Text key={i} style={styles.citation}>{c}</Text>
          ))}
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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backBtnText: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.primary },
  heroSection: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 28, paddingTop: 8 },
  heroIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 26, color: Colors.text, textAlign: 'center' },
  heroSubtitle: { fontFamily: 'Nunito_500Medium', fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginTop: 6 },
  prevalenceBox: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: 14, marginTop: 16, marginHorizontal: 8 },
  prevalenceText: { fontFamily: 'Nunito_500Medium', fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19 },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.warning + '14',
    borderRadius: 14,
    padding: 14,
  },
  disclaimerIconWrap: {
    marginTop: 1,
  },
  disclaimerText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 19 },
  body: { paddingHorizontal: 20 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: Colors.text },
  sectionContent: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  interoCard: {
    backgroundColor: `${Colors.primary}09`,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${Colors.primary}20`,
  },
  interoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  interoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: `${Colors.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interoTitle: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.primary },
  interoContent: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text, lineHeight: 22 },
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
  professionalSupportCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.error + '25',
  },
  professionalSupportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  professionalIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  professionalSupportTitle: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.text },
  professionalSupportSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
    lineHeight: 19,
  },
  warningRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  warningText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 19 },
  crisisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary + '12',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  crisisButtonText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: Colors.primary,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  resourceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 5,
  },
  resourceName: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.text },
  resourceDesc: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textTertiary, marginTop: 2, lineHeight: 17 },
  citation: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textTertiary, lineHeight: 17, marginBottom: 8 },
  errorText: { fontFamily: 'Nunito_600SemiBold', fontSize: 18, color: Colors.text, textAlign: 'center' },
  backLink: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.primary, textAlign: 'center', marginTop: 16 },
});
