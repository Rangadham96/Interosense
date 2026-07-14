import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { BodyMark } from '@/lib/storage';

const SENSATIONS = ['tension', 'tingling', 'warmth', 'coolness', 'heaviness', 'pulsing', 'pain', 'numbness'] as const;

const HEATMAP_COLORS = {
  none: Colors.primaryLight,
  low: '#A5CC94',
  medium: '#F0C05A',
  high: '#E85D5D',
};

function getHeatmapColor(count: number): string {
  if (count === 0) return HEATMAP_COLORS.none;
  if (count <= 2) return HEATMAP_COLORS.low;
  if (count <= 5) return HEATMAP_COLORS.medium;
  return HEATMAP_COLORS.high;
}

const BODY_PARTS: { key: string; label: string; style: object; dotX: number; dotY: number }[] = [
  { key: 'head', label: 'Head', style: { position: 'absolute' as const, top: 0, left: 75, width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primaryLight, borderWidth: 2, borderColor: Colors.primary }, dotX: 100, dotY: 25 },
  { key: 'neck', label: 'Neck', style: { position: 'absolute' as const, top: 48, left: 90, width: 20, height: 18, backgroundColor: Colors.primaryLight, borderWidth: 2, borderColor: Colors.primary, borderTopWidth: 0 }, dotX: 100, dotY: 57 },
  { key: 'torso', label: 'Torso', style: { position: 'absolute' as const, top: 64, left: 60, width: 80, height: 120, borderRadius: 16, backgroundColor: Colors.primaryLight, borderWidth: 2, borderColor: Colors.primary }, dotX: 100, dotY: 124 },
  { key: 'leftArm', label: 'Left Arm', style: { position: 'absolute' as const, top: 72, left: 22, width: 30, height: 110, borderRadius: 12, backgroundColor: Colors.primaryLight, borderWidth: 2, borderColor: Colors.primary, transform: [{ rotate: '8deg' }] }, dotX: 37, dotY: 127 },
  { key: 'rightArm', label: 'Right Arm', style: { position: 'absolute' as const, top: 72, right: 22, width: 30, height: 110, borderRadius: 12, backgroundColor: Colors.primaryLight, borderWidth: 2, borderColor: Colors.primary, transform: [{ rotate: '-8deg' }] }, dotX: 163, dotY: 127 },
  { key: 'leftLeg', label: 'Left Leg', style: { position: 'absolute' as const, top: 180, left: 58, width: 36, height: 140, borderRadius: 14, backgroundColor: Colors.primaryLight, borderWidth: 2, borderColor: Colors.primary, transform: [{ rotate: '2deg' }] }, dotX: 76, dotY: 250 },
  { key: 'rightLeg', label: 'Right Leg', style: { position: 'absolute' as const, top: 180, right: 58, width: 36, height: 140, borderRadius: 14, backgroundColor: Colors.primaryLight, borderWidth: 2, borderColor: Colors.primary, transform: [{ rotate: '-2deg' }] }, dotX: 124, dotY: 250 },
];

