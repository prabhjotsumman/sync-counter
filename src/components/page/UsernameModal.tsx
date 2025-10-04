import React from 'react';

export default function UsernameModal({ show, value, onChange, onSubmit }: {
  show: boolean;
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
}) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-white mb-6">Enter Your Name</h2>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          placeholder="Your name (required)"
          autoFocus
        />
        <div className="flex gap-3 mt-8">
          <button
            onClick={onSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            disabled={!value.trim()}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
