import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { processOrder } from '../processor';

const connection = new IORedis(process.env.REDIS_URL as string ?? "redis://redis:6379");

let bullQueue: Queue | null = null;
let inMemoryJobs: any[] = [];

// Try to initialize BullMQ queue if Redis available. If not, fall back to in-memory processing.
connection
  .ping()
  .then(() => {
    bullQueue = new Queue('orders', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });
  })
  .catch(() => {
    bullQueue = null;
  });

export const orderQueue = {
  add: async (name: string, data: any) => {
    if (bullQueue) {
      return bullQueue.add(name, data);
    }
    // fallback in-memory queue: process immediately in-process
    const job = { id: Date.now().toString(), name, data };
    inMemoryJobs.push(job);
    setImmediate(() => processOrder(data).catch(() => {}));
    return job as any;
  },
};

