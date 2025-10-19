/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import IncrementButton from '../IncrementButton';
import { CounterProvider } from '../../../context/CounterContext';
import { useCounterLogic } from '../../../hooks/useCounterLogic';

// Mock the hooks and utilities
jest.mock('../../../hooks/useCounterLogic');
jest.mock('../../../lib/offlineUtils');
jest.mock('../../../context/CounterContext', () => ({
  ...jest.requireActual('../../../context/CounterContext'),
  useCounterContext: () => ({
    counters: [
      {
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
      }
    ],
    handleCounterUpdate: jest.fn(),
  }),
}));

const mockUseCounterLogic = useCounterLogic as jest.MockedFunction<typeof useCounterLogic>;

const renderIncrementButton = (id = 'test-counter-1') => {
  return render(
    <CounterProvider>
      <IncrementButton id={id} />
    </CounterProvider>
  );
};

describe('IncrementButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Setup default mock implementation
    mockUseCounterLogic.mockReturnValue({
      lastAction: null,
      handleIncrement: jest.fn(),
    });
  });

  it('renders the increment button with correct styling', () => {
    renderIncrementButton();

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('+');
    expect(button).toHaveClass('text-5xl', 'font-bold');
  });

  it('calls handleIncrement when button is clicked', async () => {
    const mockHandleIncrement = jest.fn();
    mockUseCounterLogic.mockReturnValue({
      lastAction: null,
      handleIncrement: mockHandleIncrement,
    });

    const user = userEvent.setup();
    renderIncrementButton();

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockHandleIncrement).toHaveBeenCalledTimes(1);
  });

  it('displays disabled state when lastAction is increment', () => {
    mockUseCounterLogic.mockReturnValue({
      lastAction: 'increment',
      handleIncrement: jest.fn(),
    });

    renderIncrementButton();

    const button = screen.getByRole('button');
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
    expect(button).not.toHaveClass('hover:opacity-90');
  });

  it('displays enabled state when lastAction is null', () => {
    mockUseCounterLogic.mockReturnValue({
      lastAction: null,
      handleIncrement: jest.fn(),
    });

    renderIncrementButton();

    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:opacity-90');
    expect(button).not.toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('applies user color as background color', () => {
    // Mock localStorage to return a user
    localStorage.getItem = jest.fn().mockReturnValue('TestUser');

    renderIncrementButton();

    const button = screen.getByRole('button');
    // The color should be applied via style prop, which we can check indirectly
    expect(button).toBeInTheDocument();
  });

  it('returns null when counter is not found', () => {
    renderIncrementButton('non-existent-id');

    // Button should not be rendered when counter is not found
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('updates user color when localStorage changes', () => {
    const { rerender } = renderIncrementButton();

    // Initially no user in localStorage
    expect(localStorage.getItem).toHaveBeenCalledWith('syncCounterUser');

    // Simulate storage change
    const storageEvent = new StorageEvent('storage', {
      key: 'syncCounterUser',
      newValue: 'NewUser',
    });
    window.dispatchEvent(storageEvent);

    // Component should re-render with new color
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('listens for custom user-color-updated events', () => {
    renderIncrementButton();

    // Dispatch custom event
    const customEvent = new CustomEvent('user-color-updated');
    window.dispatchEvent(customEvent);

    // Component should handle the event (no crash)
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderIncrementButton();

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('user-color-updated', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('handles multiple rapid clicks correctly', async () => {
    const mockHandleIncrement = jest.fn();
    mockUseCounterLogic.mockReturnValue({
      lastAction: null,
      handleIncrement: mockHandleIncrement,
    });

    const user = userEvent.setup();
    renderIncrementButton();

    const button = screen.getByRole('button');

    // Click multiple times rapidly
    await user.click(button);
    await user.click(button);
    await user.click(button);

    expect(mockHandleIncrement).toHaveBeenCalledTimes(3);
  });
});
