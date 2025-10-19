/**
 * User color management functions for server synchronization
 */

import { createClient } from '@supabase/supabase-js';

const isProd = process.env.NODE_ENV === 'production';
const supabase = isProd
  ? createClient(
      process.env.SYNC_COUNTER_NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.SYNC_COUNTER_NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    )
  : null;

// User color interface
export interface UserColor {
  username: string;
  color: string;
  lastUpdated: number;
}

// In-memory cache for user colors (for performance)
let userColorCache: Record<string, string> = {};
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Check if user_colors table exists
 */
async function ensureUserColorsTable(): Promise<boolean> {
  if (!supabase) return false;

  try {
    // Try to query the table
    const { error } = await supabase
      .from('user_colors')
      .select('username')
      .limit(1);

    // If no error, table exists
    if (!error) return true;

    // If table doesn't exist, try to create it
    // Note: This is a simple approach - in production you might want to use migrations
    console.warn('user_colors table does not exist. User colors will only be stored locally.');
    return false;
  } catch {
    return false;
  }
}

/**
 * Get user color from server
 */
export async function getUserColorFromServer(username: string): Promise<string | null> {
  if (!supabase) return null;

  try {
    const tableExists = await ensureUserColorsTable();
    if (!tableExists) return null;

    // Check cache first
    if (userColorCache[username] && Date.now() - lastCacheUpdate < CACHE_DURATION) {
      return userColorCache[username];
    }

    const { data, error } = await supabase
      .from('user_colors')
      .select('color')
      .eq('username', username)
      .single();

    if (error || !data) return null;

    // Update cache
    userColorCache[username] = data.color;
    lastCacheUpdate = Date.now();

    return data.color;
  } catch {
    return null;
  }
}

/**
 * Save user color to server
 */
export async function saveUserColorToServer(username: string, color: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const tableExists = await ensureUserColorsTable();
    if (!tableExists) return false;

    const now = Date.now();

    const { error } = await supabase
      .from('user_colors')
      .upsert({
        username,
        color,
        lastUpdated: now
      });

    if (error) return false;

    // Update cache
    userColorCache[username] = color;
    lastCacheUpdate = Date.now();

    return true;
  } catch {
    return false;
  }
}

/**
 * Get all user colors from server
 */
export async function getAllUserColorsFromServer(): Promise<Record<string, string>> {
  if (!supabase) return {};

  try {
    const tableExists = await ensureUserColorsTable();
    if (!tableExists) return {};

    const { data, error } = await supabase
      .from('user_colors')
      .select('username, color');

    if (error || !data) return {};

    const userColors: Record<string, string> = {};
    data.forEach(item => {
      userColors[item.username] = item.color;
    });

    // Update cache
    userColorCache = { ...userColorCache, ...userColors };
    lastCacheUpdate = Date.now();

    return userColors;
  } catch {
    return {};
  }
}

/**
 * Delete user color from server
 */
export async function deleteUserColorFromServer(username: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const tableExists = await ensureUserColorsTable();
    if (!tableExists) return false;

    const { error } = await supabase
      .from('user_colors')
      .delete()
      .eq('username', username);

    if (error) return false;

    // Remove from cache
    delete userColorCache[username];

    return true;
  } catch {
    return false;
  }
}
