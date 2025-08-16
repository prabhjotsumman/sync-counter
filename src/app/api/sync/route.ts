import { NextRequest, NextResponse } from 'next/server';
import { getCounters } from '@/lib/counters';

// Store connected clients
const clients = new Set<ReadableStreamDefaultController>();

// Broadcast function to send updates to all clients
export function broadcastUpdate(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    try {
      client.enqueue(new TextEncoder().encode(message));
    } catch (error) {
      console.error('Error broadcasting to client:', error);
    }
  });
}

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      // Add client to the set
      clients.add(controller);
      
      // Send initial data
      getCounters().then(counters => {
        const message = `data: ${JSON.stringify({
          type: 'initial',
          counters,
          timestamp: Date.now()
        })}\n\n`;
        controller.enqueue(new TextEncoder().encode(message));
      });

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clients.delete(controller);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}
