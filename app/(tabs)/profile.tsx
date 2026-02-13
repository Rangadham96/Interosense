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
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { format, parseISO } from 'date-fns';

interface MenuItem {
  icon: keyof typeof Feather.glyphMap;
  iconBg: string;
  title: string;
  onPress: () => void;
  badge?: number;
}

function MenuSection({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.menuCard}>
        {items.map((item, index) => (
          <React.Fragment key={item.title}>
            {index > 0 && <View style={styles.menuDivider} />}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={item.onPress}
              activeOpacity={0.6}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: item.iconBg }]}>
                <Feather name={item.icon} size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.menuLabel}>{item.title}</Text>
              <View style={styles.menuRight}>
                {item.badge !== undefined && item.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                <Feather name="chevron-right" size={20} color={Colors.textTertiary} />
              </View>
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    profile,
    totalSessions,
    currentStreak,
    unlockedAchievements,
  } = useApp();
  const { logout, user } = useAuth();

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const initial = profile?.name ? profile.name.charAt(0).toUpperCase() : '?';
  const memberSince = profile?.createdAt
    ? format(parseISO(profile.createdAt), 'MMM yyyy')
    : '';

  const levelLabels: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  };

  const activityItems: MenuItem[] = [
    { icon: 'clock', iconBg: Colors.secondary, title: 'Session History', onPress: () => router.push('/session-history'), badge: totalSessions },
    { icon: 'target', iconBg: Colors.primary, title: 'My Goals', onPress: () => router.push('/goals') },
    { icon: 'award', iconBg: Colors.warning, title: 'Achievements', onPress: () => router.push('/achievements'), badge: unlockedAchievements.length },
    { icon: 'map', iconBg: Colors.secondaryDark, title: 'Body Map', onPress: () => router.push('/bodymap') },
    { icon: 'heart', iconBg: Colors.error, title: 'Health Data', onPress: () => router.push('/wearable') },
  ];

  const learnItems: MenuItem[] = [
    { icon: 'book-open', iconBg: Colors.accent, title: 'Articles', onPress: () => router.push('/articles') },
    { icon: 'bookmark', iconBg: Colors.primaryLight, title: 'Bookmarks', onPress: () => router.push('/bookmarks') },
    { icon: 'search', iconBg: Colors.secondaryLight, title: 'Search', onPress: () => router.push('/search') },
  ];

  const personalItems: MenuItem[] = [
    { icon: 'user', iconBg: Colors.primary, title: 'Edit Profile', onPress: () => router.push('/edit-profile') },
    { icon: 'list', iconBg: Colors.accent, title: 'My Conditions', onPress: () => router.push('/edit-conditions') },
    { icon: 'sliders', iconBg: Colors.secondary, title: 'Preferences', onPress: () => router.push('/edit-preferences') },
  ];

  const appItems: MenuItem[] = [
    { icon: 'settings', iconBg: Colors.textSecondary, title: 'Settings', onPress: () => router.push('/settings') },
    { icon: 'info', iconBg: Colors.secondaryDark, title: 'About Interosense', onPress: () => router.push('/about') },
    { icon: 'log-out', iconBg: '#E53935', title: 'Sign Out', onPress: () => logout() },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={[styles.headerGradient, { paddingTop: topPadding + 24 }]}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.userName}>{profile?.name || user?.name || 'User'}</Text>
          {user?.email && (
            <Text style={styles.userEmail}>{user.email}</Text>
          )}
          {profile?.experienceLevel && (
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>
                {levelLabels[profile.experienceLevel] || profile.experienceLevel}
              </Text>
            </View>
          )}
          {memberSince ? (
            <Text style={styles.memberSince}>Member since {memberSince}</Text>
          ) : null}
          {profile?.dailyMinutes ? (
            <Text style={styles.dailyGoal}>{profile.dailyMinutes} minutes daily</Text>
          ) : null}
        </LinearGradient>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{unlockedAchievements.length}</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
        </View>

        <MenuSection title="Activity" items={activityItems} />
        <MenuSection title="Personal" items={personalItems} />
        <MenuSection title="Learn" items={learnItems} />
        <MenuSection title="App" items={appItems} />

        <TouchableOpacity
          style={styles.crisisCard}
          onPress={() => router.push('/crisis')}
          activeOpacity={0.7}
        >
          <View style={styles.crisisIconCircle}>
            <Feather name="phone" size={18} color={Colors.secondary} />
          </View>
          <View style={styles.crisisTextWrap}>
            <Text style={styles.crisisTitle}>Need immediate support?</Text>
            <Text style={styles.crisisSubtitle}>Access crisis resources</Text>
          </View>
          <Feather name="chevron-right" size={20} color={Colors.textTertiary} />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerGradient: {
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 32,
    color: '#FFFFFF',
  },
  userName: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  levelBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  levelBadgeText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  memberSince: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 2,
  },
  dailyGoal: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginTop: -20,
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
    color: Colors.text,
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
  menuSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.text,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 64,
  },
  badge: {
    backgroundColor: Colors.primary,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  crisisCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginTop: 28,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  crisisIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.secondary}18`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  crisisTextWrap: {
    flex: 1,
  },
  crisisTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: Colors.text,
    marginBottom: 2,
  },
  crisisSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
