import { NextRequest, NextResponse } from 'next/server';
import { updateCounter } from '@/lib/counters';
import { broadcastUpdate } from '../../../sync/broadcast';

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
  if (!current) {
    return NextResponse.json({ error: 'Counter not found' }, { status: 404 });
  }
  // Date key in DD-MM-YYYY format
  const dateKey = today || new Date().toLocaleDateString('en-GB').split('/').join('-');
  const history = current.history || {};
  const users = { ...(current.users || {}) };
  // Update today's user count
  if (normalizedUser) {
    users[normalizedUser] = (users[normalizedUser] || 0) + 1;
  }
  // Update history for today
  const todayDate = today ? new Date(today) : new Date();
  const dayName = todayDate.toLocaleDateString('en-US', { weekday: 'long' });
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
