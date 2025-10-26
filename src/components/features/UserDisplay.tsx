import React, { useState, useEffect } from 'react';
import UserColorManager from './UserColorManager';
import { getUserColor } from '@/utils';

interface UserDisplayProps {
  currentUser: string | null;
  onUpdateUsername: () => void;
}

export default function UserDisplay({ currentUser, onUpdateUsername }: UserDisplayProps) {
  const [showColorManager, setShowColorManager] = useState(false);
  const [userColor, setUserColor] = useState('#3B82F6');

  const handleColorChange = (newColor: string) => {
    if (currentUser) {
      // This will be handled by the UserColorManager component
      // which will update the color in localStorage
      window.dispatchEvent(new CustomEvent('user-color-updated'));
    }
  };

  // Update color when current user changes or when color updates occur
  useEffect(() => {
    if (currentUser) {
      setUserColor(getUserColor(currentUser));
    } else {
      setUserColor('#3B82F6');
    }
  }, [currentUser]);

  // Listen for color update events
  useEffect(() => {
    const handleColorUpdate = () => {
      console.log(`🎨 UserDisplay: Received color update event`);
      if (currentUser) {
        const color = getUserColor(currentUser);
        console.log(`🎨 UserDisplay: Setting color to ${color} for user ${currentUser}`);
        setUserColor(color);
      }
    };

    console.log(`🎨 UserDisplay: Setting up color update event listener for user ${currentUser}`);
    window.addEventListener('user-color-updated', handleColorUpdate);
    return () => {
      console.log(`🎨 UserDisplay: Removing color update event listener for user ${currentUser}`);
      window.removeEventListener('user-color-updated', handleColorUpdate);
    };
  }, []); // Remove currentUser dependency to prevent re-creation

  if (!currentUser) return null;

  return (
    <div className="mt-8 pt-6 border-t border-gray-800">
      <div className="flex justify-center items-center gap-3 mb-4">
        <span className="text-gray-400 text-sm">Logged in as:</span>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border border-gray-600 cursor-pointer hover:border-gray-400 transition-colors"
            style={{ backgroundColor: userColor }}
            onClick={() => setShowColorManager(!showColorManager)}
            title="Click to manage colors"
          />
          <span className="text-white font-medium">{currentUser}</span>
        </div>
        <button
          onClick={onUpdateUsername}
          className="text-blue-400 hover:text-blue-300 transition-colors p-1"
          title="Change username"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
        </button>
      </div>

      {/* Color Manager (Collapsible) */}
      {showColorManager && (
        <div className="max-w-md mx-auto">
          <UserColorManager
            currentUser={currentUser}
            onColorChange={handleColorChange}
          />
        </div>
      )}
    </div>
  );
}
