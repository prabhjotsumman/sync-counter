import { promises as fs } from 'fs';
import path from 'path';

export interface Counter {
  id: string;
  name: string;
  value: number;
  lastUpdated?: number;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'counters.json');

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Initialize default counters if file doesn't exist
async function initializeCounters(): Promise<Counter[]> {
  const now = Date.now();
  const defaultCounters: Counter[] = [
    { id: 'counter-1', name: 'Counter 1', value: 0, lastUpdated: now },
    { id: 'counter-2', name: 'Counter 2', value: 0, lastUpdated: now },
    { id: 'counter-3', name: 'Counter 3', value: 0, lastUpdated: now },
  ];
  
  await ensureDataDir();
  await fs.writeFile(DATA_FILE, JSON.stringify(defaultCounters, null, 2));
  return defaultCounters;
}

// Read counters from file
export async function getCounters(): Promise<Counter[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // If file doesn't exist, initialize with default counters
    return initializeCounters();
  }
}

// Write counters to file
async function saveCounters(counters: Counter[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(DATA_FILE, JSON.stringify(counters, null, 2));
}

// Update a specific counter
export async function updateCounter(id: string, delta: number): Promise<Counter | null> {
  const counters = await getCounters();
  const counterIndex = counters.findIndex(c => c.id === id);
  
  if (counterIndex === -1) {
    return null;
  }
  
  const now = Date.now();
  counters[counterIndex].value += delta;
  counters[counterIndex].lastUpdated = now;
  await saveCounters(counters);
  
  return counters[counterIndex];
}

// Get a specific counter
export async function getCounter(id: string): Promise<Counter | null> {
  const counters = await getCounters();
  return counters.find(c => c.id === id) || null;
}
