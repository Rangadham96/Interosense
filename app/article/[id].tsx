import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { getArticleById, ARTICLE_CATEGORIES } from '@/constants/articles';
import { useApp } from '@/contexts/AppContext';

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bookmarks, toggleBookmark, markArticleRead } = useApp();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const article = getArticleById(id);
  const isBookmarked = bookmarks.includes(id);

  useEffect(() => {
    if (id) {
      markArticleRead(id);
    }
  }, [id]);

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

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <Feather name="arrow-left" size={24} color={Colors.text} />
        </Pressable>
        <Pressable onPress={() => toggleBookmark(id)} style={styles.headerBtn} hitSlop={12}>
          <Feather
            name={isBookmarked ? 'bookmark' : 'bookmark'}
            size={22}
            color={isBookmarked ? Colors.primary : Colors.textSecondary}
          />
          {isBookmarked && <View style={styles.bookmarkFill} />}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomInset + 32 }}
        showsVerticalScrollIndicator={false}
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
        </View>

        <View style={styles.divider} />

        <View style={styles.contentContainer}>
          {paragraphs.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
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
