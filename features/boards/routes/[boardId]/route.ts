import { NextRequest } from 'next/server';
import { getBoardWithData, updateBoard, deleteBoard } from '@/features/boards/services/board.service';
import { updateBoardSchema } from '@/features/boards/schemas/board.schemas';
import { ValidationError } from '@/lib/errors';
import { handleApiError, successResponse, noContentResponse } from '@/lib/errors/handler';
import { withAuth } from '@/lib/auth/middleware';

type Params = Promise<{ boardId: string }>;

export async function GET(request: NextRequest, { params }: { request: NextRequest; params: Params }) {
  return withAuth(request, async (userId) => {
    const { boardId } = await params;
    const board = await getBoardWithData(boardId, userId);
    return successResponse({ board });
  });
}

export async function PATCH(request: NextRequest, { params }: { request: NextRequest; params: Params }) {
  return withAuth(request, async (userId) => {
    try {
      const { boardId } = await params;
      const body = await request.json();
      
      const result = updateBoardSchema.safeParse(body);
      if (!result.success) {
        throw new ValidationError('Invalid input', { errors: result.error.flatten() });
      }

      const board = await updateBoard(boardId, userId, result.data);
      return successResponse({ board });
    } catch (error) {
      return handleApiError(error);
    }
  });
}

export async function DELETE(request: NextRequest, { params }: { request: NextRequest; params: Params }) {
  return withAuth(request, async (userId) => {
    try {
      const { boardId } = await params;
      await deleteBoard(boardId, userId);
      return noContentResponse();
    } catch (error) {
      return handleApiError(error);
    }
  });
}
