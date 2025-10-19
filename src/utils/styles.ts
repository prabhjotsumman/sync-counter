/**
 * Styles utility module for consistent styling across components
 *
 * This module provides centralized styling logic and utilities
 * for maintaining consistent appearance and behavior.
 */

import { COUNTER_STYLES } from '@/constants';

/**
 * Internal state for counter styling and behavior
 */
export interface CounterStyles {
  /** Base container classes for consistent styling */
  containerClasses: string;
  /** Progress bar container positioning */
  progressBarClasses: string;
  /** Header section styling */
  headerClasses: string;
}

/**
 * Default counter styles using constants
 */
export const DEFAULT_COUNTER_STYLES: CounterStyles = {
  containerClasses: COUNTER_STYLES.containerClasses,
  progressBarClasses: COUNTER_STYLES.progressBarClasses,
  headerClasses: COUNTER_STYLES.headerClasses,
};

/**
 * Merges custom styles with default styles
 * @param customStyles - Custom styles to override defaults
 * @returns Merged styles object
 */
export const mergeCounterStyles = (customStyles?: Partial<CounterStyles>): CounterStyles => {
  return {
    containerClasses: customStyles?.containerClasses || DEFAULT_COUNTER_STYLES.containerClasses,
    progressBarClasses: customStyles?.progressBarClasses || DEFAULT_COUNTER_STYLES.progressBarClasses,
    headerClasses: customStyles?.headerClasses || DEFAULT_COUNTER_STYLES.headerClasses,
  };
};

/**
 * Generates dynamic CSS classes based on application state
 * @param isOffline - Whether the app is currently offline
 * @param baseClasses - Base CSS classes to apply
 * @returns Combined CSS class string
 */
export const getDynamicClasses = (isOffline: boolean, baseClasses: string = ''): string => {
  const offlineClasses = isOffline ? 'ring-2 ring-yellow-500 ring-opacity-30' : '';
  return [baseClasses, offlineClasses].filter(Boolean).join(' ');
};

/**
 * Creates responsive container classes for different screen sizes
 * @param baseClasses - Base classes for the container
 * @param size - Size variant (mobile, tablet, desktop)
 * @returns Responsive container classes
 */
export const getResponsiveContainerClasses = (
  baseClasses: string,
  size: 'mobile' | 'tablet' | 'desktop' = 'tablet'
): string => {
  const sizeClasses = {
    mobile: 'min-w-[280px]',
    tablet: 'min-w-[300px]',
    desktop: 'min-w-[320px]',
  };

  return `${baseClasses} ${sizeClasses[size]}`;
};

/**
 * Creates animation classes for smooth transitions
 * @param duration - Animation duration (fast, normal, slow)
 * @param properties - CSS properties to animate
 * @returns Animation classes string
 */
export const getAnimationClasses = (
  duration: 'fast' | 'normal' | 'slow' = 'normal',
  properties: string[] = ['all']
): string => {
  const durationClasses = {
    fast: 'duration-150',
    normal: 'duration-200',
    slow: 'duration-500',
  };

  const propertyClasses = properties.map(prop => `transition-${prop}`).join(' ');

  return `${propertyClasses} ${durationClasses[duration]}`;
};

/**
 * Creates hover effect classes
 * @param baseClasses - Base classes for the element
 * @param hoverClasses - Classes to apply on hover
 * @returns Combined classes with hover effects
 */
export const getHoverClasses = (baseClasses: string, hoverClasses: string = 'opacity-90'): string => {
  return `${baseClasses} hover:${hoverClasses}`;
};

/**
 * Creates focus effect classes for accessibility
 * @param baseClasses - Base classes for the element
 * @param focusClasses - Classes to apply on focus
 * @returns Combined classes with focus effects
 */
export const getFocusClasses = (
  baseClasses: string,
  focusClasses: string = 'outline-none ring-2 ring-blue-500 ring-opacity-50'
): string => {
  return `${baseClasses} focus:${focusClasses}`;
};

/**
 * Combines multiple class generation utilities
 * @param baseClasses - Base CSS classes
 * @param options - Configuration options
 * @returns Combined CSS classes
 */
export const createComponentClasses = (
  baseClasses: string,
  options: {
    isOffline?: boolean;
    size?: 'mobile' | 'tablet' | 'desktop';
    animation?: 'fast' | 'normal' | 'slow';
    hover?: string;
    focus?: string;
    disabled?: boolean;
  } = {}
): string => {
  let classes = baseClasses;

  if (options.isOffline) {
    classes = `${classes} ${getDynamicClasses(options.isOffline)}`;
  }

  if (options.size) {
    classes = getResponsiveContainerClasses(classes, options.size);
  }

  if (options.animation) {
    classes = `${classes} ${getAnimationClasses(options.animation)}`;
  }

  if (options.hover) {
    classes = getHoverClasses(classes, options.hover);
  }

  if (options.focus) {
    classes = getFocusClasses(classes, options.focus);
  }

  if (options.disabled) {
    classes = `${classes} opacity-50 cursor-not-allowed`;
  }

  return classes;
};
