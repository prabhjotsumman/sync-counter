import React, { useState, useEffect } from 'react';
import { getUserColor } from '@/lib/offlineUtils';

interface UserDisplayProps {
  currentUser: string | null;
  onUpdateUsername: () => void;
}

export default function UserDisplay({ currentUser, onUpdateUsername }: UserDisplayProps) {
  const [userColor, setUserColor] = useState('#3B82F6');
  
  useEffect(() => {
    if (currentUser) {
      setUserColor(getUserColor(currentUser));
    }
  }, [currentUser]);
  
  useEffect(() => {
    const handleUserUpdate = () => {
      if (currentUser) {
        setUserColor(getUserColor(currentUser));
      }
    };
    
    window.addEventListener('user-color-updated', handleUserUpdate);
    return () => window.removeEventListener('user-color-updated', handleUserUpdate);
  }, [currentUser]);
  
  if (!currentUser) return null;

  return (
    <div className="flex justify-center items-center gap-3 mt-8 pt-6 border-t border-gray-800">
      <span className="text-gray-400 text-sm">Logged in as:</span>
      <div className="flex items-center gap-2">
        <div 
          className="w-4 h-4 rounded-full border border-gray-600"
          style={{ backgroundColor: userColor }}
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
  );
}
