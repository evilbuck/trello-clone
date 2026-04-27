import { NextRequest } from 'next/server';
import { register } from '@/features/auth/services/auth.service';
import { registerSchema } from '@/features/auth/schemas/auth.schemas';
import { ValidationError } from '@/lib/errors';
import { handleApiError, successResponse } from '@/lib/errors/handler';
import { getCookieSettings } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError('Invalid input', { errors: result.error.flatten() });
    }

    const { token, user } = await register(result.data);

    const response = successResponse({ user }, 201);
    const cookieOptions = getCookieSettings();
    
    response.cookies.set(cookieOptions.name, token, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    logger.info({ userId: user.id }, 'User registered');
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
