import { DexRoutingService } from '../src/services/dexRoutingService';
import { Quote } from '../src/models';

describe('DexRoutingService', () => {
  test('priceWithFeesAndSlippage increases price by fee+slippage', async () => {
    const q: Quote = { dex: 'Raydium', price: 100, liquidity: 10000 };
    const eff = await (DexRoutingService as any).priceWithFeesAndSlippage(q, 0.01);
    expect(eff).toBeGreaterThan(100);
  });

  test('route selects a dex and returns effectivePrice', async () => {
    const request = { type: 'market', side: 'buy', baseAsset: 'COIN', quoteAsset: 'USD', amount: 10 } as any;
    const result = await DexRoutingService.route(request);
    expect(result.chosen).toBeDefined();
    expect(result.effectivePrice).toBeGreaterThan(0);
  });
});
