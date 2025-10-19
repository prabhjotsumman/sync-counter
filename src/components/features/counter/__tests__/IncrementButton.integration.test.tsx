/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import IncrementButton from '../../IncrementButton';
import { useCounterLogic } from '../../../hooks/useCounterLogic';

// Mock the useCounterLogic hook
jest.mock('../../../hooks/useCounterLogic');
jest.mock('../../../lib/offlineUtils');

const mockUseCounterLogic = useCounterLogic as jest.MockedFunction<typeof useCounterLogic>;

import { waitFor } from '@testing-library/react';

// Mock the context hook
jest.mock('../../../context/CounterContext', () => ({
  ...jest.requireActual('../../../context/CounterContext'),
  useCounterContext: jest.fn(),
}));

import { useCounterContext } from '../../../context/CounterContext';

const mockUseCounterContext = useCounterContext as jest.MockedFunction<typeof useCounterContext>;

const TestWrapper = ({ children, initialCounters = [] }: {
  children: React.ReactNode;
  initialCounters?: any[];
}) => {
  mockUseCounterContext.mockReturnValue({
    counters: initialCounters,
    setCounters: jest.fn(),
    handleCounterUpdate: jest.fn(),
    anyFullscreen: false,
    setAnyFullscreen: jest.fn(),
    isOnline: true,
    isOffline: false,
    pendingRequests: 0,
    syncPendingChangesToServer: jest.fn(),
    fetchCounters: jest.fn(),
    showUsernameModal: false,
    handleUsernameSubmit: jest.fn(),
    modalOpen: false,
    setModalOpen: jest.fn(),
    modalMode: 'add' as const,
    setModalMode: jest.fn(),
    editingCounter: null,
    setEditingCounter: jest.fn(),
    handleAddCounter: jest.fn(),
    handleSaveCounter: jest.fn(),
    handleDeleteCounter: jest.fn(),
    handleEditCounter: jest.fn(),
  });

  return React.createElement(React.Fragment, {}, children);
};

const renderIncrementButtonWithContext = (id = 'test-counter-1', initialCounters: any[] = []) => {
  return render(
    React.createElement(TestWrapper, { initialCounters },
      React.createElement(IncrementButton, { id })
    )
  );
};

describe('IncrementButton Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Setup default mocks
    localStorage.getItem = jest.fn().mockReturnValue('TestUser');
    localStorage.setItem = jest.fn();

    mockUseCounterLogic.mockReturnValue({
      lastAction: null,
      handleIncrement: jest.fn(),
    });
  });

  it('renders when counter exists in context', () => {
    const initialCounters = [{
      id: 'test-counter-1',
      name: 'Test Counter',
      value: 5,
    }];

    renderIncrementButtonWithContext('test-counter-1', initialCounters);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('does not render when counter does not exist in context', () => {
    renderIncrementButtonWithContext('non-existent-id');

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('passes correct counter data to useCounterLogic hook', () => {
    const initialCounters = [{
      id: 'test-counter-1',
      name: 'Test Counter',
      value: 5,
      dailyCount: 3,
      dailyGoal: 10,
    }];

    renderIncrementButtonWithContext('test-counter-1', initialCounters);

    expect(mockUseCounterLogic).toHaveBeenCalledWith({
      id: 'test-counter-1',
      onUpdate: expect.any(Function),
      currentCounter: initialCounters[0],
    });
  });

  it('handles counter updates correctly', async () => {
    const mockHandleCounterUpdate = jest.fn();
    const initialCounters = [{
      id: 'test-counter-1',
      name: 'Test Counter',
      value: 5,
    }];

    const mockHandleIncrement = jest.fn().mockImplementation(() => {
      // Simulate the optimistic update
      mockHandleCounterUpdate('test-counter-1', {
        ...initialCounters[0],
        value: 6,
        lastUpdated: Date.now(),
      });
    });

    mockUseCounterLogic.mockReturnValue({
      lastAction: null,
      handleIncrement: mockHandleIncrement,
    });

    const user = userEvent.setup();
    renderIncrementButtonWithContext('test-counter-1', initialCounters);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockHandleIncrement).toHaveBeenCalledTimes(1);
  });

  it('maintains button state during increment operation', async () => {
    let resolveIncrement: () => void;
    const incrementPromise = new Promise<void>((resolve) => {
      resolveIncrement = resolve;
    });

    const mockHandleIncrement = jest.fn().mockImplementation(async () => {
      mockUseCounterLogic.mockReturnValue({
        lastAction: 'increment',
        handleIncrement: mockHandleIncrement,
      });

      // Simulate async operation
      setTimeout(() => {
        mockUseCounterLogic.mockReturnValue({
          lastAction: null,
          handleIncrement: mockHandleIncrement,
        });
        resolveIncrement();
      }, 100);
    });

    mockUseCounterLogic.mockReturnValue({
      lastAction: null,
      handleIncrement: mockHandleIncrement,
    });

    const user = userEvent.setup();
    renderIncrementButtonWithContext('test-counter-1', [{
      id: 'test-counter-1',
      name: 'Test Counter',
      value: 5,
    }]);

    const button = screen.getByRole('button');

    // Initial state
    expect(button).not.toHaveClass('opacity-50');

    await user.click(button);

    // Should show disabled state during operation
    await waitFor(() => {
      expect(button).toHaveClass('opacity-50');
    });

    await incrementPromise;

    // Should return to enabled state
    await waitFor(() => {
      expect(button).not.toHaveClass('opacity-50');
    });
  });

  it('handles multiple counters correctly', () => {
    const initialCounters = [
      { id: 'counter-1', name: 'Counter 1', value: 5 },
      { id: 'counter-2', name: 'Counter 2', value: 3 },
      { id: 'counter-3', name: 'Counter 3', value: 7 },
    ];

    const { rerender } = renderIncrementButtonWithContext('counter-1', initialCounters);

    expect(mockUseCounterLogic).toHaveBeenCalledWith({
      id: 'counter-1',
      onUpdate: expect.any(Function),
      currentCounter: initialCounters[0],
    });

    // Test different counter
    rerender(
      React.createElement(TestWrapper, { initialCounters },
        React.createElement(IncrementButton, { id: 'counter-2' })
      )
    );

    expect(mockUseCounterLogic).toHaveBeenCalledWith({
      id: 'counter-2',
      onUpdate: expect.any(Function),
      currentCounter: initialCounters[1],
    });
  });

  it('handles user color changes correctly', () => {
    const initialCounters = [{
      id: 'test-counter-1',
      name: 'Test Counter',
      value: 5,
    }];

    renderIncrementButtonWithContext('test-counter-1', initialCounters);

    // Simulate storage change
    const storageEvent = new StorageEvent('storage', {
      key: 'syncCounterUser',
      newValue: 'NewUser',
    });

    window.dispatchEvent(storageEvent);

    // Component should handle the event without crashing
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('cleans up resources on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const initialCounters = [{
      id: 'test-counter-1',
      name: 'Test Counter',
      value: 5,
    }];

    const { unmount } = renderIncrementButtonWithContext('test-counter-1', initialCounters);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('user-color-updated', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});
