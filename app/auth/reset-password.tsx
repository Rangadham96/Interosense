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
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/colors';
import { apiRequest } from '@/lib/query-client';

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const topPadding = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordStrength = newPassword.length === 0 ? 0 : newPassword.length < 6 ? 1 : newPassword.length < 10 ? 2 : 3;
  const strengthColors = ['transparent', '#E53935', '#FF9800', '#4CAF50'];
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];

  const handleReset = async () => {
    setError('');

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

    setLoading(true);
    try {
      await apiRequest('POST', '/api/auth/reset-password', { token, newPassword });
      setSuccess(true);
      setTimeout(() => {
        router.replace({ pathname: '/auth/login', params: { banner: 'Your password has been updated. Please sign in.' } });
      }, 1500);
    } catch (err: any) {
      const msg = err?.message || 'We couldn\'t reset your password right now. Please try again in a moment.';
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('already been used')) {
        setExpired(true);
      } else {
        setError(msg);
      }
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

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
            <Text style={styles.formTitle}>New Password</Text>

            {expired ? (
              <View style={styles.expiredContainer}>
                <Feather name="alert-triangle" size={40} color="#FF9800" />
                <Text style={styles.expiredTitle}>Link Expired</Text>
                <Text style={styles.expiredText}>
                  This reset link has expired. Please request a new one.
                </Text>
                <Pressable style={styles.requestNewButton} onPress={() => router.replace('/auth/forgot-password')}>
                  <Text style={styles.requestNewButtonText}>Request New Link</Text>
                </Pressable>
              </View>
            ) : success ? (
              <View style={styles.successContainer}>
                <Feather name="check-circle" size={40} color="#4CAF50" />
                <Text style={styles.successText}>Password updated!</Text>
                <Text style={styles.successSubtext}>Redirecting you to sign in...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.description}>
                  Choose a new password for your account.
                </Text>

                {error ? (
                  <View style={styles.errorBox}>
                    <Feather name="alert-circle" size={16} color="#E53935" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.inputGroup}>
                  <View style={styles.inputWrapper}>
                    <Feather name="lock" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="New password (min 6 characters)"
                      placeholderTextColor={Colors.textTertiary}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showNewPassword}
                      testID="reset-new-password"
                    />
                    <Pressable onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeBtn}>
                      <Feather name={showNewPassword ? 'eye-off' : 'eye'} size={18} color={Colors.textTertiary} />
                    </Pressable>
                  </View>
                  {newPassword.length > 0 && (
                    <View style={styles.strengthRow}>
                      <View style={styles.strengthBar}>
                        <View style={[styles.strengthFill, { width: `${(passwordStrength / 3) * 100}%`, backgroundColor: strengthColors[passwordStrength] }]} />
                      </View>
                      <Text style={[styles.strengthLabel, { color: strengthColors[passwordStrength] }]}>{strengthLabels[passwordStrength]}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <View style={[styles.inputWrapper, confirmPassword.length > 0 && (passwordsMatch ? styles.inputWrapperMatch : styles.inputWrapperNoMatch)]}>
                    <Feather
                      name={confirmPassword.length > 0 ? (passwordsMatch ? 'check-circle' : 'x-circle') : 'check-circle'}
                      size={18}
                      color={confirmPassword.length > 0 ? (passwordsMatch ? '#4CAF50' : '#E53935') : Colors.textTertiary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm new password"
                      placeholderTextColor={Colors.textTertiary}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      testID="reset-confirm-password"
                    />
                    <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                      <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={18} color={Colors.textTertiary} />
                    </Pressable>
                  </View>
                  {confirmPassword.length > 0 && (
                    <Text style={[styles.matchLabel, { color: passwordsMatch ? '#4CAF50' : '#E53935' }]}>
                      {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                    </Text>
                  )}
                </View>

                <Pressable
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleReset}
                  disabled={loading}
                  testID="reset-submit"
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Update Password →</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>

          {!expired && !success && (
            <Pressable style={styles.backLink} onPress={() => router.replace('/auth/login')}>
              <Feather name="arrow-left" size={16} color={Colors.primary} />
              <Text style={styles.backLinkText}>Back to Sign In</Text>
            </Pressable>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 350 },
  content: { paddingHorizontal: 24, justifyContent: 'center', flexGrow: 1 },
  logoSection: { alignItems: 'center', marginBottom: 24, marginTop: 24 },
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
  inputWrapperMatch: { borderColor: '#4CAF50' },
  inputWrapperNoMatch: { borderColor: '#E53935' },
  inputIcon: { paddingLeft: 14 },
  input: {
    flex: 1, paddingVertical: 14, paddingHorizontal: 12,
    fontSize: 15, fontFamily: 'Nunito_500Medium', color: Colors.text,
  },
  eyeBtn: { padding: 14 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  strengthBar: { flex: 1, height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' as const },
  strengthFill: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontFamily: 'Nunito_600SemiBold' },
  matchLabel: { fontSize: 12, fontFamily: 'Nunito_500Medium', marginTop: 6, marginLeft: 4 },
  submitButton: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#fff' },
  expiredContainer: { alignItems: 'center', paddingVertical: 8, gap: 12 },
  expiredTitle: { fontSize: 20, fontFamily: 'Nunito_700Bold', color: Colors.text },
  expiredText: { fontSize: 14, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  requestNewButton: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24,
    alignItems: 'center', marginTop: 8,
  },
  requestNewButtonText: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: '#fff' },
  successContainer: { alignItems: 'center', paddingVertical: 8, gap: 12 },
  successText: { fontSize: 20, fontFamily: 'Nunito_700Bold', color: Colors.text },
  successSubtext: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 },
  backLinkText: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: Colors.primary },
});
