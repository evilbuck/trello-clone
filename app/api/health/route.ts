import { NextResponse } from 'next/server';

// Simple health check - doesn't require database
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: Date.now(),
  });
}
