import WebSocket from 'ws';
import IORedis from 'ioredis';

let redis: any = null;
try {
  redis = new IORedis(process.env.REDIS_URL as string ?? "redis://redis:6379");
  // try ping, but ignore if fails — we'll fallback
  redis.ping().catch(() => {
    redis = null;
  });
} catch {
  redis = null;
}

type SocketMap = Map<string, WebSocket>;

class WSManager {
  sockets: SocketMap = new Map();
  inMemoryActive: Map<string, any> = new Map();

  async setActive(orderId: string, meta: any) {
    if (redis) return redis.hset(`active:order:${orderId}`, meta as any);
    this.inMemoryActive.set(orderId, meta);
  }

  async clearActive(orderId: string) {
    if (redis) return redis.del(`active:order:${orderId}`);
    this.inMemoryActive.delete(orderId);
  }

  register(orderId: string, socket: WebSocket) {
    this.sockets.set(orderId, socket);
  }

  unregister(orderId: string) {
    this.sockets.delete(orderId);
  }

  send(orderId: string, payload: any) {
    const s = this.sockets.get(orderId);
    if (s && s.readyState === WebSocket.OPEN) {
      s.send(JSON.stringify(payload));
    }
  }
}

export const wsManager = new WSManager();
