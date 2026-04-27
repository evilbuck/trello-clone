import { NextResponse } from 'next/server';
import { AppError, formatError } from './index';
import { logger } from '../logger';

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: formatError(error) },
      { status: error.statusCode }
    );
  }

  // Log unexpected errors
  logger.error(error, 'Unexpected API error');

  return NextResponse.json(
    { error: formatError(error) },
    { status: 500 }
  );
}

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
