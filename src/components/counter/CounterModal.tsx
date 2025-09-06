'use client';

import { useState, useEffect } from 'react';
import { Counter } from '@/lib/counters';

interface CounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  counter?: Counter | null;
  mode: 'edit' | 'add';
  onSave: (counter: Omit<Counter, 'id'> & { id?: string }) => void;
}

export default function CounterModal({ 
  isOpen, 
  onClose, 
  counter, 
  mode, 
  onSave
}: CounterModalProps) {
  const [name, setName] = useState('');
  const [value, setValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && counter) {
        setName(counter.name);
        setValue(counter.value);
      } else {
        setName('');
        setValue(0);
      }
    }
  }, [isOpen, mode, counter]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a counter name');
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        id: counter?.id,
        name: name.trim(),
        value: value
      });
      onClose();
    } catch (error) {
      console.error('Failed to save counter:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-white mb-6">
          {mode === 'edit' ? 'Edit Counter' : 'Add New Counter'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Counter Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter counter name"
            />
          </div>
          
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Initial Value
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="0"
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-8">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            {isLoading ? 'Saving...' : (mode === 'edit' ? 'Save Changes' : 'Add Counter')}
          </button>
          
          <button
            onClick={onClose}
            disabled={isLoading}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
