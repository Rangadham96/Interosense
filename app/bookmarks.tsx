import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { ARTICLES, ARTICLE_CATEGORIES } from '@/constants/articles';
import Colors from '@/constants/colors';

export default function BookmarksScreen() {
  const insets = useSafeAreaInsets();
  const { bookmarks, toggleBookmark } = useApp();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const bookmarkedArticles = ARTICLES.filter(a => bookmarks.includes(a.id));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={[styles.header, { paddingTop: topPadding + 16 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bookmarks</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {bookmarkedArticles.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Feather name="bookmark" size={40} color={Colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No bookmarks yet</Text>
          <Text style={styles.emptySubtitle}>
            Save articles you want to read later by tapping the bookmark icon
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {bookmarkedArticles.map((article) => {
            const catMeta = ARTICLE_CATEGORIES[article.category];
            return (
              <TouchableOpacity
                key={article.id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => router.push(`/article/${article.id}`)}
              >
                <View style={styles.cardIconCircle}>
                  <Feather name={article.iconName as any} size={20} color={Colors.primary} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{article.title}</Text>
                  <Text style={styles.cardSubtitle} numberOfLines={1}>{article.subtitle}</Text>
                  <View style={styles.cardMeta}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{catMeta.label}</Text>
                    </View>
                    <Feather name="clock" size={12} color={Colors.textTertiary} />
                    <Text style={styles.readTime}>{article.readTimeMinutes} min</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => toggleBookmark(article.id)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Feather name="bookmark" size={22} color={Colors.primary} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
  cardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: `${Colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: Colors.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: `${Colors.primary}14`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 4,
  },
  categoryBadgeText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    color: Colors.primary,
  },
  readTime: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
    color: Colors.textTertiary,
  },
});
