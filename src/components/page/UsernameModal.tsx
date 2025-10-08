import React, { useState, useEffect } from 'react';
import { getUserColor, setUserColor } from '@/lib/offlineUtils';

const COLOR_OPTIONS = [
  '#3B82F6', // blue-500
  '#EF4444', // red-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
  '#6366F1', // indigo-500
];

export default function UsernameModal({ show, value, onChange, onSubmit, currentUser }: {
  show: boolean;
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  currentUser?: string | null;
}) {
  const [selectedColor, setSelectedColor] = useState('#3B82F6');

  useEffect(() => {
    if (show) {
      if (currentUser) {
        setSelectedColor(getUserColor(currentUser));
      }
      else {
        setSelectedColor('#3B82F6'); // default color
      }
    }
  }, [show, currentUser]);

  if (!show) return null;

  const isUpdate = !!currentUser;

  const handleSubmit = () => {
    if (value.trim()) {
      setUserColor(value.trim(), selectedColor);
      // Dispatch custom event to notify other components of color change
      window.dispatchEvent(new CustomEvent('user-color-updated'));
      onSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-white mb-6">
          {isUpdate ? 'Update Your Name' : 'Enter Your Name'}
        </h2>
        {isUpdate && (
          <p className="text-gray-400 text-sm mb-4">
            Current name: <span className="text-white font-medium">{currentUser}</span>
          </p>
        )}
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 mb-4"
          placeholder={isUpdate ? "Enter new name" : "Your name (required)"}
          autoFocus
        />

        {/* Color picker */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-medium mb-3">
            Choose your color:
          </label>
          <div className="grid grid-cols-5 gap-2">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 ${selectedColor === color
                    ? 'border-white scale-110'
                    : 'border-gray-600 hover:border-gray-400'
                  }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            className="flex-1 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            style={{
              backgroundColor: selectedColor,
              opacity: !value.trim() ? 0.5 : 1
            }}
            disabled={!value.trim()}
          >
            {isUpdate ? 'Update' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
