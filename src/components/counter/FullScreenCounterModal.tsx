
import ProgressBar from './ProgressBar';

interface FullScreenCounterModalProps {
  name: string;
  value: number;
  dailyGoal?: number;
  dailyCount?: number;
  onIncrement: () => void;
  onClose: () => void;
  open: boolean;
}


const FullScreenCounterModal: React.FC<FullScreenCounterModalProps> = ({ name, value, dailyGoal, dailyCount, onIncrement, onClose, open }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black text-white items-center justify-center"
      style={{ minHeight: '100vh', minWidth: '100vw', touchAction: 'manipulation' }}
      onClick={onIncrement}
    >
      {/* Progress bar in top-right corner (absolute) */}
      {typeof dailyGoal === 'number' && dailyGoal > 0 && (
        <div className="absolute top-0 right-0 w-full max-w-full z-10">
          <ProgressBar counterName={name} value={dailyCount || 0} max={dailyGoal} />
        </div>
      )}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <span className="text-[7rem] font-extrabold text-white drop-shadow-lg select-none" style={{ letterSpacing: '0.05em' }}>{value}</span>
      </div>
      {/* Floating close button */}
      <button
        className="fixed bottom-8 right-8 bg-gray-900 hover:bg-gray-700 text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center text-3xl border border-gray-700"
        style={{ zIndex: 100 }}
        onClick={e => { e.stopPropagation(); onClose(); }}
        aria-label="Close Fullscreen"
      >
        &times;
      </button>
    </div>
  );
};

export default FullScreenCounterModal;
