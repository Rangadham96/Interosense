import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { apiPostJson } from '@/lib/api';
import RazorpayCheckoutModal from '@/components/RazorpayCheckoutModal';

export { FREE_LIMITS } from '@/constants/free-limits';

const PLANS = [
  { id: 'monthly', name: 'Monthly', price: '₹399', period: '/month', savings: '', popular: false },
  { id: 'annual',  name: 'Annual',  price: '₹3,990', period: '/year', savings: '2 months free', popular: true },
];

const PREMIUM_FEATURES = [
  {
    icon: 'layers' as const,
    title: 'All 25+ Guided Exercises',
    description: 'Access every exercise across 8 categories',
  },
  {
    icon: 'bar-chart-2' as const,
    title: 'Advanced Analytics',
    description: 'Deep insights into your interoceptive journey',
  },
  {
    icon: 'cpu' as const,
    title: 'AI-Powered Personalization',
    description: 'Intelligent recommendations tailored to you',
  },
  {
    icon: 'file-text' as const,
    title: 'Clinical Assessments',
    description: 'GAD-7, PHQ-9, PCL-5 with professional scoring',
  },
  {
    icon: 'book-open' as const,
    title: 'Full Article Library',
    description: 'All 15 evidence-based educational articles',
  },
  {
    icon: 'heart' as const,
    title: 'Health Data Integration',
    description: 'Connect wearables for deeper body insights',
  },
  {
    icon: 'download' as const,
    title: 'Data Export',
    description: 'Export your progress data anytime',
  },
  {
    icon: 'shield' as const,
    title: 'Priority Support',
    description: 'Dedicated support for your wellness journey',
  },
];

interface CheckoutParams {
  subscription_id: string;
  key: string;
  prefill: { name: string; email: string; contact: string };
  plan: string;
  url: string;
}

async function openNativeRazorpay(
  params: CheckoutParams,
  planLabel: string
): Promise<{ razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }> {
  const RazorpayCheckout = require('react-native-razorpay').default;
  return RazorpayCheckout.open({
    key: params.key,
    subscription_id: params.subscription_id,
    name: 'Interosense',
    description: planLabel,
    currency: 'INR',
    prefill: params.prefill,
    theme: { color: '#6B5B95' },
    notes: { plan: params.plan },
  });
}

