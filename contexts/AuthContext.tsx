import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

function getApiBase() {
  // EXPO_PUBLIC_DOMAIN is injected by Metro at bundle time (set to $REPLIT_DEV_DOMAIN:5000)
  // Use it on all platforms when available so API calls always reach the backend
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { hostname, port } = window.location;
    // Serving directly from the backend on port 5000 — relative URLs work
    if (port === '5000') return '';
    // Local development pointing to local backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    // Deployed/hosted environment — assume same origin serves both app and API
    return '';
  }
  return 'http://localhost:5000';
}
const API_BASE = getApiBase();

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  provider: string | null;
  profileImage: string | null;
  conditions: string[] | null;
  experienceLevel: string | null;
  goals: string[] | null;
  dailyMinutes: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  bio: string | null;
  isPremium: boolean | null;
  stripeSubscriptionId: string | null;
  createdAt: string | null;
  interoceptiveBaseline?: Record<string, string> | null;
  onboardingPlan?: Record<string, unknown>[] | null;
}

export interface ServerSyncData {
  sessions: any[];
  checkins: any[];
  assessments: any[];
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; message?: string }>;
  loginWithSocial: (payload: { provider: string; idToken?: string; accessToken?: string; name?: string; email?: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateAuthProfile: (data: Partial<AuthUser>) => Promise<{ success: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
  fetchServerData: () => Promise<ServerSyncData | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function apiCall(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });
  return response;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await apiCall('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const fetchServerData = useCallback(async (): Promise<ServerSyncData | null> => {
    try {
      const [sessRes, checkRes, assessRes] = await Promise.all([
        apiCall('/api/sessions'),
        apiCall('/api/checkins'),
        apiCall('/api/assessments'),
      ]);

      if (!sessRes.ok || !checkRes.ok || !assessRes.ok) return null;

      const [sessData, checkData, assessData] = await Promise.all([
        sessRes.json(),
        checkRes.json(),
        assessRes.json(),
      ]);

      return {
        sessions: sessData.sessions ?? [],
        checkins: checkData.checkins ?? [],
        assessments: assessData.assessments ?? [],
      };
    } catch {
      return null;
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch {
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      const response = await apiCall('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, message: data.message || 'Registration failed' };
    } catch {
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  }, []);

  const loginWithSocial = useCallback(async (payload: { provider: string; idToken?: string; accessToken?: string; name?: string; email?: string }) => {
    try {
      const response = await apiCall('/api/auth/social', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, message: data.message || 'Sign-in failed' };
    } catch {
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiCall('/api/auth/logout', { method: 'POST' });
    } catch {}
    setUser(null);
    router.replace('/auth/login?from=logout');
  }, []);

  const updateAuthProfile = useCallback(async (data: Partial<AuthUser>) => {
    try {
      const response = await apiCall('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (response.ok) {
        setUser(result.user);
        return { success: true };
      }
      return { success: false, message: result.message };
    } catch {
      return { success: false, message: 'Network error' };
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    loginWithSocial,
    logout,
    updateAuthProfile,
    refreshUser,
    fetchServerData,
  }), [user, isLoading, login, register, loginWithSocial, logout, updateAuthProfile, refreshUser, fetchServerData]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
