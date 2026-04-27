import { NextRequest } from 'next/server';
import { createCard } from '@/features/cards/services/card.service';
import { createCardSchema } from '@/features/cards/schemas/card.schemas';
import { ValidationError } from '@/lib/errors';
import { handleApiError, successResponse } from '@/lib/errors/handler';
import { withAuth } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json();
      
      const result = createCardSchema.safeParse(body);
      if (!result.success) {
        throw new ValidationError('Invalid input', { errors: result.error.flatten() });
      }

      const card = await createCard(userId, result.data);
      return successResponse({ card }, 201);
    } catch (error) {
      return handleApiError(error);
    }
  });
}
