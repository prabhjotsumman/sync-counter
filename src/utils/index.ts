/**
 * Utility functions for the shared counter application
 *
 * This file contains reusable utility functions that are used across
 * multiple components and modules for consistency and maintainability.
 */

import type { Counter } from '@/types';

// ============================================================================
// COUNTER UTILITIES
// ============================================================================

/**
 * Determines if a counter has an active daily goal
 * @param counter - The counter object to check
 * @returns True if counter has a valid daily goal
 */
export const hasDailyGoal = (counter: Counter): boolean => {
  return typeof counter.dailyGoal === 'number' && counter.dailyGoal > 0;
};

/**
 * Calculates progress bar value with fallback
 * @param counter - The counter object
 * @returns Safe numeric value for progress calculation
 */
export const getProgressValue = (counter: Counter): number => {
  return Number(counter.dailyCount) || 0;
};

/**
 * Generates dynamic CSS classes based on counter state
 * @param isOffline - Whether the app is currently offline
 * @param baseClasses - Base CSS classes to apply
 * @returns Combined CSS class string
 */
export const getDynamicClasses = (isOffline: boolean, baseClasses: string = ''): string => {
  const offlineClasses = isOffline ? 'ring-2 ring-yellow-500 ring-opacity-30' : '';
  return [baseClasses, offlineClasses].filter(Boolean).join(' ');
};

/**
 * Calculates progress percentage for a counter
 * @param counter - The counter object
 * @returns Progress percentage (0-100)
 */
export const getProgressPercentage = (counter: Counter): number => {
  if (!hasDailyGoal(counter)) return 0;
  return Math.min(100, Math.round((getProgressValue(counter) / counter.dailyGoal!) * 100));
};

/**
 * Determines if a counter's daily goal has been achieved
 * @param counter - The counter object
 * @returns True if daily goal is met
 */
export const isGoalAchieved = (counter: Counter): boolean => {
  return hasDailyGoal(counter) && getProgressValue(counter) >= counter.dailyGoal!;
};

/**
 * Gets the remaining count needed to reach daily goal
 * @param counter - The counter object
 * @returns Remaining count or 0 if goal is achieved
 */
export const getRemainingCount = (counter: Counter): number => {
  if (!hasDailyGoal(counter) || isGoalAchieved(counter)) return 0;
  return Math.max(0, counter.dailyGoal! - getProgressValue(counter));
};

// ============================================================================
// DATE/TIME UTILITIES
// ============================================================================

/**
 * Gets today's date in UTC using YYYY-MM-DD format
 * @returns Today's date string in YYYY-MM-DD format (UTC)
 */
export const getTodayString = (): string => {
  // Use UTC time to avoid timezone issues for global users
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Finds a counter by ID in an array of counters
 * @param counters - Array of counters to search
 * @param id - Counter ID to find
 * @returns Counter object or undefined if not found
 */
export const findCounterById = (counters: Counter[], id: string): Counter | undefined => {
  return counters.find(counter => counter.id === id);
};

/**
 * Sorts counters by name in ascending order
 * @param counters - Array of counters to sort
 * @returns Sorted array of counters
 */
export const sortCountersByName = (counters: Counter[]): Counter[] => {
  return [...counters].sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Filters counters by search term
 * @param counters - Array of counters to filter
 * @param searchTerm - Search term to filter by
 * @returns Filtered array of counters
 */
export const filterCountersBySearch = (counters: Counter[], searchTerm: string): Counter[] => {
  if (!searchTerm.trim()) return counters;

  const term = searchTerm.toLowerCase();
  return counters.filter(counter =>
    counter.name.toLowerCase().includes(term) ||
    counter.id.toLowerCase().includes(term)
  );
};

// ============================================================================
// USER COLOR UTILITIES
// ============================================================================

/**
 * Available color options for user selection
 */
export const USER_COLOR_OPTIONS = [
  '#60A5FA', // blue-400 — calm, friendly
  '#F87171', // red-400 — softer red
  '#34D399', // emerald-400 — fresh green
  '#FBBF24', // amber-400 — warm yellow-gold
  '#A78BFA', // violet-400 — gentle purple
  '#F472B6', // pink-400 — pleasant pink
  '#22D3EE', // cyan-400 — clean teal-blue
  '#A3E635', // lime-400 — energetic lime
  '#FB923C', // orange-400 — lively but not harsh
  '#818CF8', // indigo-400 — modern and smooth
];

/**
 * Gets the stored color for a specific user
 * @param username - The username to get color for
 * @returns The user's color or default blue if not found
 */
export const getUserColor = (username: string): string => {
  if (typeof window === 'undefined') return '#3B82F6';

  try {
    const userColors = JSON.parse(localStorage.getItem('syncCounterUserColors') || '{}');
    return userColors[username] || '#3B82F6';
  } catch {
    return '#3B82F6';
  }
};

/**
 * Sets the color for a specific user
 * @param username - The username to set color for
 * @param color - The color hex code
 */
export const setUserColor = (username: string, color: string): void => {
  if (typeof window === 'undefined') return;

  try {
    const userColors = JSON.parse(localStorage.getItem('syncCounterUserColors') || '{}');
    userColors[username] = color;
    localStorage.setItem('syncCounterUserColors', JSON.stringify(userColors));
  } catch (error) {
    console.error('Failed to save user color:', error);
  }
};

/**
 * Gets all user colors
 * @returns Object mapping usernames to their colors
 */
export const getAllUserColors = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};

  try {
    return JSON.parse(localStorage.getItem('syncCounterUserColors') || '{}');
  } catch {
    return {};
  }
};

