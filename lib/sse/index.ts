import { SSEEvent, formatSSEEvent } from './events';

// Map of boardId -> Set of controller responses
const subscribers = new Map<string, Set<ReadableStreamDefaultController>>();

export function subscribe(boardId: string, controller: ReadableStreamDefaultController) {
  if (!subscribers.has(boardId)) {
    subscribers.set(boardId, new Set());
  }
  subscribers.get(boardId)!.add(controller);

  // Return unsubscribe function
  return () => {
    const boardSubs = subscribers.get(boardId);
    if (boardSubs) {
      boardSubs.delete(controller);
      if (boardSubs.size === 0) {
        subscribers.delete(boardId);
      }
    }
  };
}

export function broadcast(boardId: string, event: SSEEvent) {
  const boardSubs = subscribers.get(boardId);
  if (!boardSubs || boardSubs.size === 0) return;

  const message = formatSSEEvent(event);
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  for (const controller of boardSubs) {
    try {
      controller.enqueue(data);
    } catch {
      // Client disconnected, remove them
      boardSubs.delete(controller);
    }
  }
}

export function getSubscriberCount(boardId: string): number {
  return subscribers.get(boardId)?.size ?? 0;
}

// Create SSE stream for a board
export function createSSEStream(boardId: string): ReadableStream {
  return new ReadableStream({
    start(controller) {
      // Send initial connection event
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'CONNECTED', boardId })}\n\n`));

      // Subscribe to board events
      const unsubscribe = subscribe(boardId, controller);

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 30000);

      // Cleanup on close
      return () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
    },
  });
}
