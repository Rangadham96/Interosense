import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { CONDITIONS } from '@/constants/conditions';
import { useApp } from '@/contexts/AppContext';

export default function ConditionsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useApp();
  const webTopPadding = 0;

  const userConditionIds: string[] = profile?.conditions ?? [];
  const userConditions = CONDITIONS.filter(c => userConditionIds.includes(c.id));
  const allConditions = CONDITIONS;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: webTopPadding + insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.primary} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Condition Library</Text>
          <Text style={styles.headerSubtitle}>
            Evidence-based interoceptive approaches for specific conditions
          </Text>
        </View>
      </View>

      <View style={styles.disclaimer}>
        <Feather name="info" size={14} color={Colors.textSecondary} />
        <Text style={styles.disclaimerText}>
          This information is educational. It does not replace professional medical advice, diagnosis, or treatment.
        </Text>
      </View>

      {userConditions.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>YOUR CONDITIONS</Text>
          <View style={styles.list}>
            {userConditions.map(condition => (
              <TouchableOpacity
                key={condition.id}
                style={[styles.conditionCard, styles.conditionCardHighlighted]}
                onPress={() => router.push(`/condition/${condition.id}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.conditionIcon, { backgroundColor: condition.color + '25' }]}>
                  <Feather name={condition.iconName as any} size={22} color={condition.color} />
                </View>
                <View style={styles.conditionContent}>
                  <Text style={styles.conditionName}>{condition.name}</Text>
                  <Text style={styles.conditionSubtitle} numberOfLines={2}>{condition.subtitle}</Text>
                  <Text style={styles.conditionPrevalence} numberOfLines={1}>{condition.prevalence.split('.')[0]}</Text>
                </View>
                <View style={styles.yourBadge}>
                  <Text style={styles.yourBadgeText}>Yours</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionLabel}>ALL CONDITIONS</Text>
      <View style={styles.list}>
        {allConditions.map(condition => (
          <TouchableOpacity
            key={condition.id}
            style={styles.conditionCard}
            onPress={() => router.push(`/condition/${condition.id}`)}
            activeOpacity={0.7}
          >
            <View style={[styles.conditionIcon, { backgroundColor: condition.color + '18' }]}>
              <Feather name={condition.iconName as any} size={22} color={condition.color} />
            </View>
            <View style={styles.conditionContent}>
              <Text style={styles.conditionName}>{condition.name}</Text>
              <Text style={styles.conditionSubtitle} numberOfLines={2}>{condition.subtitle}</Text>
              <Text style={styles.conditionPrevalence} numberOfLines={1}>{condition.prevalence.split('.')[0]}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: Platform.OS === 'web' ? 34 : 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backBtnText: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.primary },
  headerContent: { marginTop: 4 },
  headerTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 26, color: Colors.text },
  headerSubtitle: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: Colors.textSecondary, marginTop: 6, lineHeight: 20 },
  disclaimer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: 20,
    backgroundColor: Colors.backgroundSecondary, borderRadius: 12, padding: 14, marginBottom: 16,
  },
  disclaimerText: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textSecondary, flex: 1, lineHeight: 17 },
  sectionLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginBottom: 10,
    marginTop: 8,
  },
  list: { paddingHorizontal: 20, gap: 10, marginBottom: 8 },
  conditionCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  conditionCardHighlighted: {
    borderWidth: 1.5,
    borderColor: Colors.primary + '30',
  },
  conditionIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  conditionContent: { flex: 1, gap: 3 },
  conditionName: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.text },
  conditionSubtitle: { fontFamily: 'Nunito_500Medium', fontSize: 13, color: Colors.textSecondary },
  conditionPrevalence: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.textTertiary },
  yourBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  yourBadgeText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    color: Colors.primary,
  },
});
