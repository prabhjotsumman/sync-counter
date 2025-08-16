
import { NextRequest } from 'next/server';
import { getCounters } from '@/lib/counters';
import { addClient, removeClient } from './broadcast';

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      addClient(controller);

      getCounters().then(counters => {
        const message = `data: ${JSON.stringify({
          type: 'initial',
          counters,
          timestamp: Date.now()
        })}\n\n`;
        controller.enqueue(new TextEncoder().encode(message));
      });

      request.signal.addEventListener('abort', () => {
        removeClient(controller);
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
