import { MockDexRouter } from './mockDexRouter';
import { Quote, OrderRequest } from '../models';

export class DexRoutingService {
  // fetch both quotes in parallel and choose best effective price
  static feePct = 0.003; // 0.3% fee assumed

  static async priceWithFeesAndSlippage(q: Quote, slippagePct = 0.005): Promise<number> {
    // effective price = quoted price * (1 + fee + slippage)
    return q.price * (1 + DexRoutingService.feePct + slippagePct);
  }

  static async route(request: OrderRequest): Promise<{ chosen: Quote; other: Quote; effectivePrice: number }> {
    const [rQ, mQ] = await Promise.all([
      MockDexRouter.quote('Raydium', request.amount),
      MockDexRouter.quote('Meteora', request.amount),
    ]);

    const slippage = request.slippagePct ?? 0.005; // default 0.5%
    const rEff = await DexRoutingService.priceWithFeesAndSlippage(rQ, slippage);
    const mEff = await DexRoutingService.priceWithFeesAndSlippage(mQ, slippage);

    const chosen = rEff <= mEff ? rQ : mQ;
    const other = chosen === rQ ? mQ : rQ;
    const effectivePrice = Math.min(rEff, mEff);

    // log decision
    console.log(`Routing: chosen=${chosen.dex} price=${chosen.price.toFixed(4)} eff=${effectivePrice.toFixed(6)}`);

    return { chosen, other, effectivePrice };
  }
}
