'use client';

import { Draggable } from '@hello-pangea/dnd';
import { Card as CardType } from '@/hooks/useBoard';

interface CardProps {
  card: CardType;
  index: number;
  onDelete: (cardId: string) => void;
}

export function Card({ card, index, onDelete }: CardProps) {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group relative rounded-md bg-white p-3 shadow-sm dark:bg-zinc-700 ${
            snapshot.isDragging
              ? 'rotate-2 shadow-md'
              : ''
          }`}
        >
          <p className="text-sm text-zinc-800 dark:text-zinc-100">{card.title}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(card.id);
            }}
            className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <svg
              className="h-4 w-4 text-zinc-400 hover:text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
    </Draggable>
  );
}
