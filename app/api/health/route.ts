import { NextResponse } from 'next/server';
import { db, sqlite } from '@/lib/db';

export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: Date.now(),
    database: { status: 'ok' },
  };

  try {
    // Verify database connection by running a simple query
    sqlite.prepare('SELECT 1').get();
  } catch (error) {
    checks.status = 'degraded';
    checks.database = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Database connection failed',
    };
  }

  return NextResponse.json(checks, {
    status: checks.status === 'ok' ? 200 : 503,
  });
}
