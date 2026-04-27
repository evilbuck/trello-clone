import { v4 as uuid } from 'uuid';
import { db } from '@/lib/db';
import { boards, lists, cards } from '@/lib/db/schema';
import { eq, isNull, and, asc } from 'drizzle-orm';
import { NotFoundError } from '@/lib/errors';
import { broadcast } from '@/lib/sse';
import type { CreateBoardInput, UpdateBoardInput } from '../schemas/board.schemas';

export async function getBoards(userId: string) {
  return db.query.boards.findMany({
    where: and(eq(boards.userId, userId), isNull(boards.deletedAt)),
    orderBy: [asc(boards.createdAt)],
  });
}

export async function getBoardWithData(boardId: string, userId: string) {
  const board = await db.query.boards.findFirst({
    where: and(eq(boards.id, boardId), eq(boards.userId, userId), isNull(boards.deletedAt)),
  });

  if (!board) {
    throw new NotFoundError('Board');
  }

  // Get all lists for this board
  const boardLists = await db.query.lists.findMany({
    where: eq(lists.boardId, boardId),
    orderBy: [asc(lists.position)],
  });

  // Get all cards for each list
  const listsWithCards = await Promise.all(
    boardLists.map(async (list) => {
      const listCards = await db.query.cards.findMany({
        where: eq(cards.listId, list.id),
        orderBy: [asc(cards.position)],
      });
      return {
        ...list,
        cards: listCards,
      };
    })
  );

  return {
    ...board,
    lists: listsWithCards,
  };
}

export async function createBoard(userId: string, input: CreateBoardInput) {
  const now = new Date();
  const board = {
    id: uuid(),
    userId,
    title: input.title,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(boards).values(board);
  return board;
}

export async function updateBoard(boardId: string, userId: string, input: UpdateBoardInput) {
  // Verify ownership
  const board = await db.query.boards.findFirst({
    where: and(eq(boards.id, boardId), eq(boards.userId, userId), isNull(boards.deletedAt)),
  });

  if (!board) {
    throw new NotFoundError('Board');
  }

  const updateData: typeof board extends infer T ? Partial<T> : never = {
    updatedAt: new Date(),
  };
  
  if (input.title !== undefined) {
    updateData.title = input.title;
  }

  await db.update(boards).set(updateData).where(eq(boards.id, boardId));

  const updated = await db.query.boards.findFirst({
    where: eq(boards.id, boardId),
  });

  broadcast(boardId, { type: 'BOARD_UPDATED', boardId });

  return updated;
}

export async function deleteBoard(boardId: string, userId: string) {
  // Verify ownership
  const board = await db.query.boards.findFirst({
    where: and(eq(boards.id, boardId), eq(boards.userId, userId), isNull(boards.deletedAt)),
  });

  if (!board) {
    throw new NotFoundError('Board');
  }

  // Soft delete
  await db.update(boards)
    .set({ deletedAt: Date.now(), updatedAt: new Date() })
    .where(eq(boards.id, boardId));

  return { success: true };
}
