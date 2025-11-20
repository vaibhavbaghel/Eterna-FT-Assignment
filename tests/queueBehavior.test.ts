import { orderQueue } from '../src/queue/queue';

describe('Queue behavior', () => {
  test('can add a job to the queue', async () => {
    const job = await orderQueue.add('test-job', { foo: 'bar' });
    expect(job).toBeDefined();
    await job.remove();
  });
});
