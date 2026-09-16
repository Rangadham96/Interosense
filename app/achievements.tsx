import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Platform,
  ScrollView,
  TouchableOpacity,
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

const BADGE_MEANINGS: Record<string, string> = {
  'first-session': 'You took the first step. That is always the hardest one.',
  'five-sessions': 'Five sessions in. Your body is beginning to listen.',
  'ten-sessions': 'Ten practices completed. You are building something real.',
  'twenty-five-sessions': 'Twenty-five sessions. This is no longer a habit. It is part of who you are.',
  'fifty-sessions': 'Fifty sessions. You have dedicated genuine time to knowing yourself.',
  'hundred-sessions': 'A hundred practices. Extraordinary commitment to your own awareness.',
  'streak-3': 'Three days in a row. Consistency is where change really begins.',
  'streak-7': 'A full week of practice. Your nervous system is responding.',
  'streak-14': 'Two weeks of daily practice. Notice which skills and exercises feel more familiar.',
  'streak-30': 'Thirty consecutive days. This level of dedication is rare and meaningful.',
  'streak-60': 'Sixty days unbroken. You have transformed practice into identity.',
  'explore-2': 'You stepped beyond the familiar. Curiosity is the root of awareness.',
  'explore-4': 'Four categories explored. Your body literacy is widening.',
  'explore-6': 'You have touched every corner of interoceptive practice.',
  'checkin-5': 'Five check-ins completed. You are learning to listen inward.',
  'checkin-15': 'Fifteen check-ins. Your body data is telling a story.',
  'checkin-30': 'Thirty check-ins. You know your body better than most people ever will.',
  'minutes-30': 'Thirty minutes of practice. Time you gave entirely to yourself.',
  'minutes-120': 'Two hours of body awareness. A meaningful investment in your health.',
  'minutes-300': 'Five hours of practice. The science shows change at this level.',
  'minutes-600': 'Ten hours. You are in rare territory. This is genuine mastery.',
  'awareness-5': 'You reached the mid-point of interoceptive awareness. Keep going.',
  'awareness-7': 'A high awareness score. Your body signals are getting clearer.',
  'awareness-9': 'Near-peak awareness. You are in the top tier of practitioners.',
  'read-3': 'Three articles read. Understanding deepens every practice.',
  'read-8': 'Eight articles. You are building the science behind the feeling.',
  'read-15': 'Every article read. Your knowledge is as strong as your practice.',
  'first-bodymap': 'You mapped your body\'s experience. That takes real courage to look.',
  'night-owl': 'Late-night practice shows true dedication to the work.',
  'early-bird': 'Rising to practice before the day begins. That is commitment.',
};

const REQUIREMENT_TEXT: Record<string, (v: number) => string> = {
  sessions: (v) => `Complete ${v} exercise${v !== 1 ? 's' : ''}`,
  streak: (v) => `Practice ${v} days in a row`,
  categories: (v) => `Try exercises from ${v} categories`,
  checkins: (v) => `Complete ${v} check-ins`,
  minutes: (v) => v >= 60 ? `Practice for ${v / 60 % 1 === 0 ? v / 60 : (v / 60).toFixed(1)} hours total` : `Practice for ${v} minutes total`,
  awareness: (v) => `Reach awareness score of ${v}`,
  articles: (v) => `Read ${v} article${v !== 1 ? 's' : ''}`,
  exercises: (v) => `Complete ${v} exercises`,
};

export default function AchievementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unlockedAchievements } = useApp();
  const topInset = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);
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

  const renderAchievement = ({ item }: { item: Achievement }) => {
    const unlocked = isUnlocked(item.id);
    const tierColor = TIER_COLORS[item.tier];
    const meaning = BADGE_MEANINGS[item.id];
    const reqText = REQUIREMENT_TEXT[item.requirement.type]?.(item.requirement.value) || item.description;

    return (
      <View style={[
        styles.achievementCard,
        unlocked ? styles.achievementCardUnlocked : styles.achievementCardLocked,
      ]}>
        <View style={[
          styles.badgeCircle,
          unlocked
            ? { backgroundColor: tierColor }
            : { backgroundColor: Colors.backgroundSecondary },
        ]}>
          {unlocked ? (
            <Feather
              name={item.iconName as keyof typeof Feather.glyphMap}
              size={24}
              color="#FFFFFF"
            />
          ) : (
            <Feather name="lock" size={22} color={Colors.textTertiary} />
          )}
        </View>

        {unlocked && (
          <View style={styles.checkBadge}>
            <Feather name="check" size={10} color="#FFFFFF" />
          </View>
        )}

        <Text style={[styles.achievementTitle, !unlocked && styles.lockedText]} numberOfLines={2}>
          {item.title}
        </Text>

        {unlocked && meaning ? (
          <Text style={styles.meaningText} numberOfLines={3}>{meaning}</Text>
        ) : (
          <Text style={styles.requirementText} numberOfLines={2}>{reqText}</Text>
        )}

        <View style={[styles.tierPill, { backgroundColor: unlocked ? tierColor + '20' : Colors.backgroundSecondary }]}>
          <Text style={[styles.tierLabel, { color: unlocked ? tierColor : Colors.textTertiary }]}>
            {item.tier.charAt(0).toUpperCase() + item.tier.slice(1)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Feather name="arrow-left" size={20} color={Colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>

      <FlatList
        data={filteredAchievements}
        keyExtractor={(item) => item.id}
        renderItem={renderAchievement}
        numColumns={2}
        style={styles.list}
        contentContainerStyle={[styles.gridContent, { paddingBottom: bottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={
          <View style={styles.listHeader} testID="achievements-header">
            <View style={styles.titleSection}>
              <Text style={styles.pageTitle}>Milestones</Text>
              <Text style={styles.pageSubtitle}>Every milestone reflects a real skill you have built</Text>
            </View>

            <View style={styles.statsBar} testID="achievements-progress">
              <View style={styles.statsTextRow}>
                <Text style={styles.statsLabel}>{totalUnlocked} of {totalAchievements} earned</Text>
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
          </View>
        }
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.primary,
  },
  list: {
    flex: 1,
  },
  listHeader: {
    // The grid content already applies horizontal padding.
  },
  titleSection: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  pageTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  statsBar: {
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
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statsPercent: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 24,
    color: Colors.primary,
    letterSpacing: -0.5,
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
    gap: 12,
  },
  achievementCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  achievementCardUnlocked: {
    borderColor: Colors.primary + '30',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  achievementCardLocked: {
    borderColor: Colors.borderLight,
    opacity: 0.55,
  },
  badgeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  checkBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 18,
  },
  lockedText: {
    color: Colors.textSecondary,
  },
  meaningText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 15,
    marginBottom: 8,
    flex: 1,
  },
  requirementText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 15,
    marginBottom: 8,
    flex: 1,
  },
  tierPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  tierLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 10,
    textTransform: 'capitalize',
  },
});
