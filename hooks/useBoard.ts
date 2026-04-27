import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Card {
  id: string;
  listId: string;
  title: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface List {
  id: string;
  boardId: string;
  title: string;
  description: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  cards: Card[];
}

export interface BoardWithLists {
  id: string;
  userId: string;
  title: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lists: List[];
}

export function useBoard(boardId: string) {
  return useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${boardId}`);
      if (!res.ok) throw new Error('Failed to fetch board');
      const data = await res.json();
      return data.board as BoardWithLists;
    },
    enabled: !!boardId,
  });
}

export function useCreateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boardId, title }: { boardId: string; title: string }) => {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId, title }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to create list');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}

export function useUpdateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, boardId, ...data }: { listId: string; boardId: string; title?: string; position?: number }) => {
      const res = await fetch(`/api/lists/${listId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, boardId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to update list');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}

export function useDeleteList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId }: { listId: string; boardId: string }) => {
      const res = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to delete list');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, title }: { listId: string; boardId: string; title: string }) => {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId, title }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to create card');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, ...data }: { cardId: string; boardId: string; title?: string; position?: number; listId?: string }) => {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to update card');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId }: { cardId: string; boardId: string }) => {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to delete card');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}

export function useMoveCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, listId, position }: { cardId: string; boardId: string; listId: string; position: number }) => {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId, position }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to move card');
      }
      return res.json();
    },
    onMutate: async ({ cardId, boardId, listId: destListId, position: destPosition }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['board', boardId] });

      // Snapshot the current data for rollback
      const previousBoard = queryClient.getQueryData<BoardWithLists>(['board', boardId]);

      // Optimistically update the cache
      queryClient.setQueryData<BoardWithLists>(['board', boardId], (old) => {
        if (!old) return old;

        // Find the card
        let movedCard: Card | undefined;
        let sourceListIndex = -1;
        let sourceCardIndex = -1;

        // Find the source list and card
        for (let i = 0; i < old.lists.length; i++) {
          const cardIndex = old.lists[i].cards.findIndex((c) => c.id === cardId);
          if (cardIndex !== -1) {
            sourceListIndex = i;
            sourceCardIndex = cardIndex;
            movedCard = old.lists[i].cards[cardIndex];
            break;
          }
        }

        if (!movedCard || sourceListIndex === -1) return old;

        // Find destination list
        const destListIndex = old.lists.findIndex((l) => l.id === destListId);
        if (destListIndex === -1) return old;

        // Create new lists array with updates
        const newLists = old.lists.map((list) => ({
          ...list,
          cards: [...list.cards],
        }));

        // Remove from source
        const sourceCards = newLists[sourceListIndex].cards;
        sourceCards.splice(sourceCardIndex, 1);

        // Update positions in source list
        sourceCards.forEach((card, idx) => {
          card.position = idx;
        });

        // Update the moved card's properties
        movedCard = {
          ...movedCard,
          listId: destListId,
          position: destPosition,
        };

        // Add to destination
        const destCards = newLists[destListIndex].cards;
        destCards.splice(destPosition, 0, movedCard);

        // Update positions in destination list
        destCards.forEach((card, idx) => {
          card.position = idx;
        });

        return {
          ...old,
          lists: newLists,
        };
      });

      return { previousBoard };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousBoard) {
        queryClient.setQueryData(['board', context.previousBoard.id], context.previousBoard);
      }
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}

export function useReorderList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, position }: { listId: string; boardId: string; position: number }) => {
      const res = await fetch(`/api/lists/${listId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to reorder list');
      }
      return res.json();
    },
    onMutate: async ({ listId, boardId, position: newPosition }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['board', boardId] });

      // Snapshot the current data for rollback
      const previousBoard = queryClient.getQueryData<BoardWithLists>(['board', boardId]);

      // Optimistically update the cache
      queryClient.setQueryData<BoardWithLists>(['board', boardId], (old) => {
        if (!old) return old;

        // Find the list being moved
        const listIndex = old.lists.findIndex((l) => l.id === listId);
        if (listIndex === -1) return old;

        const movedList = old.lists[listIndex];
        const oldPosition = movedList.position;

        // If position hasn't changed, no update needed
        if (oldPosition === newPosition) return old;

        // Create new lists array
        const newLists = [...old.lists];

        // Remove the list from its current position
        newLists.splice(listIndex, 1);

        // Insert at new position
        newLists.splice(newPosition, 0, { ...movedList, position: newPosition });

        // Update positions for all lists
        newLists.forEach((list, idx) => {
          list.position = idx;
        });

        return {
          ...old,
          lists: newLists,
        };
      });

      return { previousBoard };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousBoard) {
        queryClient.setQueryData(['board', context.previousBoard.id], context.previousBoard);
      }
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}
