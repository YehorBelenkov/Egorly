import { NextRequest } from 'next/server';
import { getScraperInstance } from '@/lib/scraper/instance';

let clients: Set<ReadableStreamDefaultController> = new Set();
let callbacksInitialized = false;

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);

      // Setup scraper event callbacks once
      if (!callbacksInitialized) {
        try {
          const scraperInstance = getScraperInstance();

          scraperInstance.setEventCallbacks({
            onConnect: (data: any) => {
              broadcast({
                type: 'connect',
                message: `✅ Connected to @${data.username}'s live stream!`,
                data
              });
            },
            onDisconnect: () => {
              broadcast({
                type: 'disconnect',
                message: '🔌 Disconnected from live stream'
              });
            },
            onError: (error: any) => {
              broadcast({
                type: 'error',
                message: `❌ Error: ${error.message || 'Unknown error'}`
              });
            },
            onEvent: (event: any) => {
              let message = '';
              switch (event.type) {
                case 'gift':
                  message = `🎁 ${event.username} sent ${event.giftName} (${event.value} diamonds)`;
                  break;
                case 'follow':
                  message = `✅ ${event.username} followed!`;
                  break;
                case 'like':
                  message = `❤️ ${event.username} sent ${event.count} like(s)`;
                  break;
                case 'comment':
                  message = `💬 ${event.username}: "${event.comment}"`;
                  break;
                case 'share':
                  message = `🔄 ${event.username} shared the stream!`;
                  break;
              }
              broadcast({
                type: event.type,
                username: event.username,
                message,
                details: event
              });
            }
          });

          callbacksInitialized = true;
        } catch (error) {
          console.error('Failed to initialize scraper callbacks:', error);
        }
      }

      // Keep connection alive
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
        } catch (error) {
          clearInterval(keepAlive);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        clients.delete(controller);
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

function broadcast(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach((controller) => {
    try {
      controller.enqueue(message);
    } catch (error) {
      clients.delete(controller);
    }
  });
}
