
import { useCounterContext } from '@/context/CounterContext';
import { CounterModalForm } from './CounterModalForm';

interface CounterModalProps {
  id: string;
}

export default function CounterModal({ id }: CounterModalProps) {
  const { modalOpen, modalMode, editingCounter } = useCounterContext();
  if (!modalOpen || (modalMode === 'edit' && !editingCounter)) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <CounterModalForm id={id} />
    </div>
  );
}