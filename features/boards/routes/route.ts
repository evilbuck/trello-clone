import { NextRequest } from 'next/server';
import { getBoards, createBoard } from '@/features/boards/services/board.service';
import { createBoardSchema } from '@/features/boards/schemas/board.schemas';
import { ValidationError } from '@/lib/errors';
import { handleApiError, successResponse } from '@/lib/errors/handler';
import { withAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    const boards = await getBoards(userId);
    return successResponse({ boards });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json();
      
      const result = createBoardSchema.safeParse(body);
      if (!result.success) {
        throw new ValidationError('Invalid input', { errors: result.error.flatten() });
      }

      const board = await createBoard(userId, result.data);
      return successResponse({ board }, 201);
    } catch (error) {
      return handleApiError(error);
    }
  });
}
