import { NextRequest } from 'next/server';
import { createList } from '@/features/lists/services/list.service';
import { createListSchema } from '@/features/lists/schemas/list.schemas';
import { ValidationError } from '@/lib/errors';
import { handleApiError, successResponse } from '@/lib/errors/handler';
import { withAuth } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json();
      
      const result = createListSchema.safeParse(body);
      if (!result.success) {
        throw new ValidationError('Invalid input', { errors: result.error.flatten() });
      }

      const list = await createList(userId, result.data);
      return successResponse({ list }, 201);
    } catch (error) {
      return handleApiError(error);
    }
  });
}
