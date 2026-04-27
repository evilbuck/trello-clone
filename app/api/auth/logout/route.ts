import { getCookieSettings } from '@/lib/auth/jwt';
import { noContentResponse } from '@/lib/errors/handler';
import { logger } from '@/lib/logger';

export async function POST() {
  const cookieOptions = getCookieSettings();
  
  const response = noContentResponse();
  response.cookies.delete(cookieOptions.name);
  
  logger.info('User logged out');
  return response;
}
