import React from 'react';

export interface InputFieldProps {
  label: string;
  type: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function InputField({
  label,
  type,
  value,
  onChange,
  placeholder,
  disabled = false,
}: InputFieldProps) {
  // Ensure value is never undefined to prevent uncontrolled to controlled issues
  const safeValue = value ?? (type === 'number' ? 0 : '');

  return (
    <div>
      <label className="block text-white text-sm font-medium mb-2">{label}</label>
      <input
        type={type}
        value={safeValue}
        onChange={onChange}
        className={`w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}
