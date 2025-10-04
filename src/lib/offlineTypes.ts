// offlineTypes.ts
import { Counter } from './counters';

export const COUNTERS_STORAGE_KEY = 'offline_counters';
export const PENDING_CHANGES_KEY = 'pending_changes';

export interface OfflineCounterData {
  counters: Counter[];
  lastSync: number;
  lastServerSync: number;
}

export interface PendingChange {
  id: string;
  type: 'increment' | 'create' | 'update' | 'delete';
  timestamp: number;
  delta?: number;
  previousValue?: number;
  newValue?: number;
  counterData?: Omit<Counter, 'id'> & { id?: string };
}
