import { Platform } from 'react-native';

function getApiBase(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // On web the Expo app is always served from the same Express server,
    // so use same-origin (relative) URLs regardless of the domain.
    return '';
  }
  // Native: point at the configured domain or local dev server.
  return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : 'http://localhost:5000';
}

export async function apiPost(path: string, body: unknown): Promise<void> {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`POST ${path} failed (${res.status}): ${text}`);
  }
}

export async function apiPostJson<T = unknown>(path: string, body: unknown): Promise<T> {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = data.message || data.error || message;
    } catch {}
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function apiPut(path: string, body: unknown): Promise<void> {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`PUT ${path} failed (${res.status}): ${text}`);
  }
}
