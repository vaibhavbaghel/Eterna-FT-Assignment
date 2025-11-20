import { DexRoutingService } from './services/dexRoutingService';
import { MockDexRouter } from './services/mockDexRouter';
import { wsManager } from './wsManager';
import { db } from './db';

export async function processOrder(jobData: any) {
  const { orderId, request } = jobData as any;

  const emit = (status: string, meta: any = {}) => {
    wsManager.send(orderId, { orderId, status, meta });
    db.saveStatus(orderId, status, meta).catch(() => {});
  };

  try {
    emit('pending');
    emit('routing');
    const { chosen, effectivePrice } = await DexRoutingService.route(request);
    emit('building', { chosen: chosen.dex, quotedPrice: chosen.price });

    emit('submitted');
    const exec = await MockDexRouter.executeSwap(chosen.dex, request.amount);
    emit('confirmed', { txHash: exec.txHash, executedPrice: exec.executedPrice });

    await db.saveOrder({
      orderId,
      request,
      status: 'confirmed',
      chosenDex: chosen.dex,
      executedPrice: exec.executedPrice,
      txHash: exec.txHash,
    });
    await wsManager.clearActive(orderId);
  } catch (err: any) {
    const reason = err?.message || String(err);
    emit('failed', { reason });
    await db.saveOrder({ orderId, request, status: 'failed', failureReason: reason });
    throw err;
  }
}
