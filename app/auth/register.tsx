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
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

const TRUST_ITEMS = [
  'Your data is encrypted and never sold',
  'Free forever — no credit card required',
  'Built with clinical research, not trends',
  'Cancel or delete your account any time',
];

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useAuth();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordsMatch = password === confirmPassword;
  const showMatchIndicator = confirmPassword.length >= 4;

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
    if (password !== confirmPassword) {
      setError("Your passwords don't match — please check and try again.");
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

            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={16} color="#C62828" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

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

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Feather name="lock" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor={Colors.textTertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  testID="register-confirm"
                />
                <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn} testID="register-confirm-eye-toggle">
                  <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={18} color={Colors.textTertiary} />
                </Pressable>
              </View>
              {showMatchIndicator && (
                <View style={styles.matchRow}>
                  <Feather
                    name={passwordsMatch ? 'check-circle' : 'x-circle'}
                    size={14}
                    color={passwordsMatch ? '#2E7D32' : '#C62828'}
                  />
                  <Text style={[styles.matchText, { color: passwordsMatch ? '#2E7D32' : '#C62828' }]}>
                    {passwordsMatch ? 'Passwords match' : "Passwords don't match"}
                  </Text>
                </View>
              )}
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
                <Text style={styles.registerButtonText}>Create My Account →</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },
  content: { paddingHorizontal: 24, paddingTop: 16, flexGrow: 1 },
  logoSection: { alignItems: 'center', marginBottom: 20 },
  logoImage: { width: 88, height: 88, marginBottom: 12 },
  appName: { fontSize: 28, fontFamily: 'Nunito_800ExtraBold', color: Colors.text },
  tagline: { fontSize: 14, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary, marginTop: 4 },
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
  eyeBtn: { padding: 14 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, paddingLeft: 4 },
  matchText: { fontSize: 12, fontFamily: 'Nunito_600SemiBold' },
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
