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
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

const TRUST_ITEMS = [
  'Your data is encrypted and never sold',
  'Free forever, no credit card required',
  'Built with clinical research, not trends',
  'Cancel or delete your account any time',
];

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register, loginWithSocial, refreshUser } = useAuth();
  const topPadding = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);

  const [name, setName] = useState('');
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

  // ── Native Google (expo-auth-session) ──
  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CLIENT_ID || 'not-configured',
    iosClientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const auth = googleResponse.authentication;
      if (auth?.accessToken) {
        handleNativeGoogleToken(auth.accessToken, auth.idToken ?? undefined);
      }
    }
  }, [googleResponse]);

  const handleNativeGoogleToken = async (accessToken: string, idToken?: string) => {
    setLoading(true);
    setError('');
    const result = await loginWithSocial({ provider: 'google', accessToken, idToken });
    setLoading(false);
    if (!result.success) {
      setError(result.message || 'Google sign-in failed. Please try again.');
    }
  };

  // ── Web Google (Identity Services, no client secret needed) ──
  const gsiReady = React.useRef(false);

  const initGSI = React.useCallback(() => {
    if (typeof window === 'undefined' || !(window as any).google?.accounts?.id) return;
    if (gsiReady.current) return;
    gsiReady.current = true;
    (window as any).google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID!,
      auto_select: false,
      cancel_on_tap_outside: true,
      callback: async (resp: { credential: string }) => {
        setLoading(true);
        setError('');
        try {
          const res = await fetch('/api/auth/google/verify', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: resp.credential }),
          });
          const data = await res.json();
          if (res.ok) {
            await refreshUser();
            router.replace('/');
          } else {
            setError(data.message || 'Google sign-in failed.');
          }
        } catch {
          setError('Google sign-in failed. Please try again.');
        } finally {
          setLoading(false);
        }
      },
    });
    const container = document.getElementById('__gsi_register');
    if (container) {
      (window as any).google.accounts.id.renderButton(container, {
        type: 'icon', size: 'large', theme: 'outline',
      });
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || !GOOGLE_CLIENT_ID) return;
    if ((window as any).google?.accounts?.id) {
      initGSI();
    } else {
      const existing = document.getElementById('__gsi_script');
      if (!existing) {
        const s = document.createElement('script');
        s.id = '__gsi_script';
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        s.onload = initGSI;
        document.head.appendChild(s);
      } else {
        existing.addEventListener('load', initGSI);
      }
    }
  }, [initGSI]);

  const handleGoogleSignIn = async () => {
    setError('');
    if (Platform.OS === 'web') {
      const btn = document.querySelector('#__gsi_register [role="button"], #__gsi_register button') as HTMLElement | null;
      if (btn) { btn.click(); return; }
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.prompt();
      } else {
        setError('Google sign-in is loading. Please try again in a moment.');
      }
      return;
    }
    if (!GOOGLE_CLIENT_ID) {
      setError('Google sign-in is not available on this device.');
      return;
    }
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

  const handleRegister = async () => {
    setError('');
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all the fields to continue.');
      return;
    }
    if (password.length < 6) {
      setError('Your password needs to be at least 6 characters.');
      return;
    }

    setLoading(true);
    const result = await register(email.trim(), password, name.trim());
    setLoading(false);

    if (!result.success) {
      const msg = result.message || '';
      if (msg.toLowerCase().includes('exist') || msg.toLowerCase().includes('already')) {
        setError('Looks like you already have an account. Try signing in instead?');
      } else {
        setError("We couldn't create your account right now. Please try again in a moment.");
      }
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

          <View style={styles.socialCard}>
            <Text style={styles.socialCardTitle}>Quick sign-up</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={16} color="#C62828" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Hidden GSI button container — rendered off-screen, clicked programmatically on web */}
            {Platform.OS === 'web' && GOOGLE_CLIENT_ID ? (
              <View nativeID="__gsi_register" style={{ position: 'absolute', top: -1000, left: -1000, width: 50, height: 50 }} />
            ) : null}

            {(Platform.OS === 'web' || GOOGLE_CLIENT_ID) ? (
              <View style={styles.socialRow}>
                <Pressable
                  style={styles.socialButton}
                  onPress={handleGoogleSignIn}
                  disabled={loading}
                  testID="register-google"
                >
                  <GoogleIcon />
                  <Text style={styles.socialButtonText}>Continue with Google</Text>
                </Pressable>
              </View>
            ) : null}

            {appleAvailable && (
              <Pressable
                style={[styles.socialButton, styles.appleButton]}
                onPress={handleAppleSignIn}
                disabled={loading}
                testID="register-apple"
              >
                <AntDesign name="apple" size={18} color="#fff" />
                <Text style={[styles.socialButtonText, styles.appleButtonText]}>Continue with Apple</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or create with email</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.trustCard}>
            {TRUST_ITEMS.map((item, i) => (
              <View key={i} style={styles.trustItem}>
                <View style={styles.trustCheck}>
                  <Feather name="check" size={12} color="#fff" />
                </View>
                <Text style={styles.trustText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Create My Account</Text>

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Feather name="user" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor={Colors.textTertiary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  testID="register-name"
                />
              </View>
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
                  testID="register-email"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Feather name="lock" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor={Colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  testID="register-password"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn} testID="register-eye-toggle">
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={Colors.textTertiary} />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              testID="register-submit"
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.registerButtonText}>Just a moment...</Text>
                </>
              ) : (
                <Text style={styles.registerButtonText}>Create My Account</Text>
              )}
            </Pressable>
          </View>

          <Pressable style={styles.switchLink} onPress={() => router.replace('/auth/login')}>
            <Text style={styles.switchText}>
              Already have an account?{' '}<Text style={styles.switchBold}>Sign in</Text>
            </Text>
          </Pressable>

          <View style={{ height: Platform.OS === 'web' ? 34 : 40 }} />
        </ScrollView>
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
  content: { paddingHorizontal: 24, paddingTop: 16, flexGrow: 1 },
  logoSection: { alignItems: 'center', marginBottom: 20 },
  logoImage: { width: 88, height: 88, marginBottom: 12 },
  appName: { fontSize: 28, fontFamily: 'Nunito_800ExtraBold', color: Colors.text },
  tagline: { fontSize: 14, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary, marginTop: 4 },
  socialCard: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 20, marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 3 },
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
    }),
  },
  socialCardTitle: { fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: Colors.textSecondary, marginBottom: 14, textAlign: 'center' },
  socialRow: { marginBottom: 10 },
  socialButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.backgroundSecondary, borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  socialButtonText: { fontSize: 15, fontFamily: 'Nunito_600SemiBold', color: Colors.text },
  appleButton: { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  appleButtonText: { color: '#fff' },
  googleIcon: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0',
    alignItems: 'center', justifyContent: 'center',
  },
  googleIconText: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#4285F4' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 12, fontFamily: 'Nunito_500Medium', color: Colors.textTertiary },
  trustCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, gap: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
    }),
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trustCheck: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  trustText: { fontSize: 13, fontFamily: 'Nunito_500Medium', color: Colors.textSecondary, flex: 1 },
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
    backgroundColor: '#FFEBEE', borderRadius: 12, padding: 12, marginBottom: 14,
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
  eyeBtn: { padding: 14 },
  registerButton: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
  },
  registerButtonDisabled: { opacity: 0.7 },
  registerButtonText: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#fff' },
  switchLink: { alignItems: 'center', marginTop: 24, paddingBottom: 16 },
  switchText: { fontSize: 14, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary },
  switchBold: { fontFamily: 'Nunito_700Bold', color: Colors.primary },
});
