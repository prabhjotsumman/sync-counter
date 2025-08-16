import { NextRequest, NextResponse } from 'next/server';
import { getCounters, updateCounter, deleteCounter } from '@/lib/counters';
import { broadcastUpdate } from '../../sync/broadcast';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, value } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Counter name is required' },
        { status: 400 }
      );
    }

    // Use Supabase updateCounter for persistence (name and value)
    const updatedCounter = await updateCounter(id, { name: name.trim(), value });
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
      type: 'counter_updated',
      counter: updatedCounter,
      timestamp: Date.now()
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating counter:', error);
    return NextResponse.json(
      { error: 'Failed to update counter' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Use Supabase deleteCounter for persistence
    const deleted = await deleteCounter(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Counter not found' },
        { status: 404 }
      );
    }
    const response = {
      counter: { id },
      timestamp: Date.now()
    };
    broadcastUpdate({
      type: 'counter_deleted',
      counter: { id },
      timestamp: Date.now()
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting counter:', error);
    return NextResponse.json(
      { error: 'Failed to delete counter' },
      { status: 500 }
    );
  }
}
