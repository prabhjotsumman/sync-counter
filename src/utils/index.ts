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
