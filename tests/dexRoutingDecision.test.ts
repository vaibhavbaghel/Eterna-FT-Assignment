import { DexRoutingService } from '../src/services/dexRoutingService';
import * as mockRouter from '../src/services/mockDexRouter';

describe('DexRouting decision tests (mocked)', () => {
  const spyQuote = jest.spyOn(mockRouter.MockDexRouter, 'quote');

  afterEach(() => {
    spyQuote.mockReset();
  });

  test('chooses lower effective price (Raydium better)', async () => {
    spyQuote.mockImplementationOnce(async () => ({ dex: 'Raydium', price: 100, liquidity: 1000 } as any));
    spyQuote.mockImplementationOnce(async () => ({ dex: 'Meteora', price: 105, liquidity: 1000 } as any));
    const result = await DexRoutingService.route({ type: 'market' } as any);
    expect(result.chosen.dex).toBe('Raydium');
  });

  test('chooses Meteora when it has better effective price', async () => {
    spyQuote.mockImplementationOnce(async () => ({ dex: 'Raydium', price: 110, liquidity: 1000 } as any));
    spyQuote.mockImplementationOnce(async () => ({ dex: 'Meteora', price: 100, liquidity: 1000 } as any));
    const result = await DexRoutingService.route({ type: 'market' } as any);
    expect(result.chosen.dex).toBe('Meteora');
  });

  test('effectivePrice accounts for fees+slippage', async () => {
    const q = { dex: 'Raydium', price: 100, liquidity: 1000 } as any;
    const eff = await (DexRoutingService as any).priceWithFeesAndSlippage(q, 0.01);
    expect(eff).toBeCloseTo(100 * (1 + 0.003 + 0.01));
  });
});
