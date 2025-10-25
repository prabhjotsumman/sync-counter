import { useEffect, useRef } from 'react';

import type { CounterData } from '@/hooks/useCountersPageLogic';

interface SyncEvent {
  type: 'initial' | 'counter_created' | 'counter_updated' | 'counter_deleted' | 'counter_incremented';
  counter?: CounterData;
  counters?: CounterData[];
  timestamp: number;
}

interface UseRealtimeSyncProps {
  onCounterCreated?: (counter: CounterData) => void;
  onCounterUpdated?: (counter: CounterData) => void;
  onCounterDeleted?: (counter: CounterData) => void;
  onCounterIncremented?: (counter: CounterData) => void;
  onInitialData?: (counters: CounterData[]) => void;
  isOnline?: boolean;
}

export function useRealtimeSync({
  onCounterCreated,
  onCounterUpdated,
  onCounterDeleted,
  onCounterIncremented,
  onInitialData,
  isOnline = true
}: UseRealtimeSyncProps) {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Only create connection if online and not already connected
    if (!isOnline || eventSourceRef.current) {
      return;
    }

    console.log('Creating SSE connection...');
    const eventSource = new EventSource('/api/sync');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data: SyncEvent = JSON.parse(event.data);
        console.log('📨 SSE Message received:', data);

        const callbacks = callbacksRef.current;

        switch (data.type) {
          case 'initial':
            console.log('🎯 Initial data received:', data.counters?.length || 0, 'counters');
            if (callbacks.onInitialData && data.counters) {
              callbacks.onInitialData(data.counters);
            }
            break;
          case 'counter_created':
            console.log('➕ Counter created:', data.counter?.name);
            if (callbacks.onCounterCreated && data.counter) {
              callbacks.onCounterCreated(data.counter);
            }
            break;
          case 'counter_updated':
            console.log('🔄 Counter updated:', data.counter?.name);
            if (callbacks.onCounterUpdated && data.counter) {
              callbacks.onCounterUpdated(data.counter);
            }
            break;
          case 'counter_deleted':
            console.log('🗑️ Counter deleted:', data.counter?.name);
            if (callbacks.onCounterDeleted && data.counter) {
              callbacks.onCounterDeleted(data.counter);
            }
            break;
          case 'counter_incremented':
            console.log('📈 Counter incremented:', data.counter?.name);
            if (callbacks.onCounterIncremented && data.counter) {
              callbacks.onCounterIncremented(data.counter);
            }
            break;
        }
      } catch (error) {
        console.error('❌ Error parsing sync event:', error, 'Raw data:', event.data);
      }
    };

    eventSource.onopen = () => {
      console.log('✅ SSE connection established successfully');
    };

    eventSource.onerror = (error) => {
      console.error('❌ EventSource error:', error);
      // Close connection on error
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };

    // Cleanup on unmount or when going offline
    return () => {
      if (eventSourceRef.current) {
        console.log('Closing SSE connection...');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isOnline]); // Only depend on isOnline, not the callback functions

  // Store callback functions in ref to avoid recreating connection
  const callbacksRef = useRef({
    onCounterCreated,
    onCounterUpdated,
    onCounterDeleted,
    onCounterIncremented,
    onInitialData
  });

  // Update callbacks without recreating connection
  useEffect(() => {
    callbacksRef.current = {
      onCounterCreated,
      onCounterUpdated,
      onCounterDeleted,
      onCounterIncremented,
      onInitialData
    };
  }, [onCounterCreated, onCounterUpdated, onCounterDeleted, onCounterIncremented, onInitialData]);

  return {
    isConnected: !!eventSourceRef.current
  };
}
