import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';
import { CONDITIONS } from '@/constants/conditions';

export default function EditConditionsScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useApp();
  const topPadding = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);

  const [selectedConditions, setSelectedConditions] = useState<string[]>(
    profile?.conditions || []
  );

  const toggleCondition = (id: string) => {
    setSelectedConditions(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!profile) return;
    await updateProfile({ ...profile, conditions: selectedConditions });
    router.back();
  };

  const hasChanges =
    JSON.stringify([...(profile?.conditions || [])].sort()) !==
    JSON.stringify([...selectedConditions].sort());

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Feather name="arrow-left" size={20} color={Colors.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Conditions</Text>
        <TouchableOpacity
          onPress={handleSave}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          disabled={!hasChanges}
        >
          <Feather
            name="check"
            size={24}
            color={hasChanges ? Colors.primary : Colors.textTertiary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.description}>
          Select the conditions you want to focus on. We will personalize exercises and insights based on your selections.
        </Text>

        <Text style={styles.selectionCount}>
          {selectedConditions.length} selected
        </Text>

        {CONDITIONS.map(condition => {
          const isSelected = selectedConditions.includes(condition.id);
          return (
            <TouchableOpacity
              key={condition.id}
              style={[
                styles.conditionCard,
                isSelected && styles.conditionCardSelected,
              ]}
              onPress={() => toggleCondition(condition.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: isSelected
                      ? condition.color
                      : `${condition.color}30`,
                  },
                ]}
              >
                <Feather
                  name={condition.iconName as keyof typeof Feather.glyphMap}
                  size={20}
                  color={isSelected ? '#FFFFFF' : condition.color}
                />
              </View>
              <View style={styles.conditionInfo}>
                <Text
                  style={[
                    styles.conditionName,
                    isSelected && styles.conditionNameSelected,
                  ]}
                >
                  {condition.name}
                </Text>
                <Text style={styles.conditionSubtitle} numberOfLines={1}>
                  {condition.subtitle}
                </Text>
              </View>
              <View style={styles.checkArea}>
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: condition.color },
                  ]}
                />
                <View
                  style={[
                    styles.checkbox,
                    isSelected && [
                      styles.checkboxSelected,
                      { backgroundColor: Colors.primary, borderColor: Colors.primary },
                    ],
                  ]}
                >
                  {isSelected && (
                    <Feather name="check" size={14} color="#FFFFFF" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButtonText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.primary,
  },
  headerTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: Colors.text,
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  description: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  selectionCount: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  conditionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  conditionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}08`,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  conditionInfo: {
    flex: 1,
    marginRight: 12,
  },
  conditionName: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.text,
    marginBottom: 2,
  },
  conditionNameSelected: {
    fontFamily: 'Nunito_700Bold',
    color: Colors.primary,
  },
  conditionSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  checkArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  checkboxSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
});
