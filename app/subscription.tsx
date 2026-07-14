import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { apiPostJson } from '@/lib/api';
import { format, parseISO } from 'date-fns';

interface SubscriptionData {
  id: string;
  status: string;
  plan: string;
  amount: string;
  currentStart: string | null;
  currentEnd: string | null;
  chargeAt: string | null;
  trialEndAt: string | null;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try { return format(parseISO(iso), 'd MMM yyyy'); } catch { return '—'; }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    active:        { label: 'Active',         bg: '#E8F5E9', color: '#2E7D32' },
    authenticated: { label: 'Trial Active',   bg: '#E3F2FD', color: '#1565C0' },
    created:       { label: 'Trial Active',   bg: '#E3F2FD', color: '#1565C0' },
    pending:       { label: 'Pending',        bg: '#FFF8E1', color: '#E65100' },
    halted:        { label: 'Payment Failed', bg: '#FFEBEE', color: '#C62828' },
    cancelled:     { label: 'Cancelled',      bg: '#F3E5F5', color: '#6A1B9A' },
    completed:     { label: 'Completed',      bg: '#E8F5E9', color: '#2E7D32' },
    expired:       { label: 'Expired',        bg: '#FAFAFA', color: '#616161' },
    unknown:       { label: 'Unknown',        bg: '#FAFAFA', color: '#616161' },
  };
  const badge = map[status] ?? map.unknown;
  return (
    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
      <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const qc = useQueryClient();
  const topPadding = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery<{ subscription: SubscriptionData | null }>({
    queryKey: ['/api/razorpay/subscription-status'],
  });

  const sub = data?.subscription;

  const cancelMutation = useMutation({
    mutationFn: () => apiPostJson<{ success: boolean; message: string }>('/api/razorpay/cancel', {}),
    onSuccess: (res) => {
      setCancelSuccess(true);
      setCancelError('');
      setConfirmCancel(false);
      qc.invalidateQueries({ queryKey: ['/api/razorpay/subscription-status'] });
      refreshUser();
    },
    onError: (err: any) => {
      setCancelError(err.message || 'Could not cancel subscription. Please try again.');
      setConfirmCancel(false);
    },
  });

  const isCancelled = sub?.status === 'cancelled' || sub?.status === 'completed' || sub?.status === 'expired';
  const isTrial = sub?.status === 'authenticated' || sub?.status === 'created';
  const canCancel = sub && !isCancelled && !cancelSuccess;

  const handleCancelConfirm = () => {
    setCancelError('');
    cancelMutation.mutate();
  };

  if (!user?.isPremium && !sub) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Subscription</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Feather name="star" size={48} color={Colors.border} />
          <Text style={styles.emptyTitle}>No Active Subscription</Text>
          <Text style={styles.emptySubtitle}>Start a 7-day free trial to unlock all premium features.</Text>
          <Pressable style={styles.upgradeButton} onPress={() => router.replace('/premium' as any)}>
            <LinearGradient colors={['#6B5B95', '#524578']} style={styles.upgradeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.upgradeText}>Start Free Trial</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
      >
        {/* Plan hero card */}
        <LinearGradient
          colors={['#6B5B95', '#524578', '#3D3260']}
          style={styles.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroTop}>
            <LinearGradient colors={['#F0C05A', '#E8A830']} style={styles.heroIcon}>
              <Feather name="star" size={22} color="#fff" />
            </LinearGradient>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>
                {isLoading ? 'Loading...' : `${sub?.plan ?? 'Premium'} Plan`}
              </Text>
              {!isLoading && sub && <StatusBadge status={sub.status} />}
            </View>
          </View>
          {!isLoading && sub && (
            <Text style={styles.heroAmount}>{sub.amount}</Text>
          )}
        </LinearGradient>

        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>Fetching subscription details…</Text>
          </View>
        )}

        {!isLoading && sub && (
          <>
            {/* Trial banner */}
            {isTrial && sub.trialEndAt && (
              <View style={styles.trialBanner}>
                <Feather name="clock" size={16} color="#1565C0" />
                <Text style={styles.trialText}>
                  Free trial active — your card will be charged on {formatDate(sub.trialEndAt)}
                </Text>
              </View>
            )}

            {/* Cancelled banner */}
            {(isCancelled || cancelSuccess) && (
              <View style={styles.cancelledBanner}>
                <Feather name="info" size={16} color="#6A1B9A" />
                <Text style={styles.cancelledText}>
                  {cancelSuccess
                    ? `Subscription cancelled. You keep access until ${formatDate(sub.currentEnd)}.`
                    : sub.currentEnd
                      ? `Subscription cancelled. Access ends ${formatDate(sub.currentEnd)}.`
                      : `This subscription is no longer active.`}
                </Text>
              </View>
            )}

            {/* Renew CTA — shown when cancelled or just cancelled */}
            {(isCancelled || cancelSuccess) && (
              <View style={styles.renewCard}>
                <View style={styles.renewTop}>
                  <LinearGradient colors={['#F0C05A', '#E8A830']} style={styles.renewIcon}>
                    <Feather name="star" size={18} color="#fff" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.renewTitle}>Want to stay Premium?</Text>
                    <Text style={styles.renewSubtitle}>
                      Start a new subscription anytime — your history and progress are saved.
                    </Text>
                  </View>
                </View>
                <Pressable style={styles.renewButton} onPress={() => router.push('/premium' as any)}>
                  <LinearGradient
                    colors={['#6B5B95', '#524578']}
                    style={styles.renewGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Feather name="star" size={16} color="#fff" />
                    <Text style={styles.renewButtonText}>Renew Premium</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}

            {/* Billing details */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Billing Details</Text>
              {sub.chargeAt && !isCancelled && (
                <InfoRow label="Next billing date" value={formatDate(sub.chargeAt)} />
              )}
              {sub.currentEnd && (
                <InfoRow
                  label={isCancelled || cancelSuccess ? 'Access until' : 'Current period ends'}
                  value={formatDate(sub.currentEnd)}
                />
              )}
              {sub.currentStart && (
                <InfoRow label="Current period started" value={formatDate(sub.currentStart)} />
              )}
              <InfoRow label="Amount" value={sub.amount} />
              <InfoRow label="Subscription ID" value={sub.id} />
            </View>

            {/* Cancel error */}
            {cancelError ? (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.errorText}>{cancelError}</Text>
              </View>
            ) : null}

            {/* Cancel / confirm */}
            {canCancel && (
              <View style={styles.cancelSection}>
                {confirmCancel ? (
                  <View style={styles.confirmCard}>
                    <Feather name="alert-triangle" size={22} color={Colors.error} />
                    <Text style={styles.confirmTitle}>Cancel subscription?</Text>
                    <Text style={styles.confirmBody}>
                      You will keep full access until {formatDate(sub.currentEnd)}. After that date your account will revert to the free plan. This action cannot be undone.
                    </Text>
                    <View style={styles.confirmButtons}>
                      <Pressable style={styles.keepButton} onPress={() => setConfirmCancel(false)}>
                        <Text style={styles.keepButtonText}>Keep Premium</Text>
                      </Pressable>
                      <Pressable
                        style={styles.confirmCancelButton}
                        onPress={handleCancelConfirm}
                        disabled={cancelMutation.isPending}
                      >
                        {cancelMutation.isPending
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={styles.confirmCancelText}>Yes, Cancel</Text>}
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <>
                    <Text style={styles.cancelHint}>
                      Cancelling keeps your access until the end of the current billing period.
                    </Text>
                    <Pressable style={styles.cancelButton} onPress={() => setConfirmCancel(true)}>
                      <Feather name="x-circle" size={16} color={Colors.error} />
                      <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
                    </Pressable>
                  </>
                )}
              </View>
            )}
          </>
        )}

        {/* Upgrade CTA for free users without subscription data */}
        {!isLoading && !sub && user?.isPremium && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Subscription</Text>
            <InfoRow label="Status" value="Premium (Lifetime)" />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: { fontFamily: 'Nunito_700Bold', fontSize: 20, color: Colors.text },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: { padding: 20, gap: 16 },

  heroCard: { borderRadius: 20, padding: 24 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  heroIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  heroText: { flex: 1, gap: 6 },
  heroTitle: { fontFamily: 'Nunito_700Bold', fontSize: 20, color: '#fff' },
  heroAmount: { fontFamily: 'Nunito_800ExtraBold', fontSize: 26, color: '#fff', marginTop: 4 },

  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontFamily: 'Nunito_700Bold', fontSize: 12 },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  loadingText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary },

  trialBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#E3F2FD', borderRadius: 12, padding: 14,
  },
  trialText: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: '#1565C0', flex: 1, lineHeight: 20 },

  cancelledBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#F3E5F5', borderRadius: 12, padding: 14,
  },
  cancelledText: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: '#6A1B9A', flex: 1, lineHeight: 20 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  cardTitle: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.text, marginBottom: 14 },

  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  infoLabel: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: Colors.textSecondary, flex: 1 },
  infoValue: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.text, flex: 1.5, textAlign: 'right' },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFEBEE', borderRadius: 12, padding: 14,
  },
  errorText: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: Colors.error, flex: 1 },

  cancelSection: { gap: 12 },
  cancelHint: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  cancelButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.error,
    backgroundColor: '#FFF5F5',
  },
  cancelButtonText: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: Colors.error },

  confirmCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: Colors.error + '40',
  },
  confirmTitle: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.text },
  confirmBody: {
    fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 21,
  },
  confirmButtons: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 4 },
  keepButton: {
    flex: 1, padding: 14, borderRadius: 14, backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  keepButtonText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#fff' },
  confirmCancelButton: {
    flex: 1, padding: 14, borderRadius: 14, backgroundColor: Colors.error,
    alignItems: 'center',
  },
  confirmCancelText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#fff' },

  renewCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: Colors.borderLight, gap: 16,
  },
  renewTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  renewIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  renewTitle: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.text, marginBottom: 4 },
  renewSubtitle: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  renewButton: { borderRadius: 14, overflow: 'hidden' },
  renewGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14 },
  renewButtonText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#fff' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontFamily: 'Nunito_700Bold', fontSize: 22, color: Colors.text },
  emptySubtitle: {
    fontFamily: 'Nunito_400Regular', fontSize: 15, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 22,
  },
  upgradeButton: { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  upgradeGradient: { padding: 16, alignItems: 'center' },
  upgradeText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#fff' },
});
