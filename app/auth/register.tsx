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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await register(email.trim(), password, name.trim());
    setLoading(false);

    if (!result.success) {
      setError(result.message || 'Registration failed');
    }
  };

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ['transparent', '#E53935', '#FF9800', '#4CAF50'];
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <LinearGradient
          colors={[Colors.secondary, '#7AACAE', Colors.background]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.logoSection}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.appName}>Interosense</Text>
            <Text style={styles.tagline}>Begin your awareness journey</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Create Account</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={16} color="#E53935" />
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
                  placeholder="Password (min 6 characters)"
                  placeholderTextColor={Colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  testID="register-password"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={Colors.textTertiary} />
                </Pressable>
              </View>
              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  <View style={styles.strengthBar}>
                    <View style={[styles.strengthFill, { width: `${(passwordStrength / 3) * 100}%`, backgroundColor: strengthColors[passwordStrength] }]} />
                  </View>
                  <Text style={[styles.strengthLabel, { color: strengthColors[passwordStrength] }]}>{strengthLabels[passwordStrength]}</Text>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Feather name="check-circle" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  placeholderTextColor={Colors.textTertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  testID="register-confirm"
                />
              </View>
            </View>

            <Pressable
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              testID="register-submit"
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </Pressable>

            
          </View>

          <Pressable style={styles.switchLink} onPress={() => router.replace('/auth/login')}>
            <Text style={styles.switchText}>
              Already have an account? <Text style={styles.switchBold}>Sign In</Text>
            </Text>
          </Pressable>

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
  logoImage: {
    width: 88, height: 88, borderRadius: 22,
    marginBottom: 16,
  },
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
  formTitle: { fontSize: 24, fontFamily: 'Nunito_700Bold', color: Colors.text, marginBottom: 20, textAlign: 'center' },
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
  strengthRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  strengthBar: { flex: 1, height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' as const },
  strengthFill: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontFamily: 'Nunito_600SemiBold' },
  registerButton: {
    backgroundColor: Colors.secondary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  registerButtonDisabled: { opacity: 0.7 },
  registerButtonText: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#fff' },
  switchLink: { alignItems: 'center', marginTop: 24, paddingBottom: 16 },
  switchText: { fontSize: 14, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary },
  switchBold: { fontFamily: 'Nunito_700Bold', color: Colors.primary },
});
