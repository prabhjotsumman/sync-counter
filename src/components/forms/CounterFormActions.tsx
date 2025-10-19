/**
 * Counter form actions component
 *
 * This component renders the save/cancel buttons for counter forms.
 */

import React from 'react';

/**
 * Props for CounterFormActions component
 */
interface CounterFormActionsProps {
  /** Save handler function */
  onSave: () => void;
  /** Cancel handler function */
  onCancel: () => void;
  /** Whether form is in loading state */
  isLoading?: boolean;
  /** Custom save button text */
  saveText?: string;
  /** Custom cancel button text */
  cancelText?: string;
}

/**
 * Form actions component for counter forms
 */
export const CounterFormActions: React.FC<CounterFormActionsProps> = ({
  onSave,
  onCancel,
  isLoading = false,
  saveText = 'Save Changes',
  cancelText = 'Cancel',
}) => {
  return (
    <div className="flex gap-3 mt-8">
      <button
        onClick={onSave}
        disabled={isLoading}
        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors duration-200"
      >
        {isLoading ? 'Saving...' : saveText}
      </button>
      <button
        onClick={onCancel}
        disabled={isLoading}
        className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors duration-200"
      >
        {cancelText}
      </button>
    </div>
  );
};
