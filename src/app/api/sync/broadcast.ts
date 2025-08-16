// Utility for managing SSE clients and broadcasting updates

const clients = new Set<ReadableStreamDefaultController>();

export function addClient(controller: ReadableStreamDefaultController) {
  clients.add(controller);
}

export function removeClient(controller: ReadableStreamDefaultController) {
  clients.delete(controller);
}

export function broadcastUpdate(data: Record<string, unknown>) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    try {
      client.enqueue(new TextEncoder().encode(message));
    } catch {
      // Ignore broadcast errors
    }
  });
}

export function getClients() {
  return clients;
}
