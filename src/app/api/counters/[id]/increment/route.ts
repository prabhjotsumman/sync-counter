import { NextRequest, NextResponse } from 'next/server';
import { updateCounter } from '@/lib/counters';
import { broadcastUpdate } from '../../../sync/route';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updatedCounter = await updateCounter(id, 1);
    
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
