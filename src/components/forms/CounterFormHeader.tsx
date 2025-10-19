/**
 * Counter form header component
 *
 * This component renders the modal title for counter forms.
 */

import React from 'react';

/**
 * Props for CounterFormHeader component
 */
interface CounterFormHeaderProps {
  /** Form mode (add or edit) */
  mode: 'add' | 'edit';
}

/**
 * Form header component for counter forms
 */
export const CounterFormHeader: React.FC<CounterFormHeaderProps> = ({ mode }) => {
  return (
    <h2 className="text-2xl font-bold text-white mb-6">
      {mode === 'edit' ? 'Edit Counter' : 'Add Counter'}
    </h2>
  );
};
