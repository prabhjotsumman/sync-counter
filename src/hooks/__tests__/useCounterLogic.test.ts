/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useCounterLogic } from '../../hooks/useCounterLogic';
import { addPendingIncrement } from '../../lib/offlineUtils';
import type { Counter } from '../../lib/counters';

// Mock the offlineUtils
jest.mock('../../lib/offlineUtils', () => ({
  addPendingIncrement: jest.fn(),
}));

const mockAddPendingIncrement = addPendingIncrement as jest.MockedFunction<typeof addPendingIncrement>;

const mockCounter: Counter = {
  id: 'test-counter-1',
  name: 'Test Counter',
  value: 5,
  dailyCount: 2,
  dailyGoal: 10,
  users: { 'TestUser': 2 },
  history: {
    '2024-01-15': {
      users: { 'TestUser': 2 },
      total: 2,
      day: 'Monday'
    }
  }
};

const mockOnUpdate = jest.fn();

describe('useCounterLogic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Mock localStorage
    localStorage.getItem = jest.fn().mockReturnValue('TestUser');
    localStorage.setItem = jest.fn();

    // Mock window.prompt to avoid actual prompts during tests
    global.prompt = jest.fn().mockReturnValue('TestUser');
    global.alert = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() =>
      useCounterLogic({
        id: 'test-counter-1',
        onUpdate: mockOnUpdate,
      })
    );

    expect(result.current.lastAction).toBeNull();
    expect(typeof result.current.handleIncrement).toBe('function');
  });

  it('prompts for username if none exists', () => {
    localStorage.getItem = jest.fn().mockReturnValue(null);

    renderHook(() =>
      useCounterLogic({
        id: 'test-counter-1',
        onUpdate: mockOnUpdate,
        currentCounter: mockCounter,
      })
    );

    expect(global.prompt).toHaveBeenCalledWith('Please enter your username (required):');
  });

  it('normalizes username capitalization', () => {
    localStorage.getItem = jest.fn().mockReturnValue('testuser');

    renderHook(() =>
      useCounterLogic({
        id: 'test-counter-1',
        onUpdate: mockOnUpdate,
        currentCounter: mockCounter,
      })
    );

    expect(localStorage.setItem).toHaveBeenCalledWith('syncCounterUser', 'Testuser');
  });

  it('handles increment with optimistic updates', async () => {
    const { result } = renderHook(() =>
      useCounterLogic({
        id: 'test-counter-1',
        onUpdate: mockOnUpdate,
        currentCounter: mockCounter,
      })
    );

    await act(async () => {
      await result.current.handleIncrement();
    });

    expect(mockOnUpdate).toHaveBeenCalledWith('test-counter-1', expect.objectContaining({
      value: 6, // Incremented from 5
      dailyCount: 3, // Incremented from 2
      users: expect.objectContaining({
        'TestUser': 3, // Incremented from 2
      }),
      lastUpdated: expect.any(Number),
    }));
  });

  it('adds pending increment for offline sync', async () => {
    const { result } = renderHook(() =>
      useCounterLogic({
        id: 'test-counter-1',
        onUpdate: mockOnUpdate,
        currentCounter: mockCounter,
      })
    );

    await act(async () => {
      await result.current.handleIncrement();
    });

    expect(mockAddPendingIncrement).toHaveBeenCalledWith(
      'test-counter-1',
      'TestUser',
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD format
    );
  });

  it('sets lastAction state during increment', async () => {
    const { result } = renderHook(() =>
      useCounterLogic({
        id: 'test-counter-1',
        onUpdate: mockOnUpdate,
        currentCounter: mockCounter,
      })
    );

    expect(result.current.lastAction).toBeNull();

    await act(async () => {
      result.current.handleIncrement();
    });

    expect(result.current.lastAction).toBe('increment');

    // Should reset after timeout
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1100));
    });

    expect(result.current.lastAction).toBeNull();
  });

  it('handles missing currentCounter gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() =>
      useCounterLogic({
        id: 'test-counter-1',
        onUpdate: mockOnUpdate,
        currentCounter: undefined,
      })
    );

    await act(async () => {
      await result.current.handleIncrement();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'No current counter data available for optimistic update'
    );
    expect(mockOnUpdate).not.toHaveBeenCalled();
    expect(result.current.lastAction).toBeNull();

    consoleSpy.mockRestore();
  });

  it('handles missing username gracefully', async () => {
    localStorage.getItem = jest.fn().mockReturnValue(null);
    global.prompt = jest.fn().mockReturnValue(null);

    const { result } = renderHook(() =>
      useCounterLogic({
        id: 'test-counter-1',
        onUpdate: mockOnUpdate,
        currentCounter: mockCounter,
      })
    );

    await act(async () => {
      await result.current.handleIncrement();
    });

    expect(global.alert).toHaveBeenCalledWith('A username is required to use the app.');
    expect(mockOnUpdate).not.toHaveBeenCalled();
    expect(result.current.lastAction).toBeNull();
  });

  it('creates correct history entry for new day', async () => {
    const counterWithoutToday = {
      ...mockCounter,
      history: {
        '2024-01-14': {
          users: { 'TestUser': 1 },
          total: 1,
          day: 'Sunday'
        }
      }
    };

    const { result } = renderHook(() =>
      useCounterLogic({
        id: 'test-counter-1',
        onUpdate: mockOnUpdate,
        currentCounter: counterWithoutToday,
      })
    );

    await act(async () => {
      await result.current.handleIncrement();
    });

    expect(mockOnUpdate).toHaveBeenCalledWith('test-counter-1', expect.objectContaining({
      history: expect.objectContaining({
        '2024-01-15': expect.objectContaining({
          users: { 'TestUser': 1 },
          total: 1,
          day: expect.any(String),
        }),
      }),
    }));
  });

  it('handles multiple users correctly', async () => {
    const multiUserCounter = {
      ...mockCounter,
      users: { 'TestUser': 1, 'AnotherUser': 1 },
    };

    const { result } = renderHook(() =>
      useCounterLogic({
        id: 'test-counter-1',
        onUpdate: mockOnUpdate,
        currentCounter: multiUserCounter,
      })
    );

    await act(async () => {
      await result.current.handleIncrement();
    });

    expect(mockOnUpdate).toHaveBeenCalledWith('test-counter-1', expect.objectContaining({
      users: {
        'TestUser': 2, // Incremented
        'AnotherUser': 1, // Unchanged
      },
    }));
  });

  it('maintains existing history when incrementing', async () => {
    const counterWithHistory = {
      ...mockCounter,
      history: {
        '2024-01-14': {
          users: { 'TestUser': 1 },
          total: 1,
          day: 'Sunday'
        },
        '2024-01-15': {
          users: { 'TestUser': 2 },
          total: 2,
          day: 'Monday'
        }
      }
    };

    const { result } = renderHook(() =>
      useCounterLogic({
        id: 'test-counter-1',
        onUpdate: mockOnUpdate,
        currentCounter: counterWithHistory,
      })
    );

    await act(async () => {
      await result.current.handleIncrement();
    });

    expect(mockOnUpdate).toHaveBeenCalledWith('test-counter-1', expect.objectContaining({
      history: expect.objectContaining({
        '2024-01-14': expect.objectContaining({
          users: { 'TestUser': 1 },
          total: 1,
          day: 'Sunday'
        }),
        '2024-01-15': expect.objectContaining({
          users: { 'TestUser': 3 }, // Incremented from 2
          total: 3, // Incremented from 2
        }),
      }),
    }));
  });
});
