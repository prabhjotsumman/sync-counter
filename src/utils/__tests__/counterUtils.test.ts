/**
 * @jest-environment jsdom
 */

import {
  hasDailyGoal,
  getProgressValue,
  getProgressPercentage,
  isGoalAchieved,
  getRemainingCount,
  getTodayString,
  validateCounterValue,
  validateDailyGoal,
  findCounterById,
  sortCountersByName,
  filterCountersBySearch,
} from '../../utils';

import type { Counter } from '../../lib/counters';

const mockCounter: Counter = {
  id: 'test-counter-1',
  name: 'Test Counter',
  value: 5,
  dailyCount: 3,
  dailyGoal: 10,
  users: { 'TestUser': 3 },
  history: {
    '2024-01-15': {
      users: { 'TestUser': 3 },
      total: 3,
      day: 'Monday'
    }
  }
};

const mockCounters: Counter[] = [
  { id: 'counter-1', name: 'Apple Counter', value: 5 },
  { id: 'counter-2', name: 'Banana Counter', value: 3 },
  { id: 'counter-3', name: 'Cherry Counter', value: 7 },
];

describe('Counter Utilities', () => {
  describe('hasDailyGoal', () => {
    it('returns true when counter has a valid daily goal', () => {
      expect(hasDailyGoal(mockCounter)).toBe(true);
    });

    it('returns false when dailyGoal is 0', () => {
      const counterWithoutGoal = { ...mockCounter, dailyGoal: 0 };
      expect(hasDailyGoal(counterWithoutGoal)).toBe(false);
    });

    it('returns false when dailyGoal is undefined', () => {
      const counterWithoutGoal = { ...mockCounter, dailyGoal: undefined };
      expect(hasDailyGoal(counterWithoutGoal)).toBe(false);
    });

    it('returns false when dailyGoal is null', () => {
      const counterWithoutGoal = { ...mockCounter, dailyGoal: null as any };
      expect(hasDailyGoal(counterWithoutGoal)).toBe(false);
    });
  });

  describe('getProgressValue', () => {
    it('returns dailyCount when it exists', () => {
      expect(getProgressValue(mockCounter)).toBe(3);
    });

    it('returns 0 when dailyCount is undefined', () => {
      const counterWithoutDailyCount = { ...mockCounter, dailyCount: undefined };
      expect(getProgressValue(counterWithoutDailyCount)).toBe(0);
    });

    it('returns 0 when dailyCount is null', () => {
      const counterWithoutDailyCount = { ...mockCounter, dailyCount: null as any };
      expect(getProgressValue(counterWithoutDailyCount)).toBe(0);
    });

    it('converts string dailyCount to number', () => {
      const counterWithStringDailyCount = { ...mockCounter, dailyCount: '5' as any };
      expect(getProgressValue(counterWithStringDailyCount)).toBe(5);
    });
  });

  describe('getProgressPercentage', () => {
    it('calculates correct percentage for counter with goal', () => {
      expect(getProgressPercentage(mockCounter)).toBe(30); // 3/10 * 100 = 30
    });

    it('returns 0 for counter without goal', () => {
      const counterWithoutGoal = { ...mockCounter, dailyGoal: undefined };
      expect(getProgressPercentage(counterWithoutGoal)).toBe(0);
    });

    it('returns 100 for achieved goal', () => {
      const achievedGoalCounter = { ...mockCounter, dailyCount: 10, dailyGoal: 10 };
      expect(getProgressPercentage(achievedGoalCounter)).toBe(100);
    });

    it('caps percentage at 100', () => {
      const overAchievedCounter = { ...mockCounter, dailyCount: 15, dailyGoal: 10 };
      expect(getProgressPercentage(overAchievedCounter)).toBe(100);
    });
  });

  describe('isGoalAchieved', () => {
    it('returns true when dailyCount equals dailyGoal', () => {
      const achievedCounter = { ...mockCounter, dailyCount: 10, dailyGoal: 10 };
      expect(isGoalAchieved(achievedCounter)).toBe(true);
    });

    it('returns true when dailyCount exceeds dailyGoal', () => {
      const overAchievedCounter = { ...mockCounter, dailyCount: 15, dailyGoal: 10 };
      expect(isGoalAchieved(overAchievedCounter)).toBe(true);
    });

    it('returns false when dailyCount is less than dailyGoal', () => {
      expect(isGoalAchieved(mockCounter)).toBe(false);
    });

    it('returns false when counter has no dailyGoal', () => {
      const counterWithoutGoal = { ...mockCounter, dailyGoal: undefined };
      expect(isGoalAchieved(counterWithoutGoal)).toBe(false);
    });
  });

  describe('getRemainingCount', () => {
    it('returns remaining count when goal not achieved', () => {
      expect(getRemainingCount(mockCounter)).toBe(7); // 10 - 3 = 7
    });

    it('returns 0 when goal is achieved', () => {
      const achievedCounter = { ...mockCounter, dailyCount: 10, dailyGoal: 10 };
      expect(getRemainingCount(achievedCounter)).toBe(0);
    });

    it('returns 0 when goal is exceeded', () => {
      const overAchievedCounter = { ...mockCounter, dailyCount: 15, dailyGoal: 10 };
      expect(getRemainingCount(overAchievedCounter)).toBe(0);
    });

    it('returns 0 when counter has no dailyGoal', () => {
      const counterWithoutGoal = { ...mockCounter, dailyGoal: undefined };
      expect(getRemainingCount(counterWithoutGoal)).toBe(0);
    });
  });

  describe('getTodayString', () => {
    it('returns current date in YYYY-MM-DD format', () => {
      const today = new Date();
      const expected = today.toLocaleDateString('en-CA');
      expect(getTodayString()).toBe(expected);
    });

    it('returns consistent format across different locales', () => {
      const result = getTodayString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('validateCounterValue', () => {
    it('returns valid for positive numbers', () => {
      const result = validateCounterValue(5);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns valid for zero', () => {
      const result = validateCounterValue(0);
      expect(result.isValid).toBe(true);
    });

    it('returns invalid for negative numbers', () => {
      const result = validateCounterValue(-1);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Counter value cannot be negative');
    });

    it('returns invalid for NaN', () => {
      const result = validateCounterValue(NaN);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Counter value must be a valid number');
    });

    it('returns invalid for values exceeding maximum', () => {
      const result = validateCounterValue(1000000);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Counter value cannot exceed 999,999');
    });
  });

  describe('validateDailyGoal', () => {
    it('returns valid for positive numbers', () => {
      const result = validateDailyGoal(10);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns valid for undefined (optional field)', () => {
      const result = validateDailyGoal(undefined);
      expect(result.isValid).toBe(true);
    });

    it('returns valid for null (optional field)', () => {
      const result = validateDailyGoal(null);
      expect(result.isValid).toBe(true);
    });

    it('returns invalid for zero', () => {
      const result = validateDailyGoal(0);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Daily goal must be at least 1');
    });

    it('returns invalid for negative numbers', () => {
      const result = validateDailyGoal(-5);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Daily goal must be a valid number');
    });

    it('returns invalid for NaN', () => {
      const result = validateDailyGoal(NaN);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Daily goal must be a valid number');
    });

    it('returns invalid for values exceeding maximum', () => {
      const result = validateDailyGoal(1001);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Daily goal cannot exceed 1,000');
    });
  });

  describe('findCounterById', () => {
    it('returns correct counter when ID exists', () => {
      const result = findCounterById(mockCounters, 'counter-2');
      expect(result).toEqual(mockCounters[1]);
    });

    it('returns undefined when ID does not exist', () => {
      const result = findCounterById(mockCounters, 'non-existent-id');
      expect(result).toBeUndefined();
    });

    it('returns undefined for empty array', () => {
      const result = findCounterById([], 'counter-1');
      expect(result).toBeUndefined();
    });
  });

  describe('sortCountersByName', () => {
    it('sorts counters alphabetically by name', () => {
      const unsortedCounters = [
        { id: 'counter-3', name: 'Cherry Counter', value: 7 },
        { id: 'counter-1', name: 'Apple Counter', value: 5 },
        { id: 'counter-2', name: 'Banana Counter', value: 3 },
      ];

      const result = sortCountersByName(unsortedCounters);

      expect(result[0].name).toBe('Apple Counter');
      expect(result[1].name).toBe('Banana Counter');
      expect(result[2].name).toBe('Cherry Counter');
    });

    it('returns new array without mutating original', () => {
      const original = [...mockCounters];
      const result = sortCountersByName(mockCounters);

      expect(result).not.toBe(mockCounters);
      expect(mockCounters).toEqual(original);
    });

    it('handles empty array', () => {
      const result = sortCountersByName([]);
      expect(result).toEqual([]);
    });
  });

  describe('filterCountersBySearch', () => {
    it('returns all counters when search term is empty', () => {
      const result = filterCountersBySearch(mockCounters, '');
      expect(result).toEqual(mockCounters);
    });

    it('filters counters by name match', () => {
      const result = filterCountersBySearch(mockCounters, 'apple');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Apple Counter');
    });

    it('filters counters by ID match', () => {
      const result = filterCountersBySearch(mockCounters, 'counter-2');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('counter-2');
    });

    it('is case insensitive', () => {
      const result = filterCountersBySearch(mockCounters, 'APPLE');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Apple Counter');
    });

    it('returns empty array when no matches', () => {
      const result = filterCountersBySearch(mockCounters, 'nonexistent');
      expect(result).toHaveLength(0);
    });

    it('handles whitespace-only search term', () => {
      const result = filterCountersBySearch(mockCounters, '   ');
      expect(result).toEqual(mockCounters);
    });
  });
});
