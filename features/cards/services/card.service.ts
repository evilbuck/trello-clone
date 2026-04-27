import { v4 as uuid } from 'uuid';
import { db } from '@/lib/db';
import { boards, lists, cards } from '@/lib/db/schema';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { NotFoundError } from '@/lib/errors';
import { broadcast } from '@/lib/sse';
import type { CreateCardInput, UpdateCardInput } from '../schemas/card.schemas';

async function getBoardIdForList(listId: string): Promise<string> {
  const list = await db.query.lists.findFirst({
    where: eq(lists.id, listId),
  });
  if (!list) throw new NotFoundError('List');
  return list.boardId;
}

async function verifyBoardAccess(boardId: string, userId: string): Promise<void> {
  const board = await db.query.boards.findFirst({
    where: and(eq(boards.id, boardId), eq(boards.userId, userId), isNull(boards.deletedAt)),
  });
  if (!board) throw new NotFoundError('Board');
}

export async function getCardsByList(listId: string) {
  return db.query.cards.findMany({
    where: eq(cards.listId, listId),
    orderBy: [asc(cards.position)],
  });
}

export async function createCard(userId: string, input: CreateCardInput) {
  const boardId = await getBoardIdForList(input.listId);
  await verifyBoardAccess(boardId, userId);

  // Calculate position (append to end if not specified)
  let position = input.position;
  if (position === undefined) {
    const existingCards = await getCardsByList(input.listId);
    position = existingCards.length > 0 
      ? Math.max(...existingCards.map(c => c.position)) + 1 
      : 0;
  }

  const now = new Date();
  const card = {
    id: uuid(),
    listId: input.listId,
    title: input.title,
    position,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(cards).values(card);

  broadcast(boardId, {
    type: 'CARD_CREATED',
    boardId,
    card: {
      id: card.id,
      listId: card.listId,
      title: card.title,
      position: card.position,
    },
  });

  return card;
}

export async function updateCard(cardId: string, userId: string, input: UpdateCardInput) {
  const card = await db.query.cards.findFirst({
    where: eq(cards.id, cardId),
  });

  if (!card) {
    throw new NotFoundError('Card');
  }

  const boardId = await getBoardIdForList(card.listId);
  await verifyBoardAccess(boardId, userId);

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  
  if (input.title !== undefined) updateData.title = input.title;
  if (input.position !== undefined) updateData.position = input.position;
  if (input.listId !== undefined) {
    updateData.listId = input.listId;
    // Verify the new list belongs to the same board
    const newListBoardId = await getBoardIdForList(input.listId);
    if (newListBoardId !== boardId) {
      throw new NotFoundError('List');
    }
  }

  await db.update(cards).set(updateData).where(eq(cards.id, cardId));

  const updated = await db.query.cards.findFirst({
    where: eq(cards.id, cardId),
  });

  // Broadcast to the board (possibly different if list changed)
  const broadcastBoardId = input.listId 
    ? await getBoardIdForList(input.listId) 
    : boardId;

  broadcast(broadcastBoardId, {
    type: 'CARD_UPDATED',
    boardId: broadcastBoardId,
    card: {
      id: updated!.id,
      listId: updated!.listId,
      title: updated!.title,
      position: updated!.position,
    },
  });

  return updated;
}

export async function moveCard(
  cardId: string,
  userId: string,
  targetListId: string,
  position: number
) {
  const card = await db.query.cards.findFirst({
    where: eq(cards.id, cardId),
  });

  if (!card) {
    throw new NotFoundError('Card');
  }

  const boardId = await getBoardIdForList(card.listId);
  await verifyBoardAccess(boardId, userId);

  // Verify target list exists and belongs to the same board
  const targetListBoardId = await getBoardIdForList(targetListId);
  if (targetListBoardId !== boardId) {
    throw new NotFoundError('List');
  }

  // Get all cards in target list, ordered by position
  const allTargetCards = await db.query.cards.findMany({
    where: eq(cards.listId, targetListId),
    orderBy: [asc(cards.position)],
  });

  // If moving within the same list
  if (card.listId === targetListId) {
    const currentIndex = allTargetCards.findIndex(c => c.id === cardId);
    if (currentIndex !== -1) {
      const [movedCard] = allTargetCards.splice(currentIndex, 1);
      allTargetCards.splice(position, 0, movedCard);
    }
  } else {
    // Moving from different list - get cards from source list
    const sourceCards = await db.query.cards.findMany({
      where: eq(cards.listId, card.listId),
      orderBy: [asc(cards.position)],
    });

    // Remove from source
    const sourceIndex = sourceCards.findIndex(c => c.id === cardId);
    if (sourceIndex !== -1) {
      sourceCards.splice(sourceIndex, 1);
    }

    // Add to target
    const movedCard = { ...card, listId: targetListId };
    allTargetCards.splice(position, 0, movedCard);

    // Update source list positions
    await Promise.all(
      sourceCards.map((c, index) =>
        db.update(cards).set({ position: index, updatedAt: new Date() }).where(eq(cards.id, c.id))
      )
    );
  }

  // Update target list positions
  await Promise.all(
    allTargetCards.map((c, index) =>
      db.update(cards).set({ position: index, updatedAt: new Date() }).where(eq(cards.id, c.id))
    )
  );

  broadcast(boardId, {
    type: 'CARD_UPDATED',
    boardId,
    card: {
      id: cardId,
      listId: targetListId,
      title: card.title,
      position,
    },
  });

  return { success: true };
}

export async function deleteCard(cardId: string, userId: string) {
  const card = await db.query.cards.findFirst({
    where: eq(cards.id, cardId),
  });

  if (!card) {
    throw new NotFoundError('Card');
  }

  const boardId = await getBoardIdForList(card.listId);
  await verifyBoardAccess(boardId, userId);

  const listId = card.listId;

  await db.delete(cards).where(eq(cards.id, cardId));

  broadcast(boardId, {
    type: 'CARD_DELETED',
    boardId,
    cardId,
    listId,
  });

  return { success: true };
}
