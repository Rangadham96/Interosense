import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const EXPERIENCE_LEVELS = [
  { key: 'beginner', label: 'Beginner', description: 'New to body awareness practices', icon: 'compass' as const },
  { key: 'intermediate', label: 'Intermediate', description: 'Some meditation or mindfulness experience', icon: 'trending-up' as const },
  { key: 'advanced', label: 'Advanced', description: 'Regular mindfulness or somatic practitioner', icon: 'award' as const },
];

const DAILY_OPTIONS = [5, 10, 15, 20, 30];

export default function EditPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const { profile, updateProfile } = useApp();

  const [level, setLevel] = useState<string>(profile?.experienceLevel || 'beginner');
  const [dailyMinutes, setDailyMinutes] = useState<number>(profile?.dailyMinutes || 10);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = level !== profile?.experienceLevel || dailyMinutes !== profile?.dailyMinutes;

  const handleSave = async () => {
    if (!profile || isSaving) return;
    setIsSaving(true);
    try {
      await updateProfile({
        ...profile,
        experienceLevel: level as 'beginner' | 'intermediate' | 'advanced',
        dailyMinutes,
      });
      router.back();
    } catch (e) {
      console.error('Failed to save preferences:', e);
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferences</Text>
        <TouchableOpacity
          onPress={hasChanges ? handleSave : undefined}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
          disabled={!hasChanges || isSaving}
        >
          <Feather
            name="check"
            size={24}
            color={hasChanges && !isSaving ? Colors.primary : Colors.textTertiary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience Level</Text>
          <Text style={styles.sectionSubtitle}>
            This helps us recommend the right exercises for you
          </Text>
          <View style={styles.experienceList}>
            {EXPERIENCE_LEVELS.map(exp => {
              const isSelected = level === exp.key;
              return (
                <TouchableOpacity
                  key={exp.key}
                  style={[styles.experienceCard, isSelected && styles.experienceCardSelected]}
                  onPress={() => setLevel(exp.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.experienceIcon, isSelected && styles.experienceIconSelected]}>
                    <Feather
                      name={exp.icon}
                      size={22}
                      color={isSelected ? '#FFFFFF' : Colors.primary}
                    />
                  </View>
                  <View style={styles.experienceInfo}>
                    <Text style={[styles.experienceTitle, isSelected && styles.experienceTitleSelected]}>
                      {exp.label}
                    </Text>
                    <Text style={styles.experienceDesc}>{exp.description}</Text>
                  </View>
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Practice Goal</Text>
          <Text style={styles.sectionSubtitle}>
            How many minutes per day would you like to practice?
          </Text>
          <View style={styles.pillsRow}>
            {DAILY_OPTIONS.map(min => {
              const isSelected = dailyMinutes === min;
              return (
                <TouchableOpacity
                  key={min}
                  style={[styles.timePill, isSelected && styles.timePillSelected]}
                  onPress={() => setDailyMinutes(min)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timePillNumber, isSelected && styles.timePillNumberSelected]}>
                    {min}
                  </Text>
                  <Text style={[styles.timePillLabel, isSelected && styles.timePillLabelSelected]}>
                    min
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (!hasChanges || isSaving) && styles.saveButtonDisabled]}
          onPress={hasChanges ? handleSave : undefined}
          activeOpacity={0.8}
          disabled={!hasChanges || isSaving}
        >
          <Feather name="check" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 16,
  },
  experienceList: {
    gap: 10,
  },
  experienceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  experienceCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F5F0FF',
  },
  experienceIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  experienceIconSelected: {
    backgroundColor: Colors.primary,
  },
  experienceInfo: {
    flex: 1,
  },
  experienceTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: Colors.text,
  },
  experienceTitleSelected: {
    color: Colors.primary,
  },
  experienceDesc: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  timePill: {
    width: (SCREEN_WIDTH - 40 - 40) / 5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  timePillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timePillNumber: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: Colors.text,
  },
  timePillNumberSelected: {
    color: '#FFFFFF',
  },
  timePillLabel: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  timePillLabelSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 30,
    paddingVertical: 16,
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  saveButtonText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
  },
});
