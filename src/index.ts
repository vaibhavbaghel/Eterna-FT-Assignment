import Fastify from 'fastify';
import websocketPlugin from '@fastify/websocket';
import { v4 as uuidv4 } from './utils/uuid';
import { orderQueue } from './queue/queue';
import { wsManager } from './wsManager';
import { db } from './db';
import { initDb } from './db';
import 'dotenv/config';
const fastify = Fastify({ logger: true });
fastify.register(websocketPlugin);

// POST /api/orders/execute validates and enqueues a market order and returns orderId
fastify.post('/api/orders/execute', async (request, reply) => {
  const body = request.body as any;
  if (!body || body.type !== 'market') {
    return reply.status(400).send({ error: 'Only market orders allowed for this assignment' });
  }
  const orderId = uuidv4();

  // minimal validation
  if (!body.side || !body.baseAsset || !body.quoteAsset || !body.amount) {
    return reply.status(400).send({ error: 'missing fields' });
  }

  // persist initial order
  await db.saveOrder({ orderId, request: body, status: 'pending' });

  // push to queue
  await orderQueue.add('order', { orderId, request: body });

  // return orderId
  return { orderId };
});

// WebSocket endpoint: client can connect here and send a JSON { orderId } as first message
fastify.get('/api/orders/ws', { websocket: true }, (connection /* SocketStream */, req) => {
  console.log(" WEBSOCKET UPGRADE SUCCESSFUL");
  const ws = connection.socket;
  ws.on('message', (msg: any) => {
    try {
      const payload = JSON.parse(String(msg));
      const { orderId } = payload;
      if (!orderId) {
        ws.send(JSON.stringify({ error: 'orderId required' }));
        return;
      }
      wsManager.register(orderId, ws);
      wsManager.setActive(orderId, { connectedAt: new Date().toISOString() });
      ws.send(JSON.stringify({ orderId, status: 'connected' }));
    } catch (err) {
      ws.send(JSON.stringify({ error: 'invalid json' }));
    }
  });
  ws.on('close', () => {
    // try to find registered order for this socket and clean up
    // for simplicity clients should send orderId on close
  });
});

const start = async () => {
  try {
    await initDb();
    const port = Number(process.env.PORT) || 3000;
    await fastify.listen({ port, host: "0.0.0.0" });
    fastify.log.info('Server listening on 3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
