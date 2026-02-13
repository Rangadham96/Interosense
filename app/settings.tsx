import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Share,
  Modal,
  FlatList,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system/next';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

const FONT_SIZE_OPTIONS: Array<{ label: string; value: 'small' | 'medium' | 'large' }> = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
];

const REMINDER_TIMES = [
  '06:00', '07:00', '08:00', '09:00', '10:00',
  '12:00', '14:00', '16:00', '18:00', '20:00', '21:00', '22:00',
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const { settings, updateSettings, profile, sessions, checkins, assessments, bodyMarks, goals, bookmarks, wearableData } = useApp();
  const [isExporting, setIsExporting] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0',
        profile,
        sessions,
        checkins,
        assessments,
        bodyMarks,
        goals,
        bookmarks,
        wearableData,
        settings,
      };
      const jsonString = JSON.stringify(exportData, null, 2);

      if (Platform.OS === 'web') {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `interosense-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const fileName = `interosense-export-${new Date().toISOString().slice(0, 10)}.json`;
        const filePath = new File(Paths.cache, fileName);
        filePath.create();
        filePath.write(jsonString);
        await Share.share({
          title: 'Interosense Data Export',
          url: filePath.uri,
          message: Platform.OS === 'android' ? jsonString : undefined,
        });
      }
      Alert.alert('Export Complete', 'Your data has been exported successfully.');
    } catch (e) {
      Alert.alert('Export Failed', 'There was an error exporting your data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectReminderTime = (time: string) => {
    updateSettings({ ...settings, reminderTime: time });
    setShowTimePicker(false);
  };

  const handleToggleNotifications = (val: boolean) => {
    updateSettings({ ...settings, notifications: val });
  };

  const handleToggleReducedMotion = (val: boolean) => {
    updateSettings({ ...settings, reducedMotion: val });
  };

  const handleFontSizeChange = (val: 'small' | 'medium' | 'large') => {
    updateSettings({ ...settings, fontSize: val });
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your sessions, check-ins, and progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${Colors.primary}15` }]}>
                <Feather name="bell" size={18} color={Colors.primary} />
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowLabel}>Daily Reminders</Text>
                <Text style={styles.rowSubtext}>
                  {settings.notifications ? 'On' : 'Off'}
                </Text>
              </View>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={settings.notifications ? Colors.primary : '#ccc'}
            />
          </View>
          <View style={styles.divider} />
          <TouchableOpacity
            style={[styles.row, !settings.notifications && { opacity: 0.4 }]}
            onPress={() => settings.notifications && setShowTimePicker(true)}
            disabled={!settings.notifications}
            activeOpacity={0.6}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${Colors.secondary}15` }]}>
                <Feather name="clock" size={18} color={Colors.secondary} />
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowLabel}>Reminder Time</Text>
                <Text style={styles.rowSubtext}>Daily check-in reminder</Text>
              </View>
            </View>
            <View style={styles.rowValueContainer}>
              <Text style={styles.rowValueText}>{settings.reminderTime}</Text>
              <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>DISPLAY</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${Colors.accent}25` }]}>
                <Feather name="type" size={18} color={Colors.accent} />
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowLabel}>Font Size</Text>
                <Text style={styles.rowSubtext}>
                  Currently: {settings.fontSize.charAt(0).toUpperCase() + settings.fontSize.slice(1)}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.fontSizeRow}>
            {FONT_SIZE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.fontPill,
                  settings.fontSize === opt.value && styles.fontPillActive,
                ]}
                onPress={() => handleFontSizeChange(opt.value)}
                activeOpacity={0.6}
              >
                <Text
                  style={[
                    styles.fontPillSample,
                    { fontSize: opt.value === 'small' ? 13 : opt.value === 'medium' ? 16 : 19 },
                    settings.fontSize === opt.value && styles.fontPillTextActive,
                  ]}
                >
                  Aa
                </Text>
                <Text
                  style={[
                    styles.fontPillLabel,
                    settings.fontSize === opt.value && styles.fontPillTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${Colors.secondary}15` }]}>
                <Feather name="minimize-2" size={18} color={Colors.secondary} />
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowLabel}>Reduced Motion</Text>
                <Text style={styles.rowSubtext}>
                  {settings.reducedMotion ? 'Animations minimized' : 'Animations enabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={settings.reducedMotion}
              onValueChange={handleToggleReducedMotion}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={settings.reducedMotion ? Colors.primary : '#ccc'}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>DATA</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={handleExportData}
            disabled={isExporting}
            activeOpacity={0.6}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${Colors.primary}15` }]}>
                <Feather name="download" size={18} color={Colors.primary} />
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowLabel}>Export Data</Text>
                <Text style={styles.rowSubtext}>Download all your data as JSON</Text>
              </View>
            </View>
            {isExporting ? (
              <Text style={styles.exportingText}>Exporting...</Text>
            ) : (
              <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
            )}
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={handleClearData}
            activeOpacity={0.6}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FDE8E8' }]}>
                <Feather name="trash-2" size={18} color={Colors.error} />
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={[styles.rowLabel, { color: Colors.error }]}>Clear All Data</Text>
                <Text style={styles.rowSubtext}>Permanently delete all progress</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>ABOUT</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${Colors.textSecondary}15` }]}>
                <Feather name="info" size={18} color={Colors.textSecondary} />
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowLabel}>Version</Text>
                <Text style={styles.rowSubtext}>1.0.0 (Beta)</Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/about')}
            activeOpacity={0.6}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${Colors.secondary}15` }]}>
                <Feather name="heart" size={18} color={Colors.secondary} />
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowLabel}>About Interosense</Text>
                <Text style={styles.rowSubtext}>Learn about our mission</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} activeOpacity={0.6}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${Colors.primary}15` }]}>
                <Feather name="shield" size={18} color={Colors.primary} />
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowLabel}>Privacy Policy</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} activeOpacity={0.6}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${Colors.accent}25` }]}>
                <Feather name="file-text" size={18} color={Colors.accent} />
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowLabel}>Terms of Service</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            Interosense is designed to support your wellness journey.
            It is not a replacement for professional medical care.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Reminder Time</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Feather name="x" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={REMINDER_TIMES}
              keyExtractor={(item) => item}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
              renderItem={({ item }) => {
                const isSelected = settings.reminderTime === item;
                const hour = parseInt(item.split(':')[0]);
                const period = hour < 12 ? 'AM' : 'PM';
                const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                const displayTime = `${displayHour}:${item.split(':')[1]} ${period}`;
                return (
                  <TouchableOpacity
                    style={[styles.timeOption, isSelected && styles.timeOptionSelected]}
                    onPress={() => handleSelectReminderTime(item)}
                    activeOpacity={0.6}
                  >
                    <Feather
                      name={hour < 12 ? 'sunrise' : hour < 18 ? 'sun' : 'moon'}
                      size={18}
                      color={isSelected ? '#FFFFFF' : Colors.textSecondary}
                      style={{ marginRight: 12 }}
                    />
                    <Text style={[styles.timeOptionText, isSelected && styles.timeOptionTextSelected]}>
                      {displayTime}
                    </Text>
                    {isSelected && (
                      <Feather name="check" size={18} color="#FFFFFF" style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 4,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  rowTextWrap: {
    flex: 1,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.text,
  },
  rowSubtext: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textTertiary,
    marginTop: 1,
  },
  rowValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValueText: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.primary,
  },
  exportingText: {
    fontSize: 13,
    fontFamily: 'Nunito_500Medium',
    color: Colors.primary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
    marginLeft: 62,
  },
  fontSizeRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  fontPill: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontPillActive: {
    backgroundColor: Colors.primary,
  },
  fontPillSample: {
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
    marginBottom: 4,
  },
  fontPillLabel: {
    fontSize: 11,
    fontFamily: 'Nunito_500Medium',
    color: Colors.textSecondary,
  },
  fontPillTextActive: {
    color: '#FFFFFF',
  },
  footerNote: {
    marginTop: 24,
    paddingHorizontal: 8,
  },
  footerText: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
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
    maxHeight: '60%',
    paddingBottom: 20,
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
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 6,
    backgroundColor: Colors.backgroundSecondary,
  },
  timeOptionSelected: {
    backgroundColor: Colors.primary,
  },
  timeOptionText: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.text,
  },
  timeOptionTextSelected: {
    color: '#FFFFFF',
  },
});
