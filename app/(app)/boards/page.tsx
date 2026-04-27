'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBoards, useCreateBoard, useDeleteBoard } from '@/hooks/useBoards';
import { Modal } from '@/components/ui/Modal';
import { BoardCardSkeleton } from '@/components/ui/Skeleton';

export default function BoardsPage() {
  const router = useRouter();
  const { data: boards, isLoading } = useBoards();
  const createBoard = useCreateBoard();
  const deleteBoard = useDeleteBoard();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) return;

    try {
      const result = await createBoard.mutateAsync(newBoardTitle.trim());
      setNewBoardTitle('');
      setIsModalOpen(false);
      router.push(`/boards/${result.board.id}`);
    } catch (error) {
      console.error('Failed to create board:', error);
    }
  };

  const handleDeleteBoard = async (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this board?')) return;

    try {
      await deleteBoard.mutateAsync(boardId);
    } catch (error) {
      console.error('Failed to delete board:', error);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">My Boards</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create Board
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <BoardCardSkeleton key={i} />
          ))}
        </div>
      ) : boards?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 py-16 dark:border-zinc-700">
          <svg
            className="mb-4 h-12 w-12 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
            />
          </svg>
          <h2 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            No boards yet
          </h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Create your first board to get started
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Board
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards?.map((board) => (
            <div
              key={board.id}
              onClick={() => router.push(`/boards/${board.id}`)}
              className="group cursor-pointer rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{board.title}</h3>
                <button
                  onClick={(e) => handleDeleteBoard(e, board.id)}
                  className="rounded p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-zinc-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Created {new Date(board.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Board">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateBoard();
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Board Title
            </label>
            <input
              type="text"
              id="title"
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              placeholder="e.g., Project Roadmap"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setNewBoardTitle('');
              }}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createBoard.isPending || !newBoardTitle.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createBoard.isPending ? 'Creating...' : 'Create Board'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
