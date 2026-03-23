import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { apiRequest } from '@/lib/query-client';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await apiRequest('POST', '/api/auth/forgot-password', { email: email.trim() });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'We couldn\'t send the reset link right now. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <LinearGradient
          colors={[Colors.primary, '#7B6BA5', Colors.background]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        <View style={styles.content}>
          <View style={styles.logoSection}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.appName}>Interosense</Text>
            <Text style={styles.tagline}>Sense your inner world</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Forgot Password</Text>

            {!submitted ? (
              <>
                <Text style={styles.description}>
                  Enter your email and we'll send you a link to reset your password.
                </Text>

                {error ? (
                  <View style={styles.errorBox}>
                    <Feather name="alert-circle" size={16} color="#E53935" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.inputGroup}>
                  <View style={styles.inputWrapper}>
                    <Feather name="mail" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email address"
                      placeholderTextColor={Colors.textTertiary}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      testID="forgot-email"
                    />
                  </View>
                </View>

                <Pressable
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                  testID="forgot-submit"
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Send Reset Link</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <Feather name="check-circle" size={40} color="#4CAF50" />
                </View>
                <Text style={styles.successText}>
                  If an account exists for that email, a reset link is on its way.
                </Text>
                <Text style={styles.successSubtext}>
                  Check your inbox and follow the link to reset your password.
                </Text>
              </View>
            )}
          </View>

          <Pressable style={styles.backLink} onPress={() => router.replace('/auth/login')}>
            <Feather name="arrow-left" size={16} color={Colors.primary} />
            <Text style={styles.backLinkText}>Back to Sign In</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 350 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoImage: { width: 88, height: 88, marginBottom: 16 },
  appName: { fontSize: 32, fontFamily: 'Nunito_800ExtraBold', color: '#fff' },
  tagline: { fontSize: 15, fontFamily: 'Nunito_400Regular', color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  formCard: {
    backgroundColor: Colors.surface, borderRadius: 24, padding: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24 },
      android: { elevation: 8 },
      web: { boxShadow: '0 8px 32px rgba(0,0,0,0.1)' },
    }),
  },
  formTitle: { fontSize: 24, fontFamily: 'Nunito_700Bold', color: Colors.text, marginBottom: 12, textAlign: 'center' },
  description: { fontSize: 14, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFEBEE', borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { fontSize: 13, fontFamily: 'Nunito_500Medium', color: '#C62828', flex: 1 },
  inputGroup: { marginBottom: 14 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary, borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
  },
  inputIcon: { paddingLeft: 14 },
  input: {
    flex: 1, paddingVertical: 14, paddingHorizontal: 12,
    fontSize: 15, fontFamily: 'Nunito_500Medium', color: Colors.text,
  },
  submitButton: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#fff' },
  successContainer: { alignItems: 'center', paddingVertical: 8 },
  successIcon: { marginBottom: 16 },
  successText: { fontSize: 15, fontFamily: 'Nunito_600SemiBold', color: Colors.text, textAlign: 'center', marginBottom: 8, lineHeight: 22 },
  successSubtext: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 },
  backLinkText: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: Colors.primary },
});