/**
 * Removes a user's color
 * @param username - The username to remove color for
 */
export const removeUserColor = (username: string): void => {
  if (typeof window === 'undefined') return;

  try {
    const userColors = JSON.parse(localStorage.getItem('syncCounterUserColors') || '{}');
    delete userColors[username];
    localStorage.setItem('syncCounterUserColors', JSON.stringify(userColors));
  } catch (error) {
    console.error('Failed to remove user color:', error);
  }
};

/**
 * Clears all user colors
 */
export const clearAllUserColors = (): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('syncCounterUserColors');
  } catch (error) {
    console.error('Failed to clear user colors:', error);
  }
};

/**
 * Converts hex color to HSL values
 * @param hex - Hex color string (e.g., "#ff0000")
 * @returns HSL values as [hue, saturation, lightness]
 */
export const hexToHsl = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
};

/**
 * Converts HSL values to hex color
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns Hex color string
 */
export const hslToHex = (h: number, s: number, l: number): string => {
  h /= 360;
  s /= 100;
  l /= 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // Achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Generates a lighter or darker shade of a given color using HSL
 * @param color - Base color in hex format
 * @param percent - Percentage to lighten (positive) or darken (negative)
 * @returns Modified color in hex format
 */
export const shadeColor = (color: string, percent: number): string => {
  const [h, s, l] = hexToHsl(color);

  // Adjust lightness while maintaining saturation and hue
  const newLightness = Math.max(10, Math.min(90, l + percent));

  return hslToHex(h, s, newLightness);
};

/**
 * Generates distinct shades for users with the same color
 * @param baseColor - The base color to generate shades from
 * @param shadeIndex - Index of the shade (0 = base, 1 = lighter, 2 = darker, etc.)
 * @returns A shade of the base color
 */
export const generateColorShade = (baseColor: string, shadeIndex: number): string => {
  if (shadeIndex === 0) return baseColor;

  const [h, s, l] = hexToHsl(baseColor);

  // Modern shade generation using color theory
  let newLightness: number;
  let newSaturation: number = s;

  switch (shadeIndex) {
    case 1:
      // Lighter shade - increase lightness, slightly reduce saturation for softer look
      newLightness = Math.min(85, l + 25);
      newSaturation = Math.max(40, s - 10);
      break;
    case 2:
      // Darker shade - decrease lightness, maintain saturation
      newLightness = Math.max(20, l - 25);
      newSaturation = Math.min(90, s + 5);
      break;
    case 3:
      // Much lighter - pastel-like shade
      newLightness = Math.min(90, l + 35);
      newSaturation = Math.max(35, s - 15);
      break;
    case 4:
      // Much darker - deeper shade
      newLightness = Math.max(15, l - 35);
      newSaturation = Math.min(95, s + 10);
      break;
    case 5:
      // Complementary hue variation (shift hue by 30 degrees)
      newLightness = Math.max(25, Math.min(75, l));
      newSaturation = Math.min(85, s + 5);
      return hslToHex((h + 30) % 360, newSaturation, newLightness);
    case 6:
      // Opposite complementary hue variation (shift hue by -30 degrees)
      newLightness = Math.max(25, Math.min(75, l));
      newSaturation = Math.min(85, s + 5);
      return hslToHex((h + 330) % 360, newSaturation, newLightness);
    default:
      // For more users, use modern color variations
      const variationIndex = ((shadeIndex - 1) % 6) + 1;
      return generateModernColorVariation(baseColor, variationIndex);
  }

  return hslToHex(h, newSaturation, newLightness);
};

/**
 * Generates modern color variations using color theory principles
 * @param baseColor - The base color to generate variations from
 * @param variationIndex - Index of the variation (1-6 for different types)
 * @returns A modern variation of the base color
 */
export const generateModernColorVariation = (baseColor: string, variationIndex: number): string => {
  const [h, s, l] = hexToHsl(baseColor);

  switch (variationIndex) {
    case 1: // Analogous (hue + 30°)
      return hslToHex((h + 30) % 360, Math.min(90, s + 5), Math.max(30, Math.min(70, l)));
    case 2: // Analogous (hue - 30°)
      return hslToHex((h + 330) % 360, Math.min(90, s + 5), Math.max(30, Math.min(70, l)));
    case 3: // Triadic (hue + 120°)
      return hslToHex((h + 120) % 360, Math.min(85, s + 10), Math.max(35, Math.min(65, l)));
    case 4: // Triadic (hue - 120°)
      return hslToHex((h + 240) % 360, Math.min(85, s + 10), Math.max(35, Math.min(65, l)));
    case 5: // Complementary (hue + 180°)
      return hslToHex((h + 180) % 360, Math.min(80, s + 15), Math.max(40, Math.min(60, l)));
    case 6: // Split-complementary (hue + 150°)
      return hslToHex((h + 150) % 360, Math.min(85, s + 10), Math.max(35, Math.min(65, l)));
    default:
      return baseColor;
  }
};

/**
 * Gets a unique color for a user in a specific context (e.g., progress bar)
 * Handles conflicts by generating shades when multiple users have the same color
 * @param username - The username to get color for
 * @param allUsers - Array of all usernames in the context
 * @returns A unique color (potentially a shade) for the user
 */
export const getUniqueUserColor = (username: string, allUsers: string[]): string => {
  const baseColor = getUserColor(username);
  const colorCounts: Record<string, string[]> = {};

  // Count how many users have each color
  allUsers.forEach(user => {
    const userColor = getUserColor(user);
    if (!colorCounts[userColor]) {
      colorCounts[userColor] = [];
    }
    colorCounts[userColor].push(user);
  });

  // If this color is only used by one user, return the base color
  if (colorCounts[baseColor].length === 1) {
    return baseColor;
  }

  // Find the index of this user among users with the same color
  const usersWithSameColor = colorCounts[baseColor];
  const userIndex = usersWithSameColor.indexOf(username);

  // Generate a shade based on the user's position
  return generateColorShade(baseColor, userIndex);
};

/**
 * Gets the current user from context or localStorage
 * @param contextUser - Optional user from context (takes precedence)
 * @returns The current user or null if none found
 */
export const getCurrentUser = (contextUser?: string | null): string | null => {
  if (contextUser) return contextUser;

  // Check if we're in a browser environment before accessing localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('syncCounterUser') ?? null;
  }

  return null;
};

