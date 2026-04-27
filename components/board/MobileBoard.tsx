'use client';

import { useState } from 'react';
import { useBoard, useCreateList, useDeleteList } from '@/hooks/useBoard';
import { MobileList } from './MobileList';
import { KanbanBoardSkeleton } from '@/components/ui/Skeleton';
import { trackCreateList } from '@/lib/analytics';

interface MobileBoardProps {
  boardId: string;
}

export function MobileBoard({ boardId }: MobileBoardProps) {
  const { data: board, isLoading, error } = useBoard(boardId);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  const createList = useCreateList();
  const deleteList = useDeleteList();

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

      {/* Horizontal Snap Scroll Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 snap-x snap-mandatory gap-2 overflow-x-auto pb-4">
          {board.lists.map((list) => (
            <div key={list.id} className="flex-shrink-0 snap-center px-1">
              <MobileList
                list={list}
                onDeleteList={handleDeleteList}
              />
            </div>
          ))}

          {/* Add a List - Final Snap Target */}
          <div className="flex-shrink-0 snap-center px-1">
            <div className="w-[85vw]">
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
        </div>
      </div>
    </div>
  );
}
