**Architecture**

This document describes the architecture of the crypto trading backend implemented in this repo.

**Overview**
- Purpose: accept market orders, route them to a best mock DEX, execute swaps (simulated), and stream lifecycle updates over WebSocket while persisting order history.
- Tech stack: `Node.js` + `TypeScript`, `Fastify` (HTTP + WebSocket), `BullMQ` + `Redis` (order queue & active-order mapping), `PostgreSQL` (order/history), `ioredis` (Redis client).

**High-level components**
- API Server (`src/index.ts`)
  - Exposes `POST /api/orders/execute` to accept and validate market orders and return an `orderId`.
  - Exposes `GET /api/orders/ws` (WebSocket) where clients connect and send `{ "orderId": "..." }` to receive status events for that order.
- WebSocket Manager (`src/wsManager.ts`)
  - Maps `orderId` → WebSocket connection for push updates.
  - Persists active-order metadata to Redis (or in-memory fallback when Redis is unavailable).
- Mock DEX Router (`src/services/mockDexRouter.ts`)
  - Returns mocked quotes for `Raydium` and `Meteora` with ~200ms delay and 2–5% variance.
  - `executeSwap()` simulates execution latency (2–3s) and returns a mock `txHash` and executed price.
- Dex Routing Service (`src/services/dexRoutingService.ts`)
  - Requests both quotes in parallel, applies fees and slippage, computes effective prices, and selects the best DEX. Logs the decision.
- Queue (`src/queue/queue.ts`) and Worker (`src/worker.ts`)
  - Normal mode: `BullMQ` queue backed by Redis; worker processes jobs with concurrency = 10 and default retry (3 attempts, exponential backoff).
  - Fallback mode: if Redis is not available during development, the queue falls back to an in-process handler that calls the shared `processOrder` directly.
- Processor (`src/processor.ts`)
  - Centralized job processing logic used by both the Bull worker and the in-memory fallback. Emits lifecycle statuses and persists results.
- Persistence (`src/db.ts`)
  - Primary: PostgreSQL tables `orders` and `order_statuses` for records and status timelines.
  - Development fallback: in-memory maps/arrays if Postgres is unreachable (app logs a warning and continues).

**Order lifecycle & events**
- Status sequence (emitted over WS + persisted): `pending` → `routing` → `building` → `submitted` → `confirmed` (or `failed` with `failureReason`).
- Each lifecycle change is pushed to the connected WebSocket for that `orderId` and saved to `order_statuses` (or in-memory timeline when DB unavailable).

**Routing & execution details**
- Fee model: configurable constant (example uses 0.3% fee in `DexRoutingService`).
- Slippage protection: request can include `slippagePct`; used to compute effective price for routing and to gate execution in a real system (simulated here).
- Quote comparison: effective price = quoted price * (1 + fee + slippage). The lower effective price wins.

**Queue & retry policy**
- Concurrency: `10` worker concurrency (BullMQ worker config).
- Throughput target: design aim ~100 orders/min — concurrency and job duration (2–3s) are tuned in the mock to approach that target.
- Retries: exponential backoff, up to 3 attempts. On final failure the system records `failed` with the reason and emits a WS `failed` event.

**Data model (simplified)**
- `orders` table (or in-memory map): `order_id`, `payload` (request), `status`, `chosen_dex`, `executed_price`, `tx_hash`, `failure_reason`, `created_at`, `updated_at`.
- `order_statuses` table: timeline entries with `order_id`, `status`, `meta`, `ts`.

**Fault tolerance & fallbacks**
- Redis unavailable: queue falls back to in-memory processing and WS metadata stored in memory; the worker process does not use BullMQ in this mode.
- Postgres unavailable: order persistence and status timeline are stored in-memory and the app logs a warning.
- In-memory fallbacks are intended only for local development and tests — production should run with Redis/Postgres.

**Testing strategy**
- Unit tests cover: routing logic, price comparison, MockDexRouter behavior, WS manager, and queue add behavior (`tests/*.test.ts`).
- Integration-style tests can be added to run against live Redis/Postgres; current tests include deterministic mocks where appropriate.

**Environment & run notes**
- Defaults: code uses default `pg` and `ioredis` connection constructors (localhost). You can control Postgres using env vars: `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGPORT`.
- Development: the app will run without external Redis/Postgres using in-memory fallbacks (useful for the assignment if you don't need to run Docker).
- Start dev server:
  - `npm install`
  - `npm run dev`

**Files of interest**
- API & server: `src/index.ts`
- Processor: `src/processor.ts`
- Worker: `src/worker.ts`
- Queue wrapper: `src/queue/queue.ts`
- WebSocket manager: `src/wsManager.ts`
- Dex mocks & routing: `src/services/mockDexRouter.ts`, `src/services/dexRoutingService.ts`
- Persistence: `src/db.ts`

**Next improvements (optional)**
- Add configuration via `.env` and a config module to simplify connection strings.
- Add true HTTP connection upgrade pattern (upgrade same POST to WS) if required by the assignment spec.
- Add integration tests that start temporary Redis/Postgres instances for CI (not required if you prefer pure unit tests).

---
Last updated: 2025-11-19
