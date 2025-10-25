import { NextResponse } from 'next/server';
import { getCounters, addCounter } from '@/lib/counters';
import { broadcastUpdate } from '../sync/broadcast';
import { getTodayString, getTodayWeekdayUTC } from '@/utils';

export async function GET() {
  try {
    console.log('📡 GET /api/counters - Fetching counters');

    const counters = await getCounters();

    console.log('✅ GET /api/counters - Successfully fetched', counters.length, 'counters');

    const response = {
      counters,
      timestamp: Date.now()
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ GET /api/counters - Error fetching counters:', error);

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
      { error: 'Failed to fetch counters', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
  const body = await request.json();
  const { name, value = 0, dailyGoal, dailyCount, history, currentUser } = body;

    console.log('📝 POST /api/counters - Request body:', body);

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

    console.log('📝 POST /api/counters - Creating counter:', newCounter);

  const created = await addCounter(newCounter);

    console.log('✅ POST /api/counters - Counter created successfully:', created);

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
    console.error('❌ POST /api/counters - Error creating counter:', error);

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
      { error: 'Failed to create counter', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
