import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { EXERCISES } from '@/constants/exercises';
import { ARTICLES } from '@/constants/articles';
import { CONDITIONS } from '@/constants/conditions';
import { CLINICAL_SCALES, MAIA2_SCALE } from '@/constants/clinical-scales';

function FeatureCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIconCircle}>
        <Feather name={icon as any} size={20} color={Colors.primary} />
      </View>
      <Text style={styles.featureValue}>{value}</Text>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Feather name={icon as any} size={18} color={Colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={[styles.header, { paddingTop: topPadding + 16 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={{ width: 88, height: 88, marginBottom: 12 }}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>Interosense</Text>
          <Text style={styles.tagline}>Discover your body's hidden intelligence</Text>
        </View>

        <Section icon="heart" title="Our Mission">
          <Text style={styles.bodyText}>
            Interosense is built on the belief that understanding your body's internal signals is fundamental to mental wellness. We combine evidence-based interoceptive training with modern technology to make body awareness accessible to everyone.
          </Text>
        </Section>

        <Section icon="book-open" title="The Science">
          <Text style={styles.bodyText}>
            Our approach draws from Mindful Awareness in Body-oriented Therapy (MABT), a clinically validated methodology for developing interoceptive awareness. We also incorporate Kelly Mahler's Interoception framework, which provides structured curricula for building body awareness skills across all ages and abilities.
          </Text>
          <Text style={[styles.bodyText, { marginTop: 10 }]}>
            These methods have been validated through peer-reviewed clinical research, demonstrating measurable improvements in emotional regulation, stress management, and overall mental wellbeing.
          </Text>
        </Section>

        <View style={styles.featuresGrid}>
          <FeatureCard icon="activity" value={String(EXERCISES.length)} label="Guided Exercises" />
          <FeatureCard icon="book-open" value={String(ARTICLES.length)} label="Science Articles" />
          <FeatureCard icon="clipboard" value={String(CLINICAL_SCALES.length + 1)} label="Clinical Assessments" />
          <FeatureCard icon="layers" value={String(CONDITIONS.length)} label="Condition Programs" />
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>

        <View style={styles.disclaimerContainer}>
          <Feather name="alert-circle" size={16} color={Colors.textTertiary} style={{ marginTop: 2 }} />
          <Text style={styles.disclaimerText}>
            Interosense is not a replacement for professional medical care. If you are experiencing a mental health crisis, please contact emergency services or a mental health professional.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtnText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  logoText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 32,
    color: Colors.primary,
    marginBottom: 8,
  },
  tagline: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(107,91,149,0.08)' } as any,
      default: {
        shadowColor: Colors.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 17,
    color: Colors.text,
  },
  bodyText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 23,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  featureCard: {
    width: '47%' as any,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(107,91,149,0.08)' } as any,
      default: {
        shadowColor: Colors.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  featureIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureValue: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 24,
    color: Colors.primary,
    marginBottom: 2,
  },
  featureLabel: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  versionText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.textTertiary,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textTertiary,
    lineHeight: 20,
  },
});
