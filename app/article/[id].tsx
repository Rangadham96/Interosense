import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { getArticleById, ARTICLE_CATEGORIES, ArticleCategory } from '@/constants/articles';
import { EXERCISES } from '@/constants/exercises';
import { useApp } from '@/contexts/AppContext';
import { router as globalRouter } from 'expo-router';

const CATEGORY_EXERCISE_MAP: Partial<Record<ArticleCategory, string[]>> = {
  'getting-started': ['heartbeat-detection', 'quick-body-check'],
  'science': ['progressive-body-scan', 'heartbeat-detection'],
  'conditions': ['box-breathing', 'progressive-body-scan'],
  'techniques': ['box-breathing', 'diaphragmatic-breathing', 'quick-body-check'],
  'wellness': ['tension-release', 'shoulder-check'],
};

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bookmarks, toggleBookmark, markArticleRead } = useApp();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const scrollProgress = useSharedValue(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);

  const article = getArticleById(id);
  const isBookmarked = bookmarks.includes(id);

  useEffect(() => {
    if (id) {
      markArticleRead(id);
    }
  }, [id]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = e.nativeEvent.contentOffset.y;
    const maxScroll = contentHeight - scrollViewHeight;
    if (maxScroll > 0) {
      scrollProgress.value = Math.min(1, Math.max(0, scrollY / maxScroll));
    }
  };

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${scrollProgress.value * 100}%` as any,
  }));

  if (!article) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
            <Feather name="arrow-left" size={24} color={Colors.text} />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <Feather name="file-text" size={48} color={Colors.textTertiary} />
          <Text style={styles.notFoundText}>Article not found</Text>
        </View>
      </View>
    );
  }

  const categoryInfo = ARTICLE_CATEGORIES[article.category];
  const paragraphs = article.content.split('\n\n');

  const relatedExerciseIds = CATEGORY_EXERCISE_MAP[article.category] ?? [];
  const relatedExercises = relatedExerciseIds
    .map(eid => EXERCISES.find(e => e.id === eid))
    .filter(Boolean)
    .slice(0, 2) as typeof EXERCISES;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <Feather name="arrow-left" size={24} color={Colors.text} />
        </Pressable>
        <Pressable onPress={() => toggleBookmark(id)} style={styles.headerBtn} hitSlop={12}>
          <Feather
            name="bookmark"
            size={22}
            color={isBookmarked ? Colors.primary : Colors.textSecondary}
          />
          {isBookmarked && <View style={styles.bookmarkFill} />}
        </Pressable>
      </View>

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressBarStyle]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomInset + 40 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onLayout={e => setScrollViewHeight(e.nativeEvent.layout.height)}
        onContentSizeChange={(_, h) => setContentHeight(h)}
      >
        <View style={styles.categoryRow}>
          <View style={[styles.categoryBadge, { backgroundColor: Colors.primaryLight + '20' }]}>
            <Feather name={categoryInfo.icon as any} size={14} color={Colors.primary} />
            <Text style={styles.categoryLabel}>{categoryInfo.label}</Text>
          </View>
        </View>

        <Text style={styles.title}>{article.title}</Text>
        <Text style={styles.subtitle}>{article.subtitle}</Text>

        <View style={styles.metaRow}>
          <Feather name="clock" size={14} color={Colors.textTertiary} />
          <Text style={styles.metaText}>{article.readTimeMinutes} min read</Text>
          <View style={styles.metaDot} />
          <Feather name="book-open" size={14} color={Colors.textTertiary} />
          <Text style={styles.metaText}>{categoryInfo.label}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.contentContainer}>
          {paragraphs.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>

        {relatedExercises.length > 0 && (
          <View style={styles.relatedSection}>
            <View style={styles.relatedHeader}>
              <Feather name="play-circle" size={16} color={Colors.primary} />
              <Text style={styles.relatedTitle}>Try These Exercises</Text>
            </View>
            <Text style={styles.relatedDesc}>Put what you just learned into practice</Text>
            {relatedExercises.map(ex => (
              <Pressable
                key={ex.id}
                style={styles.exerciseCard}
                onPress={() => globalRouter.push(`/exercise/${ex.id}`)}
              >
                <View style={styles.exerciseIconWrap}>
                  <Feather name={ex.iconName as any} size={18} color={Colors.primary} />
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{ex.title}</Text>
                  <Text style={styles.exerciseMeta}>{ex.durationMinutes} min · {ex.difficulty}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
              </Pressable>
            ))}
          </View>
        )}
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
    paddingVertical: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bookmarkFill: {
    position: 'absolute',
    top: 12,
    left: 13,
    width: 14,
    height: 12,
    backgroundColor: Colors.primary + '30',
    borderRadius: 2,
  },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.border,
    width: '100%',
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  scroll: {
    flex: 1,
  },
  categoryRow: {
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  categoryLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: Colors.primary,
  },
  title: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 24,
    color: Colors.text,
    paddingHorizontal: 24,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    paddingHorizontal: 24,
    marginTop: 6,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 14,
    gap: 6,
  },
  metaText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    color: Colors.textTertiary,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.textTertiary,
    marginHorizontal: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 24,
  },
  contentContainer: {
    paddingHorizontal: 24,
  },
  paragraph: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    color: Colors.text,
    lineHeight: 26,
    marginBottom: 18,
  },
  relatedSection: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  relatedTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: Colors.text,
  },
  relatedDesc: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  exerciseIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  exerciseMeta: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  notFoundText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 16,
    color: Colors.textTertiary,
  },
});
