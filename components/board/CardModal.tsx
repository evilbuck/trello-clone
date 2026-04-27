'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Card as CardType } from '@/hooks/useBoard';
import { useUpdateCard } from '@/hooks/useBoard';

interface CardModalProps {
  card: CardType | null;
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
}

export function CardModal({ card, isOpen, onClose, boardId }: CardModalProps) {
  const [title, setTitle] = useState('');
  const updateCard = useUpdateCard();

  // Sync local state with card when modal opens
  useEffect(() => {
    if (card) {
      setTitle(card.title);
    }
  }, [card]);

  const handleSave = async () => {
    if (!card || !title.trim()) return;

    try {
      await updateCard.mutateAsync({
        cardId: card.id,
        boardId,
        title: title.trim(),
      });
      onClose();
    } catch (error) {
      console.error('Failed to update card:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Card">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Title
          </label>
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            rows={3}
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateCard.isPending || !title.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {updateCard.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
