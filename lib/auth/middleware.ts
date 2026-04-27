import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, getAuthFromCookies } from './jwt';
import { UnauthorizedError } from '@/lib/errors';
import { handleApiError } from '@/lib/errors/handler';

export async function withAuth(
  request: NextRequest,
  handler: (userId: string, email: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const auth = await getAuthFromCookies();
  
  if (!auth) {
    return handleApiError(new UnauthorizedError());
  }

  return handler(auth.userId, auth.email);
}

export function withAuthSync(
  request: NextRequest,
  handler: (userId: string, email: string) => NextResponse | Promise<NextResponse>
): NextResponse | Promise<NextResponse> {
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    return handleApiError(new UnauthorizedError());
  }

  const auth = verifyJWT(token);
  
  if (!auth) {
    return handleApiError(new UnauthorizedError());
  }

  return handler(auth.userId, auth.email);
}
