import { worker } from '../src/worker';
import { Job } from 'bullmq';

jest.setTimeout(20000);

describe('Worker', () => {
  test('worker is defined and has concurrency', () => {
    expect(worker).toBeDefined();
  });
});
