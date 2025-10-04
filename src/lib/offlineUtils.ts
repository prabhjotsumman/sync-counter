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

// User color management
const DEFAULT_USER_COLORS = [
  '#3B82F6', // blue-500
  '#EF4444', // red-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
  '#6366F1', // indigo-500
];

export function getUserColor(username: string): string {
  if (typeof window === 'undefined') return DEFAULT_USER_COLORS[0];
  
  try {
    const userColors = JSON.parse(localStorage.getItem('syncCounterUserColors') || '{}');
    if (userColors[username]) {
      return userColors[username];
    }
    
    // Assign a default color based on username hash
    const hash = username.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const colorIndex = Math.abs(hash) % DEFAULT_USER_COLORS.length;
    const assignedColor = DEFAULT_USER_COLORS[colorIndex];
    
    // Store the assigned color
    userColors[username] = assignedColor;
    localStorage.setItem('syncCounterUserColors', JSON.stringify(userColors));
    
    return assignedColor;
  } catch {
    return DEFAULT_USER_COLORS[0];
  }
}

export function setUserColor(username: string, color: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const userColors = JSON.parse(localStorage.getItem('syncCounterUserColors') || '{}');
    userColors[username] = color;
    localStorage.setItem('syncCounterUserColors', JSON.stringify(userColors));
  } catch {}
}

export function getAllUserColors(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  
  try {
    return JSON.parse(localStorage.getItem('syncCounterUserColors') || '{}');
  } catch {
    return {};
  }
}
