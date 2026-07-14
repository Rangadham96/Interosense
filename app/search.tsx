import { useState, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';
import Colors from '@/constants/colors';
import { EXERCISES, CATEGORY_INFO, Exercise } from '@/constants/exercises';
import { ARTICLES, ARTICLE_CATEGORIES, Article } from '@/constants/articles';
import { CONDITIONS, Condition } from '@/constants/conditions';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  beginner: { bg: '#E8F5E1', text: '#4A8C3F' },
  intermediate: { bg: '#FFF3D6', text: '#B8860B' },
  advanced: { bg: '#EDE7F6', text: '#6B5B95' },
};

const POPULAR_EXERCISE_IDS = [
  'heartbeat-detection',
  'box-breathing',
  'progressive-body-scan',
  'tension-release',
];

type SearchResultItem =
  | { type: 'sectionHeader'; title: string; count: number; key: string }
  | { type: 'exercise'; data: Exercise; key: string }
  | { type: 'article'; data: Article; key: string }
  | { type: 'condition'; data: Condition; key: string }
  | { type: 'popularHeader'; key: string }
  | { type: 'popularExercise'; data: Exercise; key: string };

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);
  const [searchText, setSearchText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const query = searchText.toLowerCase().trim();

  const filteredExercises = useMemo(() => {
    if (!query) return [];
    return EXERCISES.filter(
      (e) =>
        e.title.toLowerCase().includes(query) ||
        e.subtitle.toLowerCase().includes(query) ||
        e.category.toLowerCase().includes(query)
    );
  }, [query]);

  const filteredArticles = useMemo(() => {
    if (!query) return [];
    return ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.subtitle.toLowerCase().includes(query) ||
        a.category.toLowerCase().includes(query)
    );
  }, [query]);

  const filteredConditions = useMemo(() => {
    if (!query) return [];
    return CONDITIONS.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.subtitle.toLowerCase().includes(query)
    );
  }, [query]);

  const popularExercises = useMemo(() => {
    return POPULAR_EXERCISE_IDS
      .map((id) => EXERCISES.find((e) => e.id === id))
      .filter(Boolean) as Exercise[];
  }, []);

  const listData = useMemo((): SearchResultItem[] => {
    if (!query) {
      const items: SearchResultItem[] = [
        { type: 'popularHeader', key: 'popular-header' },
      ];
      popularExercises.forEach((e) => {
        items.push({ type: 'popularExercise', data: e, key: `pop-${e.id}` });
      });
      return items;
    }

    const items: SearchResultItem[] = [];

    if (filteredExercises.length > 0) {
      items.push({
        type: 'sectionHeader',
        title: 'Exercises',
        count: filteredExercises.length,
        key: 'section-exercises',
      });
      filteredExercises.forEach((e) => {
        items.push({ type: 'exercise', data: e, key: `ex-${e.id}` });
      });
    }

    if (filteredArticles.length > 0) {
      items.push({
        type: 'sectionHeader',
        title: 'Articles',
        count: filteredArticles.length,
        key: 'section-articles',
      });
      filteredArticles.forEach((a) => {
        items.push({ type: 'article', data: a, key: `ar-${a.id}` });
      });
    }

    if (filteredConditions.length > 0) {
      items.push({
        type: 'sectionHeader',
        title: 'Conditions',
        count: filteredConditions.length,
        key: 'section-conditions',
      });
      filteredConditions.forEach((c) => {
        items.push({ type: 'condition', data: c, key: `co-${c.id}` });
      });
    }

    return items;
  }, [query, filteredExercises, filteredArticles, filteredConditions, popularExercises]);

  const hasResults = query && (filteredExercises.length > 0 || filteredArticles.length > 0 || filteredConditions.length > 0);
  const showEmpty = query.length > 0 && !hasResults;

  const renderItem = ({ item }: { item: SearchResultItem }) => {
    switch (item.type) {
      case 'sectionHeader':
        return (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{item.title}</Text>
            <View style={styles.sectionCountBadge}>
              <Text style={styles.sectionCount}>{item.count}</Text>
            </View>
          </View>
        );

      case 'popularHeader':
        return (
          <View style={styles.popularHeader}>
            <Feather name="trending-up" size={18} color={Colors.primary} />
            <Text style={styles.popularTitle}>Popular Exercises</Text>
          </View>
        );

      case 'exercise':
      case 'popularExercise': {
        const exercise = item.data;
        const catColor = Colors.category[exercise.category];
        const diffStyle = DIFFICULTY_COLORS[exercise.difficulty];
        const catInfo = CATEGORY_INFO[exercise.category];
        return (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push(`/exercise/${exercise.id}`)}
          >
            <View style={[styles.accentBar, { backgroundColor: catColor }]} />
            <View style={styles.cardContent}>
              <View style={styles.cardTop}>
                <View style={[styles.iconCircle, { backgroundColor: catColor + '1A' }]}>
                  <Feather name={catInfo.icon as any} size={18} color={catColor} />
                </View>
                <View style={styles.cardTextWrap}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {exercise.title}
                  </Text>
                  <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {exercise.subtitle}
                  </Text>
                </View>
              </View>
              <View style={styles.cardBottom}>
                <View style={[styles.diffBadge, { backgroundColor: diffStyle.bg }]}>
                  <Text style={[styles.diffText, { color: diffStyle.text }]}>
                    {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Feather name="clock" size={12} color={Colors.textTertiary} />
                  <Text style={styles.metaText}>{exercise.durationMinutes} min</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );
      }

      case 'article': {
        const article = item.data;
        const catInfo = ARTICLE_CATEGORIES[article.category];
        const isNew = article.releaseDate
          ? Date.now() - new Date(article.releaseDate).getTime() <= 30 * 24 * 60 * 60 * 1000
          : false;
        return (
          <TouchableOpacity
            style={styles.articleCard}
            activeOpacity={0.7}
            onPress={() => router.push(`/article/${article.id}`)}
          >
            <View style={[styles.articleIcon, { backgroundColor: Colors.primary + '14' }]}>
              <Feather name={catInfo.icon as any} size={18} color={Colors.primary} />
            </View>
            <View style={styles.articleTextWrap}>
              <View style={styles.articleTitleRow}>
                <Text style={styles.articleTitle} numberOfLines={1}>
                  {article.title}
                </Text>
                {isNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>New</Text>
                  </View>
                )}
              </View>
              <Text style={styles.articleCategory}>{catInfo.label}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        );
      }

      case 'condition': {
        const condition = item.data;
        return (
          <TouchableOpacity
            style={styles.conditionCard}
            activeOpacity={0.7}
            onPress={() => router.push(`/condition/${condition.id}`)}
          >
            <View style={[styles.conditionIcon, { backgroundColor: condition.color + '1A' }]}>
              <Feather name={condition.iconName as any} size={18} color={condition.color} />
            </View>
            <View style={styles.conditionTextWrap}>
              <Text style={styles.conditionName} numberOfLines={1}>
                {condition.name}
              </Text>
              <Text style={styles.conditionSubtitle} numberOfLines={1}>
                {condition.subtitle}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        );
      }

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={20} color={Colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Feather name="search" size={17} color={Colors.textTertiary} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search exercises, articles, conditions..."
            placeholderTextColor={Colors.textTertiary}
            value={searchText}
            onChangeText={setSearchText}
            autoFocus
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchText('');
                inputRef.current?.focus();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.clearBtn}>
                <Feather name="x" size={14} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showEmpty ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Feather name="search" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Nothing found for "{searchText}"</Text>
          <Text style={styles.emptySubtitle}>
            Try searching 'breathing' or 'anxiety' to find exercises and articles
          </Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.primary,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: Colors.text,
    padding: 0,
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
  },
  sectionCountBadge: {
    backgroundColor: Colors.primary + '1A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionCount: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.primary,
  },
  popularHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    paddingBottom: 12,
  },
  popularTitle: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  accentBar: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: 13,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.text,
    marginBottom: 1,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textSecondary,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  diffBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  diffText: {
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textTertiary,
  },
  articleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  articleIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleTextWrap: {
    flex: 1,
  },
  articleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  articleTitle: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.text,
    flexShrink: 1,
  },
  articleCategory: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: Colors.textTertiary,
  },
  newBadge: {
    backgroundColor: Colors.primary + '18',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  newBadgeText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
    color: Colors.primary,
  },
  conditionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  conditionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionTextWrap: {
    flex: 1,
  },
  conditionName: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.text,
    marginBottom: 2,
  },
  conditionSubtitle: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
    gap: 10,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 48,
  },
});
