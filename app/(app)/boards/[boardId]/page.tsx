'use client';

import React, { useEffect, useState } from 'react';
import { Board } from '@/components/board/Board';
import { useSSE } from '@/hooks/useSSE';

interface BoardPageProps {
  params: Promise<{ boardId: string }>;
}

export default function BoardPage({ params }: BoardPageProps) {
  const [boardId, setBoardId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setBoardId(p.boardId));
  }, [params]);

  // Set up SSE for real-time updates
  useSSE(boardId ?? '');

  if (!boardId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto h-full max-w-full px-4 py-4">
      <Board boardId={boardId} />
    </div>
  );
}
