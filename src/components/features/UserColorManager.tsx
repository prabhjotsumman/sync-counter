import React, { useState, useEffect } from 'react';
import { USER_COLOR_OPTIONS, getUserColor, setUserColor, getAllUserColors, clearAllUserColors, generateColorShade } from "@/utils";

/**
 * Props for the UserColorManager component
 */
interface UserColorManagerProps {
  currentUser: string;
  onColorChange?: (color: string) => void;
  className?: string;
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
  const [availableColors, setAvailableColors] = useState<string[]>(USER_COLOR_OPTIONS);
  const [userColors, setUserColors] = useState<Record<string, string>>({});
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [error, setError] = useState<string>('');
  const [, forceUpdate] = useState({});

  // Initial setup - load all colors even if currentUser is not yet available
  useEffect(() => {
    const allColors = getAllUserColors();
    setUserColors(allColors);
    console.log(`🎨 UserColorManager: Initial setup with ${Object.keys(allColors).length} user colors`);
  }, []);

  // Load current user's color when currentUser becomes available
  useEffect(() => {
    if (currentUser) {
      const currentUserColor = getUserColor(currentUser);
      console.log(`🎨 UserColorManager: Loading color ${currentUserColor} for newly available user ${currentUser}`);
      setSelectedColor(currentUserColor);

      // Also refresh user colors and available colors
      const allColors = getAllUserColors();
      setUserColors(allColors);
      const assignedColors = Object.values(allColors);
      setAvailableColors(USER_COLOR_OPTIONS.filter(color => !assignedColors.includes(color) || allColors[currentUser] === color));
    }
  }, [currentUser]);

  // Listen for color update events
  useEffect(() => {
    const handleColorUpdate = () => {
      console.log(`🎨 UserColorManager: Received color update event`);
      const allColors = getAllUserColors();
      setUserColors(allColors);

      // Set current user's color
      if (currentUser) {
        const currentUserColor = getUserColor(currentUser);
        console.log(`🎨 UserColorManager: Setting color to ${currentUserColor} for user ${currentUser}`);
        setSelectedColor(currentUserColor);
      }

      // Update available colors (exclude already assigned ones)
      const assignedColors = Object.values(allColors);
      setAvailableColors(USER_COLOR_OPTIONS.filter(color => !assignedColors.includes(color) || (currentUser && allColors[currentUser] === color)));
    };

    console.log(`🎨 UserColorManager: Setting up color update event listener for user ${currentUser}`);
    window.addEventListener('user-color-updated', handleColorUpdate);
    return () => {
      console.log(`🎨 UserColorManager: Removing color update event listener for user ${currentUser}`);
      window.removeEventListener('user-color-updated', handleColorUpdate);
    };
  }, [currentUser]); // Keep currentUser dependency but ensure it works correctly

  const handleColorSelect = async (color: string) => {
    if (currentUser && color !== selectedColor) {
      setError('');

      try {
        // Update the color for current user
        setUserColor(currentUser, color);

        // Update local state immediately
        setSelectedColor(color);

        // Refresh user colors from localStorage (to ensure we have the latest)
        const allColors = getAllUserColors();
        setUserColors(allColors);

        // Update available colors (exclude already assigned ones)
        const assignedColors = Object.values(allColors);
        const updatedAvailableColors = USER_COLOR_OPTIONS.filter(c => !assignedColors.includes(c) || c === color);
        setAvailableColors(updatedAvailableColors);

        // Notify parent component
        onColorChange?.(color);

        // Dispatch event to notify other components (with small delay to ensure localStorage is updated)
        setTimeout(() => {
          console.log(`🎨 UserColorManager: Dispatching user-color-updated event for ${currentUser} with color ${color}`);
          window.dispatchEvent(new CustomEvent('user-color-updated'));
        }, 10);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to update color');
      }
    }
  };

  const handleResetColors = async () => {
    try {
      clearAllUserColors();
      setUserColors({});
      setAvailableColors(USER_COLOR_OPTIONS);
      setSelectedColor('#3B82F6'); // Reset to default
      onColorChange?.('#3B82F6');

      // Dispatch event with small delay to ensure localStorage is updated
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('user-color-updated'));
      }, 10);
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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current User Color Display */}
      <div className="text-center">
        <div className="text-sm text-gray-600 mb-2">Your Color</div>
        <div
          key={`color-display-${selectedColor}`}
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
        <div key={`color-grid-${selectedColor}`} className="grid grid-cols-5 gap-2">
          {USER_COLOR_OPTIONS.map((color) => {
            const isSelected = selectedColor === color;
            const isAssignedToOther = Object.entries(userColors).some(([username, userColor]) =>
              username !== currentUser && userColor === color
            );

            return (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                disabled={isAssignedToOther}
                className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                  isSelected
                    ? 'border-gray-800 scale-110 shadow-lg'
                    : isAssignedToOther
                      ? 'border-gray-200 cursor-not-allowed opacity-50'
                      : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color }}
                title={isAssignedToOther ? `Unavailable - assigned to ${Object.keys(userColors).find(user => userColors[user] === color)}` : `Select ${color}`}
              >
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full border border-gray-800" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Shade Preview - Show how progress bar will look with multiple users */}
      {Object.keys(userColors).length > 1 && (() => {
        // Check if current user's color is shared with other users
        const usersWithSameColor = Object.entries(userColors)
          .filter(([_, color]) => color === selectedColor)
          .map(([username, _]) => username);

        if (usersWithSameColor.length > 1) {
          return (
            <div key={`shade-preview-${selectedColor}`} className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-600">
              <div className="text-sm text-gray-400 mb-3">Progress Bar Preview (Multiple Users)</div>
              <div className="text-xs text-gray-500 mb-2">
                When multiple users have the same color, the progress bar shows different shades:
              </div>
              <div className="flex gap-1 mb-2">
                <div className="text-xs text-gray-500">Users:</div>
                {usersWithSameColor.map((username, index) => (
                  <span key={username} className="text-xs px-2 py-1 rounded" style={{
                    backgroundColor: generateColorShade(selectedColor, index),
                    color: 'white'
                  }}>
                    {username}{index === 0 ? ' (You)' : ''}
                  </span>
                ))}
              </div>
              <div className="w-full h-4 bg-gray-700 rounded relative overflow-hidden">
                {usersWithSameColor.map((username, index) => {
                  const shade = generateColorShade(selectedColor, index);
                  const widthPercent = 100 / usersWithSameColor.length;

                  return (
                    <div
                      key={username}
                      className="absolute top-0 h-full transition-all duration-300"
                      style={{
                        left: `${index * widthPercent}%`,
                        width: `${widthPercent}%`,
                        backgroundColor: shade
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        }
        return null;
      })()}

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
