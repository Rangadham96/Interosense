import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { ACHIEVEMENTS, TIER_COLORS, Achievement, AchievementTier } from '@/constants/achievements';

const CATEGORIES = ['all', 'consistency', 'exploration', 'mastery', 'progress', 'special'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  consistency: 'Consistency',
  exploration: 'Exploration',
  mastery: 'Mastery',
  progress: 'Progress',
  special: 'Special',
};

const TIER_ORDER: Record<AchievementTier, number> = {
  diamond: 0,
  platinum: 1,
  gold: 2,
  silver: 3,
  bronze: 4,
};

export default function AchievementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unlockedAchievements } = useApp();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number]>('all');

  const isUnlocked = (id: string) => unlockedAchievements.includes(id);

  const totalUnlocked = unlockedAchievements.length;
  const totalAchievements = ACHIEVEMENTS.length;
  const progressPercent = totalAchievements > 0 ? Math.round((totalUnlocked / totalAchievements) * 100) : 0;

  const filteredAchievements = useMemo(() => {
    let list = selectedCategory === 'all'
      ? [...ACHIEVEMENTS]
      : ACHIEVEMENTS.filter((a) => a.category === selectedCategory);

    list.sort((a, b) => {
      const aUnlocked = isUnlocked(a.id) ? 0 : 1;
      const bUnlocked = isUnlocked(b.id) ? 0 : 1;
      if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked;
      return TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
    });

    return list;
  }, [selectedCategory, unlockedAchievements]);

  const renderAchievement = ({ item, index }: { item: Achievement; index: number }) => {
    const unlocked = isUnlocked(item.id);
    const tierColor = TIER_COLORS[item.tier];

    return (
      <View style={[
        styles.achievementCard,
        { opacity: unlocked ? 1 : 0.5 },
        index % 2 === 0 ? { marginRight: 6 } : { marginLeft: 6 },
      ]}>
        <View style={[
          styles.badgeCircle,
          { backgroundColor: unlocked ? tierColor : Colors.backgroundSecondary },
        ]}>
          {unlocked ? (
            <Feather
              name={item.iconName as keyof typeof Feather.glyphMap}
              size={24}
              color={unlocked ? '#FFFFFF' : Colors.textTertiary}
            />
          ) : (
            <Feather name="lock" size={24} color={Colors.textTertiary} />
          )}
        </View>
        <Text style={styles.achievementTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.achievementDesc} numberOfLines={2}>{item.description}</Text>
        <Text style={[styles.tierLabel, { color: tierColor }]}>
          {item.tier.charAt(0).toUpperCase() + item.tier.slice(1)}
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
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statsTextRow}>
          <Text style={styles.statsLabel}>{totalUnlocked} of {totalAchievements} unlocked</Text>
          <Text style={styles.statsPercent}>{progressPercent}%</Text>
        </View>
        <View style={styles.statsProgressBg}>
          <View style={[styles.statsProgressFill, { width: `${progressPercent}%` as any }]} />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
        style={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
              {CATEGORY_LABELS[cat]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filteredAchievements}
        keyExtractor={(item) => item.id}
        renderItem={renderAchievement}
        numColumns={2}
        contentContainerStyle={[styles.gridContent, { paddingBottom: bottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.columnWrapper}
      />
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
  statsBar: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 16,
  },
  statsTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statsLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: Colors.text,
  },
  statsPercent: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: Colors.primary,
  },
  statsProgressBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
  },
  statsProgressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  categoryScroll: {
    flexGrow: 0,
    marginBottom: 12,
  },
  categoryRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  categoryPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: Colors.textInverse,
  },
  gridContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  columnWrapper: {
    marginBottom: 12,
  },
  achievementCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  badgeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  achievementTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDesc: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
  },
  tierLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    textTransform: 'capitalize',
  },
});
