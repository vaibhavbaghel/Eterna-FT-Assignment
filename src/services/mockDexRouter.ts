import { Quote } from "../models";

function randDelay(minMs = 200, maxMs = 300) {
  return new Promise((res) => setTimeout(res, Math.random() * (maxMs - minMs) + minMs));
}

export class MockDexRouter {
  static async quote(dex: 'Raydium' | 'Meteora', amount: number): Promise<Quote> {
    await randDelay(180, 240);
    // basePrice is 100 by default; apply 2-5% variance
    const base = 100;
    const variance = 0.02 + Math.random() * 0.03; // 2-5%
    const sign = Math.random() < 0.5 ? -1 : 1;
    const price = base * (1 + sign * variance);
    return {
      dex,
      price,
      liquidity: 1000000 * (0.8 + Math.random() * 0.4),
    };
  }

  static async executeSwap(dex: string, amount: number): Promise<{ txHash: string; executedPrice: number }> {
    // simulate 2-3s execution
    await new Promise((res) => setTimeout(res, 2000 + Math.random() * 1000));
    const txHash = '0x' + Math.random().toString(16).slice(2, 18) + Date.now().toString(16);
    // executedPrice slightly varies from quoted
    const executedPrice = 100 * (1 + (Math.random() - 0.5) * 0.01);
    return { txHash, executedPrice };
  }
}
