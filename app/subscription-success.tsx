import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { apiPostJson } from '@/lib/api';

export default function SubscriptionSuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { payment_id, subscription_id, signature } = useLocalSearchParams<{
    payment_id?: string;
    subscription_id?: string;
    signature?: string;
  }>();
  const { refreshUser } = useAuth();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 24);

  const [status, setStatus] = useState<'loading' | 'success' | 'pending'>('loading');

  useEffect(() => {
    async function confirmPayment() {
      try {
        if (payment_id && subscription_id && signature) {
          await apiPostJson('/api/razorpay/verify-payment', {
            razorpay_payment_id: payment_id,
            razorpay_subscription_id: subscription_id,
            razorpay_signature: signature,
          });
        }
        await refreshUser();
        setStatus('success');
      } catch {
        await refreshUser();
        setStatus('success');
      }
    }
    confirmPayment();
  }, [payment_id, subscription_id, signature]);

  if (status === 'loading') {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Activating your subscription...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <LinearGradient
        colors={['#6B5B95', '#524578', '#3D3260']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.content, { paddingBottom: bottomPadding + 24 }]}>
          <View style={styles.iconCircle}>
            <LinearGradient colors={['#F0C05A', '#E8A830']} style={styles.iconGradient}>
              <Feather name="star" size={40} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={styles.title}>Welcome to Premium!</Text>
          <Text style={styles.subtitle}>
            Your subscription is now active. You have full access to all Premium features, explore everything Interosense has to offer.
          </Text>

          <View style={styles.featuresList}>
            {[
              'All 25+ guided exercises unlocked',
              'Clinical assessments (GAD-7, PHQ-9, PCL-5)',
              'Full article library, 15 articles',
              'AI-powered daily insights',
              'Advanced progress analytics',
            ].map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <View style={styles.checkCircle}>
                  <Feather name="check" size={14} color="#fff" />
                </View>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <Pressable style={styles.button} onPress={() => router.replace('/(tabs)' as any)}>
            <Text style={styles.buttonText}>Start Exploring</Text>
            <Feather name="arrow-right" size={20} color={Colors.primary} />
          </Pressable>

          <Text style={styles.note}>
            Cancel anytime from your Profile settings.
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#6B5B95' },
  gradient: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 40,
  },
  loadingText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 20,
    textAlign: 'center',
  },
  iconCircle: { marginBottom: 28 },
  iconGradient: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 32,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 14,
  },
  subtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresList: { width: '100%', gap: 12, marginBottom: 36 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#fff', flex: 1 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: '100%',
    marginBottom: 16,
  },
  buttonText: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: Colors.primary },
  note: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
