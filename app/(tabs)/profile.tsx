import { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { CONDITIONS } from '@/constants/conditions';
import { format, differenceInCalendarDays } from 'date-fns';
import GetHelpLink from '@/components/GetHelpLink';

const FOUR_WEEK_PROGRAMME = [
  { week: 1, title: 'Foundation', description: 'Begin with heartbeat detection and diaphragmatic breathing to build your interoceptive baseline.' },
  { week: 2, title: 'Expansion', description: 'Introduce progressive body scanning and tension awareness to widen your body\'s vocabulary.' },
  { week: 3, title: 'Integration', description: 'Connect body signals to emotional states through the heartbeat-emotion link and gut awareness practices.' },
  { week: 4, title: 'Consolidation', description: 'Deepen your practice with advanced exercises and review your interoceptive growth through check-ins.' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const {
    profile,
    sessions,
    currentStreak,
    totalSessions,
    totalMinutes,
    averageAwareness,
    checkins,
  } = useApp();

  const { user, logout } = useAuth();
  const isPremium = user?.isPremium ?? false;

  const firstName = profile?.name ? profile.name.split(' ')[0] : 'there';
  const conditions = profile?.conditions || [];
  const goals = profile?.goals || [];

  const daysOnApp = useMemo(() => {
    if (!profile) return 0;
    const first = sessions.length > 0
      ? new Date(sessions.reduce((earliest, s) => s.completedAt < earliest ? s.completedAt : earliest, sessions[0].completedAt))
      : new Date();
    return Math.max(1, differenceInCalendarDays(new Date(), first) + 1);
  }, [sessions, profile]);

  const conditionDetails = useMemo(() => {
    return conditions.map(id => CONDITIONS.find(c => c.id === id)).filter(Boolean);
  }, [conditions]);

  const currentWeek = useMemo(() => {
    if (daysOnApp <= 7) return 1;
    if (daysOnApp <= 14) return 2;
    if (daysOnApp <= 21) return 3;
    return 4;
  }, [daysOnApp]);

  const handleSignOut = async () => {
    setShowSignOutModal(false);
    await logout();
  };

  const handleManageSubscription = () => {
    router.push('/subscription' as any);
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 80 }]}>

        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTop}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{(profile?.name || 'U')[0].toUpperCase()}</Text>
            </View>
            <View style={styles.heroTopRight}>
              <GetHelpLink color="rgba(255,255,255,0.85)" />
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => router.push('/edit-profile' as any)}
                activeOpacity={0.7}
              >
                <Feather name="edit-2" size={16} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.heroName}>{profile?.name || 'Your Profile'}</Text>
          <Text style={styles.heroDays}>Day {daysOnApp} of your journey</Text>

          <View style={styles.heroPills}>
            <View style={styles.heroPill}>
              <Feather name="zap" size={13} color="rgba(255,255,255,0.9)" />
              <Text style={styles.heroPillText}>{currentStreak}d streak</Text>
            </View>
            <View style={styles.heroPill}>
              <Feather name="activity" size={13} color="rgba(255,255,255,0.9)" />
              <Text style={styles.heroPillText}>{totalSessions} sessions</Text>
            </View>
            <View style={styles.heroPill}>
              <Feather name="eye" size={13} color="rgba(255,255,255,0.9)" />
              <Text style={styles.heroPillText}>{averageAwareness.toFixed(1)} aware</Text>
            </View>
            {isPremium && (
              <View style={[styles.heroPill, { backgroundColor: 'rgba(240,192,90,0.3)' }]}>
                <Feather name="star" size={13} color="#F0C05A" />
                <Text style={[styles.heroPillText, { color: '#F0C05A' }]}>Premium</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {!isPremium && (
          <TouchableOpacity
            style={styles.premiumUpsell}
            activeOpacity={0.85}
            onPress={() => router.push('/premium' as any)}
          >
            <LinearGradient
              colors={['#F0C05A', '#E8A830']}
              style={styles.premiumUpsellGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Feather name="star" size={18} color="#fff" />
              <View style={styles.premiumUpsellText}>
                <Text style={styles.premiumUpsellTitle}>
                  {user?.razorpaySubscriptionId ? 'Rejoin Premium' : 'Try Premium Free'}
                </Text>
                <Text style={styles.premiumUpsellSub}>
                  {user?.razorpaySubscriptionId
                    ? 'All exercises, assessments & more'
                    : '7-day trial · All exercises, assessments & more'}
                </Text>
              </View>
              <Feather name="arrow-right" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {conditionDetails.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Focus Areas</Text>
            <View style={styles.conditionsWrap}>
              {conditionDetails.map(cond => cond && (
                <TouchableOpacity
                  key={cond.id}
                  style={[styles.conditionPill, { backgroundColor: cond.color + '15', borderColor: cond.color + '40' }]}
                  onPress={() => router.push(`/condition/${cond.id}` as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.conditionDot, { backgroundColor: cond.color }]} />
                  <Text style={[styles.conditionText, { color: cond.color }]}>{cond.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {goals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Goals</Text>
            <View style={styles.card}>
              {goals.map((goal, i) => (
                <View key={goal} style={[styles.goalRow, i < goals.length - 1 && styles.goalRowBorder]}>
                  <Feather name="check-circle" size={16} color={Colors.success} />
                  <Text style={styles.goalText}>{goal}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4-Week Programme</Text>
          <View style={styles.card}>
            {FOUR_WEEK_PROGRAMME.map(week => {
              const isActive = week.week === Math.min(currentWeek, 4);
              const isCompleted = week.week < currentWeek;
              return (
                <View key={week.week} style={[styles.weekRow, week.week < 4 && styles.weekRowBorder]}>
                  <View style={[styles.weekBadge, isActive && styles.weekBadgeActive, isCompleted && styles.weekBadgeCompleted]}>
                    {isCompleted ? (
                      <Feather name="check" size={14} color="#FFFFFF" />
                    ) : (
                      <Text style={[styles.weekBadgeText, isActive && styles.weekBadgeTextActive]}>{week.week}</Text>
                    )}
                  </View>
                  <View style={styles.weekContent}>
                    <Text style={[styles.weekTitle, isActive && styles.weekTitleActive]}>{`Week ${week.week}: ${week.title}`}</Text>
                    <Text style={styles.weekDescription}>{week.description}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          <View style={styles.card}>
            <ProfileInfoRow label="Name" value={profile?.name || ''} />
            <ProfileInfoRow label="Experience" value={profile?.experienceLevel ? profile.experienceLevel.charAt(0).toUpperCase() + profile.experienceLevel.slice(1) : ''} />
            <ProfileInfoRow label="Member Since" value={sessions.length > 0 ? format(new Date(sessions.reduce((earliest, s) => s.completedAt < earliest ? s.completedAt : earliest, sessions[0].completedAt)), 'MMMM yyyy') : 'Today'} />
            <ProfileInfoRow label="Total Practice Time" value={`${totalMinutes} min`} />
            <ProfileInfoRow label="Subscription" value={isPremium ? 'Premium' : 'Free'} last />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <View style={styles.card}>
            {isPremium ? (
              <>
                <MenuRow
                  icon="star"
                  iconColor={Colors.warning}
                  label="Manage Subscription"
                  onPress={handleManageSubscription}
                />
                <View style={styles.menuDivider} />
              </>
            ) : (
              <>
                <MenuRow
                  icon="star"
                  iconColor={Colors.warning}
                  label="Upgrade to Premium"
                  onPress={() => router.push('/premium' as any)}
                />
                <View style={styles.menuDivider} />
              </>
            )}
            <MenuRow
              icon="sliders"
              iconColor={Colors.primary}
              label="App Settings"
              onPress={() => router.push('/settings' as any)}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="book-open"
              iconColor={Colors.warning}
              label="Learn"
              onPress={() => router.push('/articles' as any)}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="target"
              iconColor={Colors.success}
              label="My Goals"
              onPress={() => router.push('/goals' as any)}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="map"
              iconColor={Colors.secondary}
              label="Body Map History"
              onPress={() => router.push('/bodymap' as any)}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="award"
              iconColor={Colors.warning}
              label="Achievements"
              onPress={() => router.push('/achievements' as any)}
            />
            <View style={styles.menuDivider} />
            <View style={styles.menuRowDisabled}>
              <View style={[styles.menuIconWrap, { backgroundColor: Colors.backgroundSecondary }]}>
                <Feather name="watch" size={18} color={Colors.textTertiary} />
              </View>
              <Text style={styles.menuLabelDisabled}>Wearable Integration</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.card}>
            <MenuRow
              icon="help-circle"
              iconColor={Colors.textSecondary}
              label="Help & Support"
              onPress={() => {}}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="shield"
              iconColor={Colors.textSecondary}
              label="Privacy Policy"
              onPress={() => router.push('/privacy-policy' as any)}
            />
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => setShowSignOutModal(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: '#FFF0F0' }]}>
                <Feather name="log-out" size={18} color={Colors.error} />
              </View>
              <Text style={[styles.menuLabel, { color: Colors.error }]}>Sign Out</Text>
              <Feather name="chevron-right" size={18} color={Colors.error + '80'} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.versionText}>Interosense · v1.0</Text>
      </ScrollView>

      <Modal
        visible={showSignOutModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSignOutModal(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHandle} />
            <Text style={styles.bottomSheetTitle}>Sign Out?</Text>
            <Text style={styles.bottomSheetBody}>
              Your data is safely stored in the cloud. You can sign back in at any time and everything will be right where you left it.
            </Text>
            <TouchableOpacity
              style={styles.signOutConfirmButton}
              onPress={handleSignOut}
              activeOpacity={0.85}
            >
              <Text style={styles.signOutConfirmText}>Yes, Sign Out</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowSignOutModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function ProfileInfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function MenuRow({
  icon,
  iconColor,
  label,
  onPress,
}: {
  icon: string;
  iconColor: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconWrap, { backgroundColor: iconColor + '15' }]}>
        <Feather name={icon as any} size={18} color={iconColor} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 20 },

  heroCard: { borderRadius: 24, padding: 24, marginBottom: 16, marginTop: 8 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  heroTopRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontFamily: 'Nunito_700Bold', fontSize: 28, color: '#FFFFFF' },
  editButton: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroName: { fontFamily: 'Nunito_800ExtraBold', fontSize: 24, color: '#FFFFFF', marginBottom: 4 },
  heroDays: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 18 },
  heroPills: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  heroPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
  },
  heroPillText: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: '#FFFFFF' },

  premiumUpsell: { borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  premiumUpsellGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  premiumUpsellText: { flex: 1 },
  premiumUpsellTitle: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#fff' },
  premiumUpsellSub: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: Colors.text, marginBottom: 12 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden' },
  conditionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  conditionPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  conditionDot: { width: 8, height: 8, borderRadius: 4 },
  conditionText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13 },

  goalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14 },
  goalRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  goalText: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: Colors.text, flex: 1, lineHeight: 20 },

  weekRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16 },
  weekRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  weekBadge: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  weekBadgeActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  weekBadgeCompleted: { borderColor: Colors.success, backgroundColor: Colors.success },
  weekBadgeText: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.textTertiary },
  weekBadgeTextActive: { color: Colors.primary },
  weekContent: { flex: 1 },
  weekTitle: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.textSecondary, marginBottom: 4 },
  weekTitleActive: { color: Colors.text },
  weekDescription: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textTertiary, lineHeight: 19 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  infoLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.textSecondary },
  infoValue: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: Colors.text },

  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  menuRowDisabled: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  menuIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuLabel: { flex: 1, fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: Colors.text },
  menuLabelDisabled: { flex: 1, fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: Colors.textTertiary },
  menuDivider: { height: 1, backgroundColor: Colors.borderLight, marginLeft: 64 },
  comingSoonBadge: { backgroundColor: Colors.backgroundSecondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  comingSoonText: { fontFamily: 'Nunito_500Medium', fontSize: 11, color: Colors.textTertiary },

  versionText: {
    fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textTertiary, textAlign: 'center', marginVertical: 16,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40,
  },
  bottomSheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 20,
  },
  bottomSheetTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 22, color: Colors.text, marginBottom: 12, textAlign: 'center' },
  bottomSheetBody: {
    fontFamily: 'Nunito_400Regular', fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 23, marginBottom: 28,
  },
  signOutConfirmButton: {
    backgroundColor: Colors.error, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 12,
  },
  signOutConfirmText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#FFFFFF' },
  cancelButton: {
    backgroundColor: Colors.backgroundSecondary, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  cancelButtonText: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: Colors.textSecondary },
});
