/**
 * Custom hook for form state management
 *
 * This hook provides a reusable pattern for managing form state,
 * validation, and submission across different forms in the application.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Counter } from '@/types';

/**
 * Generic form field value type
 */
type FormValue = string | number | boolean;

/**
 * Form field validation function type
 */
type ValidationFunction<T = FormValue> = (value: T) => { isValid: boolean; error?: string };

/**
 * Form field configuration
 */
interface FormField<T = FormValue> {
  /** Field name/key */
  name: string;
  /** Initial value */
  initialValue: T;
  /** Validation function */
  validate?: ValidationFunction<T>;
  /** Whether field is required */
  required?: boolean;
}

/**
 * Form state interface
 */
interface FormState<T extends Record<string, FormValue> = Record<string, FormValue>> {
  /** Current field values */
  values: T;
  /** Field validation errors */
  errors: Partial<Record<keyof T, string>>;
  /** Whether form is currently submitting */
  isSubmitting: boolean;
  /** Whether form has been touched/submitted */
  isDirty: boolean;
  /** Whether all fields are valid */
  isValid: boolean;
}

/**
 * Form actions interface
 */
interface FormActions<T extends Record<string, FormValue>> {
  /** Set field value */
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  /** Set multiple field values */
  setValues: (values: Partial<T>) => void;
  /** Validate single field */
  validateField: <K extends keyof T>(field: K) => void;
  /** Validate entire form */
  validateForm: () => boolean;
  /** Reset form to initial state */
  reset: () => void;
  /** Handle form submission */
  handleSubmit: (onSubmit: (values: T) => Promise<void> | void) => Promise<void>;
  /** Set submitting state */
  setSubmitting: (submitting: boolean) => void;
}

/**
 * Props for useFormState hook
 */
interface UseFormStateProps<T extends Record<string, FormValue>> {
  /** Form field configurations */
  fields: FormField<T[keyof T]>[];
  /** Form submission handler */
  onSubmit?: (values: T) => Promise<void> | void;
  /** Whether to validate on blur */
  validateOnBlur?: boolean;
}

/**
 * Return type for useFormState hook
 */
type UseFormStateReturn<T extends Record<string, FormValue>> = FormState<T> & FormActions<T>;

/**
 * Creates a reusable form state management hook
 */
export function useFormState<T extends Record<string, FormValue>>({
  fields,
  onSubmit,
  validateOnBlur = true,
}: UseFormStateProps<T>): UseFormStateReturn<T> {
  // Initialize form state
  const initialValues = fields.reduce((acc, field) => {
    acc[field.name as keyof T] = field.initialValue;
    return acc;
  }, {} as T);

  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Calculate if form is valid
  const isValid = useMemo(() => {
    return Object.values(errors).every(error => !error) &&
           Object.entries(values).every(([key, value]) => {
             const field = fields.find(f => f.name === key);
             if (!field?.required) return true;
             if (field.required && typeof value === 'string') return value.trim().length > 0;
             if (field.required && typeof value === 'number') return value > 0;
             return true;
           });
  }, [errors, values, fields]);

  // Set single field value
  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValuesState(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  // Set multiple field values
  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...newValues }));
    setIsDirty(true);
  }, []);

  // Validate single field
  const validateField = useCallback(<K extends keyof T>(field: K) => {
    const fieldConfig = fields.find(f => f.name === field);
    if (!fieldConfig?.validate) return;

    const result = fieldConfig.validate(values[field]);
    setErrors(prev => ({
      ...prev,
      [field]: result.error || undefined,
    }));
  }, [fields, values]);

  // Validate entire form
  const validateForm = useCallback(() => {
    const newErrors: Partial<Record<keyof T, string>> = {};

    fields.forEach(field => {
      if (field.validate) {
        const result = field.validate(values[field.name as keyof T]);
        if (result.error) {
          newErrors[field.name as keyof T] = result.error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fields, values]);

  // Reset form to initial state
  const reset = useCallback(() => {
    setValuesState(initialValues);
    setErrors({});
    setIsSubmitting(false);
    setIsDirty(false);
  }, [initialValues]);

  // Handle form submission
  const handleSubmit = useCallback(async (submitHandler?: (values: T) => Promise<void> | void) => {
    const handler = submitHandler || onSubmit;
    if (!handler) return;

    setIsSubmitting(true);

    try {
      if (validateForm()) {
        await handler(values);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, validateForm, values]);

  // Set submitting state
  const setSubmitting = useCallback((submitting: boolean) => {
    setIsSubmitting(submitting);
  }, []);

  // Validate fields on blur if enabled
  useEffect(() => {
    if (validateOnBlur) {
      // This would typically be used with individual field blur handlers
      // For now, we'll validate on form submission
    }
  }, [validateOnBlur]);

  return {
    values,
    errors,
    isSubmitting,
    isDirty,
    isValid,
    setValue,
    setValues,
    validateField,
    validateForm,
    reset,
    handleSubmit,
    setSubmitting,
  };
}

/**
 * Hook for managing simple counter form state
 */
export const useCounterFormState = (initialCounter?: Counter | null) => {
  return useFormState<{
    name: string;
    value: number;
    dailyGoal: number;
    resetDailyCount: boolean;
  }>({
    fields: [
      {
        name: 'name',
        initialValue: initialCounter?.name || '',
        required: true,
        validate: (value: FormValue) => {
          const stringValue = String(value);
          if (!stringValue.trim()) return { isValid: false, error: 'Name is required' };
          if (stringValue.length > 50) return { isValid: false, error: 'Name must be 50 characters or less' };
          return { isValid: true };
        },
      },
      {
        name: 'value',
        initialValue: initialCounter?.value || 0,
        required: false,
        validate: (value: FormValue) => {
          const numberValue = Number(value);
          if (isNaN(numberValue)) {
            return { isValid: false, error: 'Value must be a valid number' };
          }
          if (numberValue < 0) return { isValid: false, error: 'Value cannot be negative' };
          return { isValid: true };
        },
      },
      {
        name: 'dailyGoal',
        initialValue: initialCounter?.dailyGoal || 0,
        required: false,
        validate: (value: FormValue) => {
          const numberValue = Number(value);
          if (isNaN(numberValue)) {
            return { isValid: false, error: 'Daily goal must be a valid number' };
          }
          if (numberValue < 0) return { isValid: false, error: 'Daily goal cannot be negative' };
          return { isValid: true };
        },
      },
      {
        name: 'resetDailyCount',
        initialValue: false,
        required: false,
        validate: (value: FormValue) => {
          return { isValid: true };
        },
      },
    ],
  });
};
