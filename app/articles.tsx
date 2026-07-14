import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { ARTICLES, ARTICLE_CATEGORIES, ArticleCategory } from '@/constants/articles';
import Colors from '@/constants/colors';
import { FREE_LIMITS } from '@/constants/free-limits';

const CATEGORY_KEYS: ArticleCategory[] = ['getting-started', 'science', 'conditions', 'techniques', 'wellness'];
const FEATURED_ARTICLE_ID = 'what-is-interoception';

export default function ArticlesScreen() {
  const insets = useSafeAreaInsets();
  const { bookmarks, toggleBookmark, articlesRead } = useApp();
  const { user } = useAuth();
  const topPadding = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);
  const isPremium = user?.isPremium ?? false;

  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  const featuredArticle = useMemo(
    () => (articlesRead.length < 3 ? ARTICLES.find(a => a.id === FEATURED_ARTICLE_ID) : null),
    [articlesRead.length]
  );

  const allFilteredArticles = useMemo(() => {
    let result = ARTICLES.filter(a => a.id !== FEATURED_ARTICLE_ID || articlesRead.length >= 3);
    if (selectedCategory !== 'all') {
      result = result.filter(a => a.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        a => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
      );
    }
    return result;
  }, [selectedCategory, search, articlesRead.length]);

  const freeArticleIds = useMemo(() => {
    return ARTICLES.slice(0, FREE_LIMITS.articles).map(a => a.id);
  }, []);

  const isNewArticle = (article: typeof ARTICLES[0]) => {
    if (!article.releaseDate) return false;
    const release = new Date(article.releaseDate).getTime();
    const now = Date.now();
    return now - release <= 30 * 24 * 60 * 60 * 1000;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={[styles.header, { paddingTop: topPadding + 16 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Learn</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSub}>Deepen your interoceptive knowledge</Text>
      </LinearGradient>

      {!isPremium && (
        <TouchableOpacity style={styles.premiumBanner} activeOpacity={0.8} onPress={() => router.push('/premium' as any)}>
          <Feather name="star" size={14} color={Colors.warning} />
          <Text style={styles.premiumBannerText}>
            {FREE_LIMITS.articles} free articles. Unlock all {ARTICLES.length} with Premium.
          </Text>
          <Feather name="chevron-right" size={14} color={Colors.warning} />
        </TouchableOpacity>
      )}

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search articles..."
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.pillsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsContent}
        >
          <TouchableOpacity
            style={[styles.pill, selectedCategory === 'all' && styles.pillActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.pillText, selectedCategory === 'all' && styles.pillTextActive]}>All</Text>
          </TouchableOpacity>
          {CATEGORY_KEYS.map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.pill, selectedCategory === key && styles.pillActive]}
              onPress={() => setSelectedCategory(key)}
            >
              <Text style={[styles.pillText, selectedCategory === key && styles.pillTextActive]}>
                {ARTICLE_CATEGORIES[key].label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {featuredArticle && !search && selectedCategory === 'all' && (
          <>
            <Text style={styles.sectionLabel}>START HERE</Text>
            <TouchableOpacity
              style={styles.featuredCard}
              activeOpacity={0.8}
              onPress={() => router.push(`/article/${featuredArticle.id}`)}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryLight]}
                style={styles.featuredGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.featuredIconRow}>
                  <View style={styles.featuredIconCircle}>
                    <Feather name={featuredArticle.iconName as any} size={22} color={Colors.primary} />
                  </View>
                  {articlesRead.includes(featuredArticle.id) && (
                    <View style={styles.readBadgeFeatured}>
                      <Feather name="check" size={11} color="#FFFFFF" />
                      <Text style={styles.readBadgeFeaturedText}>Read</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.featuredTitle}>{featuredArticle.title}</Text>
                <Text style={styles.featuredSubtitle}>{featuredArticle.subtitle}</Text>
                <View style={styles.featuredMeta}>
                  <Feather name="clock" size={13} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.featuredMetaText}>{featuredArticle.readTimeMinutes} min read</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.sectionLabel}>ALL ARTICLES</Text>
          </>
        )}

        {allFilteredArticles.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="search" size={36} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No articles found</Text>
          </View>
        ) : (
          allFilteredArticles.map((article, idx) => {
            const catMeta = ARTICLE_CATEGORIES[article.category];
            const isBookmarked = bookmarks.includes(article.id);
            const isRead = articlesRead.includes(article.id);
            const isLocked = !isPremium && !freeArticleIds.includes(article.id);
            const isNew = isNewArticle(article);

            if (isLocked) {
              return (
                <TouchableOpacity
                  key={article.id}
                  style={[styles.card, styles.cardLocked]}
                  activeOpacity={0.7}
                  onPress={() => router.push('/premium' as any)}
                >
                  <View style={[styles.cardIconCircle, { backgroundColor: Colors.backgroundSecondary }]}>
                    <Feather name="lock" size={20} color={Colors.textTertiary} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, { color: Colors.textTertiary }]} numberOfLines={1}>{article.title}</Text>
                    <Text style={[styles.cardSubtitle, { color: Colors.textTertiary }]} numberOfLines={1}>{article.subtitle}</Text>
                  </View>
                  <View style={styles.premiumBadge}>
                    <Feather name="star" size={12} color={Colors.warning} />
                    <Text style={styles.premiumBadgeText}>Premium</Text>
                  </View>
                </TouchableOpacity>
              );
            }

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
                    {isNew && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>New</Text>
                      </View>
                    )}
                    {isRead && (
                      <View style={styles.readBadge}>
                        <Feather name="check" size={10} color={Colors.success} />
                        <Text style={styles.readBadgeText}>Read</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => toggleBookmark(article.id)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Feather
                    name="bookmark"
                    size={22}
                    color={isBookmarked ? Colors.primary : Colors.textTertiary}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtnText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  headerSub: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: Colors.warning + '12',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  premiumBannerText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    color: Colors.warning,
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(107,91,149,0.08)' } as any,
      default: {
        shadowColor: Colors.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Nunito_500Medium',
    fontSize: 15,
    color: Colors.text,
    marginLeft: 10,
    marginRight: 8,
  },
  pillsWrapper: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  pillsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  featuredCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(107,91,149,0.18)' } as any,
      default: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 5,
      },
    }),
  },
  featuredGradient: {
    padding: 22,
  },
  featuredIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  featuredIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readBadgeFeatured: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readBadgeFeaturedText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  featuredTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  featuredSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 14,
    lineHeight: 20,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuredMetaText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
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
  cardLocked: {
    opacity: 0.7,
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
    flexWrap: 'wrap',
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
  readBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.success + '18',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  readBadgeText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    color: Colors.success,
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
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warning + '18',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  premiumBadgeText: {
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.warning,
  },
});
