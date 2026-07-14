import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';
import { CATEGORY_INFO } from '@/constants/exercises';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { SessionRecord } from '@/lib/storage';

interface DateGroup {
  label: string;
  sessions: SessionRecord[];
}

function getDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

function getDateKey(dateStr: string): string {
  return format(parseISO(dateStr), 'yyyy-MM-dd');
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <Feather
          key={i}
          name="star"
          size={13}
          color={i <= rating ? Colors.warning : Colors.border}
          style={i <= rating ? { opacity: 1 } : { opacity: 0.5 }}
        />
      ))}
    </View>
  );
}

function SessionCard({ session }: { session: SessionRecord }) {
  const catInfo = CATEGORY_INFO[session.category as keyof typeof CATEGORY_INFO];
  const catColor = Colors.category[session.category] || Colors.primary;
  const catIcon = catInfo?.icon || 'circle';
  const timeStr = format(parseISO(session.completedAt), 'h:mm a');

  return (
    <View style={styles.sessionCard}>
      <View style={[styles.cardAccent, { backgroundColor: catColor }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View style={[styles.catIconCircle, { backgroundColor: catColor + '18' }]}>
            <Feather name={catIcon as keyof typeof Feather.glyphMap} size={18} color={catColor} />
          </View>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.cardTitle} numberOfLines={1}>{session.exerciseTitle}</Text>
            <Text style={styles.cardCategory}>{catInfo?.label || session.category}</Text>
          </View>
          <Text style={styles.cardTime}>{timeStr}</Text>
        </View>

        <View style={styles.cardDetailsRow}>
          <View style={styles.detailItem}>
            <Feather name="clock" size={13} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{session.durationMinutes} min</Text>
          </View>
          <StarRating rating={session.rating} />
        </View>

        {session.notes ? (
          <View style={styles.notesWrap}>
            <Text style={styles.notesText} numberOfLines={2}>{session.notes}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

type ListItem = { type: 'header'; label: string; key: string } | { type: 'session'; session: SessionRecord; key: string };

export default function SessionHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { sessions, totalSessions, totalMinutes } = useApp();
  const topPadding = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);

  const averageRating = useMemo(() => {
    if (sessions.length === 0) return 0;
    const sum = sessions.reduce((s, sess) => s + sess.rating, 0);
    return Math.round((sum / sessions.length) * 10) / 10;
  }, [sessions]);

  const listData = useMemo<ListItem[]>(() => {
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    const groups: DateGroup[] = [];
    const groupMap = new Map<string, DateGroup>();

    for (const s of sorted) {
      const key = getDateKey(s.completedAt);
      let group = groupMap.get(key);
      if (!group) {
        group = { label: getDateLabel(s.completedAt), sessions: [] };
        groupMap.set(key, group);
        groups.push(group);
      }
      group.sessions.push(s);
    }

    const items: ListItem[] = [];
    for (const g of groups) {
      items.push({ type: 'header', label: g.label, key: 'header-' + g.label });
      for (const s of g.sessions) {
        items.push({ type: 'session', session: s, key: s.id });
      }
    }
    return items;
  }, [sessions]);

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.dateHeader}>
          <Text style={styles.dateHeaderText}>{item.label}</Text>
        </View>
      );
    }
    return <SessionCard session={item.session} />;
  };

  const ListHeader = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalSessions}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalMinutes}</Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{averageRating > 0 ? averageRating.toFixed(1) : '--'}</Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Feather name="play-circle" size={36} color={Colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Your first exercise is waiting</Text>
      <Text style={styles.emptySubtitle}>
        It only takes 3 minutes. Every session is recorded here so you can watch your journey grow.
      </Text>
      <TouchableOpacity style={styles.emptyActionButton} onPress={() => router.push('/(tabs)/exercises')}>
        <Feather name="play" size={16} color={Colors.textInverse} />
        <Text style={styles.emptyActionText}>Start an Exercise</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.6}
        >
          <Feather name="arrow-left" size={20} color={Colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session History</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={item => item.key}
        ListHeaderComponent={sessions.length > 0 ? ListHeader : undefined}
        ListEmptyComponent={EmptyState}
        contentContainerStyle={[
          styles.listContent,
          sessions.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={listData.length > 0}
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
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Nunito_700Bold',
    fontSize: 19,
    color: Colors.text,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 8,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 22,
    color: Colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  listContent: {
    paddingBottom: 40,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  dateHeader: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 10,
  },
  dateHeaderText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  sessionCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardAccent: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 14,
    paddingLeft: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: Colors.text,
    marginBottom: 2,
  },
  cardCategory: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  cardTime: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
    color: Colors.textTertiary,
    marginLeft: 8,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  notesWrap: {
    marginTop: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  notesText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyActionText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: Colors.textInverse,
  },
});
