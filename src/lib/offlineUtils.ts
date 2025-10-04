// offlineUtils.ts
// Utility functions for offline counter logic

export function normalizeUserName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: NodeJS.Timeout | null = null;
  return ((...args: any[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

export function isDataStale(lastSync: number, thresholdMs: number = 5 * 60 * 1000): boolean {
  return Date.now() - lastSync > thresholdMs;
}

export function getLocalStorageItem<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    if (data) return JSON.parse(data) as T;
  } catch {}
  return fallback;
}

export function setLocalStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
