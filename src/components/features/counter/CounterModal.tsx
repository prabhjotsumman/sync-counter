'use client';
import { useCounterContext } from '@/providers/CounterContext';
import { CounterModalForm } from './CounterModalForm';

interface CounterModalProps {
  id: string;
}

export default function CounterModal({ id }: CounterModalProps) {
  const { modalOpen, modalMode, editingCounter } = useCounterContext();

  // Don't show modal if not open
  if (!modalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <CounterModalForm id={id} />
    </div>
  );
}