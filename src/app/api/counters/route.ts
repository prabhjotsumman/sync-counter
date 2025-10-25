import { NextResponse } from 'next/server';
import { getCounters, addCounter } from '@/lib/counters';
import { broadcastUpdate } from '../sync/broadcast';
import { getTodayString, getTodayWeekdayUTC } from '@/utils';

export async function GET() {
  try {
    const counters = await getCounters();
    const response = {
      counters,
      timestamp: Date.now()
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching counters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch counters' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
  const body = await request.json();
  const { name, value = 0, dailyGoal, dailyCount, history, currentUser } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Counter name is required' },
        { status: 400 }
      );
    }

    const newCounter = {
      id: `counter-${Date.now()}`,
      name: name.trim(),
      value: parseInt(value) || 0,
      lastUpdated: Date.now(),
      ...(typeof dailyGoal === 'number' ? { dailyGoal } : {}),
      ...(typeof dailyCount === 'number' ? { dailyCount } : {}),
      ...(history ? { history } : {}),
      // Initialize with current user if provided
      ...(currentUser ? {
        users: { [currentUser]: 0 },
        history: {
          [getTodayString()]: {
            users: { [currentUser]: 0 },
            total: 0,
            day: getTodayWeekdayUTC()
          }
        }
      } : {}),
    };

  const created = await addCounter(newCounter);

    const response = {
      counter: created,
      timestamp: Date.now()
    };

    broadcastUpdate({
      type: 'counter_created',
      counter: created,
      timestamp: Date.now()
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating counter:', error);
    return NextResponse.json(
      { error: 'Failed to create counter' },
      { status: 500 }
    );
  }
}
