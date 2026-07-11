import React, { useState, useEffect } from 'react';
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
import { Feather, AntDesign } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { from, banner } = useLocalSearchParams<{ from?: string; banner?: string }>();
  const { login, loginWithSocial } = useAuth();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      import('expo-apple-authentication').then((mod) => {
        mod.isAvailableAsync().then(setAppleAvailable).catch(() => {});
      }).catch(() => {});
    }
  }, []);

  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const auth = googleResponse.authentication;
      if (auth?.accessToken) {
        handleGoogleToken(auth.accessToken, auth.idToken ?? undefined);
      }
    }
  }, [googleResponse]);

  const handleGoogleToken = async (accessToken: string, idToken?: string) => {
    setLoading(true);
    setError('');
    const result = await loginWithSocial({ provider: 'google', accessToken, idToken });
    setLoading(false);
    if (!result.success) {
      setError(result.message || 'Google sign-in failed. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google sign-in is not configured yet.');
      return;
    }
    setError('');
    await promptGoogleAsync();
  };

  const handleAppleSignIn = async () => {
    try {
      const AppleAuthentication = await import('expo-apple-authentication');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const fullName = credential.fullName
        ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(' ')
        : undefined;
      setLoading(true);
      setError('');
      const result = await loginWithSocial({
        provider: 'apple',
        idToken: credential.identityToken ?? undefined,
        email: credential.email ?? undefined,
        name: fullName,
      });
      setLoading(false);
      if (!result.success) {
        setError(result.message || 'Apple sign-in failed. Please try again.');
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        setError('Apple sign-in failed. Please try again.');
      }
    }
  };

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please fill in your email and password to continue.');
      return;
    }

    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);

    if (!result.success) {
      setError("That email or password doesn't match what we have. Try again?");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <LinearGradient
          colors={['#FAFAFE', '#F3F0FA', Colors.background]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.3, y: 1 }}
        />

        <View style={styles.content}>
          {from === 'logout' && (
            <View style={styles.logoutBanner}>
              <Feather name="check-circle" size={16} color="#2E7D32" />
              <Text style={styles.logoutBannerText}>You have been signed out. Your progress is safe.</Text>
            </View>
          )}

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
            <Text style={styles.formTitle}>Welcome back</Text>

            {banner ? (
              <View style={styles.successBox}>
                <Feather name="check-circle" size={16} color="#2E7D32" />
                <Text style={styles.successText}>{banner}</Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={16} color="#C62828" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.socialRow}>
              <Pressable
                style={styles.socialButton}
                onPress={handleGoogleSignIn}
                disabled={loading}
                testID="login-google"
              >
                <GoogleIcon />
                <Text style={styles.socialButtonText}>Google</Text>
              </Pressable>

              {appleAvailable && (
                <Pressable
                  style={[styles.socialButton, styles.appleButton]}
                  onPress={handleAppleSignIn}
                  disabled={loading}
                  testID="login-apple"
                >
                  <AntDesign name="apple" size={18} color="#fff" />
                  <Text style={[styles.socialButtonText, styles.appleButtonText]}>Apple</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign in with email</Text>
              <View style={styles.dividerLine} />
            </View>

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
                  testID="login-email"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Feather name="lock" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  testID="login-password"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn} testID="login-eye-toggle">
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={Colors.textTertiary} />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              testID="login-submit"
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.loginButtonText}>Just a moment...</Text>
                </>
              ) : (
                <Text style={styles.loginButtonText}>Continue</Text>
              )}
            </Pressable>

            <Pressable style={styles.forgotLink} onPress={() => router.push('/auth/forgot-password')} testID="forgot-link">
              <Text style={styles.forgotLinkText}>Forgot your password?</Text>
            </Pressable>
          </View>

          <Pressable style={styles.switchLink} onPress={() => router.replace('/auth/register')}>
            <Text style={styles.switchText}>
              New here?{' '}<Text style={styles.switchBold}>Create a free account</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function GoogleIcon() {
  return (
    <View style={styles.googleIcon}>
      <Text style={styles.googleIconText}>G</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  logoutBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E8F5E9', borderRadius: 12, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#A5D6A7',
  },
  logoutBannerText: { fontSize: 13, fontFamily: 'Nunito_500Medium', color: '#2E7D32', flex: 1 },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoImage: { width: 88, height: 88, marginBottom: 12 },
  appName: { fontSize: 28, fontFamily: 'Nunito_800ExtraBold', color: Colors.text },
  tagline: { fontSize: 14, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary, marginTop: 4 },
  formCard: {
    backgroundColor: Colors.surface, borderRadius: 24, padding: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24 },
      android: { elevation: 6 },
      web: { boxShadow: '0 8px 32px rgba(0,0,0,0.08)' },
    }),
  },
  formTitle: { fontSize: 22, fontFamily: 'Nunito_700Bold', color: Colors.text, marginBottom: 20, textAlign: 'center' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFEBEE', borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { fontSize: 13, fontFamily: 'Nunito_500Medium', color: '#C62828', flex: 1 },
  socialRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  socialButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.backgroundSecondary, borderRadius: 14, paddingVertical: 13,
    borderWidth: 1, borderColor: Colors.border,
  },
  socialButtonText: { fontSize: 15, fontFamily: 'Nunito_600SemiBold', color: Colors.text },
  appleButton: { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  appleButtonText: { color: '#fff' },
  googleIcon: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0',
    alignItems: 'center', justifyContent: 'center',
  },
  googleIconText: { fontSize: 13, fontFamily: 'Nunito_700Bold', color: '#4285F4' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 12, fontFamily: 'Nunito_500Medium', color: Colors.textTertiary },
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
  eyeBtn: { padding: 14 },
  loginButton: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
  },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonText: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#fff' },
  forgotLink: { alignItems: 'center', marginTop: 14 },
  forgotLinkText: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: Colors.primary },
  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E8F5E9', borderRadius: 12, padding: 12, marginBottom: 16,
  },
  successText: { fontSize: 13, fontFamily: 'Nunito_500Medium', color: '#2E7D32', flex: 1 },
  switchLink: { alignItems: 'center', marginTop: 24, paddingBottom: 32 },
  switchText: { fontSize: 14, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary },
  switchBold: { fontFamily: 'Nunito_700Bold', color: Colors.primary },
});
