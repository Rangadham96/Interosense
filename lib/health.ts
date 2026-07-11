import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WearableDataPoint } from '@/lib/storage';

const HEALTH_KEY = '@interosense:health_connection';
const LAST_SYNC_KEY = '@interosense:health_last_synced';

export type HealthPlatform = 'apple' | 'google' | null;

export interface HealthConnectionState {
  connected: boolean;
  platform: HealthPlatform;
  connectedAt?: string;
}

export interface HealthFetchResult {
  data: WearableDataPoint[];
  error?: string;
}

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export async function getHealthConnection(): Promise<HealthConnectionState> {
  try {
    const raw = await AsyncStorage.getItem(HEALTH_KEY);
    if (!raw) return { connected: false, platform: null };
    return JSON.parse(raw);
  } catch {
    return { connected: false, platform: null };
  }
}

export async function saveHealthConnection(state: HealthConnectionState): Promise<void> {
  await AsyncStorage.setItem(HEALTH_KEY, JSON.stringify(state));
}

export async function clearHealthConnection(): Promise<void> {
  await AsyncStorage.removeItem(HEALTH_KEY);
}

export async function getLastSyncedAt(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

export async function saveLastSyncedAt(isoString: string): Promise<void> {
  await AsyncStorage.setItem(LAST_SYNC_KEY, isoString);
}

export async function clearLastSyncedAt(): Promise<void> {
  await AsyncStorage.removeItem(LAST_SYNC_KEY);
}

export async function requestHealthPermissions(platform: 'apple' | 'google'): Promise<{ granted: boolean; error?: string }> {
  if (Platform.OS === 'web') {
    return { granted: false, error: 'web' };
  }

  if (Platform.OS === 'ios' && platform === 'apple') {
    try {
      const AppleHealthKit = require('react-native-health');
      const permissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.HeartRate,
            AppleHealthKit.Constants.Permissions.HeartRateVariability,
            AppleHealthKit.Constants.Permissions.SleepAnalysis,
            AppleHealthKit.Constants.Permissions.StepCount,
            AppleHealthKit.Constants.Permissions.RestingHeartRate,
          ],
          write: [],
        },
      };
      return await new Promise((resolve) => {
        AppleHealthKit.initHealthKit(permissions, (err: Error) => {
          if (err) {
            resolve({ granted: false, error: err.message });
          } else {
            resolve({ granted: true });
          }
        });
      });
    } catch {
      return { granted: false, error: 'native-module-required' };
    }
  }

  if (Platform.OS === 'android' && platform === 'google') {
    try {
      const { initialize, requestPermission } = require('react-native-health-connect');
      await initialize();
      const requested = [
        { accessType: 'read', recordType: 'HeartRate' },
        { accessType: 'read', recordType: 'HeartRateVariabilityRmssd' },
        { accessType: 'read', recordType: 'SleepSession' },
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'RestingHeartRate' },
      ];
      const granted: { accessType: string; recordType: string }[] = await requestPermission(requested);
      return { granted: granted.length > 0 };
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('HEALTH_CONNECT_NOT_INSTALLED') || msg.includes('not installed') || msg.includes('not found')) {
        return { granted: false, error: 'health-connect-not-installed' };
      }
      return { granted: false, error: 'native-module-required' };
    }
  }

  return { granted: false, error: 'unsupported-platform' };
}

