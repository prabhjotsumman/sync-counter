import React, { useState, useEffect, useCallback } from 'react';
import { USER_COLOR_OPTIONS, getUserColor, setUserColor } from "@/utils";

export default function UsernameModal({ show, value, onChange, onSubmit, onCancel, currentUser }: {
  show: boolean;
  value: string;
  onChange: (val: string) => void;
  onSubmit: (username: string, color?: string) => void;
  onCancel?: () => void;
  currentUser?: string | null;
}) {
  const [selectedColor, setSelectedColor] = useState('#3B82F6');

  // Load current user's color when in update mode
  useEffect(() => {
    if (currentUser) {
      const currentColor = getUserColor(currentUser);
      setSelectedColor(currentColor);
    } else {
      setSelectedColor('#3B82F6'); // Default for new users
    }
  }, [currentUser]);

  // Handle click outside modal
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onCancel) {
      onCancel();
    }
  }, [onCancel]);

  const isUpdate = !!currentUser;

  const handleSubmit = useCallback(() => {
    if (value.trim()) {
      // Ensure the color is stored for the new/changed username
      const finalUsername = value.trim();
      setUserColor(finalUsername, selectedColor);

      // Dispatch custom event to notify other components of color change
      window.dispatchEvent(new CustomEvent('user-color-updated'));
      onSubmit(finalUsername, selectedColor);
    }
  }, [value, selectedColor, onSubmit]);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  // Handle color selection
  const handleColorSelect = useCallback((color: string) => {
    setSelectedColor(color);
    // Store color immediately for current user
    if (currentUser) {
      setUserColor(currentUser, color);
      window.dispatchEvent(new CustomEvent('user-color-updated'));
    }
  }, [currentUser]);

  // Handle keyboard events - combined single useEffect
  useEffect(() => {
    if (!show) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onCancel) {
        onCancel();
      } else if (e.key === 'Enter' && value.trim()) {
        handleSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, onCancel, value, handleSubmit]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
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
            {USER_COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
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
          {onCancel && (
            <button
              onClick={handleCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
