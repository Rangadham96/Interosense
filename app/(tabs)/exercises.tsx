import { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';
import Colors from '@/constants/colors';
import { EXERCISES, CATEGORY_INFO, ExerciseCategory, Exercise } from '@/constants/exercises';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  beginner: { bg: '#E8F5E1', text: '#4A8C3F' },
  intermediate: { bg: '#FFF3D6', text: '#B8860B' },
  advanced: { bg: '#EDE7F6', text: '#6B5B95' },
};

const ALL_CATEGORIES: ExerciseCategory[] = [
  'heartbeat',
  'breathing',
  'bodyScanning',
  'tension',
  'temperature',
  'exposure',
  'gut',
  'movement',
];

export default function ExercisesScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'all'>('all');

  const filteredExercises = useMemo(() => {
    let results = EXERCISES;
    if (selectedCategory !== 'all') {
      results = results.filter((e) => e.category === selectedCategory);
    }
    if (searchText.trim()) {
      const query = searchText.toLowerCase().trim();
      results = results.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.subtitle.toLowerCase().includes(query)
      );
    }
    return results;
  }, [selectedCategory, searchText]);

  const renderExerciseCard = ({ item }: { item: Exercise }) => {
    const catColor = Colors.category[item.category];
    const diffStyle = DIFFICULTY_COLORS[item.difficulty];
    const catInfo = CATEGORY_INFO[item.category];

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push(`/exercise/${item.id}`)}
      >
        <View style={[styles.accentBar, { backgroundColor: catColor }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <View style={[styles.iconCircle, { backgroundColor: catColor + '1A' }]}>
              <Feather name={catInfo.icon as any} size={20} color={catColor} />
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {item.subtitle}
              </Text>
            </View>
          </View>
          <View style={styles.cardBottom}>
            <View style={[styles.diffBadge, { backgroundColor: diffStyle.bg }]}>
              <Text style={[styles.diffText, { color: diffStyle.text }]}>
                {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="clock" size={13} color={Colors.textTertiary} />
              <Text style={styles.metaText}>{item.durationMinutes} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="star" size={13} color={Colors.textTertiary} />
              <Text style={styles.metaText}>
                {item.benefits.length} benefit{item.benefits.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Exercises</Text>
        <Text style={styles.subtitle}>Build your interoceptive awareness</Text>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={Colors.textTertiary}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Feather name="x" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[
              styles.pill,
              selectedCategory === 'all' && {
                backgroundColor: Colors.primary,
              },
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Feather
              name="grid"
              size={14}
              color={selectedCategory === 'all' ? '#FFF' : Colors.textSecondary}
            />
            <Text
              style={[
                styles.pillText,
                selectedCategory === 'all' && styles.pillTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {ALL_CATEGORIES.map((cat) => {
            const info = CATEGORY_INFO[cat];
            const isActive = selectedCategory === cat;
            const catColor = Colors.category[cat];
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.pill,
                  isActive && { backgroundColor: catColor },
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Feather
                  name={info.icon as any}
                  size={14}
                  color={isActive ? '#FFF' : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.pillText,
                    isActive && styles.pillTextActive,
                  ]}
                >
                  {info.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.resultCount}>
        <Text style={styles.resultText}>
          {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {filteredExercises.length > 0 ? (
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExerciseCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={filteredExercises.length > 0}
        />
      ) : (
        <View style={styles.emptyState}>
          <Feather name="search" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No exercises found</Text>
          <Text style={styles.emptySubtitle}>
            Try adjusting your search or category filter
          </Text>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF2F7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: Colors.text,
    padding: 0,
  },
  filterSection: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  pillText: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: '#FFF',
  },
  resultCount: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  resultText: {
    fontSize: 13,
    fontFamily: 'Nunito_500Medium',
    color: Colors.textTertiary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  accentBar: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: 14,
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textSecondary,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  diffBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
    gap: 12,
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
    paddingHorizontal: 40,
  },
});