const INTENSITY_COLORS = [Colors.success, Colors.secondaryDark, Colors.warning, Colors.accentDark, Colors.error];

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function getDateKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function BodyMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bodyMarks, addBodyMark, clearBodyMarks } = useApp();
  const topInset = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const [currentView, setCurrentView] = useState<'front' | 'back'>('front');
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDotX, setSelectedDotX] = useState(0);
  const [selectedDotY, setSelectedDotY] = useState(0);
  const [intensity, setIntensity] = useState(3);
  const [sensation, setSensation] = useState('tension');

  const handleBodyPartPress = (part: typeof BODY_PARTS[0]) => {
    setSelectedRegion(part.label);
    setSelectedDotX(part.dotX);
    setSelectedDotY(part.dotY);
    setIntensity(3);
    setSensation('tension');
    setModalVisible(true);
  };

  const handleSave = async () => {
    const mark: BodyMark = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      x: selectedDotX,
      y: selectedDotY,
      region: selectedRegion,
      intensity,
      sensation,
      createdAt: new Date().toISOString(),
      view: currentView,
    };
    await addBodyMark(mark);
    setModalVisible(false);
  };

  const handleClearAll = () => {
    if (Platform.OS === 'web') {
      clearBodyMarks();
    } else {
      Alert.alert('Clear All Marks', 'Are you sure you want to remove all body marks?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => clearBodyMarks() },
      ]);
    }
  };

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    BODY_PARTS.forEach(p => { counts[p.label] = 0; });
    bodyMarks.forEach(m => {
      counts[m.region] = (counts[m.region] || 0) + 1;
    });
    return counts;
  }, [bodyMarks]);

  const regionStatsSorted = useMemo(() => {
    return Object.entries(regionCounts)
      .sort((a, b) => b[1] - a[1]);
  }, [regionCounts]);

  const maxRegionCount = useMemo(() => {
    return Math.max(1, ...Object.values(regionCounts));
  }, [regionCounts]);

  const viewMarks = useMemo(() => {
    return bodyMarks.filter(m => m.view === currentView);
  }, [bodyMarks, currentView]);

  const todayMarks = useMemo(() => {
    return viewMarks.filter(m => isToday(m.createdAt));
  }, [viewMarks]);

  const historyGrouped = useMemo(() => {
    const groups: Record<string, BodyMark[]> = {};
    const sorted = [...viewMarks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    sorted.forEach(m => {
      const key = getDateKey(m.createdAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [viewMarks]);

  const displayMarks = activeTab === 'today' ? todayMarks : viewMarks;

  const bodyPartsWithHeatmap = useMemo(() => {
    return BODY_PARTS.map(part => {
      const count = regionCounts[part.label] || 0;
      const color = getHeatmapColor(count);
      return {
        ...part,
        style: { ...part.style, backgroundColor: color },
      };
    });
  }, [regionCounts]);

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={20} color={Colors.primary} />
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Body Map</Text>
        <Pressable onPress={handleClearAll} hitSlop={8}>
          <Text style={styles.clearText}>Clear All</Text>
        </Pressable>
      </View>

      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleBtn, currentView === 'front' && styles.toggleBtnActive]}
          onPress={() => setCurrentView('front')}
        >
          <Text style={[styles.toggleText, currentView === 'front' && styles.toggleTextActive]}>Front</Text>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, currentView === 'back' && styles.toggleBtnActive]}
          onPress={() => setCurrentView('back')}
        >
          <Text style={[styles.toggleText, currentView === 'back' && styles.toggleTextActive]}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.bodyContainer}>
        <View style={styles.bodyFigure}>
          {bodyPartsWithHeatmap.map(part => (
            <Pressable
              key={part.key}
              style={part.style}
              onPress={() => handleBodyPartPress(part)}
            />
          ))}
          {displayMarks.map(mark => (
            <View
              key={mark.id}
              style={[
                styles.markDot,
                {
                  left: mark.x - 6,
                  top: mark.y - 6,
                  backgroundColor: INTENSITY_COLORS[Math.min(mark.intensity - 1, 4)],
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.heatmapLegend}>
          <Text style={styles.legendLabel}>Activity:</Text>
          <View style={[styles.legendSwatch, { backgroundColor: HEATMAP_COLORS.none }]} />
          <Text style={styles.legendText}>None</Text>
          <View style={[styles.legendSwatch, { backgroundColor: HEATMAP_COLORS.low }]} />
          <Text style={styles.legendText}>Low</Text>
          <View style={[styles.legendSwatch, { backgroundColor: HEATMAP_COLORS.medium }]} />
          <Text style={styles.legendText}>Med</Text>
          <View style={[styles.legendSwatch, { backgroundColor: HEATMAP_COLORS.high }]} />
          <Text style={styles.legendText}>High</Text>
        </View>
        <Text style={styles.tapHint}>Tap a body region to record a sensation</Text>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabBtn, activeTab === 'today' && styles.tabBtnActive]}
          onPress={() => setActiveTab('today')}
        >
          <Feather name="sun" size={14} color={activeTab === 'today' ? Colors.primary : Colors.textTertiary} />
          <Text style={[styles.tabText, activeTab === 'today' && styles.tabTextActive]}>Today</Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
          onPress={() => setActiveTab('history')}
        >
          <Feather name="clock" size={14} color={activeTab === 'history' ? Colors.primary : Colors.textTertiary} />
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>History</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.marksList} contentContainerStyle={{ paddingBottom: bottomInset + 12 }}>
        {activeTab === 'today' && (
          <>
            {todayMarks.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="activity" size={28} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>No sensations recorded today</Text>
              </View>
            ) : (
              <>
                <Text style={styles.marksTitle}>Today's Sensations</Text>
                {todayMarks.map(mark => (
                  <View key={mark.id} style={styles.markCard}>
                    <View style={[styles.markIndicator, { backgroundColor: INTENSITY_COLORS[Math.min(mark.intensity - 1, 4)] }]} />
                    <View style={styles.markInfo}>
                      <Text style={styles.markRegion}>{mark.region}</Text>
                      <Text style={styles.markDetail}>{mark.sensation} - Intensity {mark.intensity}/5</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <>
            {historyGrouped.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="inbox" size={28} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>No recorded sensations yet</Text>
              </View>
            ) : (
              historyGrouped.map(([dateKey, marks]) => (
                <View key={dateKey} style={styles.dateGroup}>
                  <Text style={styles.dateGroupTitle}>{formatDate(marks[0].createdAt)}</Text>
                  {marks.map(mark => (
                    <View key={mark.id} style={styles.markCard}>
                      <View style={[styles.markIndicator, { backgroundColor: INTENSITY_COLORS[Math.min(mark.intensity - 1, 4)] }]} />
                      <View style={styles.markInfo}>
                        <Text style={styles.markRegion}>{mark.region}</Text>
                        <Text style={styles.markDetail}>{mark.sensation} - Intensity {mark.intensity}/5</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))
            )}
          </>
        )}

        {bodyMarks.length > 0 && (
          <View style={styles.regionStatsSection}>
            <Text style={styles.regionStatsTitle}>Region Activity</Text>
            {regionStatsSorted.map(([region, count]) => (
              <View key={region} style={styles.statRow}>
                <Text style={styles.statLabel}>{region}</Text>
                <View style={styles.statBarContainer}>
                  <View
                    style={[
                      styles.statBar,
                      {
                        width: `${(count / maxRegionCount) * 100}%`,
                        backgroundColor: getHeatmapColor(count),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.statCount}>{count}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={[styles.modalContent, { paddingBottom: bottomInset + 24 }]} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Record Sensation</Text>
            <Text style={styles.modalLabel}>Region</Text>
            <View style={styles.regionBadge}>
              <Feather name="map-pin" size={14} color={Colors.primary} />
              <Text style={styles.regionText}>{selectedRegion}</Text>
            </View>

            <Text style={styles.modalLabel}>Intensity</Text>
            <View style={styles.intensityRow}>
              {[1, 2, 3, 4, 5].map(i => (
                <Pressable key={i} onPress={() => setIntensity(i)} style={styles.intensityItem}>
                  <View
                    style={[
                      styles.intensityCircle,
                      {
                        backgroundColor: i <= intensity ? INTENSITY_COLORS[i - 1] : Colors.borderLight,
                        width: 28 + i * 4,
                        height: 28 + i * 4,
                        borderRadius: (28 + i * 4) / 2,
                      },
                    ]}
                  />
                  <Text style={styles.intensityNum}>{i}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.modalLabel}>Sensation Type</Text>
            <View style={styles.sensationGrid}>
              {SENSATIONS.map(s => (
                <Pressable
                  key={s}
                  style={[styles.sensationChip, sensation === s && styles.sensationChipActive]}
                  onPress={() => setSensation(s)}
                >
                  <Text style={[styles.sensationChipText, sensation === s && styles.sensationChipTextActive]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
          </Pressable>
        </Pressable>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtnText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.primary,
  },
  headerTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 22,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  clearText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.error,
  },
  toggleRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: Colors.surface,
    ...Platform.select({
      ios: {
        shadowColor: Colors.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        shadowColor: Colors.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
      },
    }),
  },
  toggleText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.primary,
  },
  bodyContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  bodyFigure: {
    width: 200,
    height: 330,
    position: 'relative',
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  legendLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  legendText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 10,
    color: Colors.textTertiary,
    marginRight: 6,
  },
  tapHint: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 6,
  },
  markDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.surface,
    zIndex: 10,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 8,
    gap: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: Colors.primaryLight + '25',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  tabText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: Colors.textTertiary,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  marksList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  marksTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  markCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  markIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  markInfo: {
    flex: 1,
  },
  markRegion: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  markDetail: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  emptyText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    color: Colors.textTertiary,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateGroupTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  regionStatsSection: {
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: Colors.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        shadowColor: Colors.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 6,
      },
    }),
  },
  regionStatsTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
    width: 80,
  },
  statBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  statBar: {
    height: 8,
    borderRadius: 4,
    minWidth: 0,
  },
  statCount: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
    color: Colors.text,
    width: 28,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 22,
    color: Colors.text,
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  modalLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  regionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  regionText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: Colors.text,
  },
  intensityRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  intensityItem: {
    alignItems: 'center',
    gap: 6,
  },
  intensityCircle: {},
  intensityNum: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sensationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  sensationChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  sensationChipActive: {
    backgroundColor: Colors.primaryLight + '20',
    borderColor: Colors.primary,
  },
  sensationChipText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sensationChipTextActive: {
    color: Colors.primary,
    fontFamily: 'Nunito_600SemiBold',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: Colors.textInverse,
  },
});
