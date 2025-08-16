// Ensure counters table exists
async function ensureCountersTable() {
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

const supabaseUrl = process.env.SYNC_COUNTER_NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SYNC_COUNTER_NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Counter {
  id: string;
  name: string;
  value: number;
  lastUpdated?: number;
}


// Get all counters
export async function getCounters(): Promise<Counter[]> {
  await ensureCountersTable();
  const { data, error } = await supabase
    .from('counters')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Counter[];
}

// Get a specific counter
export async function getCounter(id: string): Promise<Counter | null> {
  await ensureCountersTable();
  const { data, error } = await supabase
    .from('counters')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as Counter;
}

// Add a new counter
export async function addCounter(counter: Counter): Promise<Counter> {
  await ensureCountersTable();
  const now = Date.now();
  const { data, error } = await supabase
    .from('counters')
    .insert([{ ...counter, lastUpdated: now }])
    .select()
    .single();
  if (error) throw error;
  return data as Counter;
}

// Update a counter's value
export async function updateCounter(id: string, updates: { name?: string; value?: number }): Promise<Counter | null> {
  await ensureCountersTable();
  const counter = await getCounter(id);
  if (!counter) return null;
  const now = Date.now();
  const updateFields: Partial<Counter> = { lastUpdated: now };
  if (typeof updates.value === 'number') updateFields.value = updates.value;
  if (typeof updates.name === 'string') updateFields.name = updates.name;
  const { data, error } = await supabase
    .from('counters')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Counter;
}

// Delete a counter
export async function deleteCounter(id: string): Promise<boolean> {
  await ensureCountersTable();
  const { error } = await supabase
    .from('counters')
    .delete()
    .eq('id', id);
  return !error;
}
