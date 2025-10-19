import { NextRequest, NextResponse } from 'next/server';
import { updateCounter } from '@/lib/counters';
import { broadcastUpdate } from '../../../sync/broadcast';

/**
 * Gets today's date in UTC using YYYY-MM-DD format
 * @returns Today's date string in YYYY-MM-DD format (UTC)
 */
const getTodayStringUTC = (): string => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Converts a date string to UTC date string format
 * @param dateString - Date string in any format
 * @returns Date string in YYYY-MM-DD format (UTC)
 */
const normalizeToUTCDate = (dateString?: string): string => {
  if (!dateString) return getTodayStringUTC();

  try {
    // Try to parse the date string
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return getTodayStringUTC();
    }

    // Convert to UTC and format
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return getTodayStringUTC();
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
    const current = await (await import('@/lib/counters')).getCounter(id);
    console.log("currentCounter", current);
    if (!current) {
      return NextResponse.json({ error: 'Counter not found' }, { status: 404 });
    }

    // Use UTC date for consistency across timezones
    const dateKey = normalizeToUTCDate(today);
    const history = current.history || {};
    const users = { ...(current.users || {}) };

    // Update today's user count
    if (normalizedUser) {
      users[normalizedUser] = (users[normalizedUser] || 0) + 1;
    }

    // Update history for today (UTC)
    const todayDate = new Date();
    const dayName = todayDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });

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

    // Calculate new dailyCount for today
    let newDailyCount = 0;
    if (history[dateKey] && history[dateKey].users) {
      newDailyCount = Object.values(history[dateKey].users).reduce((a, b) => (a as number) + (b as number), 0);
    }

    const updatedCounter = await updateCounter(id, {
      value: current.value + 1,
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
    console.error('Error incrementing counter:', error);
    return NextResponse.json(
      { error: 'Failed to increment counter' },
      { status: 500 }
    );
  }
}
