import { NextRequest } from 'next/server';
import { updateList, deleteList, reorderList } from '@/features/lists/services/list.service';
import { updateListSchema, reorderListSchema } from '@/features/lists/schemas/list.schemas';
import { ValidationError } from '@/lib/errors';
import { handleApiError, successResponse, noContentResponse } from '@/lib/errors/handler';
import { withAuth } from '@/lib/auth/middleware';

type Params = Promise<{ listId: string }>;

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  return withAuth(request, async (userId) => {
    try {
      const { listId } = await params;
      const body = await request.json();
      
      // Check if this is a reorder request
      const reorderResult = reorderListSchema.safeParse(body);
      if (reorderResult.success) {
        // Handle reorder - boardId is derived from listId for security
        await reorderList(userId, listId, reorderResult.data.position);
        return successResponse({ success: true });
      }

      // Handle regular update
      const result = updateListSchema.safeParse(body);
      if (!result.success) {
        throw new ValidationError('Invalid input', { errors: result.error.flatten() });
      }

      const list = await updateList(listId, userId, result.data);
      return successResponse({ list });
    } catch (error) {
      return handleApiError(error);
    }
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  return withAuth(request, async (userId) => {
    try {
      const { listId } = await params;
      await deleteList(listId, userId);
      return noContentResponse();
    } catch (error) {
      return handleApiError(error);
    }
  });
}
