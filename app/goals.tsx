import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  TextInput,
  Platform,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Goal } from '@/lib/storage';

const GOAL_TYPES = ['sessions', 'streak', 'minutes', 'checkins', 'awareness'] as const;

const TYPE_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  sessions: 'activity',
  streak: 'zap',
  minutes: 'clock',
  checkins: 'clipboard',
  awareness: 'radio',
};

const TYPE_LABELS: Record<string, string> = {
  sessions: 'Sessions',
  streak: 'Streak',
  minutes: 'Minutes',
  checkins: 'Check-ins',
  awareness: 'Awareness',
};

function getProgressForType(
  type: string,
  totalSessions: number,
  currentStreak: number,
  totalMinutes: number,
  checkinsLength: number,
  averageAwareness: number,
): number {
  switch (type) {
    case 'sessions': return totalSessions;
    case 'streak': return currentStreak;
    case 'minutes': return totalMinutes;
    case 'checkins': return checkinsLength;
    case 'awareness': return averageAwareness;
    default: return 0;
  }
}

export default function GoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    goals, addGoal, updateGoals,
    totalSessions, currentStreak, totalMinutes, checkins, averageAwareness,
  } = useApp();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState<typeof GOAL_TYPES[number]>('sessions');
  const [targetValue, setTargetValue] = useState('');

  const updatedGoals = useMemo(() => {
    return goals.map((goal) => {
      const current = getProgressForType(
        goal.type, totalSessions, currentStreak, totalMinutes, checkins.length, averageAwareness,
      );
      return {
        ...goal,
        currentValue: current,
        completed: current >= goal.targetValue,
      };
    });
  }, [goals, totalSessions, currentStreak, totalMinutes, checkins.length, averageAwareness]);

  useEffect(() => {
    const needsUpdate = goals.some((goal, i) => {
      const updated = updatedGoals[i];
      return goal.currentValue !== updated.currentValue || goal.completed !== updated.completed;
    });
    if (needsUpdate && updatedGoals.length > 0) {
      updateGoals(updatedGoals);
    }
  }, [updatedGoals]);

  const handleCreate = async () => {
    if (!title.trim() || !targetValue.trim()) return;
    const target = parseInt(targetValue, 10);
    if (isNaN(target) || target <= 0) return;

    const current = getProgressForType(
      selectedType, totalSessions, currentStreak, totalMinutes, checkins.length, averageAwareness,
    );

    const newGoal: Goal = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      type: selectedType,
      targetValue: target,
      currentValue: current,
      createdAt: new Date().toISOString(),
      completed: current >= target,
    };

    await addGoal(newGoal);
    setTitle('');
    setSelectedType('sessions');
    setTargetValue('');
    setModalVisible(false);
  };

  const renderGoalCard = ({ item }: { item: Goal & { currentValue: number; completed: boolean } }) => {
    const progress = Math.min(item.currentValue / item.targetValue, 1);
    const percentage = Math.round(progress * 100);

    return (
      <View style={styles.goalCard}>
        <View style={styles.goalCardHeader}>
          <View style={styles.goalTypeIcon}>
            <Feather name={TYPE_ICONS[item.type]} size={18} color={Colors.primary} />
          </View>
          <View style={styles.goalCardTitleArea}>
            <Text style={styles.goalTitle}>{item.title}</Text>
            <Text style={styles.goalTypeLabel}>{TYPE_LABELS[item.type]}</Text>
          </View>
          {item.completed && (
            <Feather name="check-circle" size={22} color={Colors.success} />
          )}
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${percentage}%` as any,
                backgroundColor: item.completed ? Colors.success : Colors.primary,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {item.currentValue} / {item.targetValue}
          <Text style={styles.percentageText}>  {percentage}%</Text>
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>My Goals</Text>
        <Pressable onPress={() => setModalVisible(true)} hitSlop={12}>
          <Feather name="plus" size={24} color={Colors.primary} />
        </Pressable>
      </View>

      {updatedGoals.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Feather name="target" size={40} color={Colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No goals yet</Text>
          <Text style={styles.emptySubtitle}>Tap the + button to set your first goal</Text>
        </View>
      ) : (
        <FlatList
          data={updatedGoals}
          keyExtractor={(item) => item.id}
          renderItem={renderGoalCard}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomInset + 20 }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboard}
          >
            <Pressable style={[styles.modalSheet, { paddingBottom: bottomInset + 20 }]} onPress={() => {}}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Add New Goal</Text>

              <Text style={styles.inputLabel}>Goal Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Complete 10 sessions"
                placeholderTextColor={Colors.textTertiary}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Goal Type</Text>
              <View style={styles.chipRow}>
                {GOAL_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    style={[styles.chip, selectedType === type && styles.chipActive]}
                    onPress={() => setSelectedType(type)}
                  >
                    <Feather
                      name={TYPE_ICONS[type]}
                      size={14}
                      color={selectedType === type ? Colors.textInverse : Colors.textSecondary}
                    />
                    <Text style={[styles.chipText, selectedType === type && styles.chipTextActive]}>
                      {TYPE_LABELS[type]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.inputLabel}>Target Value</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 10"
                placeholderTextColor={Colors.textTertiary}
                value={targetValue}
                onChangeText={setTargetValue}
                keyboardType="number-pad"
              />

              <Pressable
                style={[styles.createButton, (!title.trim() || !targetValue.trim()) && styles.createButtonDisabled]}
                onPress={handleCreate}
              >
                <Text style={styles.createButtonText}>Create Goal</Text>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
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
    paddingVertical: 16,
  },
  headerTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: Colors.text,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  goalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  goalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalCardTitleArea: {
    flex: 1,
  },
  goalTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.text,
  },
  goalTypeLabel: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    color: Colors.text,
  },
  percentageText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalKeyboard: {
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: Colors.text,
    marginBottom: 24,
  },
  inputLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.background,
    marginBottom: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textInverse,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: Colors.textInverse,
  },
});
