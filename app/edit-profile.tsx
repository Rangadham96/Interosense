import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Image,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

type GenderOption = 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | '';

const GENDER_OPTIONS: { label: string; value: GenderOption }[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Non-binary', value: 'non-binary' },
  { label: 'Prefer not to say', value: 'prefer-not-to-say' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => currentYear - i);

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useApp();
  const { user, changeEmail, changePassword } = useAuth();
  const topPadding = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);

  // Social-login accounts have no password; email/password are provider-managed
  const isSocialAccount = !!user && user.provider !== 'email' && user.provider !== null;
  const providerLabel = user?.provider === 'google' ? 'Google' : user?.provider === 'apple' ? 'Apple' : 'your sign-in provider';

  // Change email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);

  // Change password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

  const [name, setName] = useState(profile?.name || '');
  const [gender, setGender] = useState<GenderOption>(profile?.gender || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [profileImage, setProfileImage] = useState<string | null>(profile?.profileImage || null);

  const parsedDate = profile?.dateOfBirth ? parseDateString(profile.dateOfBirth) : null;
  const [selectedYear, setSelectedYear] = useState(parsedDate?.year || 1990);
  const [selectedMonth, setSelectedMonth] = useState(parsedDate?.month || 1);
  const [selectedDay, setSelectedDay] = useState(parsedDate?.day || 1);
  const [hasSetDate, setHasSetDate] = useState(!!profile?.dateOfBirth);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerStep, setDatePickerStep] = useState<'year' | 'month' | 'day'>('year');

  const [tempYear, setTempYear] = useState(selectedYear);
  const [tempMonth, setTempMonth] = useState(selectedMonth);

  const initial = name ? name.charAt(0).toUpperCase() : '?';

  function parseDateString(s: string) {
    const parts = s.split('-');
    if (parts.length === 3) {
      return { year: parseInt(parts[0]), month: parseInt(parts[1]), day: parseInt(parts[2]) };
    }
    return null;
  }

  function formatDate(y: number, m: number, d: number) {
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  function formatDateDisplay(y: number, m: number, d: number) {
    return `${MONTHS[m - 1]} ${d}, ${y}`;
  }

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const openDatePicker = () => {
    setTempYear(selectedYear);
    setTempMonth(selectedMonth);
    setDatePickerStep('year');
    setShowDatePicker(true);
  };

  const handleSelectYear = (year: number) => {
    setTempYear(year);
    setDatePickerStep('month');
  };

  const handleSelectMonth = (month: number) => {
    setTempMonth(month);
    setDatePickerStep('day');
  };

  const handleSelectDay = (day: number) => {
    setSelectedYear(tempYear);
    setSelectedMonth(tempMonth);
    setSelectedDay(day);
    setHasSetDate(true);
    setShowDatePicker(false);
  };

  const openEmailModal = () => {
    setNewEmail('');
    setEmailPassword('');
    setEmailError('');
    setShowEmailModal(true);
  };

  const handleChangeEmail = async () => {
    setEmailError('');
    const trimmed = newEmail.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    if (!emailPassword) {
      setEmailError('Please enter your current password.');
      return;
    }
    setEmailSaving(true);
    const result = await changeEmail(trimmed, emailPassword);
    setEmailSaving(false);
    if (result.success) {
      setShowEmailModal(false);
      setSuccessBanner('Email updated successfully.');
      setTimeout(() => setSuccessBanner(''), 4000);
    } else {
      setEmailError(result.message || 'Could not change email.');
    }
  };

  const openPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setPasswordSaving(true);
    const result = await changePassword(currentPassword, newPassword);
    setPasswordSaving(false);
    if (result.success) {
      setShowPasswordModal(false);
      setSuccessBanner('Password updated successfully.');
      setTimeout(() => setSuccessBanner(''), 4000);
    } else {
      setPasswordError(result.message || 'Could not change password.');
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    const dateOfBirth = hasSetDate ? formatDate(selectedYear, selectedMonth, selectedDay) : undefined;
    await updateProfile({
      ...profile,
      name: name.trim(),
      gender,
      dateOfBirth,
      bio: bio.trim(),
      profileImage: profileImage || undefined,
    });
    router.back();
  };

  const daysInSelectedMonth = getDaysInMonth(tempMonth, tempYear);
  const daysArray = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
          activeOpacity={0.6}
        >
          <Feather name="arrow-left" size={20} color={Colors.primary} />
          <Text style={styles.backButtonText}>Back</Text>
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
        <TouchableOpacity style={styles.avatarSection} onPress={handlePickImage} activeOpacity={0.7}>
          <View style={styles.avatarCircle}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
            <View style={styles.cameraOverlay}>
              <Feather name="camera" size={16} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </TouchableOpacity>

        {successBanner ? (
          <View style={styles.successBanner} testID="success-banner">
            <Feather name="check-circle" size={16} color={Colors.success} />
            <Text style={styles.successBannerText}>{successBanner}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.textInput} testID="account-email">{user?.email || ''}</Text>
            </View>
            <View style={styles.fieldDivider} />
            {isSocialAccount ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.providerManagedText}>
                  Your email and password are managed by {providerLabel}. To change them, update your {providerLabel} account.
                </Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.accountActionRow}
                  onPress={openEmailModal}
                  activeOpacity={0.6}
                  testID="change-email-row"
                >
                  <Feather name="mail" size={18} color={Colors.primary} />
                  <Text style={styles.accountActionLabel}>Change Email</Text>
                  <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
                </TouchableOpacity>
                <View style={styles.fieldDivider} />
                <TouchableOpacity
                  style={styles.accountActionRow}
                  onPress={openPasswordModal}
                  activeOpacity={0.6}
                  testID="change-password-row"
                >
                  <Feather name="lock" size={18} color={Colors.primary} />
                  <Text style={styles.accountActionLabel}>Change Password</Text>
                  <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
                </TouchableOpacity>
              </>
            )}
          </View>
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

            <TouchableOpacity style={styles.fieldGroup} onPress={openDatePicker} activeOpacity={0.6}>
              <Text style={styles.fieldLabel}>Date of Birth</Text>
              <View style={styles.dateRow}>
                <Feather name="calendar" size={18} color={Colors.primary} style={{ marginRight: 10 }} />
                <Text style={[styles.textInput, !hasSetDate && { color: Colors.textTertiary }]}>
                  {hasSetDate
                    ? formatDateDisplay(selectedYear, selectedMonth, selectedDay)
                    : 'Tap to select date'}
                </Text>
                <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
              </View>
            </TouchableOpacity>
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

      <Modal
        visible={showEmailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEmailModal(false)}>
                <Feather name="x" size={22} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Change Email</Text>
              <View style={{ width: 22 }} />
            </View>
            <View style={styles.formContent}>
              <Text style={styles.formHint}>
                Current email: {user?.email}
              </Text>
              <Text style={styles.formLabel}>New email</Text>
              <TextInput
                style={styles.formInput}
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                testID="new-email-input"
              />
              <Text style={styles.formLabel}>Current password</Text>
              <TextInput
                style={styles.formInput}
                value={emailPassword}
                onChangeText={setEmailPassword}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
                autoCapitalize="none"
                testID="email-password-input"
              />
              {emailError ? (
                <Text style={styles.formError} testID="email-error">{emailError}</Text>
              ) : null}
              <TouchableOpacity
                style={[styles.formButton, emailSaving && styles.formButtonDisabled]}
                onPress={handleChangeEmail}
                disabled={emailSaving}
                activeOpacity={0.8}
                testID="submit-change-email"
              >
                <Text style={styles.formButtonText}>
                  {emailSaving ? 'Updating...' : 'Update Email'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Feather name="x" size={22} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Change Password</Text>
              <View style={{ width: 22 }} />
            </View>
            <View style={styles.formContent}>
              <Text style={styles.formLabel}>Current password</Text>
              <TextInput
                style={styles.formInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter your current password"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
                autoCapitalize="none"
                testID="current-password-input"
              />
              <Text style={styles.formLabel}>New password</Text>
              <TextInput
                style={styles.formInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
                autoCapitalize="none"
                testID="new-password-input"
              />
              <Text style={styles.formLabel}>Confirm new password</Text>
              <TextInput
                style={styles.formInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat new password"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
                autoCapitalize="none"
                testID="confirm-password-input"
              />
              {passwordError ? (
                <Text style={styles.formError} testID="password-error">{passwordError}</Text>
              ) : null}
              <TouchableOpacity
                style={[styles.formButton, passwordSaving && styles.formButtonDisabled]}
                onPress={handleChangePassword}
                disabled={passwordSaving}
                activeOpacity={0.8}
                testID="submit-change-password"
              >
                <Text style={styles.formButtonText}>
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                if (datePickerStep === 'month') setDatePickerStep('year');
                else if (datePickerStep === 'day') setDatePickerStep('month');
                else setShowDatePicker(false);
              }}>
                <Feather
                  name={datePickerStep === 'year' ? 'x' : 'arrow-left'}
                  size={22}
                  color={Colors.text}
                />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {datePickerStep === 'year' && 'Select Year'}
                {datePickerStep === 'month' && `Select Month (${tempYear})`}
                {datePickerStep === 'day' && `Select Day (${MONTHS[tempMonth - 1]} ${tempYear})`}
              </Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Feather name="x" size={22} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>

            {datePickerStep === 'year' && (
              <FlatList
                data={YEARS}
                keyExtractor={(item) => item.toString()}
                numColumns={4}
                contentContainerStyle={styles.gridContent}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.gridItem,
                      item === selectedYear && hasSetDate && styles.gridItemSelected,
                    ]}
                    onPress={() => handleSelectYear(item)}
                    activeOpacity={0.6}
                  >
                    <Text
                      style={[
                        styles.gridItemText,
                        item === selectedYear && hasSetDate && styles.gridItemTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}

            {datePickerStep === 'month' && (
              <FlatList
                data={MONTHS.map((label, i) => ({ label, value: i + 1 }))}
                keyExtractor={(item) => item.value.toString()}
                numColumns={3}
                contentContainerStyle={styles.gridContent}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.monthItem,
                      item.value === selectedMonth && hasSetDate && styles.gridItemSelected,
                    ]}
                    onPress={() => handleSelectMonth(item.value)}
                    activeOpacity={0.6}
                  >
                    <Text
                      style={[
                        styles.gridItemText,
                        item.value === selectedMonth && hasSetDate && styles.gridItemTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}

            {datePickerStep === 'day' && (
              <FlatList
                data={daysArray}
                keyExtractor={(item) => item.toString()}
                numColumns={7}
                contentContainerStyle={styles.gridContent}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dayItem,
                      item === selectedDay && hasSetDate && styles.gridItemSelected,
                    ]}
                    onPress={() => handleSelectDay(item)}
                    activeOpacity={0.6}
                  >
                    <Text
                      style={[
                        styles.dayItemText,
                        item === selectedDay && hasSetDate && styles.gridItemTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const { width: screenWidth } = Dimensions.get('window');

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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backButtonText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.primary,
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
    overflow: 'hidden',
  },
  avatarText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 36,
    color: '#FFFFFF',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: Colors.text,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  gridItem: {
    flex: 1,
    margin: 4,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthItem: {
    flex: 1,
    margin: 4,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayItem: {
    width: (screenWidth - 80) / 7,
    margin: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayItemText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: Colors.text,
  },
  gridItemSelected: {
    backgroundColor: Colors.primary,
  },
  gridItemText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: Colors.text,
  },
  gridItemTextSelected: {
    color: '#FFFFFF',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.success + '15',
  },
  successBannerText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.success,
    flex: 1,
  },
  accountActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  accountActionLabel: {
    flex: 1,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: Colors.text,
  },
  providerManagedText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  formHint: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  formLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 8,
  },
  formInput: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 6,
  },
  formError: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: Colors.error,
    marginTop: 8,
  },
  formButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  formButtonDisabled: {
    opacity: 0.6,
  },
  formButtonText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
