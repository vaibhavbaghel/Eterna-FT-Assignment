export type OrderType = 'market' | 'limit' | 'sniper';

export interface OrderRequest {
  type: OrderType;
  side: 'buy' | 'sell';
  baseAsset: string;
  quoteAsset: string;
  amount: number; // base amount
  slippagePct?: number; // optional slippage protection
}

export interface Quote {
  dex: string;
  price: number; // price per base in quoteAsset
  liquidity: number;
}

export interface OrderRecord {
  orderId: string;
  request: OrderRequest;
  status: string;
  chosenDex?: string;
  executedPrice?: number;
  txHash?: string;
  failureReason?: string;
  createdAt?: string;
  updatedAt?: string;
}
