import { NextRequest } from 'next/server';
import { updateCard, deleteCard, moveCard } from '@/features/cards/services/card.service';
import { updateCardSchema, moveCardSchema } from '@/features/cards/schemas/card.schemas';
import { ValidationError } from '@/lib/errors';
import { handleApiError, successResponse, noContentResponse } from '@/lib/errors/handler';
import { withAuth } from '@/lib/auth/middleware';

type Params = Promise<{ cardId: string }>;

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  return withAuth(request, async (userId) => {
    try {
      const { cardId } = await params;
      const body = await request.json();
      
      // Check if this is a move request
      const moveResult = moveCardSchema.safeParse(body);
      if (moveResult.success) {
        await moveCard(cardId, userId, moveResult.data.listId, moveResult.data.position);
        return successResponse({ success: true });
      }

      // Handle regular update
      const result = updateCardSchema.safeParse(body);
      if (!result.success) {
        throw new ValidationError('Invalid input', { errors: result.error.flatten() });
      }

      const card = await updateCard(cardId, userId, result.data);
      return successResponse({ card });
    } catch (error) {
      return handleApiError(error);
    }
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  return withAuth(request, async (userId) => {
    try {
      const { cardId } = await params;
      await deleteCard(cardId, userId);
      return noContentResponse();
    } catch (error) {
      return handleApiError(error);
    }
  });
}
