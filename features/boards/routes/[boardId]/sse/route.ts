import { NextRequest, NextResponse } from 'next/server';
import { createSSEStream } from '@/lib/sse';
import { withAuth } from '@/lib/auth/middleware';
import { getBoardWithData } from '@/features/boards/services/board.service';
import { handleApiError } from '@/lib/errors/handler';

type Params = Promise<{ boardId: string }>;

export async function GET(request: NextRequest, { params }: { request: NextRequest; params: Params }) {
  return withAuth(request, async (userId) => {
    try {
      const { boardId } = await params;
      
      // Verify user has access to this board
      await getBoardWithData(boardId, userId);

      const stream = createSSEStream(boardId);

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}
