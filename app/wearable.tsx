import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { WearableDataPoint } from '@/lib/storage';
import {
  getHealthConnection,
  saveHealthConnection,
  clearHealthConnection,
  requestHealthPermissions,
  fetchHealthData,
  getLastSyncedAt,
  saveLastSyncedAt,
  clearLastSyncedAt,
  HealthPlatform,
} from '@/lib/health';
import { Storage } from '@/lib/storage';

function MiniChart({
  data,
  color,
  label,
  unit,
  width = 320,
  height = 160,
}: {
  data: number[];
  color: string;
  label: string;
  unit: string;
  width?: number;
  height?: number;
}) {
  if (data.length === 0) return null;
  const padLeft = 36;
  const padRight = 16;
  const padTop = 24;
  const padBottom = 28;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;
  const minVal = Math.min(...data) - 2;
  const maxVal = Math.max(...data) + 2;
  const range = maxVal - minVal || 1;

  const points = data.map((val, i) => ({
    x: padLeft + (i / (data.length - 1)) * chartW,
    y: padTop + chartH - ((val - minVal) / range) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const fillPath = `${linePath} L${points[points.length - 1].x},${padTop + chartH} L${points[0].x},${padTop + chartH} Z`;

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const tickCount = 3;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const val = minVal + (range * i) / (tickCount - 1);
    return Math.round(val);
  });

  return (
    <View style={[styles.chartCard, cardShadow]}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{label}</Text>
        <Text style={styles.chartUnit}>{unit}</Text>
      </View>
      <Svg width={width} height={height}>
        <Defs>
          <SvgLinearGradient id={`grad_${label}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.25" />
            <Stop offset="1" stopColor={color} stopOpacity="0.02" />
          </SvgLinearGradient>
        </Defs>
        {ticks.map((tick) => {
          const y = padTop + chartH - ((tick - minVal) / range) * chartH;
          return (
            <React.Fragment key={tick}>
              <Line x1={padLeft} y1={y} x2={padLeft + chartW} y2={y} stroke={Colors.borderLight} strokeWidth={1} />
              <SvgText x={padLeft - 6} y={y + 4} fontSize={10} fill={Colors.textTertiary} textAnchor="end" fontFamily="Nunito_400Regular">
                {tick}
              </SvgText>
            </React.Fragment>
          );
        })}
        <Path d={fillPath} fill={`url(#grad_${label})`} />
        <Path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={Colors.surface} stroke={color} strokeWidth={2} />
        ))}
        {data.map((_, i) => {
          const x = padLeft + (i / (data.length - 1)) * chartW;
          return (
            <SvgText key={i} x={x} y={height - 6} fontSize={10} fill={Colors.textTertiary} textAnchor="middle" fontFamily="Nunito_400Regular">
              {dayLabels[i % 7]}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

function ProgressRing({ progress, size, color }: { progress: number; size: number; color: string }) {
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={Colors.borderLight} strokeWidth={strokeWidth} />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

const cardShadow = Platform.select({
  web: { boxShadow: '0 2px 12px rgba(107,91,149,0.08)' } as any,
  default: {
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
});

const headerShadow = Platform.select({
  web: { boxShadow: '0 4px 16px rgba(107,91,149,0.15)' } as any,
  default: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
});

type ConnectionStatus = 'idle' | 'requesting' | 'fetching' | 'connected' | 'error';

const ERROR_MESSAGES: Record<string, string> = {
  'native-module-required': 'Apple Health requires the native app. Scan the QR code in Expo Go or download from the App Store.',
  'health-connect-not-installed': 'Health Connect is not installed. Install it from the Play Store to sync your health data.',
  'web': 'Health data is available on the iOS and Android apps.',
  'unsupported-platform': 'Health data is not supported on this platform.',
  'permission-denied': 'Permission was denied. Please enable health access in your device settings.',
  'fetch-failed': 'Could not load health data. Please try again.',
  'default': 'Could not connect. Please try again.',
};

function getErrorMessage(error?: string) {
  if (!error) return ERROR_MESSAGES['default'];
  return ERROR_MESSAGES[error] || ERROR_MESSAGES['default'];
}

export default function WearableScreen() {
  const insets = useSafeAreaInsets();
  const { wearableData, refresh } = useApp();
  const { user } = useAuth();
  const isPremium = user?.isPremium;

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [connectedPlatform, setConnectedPlatform] = useState<HealthPlatform>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<WearableDataPoint[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const SYNC_THROTTLE_MS = 30 * 60 * 1000;

  const [tick, setTick] = useState(0);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getHealthConnection().then((conn) => {
      if (!isMounted.current) return;
      if (conn.connected && conn.platform) {
        setConnectedPlatform(conn.platform);
        setStatus('connected');
      }
    });
    getLastSyncedAt().then((ts) => {
      if (!isMounted.current) return;
      setLastSyncedAt(ts);
    });
    const realData = wearableData.filter((d) => d.source === 'healthkit' || d.source === 'health-connect');
    if (realData.length > 0) {
      setHealthData(realData);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      getHealthConnection().then(async (conn) => {
        if (!isMounted.current || !conn.connected || !conn.platform) return;

        const storedSync = await getLastSyncedAt();
        const lastSyncMs = storedSync ? new Date(storedSync).getTime() : 0;
        const staleEnough = Date.now() - lastSyncMs >= SYNC_THROTTLE_MS;
        if (!staleEnough) return;

        const fetchResult = await fetchHealthData(conn.platform);
        if (!isMounted.current) return;

        if (fetchResult.error && fetchResult.data.length === 0) {
          setErrorMessage(getErrorMessage(fetchResult.error));
          return;
        }

        if (fetchResult.data.length > 0) {
          await Storage.setWearableData(fetchResult.data);
          setHealthData(fetchResult.data);
          setConnectedPlatform(conn.platform);
          setStatus('connected');
          const now = new Date().toISOString();
          await saveLastSyncedAt(now);
          setLastSyncedAt(now);
          setErrorMessage(null);
          await refresh();
        }
      });
    }, [refresh])
  );

  const handleConnect = useCallback(async (platform: 'apple' | 'google') => {
    setStatus('requesting');
    setErrorMessage(null);

    const permResult = await requestHealthPermissions(platform);
    if (!permResult.granted) {
      setStatus('error');
      setErrorMessage(getErrorMessage(permResult.error));
      return;
    }

    setStatus('fetching');
    const fetchResult = await fetchHealthData(platform);

    if (fetchResult.error && fetchResult.data.length === 0) {
      setStatus('error');
      setErrorMessage(getErrorMessage(fetchResult.error));
      return;
    }

    const now = new Date().toISOString();
    await Storage.setWearableData(fetchResult.data);
    await saveHealthConnection({ connected: true, platform, connectedAt: now });
    await saveLastSyncedAt(now);
    setHealthData(fetchResult.data);
    setConnectedPlatform(platform);
    setStatus('connected');
    setLastSyncedAt(now);
    await refresh();
  }, [refresh]);

  const handleRefresh = useCallback(async () => {
    if (!connectedPlatform) return;
    setStatus('fetching');
    setErrorMessage(null);

    const fetchResult = await fetchHealthData(connectedPlatform);
    if (fetchResult.error && fetchResult.data.length === 0) {
      setStatus('connected');
      setErrorMessage(getErrorMessage(fetchResult.error));
      return;
    }
    const now = new Date().toISOString();
    await Storage.setWearableData(fetchResult.data);
    await saveLastSyncedAt(now);
    setHealthData(fetchResult.data);
    setStatus('connected');
    setLastSyncedAt(now);
    setErrorMessage(null);
    await refresh();
  }, [connectedPlatform, refresh]);

  const handleDisconnect = useCallback(async () => {
    await clearHealthConnection();
    await clearLastSyncedAt();
    await Storage.setWearableData([]);
    setConnectedPlatform(null);
    setHealthData([]);
    setStatus('idle');
    setErrorMessage(null);
    setLastSyncedAt(null);
    await refresh();
  }, [refresh]);

  const sortedData = useMemo(() => {
    return [...healthData].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [healthData]);

  const last7 = useMemo(() => sortedData.slice(-7), [sortedData]);
  const todayData = last7.length > 0 ? last7[last7.length - 1] : null;

  const heartRates = last7.map((d) => d.heartRate ?? 0).filter((v) => v > 0);
  const hrvValues = last7.map((d) => d.hrv ?? 0).filter((v) => v > 0);

  const insights = useMemo(() => {
    if (last7.length < 2) return [];
    const result: { icon: keyof typeof Feather.glyphMap; color: string; text: string }[] = [];
    if (hrvValues.length >= 2) {
      const first = hrvValues[0];
      const last = hrvValues[hrvValues.length - 1];
      const change = Math.round(((last - first) / first) * 100);
      if (change > 0) {
        result.push({
          icon: 'trending-up',
          color: Colors.success,
          text: `Your HRV has increased ${change}% this week, suggesting improved stress resilience`,
        });
      }
    }
    if (todayData?.restingHeartRate && todayData.restingHeartRate < 75) {
      result.push({
        icon: 'heart',
        color: Colors.accent,
        text: 'Your resting heart rate is in a healthy range',
      });
    }
    const sleepValues = last7.map((d) => d.sleepHours ?? 0).filter((v) => v > 0);
    if (sleepValues.length >= 3) {
      const stdDev = Math.sqrt(
        sleepValues.reduce((s, v) => s + Math.pow(v - sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length, 2), 0) / sleepValues.length
      );
      if (stdDev < 1.2) {
        result.push({
          icon: 'moon',
          color: Colors.secondary,
          text: 'Sleep consistency has improved, great for emotional regulation',
        });
      }
    }
    return result;
  }, [last7, hrvValues, todayData]);

  const stepsGoal = 10000;
  const stepsProgress = todayData?.steps ? todayData.steps / stepsGoal : 0;

  const sleepQuality = todayData?.sleepHours
    ? todayData.sleepHours >= 7
      ? 'Good'
      : todayData.sleepHours >= 6
      ? 'Fair'
      : 'Low'
    : '';

  const hrTrend = heartRates.length >= 2
    ? heartRates[heartRates.length - 1] - heartRates[heartRates.length - 2]
    : 0;

  const connectedDeviceName = connectedPlatform === 'apple' ? 'Apple Health' : connectedPlatform === 'google' ? 'Health Connect' : null;

  const lastSyncedLabel = useMemo(() => {
    if (!lastSyncedAt) return null;
    const diff = Date.now() - new Date(lastSyncedAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Synced just now';
    if (mins === 1) return 'Synced 1 min ago';
    if (mins < 60) return `Synced ${mins} mins ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs === 1) return 'Synced 1 hr ago';
    return `Synced ${hrs} hrs ago`;
  }, [lastSyncedAt, tick]);

  const renderHeader = () => (
    <LinearGradient
      colors={[Colors.primary, Colors.primaryDark]}
      style={[styles.headerGradient, headerShadow, { paddingTop: topPadding + 16 }]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
          <Text style={styles.backBtnTextWhite}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Data</Text>
        <Feather name="heart" size={22} color="#FFFFFF" />
      </View>
    </LinearGradient>
  );

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 40 }]} showsVerticalScrollIndicator={false}>
          {renderHeader()}
          <View style={[styles.premiumGate, cardShadow]}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.premiumGateGradient}>
              <Feather name="lock" size={32} color="#FFFFFF" />
              <Text style={styles.premiumGateTitle}>Premium Feature</Text>
              <Text style={styles.premiumGateDesc}>
                Connect Apple Health or Google Fit to sync your heart rate, HRV, sleep, and activity data with your Interosense practice.
              </Text>
              <TouchableOpacity
                style={styles.premiumGateBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/premium' as any)}
              >
                <Text style={styles.premiumGateBtnText}>Unlock with Premium</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 40 }]} showsVerticalScrollIndicator={false}>
          {renderHeader()}
          <View style={[styles.connectionCard, cardShadow]}>
            <View style={styles.webMessageRow}>
              <View style={[styles.webIconCircle, { backgroundColor: `${Colors.primary}15` }]}>
                <Feather name="smartphone" size={28} color={Colors.primary} />
              </View>
              <Text style={styles.webMessageTitle}>Available on Mobile</Text>
              <Text style={styles.webMessageBody}>
                Health data integration with Apple Health and Google Fit is available on the iOS and Android apps. Open Interosense on your phone to connect your health data.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}

        {status === 'connected' && connectedDeviceName ? (
          <View style={[styles.connectionCard, cardShadow]}>
            <View style={styles.connectedRow}>
              <View style={styles.connectedDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.connectedLabel}>Connected</Text>
                <Text style={styles.connectedDevice}>{connectedDeviceName}</Text>
                {lastSyncedLabel ? (
                  <Text style={styles.lastSyncedText}>{lastSyncedLabel}</Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={handleRefresh} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginRight: 12 }}>
                <Feather name="refresh-cw" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDisconnect} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x-circle" size={20} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>
            {errorMessage ? (
              <View style={styles.inlineErrorBox}>
                <Feather name="alert-circle" size={14} color={Colors.error} style={{ marginRight: 6, flexShrink: 0 }} />
                <Text style={styles.inlineErrorText}>{errorMessage}</Text>
              </View>
            ) : null}
          </View>
        ) : status === 'requesting' || status === 'fetching' ? (
          <View style={[styles.connectionCard, cardShadow]}>
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>
                {status === 'requesting' ? 'Requesting permission...' : 'Syncing health data...'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.connectionCard, cardShadow]}>
            <Text style={styles.connectTitle}>Connect Your Health App</Text>
            <Text style={styles.connectSubtitle}>
              Sync your heart rate, HRV, sleep, and step data from your phone or wearable
            </Text>
            {status === 'error' && errorMessage ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={16} color={Colors.error} style={{ marginRight: 8, flexShrink: 0 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}
            <View style={styles.deviceList}>
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.deviceButton}
                  onPress={() => handleConnect('apple')}
                  activeOpacity={0.7}
                  testID="connect-apple-health"
                >
                  <View style={styles.deviceIconCircle}>
                    <Feather name="smartphone" size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.deviceName}>Apple Health</Text>
                  <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
                </TouchableOpacity>
              )}
              {Platform.OS === 'android' && (
                <TouchableOpacity
                  style={styles.deviceButton}
                  onPress={() => handleConnect('google')}
                  activeOpacity={0.7}
                  testID="connect-google-fit"
                >
                  <View style={styles.deviceIconCircle}>
                    <Feather name="activity" size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.deviceName}>Health Connect</Text>
                  <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {status === 'connected' && last7.length === 0 && (
          <View style={[styles.emptyState, cardShadow]}>
            <Feather name="watch" size={32} color={Colors.textTertiary} />
            <Text style={styles.emptyStateTitle}>No data yet</Text>
            <Text style={styles.emptyStateBody}>Wear your device today and your data will appear here.</Text>
          </View>
        )}

        {todayData && (
          <>
            <Text style={styles.sectionTitle}>Today's Metrics</Text>
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, cardShadow]}>
                <View style={styles.metricHeader}>
                  <View style={[styles.metricIconCircle, { backgroundColor: `${Colors.accent}20` }]}>
                    <Feather name="heart" size={16} color={Colors.accent} />
                  </View>
                  {hrTrend !== 0 && (
                    <View style={styles.trendBadge}>
                      <Feather
                        name={hrTrend > 0 ? 'trending-up' : 'trending-down'}
                        size={12}
                        color={hrTrend > 0 ? Colors.warning : Colors.success}
                      />
                    </View>
                  )}
                </View>
                <Text style={styles.metricValue}>{todayData.heartRate ?? '--'}</Text>
                <Text style={styles.metricUnit}>bpm</Text>
                <Text style={styles.metricLabel}>Heart Rate</Text>
              </View>

              <View style={[styles.metricCard, cardShadow]}>
                <View style={styles.metricHeader}>
                  <View style={[styles.metricIconCircle, { backgroundColor: `${Colors.secondary}20` }]}>
                    <Feather name="activity" size={16} color={Colors.secondary} />
                  </View>
                </View>
                <Text style={styles.metricValue}>{todayData.hrv ?? '--'}</Text>
                <Text style={styles.metricUnit}>ms</Text>
                <Text style={styles.metricLabel}>HRV</Text>
              </View>

              <View style={[styles.metricCard, cardShadow]}>
                <View style={styles.metricHeader}>
                  <View style={[styles.metricIconCircle, { backgroundColor: `${Colors.primary}20` }]}>
                    <Feather name="navigation" size={16} color={Colors.primary} />
                  </View>
                  <View style={styles.ringWrap}>
                    <ProgressRing progress={stepsProgress} size={28} color={Colors.primary} />
                  </View>
                </View>
                <Text style={styles.metricValue}>
                  {todayData.steps ? todayData.steps.toLocaleString() : '--'}
                </Text>
                <Text style={styles.metricUnit}>steps</Text>
                <Text style={styles.metricLabel}>Steps</Text>
              </View>

              <View style={[styles.metricCard, cardShadow]}>
                <View style={styles.metricHeader}>
                  <View style={[styles.metricIconCircle, { backgroundColor: `${Colors.primaryLight}20` }]}>
                    <Feather name="moon" size={16} color={Colors.primaryLight} />
                  </View>
                  {sleepQuality ? (
                    <View
                      style={[
                        styles.qualityBadge,
                        {
                          backgroundColor:
                            sleepQuality === 'Good'
                              ? `${Colors.success}18`
                              : sleepQuality === 'Fair'
                              ? `${Colors.warning}18`
                              : `${Colors.error}18`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.qualityText,
                          {
                            color:
                              sleepQuality === 'Good'
                                ? Colors.success
                                : sleepQuality === 'Fair'
                                ? Colors.warning
                                : Colors.error,
                          },
                        ]}
                      >
                        {sleepQuality}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.metricValue}>{todayData.sleepHours ?? '--'}</Text>
                <Text style={styles.metricUnit}>hrs</Text>
                <Text style={styles.metricLabel}>Sleep</Text>
              </View>
            </View>

            {heartRates.length >= 2 && (
              <>
                <Text style={styles.sectionTitle}>7-Day Trends</Text>
                <MiniChart data={heartRates} color={Colors.accent} label="Heart Rate" unit="bpm" />
                {hrvValues.length >= 2 && (
                  <MiniChart data={hrvValues} color={Colors.secondary} label="HRV" unit="ms" />
                )}
              </>
            )}

            {insights.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Insights</Text>
                {insights.map((insight, i) => (
                  <View key={i} style={[styles.insightCard, cardShadow]}>
                    <View style={[styles.insightIconCircle, { backgroundColor: `${insight.color}18` }]}>
                      <Feather name={insight.icon} size={18} color={insight.color} />
                    </View>
                    <Text style={styles.insightText}>{insight.text}</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerGradient: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtnTextWhite: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  connectionCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
  },
  connectTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: 6,
  },
  connectSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  deviceList: {
    marginTop: 16,
  },
  deviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  deviceIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${Colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  deviceName: {
    flex: 1,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: Colors.text,
  },
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    marginRight: 12,
  },
  connectedLabel: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
    color: Colors.success,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  connectedDevice: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: Colors.text,
    marginTop: 2,
  },
  lastSyncedText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  inlineErrorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${Colors.error}10`,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  inlineErrorText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.error,
    flex: 1,
    lineHeight: 18,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${Colors.error}10`,
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  errorText: {
    flex: 1,
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.error,
    lineHeight: 18,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptyStateTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 17,
    color: Colors.text,
    marginTop: 4,
  },
  emptyStateBody: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  premiumGate: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  premiumGateGradient: {
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  premiumGateTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  premiumGateDesc: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 21,
  },
  premiumGateBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  premiumGateBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: Colors.primary,
  },
  webMessageRow: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 8,
  },
  webIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webMessageTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: Colors.text,
  },
  webMessageBody: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: Colors.text,
    marginTop: 28,
    marginBottom: 14,
    marginHorizontal: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 14,
    gap: 12,
  },
  metricCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    width: '46%' as any,
    flexGrow: 1,
    minWidth: 140,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
    color: Colors.text,
  },
  metricUnit: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: -2,
  },
  metricLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  trendBadge: {
    padding: 4,
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  qualityText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
  },
  chartCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: Colors.text,
  },
  chartUnit: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
    color: Colors.textTertiary,
  },
  insightCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  insightText: {
    flex: 1,
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});
