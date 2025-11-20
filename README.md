# Crypto Trading Backend — Market Order Implementation

This project implements a mock crypto trading backend (assignment) using Node.js + TypeScript, Fastify, BullMQ + Redis, and PostgreSQL.

- Why Market Order?
Market orders execute immediately at the best available price.
This keeps the flow simple and allows the system to demonstrate:
- DEX routing
- slippage protection
- execution simulation
- WebSocket lifecycle events

- How this engine can be extended:
Limit orders can be added by introducing background price monitoring and triggering execution when the limit price is reached.
Sniper orders can be added by monitoring token launch or liquidity events and triggering execution when initialization occurs.
Features
- POST `/api/orders/execute` — validate request and return `orderId` (market orders only).
- WebSocket `/api/orders/ws` — connect and send `{ "orderId": "..." }` to receive lifecycle updates: `pending → routing → building → submitted → confirmed` or `failed`.
- `MockDexRouter` — returns Raydium and Meteora quotes with 200ms delay and 2–5% variance; `executeSwap()` simulates 2–3s execution and returns mock `txHash`.
- `DexRoutingService` — fetches both quotes in parallel, applies fee/slippage, and chooses best DEX.
- Queue worker (BullMQ) processes orders with concurrency 10 and default attempts 3 with exponential backoff.
- PostgreSQL persistence for orders and status timeline; Redis used for active order state and WS mapping.

Run (local dev)

1. Install dependencies:
```
npm install
```

2. Start Redis and PostgreSQL locally.

3. Run in dev:
```
npm run dev
```

Testing
```
npm test
```

Notes
- For brevity many resources (Redis, Postgres) are assumed available at defaults. Tests mock external dependencies where appropriate.
