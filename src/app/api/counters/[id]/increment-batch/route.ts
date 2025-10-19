import { NextRequest, NextResponse } from 'next/server';
import { getCounter, updateCounter } from '@/lib/counters';
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
    const { increments } = await request.json();

    console.log(`Batch increment API called for counter ${id} with ${increments?.length || 0} increments`);

    if (!Array.isArray(increments) || increments.length === 0) {
      return NextResponse.json({ error: 'Invalid increments array' }, { status: 400 });
    }

    const current = await getCounter(id);
    if (!current) {
      console.error(`Counter ${id} not found in database`);
      return NextResponse.json({ error: 'Counter not found' }, { status: 404 });
    }

    console.log(`Counter ${id} current value: ${current.value}`);

    // Process all increments in the batch
    const history = current.history || {};
    const users = { ...(current.users || {}) };
    let totalIncrements = 0;

    // Group increments by user and date
    const userIncrements: Record<string, Record<string, number>> = {};

    type BatchIncrement = { currentUser?: string; today?: string };
    (increments as BatchIncrement[]).forEach((increment) => {
      const normalizedUser = increment.currentUser ?
        increment.currentUser.charAt(0).toUpperCase() + increment.currentUser.slice(1).toLowerCase() :
        undefined;

      if (!normalizedUser) return;

      const dateKey = normalizeToUTCDate(increment.today);

      if (!userIncrements[normalizedUser]) {
        userIncrements[normalizedUser] = {};
      }

      userIncrements[normalizedUser][dateKey] = (userIncrements[normalizedUser][dateKey] || 0) + 1;
      totalIncrements++;
    });

    // Update users object
    Object.entries(userIncrements).forEach(([username, dateCounts]) => {
      const totalUserIncrements = Object.values(dateCounts).reduce((sum, count) => sum + count, 0);
      users[username] = (users[username] || 0) + totalUserIncrements;
    });

    // Update history
    Object.entries(userIncrements).forEach(([username, dateCounts]) => {
      Object.entries(dateCounts).forEach(([dateKey, count]) => {
        if (!history[dateKey]) {
          const todayDate = new Date();
          const dayName = todayDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
          history[dateKey] = { users: {}, total: 0, day: dayName };
        }

        if (!history[dateKey].users) history[dateKey].users = {};
        history[dateKey].users[username] = (history[dateKey].users[username] || 0) + count;
        history[dateKey].total = Object.values(history[dateKey].users).reduce((a, b) => (a as number) + (b as number), 0);
      });
    });

    // Calculate new dailyCount for today in UTC
    const today = getTodayStringUTC();
    let newDailyCount = 0;
    if (history[today] && history[today].users) {
      newDailyCount = Object.values(history[today].users).reduce((a, b) => (a as number) + (b as number), 0);
    }

    // Update counter
    const updatedCounter = {
      ...current,
      value: current.value + totalIncrements,
      users,
      history,
      dailyCount: newDailyCount,
      lastUpdated: Date.now()
    };

    console.log(`Updating counter ${id}:`, {
      value: `${current.value} -> ${updatedCounter.value} (+${totalIncrements})`,
      dailyCount: `${current.dailyCount || 0} -> ${updatedCounter.dailyCount}`,
      totalIncrements
    });

    await updateCounter(id, updatedCounter);

    // Broadcast update to connected clients
    await broadcastUpdate(updatedCounter);

    console.log(`Batch increment completed for counter ${id}`);

    return NextResponse.json({
      counter: updatedCounter,
      processedIncrements: totalIncrements
    });

  } catch (error) {
    console.error('Batch increment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
