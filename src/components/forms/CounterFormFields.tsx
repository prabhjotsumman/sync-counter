/**
 * Counter form fields component
 *
 * This component renders the input fields for counter creation/editing.
 */

import React from 'react';
import { InputField } from './InputField';

/**
 * Props for CounterFormFields component
 */
interface CounterFormFieldsProps {
  /** Counter name value */
  name: string;
  /** Counter value */
  value: number;
  /** Daily goal value */
  dailyGoal: number;
  /** Reset daily count checkbox value */
  resetDailyCount?: boolean;
  /** Name change handler */
  onNameChange: (value: string) => void;
  /** Value change handler */
  onValueChange: (value: number) => void;
  /** Daily goal change handler */
  onDailyGoalChange: (value: number) => void;
  /** Reset daily count change handler */
  onResetDailyCountChange?: (value: boolean) => void;
  /** Whether form is in loading state */
  disabled?: boolean;
  /** Whether this is edit mode (to show reset checkbox) */
  isEditMode?: boolean;
}

/**
 * Form fields component for counter forms
 */
export const CounterFormFields: React.FC<CounterFormFieldsProps> = ({
  name,
  value,
  dailyGoal,
  resetDailyCount = false,
  onNameChange,
  onValueChange,
  onDailyGoalChange,
  onResetDailyCountChange,
  disabled = false,
  isEditMode = false,
}) => {
  return (
    <div className="space-y-4">
      <InputField
        label="Counter Name"
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Enter counter name"
        disabled={disabled}
      />
      <InputField
        label="Initial Value"
        type="number"
        value={value}
        onChange={(e) => {
          const numValue = parseInt(e.target.value) || 0;
          onValueChange(numValue);
        }}
        placeholder="0"
        disabled={disabled}
      />
      <InputField
        label="Daily Goal"
        type="number"
        value={dailyGoal}
        onChange={(e) => {
          const numValue = parseInt(e.target.value) || 0;
          onDailyGoalChange(numValue);
        }}
        placeholder="Enter daily goal (optional)"
        disabled={disabled}
      />

      {/* Reset Daily Count Checkbox - only show in edit mode */}
      {isEditMode && onResetDailyCountChange && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="resetDailyCount"
            checked={resetDailyCount}
            onChange={(e) => onResetDailyCountChange(e.target.checked)}
            disabled={disabled}
            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
          />
          <label htmlFor="resetDailyCount" className="text-sm text-white">
            Reset daily count to 0
          </label>
        </div>
      )}
    </div>
  );
};
