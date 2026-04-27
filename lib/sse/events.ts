// SSE Event Types
export type SSEEvent =
  | { type: 'BOARD_UPDATED'; boardId: string }
  | { type: 'LIST_CREATED'; boardId: string; list: ListEvent }
  | { type: 'LIST_UPDATED'; boardId: string; list: ListEvent }
  | { type: 'LIST_DELETED'; boardId: string; listId: string }
  | { type: 'CARD_CREATED'; boardId: string; card: CardEvent }
  | { type: 'CARD_UPDATED'; boardId: string; card: CardEvent }
  | { type: 'CARD_DELETED'; boardId: string; cardId: string; listId: string };

export interface ListEvent {
  id: string;
  boardId: string;
  title: string;
  description: string | null;
  position: number;
}

export interface CardEvent {
  id: string;
  listId: string;
  title: string;
  position: number;
}

export function formatSSEEvent(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
