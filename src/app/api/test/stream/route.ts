import { NextRequest } from 'next/server';
import { getTestEmitter, getTestMetrics, getTestLogs } from '@/lib/k6Manager';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const testId = request.nextUrl.searchParams.get('testId');

  if (!testId) {
    return new Response('testId is required', { status: 400 });
  }

  const emitter = getTestEmitter(testId);

  if (!emitter) {
    return new Response('Test not found', { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send current metrics immediately
      const currentMetrics = getTestMetrics(testId);
      if (currentMetrics) {
        controller.enqueue(
          encoder.encode(`event: metrics\ndata: ${JSON.stringify(currentMetrics)}\n\n`)
        );
      }

      // Send existing logs immediately
      const initialLogs = getTestLogs(testId);
      for (const log of initialLogs) {
        controller.enqueue(
          encoder.encode(`event: log\ndata: ${JSON.stringify(log)}\n\n`)
        );
      }

      const onMetrics = (data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: metrics\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch { /* stream closed */ }
      };

      const onLog = (data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: log\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch { /* stream closed */ }
      };

      const onDone = (data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: done\ndata: ${JSON.stringify(data)}\n\n`)
          );
          controller.close();
        } catch { /* stream closed */ }

        // Cleanup listeners
        emitter.off('metrics', onMetrics);
        emitter.off('log', onLog);
        emitter.off('done', onDone);
      };

      emitter.on('metrics', onMetrics);
      emitter.on('log', onLog);
      emitter.on('done', onDone);

      // Cleanup if stream is cancelled
      request.signal.addEventListener('abort', () => {
        emitter.off('metrics', onMetrics);
        emitter.off('log', onLog);
        emitter.off('done', onDone);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
