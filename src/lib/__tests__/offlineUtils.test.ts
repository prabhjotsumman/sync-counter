/**
 * @jest-environment jsdom
 */

import {
  addPendingIncrement,
  getPendingIncrements,
  clearPendingIncrements,
  normalizeUserName,
  debounce,
  isDataStale,
  getLocalStorageItem,
  setLocalStorageItem,
} from '../../lib/offlineUtils';

import type { PendingIncrement } from '../../lib/offlineUtils';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock the utility functions that are imported by offlineUtils
jest.mock('../../lib/offlineUtils', () => {
  const actual = jest.requireActual('../../lib/offlineUtils');
  return {
    ...actual,
    getLocalStorageItem: jest.fn(),
    setLocalStorageItem: jest.fn(),
  };
});

const mockGetLocalStorageItem = getLocalStorageItem as jest.MockedFunction<typeof getLocalStorageItem>;
const mockSetLocalStorageItem = setLocalStorageItem as jest.MockedFunction<typeof setLocalStorageItem>;

describe('Offline Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLocalStorageItem.mockReturnValue([]);
    mockSetLocalStorageItem.mockImplementation(() => {});
  });

  describe('addPendingIncrement', () => {
    it('adds increment to pending increments', () => {
      const counterId = 'test-counter-1';
      const currentUser = 'TestUser';
      const today = '2024-01-15';

      addPendingIncrement(counterId, currentUser, today);

      expect(mockSetLocalStorageItem).toHaveBeenCalledWith(
        'syncCounterPendingIncrements',
        expect.arrayContaining([
          expect.objectContaining({
            counterId,
            currentUser,
            today,
          }),
        ])
      );
    });

    it('creates unique increment ID', () => {
      const counterId = 'test-counter-1';
      const currentUser = 'TestUser';
      const today = '2024-01-15';

      addPendingIncrement(counterId, currentUser, today);

      expect(mockSetLocalStorageItem).toHaveBeenCalledWith(
        'syncCounterPendingIncrements',
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.stringMatching(/test-counter-1-\d+-\d+/),
            counterId,
            currentUser,
            today,
            timestamp: expect.any(Number),
          }),
        ])
      );
    });

    it('appends to existing increments', () => {
      const existingIncrements = [
        {
          id: 'existing-1',
          counterId: 'counter-1',
          currentUser: 'User1',
          today: '2024-01-15',
          timestamp: Date.now(),
        },
      ];

      mockGetLocalStorageItem.mockReturnValue(existingIncrements);

      addPendingIncrement('counter-2', 'User2', '2024-01-15');

      expect(mockSetLocalStorageItem).toHaveBeenCalledWith(
        'syncCounterPendingIncrements',
        expect.arrayContaining([
          ...existingIncrements,
          expect.objectContaining({
            counterId: 'counter-2',
          }),
        ])
      );
    });

    it('handles localStorage errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSetLocalStorageItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      addPendingIncrement('counter-1', 'User1', '2024-01-15');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to add pending increment:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('returns early in server-side environment', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      addPendingIncrement('counter-1', 'User1', '2024-01-15');

      expect(mockGetLocalStorageItem).not.toHaveBeenCalled();
      expect(mockSetLocalStorageItem).not.toHaveBeenCalled();

      global.window = originalWindow;
    });
  });

  describe('getPendingIncrements', () => {
    it('returns empty array when no increments exist', () => {
      mockGetLocalStorageItem.mockReturnValue([]);

      const result = getPendingIncrements();

      expect(result).toEqual([]);
      expect(mockGetLocalStorageItem).toHaveBeenCalledWith('syncCounterPendingIncrements', []);
    });

    it('returns parsed increments when they exist', () => {
      const mockIncrements = [
        {
          id: 'increment-1',
          counterId: 'counter-1',
          currentUser: 'User1',
          today: '2024-01-15',
          timestamp: Date.now(),
        },
      ];

      mockGetLocalStorageItem.mockReturnValue(mockIncrements);

      const result = getPendingIncrements();

      expect(result).toEqual(mockIncrements);
    });

    it('handles localStorage errors gracefully', () => {
      mockGetLocalStorageItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = getPendingIncrements();

      expect(result).toEqual([]);
    });
  });

  describe('clearPendingIncrements', () => {
    it('clears all pending increments', () => {
      clearPendingIncrements();

      expect(mockSetLocalStorageItem).toHaveBeenCalledWith(
        'syncCounterPendingIncrements',
        []
      );
    });

    it('handles localStorage errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSetLocalStorageItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => clearPendingIncrements()).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('normalizeUserName', () => {
    it('capitalizes first letter and lowercases rest', () => {
      expect(normalizeUserName('john')).toBe('John');
      expect(normalizeUserName('MARY')).toBe('Mary');
      expect(normalizeUserName('jOhN')).toBe('John');
    });

    it('handles single character names', () => {
      expect(normalizeUserName('a')).toBe('A');
    });

    it('handles empty string', () => {
      expect(normalizeUserName('')).toBe('');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('delays function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2');
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('cancels previous call when called again within delay', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('first');
      jest.advanceTimersByTime(50);
      debouncedFn('second');
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('second');
    });

    it('passes all arguments correctly', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 42, { key: 'value' });

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 42, { key: 'value' });
    });
  });

  describe('isDataStale', () => {
    it('returns true when data is older than threshold', () => {
      const oldTimestamp = Date.now() - (6 * 60 * 1000); // 6 minutes ago
      expect(isDataStale(oldTimestamp)).toBe(true);
    });

    it('returns false when data is within threshold', () => {
      const recentTimestamp = Date.now() - (3 * 60 * 1000); // 3 minutes ago
      expect(isDataStale(recentTimestamp)).toBe(false);
    });

    it('uses custom threshold when provided', () => {
      const recentTimestamp = Date.now() - 1000; // 1 second ago
      const customThreshold = 2000; // 2 seconds

      expect(isDataStale(recentTimestamp, customThreshold)).toBe(true);
    });

    it('handles future timestamps', () => {
      const futureTimestamp = Date.now() + 1000;
      expect(isDataStale(futureTimestamp)).toBe(false);
    });
  });

  describe('getLocalStorageItem', () => {
    it('returns parsed data when valid JSON exists', () => {
      const testData = { key: 'value' };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(testData));

      const result = getLocalStorageItem('test-key', null);

      expect(result).toEqual(testData);
    });

    it('returns fallback when no data exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = getLocalStorageItem('test-key', 'fallback');

      expect(result).toBe('fallback');
    });

    it('returns fallback when localStorage throws', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = getLocalStorageItem('test-key', 'fallback');

      expect(result).toBe('fallback');
    });

    it('returns fallback when JSON parsing fails', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const result = getLocalStorageItem('test-key', 'fallback');

      expect(result).toBe('fallback');
    });
  });

  describe('setLocalStorageItem', () => {
    it('stringifies and stores data', () => {
      const testData = { key: 'value' };

      setLocalStorageItem('test-key', testData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testData)
      );
    });

    it('handles localStorage errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => setLocalStorageItem('test-key', 'test-value')).not.toThrow();

      consoleSpy.mockRestore();
    });
  });
});