/**
 * Checks if the current user has interacted with a counter today
 * @param counter - The counter to check
 * @param contextUser - Optional user from context (takes precedence)
 * @returns true if current user has contributed to this counter today
 */
export const hasCurrentUserInteractedToday = (counter: Counter, contextUser?: string | null): boolean => {
  const currentUser = getCurrentUser(contextUser);
  if (!currentUser) return false;

  const today = getTodayString();
  const todayHistory = counter.history?.[today];

  // Check today's history first
  if (todayHistory?.users?.[currentUser] && todayHistory.users[currentUser] > 0) {
    return true;
  }

  // Fallback to current users object (legacy support)
  return !!(counter.users?.[currentUser] && counter.users[currentUser] > 0);
};

/**
 * Checks if the current user has ever interacted with a counter
 * @param counter - The counter to check
 * @param contextUser - Optional user from context (takes precedence)
 * @returns true if current user has contributed to this counter at any time
 */
export const hasCurrentUserInteractedEver = (counter: Counter, contextUser?: string | null): boolean => {
  const currentUser = getCurrentUser(contextUser);
  if (!currentUser) return false;

  // Check today's contributions
  if (hasCurrentUserInteractedToday(counter, contextUser)) return true;

  // Check historical contributions (all days)
  if (counter.history) {
    for (const dayHistory of Object.values(counter.history)) {
      if (dayHistory.users?.[currentUser] && dayHistory.users[currentUser] > 0) {
        return true;
      }
    }
  }

  // Check current users object (legacy support)
  return !!(counter.users?.[currentUser] && counter.users[currentUser] > 0);
};

