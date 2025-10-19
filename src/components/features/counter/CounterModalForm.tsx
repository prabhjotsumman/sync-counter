'use client';
import React, { useEffect } from 'react';
import { useCounterContext } from '@/providers/CounterContext';
import { useCounterFormState } from '@/hooks/useFormState';
import { CounterFormHeader, CounterFormFields, CounterFormActions } from '@/components/forms';

interface CounterModalFormProps {
  id: string;
}

export function CounterModalForm({ id }: CounterModalFormProps) {
  const {
    modalOpen,
    setModalOpen,
    editingCounter,
    handleSaveCounter,
    modalMode,
  } = useCounterContext();

  // Use the form state hook for state management
  const formState = useCounterFormState(editingCounter);

  // Sync form state with modal state changes
  useEffect(() => {
    if (!modalOpen) return;

    if (modalMode === 'edit' && editingCounter) {
      formState.setValues({
        name: editingCounter.name || '',
        value: editingCounter.value || 0,
        dailyGoal: editingCounter.dailyGoal || 0,
        resetDailyCount: false, // Always unchecked by default
      });
    } else if (modalMode === 'add') {
      formState.setValues({
        name: '',
        value: 0,
        dailyGoal: 0,
        resetDailyCount: false,
      });
    }
  }, [modalOpen, modalMode, editingCounter]); // Removed formState from dependencies

  const handleSave = async () => {
    const name = formState.values.name as string;
    const value = formState.values.value as number;
    const dailyGoal = formState.values.dailyGoal as number;
    const resetDailyCount = formState.values.resetDailyCount as boolean;

    // Validate the form before saving
    const isValid = formState.validateForm();

    if (!isValid) {
      alert('Please fix the errors in the form');
      return;
    }

    if (!name.trim()) {
      alert('Please enter a counter name');
      return;
    }

    formState.setSubmitting(true);

    try {
      const safeDailyGoal = typeof dailyGoal === 'number' && !isNaN(dailyGoal) ? dailyGoal : 0;

      if (modalMode === 'edit' && editingCounter) {
        // Calculate the difference between new value and current value
        const currentValue = editingCounter.value || 0;
        const valueDifference = value - currentValue;

        // Get current dailyCount, ensuring it's a valid number
        const currentDailyCount = typeof editingCounter.dailyCount === 'number' ? editingCounter.dailyCount : 0;

        // Adjust dailyCount by adding the value difference
        // This ensures that dailyCount represents the actual progress made today
        let adjustedDailyCount = currentDailyCount + valueDifference;

        // Ensure dailyCount doesn't go below 0
        adjustedDailyCount = Math.max(0, adjustedDailyCount);

        // For edit mode, send update with adjusted dailyCount (unless reset checkbox is checked)
        const editData = {
          id: editingCounter.id,
          name: name.trim(),
          value,
          dailyGoal: safeDailyGoal,
          dailyCount: resetDailyCount ? 0 : adjustedDailyCount, // Use adjusted count or reset to 0
        };

        await handleSaveCounter(editData);
      } else {
        await handleSaveCounter({
          name: name.trim(),
          value,
          dailyGoal: safeDailyGoal,
        });
      }

      // Close modal after successful save (the state update happens in handleSaveCounter)
      setModalOpen(false);
    } catch (error) {
      console.error('Failed to save counter:', error);
      alert('Failed to save counter. Please try again.');
    } finally {
      formState.setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setModalOpen(false);
  };

  if (!modalOpen || (modalMode === 'edit' && !editingCounter)) return null;

  return (
    <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700 animate-in zoom-in duration-200">
      <CounterFormHeader mode={modalMode} />

      <CounterFormFields
        name={formState.values.name as string}
        value={formState.values.value as number}
        dailyGoal={formState.values.dailyGoal as number}
        resetDailyCount={formState.values.resetDailyCount as boolean}
        onNameChange={(value) => formState.setValue('name', value)}
        onValueChange={(value) => formState.setValue('value', value)}
        onDailyGoalChange={(value) => formState.setValue('dailyGoal', value)}
        onResetDailyCountChange={(value) => formState.setValue('resetDailyCount', value)}
        disabled={formState.isSubmitting}
        isEditMode={modalMode === 'edit'}
      />

      <CounterFormActions
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={formState.isSubmitting}
      />
    </div>
  );
}
