import { Pool } from 'pg';
import { OrderRecord } from './models';

let pool: Pool | null = null;
let useMock = false;

const inMemoryOrders = new Map<string, OrderRecord>();
const inMemoryStatuses: Array<{ orderId: string; status: string; meta: any; ts: string }> = [];

export async function initDb() {
  let retries = 10;

  while (retries > 0) {
    try {
      pool = new Pool();
      await pool.query('SELECT 1');

      console.log("Connected to PostgreSQL");

      await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
          order_id TEXT PRIMARY KEY,
          payload JSONB,
          status TEXT,
          chosen_dex TEXT,
          executed_price NUMERIC,
          tx_hash TEXT,
          failure_reason TEXT,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS order_statuses (
          id SERIAL PRIMARY KEY,
          order_id TEXT REFERENCES orders(order_id),
          status TEXT,
          meta JSONB,
          ts TIMESTAMPTZ DEFAULT now()
        );
      `);

      return; // SUCCESS → exit initDb()

    } catch (err) {
      retries--;
      console.log(`Postgres not ready, retrying... (${10 - retries}/10)`);
      await new Promise(res => setTimeout(res, 2000)); // wait 2 seconds
    }
  }

  console.warn("Postgres not available after retries, using in-memory DB fallback");
  pool = null;
  useMock = true;
}


export async function saveOrder(record: OrderRecord) {
  if (useMock || !pool) {
    inMemoryOrders.set(record.orderId, { ...record, updatedAt: new Date().toISOString() });
    return;
  }

  await pool.query(
    `INSERT INTO orders(order_id, payload, status, chosen_dex, executed_price, tx_hash, failure_reason, created_at, updated_at)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (order_id) DO UPDATE SET payload = EXCLUDED.payload, status = EXCLUDED.status, chosen_dex = EXCLUDED.chosen_dex, executed_price = EXCLUDED.executed_price, tx_hash = EXCLUDED.tx_hash, failure_reason = EXCLUDED.failure_reason, updated_at = EXCLUDED.updated_at`,
    [
      record.orderId,
      record.request,
      record.status,
      record.chosenDex || null,
      record.executedPrice || null,
      record.txHash || null,
      record.failureReason || null,
      record.createdAt || new Date().toISOString(),
      new Date().toISOString(),
    ]
  );
}

export async function saveStatus(orderId: string, status: string, meta: any = {}) {
  if (useMock || !pool) {
    inMemoryStatuses.push({ orderId, status, meta, ts: new Date().toISOString() });
    return;
  }
  await pool.query(`INSERT INTO order_statuses(order_id, status, meta) VALUES($1,$2,$3)`, [orderId, status, meta]);
}

export const db = { initDb, saveOrder, saveStatus, __internal: { inMemoryOrders, inMemoryStatuses } };
