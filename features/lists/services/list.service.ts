import { v4 as uuid } from 'uuid';
import { db } from '@/lib/db';
import { boards, lists } from '@/lib/db/schema';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { NotFoundError } from '@/lib/errors';
import { broadcast } from '@/lib/sse';
import type { CreateListInput, UpdateListInput } from '../schemas/list.schemas';

export async function getListsByBoard(boardId: string) {
  return db.query.lists.findMany({
    where: eq(lists.boardId, boardId),
    orderBy: [asc(lists.position)],
  });
}

export async function createList(userId: string, input: CreateListInput) {
  // Verify board ownership
  const board = await db.query.boards.findFirst({
    where: and(eq(boards.id, input.boardId), eq(boards.userId, userId), isNull(boards.deletedAt)),
  });

  if (!board) {
    throw new NotFoundError('Board');
  }

  // Calculate position (append to end if not specified)
  let position = input.position;
  if (position === undefined) {
    const existingLists = await getListsByBoard(input.boardId);
    position = existingLists.length > 0 
      ? Math.max(...existingLists.map(l => l.position)) + 1 
      : 0;
  }

  const now = new Date();
  const list = {
    id: uuid(),
    boardId: input.boardId,
    title: input.title,
    description: input.description ?? null,
    position,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(lists).values(list);

  broadcast(input.boardId, {
    type: 'LIST_CREATED',
    boardId: input.boardId,
    list: {
      id: list.id,
      boardId: list.boardId,
      title: list.title,
      description: list.description,
      position: list.position,
    },
  });

  return list;
}

export async function updateList(listId: string, userId: string, input: UpdateListInput) {
  // Get list with board ownership check
  const list = await db.query.lists.findFirst({
    where: eq(lists.id, listId),
  });

  if (!list) {
    throw new NotFoundError('List');
  }

  const board = await db.query.boards.findFirst({
    where: and(eq(boards.id, list.boardId), eq(boards.userId, userId), isNull(boards.deletedAt)),
  });

  if (!board) {
    throw new NotFoundError('Board');
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.position !== undefined) updateData.position = input.position;

  await db.update(lists).set(updateData).where(eq(lists.id, listId));

  const updated = await db.query.lists.findFirst({
    where: eq(lists.id, listId),
  });

  broadcast(list.boardId, {
    type: 'LIST_UPDATED',
    boardId: list.boardId,
    list: {
      id: updated!.id,
      boardId: updated!.boardId,
      title: updated!.title,
      description: updated!.description,
      position: updated!.position,
    },
  });

  return updated;
}

export async function deleteList(listId: string, userId: string) {
  // Get list with board ownership check
  const list = await db.query.lists.findFirst({
    where: eq(lists.id, listId),
  });

  if (!list) {
    throw new NotFoundError('List');
  }

  const board = await db.query.boards.findFirst({
    where: and(eq(boards.id, list.boardId), eq(boards.userId, userId), isNull(boards.deletedAt)),
  });

  if (!board) {
    throw new NotFoundError('Board');
  }

  await db.delete(lists).where(eq(lists.id, listId));

  broadcast(list.boardId, {
    type: 'LIST_DELETED',
    boardId: list.boardId,
    listId: listId,
  });

  return { success: true };
}

export async function reorderList(userId: string, listId: string, position: number) {
  // Get list and verify board ownership
  const list = await db.query.lists.findFirst({
    where: eq(lists.id, listId),
  });
  
  if (!list) {
    throw new NotFoundError('List');
  }

  const board = await db.query.boards.findFirst({
    where: and(eq(boards.id, list.boardId), eq(boards.userId, userId), isNull(boards.deletedAt)),
  });

  const boardId = list.boardId;

  if (!board) {
    throw new NotFoundError('Board');
  }

  // Get all lists for the board
  const boardLists = await getListsByBoard(boardId);
  
  // Remove the list from its current position
  const listIndex = boardLists.findIndex(l => l.id === listId);
  if (listIndex === -1) {
    throw new NotFoundError('List');
  }

  const [movedList] = boardLists.splice(listIndex, 1);
  
  // Insert at new position
  boardLists.splice(position, 0, movedList);

  // Update positions
  await Promise.all(
    boardLists.map((l, index) =>
      db.update(lists).set({ position: index, updatedAt: new Date() }).where(eq(lists.id, l.id))
    )
  );

  // Broadcast update
  broadcast(boardId, { type: 'BOARD_UPDATED', boardId });

  return { success: true };
}
