/**
 * Application constants and configuration values
 *
 * This file centralizes all magic numbers, hardcoded values, and configuration
 * constants used throughout the application for better maintainability.
 */

// ============================================================================
// COUNTER CONSTANTS
// ============================================================================

/**
 * Default styling constants for counter components
 */
export const COUNTER_STYLES = {
  containerClasses: 'bg-gray-900 rounded-lg text-center min-w-[300px] transition-all duration-200 relative',
  progressBarClasses: 'absolute top-0 right-0 w-full max-w-full z-10 rounded-tl-md rounded-tr-md overflow-hidden',
  headerClasses: 'flex items-center justify-center mt-4 p-8',
} as const;
