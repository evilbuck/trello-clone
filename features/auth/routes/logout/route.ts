
import { getCookieSettings } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST() {
  const cookieOptions = getCookieSettings();
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  
  const response = NextResponse.redirect(new URL('/login', `${protocol}://${host}`), 302);
  response.cookies.delete(cookieOptions.name);
  
  logger.info('User logged out');
  return response;
}
