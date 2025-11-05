/**
 * Type definitions for the shared counter application
 *
 * This file consolidates all TypeScript interfaces and types used throughout the application
 * to ensure consistency and maintainability.
 */

// ============================================================================
// CORE COUNTER TYPES
// ============================================================================

/**
 * Represents a counter with all its properties and metadata
 */
export interface Counter {
  id: string;
  name: string;
  value: number;
  lastUpdated?: number;
  dailyGoal?: number;
  dailyCount?: number;
  users?: Record<string, number>; // today's per-user counts
  history?: Record<string, {
    users: Record<string, number>;
    total: number;
    day?: string;
  }>;
  // Customization properties (for full screen mode)
  image_url?: string | null; // persisted storage URL, if available
  customImage?: string; // base64 encoded image or URL
  customText?: string; // custom text to display above counter
}

/**
 * Props for the main Counter component
 */
export interface CounterProps {
  /** Unique identifier for the counter */
  id: string;
}

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

// ============================================================================
// PROGRESS BAR TYPES
// ============================================================================

/**
 * Props for the ProgressBar component
 */
export interface ProgressBarProps {
  counterName?: string;
  value: number;
  max: number;
  showProgressText?: boolean;
  history?: Record<string, {
    users: Record<string, number>;
    total: number;
    day?: string;
  }>;
}

// ============================================================================
// COUNTER ACTIONS TYPES
// ============================================================================

/**
 * Props for the CounterActions component
 */
export interface CounterActionsProps {
  id: string;
  setFullscreenOpen: (id: string | false) => void;
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

/**
 * Context type for counter state management
 */
export interface CounterContextType {
  anyFullscreen: string | false;
  setAnyFullscreen: React.Dispatch<React.SetStateAction<string | false>>;
  counters: Counter[];
  setCounters: React.Dispatch<React.SetStateAction<Counter[]>>;
  handleCounterUpdate: (id: string, updatedCounter: Counter) => void;
  handleEditCounter: (counter: Counter) => void;
  handleAddCounter: () => void;
  handleSaveCounter: (counterData: Partial<Counter> & { name: string; value: number }) => Promise<void>;
  handleDeleteCounter: (id: string) => Promise<void>;
  modalOpen: boolean;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  modalMode: 'edit' | 'add';
  setModalMode: React.Dispatch<React.SetStateAction<'edit' | 'add'>>;
  editingCounter: Counter | null;
  setEditingCounter: React.Dispatch<React.SetStateAction<Counter | null>>;
  isOnline: boolean;
  isOffline: boolean;
  pendingRequests: number;
  syncPendingChangesToServer: () => Promise<void>;
  fetchCounters: () => Promise<void>;
  showUsernameModal: boolean;
  handleUsernameSubmit: (name: string) => void;
}

// ============================================================================
// MODAL TYPES
// ============================================================================

/**
 * Modal modes for counter operations
 */
export type ModalMode = 'edit' | 'add';

/**
 * Props for counter modal components
 */
export interface CounterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  counter?: Counter | null;
  mode: ModalMode;
}

// ============================================================================
// UI COMPONENT TYPES
// ============================================================================

/**
 * Props for icon button components
 */
export interface IconButtonProps {
  onClick: () => void;
  title: string;
  className?: string;
  children: React.ReactNode;
  'aria-label'?: string;
}

/**
 * Props for counter value display components
 */
export interface CounterValueProps {
  id: string;
}

/**
 * Props for increment button components
 */
export interface IncrementButtonProps {
  id: string;
}

/**
 * Props for fullscreen counter modal
 */
export interface FullScreenCounterModalProps {
  id: string;
  open: boolean;
  setOpen: (id: string | false) => void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Responsive breakpoints configuration
 */
export interface Breakpoints {
  mobile: string;
  tablet: string;
  desktop: string;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * Offline storage operation types
 */
export type OfflineOperation = 'increment' | 'update' | 'delete' | 'create';

/**
 * User color mapping for progress visualization
 */
export type UserColorMap = Record<string, string>;

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Form data for counter creation and editing
 */
export interface CounterFormData {
  name: string;
  value: number;
  dailyGoal?: number;
}

/**
 * Props for counter modal form components
 */
export interface CounterModalFormProps {
  counter?: Counter | null;
  onSubmit: (data: CounterFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// ============================================================================
// HOOK TYPES
// ============================================================================

/**
 * Return type for counter page logic hook
 */
export interface UseCountersPageLogicReturn {
  counters: Counter[];
  setCounters: React.Dispatch<React.SetStateAction<Counter[]>>;
  handleAddCounter: () => void;
  handleSaveCounter: (counterData: Partial<Counter> & { name: string; value: number }) => Promise<void>;
  handleDeleteCounter: (id: string) => Promise<void>;
  handleCounterUpdate: (id: string, updatedCounter: Counter) => void;
  handleEditCounter: (counter: Counter) => void;
  modalOpen: boolean;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  modalMode: ModalMode;
  setModalMode: React.Dispatch<React.SetStateAction<ModalMode>>;
  editingCounter: Counter | null;
  setEditingCounter: React.Dispatch<React.SetStateAction<Counter | null>>;
  isOnline: boolean;
  isOffline: boolean;
  pendingRequests: number;
  syncPendingChangesToServer: () => Promise<void>;
  fetchCounters: () => Promise<void>;
  showUsernameModal: boolean;
  handleUsernameSubmit: (name: string) => void;
  anyFullscreen: string | false;
  setAnyFullscreen: React.Dispatch<React.SetStateAction<string | false>>;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * Counter update event payload
 */
export interface CounterUpdateEvent {
  id: string;
  counter: Counter;
  timestamp: number;
}

/**
 * User interaction event types
 */
export type UserInteractionEvent = 'increment' | 'edit' | 'delete' | 'view';
