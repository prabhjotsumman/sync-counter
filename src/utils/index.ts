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
 * Generates a lighter or darker shade of a given color
 * @param color - Base color in hex format
 * @param percent - Percentage to lighten (positive) or darken (negative)
 * @returns Modified color in hex format
 */
export const shadeColor = (color: string, percent: number): string => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
};

/**
 * Generates distinct shades for users with the same color
 * @param baseColor - The base color to generate shades from
 * @param shadeIndex - Index of the shade (0 = base, 1 = lighter, 2 = darker, etc.)
 * @returns A shade of the base color
 */
export const generateColorShade = (baseColor: string, shadeIndex: number): string => {
  if (shadeIndex === 0) return baseColor;

  // Alternate between lighter and darker shades
  const percent = shadeIndex % 2 === 1
    ? 30 + (shadeIndex * 15)  // Lighter shades: 30%, 45%, 60%, etc.
    : -(20 + (shadeIndex * 10)); // Darker shades: -20%, -30%, -40%, etc.

  return shadeColor(baseColor, percent);
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
