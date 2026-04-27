'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { useBoard, useCreateList, useDeleteList, useMoveCard, useReorderList } from '@/hooks/useBoard';
import { Column } from './Column';
import { KanbanBoardSkeleton } from '@/components/ui/Skeleton';
import { trackCreateList } from '@/lib/analytics';

interface BoardProps {
  boardId: string;
}

export function Board({ boardId }: BoardProps) {
  const { data: board, isLoading, error } = useBoard(boardId);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  const createList = useCreateList();
  const deleteList = useDeleteList();
  const moveCard = useMoveCard();
  const reorderList = useReorderList();

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    // Dropped outside a valid area
    if (!destination) return;

    // Dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Handle list reordering
    if (type === 'LIST') {
      const listId = draggableId;
      try {
        await reorderList.mutateAsync({
          listId,
          boardId,
          position: destination.index,
        });
      } catch (error) {
        console.error('Failed to reorder list:', error);
      }
      return;
    }

    // Handle card movement
    if (type === 'CARD') {
      try {
        await moveCard.mutateAsync({
          cardId: draggableId,
          boardId,
          listId: destination.droppableId,
          position: destination.index,
        });
      } catch (error) {
        console.error('Failed to move card:', error);
      }
    }
  };

  const handleAddList = async () => {
    if (!newListTitle.trim()) return;

    try {
      const result = await createList.mutateAsync({
        boardId,
        title: newListTitle.trim(),
      });
      trackCreateList(result.list.id, newListTitle.trim(), boardId);
      setNewListTitle('');
      setIsAddingList(false);
    } catch (error) {
      console.error('Failed to create list:', error);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await deleteList.mutateAsync({ listId, boardId });
    } catch (error) {
      console.error('Failed to delete list:', error);
    }
  };

  if (isLoading) return <KanbanBoardSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">Failed to load board</div>
      </div>
    );
  }

  if (!board) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-700">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{board.title}</h1>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" direction="horizontal" type="LIST">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex gap-4 overflow-x-auto pb-4"
            >
              {board.lists.map((list, index) => (
                <Column
                  key={list.id}
                  list={list}
                  index={index}
                  onDeleteList={handleDeleteList}
                />
              ))}
              {provided.placeholder}

              <div className="w-[280px] shrink-0">
                {isAddingList ? (
                  <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800/50">
                    <input
                      type="text"
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      placeholder="Enter list title..."
                      className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddList();
                        if (e.key === 'Escape') {
                          setIsAddingList(false);
                          setNewListTitle('');
                        }
                      }}
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={handleAddList}
                        disabled={createList.isPending}
                        className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {createList.isPending ? 'Adding...' : 'Add list'}
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingList(false);
                          setNewListTitle('');
                        }}
                        className="rounded px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingList(true)}
                    className="flex w-full items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add a list
                  </button>
                )}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
