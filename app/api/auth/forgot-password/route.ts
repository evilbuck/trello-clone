import { NextRequest } from 'next/server';
import { forgotPassword } from '@/features/auth/services/auth.service';
import { forgotPasswordSchema } from '@/features/auth/schemas/auth.schemas';
import { ValidationError } from '@/lib/errors';
import { handleApiError, successResponse } from '@/lib/errors/handler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = forgotPasswordSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError('Invalid input', { errors: result.error.flatten() });
    }

    await forgotPassword(result.data);

    return successResponse({
      message: 'If an account exists with that email, a reset link has been sent.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
