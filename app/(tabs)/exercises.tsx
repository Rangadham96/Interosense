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
  Modal,
} from 'react-native';
import Colors from '@/constants/colors';
import { EXERCISES, CATEGORY_INFO, ExerciseCategory, Exercise } from '@/constants/exercises';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import GetHelpLink from '@/components/GetHelpLink';
import { FREE_LIMITS } from '@/constants/free-limits';

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  beginner: { bg: '#E8F5E1', text: '#4A8C3F' },
  intermediate: { bg: '#FFF3D6', text: '#B8860B' },
  advanced: { bg: '#EDE7F6', text: '#6B5B95' },
};

const EVIDENCE_LABELS: Record<string, { label: string; color: string }> = {
  MABT: { label: 'Research-informed', color: '#4A8C3F' },
  breathwork: { label: 'Research-informed', color: '#4A8C3F' },
  mindfulness: { label: 'Research-informed', color: '#4A8C3F' },
  somatic: { label: 'Emerging Science', color: '#B8860B' },
  exposure: { label: 'Research-informed', color: '#4A8C3F' },
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
  'nervousSystem',
  'traumaInformed',
];

export default function ExercisesScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'all'>('all');
  const [tooltipExercise, setTooltipExercise] = useState<Exercise | null>(null);
  const { todayCheckedIn } = useApp();
  const { user } = useAuth();

  const isPremium = user?.isPremium ?? false;

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

  const renderExerciseCard = ({ item, index }: { item: Exercise; index: number }) => {
    const catColor = Colors.category[item.category];
    const diffStyle = DIFFICULTY_COLORS[item.difficulty];
    const catInfo = CATEGORY_INFO[item.category];
    const evidence = EVIDENCE_LABELS[item.methodology] || { label: 'Emerging Science', color: '#B8860B' };
    const hasContraindications = item.contraindications && item.contraindications.length > 0;

    const globalIndex = EXERCISES.indexOf(item);
    const isLocked = !isPremium && globalIndex >= FREE_LIMITS.exercises;

    if (isLocked) {
      return (
        <TouchableOpacity
          style={[styles.card, styles.cardLocked]}
          activeOpacity={0.7}
          onPress={() => router.push('/premium' as any)}
        >
            <View style={styles.cardContent}>
            <View style={styles.cardTop}>
              <View style={[styles.iconCircle, { backgroundColor: catColor + '0D' }]}>
                <Feather name="lock" size={20} color={Colors.textTertiary} />
              </View>
              <View style={styles.cardTextWrap}>
                <Text style={[styles.cardTitle, { color: Colors.textTertiary }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.cardSubtitle, { color: Colors.textTertiary }]} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>
              <View style={styles.premiumBadge}>
                <Feather name="star" size={12} color={Colors.warning} />
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push(`/exercise/${item.id}`)}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <View style={[styles.iconCircle, { backgroundColor: catColor + '22' }]}>
              <Feather name={catInfo.icon as any} size={22} color={catColor} />
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {item.subtitle}
              </Text>
            </View>
            <View style={styles.durationBubble}>
              {hasContraindications && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setTooltipExercise(item);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ marginBottom: 4 }}
                >
                  <Feather name="alert-triangle" size={14} color="#B8860B" />
                </TouchableOpacity>
              )}
              <Text style={styles.durationNum}>{item.durationMinutes}</Text>
              <Text style={styles.durationMin}>MIN</Text>
            </View>
          </View>
          <View style={styles.cardBottom}>
            <View style={[styles.diffBadge, { backgroundColor: diffStyle.bg }]}>
              <Text style={[styles.diffText, { color: diffStyle.text }]}>
                {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
              </Text>
            </View>
            <View style={[styles.evidencePill, { backgroundColor: evidence.color + '15' }]}>
              <View style={[styles.evidenceDot, { backgroundColor: evidence.color }]} />
              <Text style={[styles.evidenceText, { color: evidence.color }]}>{evidence.label}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.title}>Exercises</Text>
          <GetHelpLink />
        </View>
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

      {todayCheckedIn && (
        <View style={styles.checkinBanner}>
          <Feather name="check-circle" size={16} color={Colors.success} />
          <Text style={styles.checkinBannerText}>Based on your check-in, your exercises are personalised for today</Text>
        </View>
      )}

      {!isPremium && (
        <TouchableOpacity style={styles.premiumBanner} activeOpacity={0.8} onPress={() => router.push('/premium' as any)}>
          <Feather name="star" size={15} color={Colors.warning} />
          <Text style={styles.premiumBannerText}>
            {FREE_LIMITS.exercises} free exercises. Unlock all 37+ with Premium.
          </Text>
          <Feather name="chevron-right" size={15} color={Colors.warning} />
        </TouchableOpacity>
      )}

      {selectedCategory === 'traumaInformed' && (
        <View style={styles.clinicianNote}>
          <Feather name="info" size={12} color={Colors.textTertiary} />
          <Text style={styles.clinicianNoteText}>Best used alongside professional support for significant trauma histories.</Text>
        </View>
      )}

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

      {filteredExercises.length > 0 ? (
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => renderExerciseCard({ item, index })}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!filteredExercises.length}
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

      <Modal
        visible={!!tooltipExercise}
        transparent
        animationType="fade"
        onRequestClose={() => setTooltipExercise(null)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setTooltipExercise(null)}>
          <View style={styles.tooltipCard}>
            <View style={styles.tooltipHeader}>
              <Feather name="alert-triangle" size={18} color="#B8860B" />
              <Text style={styles.tooltipTitle}>Before you begin: please read</Text>
            </View>
            <Text style={styles.tooltipExerciseName}>{tooltipExercise?.title}</Text>
            {tooltipExercise?.contraindications.map((c, i) => (
              <View key={i} style={styles.tooltipRow}>
                <Feather name="alert-circle" size={14} color="#E07A5F" />
                <Text style={styles.tooltipText}>{c}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.tooltipClose} onPress={() => setTooltipExercise(null)}>
              <Text style={styles.tooltipCloseText}>Understood</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
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
  checkinBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 4,
    backgroundColor: Colors.success + '15',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  checkinBannerText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    color: Colors.success,
    flex: 1,
    lineHeight: 18,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 4,
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
    lineHeight: 18,
  },
  filterSection: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  pillText: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: '#FFF',
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
  cardLocked: {
    opacity: 0.75,
  },
  cardContent: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textSecondary,
  },
  durationBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
  },
  durationNum: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 20,
    color: Colors.text,
    lineHeight: 22,
  },
  durationMin: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 9,
    color: Colors.textTertiary,
    letterSpacing: 0.8,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
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
  evidencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  evidenceDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  evidenceText: {
    fontSize: 10,
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
  clinicianNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 4,
  },
  clinicianNoteText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    color: Colors.textTertiary,
    flex: 1,
    lineHeight: 17,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  tooltipCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  tooltipTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: '#B8860B',
  },
  tooltipExerciseName: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.text,
    marginBottom: 14,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  tooltipText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  tooltipClose: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tooltipCloseText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
