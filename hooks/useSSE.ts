import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

type SSEEventHandler = (event: SSEEvent) => void;

interface SSEEvent {
  type: string;
  [key: string]: unknown;
}

export function useSSE(boardId: string, onEvent?: SSEEventHandler) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const queryClient = useQueryClient();

  const handleEvent = useCallback((event: SSEEvent) => {
    // Invalidate the board query to trigger a refetch
    queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    
    // Call the custom handler if provided
    onEvent?.(event);
  }, [boardId, queryClient, onEvent]);

  useEffect(() => {
    if (!boardId) return;

    const eventSource = new EventSource(`/api/boards/${boardId}/sse`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SSEEvent;
        handleEvent(data);
      } catch (error) {
        console.error('Failed to parse SSE event:', error);
      }
    };

    eventSource.onerror = () => {
      // EventSource will automatically attempt to reconnect
      console.log('SSE connection lost, attempting to reconnect...');
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [boardId, handleEvent]);

  return {
    reconnect: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    },
  };
}
