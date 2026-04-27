'use client';

import { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { List, Card as CardType, useCreateCard, useDeleteCard } from '@/hooks/useBoard';
import { Card } from './Card';
import { CardModal } from './CardModal';
import { trackCreateCard } from '@/lib/analytics';

interface ColumnProps {
  list: List;
  index: number;
  onDeleteList: (listId: string) => void;
}

export function Column({ list, index, onDeleteList }: ColumnProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  const createCard = useCreateCard();
  const deleteCard = useDeleteCard();

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) return;

    try {
      const result = await createCard.mutateAsync({
        listId: list.id,
        boardId: list.boardId,
        title: newCardTitle.trim(),
      });
      trackCreateCard(result.card.id, newCardTitle.trim(), list.id, list.boardId);
      setNewCardTitle('');
      setIsAddingCard(false);
    } catch (error) {
      console.error('Failed to create card:', error);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await deleteCard.mutateAsync({ cardId, boardId: list.boardId });
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  };

  const handleEditCard = (card: CardType) => {
    setSelectedCard(card);
    setIsCardModalOpen(true);
  };

  return (
    <Draggable draggableId={list.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="flex h-fit max-h-[calc(100vh-140px)] w-[280px] flex-col rounded-lg bg-zinc-100 dark:bg-zinc-800/50"
        >
          <div
            {...provided.dragHandleProps}
            className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-700"
          >
            <h3 className="font-medium text-zinc-800 dark:text-zinc-100">{list.title}</h3>
            <button
              onClick={() => onDeleteList(list.id)}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <Droppable droppableId={list.id} type="CARD">
            {(dropProvided, dropSnapshot) => (
              <div
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
                className={`flex-1 overflow-y-auto p-2 ${
                  dropSnapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="space-y-2">
                  {list.cards.map((card, cardIndex) => (
                    <Card
                      key={card.id}
                      card={card}
                      index={cardIndex}
                      onDelete={handleDeleteCard}
                      onEdit={handleEditCard}
                    />
                  ))}
                </div>
                {dropProvided.placeholder}
              </div>
            )}
          </Droppable>

          <div className="border-t border-zinc-200 p-2 dark:border-zinc-700">
            {isAddingCard ? (
              <div className="space-y-2">
                <textarea
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  placeholder="Enter card title..."
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                  rows={2}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddCard();
                    }
                    if (e.key === 'Escape') {
                      setIsAddingCard(false);
                      setNewCardTitle('');
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddCard}
                    disabled={createCard.isPending}
                    className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createCard.isPending ? 'Adding...' : 'Add card'}
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingCard(false);
                      setNewCardTitle('');
                    }}
                    className="rounded px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingCard(true)}
                className="flex w-full items-center gap-1 rounded px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add a card
              </button>
            )}
          </div>

          <CardModal
            card={selectedCard}
            isOpen={isCardModalOpen}
            onClose={() => {
              setIsCardModalOpen(false);
              setSelectedCard(null);
            }}
            boardId={list.boardId}
          />
        </div>
      )}
    </Draggable>
  );
}