export async function fetchAppleHealthData(): Promise<HealthFetchResult> {
  try {
    const AppleHealthKit = require('react-native-health');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDate = sevenDaysAgo.toISOString();
    const endDate = new Date().toISOString();

    const [hrSamples, hrvSamples, stepsSamples, sleepSamples, restingHrSamples] = await Promise.all([
      new Promise<any[]>((res) =>
        AppleHealthKit.getHeartRateSamples({ startDate, endDate, ascending: true }, (e: any, r: any) => res(e ? [] : r))
      ),
      new Promise<any[]>((res) =>
        AppleHealthKit.getHeartRateVariabilitySamples({ startDate, endDate, ascending: true }, (e: any, r: any) => res(e ? [] : r))
      ),
      new Promise<any[]>((res) =>
        AppleHealthKit.getDailyStepCountSamples({ startDate, endDate, ascending: true }, (e: any, r: any) => res(e ? [] : r))
      ),
      new Promise<any[]>((res) =>
        AppleHealthKit.getSleepSamples({ startDate, endDate, ascending: true }, (e: any, r: any) => res(e ? [] : r))
      ),
      new Promise<any[]>((res) =>
        AppleHealthKit.getRestingHeartRate({ startDate, endDate, ascending: true }, (e: any, r: any) => res(e ? [] : r))
      ),
    ]);

    const dayMap: Record<string, Partial<WearableDataPoint>> = {};

    hrSamples.forEach((s) => {
      const day = s.startDate.split('T')[0];
      if (!dayMap[day]) dayMap[day] = { timestamp: s.startDate };
      const existing = dayMap[day].heartRate;
      dayMap[day].heartRate = existing ? Math.round((existing + s.value) / 2) : Math.round(s.value);
    });

    hrvSamples.forEach((s) => {
      const day = s.startDate.split('T')[0];
      if (!dayMap[day]) dayMap[day] = { timestamp: s.startDate };
      const ms = Math.round(s.value * 1000);
      const existing = dayMap[day].hrv;
      dayMap[day].hrv = existing ? Math.round((existing + ms) / 2) : ms;
    });

    stepsSamples.forEach((s) => {
      const day = s.startDate.split('T')[0];
      if (!dayMap[day]) dayMap[day] = { timestamp: s.startDate };
      dayMap[day].steps = (dayMap[day].steps || 0) + Math.round(s.value);
    });

    sleepSamples.forEach((s) => {
      if (s.value !== 'ASLEEP') return;
      const day = s.startDate.split('T')[0];
      if (!dayMap[day]) dayMap[day] = { timestamp: s.startDate };
      const durationHrs = (new Date(s.endDate).getTime() - new Date(s.startDate).getTime()) / 3600000;
      dayMap[day].sleepHours = Math.round(((dayMap[day].sleepHours || 0) + durationHrs) * 10) / 10;
    });

    restingHrSamples.forEach((s) => {
      const day = s.startDate.split('T')[0];
      if (!dayMap[day]) dayMap[day] = { timestamp: s.startDate };
      dayMap[day].restingHeartRate = Math.round(s.value);
    });

    const data: WearableDataPoint[] = Object.entries(dayMap).map(([day, values]) => ({
      id: generateId(),
      timestamp: values.timestamp || `${day}T08:00:00.000Z`,
      heartRate: values.heartRate,
      hrv: values.hrv,
      steps: values.steps,
      sleepHours: values.sleepHours,
      restingHeartRate: values.restingHeartRate,
      source: 'healthkit' as const,
    }));

    data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return { data };
  } catch (e: any) {
    return { data: [], error: e?.message || 'fetch-failed' };
  }
}

