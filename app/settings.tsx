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

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const { settings, updateSettings, profile, sessions, checkins, assessments, bodyMarks, goals, bookmarks, wearableData } = useApp();
  const [isExporting, setIsExporting] = useState(false);

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
          title: 'InteroSense Data Export',
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

  const handleReminderTime = () => {
    const times = ['07:00', '08:00', '09:00', '10:00', '12:00', '18:00', '20:00', '21:00'];
    const buttons = times.map(t => ({
      text: t,
      onPress: () => updateSettings({ ...settings, reminderTime: t }),
    }));
    buttons.push({ text: 'Cancel', onPress: async () => {} });
    Alert.alert('Set Reminder Time', 'Choose when to receive your daily check-in reminder', buttons);
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

  const renderRow = (
    icon: string,
    label: string,
    right: React.ReactNode,
    onPress?: () => void,
    isLast?: boolean
  ) => (
    <View key={label}>
      <TouchableOpacity
        style={styles.row}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={onPress ? 0.6 : 1}
      >
        <View style={styles.rowLeft}>
          <View style={styles.iconContainer}>
            <Feather name={icon as any} size={18} color={Colors.primary} />
          </View>
          <Text style={styles.rowLabel}>{label}</Text>
        </View>
        <View style={styles.rowRight}>{right}</View>
      </TouchableOpacity>
      {!isLast && <View style={styles.divider} />}
    </View>
  );

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
        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.card}>
          {renderRow(
            'bell',
            'Notifications',
            <Switch
              value={settings.notifications}
              onValueChange={(val) =>
                updateSettings({ ...settings, notifications: val })
              }
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={settings.notifications ? Colors.primary : Colors.textTertiary}
            />,
            undefined,
            false
          )}
          {renderRow(
            'clock',
            'Reminder Time',
            <View style={styles.rowValueContainer}>
              <Text style={styles.rowValue}>{settings.reminderTime}</Text>
              <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
            </View>,
            handleReminderTime,
            false
          )}
          {renderRow(
            'type',
            'Font Size',
            <View style={styles.pillContainer}>
              {FONT_SIZE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.pill,
                    settings.fontSize === opt.value && styles.pillActive,
                  ]}
                  onPress={() =>
                    updateSettings({ ...settings, fontSize: opt.value })
                  }
                >
                  <Text
                    style={[
                      styles.pillText,
                      settings.fontSize === opt.value && styles.pillTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>,
            undefined,
            false
          )}
          {renderRow(
            'minimize-2',
            'Reduced Motion',
            <Switch
              value={settings.reducedMotion}
              onValueChange={(val) =>
                updateSettings({ ...settings, reducedMotion: val })
              }
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={settings.reducedMotion ? Colors.primary : Colors.textTertiary}
            />,
            undefined,
            true
          )}
        </View>

        <Text style={styles.sectionTitle}>DATA</Text>
        <View style={styles.card}>
          {renderRow(
            'download',
            'Export Data',
            isExporting ? (
              <Text style={styles.rowValue}>Exporting...</Text>
            ) : (
              <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
            ),
            handleExportData,
            false
          )}
          {renderRow(
            'trash-2',
            'Clear All Data',
            <Feather name="chevron-right" size={18} color={Colors.error} />,
            handleClearData,
            true
          )}
        </View>

        <Text style={styles.sectionTitle}>ABOUT</Text>
        <View style={styles.card}>
          {renderRow(
            'info',
            'Version',
            <Text style={styles.rowValue}>1.0.0</Text>,
            undefined,
            false
          )}
          {renderRow(
            'heart',
            'About Interosense',
            <Feather name="chevron-right" size={18} color={Colors.textTertiary} />,
            () => router.push('/about'),
            false
          )}
          <View style={styles.aboutText}>
            <Text style={styles.aboutDescription}>
              Interosense is a mental wellness app designed to help you develop
              interoceptive awareness through guided exercises, body scanning,
              and mindful check-ins. Track your progress, build healthy habits,
              and deepen your mind-body connection.
            </Text>
          </View>
          <View style={styles.divider} />
          {renderRow(
            'shield',
            'Privacy Policy',
            <Feather name="chevron-right" size={18} color={Colors.textTertiary} />,
            undefined,
            false
          )}
          {renderRow(
            'file-text',
            'Terms of Service',
            <Feather name="chevron-right" size={18} color={Colors.textTertiary} />,
            undefined,
            true
          )}
        </View>

        <View style={{ height: 40 }} />
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
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: 'Nunito_500Medium',
    color: Colors.text,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValue: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textSecondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
    marginLeft: 60,
  },
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 10,
    padding: 3,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pillActive: {
    backgroundColor: Colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: Colors.textInverse,
  },
  comingSoon: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  aboutText: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  aboutDescription: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
