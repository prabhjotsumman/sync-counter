import { NextRequest, NextResponse } from 'next/server';
import { updateCounter } from '@/lib/counters';
import { broadcastUpdate } from '../../../sync/broadcast';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Fetch current counter
    const current = await (await import('@/lib/counters')).getCounter(id);
    if (!current) {
      return NextResponse.json(
        { error: 'Counter not found' },
        { status: 404 }
      );
    }
    const updatedCounter = await updateCounter(id, { value: current.value - 1 });
    
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
    
    // Broadcast the updated counter to all connected clients
    broadcastUpdate({
      type: 'counter_decremented',
      counter: updatedCounter,
      timestamp: Date.now()
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error decrementing counter:', error);
    return NextResponse.json(
      { error: 'Failed to decrement counter' },
      { status: 500 }
    );
  }
}
