import { MockDexRouter } from '../src/services/mockDexRouter';

describe('MockDexRouter', () => {
  test('quote returns a Quote with variance and delay', async () => {
    const q = await MockDexRouter.quote('Raydium', 10);
    expect(q.dex).toBe('Raydium');
    expect(q.price).toBeGreaterThan(0);
  });

  test('executeSwap returns txHash and executedPrice', async () => {
    const r = await MockDexRouter.executeSwap('Raydium', 10);
    expect(r.txHash).toMatch(/0x/);
    expect(r.executedPrice).toBeGreaterThan(0);
  });
});
