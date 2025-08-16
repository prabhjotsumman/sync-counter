import { NextRequest, NextResponse } from 'next/server';
import { getCounters } from '@/lib/counters';
import { broadcastUpdate } from '../../sync/route';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'counters.json');

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

    const counters = await getCounters();
    const counterIndex = counters.findIndex(c => c.id === id);
    
    if (counterIndex === -1) {
      return NextResponse.json(
        { error: 'Counter not found' },
        { status: 404 }
      );
    }

    const updatedCounter = {
      ...counters[counterIndex],
      name: name.trim(),
      value: parseInt(value) || counters[counterIndex].value,
      lastUpdated: Date.now()
    };

    counters[counterIndex] = updatedCounter;
    
    // Save to file
    await fs.writeFile(DATA_FILE, JSON.stringify(counters, null, 2));

    const response = {
      counter: updatedCounter,
      timestamp: Date.now()
    };
    
    // Broadcast the updated counter to all connected clients
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
    const counters = await getCounters();
    const counterIndex = counters.findIndex(c => c.id === id);
    
    if (counterIndex === -1) {
      return NextResponse.json(
        { error: 'Counter not found' },
        { status: 404 }
      );
    }

    const deletedCounter = counters[counterIndex];
    counters.splice(counterIndex, 1);
    
    // Save to file
    await fs.writeFile(DATA_FILE, JSON.stringify(counters, null, 2));

    const response = {
      counter: deletedCounter,
      timestamp: Date.now()
    };
    
    // Broadcast the deleted counter to all connected clients
    broadcastUpdate({
      type: 'counter_deleted',
      counter: deletedCounter,
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