export default function PremiumScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const topPadding = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);

  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [loading, setLoading] = useState(false);
  const [subscribeError, setSubscribeError] = useState('');
  const [checkoutParams, setCheckoutParams] = useState<CheckoutParams | null>(null);
  const [checkoutVisible, setCheckoutVisible] = useState(false);

  if (user?.isPremium) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <LinearGradient
          colors={['#6B5B95', '#524578', '#3D3260']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Pressable style={styles.closeBtn} onPress={() => router.back()}>
            <Feather name="x" size={24} color="rgba(255,255,255,0.8)" />
          </Pressable>
          <View style={styles.crownContainer}>
            <LinearGradient colors={['#F0C05A', '#E8A830']} style={styles.crownCircle}>
              <Feather name="star" size={32} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.headerTitle}>You're Premium</Text>
          <Text style={styles.headerSubtitle}>Thank you for supporting Interosense</Text>
        </LinearGradient>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Feather name="check-circle" size={64} color={Colors.success} />
          <Text style={[styles.headerTitle, { color: Colors.text, marginTop: 20, marginBottom: 10 }]}>
            Active Subscription
          </Text>
          <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
            You have full access to all Premium features. Manage your subscription from your profile.
          </Text>
          <Pressable
            style={[styles.subscribeButton, { marginTop: 32, borderRadius: 16, overflow: 'hidden' }]}
            onPress={() => router.back()}
          >
            <LinearGradient colors={['#6B5B95', '#524578']} style={styles.subscribeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.subscribeText}>Back to App</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  const verifyAndActivate = async (paymentData: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  }) => {
    await apiPostJson('/api/razorpay/verify-payment', {
      razorpay_payment_id: paymentData.razorpay_payment_id,
      razorpay_subscription_id: paymentData.razorpay_subscription_id,
      razorpay_signature: paymentData.razorpay_signature,
    });
    await refreshUser();
    router.replace('/subscription-success' as any);
  };

  const handleSubscribe = async () => {
    setLoading(true);
    setSubscribeError('');
    try {
      const data = await apiPostJson<CheckoutParams>('/api/razorpay/create-subscription', {
        planId: selectedPlan,
      });

      if (!data.subscription_id || !data.key) {
        throw new Error('Invalid checkout response from server');
      }

      if (Platform.OS === 'web') {
        window.location.href = data.url;
        return;
      }

      const planLabel = selectedPlan === 'annual' ? 'Annual Plan | ₹3,990/yr' : 'Monthly Plan | ₹399/mo';

      try {
        const result = await openNativeRazorpay(data, planLabel);
        setLoading(true);
        try {
          await verifyAndActivate(result);
        } catch (verifyErr: any) {
          setSubscribeError('Payment received but verification failed. Please contact support@interosense.com.');
        }
      } catch (nativeErr: any) {
        const code: string = nativeErr?.code || '';
        if (
          code === 'PAYMENT_CANCELLED' ||
          nativeErr?.description === 'Cancelled by user'
        ) {
          // user cancelled, no action needed
        } else if (
          code === 'MODULE_NOT_FOUND' ||
          nativeErr?.message?.includes('NativeModule') ||
          nativeErr?.message?.includes('null is not an object')
        ) {
          // Native SDK not available (Expo Go), fall back to in-app WebView
          setCheckoutParams(data);
          setCheckoutVisible(true);
        } else {
          setSubscribeError(nativeErr?.description || nativeErr?.message || 'Payment could not be completed. Please try again.');
        }
      }
    } catch (error: any) {
      setSubscribeError(error.message || 'Unable to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewSuccess = async (paymentData: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  }) => {
    setCheckoutVisible(false);
    setLoading(true);
    try {
      await verifyAndActivate(paymentData);
    } catch (err: any) {
      Alert.alert(
        'Verification Failed',
        'Payment was received but we could not verify it. Please contact support.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewDismiss = () => {
    setCheckoutVisible(false);
  };

  const handleWebViewError = (description: string) => {
    setCheckoutVisible(false);
    setSubscribeError(description || 'Payment could not be completed. Please try again.');
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <LinearGradient
        colors={['#6B5B95', '#524578', '#3D3260']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Feather name="x" size={24} color="rgba(255,255,255,0.8)" />
        </Pressable>

        <View style={styles.crownContainer}>
          <LinearGradient
            colors={['#F0C05A', '#E8A830']}
            style={styles.crownCircle}
          >
            <Feather name="star" size={32} color="#fff" />
          </LinearGradient>
        </View>

        <Text style={styles.headerTitle}>Interosense Premium</Text>
        <Text style={styles.headerSubtitle}>
          Unlock the full power of interoceptive awareness
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.plansContainer}>
          {PLANS.map((plan) => (
            <Pressable
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Best Value</Text>
                </View>
              )}
              <View style={styles.radioOuter}>
                {selectedPlan === plan.id && <View style={styles.radioInner} />}
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
                {plan.savings ? (
                  <Text style={styles.planSavings}>{plan.savings}</Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>

        <Text style={styles.featuresTitle}>Everything in Premium</Text>

        <View style={styles.featuresList}>
          {PREMIUM_FEATURES.map((feature) => (
            <View key={feature.title} style={styles.featureRow}>
              <View style={styles.featureIconCircle}>
                <Feather name={feature.icon} size={18} color={Colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.guaranteeCard}>
          <Feather name="shield" size={20} color={Colors.success} />
          <View style={styles.guaranteeText}>
            <Text style={styles.guaranteeTitle}>Secure Payments via Razorpay</Text>
            <Text style={styles.guaranteeDesc}>
              UPI, cards, net banking. Cancel anytime, no questions asked.
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 16) }]}>
        {subscribeError ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={15} color="#C62828" />
            <Text style={styles.errorBannerText}>{subscribeError}</Text>
          </View>
        ) : null}
        <Pressable
          style={[styles.subscribeButton, loading && styles.subscribeButtonDisabled]}
          onPress={handleSubscribe}
          disabled={loading}
          testID="subscribe-button"
        >
          <LinearGradient
            colors={['#F0C05A', '#E8A830']}
            style={styles.subscribeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.subscribeText}>Subscribe Now</Text>
                <Feather name="arrow-right" size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </Pressable>
        <Text style={styles.termsText}>
          Secure payment via Razorpay · Cancel anytime · INR billing
        </Text>
      </View>

      {checkoutParams && Platform.OS !== 'web' ? (
        <RazorpayCheckoutModal
          visible={checkoutVisible}
          checkoutUrl={checkoutParams.url}
          onSuccess={handleWebViewSuccess}
          onDismiss={handleWebViewDismiss}
          onError={handleWebViewError}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGradient: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownContainer: { marginBottom: 16 },
  crownCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24 },
  plansContainer: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  planCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 12,
    backgroundColor: Colors.warning,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  popularText: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    color: '#fff',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  planInfo: { flex: 1 },
  planName: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: Colors.textSecondary },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  planPrice: { fontSize: 22, fontFamily: 'Nunito_800ExtraBold', color: Colors.text },
  planPeriod: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: Colors.textTertiary },
  planSavings: { fontSize: 12, fontFamily: 'Nunito_700Bold', color: Colors.success, marginTop: 2 },
  featuresTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
    marginBottom: 16,
  },
  featuresList: { gap: 16, marginBottom: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontFamily: 'Nunito_600SemiBold', color: Colors.text },
  featureDesc: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary, marginTop: 1 },
  guaranteeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.success + '10',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.success + '25',
  },
  guaranteeText: { flex: 1 },
  guaranteeTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: Colors.text },
  guaranteeDesc: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary, marginTop: 2 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 8 },
      web: { boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' },
    }),
  },
  subscribeButton: { borderRadius: 16, overflow: 'hidden' as const },
  subscribeButtonDisabled: { opacity: 0.7 },
  subscribeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  subscribeText: { fontSize: 17, fontFamily: 'Nunito_800ExtraBold', color: '#fff' },
  termsText: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 10,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Nunito_500Medium',
    color: '#C62828',
    lineHeight: 18,
  },
});
