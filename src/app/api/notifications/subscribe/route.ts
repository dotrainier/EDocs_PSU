import { NextRequest, NextResponse } from 'next/server';
import { connections } from '@/lib/notification-connections';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Store connection
      connections.set(userId, controller);

      // Send initial connection message
      controller.enqueue(
        new TextEncoder().encode(
          'data: {"type":"connected","message":"Connected to notifications"}\n\n',
        ),
      );

      // Send keep-alive every 30 seconds
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': keep-alive\n\n'));
        } catch {
          clearInterval(keepAliveInterval);
        }
      }, 30000);

      // Cleanup when connection closes
      return () => {
        clearInterval(keepAliveInterval);
        connections.delete(userId);
      };
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
