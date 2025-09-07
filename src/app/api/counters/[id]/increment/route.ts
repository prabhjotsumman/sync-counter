import { NextRequest, NextResponse } from 'next/server';
import { updateCounter } from '@/lib/counters';
import { broadcastUpdate } from '../../../sync/broadcast';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const { id } = await params;
  const { today } = await request.json();
  const current = await (await import('@/lib/counters')).getCounter(id);
  if (!current) {
    return NextResponse.json(
      { error: 'Counter not found' },
      { status: 404 }
    );
  }
  // Daily count/history logic
  const dateKey = today || new Date().toISOString().slice(0, 10);
  const history = current.history || {};
  if (!history[dateKey]) {
    history[dateKey] = { totalCount: 0, countedToday: 0, previousCount: [] };
  }
  history[dateKey].totalCount += 1;
  history[dateKey].countedToday += 1;
  const dailyCount = history[dateKey].countedToday;
  const updatedCounter = await updateCounter(id, {
    value: current.value + 1,
    dailyCount,
    history
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