/**
 * Gets the current user's total contribution to a counter
 * @param counter - The counter to check
 * @param contextUser - Optional user from context (takes precedence)
 * @returns The total number of contributions from current user
 */
export const getCurrentUserContribution = (counter: Counter, contextUser?: string | null): number => {
  const currentUser = getCurrentUser(contextUser);
  if (!currentUser) return 0;

  let total = 0;

  // Count today's contributions
  if (hasCurrentUserInteractedToday(counter, contextUser)) {
    const today = getTodayString();
    total += counter.history?.[today]?.users?.[currentUser] || 0;
  }

  // Count historical contributions
  if (counter.history) {
    for (const dayHistory of Object.values(counter.history)) {
      total += dayHistory.users?.[currentUser] || 0;
    }
  }

  // Add current users object contributions (legacy support)
  total += counter.users?.[currentUser] || 0;

  return total;
};

/**
 * Sorts counters so that current user's active counters appear first
 * @param counters - Array of counters to sort
 * @param contextUser - Optional user from context (takes precedence)
 * @returns Sorted array with current user's counters prioritized
 */
export const sortCountersByUserActivity = (counters: Counter[], contextUser?: string | null): Counter[] => {
  const currentUser = getCurrentUser(contextUser);
  if (!currentUser) return counters;

  return [...counters].sort((a, b) => {
    const aHasInteracted = hasCurrentUserInteractedEver(a, contextUser);
    const bHasInteracted = hasCurrentUserInteractedEver(b, contextUser);

    // If one has interaction and the other doesn't, prioritize the one with interaction
    if (aHasInteracted && !bHasInteracted) return -1;
    if (!aHasInteracted && bHasInteracted) return 1;

    // If both have interaction or both don't, sort by total contribution (descending)
    const aContribution = getCurrentUserContribution(a, contextUser);
    const bContribution = getCurrentUserContribution(b, contextUser);

    if (aContribution !== bContribution) {
      return bContribution - aContribution; // Higher contribution first
    }

    // If contributions are equal, sort by recent activity (today's contribution)
    const aTodayContribution = getCurrentUserContributionToday(a, contextUser);
    const bTodayContribution = getCurrentUserContributionToday(b, contextUser);

    if (aTodayContribution !== bTodayContribution) {
      return bTodayContribution - aTodayContribution; // More recent activity first
    }

    // If still equal, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });
};

/**
 * Gets the current user's contribution to a counter today
 * @param counter - The counter to check
 * @param contextUser - Optional user from context (takes precedence)
 * @returns The number of contributions from current user today
 */
export const getCurrentUserContributionToday = (counter: Counter, contextUser?: string | null): number => {
  const currentUser = getCurrentUser(contextUser);
  if (!currentUser) return 0;

  const today = getTodayString();
  const todayHistory = counter.history?.[today];

  if (todayHistory?.users?.[currentUser]) {
    return todayHistory.users[currentUser];
  }

  // Fallback to current users object if it represents today's count
  return counter.users?.[currentUser] || 0;
};
