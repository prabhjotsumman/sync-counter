import React, { useState, useEffect } from 'react';
import { getUserColor, setUserColor, getAvailableColors, getAllUserColors, resetAllUserColors } from '@/lib/offlineUtils';

/**
 * Props for the UserColorManager component
 */
interface UserColorManagerProps {
  currentUser: string;
  onColorChange?: (color: string) => void;
  className?: string;
}

/**
 * Color option interface
 */
interface ColorOption {
  color: string;
  label: string;
  isAvailable: boolean;
  assignedTo?: string;
}

/**
 * User Color Management Component
 * Allows users to view and change their assigned colors
 */
export const UserColorManager: React.FC<UserColorManagerProps> = ({
  currentUser,
  onColorChange,
  className = ''
}) => {
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [userColors, setUserColors] = useState<Record<string, string>>({});
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (currentUser) {
      getUserColor(currentUser).then((userColor) => {
        setSelectedColor(userColor);
        setAvailableColors(getAvailableColors());
        setUserColors(getAllUserColors());
      });
    }
  }, [currentUser]);

  const handleColorSelect = async (color: string) => {
    if (currentUser && color !== selectedColor) {
      setError('');

      try {
        await setUserColor(currentUser, color);
        setSelectedColor(color);
        onColorChange?.(color);

        // Update local state
        setAvailableColors(getAvailableColors());
        setUserColors(getAllUserColors());
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to update color');
      }
    }
  };

  const handleResetColors = async () => {
    try {
      await resetAllUserColors();
      setUserColors({});
      if (currentUser) {
        const newColor = await getUserColor(currentUser);
        setSelectedColor(newColor);
        setAvailableColors(getAvailableColors());
        onColorChange?.(newColor);
      }
    } catch (error) {
      setError('Failed to reset colors');
    }
  };

  if (!currentUser) {
    return (
      <div className={`text-center text-gray-500 ${className}`}>
        Please set a username to manage colors
      </div>
    );
  }

  const colorOptions: ColorOption[] = [
    { color: '#3B82F6', label: 'Blue', isAvailable: availableColors.includes('#3B82F6') },
    { color: '#EF4444', label: 'Red', isAvailable: availableColors.includes('#EF4444') },
    { color: '#10B981', label: 'Green', isAvailable: availableColors.includes('#10B981') },
    { color: '#F59E0B', label: 'Amber', isAvailable: availableColors.includes('#F59E0B') },
    { color: '#8B5CF6', label: 'Violet', isAvailable: availableColors.includes('#8B5CF6') },
    { color: '#EC4899', label: 'Pink', isAvailable: availableColors.includes('#EC4899') },
    { color: '#06B6D4', label: 'Cyan', isAvailable: availableColors.includes('#06B6D4') },
    { color: '#84CC16', label: 'Lime', isAvailable: availableColors.includes('#84CC16') },
    { color: '#F97316', label: 'Orange', isAvailable: availableColors.includes('#F97316') },
    { color: '#6366F1', label: 'Indigo', isAvailable: availableColors.includes('#6366F1') },
  ].map(option => ({
    ...option,
    assignedTo: Object.keys(userColors).find(user => userColors[user] === option.color)
  }));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current User Color Display */}
      <div className="text-center">
        <div className="text-sm text-gray-600 mb-2">Your Color</div>
        <div
          className="w-12 h-12 rounded-full mx-auto border-2 border-gray-300 shadow-lg"
          style={{ backgroundColor: selectedColor }}
        />
        <div className="text-sm font-mono mt-1 text-gray-700">{selectedColor}</div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 text-center bg-red-50 p-2 rounded border border-red-200">
          {error}
        </div>
      )}

      {/* Available Colors */}
      <div>
        <div className="text-sm text-gray-600 mb-3">Available Colors</div>
        <div className="grid grid-cols-5 gap-2">
          {colorOptions.map(({ color, label, isAvailable, assignedTo }) => (
            <button
              key={color}
              onClick={() => isAvailable && handleColorSelect(color)}
              disabled={!isAvailable}
              className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                selectedColor === color
                  ? 'border-gray-800 scale-110 shadow-lg'
                  : isAvailable
                    ? 'border-gray-300 hover:border-gray-400'
                    : 'border-gray-200 cursor-not-allowed'
              }`}
              style={{ backgroundColor: color }}
              title={isAvailable ? `Select ${label}` : `Unavailable - assigned to ${assignedTo || 'another user'}`}
            >
              {selectedColor === color && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full border border-gray-800" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* User Color Assignments (Collapsible) */}
      {Object.keys(userColors).length > 0 && (
        <div>
          <button
            onClick={() => setShowAllUsers(!showAllUsers)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            {showAllUsers ? 'Hide' : 'Show'} all user colors ({Object.keys(userColors).length})
          </button>

          {showAllUsers && (
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {Object.entries(userColors).map(([username, color]) => (
                <div key={username} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-medium">{username}</span>
                  <span className="text-gray-500 font-mono text-xs">{color}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reset Button */}
      <div className="pt-2 border-t border-gray-200">
        <button
          onClick={handleResetColors}
          className="w-full px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-200 hover:border-red-300 transition-colors"
        >
          Reset All Colors
        </button>
      </div>
    </div>
  );
};

export default UserColorManager;
