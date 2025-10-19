# Testing Documentation

This project includes comprehensive tests for the incrementing functionality and related utilities.

## Test Setup

The project uses:
- **Jest** - Test runner and assertion library
- **React Testing Library** - Component testing utilities
- **@testing-library/jest-dom** - Custom Jest matchers
- **@testing-library/user-event** - User interaction testing

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (Development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Structure

```
src/
├── components/counter/
│   ├── __tests__/
│   │   ├── IncrementButton.test.tsx          # Component tests
│   │   └── IncrementButton.integration.test.tsx  # Integration tests
├── hooks/
│   └── __tests__/
│       └── useCounterLogic.test.ts           # Hook tests
├── utils/
│   └── __tests__/
│       └── counterUtils.test.ts              # Utility function tests
└── lib/
    └── __tests__/
        └── offlineUtils.test.ts             # Offline functionality tests
```

## Test Categories

### 1. Component Tests (`IncrementButton.test.tsx`)
Tests the IncrementButton component for:
- Rendering behavior
- User interactions (clicking)
- State management (disabled/enabled states)
- Event handling (storage changes)
- Cleanup (event listeners)

### 2. Hook Tests (`useCounterLogic.test.ts`)
Tests the useCounterLogic hook for:
- State initialization
- Username prompting and normalization
- Optimistic updates
- Pending increment management
- Error handling

### 3. Utility Tests (`counterUtils.test.ts`)
Tests utility functions for:
- Counter validation
- Progress calculations
- Date handling
- Array operations
- Search functionality

### 4. Integration Tests (`IncrementButton.integration.test.tsx`)
Tests the complete increment flow including:
- Component-context interaction
- State synchronization
- Event handling across components

### 5. Offline Utility Tests (`offlineUtils.test.ts`)
Tests offline functionality for:
- Pending increment management
- Local storage operations
- Debouncing
- Data staleness detection

## Key Test Scenarios

### Increment Flow
1. **User clicks increment button**
2. **Username is prompted if missing**
3. **Optimistic update applied immediately**
4. **Increment added to pending queue**
5. **Batch sync scheduled**
6. **Server sync attempted (online) or offline storage (offline)**

### Error Handling
- Missing counter data
- Network failures
- Storage quota exceeded
- Invalid user input
- Malformed data

### Edge Cases
- Multiple rapid clicks
- Network status changes
- Storage events
- Component unmounting
- Large datasets

## Mocking Strategy

Tests use comprehensive mocking for:
- **localStorage** - Browser storage API
- **window.prompt/alert** - User interaction dialogs
- **Event listeners** - DOM events
- **Network requests** - API calls
- **Timers** - Debouncing and delays

## Running Tests in CI

For continuous integration, use:
```bash
npm run test:coverage
```

This generates coverage reports that can be used to:
- Ensure test quality
- Identify untested code paths
- Set coverage thresholds
- Generate coverage badges

## Writing New Tests

When adding new functionality:

1. **Unit tests** for individual functions/components
2. **Integration tests** for complete user flows
3. **Edge case tests** for error conditions
4. **Mock external dependencies** appropriately
5. **Use descriptive test names** and organize with `describe` blocks

## Troubleshooting

### Common Issues

**localStorage not available in Node.js:**
- Tests run in jsdom environment which mocks localStorage

**Async operations:**
- Use `waitFor` from React Testing Library for async assertions
- Mock timers with `jest.useFakeTimers()`

**Event listeners:**
- Tests automatically clean up event listeners on unmount
- Use spies to verify listener registration/removal

**Component rendering:**
- Use `render` from React Testing Library
- Query elements with `screen` API
- Use `userEvent` for user interactions
