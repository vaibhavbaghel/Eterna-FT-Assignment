import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { processOrder } from './processor';

const connection = new IORedis(process.env.REDIS_URL as string ?? "redis://redis:6379");

export const worker = new Worker('orders', async (job) => processOrder(job.data), {
  connection,
  concurrency: 10,
});
