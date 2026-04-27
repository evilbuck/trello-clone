import { NextRequest } from 'next/server';
import { login } from '@/features/auth/services/auth.service';
import { loginSchema } from '@/features/auth/schemas/auth.schemas';
import { ValidationError } from '@/lib/errors';
import { handleApiError, successResponse } from '@/lib/errors/handler';
import { getCookieSettings } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError('Invalid input', { errors: result.error.flatten() });
    }

    const { token, user } = await login(result.data);

    const response = successResponse({ user });
    const cookieOptions = getCookieSettings();
    
    response.cookies.set(cookieOptions.name, token, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    logger.info({ userId: user.id }, 'User logged in');
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
