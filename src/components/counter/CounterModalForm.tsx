import React, { useState, useEffect } from 'react';
import { InputField } from './InputField';
import { useCounterContext } from '@/context/CounterContext';

interface CounterModalFormProps {
  id: string;
}

export function CounterModalForm({ id }: CounterModalFormProps) {
  const {
    modalOpen,
    setModalOpen,
    editingCounter,
    handleSaveCounter,
    modalMode,
  } = useCounterContext();

  const [name, setName] = useState('');
  const [value, setValue] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!modalOpen) return;
    if (modalMode === 'edit' && editingCounter) {
      setName(editingCounter.name);
      setValue(editingCounter.value);
      setDailyGoal(editingCounter.dailyGoal || 0);
    } else if (modalMode === 'add') {
      setName('');
      setValue(0);
      setDailyGoal(0);
    }
  }, [modalOpen, modalMode, editingCounter]);

  const handleInputChange = <T extends string | number>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    isNumber = false
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(isNumber ? (parseInt(e.target.value) || 0) as T : (e.target.value as T));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a counter name');
      return;
    }
    setIsLoading(true);
    try {
      const safeDailyGoal = typeof dailyGoal === 'number' && !isNaN(dailyGoal) ? dailyGoal : 0;
      if (modalMode === 'edit' && editingCounter) {
        await handleSaveCounter({
          id: editingCounter.id,
          name: name.trim(),
          value,
          dailyGoal: safeDailyGoal,
        });
      } else {
        await handleSaveCounter({
          name: name.trim(),
          value,
          dailyGoal: safeDailyGoal,
        });
      }
      setModalOpen(false);
    } catch (error) {
      console.error('Failed to save counter:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!modalOpen || (modalMode === 'edit' && !editingCounter)) return null;

  return (
    <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4">
      <h2 className="text-2xl font-bold text-white mb-6">
        {modalMode === 'edit' ? 'Edit Counter' : 'Add Counter'}
      </h2>
      <div className="space-y-4">
        <InputField
          label="Counter Name"
          type="text"
          value={name}
          onChange={handleInputChange(setName)}
          placeholder="Enter counter name"
        />
        <InputField
          label="Initial Value"
          type="number"
          value={value}
          onChange={handleInputChange(setValue, true)}
          placeholder="0"
        />
        <InputField
          label="Daily Goal"
          type="number"
          value={dailyGoal}
          onChange={handleInputChange(setDailyGoal, true)}
          placeholder="Enter daily goal (optional)"
        />
      </div>
      <div className="flex gap-3 mt-8">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={() => setModalOpen(false)}
          disabled={isLoading}
          className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
