import { NextRequest, NextResponse } from 'next/server';
import type { Counter } from '@/lib/counters';
import { updateCounter, getCounter, addCounter } from '@/lib/counters';
import { broadcastUpdate } from '../../../sync/broadcast';
import { getTodayString, getTodayWeekdayUTC, toCalgaryDate } from '@/utils';

/**
 * Converts a date string to UTC date string format
 * @param dateString - Date string in any format
 * @returns Date string in YYYY-MM-DD format (UTC)
 */
const normalizeToUTCDate = (dateString?: string): string => {
  if (!dateString) return getTodayString();

  try {
    // Try to parse the date string
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return getTodayString();
    }

    const calgaryDate = toCalgaryDate(date);
    const year = calgaryDate.getFullYear();
    const month = String(calgaryDate.getMonth() + 1).padStart(2, '0');
    const day = String(calgaryDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return getTodayString();
  }
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { today, currentUser } = await request.json();
    // Normalize user name: first letter capital, rest lowercase
    const normalizedUser = currentUser ? currentUser.charAt(0).toUpperCase() + currentUser.slice(1).toLowerCase() : undefined;
    const current = await getCounter(id);
    let counterToUpdate = current;

    if (!current) {
      console.log(`Counter ${id} not found, creating new counter`);

      // Create a new counter with basic structure
      const newCounter = await addCounter({
        id,
        name: `Counter ${id.slice(-8)}`, // Use last 8 chars of ID as name
        value: 0,
        dailyGoal: 0,
        dailyCount: 0,
        users: {},
        history: {},
        lastUpdated: Date.now()
      });

      console.log(`Created new counter ${id} with name: ${newCounter.name}`);
      counterToUpdate = newCounter;
    }

    if (!counterToUpdate) {
      return NextResponse.json({ error: 'Failed to create counter' }, { status: 500 });
    }

    // Use UTC date for consistency across timezones
    const dateKey = normalizeToUTCDate(today);
    const history = counterToUpdate.history || {};
    const users = { ...(counterToUpdate.users || {}) };

    // Update today's user count
    if (normalizedUser) {
      users[normalizedUser] = (users[normalizedUser] || 0) + 1;
    }

    // Update history for today (UTC)
    const dayName = getTodayWeekdayUTC();

    if (!history[dateKey]) {
      history[dateKey] = { users: {}, total: 0, day: dayName };
    }

    // Always update the day property in case of manual edits or timezone changes
    history[dateKey].day = dayName;

    if (normalizedUser) {
      if (!history[dateKey].users) history[dateKey].users = {};
      history[dateKey].users[normalizedUser] = (history[dateKey].users[normalizedUser] || 0) + 1;
    }

    history[dateKey].total = Object.values(history[dateKey].users).reduce((a, b) => (a as number) + (b as number), 0);

    // Calculate new dailyCount for today in Calgary time
    let newDailyCount = 0;
    if (history[dateKey] && history[dateKey].users) {
      newDailyCount = Object.values(history[dateKey].users).reduce((a, b) => (a as number) + (b as number), 0);
    }

    const updatedCounter = await updateCounter(id, {
      value: counterToUpdate.value + 1,
      users,
      history,
      dailyCount: newDailyCount
    });

    if (!updatedCounter) {
      return NextResponse.json(
        { error: 'Counter not found' },
        { status: 404 }
      );
    }

    const response = {
      counter: updatedCounter,
      timestamp: Date.now()
    };

    broadcastUpdate({
      type: 'counter_incremented',
      counter: updatedCounter,
      timestamp: Date.now()
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ POST /api/counters/[id]/increment - Error incrementing counter:', error);

    // Check if it's a table not found error
    if (error instanceof Error && error.message?.includes('relation "counters" does not exist')) {
      return NextResponse.json(
        {
          error: 'Database table not found. Please run the database setup SQL in your Supabase dashboard.',
          details: 'Go to Supabase SQL Editor and run the SQL from database-setup.sql'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to increment counter', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