export async function fetchAndroidHealthData(): Promise<HealthFetchResult> {
  try {
    const { readRecords } = require('react-native-health-connect');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startTime = sevenDaysAgo.toISOString();
    const endTime = new Date().toISOString();
    const timeRangeFilter = { operator: 'between', startTime, endTime };

    const [hrRecords, hrvRecords, stepsRecords, sleepRecords, restingHrRecords] = await Promise.all([
      readRecords('HeartRate', { timeRangeFilter }).catch(() => ({ records: [] })),
      readRecords('HeartRateVariabilityRmssd', { timeRangeFilter }).catch(() => ({ records: [] })),
      readRecords('Steps', { timeRangeFilter }).catch(() => ({ records: [] })),
      readRecords('SleepSession', { timeRangeFilter }).catch(() => ({ records: [] })),
      readRecords('RestingHeartRate', { timeRangeFilter }).catch(() => ({ records: [] })),
    ]);

    const dayMap: Record<string, Partial<WearableDataPoint>> = {};

    (hrRecords.records || []).forEach((r: any) => {
      const day = r.startTime.split('T')[0];
      if (!dayMap[day]) dayMap[day] = { timestamp: r.startTime };
      const samples: any[] = r.samples || [];
      if (samples.length > 0) {
        const avg = samples.reduce((s: number, x: any) => s + x.beatsPerMinute, 0) / samples.length;
        dayMap[day].heartRate = Math.round(avg);
      }
    });

    (hrvRecords.records || []).forEach((r: any) => {
      const day = r.time.split('T')[0];
      if (!dayMap[day]) dayMap[day] = { timestamp: r.time };
      dayMap[day].hrv = Math.round(r.heartRateVariabilityMillis);
    });

    (stepsRecords.records || []).forEach((r: any) => {
      const day = r.startTime.split('T')[0];
      if (!dayMap[day]) dayMap[day] = { timestamp: r.startTime };
      dayMap[day].steps = (dayMap[day].steps || 0) + (r.count || 0);
    });

    (sleepRecords.records || []).forEach((r: any) => {
      const day = r.startTime.split('T')[0];
      if (!dayMap[day]) dayMap[day] = { timestamp: r.startTime };
      const durationHrs = (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 3600000;
      dayMap[day].sleepHours = Math.round(((dayMap[day].sleepHours || 0) + durationHrs) * 10) / 10;
    });

    (restingHrRecords.records || []).forEach((r: any) => {
      const day = r.time.split('T')[0];
      if (!dayMap[day]) dayMap[day] = { timestamp: r.time };
      dayMap[day].restingHeartRate = Math.round(r.beatsPerMinute);
    });

    const data: WearableDataPoint[] = Object.entries(dayMap).map(([day, values]) => ({
      id: generateId(),
      timestamp: values.timestamp || `${day}T08:00:00.000Z`,
      heartRate: values.heartRate,
      hrv: values.hrv,
      steps: values.steps,
      sleepHours: values.sleepHours,
      restingHeartRate: values.restingHeartRate,
      source: 'health-connect' as const,
    }));

    data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return { data };
  } catch (e: any) {
    return { data: [], error: e?.message || 'fetch-failed' };
  }
}

export async function fetchHealthData(platform: HealthPlatform): Promise<HealthFetchResult> {
  if (!platform) return { data: [] };
  if (platform === 'apple') return fetchAppleHealthData();
  if (platform === 'google') return fetchAndroidHealthData();
  return { data: [] };
}

export function getWearableContext(data: WearableDataPoint[]): { avgHrv?: number; lastSleepHours?: number; avgSleep7d?: number } | null {
  const realData = data.filter((d) => d.source === 'healthkit' || d.source === 'health-connect');
  if (realData.length === 0) return null;
  const sorted = [...realData].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const last7 = sorted.slice(-7);

  const hrvValues = last7.map((d) => d.hrv).filter((v): v is number => v !== undefined && v > 0);
  const sleepValues = last7.map((d) => d.sleepHours).filter((v): v is number => v !== undefined && v > 0);
  const lastSleepHours = sleepValues.length > 0 ? sleepValues[sleepValues.length - 1] : undefined;
  const avgHrv = hrvValues.length > 0 ? Math.round(hrvValues.reduce((s, v) => s + v, 0) / hrvValues.length) : undefined;
  const avgSleep7d = sleepValues.length > 0 ? Math.round((sleepValues.reduce((s, v) => s + v, 0) / sleepValues.length) * 10) / 10 : undefined;

  if (avgHrv === undefined && lastSleepHours === undefined) return null;
  return { avgHrv, lastSleepHours, avgSleep7d };
}
