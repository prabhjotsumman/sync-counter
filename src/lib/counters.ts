export interface Counter {
  id: string;
  name: string;
  value: number;
  lastUpdated?: number;
  currentUser?: string;
}

// Type guard for Counter
function isCounter(obj: unknown): obj is Counter {
  if (typeof obj !== 'object' || obj === null) return false;
  const c = obj as Record<string, unknown>;
  return typeof c.id === 'string' && typeof c.name === 'string' && typeof c.value === 'number';
}

// Ensure counters table exists
async function ensureCountersTable() {
  if (!supabase) return;
  const { error } = await supabase.rpc('check_counters_table');
  if (error && error.message.includes('function check_counters_table() does not exist')) {
    // Try to create the table using a raw SQL query
    await supabase
      .from('counters')
      .select('*')
      .limit(1);
    // If error, attempt to create table
    // Supabase client does not support DDL, so you must run this SQL manually if it fails:
    // CREATE TABLE public.counters (id text primary key, name text not null, value integer not null default 0, lastUpdated bigint);
  }
}

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const isProd = process.env.NODE_ENV === 'production';
const localDbPath = !isProd ? process.env.SYNC_COUNTER_LOCAL_DB_PATH : undefined;
const isLocal = !!localDbPath;

let supabase: ReturnType<typeof createClient> | null = null;
if (isProd || !isLocal) {
  const supabaseUrl = process.env.SYNC_COUNTER_NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.SYNC_COUNTER_NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  supabase = createClient(supabaseUrl, supabaseKey);
}

// Get all counters
export async function getCounters(currentUser?: string): Promise<Counter[]> {
  if (isLocal && localDbPath) {
    const dbFile = path.resolve(process.cwd(), localDbPath);
    if (!fs.existsSync(dbFile)) return [];
    const data = fs.readFileSync(dbFile, 'utf-8');
    return JSON.parse(data) as Counter[];
  } else {
    await ensureCountersTable();
    const { data, error } = await supabase!.from('counters').select('*').order('name', { ascending: true });
    if (error) throw error;
    return Array.isArray(data) ? (data.filter(isCounter) as unknown as Counter[]) : [];
  }
}

// Get a specific counter
export async function getCounter(id: string, currentUser?: string): Promise<Counter | null> {
  if (isLocal && localDbPath) {
    const counters = await getCounters();
    return counters.find(c => c.id === id) || null;
  } else {
    await ensureCountersTable();
    const { data, error } = await supabase!.from('counters').select('*').eq('id', id).single();
    if (error || !isCounter(data)) return null;
    return data as Counter;
  }
}

// Add a new counter
export async function addCounter(counter: Counter, currentUser?: string): Promise<Counter> {
  if (isLocal && localDbPath) {
    const dbFile = path.resolve(process.cwd(), localDbPath);
    const counters = fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile, 'utf-8')) : [];
    const now = Date.now();
  const newCounter = { ...counter, lastUpdated: now, currentUser };
    counters.push(newCounter);
    fs.writeFileSync(dbFile, JSON.stringify(counters, null, 2));
    return newCounter;
  } else {
  await ensureCountersTable();
  const now = Date.now();
  const { data, error } = await supabase!.from('counters').insert([{ ...counter, lastUpdated: now, currentUser }]).select().single();
  if (error || !isCounter(data)) throw error;
  return data as Counter;
  }
}

// Update a counter's value
export async function updateCounter(id: string, updates: { name?: string; value?: number }, currentUser?: string): Promise<Counter | null> {
  if (isLocal && localDbPath) {
    const dbFile = path.resolve(process.cwd(), localDbPath);
    const counters: Counter[] = fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile, 'utf-8')) : [];
    const idx = counters.findIndex(c => c.id === id);
    if (idx === -1) return null;
    const now = Date.now();
    counters[idx] = { ...counters[idx], ...updates, lastUpdated: now };
    fs.writeFileSync(dbFile, JSON.stringify(counters, null, 2));
    return counters[idx];
  } else {
    await ensureCountersTable();
    const counter = await getCounter(id);
    if (!counter) return null;
    const now = Date.now();
    const updateFields: Partial<Counter> = { lastUpdated: now };
    if (typeof updates.value === 'number') updateFields.value = updates.value;
    if (typeof updates.name === 'string') updateFields.name = updates.name;
    const { data, error } = await supabase!.from('counters').update(updateFields).eq('id', id).select().single();
    if (error || !isCounter(data)) throw error;
    return data as Counter;
  }
}

// Delete a counter
export async function deleteCounter(id: string, currentUser?: string): Promise<boolean> {
  if (isLocal && localDbPath) {
    const dbFile = path.resolve(process.cwd(), localDbPath);
    const counters: Counter[] = fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile, 'utf-8')) : [];
    const newCounters = counters.filter(c => c.id !== id);
    fs.writeFileSync(dbFile, JSON.stringify(newCounters, null, 2));
    return newCounters.length !== counters.length;
  } else {
    await ensureCountersTable();
    const { error } = await supabase!.from('counters').delete().eq('id', id);
    return !error;
  }
}
