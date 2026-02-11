import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';

type GenderOption = 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | '';

const GENDER_OPTIONS: { label: string; value: GenderOption }[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Non-binary', value: 'non-binary' },
  { label: 'Prefer not to say', value: 'prefer-not-to-say' },
];

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useApp();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const [name, setName] = useState(profile?.name || '');
  const [gender, setGender] = useState<GenderOption>(profile?.gender || '');
  const [dateOfBirth, setDateOfBirth] = useState(profile?.dateOfBirth || '');
  const [bio, setBio] = useState(profile?.bio || '');

  const initial = name ? name.charAt(0).toUpperCase() : '?';

  const handleSave = async () => {
    if (!profile) return;
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    await updateProfile({
      ...profile,
      name: name.trim(),
      gender,
      dateOfBirth,
      bio: bio.trim(),
    });
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
          activeOpacity={0.6}
        >
          <Feather name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerBtn}
          activeOpacity={0.6}
        >
          <Feather name="check" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.avatarHint}>Profile Photo</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.card}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldDivider} />

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Date of Birth</Text>
              <TextInput
                style={styles.textInput}
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gender</Text>
          <View style={styles.card}>
            {GENDER_OPTIONS.map((option, index) => {
              const selected = gender === option.value;
              return (
                <React.Fragment key={option.value}>
                  {index > 0 && <View style={styles.fieldDivider} />}
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => setGender(option.value)}
                    activeOpacity={0.6}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        selected && styles.optionLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <View
                      style={[
                        styles.radio,
                        selected && styles.radioSelected,
                      ]}
                    >
                      {selected && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About You</Text>
          <View style={styles.card}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Bio</Text>
              <TextInput
                style={[styles.textInput, styles.bioInput]}
                value={bio}
                onChangeText={(text) => {
                  if (text.length <= 200) setBio(text);
                }}
                placeholder="Tell us a little about yourself..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                textAlignVertical="top"
                maxLength={200}
              />
              <Text style={styles.charCount}>
                {bio.length}/200
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 36,
    color: '#FFFFFF',
  },
  avatarHint: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    marginTop: 8,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  fieldGroup: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  textInput: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  bioInput: {
    minHeight: 90,
    lineHeight: 22,
  },
  charCount: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: 4,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionLabel: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 16,
    color: Colors.text,
  },
  optionLabelSelected: {
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.primary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
});
